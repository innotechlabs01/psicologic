import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/astro/server";
import { isAdminRole, isClientRole } from "./lib/clerk/roles";
import { createUserFromClerk, triggerUserAccessEvent } from "./pages/api/webhooks/clerk";
import type { APIContext } from "astro";

import { createClient } from "@supabase/supabase-js";

// ⚡️ Initialize Supabase
const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to get role by userId
function getUserRole(userId: string): Promise<string> {
  return Promise.resolve(supabase
    .from("usuarios")
    .select("role")          // only fetch the role field
    .eq("clerk_user_id", userId)        // filter by userId
    .single()                // expect only 1 row
    .then(({ data, error }) => {
      if (error || !data) {
        return "org:client"; // fallback role
      }
      return data.role as string; // return the value
    })
  ).catch(err => {
    console.error("❌ Error getting role:", err);
    return ""; // fallback role
  });
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

// 🆕 FUNCIÓN PARA MANEJAR USUARIOS SIN ROL
function handleUserWithoutRole(
  context: APIContext,
  userId: string
): Promise<string> {

  return clerkClient(context).users.getUser(userId)
    .then(clerkUser => {
      if (!clerkUser) {
        return "org:client"; // default
      }

      // Crear usuario en nuestra base de datos
      return createUserFromClerk({
        id: clerkUser.id,
        email_addresses: clerkUser.emailAddresses.map(email => ({
          email_address: email.emailAddress,
          verification: {
            status: email.verification?.status || "unverified"
          }
        })),
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
        username: clerkUser.username,
        image_url: clerkUser.imageUrl,
        created_at: clerkUser.createdAt || Date.now(),
        updated_at: clerkUser.updatedAt || Date.now(),
        public_metadata: clerkUser.publicMetadata || {},
        private_metadata: clerkUser.privateMetadata || {},
        unsafe_metadata: clerkUser.unsafeMetadata || {}
      })
      .then(createdUser => {
        if (createdUser) {
          console.log("✅ Usuario creado/actualizado correctamente");
          return clerkClient(context).users.updateUser(userId, {
            publicMetadata: {
              ...clerkUser.publicMetadata,
              role: "org:client"
            }
          })
          .then(() => {
            return "org:client";
          })
          .catch(roleError => {
            return "org:client"; // fallback
          });
        }
        return "org:client"; // fallback
      });
    })
    .catch(error => {
      return "org:client"; // fallback
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
    currentPath === '/dashboard' || currentPath === '/client') {
    return; // Permitir acceso sin procesar
  }

  // Omitir archivos estáticos y APIs
  if (currentPath.startsWith('/api/') || 
      currentPath.startsWith('/_') || 
      currentPath.includes('.') ||
      currentPath === '/favicon.ico') {
    console.log("⚡ Omitiendo archivo estático/API");
    return;
  }

  if (!userId) {
    return redirectToRoute('/', 'Debes iniciar sesión');
  }

  // 🔗 Registrar acceso de usuario autenticado
  logAccessEvent(
    context,
    userId,
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
      newAssignedRole = await getUserRole(userId);

      if (!newAssignedRole) {
        newAssignedRole = await handleUserWithoutRole(context, userId);
      }

      if (!newAssignedRole) {
        logAccessEvent(
          context,
          userId,
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
        userId,
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
        userId,
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
      userId,
      newAssignedRole,
      'denied',
      currentPath,
      { reason: 'unrecognized_role', role: newAssignedRole }
    );
    return redirectToRoute('/', 'Rol de usuario no válido');
  })();
});
