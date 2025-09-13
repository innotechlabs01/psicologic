import { clerkMiddleware, createRouteMatcher } from "@clerk/astro/server";
import { isAdminRole, isClientRole } from "./lib/clerk/roles";
import { logAccess } from "./lib/supabase/logAccess";
import type { APIContext } from "astro";

function logUserAccess(
  context: APIContext<Record<string, any>, Record<string, string | undefined>>, 
  userId: string, 
  orgRole: string | undefined
) {
  logAccess({
    userId,
    email: context.request.headers.get('email')?.toString(),
    role: orgRole,
    ip: context.request.headers.get('x-forwarded-for')?.toString(),
    route: context.request.url,
  });
}

function redirectToRoute(route: string, message: string, status: number = 302) {
  console.log(`🔄 REDIRECT: ${message} -> ${route} (Status: ${status})`);
  return new Response(message, {
    status,
    headers: {
      Location: route,
    },
  });
}

export const onRequest = clerkMiddleware((auth, context) => {
  const currentPath = new URL(context.request.url).pathname;
  const { userId, orgRole, sessionId } = auth();
  
  console.log("\n" + "=".repeat(50));
  console.log("🚀 MIDDLEWARE CLERK");
  console.log(`📍 Ruta: ${currentPath}`);
  console.log(`👤 User ID: ${userId || 'NO AUTENTICADO'}`);
  console.log(`👤 Email: ${context.request.headers.get('email') || 'NO AUTENTICADO'}`);
  console.log(`🏷️  Org Role: ${orgRole || 'SIN ROL'}`);
  console.log(`🔑 Session: ${sessionId ? 'ACTIVA' : 'NO ACTIVA'}`);
  
  // Omitir archivos estáticos y APIs
  if (currentPath.startsWith('/api/') || 
      currentPath.startsWith('/_') || 
      currentPath.includes('.') ||
      currentPath === '/favicon.ico') {
    console.log("⚡ Omitiendo archivo estático/API");
    return;
  }
  
  // Rutas públicas que no necesitan autenticación
  const publicRoutes = createRouteMatcher([
    '/',
    '/index', 
    '/login',
    '/register',
    '/about',
    '/contact'
  ]);
  
  // Rutas protegidas que requieren autenticación
  const protectedRoutes = createRouteMatcher([
    '/dashboard',
    '/client',
    '/admin',
    '/profile',
    '/settings'
  ]);
  
  const isPublicRoute = publicRoutes(context.request);
  const isProtectedRoute = protectedRoutes(context.request);
  
  console.log(`🌐 Es ruta pública: ${isPublicRoute}`);
  console.log(`🔒 Es ruta protegida: ${isProtectedRoute}`);
  
  // ========================================
  // CASO 1: Usuario NO autenticado
  // ========================================
  if (!userId) {
    console.log("🚫 Usuario NO autenticado");
    
    if (isProtectedRoute) {
      console.log("   🔒 Intentando acceder a ruta protegida");
      console.log("   🔄 Redirigiendo a /index");
      return redirectToRoute('/index', 'Debe iniciar sesión');
    }
    
    console.log("   ✅ Acceso permitido a ruta pública");
    return; // Permitir acceso a rutas públicas
  }
  
  // ========================================
  // CASO 2: Usuario SÍ autenticado
  // ========================================
  console.log("✅ Usuario autenticado");
  
  // Si está en ruta pública y ya está autenticado, podría querer ir a su dashboard
  if (isPublicRoute && (currentPath === '/' || currentPath === '/index')) {
    console.log("🔄 Usuario autenticado en página pública - redirigiendo según rol");
    
    const isAdmin = isAdminRole(orgRole);
    const isClient = isClientRole(orgRole);
    
    console.log(`   👑 Es Admin: ${isAdmin}`);
    console.log(`   👤 Es Client: ${isClient}`);
    
    // Registrar acceso antes de redirigir
    logUserAccess(context, userId, orgRole);
    
    if (isAdmin) {
      console.log("   🔄 Redirigiendo admin a dashboard");
      return redirectToRoute('/dashboard', 'Redirigiendo a dashboard...');
    } else if (isClient) {
      console.log("   🔄 Redirigiendo cliente a client");
      return redirectToRoute('/client', 'Redirigiendo a client...');
    } else {
      console.log("   ⚠️  Usuario sin rol válido - permanece en página actual");
      console.log(`   🏷️  Rol actual: ${orgRole}`);
      // Opción: mostrar mensaje de que el rol no está configurado
      return redirectToRoute('/index?error=no_role', 'Rol no configurado');
    }
  }
  
  // Si está accediendo a ruta protegida, verificar permisos
  if (isProtectedRoute) {
    console.log("🔒 Verificando acceso a ruta protegida");
    
    const isAdmin = isAdminRole(orgRole);
    const isClient = isClientRole(orgRole);
    
    console.log(`   👑 Es Admin: ${isAdmin}`);
    console.log(`   👤 Es Client: ${isClient}`);
    
    // Verificar acceso específico por ruta
    if (currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin')) {
      if (!isAdmin) {
        console.log("   ❌ No es admin - acceso denegado a dashboard/admin");
        logUserAccess(context, userId, orgRole);
        return redirectToRoute('/client', 'Redirigiendo a área de cliente');
      }
      console.log("   ✅ Admin puede acceder a dashboard/admin");
    }
    
    if (currentPath.startsWith('/client')) {
      if (!isAdmin && !isClient) {
        console.log("   ❌ Sin rol válido - acceso denegado a client");
        logUserAccess(context, userId, orgRole);
        return redirectToRoute('/index?error=no_access', 'Sin permisos de acceso');
      }
      console.log("   ✅ Usuario puede acceder a área cliente");
    }
    
    // Registrar acceso exitoso
    logUserAccess(context, userId, orgRole);
    console.log("   ✅ Acceso concedido");
  }
  
  console.log("🎉 Procesamiento completado - permitiendo acceso");
  console.log("=".repeat(50) + "\n");
});