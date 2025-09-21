// src/pages/api/get-user-role.ts
import type { APIRoute } from 'astro';
import { clerkClient } from '@clerk/astro/server';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const context = { request, locals };
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'missing_user_id',
        role: null,
        success: false 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`🔍 API: Consultando rol para usuario ${userId}`);
    
    // Obtener información del usuario de Clerk con timeout
    const clerkUser = await Promise.race([
      clerkClient(context).users.getUser(userId),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Clerk API timeout')), 5000)
      )
    ]) as any;
    
    if (!clerkUser) {
      console.log(`❌ API: Usuario ${userId} no encontrado en Clerk`);
      return new Response(JSON.stringify({ 
        error: 'user_not_found',
        role: null,
        success: false 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extraer rol del publicMetadata
    const userRole = clerkUser.publicMetadata?.role;
    
    console.log(`✅ API: Usuario ${userId} tiene rol: ${userRole || 'sin rol'}`);
    console.log(`📝 API: publicMetadata completo:`, clerkUser.publicMetadata);
    
    // Si no tiene rol, asignar rol por defecto
    if (!userRole) {
      console.log(`🏷️ API: Asignando rol por defecto 'org:client' a ${userId}`);
      
      try {
        await clerkClient(context).users.updateUser(userId, {
          publicMetadata: {
            ...clerkUser.publicMetadata,
            role: 'org:client',
            roleAssignedAt: new Date().toISOString(),
            roleAssignedBy: 'system-api'
          }
        });
        
        console.log(`✅ API: Rol 'org:client' asignado exitosamente a ${userId}`);
        
        return new Response(JSON.stringify({
          success: true,
          role: 'org:client',
          assigned: true,
          message: 'Role assigned successfully'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (assignError: any) {
        console.error(`❌ API: Error asignando rol a ${userId}:`, assignError?.message);
        
        // Retornar rol por defecto aunque falle la asignación
        return new Response(JSON.stringify({
          success: true,
          role: 'org:client',
          assigned: false,
          warning: 'Role assignment failed, using default',
          error: assignError?.message
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Usuario ya tiene rol
    return new Response(JSON.stringify({
      success: true,
      role: userRole,
      assigned: false,
      message: 'Role already exists'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error(`💥 API: Error crítico consultando rol:`, error?.message);
    
    return new Response(JSON.stringify({
      success: false,
      role: null,
      error: error?.message || 'internal_server_error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async (context) => {
  return GET(context);
};