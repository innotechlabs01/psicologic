import { clerkMiddleware, createRouteMatcher } from "@clerk/astro/server";
import { isAdminRole, isClientRole } from "./lib/clerk/roles";
import { triggerUserAccessEvent } from "./pages/api/webhooks/clerk";
import type { APIContext } from "astro";

// 🔗 FUNCIÓN PARA REGISTRAR EVENTOS DE ACCESO (fire and forget)
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
  const currentPath = new URL(context.request.url).pathname;
  let { userId, orgRole, sessionId } = auth();
  
  // Convert orgRole null to undefined to fix TypeScript error
  const normalizedOrgRole: string | undefined = orgRole ?? undefined;

  console.log("\n" + "=".repeat(50));
  console.log("🚀 MIDDLEWARE CLERK");
  console.log(`📍 Ruta: ${currentPath}`);
  console.log(`👤 User ID: ${userId || 'NO AUTENTICADO'}`);
  console.log(`🏷️  Org Role: ${normalizedOrgRole || 'SIN ROL'}`);
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
  
  // Check if role was recently assigned
  const url = new URL(context.request.url);
  const roleAssigned = url.searchParams.get('role_assigned') === 'true';

  // ========================================
  // CASO 1: Usuario NO autenticado
  // ========================================
  if (!userId) {
    console.log("🚫 Usuario NO autenticado");
    
    if (isProtectedRoute) {
      console.log("   🔒 Intentando acceder a ruta protegida");
      console.log("   🔄 Redirigiendo a /index");

      // 🔗 Registrar intento de acceso no autorizado
      logAccessEvent(
        context,
        'anonymous',
        undefined,
        'denied',
        currentPath,
        { reason: 'not_authenticated', attemptedRoute: currentPath }
      );
      
      return redirectToRoute('/index', 'Debe iniciar sesión');
    }
    
    console.log("   ✅ Acceso permitido a ruta pública");
    return; // Permitir acceso a rutas públicas
  }
  
  // ========================================
  // CASO 2: Usuario SÍ autenticado
  // ========================================
  console.log("✅ Usuario autenticado");

  // ========================================
  // CASO ESPECIAL: Usuario sin rol definido
  // ========================================
  if ((normalizedOrgRole === undefined || normalizedOrgRole === null) && !roleAssigned) {
    console.log("⚠️ Usuario sin rol definido");
    console.log(`   📄 Rol actual: ${normalizedOrgRole}`);
    console.log(`   🔄 Redirigiendo para procesamiento async...`);
    
    // Registrar intento de procesamiento
    logAccessEvent(
      context,
      userId,
      normalizedOrgRole,
      'redirect',
      currentPath,
      { 
        reason: 'no_role_assigned',
        targetEndpoint: '/api/process-user-role',
        originalRoute: currentPath
      }
    );
    
    // Redirigir al endpoint de procesamiento con returnTo
    return redirectToRoute(
      `/api/process-user-role?userId=${userId}&returnTo=${encodeURIComponent(currentPath)}`,
      'Configurando usuario...'
    );
  }

  // If role was just assigned, redirect based on role
  if (roleAssigned) {
    console.log("✅ Rol recientemente asignado - redirigiendo según rol");
    
    const isAdmin = isAdminRole(normalizedOrgRole);
    const isClient = isClientRole(normalizedOrgRole);
    
    console.log(`   👑 Es Admin: ${isAdmin}`);
    console.log(`   👤 Es Client: ${isClient}`);
    
    if (isAdmin) {
      console.log("   🔄 Redirigiendo admin a dashboard");
      logAccessEvent(
        context,
        userId,
        normalizedOrgRole,
        'redirect',
        '/dashboard',
        { fromRoute: currentPath, targetRole: 'admin' }
      );
      return redirectToRoute('/dashboard', 'Redirigiendo a dashboard...');
    } else if (isClient) {
      console.log("   🔄 Redirigiendo cliente a client");
      logAccessEvent(
        context,
        userId,
        normalizedOrgRole,
        'redirect',
        '/client',
        { fromRoute: currentPath, targetRole: 'client' }
      );
      return redirectToRoute('/client', 'Redirigiendo a client...');
    } else {
      console.log("   ⚠️  Usuario con rol no válido");
      console.log(`   🏷️  Rol actual: ${normalizedOrgRole}`);
      logAccessEvent(
        context,
        userId,
        normalizedOrgRole,
        'denied',
        currentPath,
        { 
          reason: 'invalid_role', 
          currentRole: normalizedOrgRole,
          expectedRoles: ['org:admin', 'org:client']
        }
      );
      return redirectToRoute('/index?error=invalid_role', 'Rol de usuario no válido');
    }
  }

  // 🔗 Registrar acceso de usuario autenticado
  logAccessEvent(
    context,
    userId,
    normalizedOrgRole,
    'access',
    currentPath,
    { sessionId, authenticated: true }
  );
  
  // Si está en ruta pública y ya está autenticado, redirigir según rol
  if (isPublicRoute && (currentPath === '/' || currentPath === '/index')) {
    console.log("🔄 Usuario autenticado en página pública - redirigiendo según rol");
    
    const isAdmin = isAdminRole(normalizedOrgRole);
    const isClient = isClientRole(normalizedOrgRole);
    
    console.log(`   👑 Es Admin: ${isAdmin}`);
    console.log(`   👤 Es Client: ${isClient}`);
    
    if (isAdmin) {
      console.log("   🔄 Redirigiendo admin a dashboard");
      logAccessEvent(
        context,
        userId,
        normalizedOrgRole,
        'redirect',
        '/dashboard',
        { fromRoute: currentPath, targetRole: 'admin' }
      );
      return redirectToRoute('/dashboard', 'Redirigiendo a dashboard...');
    } else if (isClient) {
      console.log("   🔄 Redirigiendo cliente a client");
      logAccessEvent(
        context,
        userId,
        normalizedOrgRole,
        'redirect',
        '/client',
        { fromRoute: currentPath, targetRole: 'client' }
      );
      return redirectToRoute('/client', 'Redirigiendo a client...');
    } else {
      console.log("   ⚠️  Usuario con rol no válido - permanece en página actual");
      console.log(`   🏷️  Rol actual: ${normalizedOrgRole}`);
      logAccessEvent(
        context,
        userId,
        normalizedOrgRole,
        'denied',
        currentPath,
        { 
          reason: 'invalid_role', 
          currentRole: normalizedOrgRole,
          expectedRoles: ['org:admin', 'org:client']
        }
      );
      return redirectToRoute('/index?error=invalid_role', 'Rol de usuario no válido');
    }
  }
  
  // Si está accediendo a ruta protegida, verificar permisos
  if (isProtectedRoute) {
    console.log("🔒 Verificando acceso a ruta protegida");
    
    const isAdmin = isAdminRole(normalizedOrgRole);
    const isClient = isClientRole(normalizedOrgRole);
    
    console.log(`   👑 Es Admin: ${isAdmin}`);
    console.log(`   👤 Es Client: ${isClient}`);
    
    // Verificar acceso específico por ruta
    if (currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin')) {
      if (!isAdmin) {
        console.log("   ❌ No es admin - acceso denegado a dashboard/admin");
        logAccessEvent(
          context,
          userId,
          normalizedOrgRole,
          'denied',
          currentPath,
          { 
            reason: 'insufficient_privileges',
            requiredRole: 'admin',
            currentRole: normalizedOrgRole,
            attemptedArea: 'admin'
          }
        );
        return redirectToRoute('/client', 'Redirigiendo a área de cliente');
      }
      console.log("   ✅ Admin puede acceder a dashboard/admin");
    }
    
    if (currentPath.startsWith('/client')) {
      if (!isAdmin && !isClient) {
        console.log("   ❌ Sin rol válido - acceso denegado a client");
        logAccessEvent(
          context,
          userId,
          normalizedOrgRole,
          'denied',
          currentPath,
          { 
            reason: 'no_valid_role',
            requiredRoles: ['org:admin', 'org:client'],
            currentRole: normalizedOrgRole,
            attemptedArea: 'client'
          }
        );
        return redirectToRoute('/index?error=no_access', 'Sin permisos de acceso');
      }
      console.log("   ✅ Usuario puede acceder a área cliente");
    }
    
    // 🔗 Registrar acceso exitoso a ruta protegida
    logAccessEvent(
      context,
      userId,
      normalizedOrgRole,
      'access',
      currentPath,
      { 
        accessGranted: true,
        areaAccessed: currentPath.startsWith('/dashboard') ? 'admin' : 'client',
        userRole: normalizedOrgRole
      }
    );
    
    console.log("   ✅ Acceso concedido");
  }
  
  console.log("🎉 Procesamiento completado - permitiendo acceso");
  console.log("=".repeat(50) + "\n");
});