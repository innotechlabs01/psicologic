import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/astro/server";
import { isAdminRole, isClientRole } from "./lib/clerk/roles";
import { createUserFromClerk, triggerUserAccessEvent } from "./pages/api/webhooks/clerk";
import type { APIContext } from "astro";

import { createClient } from "@libsql/client";
import { handleUserWithoutRole, handleInsertUsersAdmin } from "./utils/utils";
import { checkUserPaymentAccess } from "./utils/chechUserPaymentAccess";

// ⚡️ Initialize Turso
const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN
});

// Function to get role by userId
async function getUserRole(userId: string): Promise<string> {
  try {
    const result = await client.execute(
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

function logAccessEvent(
  context: APIContext,
  userId: string,
  orgRole: string | undefined,
  action: 'login' | 'logout' | 'access' | 'redirect' | 'denied',
  route: string,
  metadata?: Record<string, any>
) {
  // Fire and forget - no bloquear el middleware
  Promise.resolve().then(() => {
    return triggerUserAccessEvent({
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
    });
  }).catch(error => {
    // Logging silencioso para no afectar el middleware
    console.warn('Error registrando evento (no crítico):', error?.message || error);
  });
}

function redirectToRoute(route: string, message: string, status: number = 302) {
  console.log(`🔄 REDIRECT: ${message} -> ${route} (Status: ${status})`);
  return new Response(null, {
    status,
    headers: {
      Location: route,
    },
  });
}

export const onRequest = clerkMiddleware((auth, context, next) => {
  const { userId, sessionId, orgRole } = auth();
  const currentPath = new URL(context.request.url).pathname;

  if (!userId && (currentPath.startsWith('/client') || currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin'))) {
    return redirectToRoute('/', 'Debes iniciar sesión');
  }

  if ((!userId && currentPath === '/') || currentPath === '/error') {
    return next(); // Permitir acceso sin procesar a rutas publicas
  }

  if (currentPath === '/error') {
    return next();
  }

  // Omitir archivos estáticos y APIs
  if (currentPath.startsWith('/api/') ||
    currentPath.startsWith('/_') ||
    currentPath.includes('.') ||
    currentPath === '/favicon.ico') {
    console.log("⚡ Omitiendo archivo estático/API");
    return next();
  }

  // 🔗 Registrar acceso de usuario autenticado
  logAccessEvent(
    context,
    userId ?? 'anonymous',
    'SIN_ROL',
    'access',
    currentPath,
    { sessionId, authenticated: true }
  );

  // ✅ Usar la lógica async original pero retornando la promesa
  return (async () => {
    let newAssignedRole = "";

    // ----------------------------------------------------
    // 🚩 VALIDACIÓN DE PAGO (Acceso Restringido)
    // ----------------------------------------------------
    const { canAccess, daysRemaining } = await checkUserPaymentAccess(userId ?? "");

    if (!canAccess) {
      logAccessEvent(
        context,
        userId ?? 'anonymous',
        orgRole ?? 'SIN_ROL',
        'denied',
        currentPath,
        { reason: 'payment_required', daysRemaining }
      );
      return redirectToRoute('/', `Acceso restringido - por favor complete su pago (${daysRemaining} días restantes)`);
    }

    if (orgRole === "org:admin") {
      await handleInsertUsersAdmin(context, userId ?? "");
    }

    if (!orgRole) {
      // ✅ safely use await
      newAssignedRole = await getUserRole(userId ?? "");

      if (!newAssignedRole) {
        newAssignedRole = await handleUserWithoutRole(context, userId ?? "");
      }

      if (!newAssignedRole) {
        logAccessEvent(
          context,
          userId ?? 'anonymous',
          newAssignedRole,
          'denied',
          currentPath,
          { reason: 'role_assignment_failed' }
        );
        return redirectToRoute('/index', 'Error asignando rol, por favor intente de nuevo');
      }
    } else {
      newAssignedRole = orgRole;
    }


    if (newAssignedRole === "org:admin") {
      if (currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin')) {
        return next();
      }

      logAccessEvent(
        context,
        userId ?? 'anonymous',
        newAssignedRole,
        'redirect',
        '/dashboard',
        { fromRoute: currentPath, targetRole: 'admin', role: newAssignedRole }
      );
      return redirectToRoute('/dashboard', 'Redirigiendo a dashboard');
    }

    if (newAssignedRole === "org:client") {
      if (currentPath.startsWith('/client')) {
        return next();
      }

      console.log("🔄 Redirigiendo cliente a client");
      logAccessEvent(
        context,
        userId ?? 'anonymous',
        newAssignedRole,
        'redirect',
        '/client',
        { fromRoute: currentPath, targetRole: 'client', role: newAssignedRole }
      );
      return redirectToRoute('/client', 'Redirigiendo a client');
    }

    // Si llega aquí, rol no reconocido
    logAccessEvent(
      context,
      userId ?? 'anonymous',
      newAssignedRole,
      'denied',
      currentPath,
      { reason: 'unrecognized_role', role: newAssignedRole }
    );
    return redirectToRoute('/', 'Rol de usuario no válido');
  })();
});
