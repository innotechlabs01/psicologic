import { clerkMiddleware, createRouteMatcher } from "@clerk/astro/server";
import { isAdminRole, isClientRole } from "./lib/clerk/roles";
import { logAccess } from "./lib/supabase/logAccess";
import type { APIContext } from "astro";

function logUserAccess(context: APIContext<Record<string, any>, Record<string, string | undefined>>, userId: string, orgRole: string | undefined) {
  logAccess({
    userId,
    email: context.request.headers.get('email')?.toString(),
    role: orgRole,
    ip: context.request.headers.get('x-forwarded-for')?.toString(),
    route: context.request.url,
  });
}

export const onRequest = clerkMiddleware((auth, context) => {
  const isEntryPoint = createRouteMatcher(['/index']);
  const currentPath = new URL(context.request.url).pathname;
  const { redirectToSignIn, userId, orgRole } = auth();

  console.log("Paso por aqui: ", 9, userId, orgRole);

  if (!isEntryPoint(context.request)) return;

  console.log('25', !userId)
  if(!userId) {
    console.log("No hay usuario");
    return new Response('Redirigiendo a Index...', {
      status: 302,
      headers: {
        Location: '/index',
      },
    });
  }

  const isAdmin = isAdminRole(orgRole);
  console.log("currentPath:", currentPath !== '/dashboard');
  console.log('Current:', currentPath);

  if(isAdmin && currentPath !== '/dashboard') {
   logUserAccess(context, userId, orgRole);
   return new Response('Redirigiendo a dashboard...', {
      status: 302,
      headers: {
        Location: '/dashboard',
      },
    });
  }

  const isClient = isClientRole(orgRole);

  if(isClient && currentPath !== '/client') {
    
    logUserAccess(context, userId, orgRole);
    console.log("Redirigiendo a client");
    return new Response('Redirigiendo a client...', {
      status: 302,
      headers: {
        Location: '/client',
      },
    });
  }
  console.log('403', userId, orgRole);
  logUserAccess(context, userId, orgRole);
  return new Response('Redirigiendo a /...', {
    status: 403,
    headers: {
      Location: '/index',
    },
  });
});
