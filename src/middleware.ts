import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/astro/server";
import { isAdminRole, isClientRole } from "./lib/clerk/roles";
import { createUserFromClerk, triggerUserAccessEvent } from "./pages/api/webhooks/clerk";
import type { APIContext } from "astro";

import { createClient } from "@supabase/supabase-js";
import { handleUserWithoutRole } from "./utils/utils";

// ⚡️ Initialize Supabase
const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to get role by userId
async function getUserRole(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("role")          // only fetch the role field
      .eq("clerk_user_id", userId)        // filter by userId
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error buscando usuario:', error);
      throw new Error('Error al consultar el usuario');
    }

    return Promise.resolve(data?.role || "");
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

export const onRequest = clerkMiddleware((auth, context) => {
  const { userId, sessionId, orgRole } = auth();
  const currentPath = new URL(context.request.url).pathname;

  if ((!userId && currentPath === '/') || currentPath.startsWith('/dashboard/') || currentPath.startsWith('/client/') ||
    currentPath === '/dashboard' || currentPath === '/client' || currentPath === '/error') {
    return; // Permitir acceso sin procesar
  }

  if (currentPath === '/error') {
    return redirectToRoute('/error', 'Redirigiendo desde error');
  }

  // Omitir archivos estáticos y APIs
  if (currentPath.startsWith('/api/') || 
      currentPath.startsWith('/_') || 
      currentPath.includes('.') ||
      currentPath === '/favicon.ico') {
    console.log("⚡ Omitiendo archivo estático/API");
    return;
  }

  if (!userId && currentPath !== '/client' && currentPath !== '/index' && currentPath.startsWith('/client/') && currentPath === '/dashboard/') {
    return redirectToRoute('/', 'Debes iniciar sesión');
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


    if(newAssignedRole === "org:admin") {
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

    if(newAssignedRole === "org:client") {
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
