import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/astro/server";
import { isAdminRole, isClientRole } from "./lib/clerk/roles";
import { createUserFromClerk, triggerUserAccessEvent } from "./pages/api/webhooks/clerk";
import type { APIContext } from "astro";
import { checkUserGameAccess } from "./utils/checkUserGameAccess";

import { handleUserWithoutRole, handleInsertUsersAdmin } from "./utils/utils";
import { checkUserPaymentAccess } from "./utils/chechUserPaymentAccess";
import { db } from "./lib/turso/client";

// Function to get role by userId
async function getUserRole(userId: string): Promise<string> {
  try {
    const result = await db.execute(
      ` select role from usuarios where clerk_user_id = ?
      `, [userId]
    );

    if (!result.rows || result.rows.length === 0) {
      return Promise.resolve(""); // fallback role
    }

    return Promise.resolve(String(result.rows[0].role || ""));
  } catch (err) {
    console.error("❌ Exception getting role:", err);
    return Promise.reject(""); // fallback role
  }
}

// Helper to handle background tasks in serverless environments
function waitUntil(context: APIContext, promise: Promise<any>) {
  // @ts-ignore - Vercel/Cloudflare specific
  if (context.locals?.waitUntil) {
    // @ts-ignore
    context.locals.waitUntil(promise);
  } else if (import.meta.env.DEV) {
    // In dev, just let it run
    promise.catch(e => console.error("Background task failed:", e));
  } else {
    // Fallback: try to run it but it might be cancelled. 
    // For critical logs we might want to await, but for stats we skip.
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
  // Return the promise so it can be awaited IF NEEDED, but mostly we will pass it to waitUntil
  const promise = triggerUserAccessEvent({
    userId,
    email: '', // Se obtendrá en el webhook
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
    // Logging silencioso para no afectar el middleware
    console.warn('Error registrando evento (no crítico):', error?.message || error);
  });

  return promise;
}

// Helper: parse cookies from header into an object
function parseCookies(cookieHeader?: string) {
  return (cookieHeader || '').split(';').map(c => c.trim()).reduce<Record<string, string>>((acc, kv) => {
    if (!kv) return acc;
    const [k, ...vParts] = kv.split('=');
    const v = vParts.join('=');
    if (k && v !== undefined) acc[k] = decodeURIComponent(v);
    return acc;
  }, {});
}

function redirectToRoute(route: string, message: string, status: number = 302, errorType: string = 'info') {
  console.log(`🔄 REDIRECT: ${message} -> ${route} (Status: ${status})`);
  
  // Codificar el mensaje y tipo de error para pasar vía URL
  const separator = route.includes('?') ? '&' : '?';
  const errorUrl = `${route}${separator}error_msg=${encodeURIComponent(message)}&error_type=${encodeURIComponent(errorType)}`;
  
  return new Response(null, {
    status,
    headers: {
      Location: errorUrl,
    },
  });
}

export const onRequest = clerkMiddleware(async (auth, context, next) => {

  const { userId, sessionId, orgRole } = auth();
  const currentPath = new URL(context.request.url).pathname;

  const cookies = parseCookies(context.request.headers.get('cookie') ?? '');
  const authSource = cookies['auth_source'];
  const isGameLogin = typeof authSource === 'string' && authSource.startsWith('game:');
  const gameId = isGameLogin ? authSource.split(':')[1] : null;

  if (!userId && (currentPath.startsWith('/client') || currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin') || (currentPath.startsWith('/agenda') && !currentPath.startsWith('/agenda/meet')))) {
    return redirectToRoute('/', 'Debes iniciar sesión para acceder a esta sección', 302, 'warning');
  }

  if ((!userId && currentPath === '/') || currentPath === '/error' || currentPath.startsWith('/agenda/meet')) {
    return next();
  }

  if (currentPath === '/error') {
    return next();
  }

  // Omitir archivos estáticos y APIs
  if (currentPath.startsWith('/api/') ||
    currentPath.startsWith('/_') ||
    currentPath.includes('.') ||
    currentPath === '/favicon.ico') {
    return next();
  }

  // ⚡ PERFORMANCE OPTIMIZATION: Do not await logging
  waitUntil(context, asyncLogAccessEvent(
    context,
    userId ?? 'anonymous',
    'SIN_ROL',
    'access',
    currentPath,
    { sessionId, authenticated: true }
  ));

  // Si el flujo de login viene de un juego, y ya está autenticado, validar acceso al juego
  if (isGameLogin && userId) {
    const allowed = await checkUserGameAccess(userId, gameId);
    if (!allowed) {
      // Critical log: maybe await this one? Or just fire and return.
      // Since we are redirecting, we should try to ensure it runs, but for speed we will use waitUntil too.
      waitUntil(context, asyncLogAccessEvent(
        context,
        userId ?? 'anonymous',
        orgRole ?? 'SIN_ROL',
        'denied',
        currentPath,
        { reason: 'game_access_denied', gameId }
      ));
      const res = redirectToRoute('/', 'No tienes acceso a este juego. Contacta al administrador.', 302, 'error');
      res.headers.set('Set-Cookie', 'auth_source=; Path=/; Max-Age=0;');
      return res;
    }
  }

  let newAssignedRole = "";

  // ----------------------------------------------------
  // 🚩 VALIDACIÓN DE PAGO (Acceso Restringido)
  // ----------------------------------------------------
  // Optimization: Run checks in parallel if they don't depend on each other?
  // But InsertUsers depends on org:admin check? No.

  const paymentCheckPromise = checkUserPaymentAccess(userId ?? "");
  let adminInsertPromise: Promise<void | string> = Promise.resolve();

  if (orgRole === "org:admin") {
    adminInsertPromise = handleInsertUsersAdmin(context, userId ?? "");
  }

  const [{ canAccess, daysRemaining }] = await Promise.all([
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
      { reason: 'payment_required', daysRemaining }
    ));
    return redirectToRoute('/', `Tu suscripción ha vencido. Por favor completa tu pago para continuar (${daysRemaining} días restantes)`, 302, 'error');
  }

  // Note: handleInsertUsersAdmin was already awaited in parallel above if role is admin

  if (!orgRole) {
    // ✅ safely use await
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
      return redirectToRoute('/', 'Error al asignar tu rol. Por favor intenta de nuevo o contacta soporte.', 302, 'error');
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
    const res = redirectToRoute('/dashboard', 'Redirigiendo a tu panel de administrador', 302, 'info');

    return res;
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
    const resClient = redirectToRoute('/client', 'Redirigiendo a tu panel de cliente', 302, 'info');

    return resClient;
  }

  // Si llega aquí, rol no reconocido
  waitUntil(context, asyncLogAccessEvent(
    context,
    userId ?? 'anonymous',
    newAssignedRole,
    'denied',
    currentPath,
    { reason: 'unrecognized_role', role: newAssignedRole }
  ));
  const res = redirectToRoute('/', 'Tu rol de usuario no es válido. Contacta al administrador.', 302, 'error');

  return res;
});
