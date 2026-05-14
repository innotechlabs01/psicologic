import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/astro/server";
import { isAdminRole, isClientRole } from "./lib/clerk/roles";
import { createUserFromClerk, triggerUserAccessEvent } from "./pages/api/webhooks/clerk";
import type { APIContext } from "astro";
import { checkUserGameAccess } from "./utils/checkUserGameAccess";

import { createClient } from "@libsql/client";
import { handleUserWithoutRole, handleInsertUsersAdmin } from "./utils/utils";
import { checkUserPaymentAccess } from "./utils/chechUserPaymentAccess";

// ⚡️ Initialize Turso
const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN
});

async function getUserRole(userId: string): Promise<string> {
  try {
    const result = await client.execute(
      ` select role from usuarios where clerk_user_id = ?
      `, [userId]
    );

    if (!result.rows || result.rows.length === 0) {
      return Promise.resolve("");
    }

    return Promise.resolve(String(result.rows[0].role || ""));
  } catch (err) {
    console.error("❌ Exception getting role:", err);
    return Promise.reject("");
  }
}

function waitUntil(context: APIContext, promise: Promise<any>) {
  // @ts-ignore - Vercel/Cloudflare specific
  if (context.locals?.waitUntil) {
    // @ts-ignore
    context.locals.waitUntil(promise);
  } else if (import.meta.env.DEV) {
    promise.catch(e => console.error("Background task failed:", e));
  } else {
    promise.catch(e => console.error("Background task failed:", e));
  }
}

function asyncLogAccessEvent(
  context: APIContext,
  userId: string,
  orgRole: string | undefined,
  action: 'login' | 'logout' | 'access' | 'redirect' | 'denied',
  route: string,
  metadata?: Record<string, any>
) {
  const promise = triggerUserAccessEvent({
    userId,
    email: '',
    action,
    route,
    role: orgRole,
    ip: context.request.headers.get('x-forwarded-for')?.toString() ||
      context.clientAddress,
    userAgent: context.request.headers.get('user-agent')?.toString(),
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'middleware',
      ...metadata
    }
  }).catch(error => {
    console.warn('Error registrando evento (no crítico):', error?.message || error);
  });

  return promise;
}

function parseCookies(cookieHeader?: string) {
  return (cookieHeader || '').split(';').map(c => c.trim()).reduce<Record<string, string>>((acc, kv) => {
    if (!kv) return acc;
    const [k, ...vParts] = kv.split('=');
    const v = vParts.join('=');
    if (k && v !== undefined) acc[k] = decodeURIComponent(v);
    return acc;
  }, {});
}

function redirectToRoute(route: string, message: string, status: number = 302) {
  console.log(`🔄 REDIRECT: ${message} -> ${route} (Status: ${status})`);
  const encodedMessage = encodeURIComponent(message);
  const redirectUrl = message ? `${route}?message=${encodedMessage}` : route;
  return new Response(null, {
    status,
    headers: {
      Location: redirectUrl,
    },
  });
}

export const onRequest = clerkMiddleware(async (auth, context, next) => {

  const { userId, sessionId, orgRole } = auth();
  const currentPath = new URL(context.request.url).pathname;

  // ✅ PRIMERO: dejar pasar archivos estáticos, APIs y rutas públicas sin ningún check
  if (
    currentPath.startsWith('/api/') ||
    currentPath.startsWith('/_') ||
    currentPath.includes('.') ||
    currentPath === '/favicon.ico' ||
    currentPath === '/error' ||
    currentPath.startsWith('/agenda/meet') ||
    currentPath.startsWith('/agenda/confirm')
  ) {
    return next();
  }

  const cookies = parseCookies(context.request.headers.get('cookie') ?? '');
  const authSource = cookies['auth_source'];
  const isGameLogin = typeof authSource === 'string' && authSource.startsWith('game:');
  const gameId = isGameLogin ? authSource.split(':')[1] : null;

  // Redirigir a login si no hay sesión en rutas protegidas
  if (!userId && (
    currentPath.startsWith('/client') ||
    currentPath.startsWith('/dashboard') ||
    currentPath.startsWith('/admin') ||
    currentPath.startsWith('/agenda')
  )) {
    return redirectToRoute('/', 'Debes iniciar sesión');
  }

  // Página raíz sin sesión: pasar
  if (!userId && currentPath === '/') {
    return next();
  }

  // ⚡ Log de acceso
  waitUntil(context, asyncLogAccessEvent(
    context,
    userId ?? 'anonymous',
    'SIN_ROL',
    'access',
    currentPath,
    { sessionId, authenticated: true }
  ));

  // Validar acceso a juego
  if (isGameLogin && userId) {
    const allowed = await checkUserGameAccess(userId, gameId);
    if (!allowed) {
      waitUntil(context, asyncLogAccessEvent(
        context,
        userId ?? 'anonymous',
        orgRole ?? 'SIN_ROL',
        'denied',
        currentPath,
        { reason: 'game_access_denied', gameId }
      ));
      const res = redirectToRoute('/', 'No tienes acceso al juego');
      res.headers.set('Set-Cookie', 'auth_source=; Path=/; Max-Age=0;');
      return res;
    }
  }

  let newAssignedRole = "";

  const paymentCheckPromise = checkUserPaymentAccess(userId ?? "");
  let adminInsertPromise: Promise<void | string> = Promise.resolve();

  if (orgRole === "org:admin") {
    adminInsertPromise = handleInsertUsersAdmin(context, userId ?? "");
  }

  const [{ canAccess, daysRemaining, isExpired }] = await Promise.all([
    paymentCheckPromise,
    adminInsertPromise
  ]);

  if (!canAccess) {
    waitUntil(context, asyncLogAccessEvent(
      context,
      userId ?? 'anonymous',
      orgRole ?? 'SIN_ROL',
      'denied',
      currentPath,
      { reason: 'payment_required', daysRemaining, isExpired }
    ));

    if (isExpired) {
      return redirectToRoute('/', 'Su cuenta ha vencido. Por favor comuníquese con administración para habilitar su cuenta.');
    }
    return redirectToRoute('/', `Acceso restringido - por favor complete su pago (${daysRemaining} días restantes)`);
  }

  if (!orgRole) {
    newAssignedRole = await getUserRole(userId ?? "");

    if (!newAssignedRole) {
      newAssignedRole = await handleUserWithoutRole(context, userId ?? "", isGameLogin);
    }

    if (!newAssignedRole) {
      waitUntil(context, asyncLogAccessEvent(
        context,
        userId ?? 'anonymous',
        newAssignedRole,
        'denied',
        currentPath,
        { reason: 'role_assignment_failed' }
      ));
      return redirectToRoute('/index', 'Error asignando rol, por favor intente de nuevo');
    }
  } else {
    newAssignedRole = orgRole;
  }

  if (newAssignedRole === "org:admin") {
    if (currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin')) {
      return next();
    }

    waitUntil(context, asyncLogAccessEvent(
      context,
      userId ?? 'anonymous',
      newAssignedRole,
      'redirect',
      '/dashboard',
      { fromRoute: currentPath, targetRole: 'admin', role: newAssignedRole }
    ));
    return redirectToRoute('/dashboard', 'Redirigiendo a dashboard');
  }

  if (newAssignedRole === "org:client" || newAssignedRole === "org:moderator") {
    if (currentPath.startsWith('/client')) {
      return next();
    }

    console.log("🔄 Redirigiendo client a client");
    waitUntil(context, asyncLogAccessEvent(
      context,
      userId ?? 'anonymous',
      newAssignedRole,
      'redirect',
      '/client',
      { fromRoute: currentPath, targetRole: 'client', role: newAssignedRole }
    ));
    return redirectToRoute('/client', 'Redirigiendo a client');
  }

  // Rol no reconocido
  waitUntil(context, asyncLogAccessEvent(
    context,
    userId ?? 'anonymous',
    newAssignedRole,
    'denied',
    currentPath,
    { reason: 'unrecognized_role', role: newAssignedRole }
  ));
  return redirectToRoute('/', 'Rol de usuario no válido');
});