// src/pages/api/users/approve.ts
import type { APIRoute } from 'astro';
import { approveUser } from '../../../lib/supabase/userControl';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return new Response('Missing userId', { status: 400 });
    }

    // TODO: Verificar que el usuario actual sea admin
    // const currentUser = await getCurrentUser(request);
    // if (!isAdmin(currentUser)) {
    //   return new Response('Unauthorized', { status: 403 });
    // }

    const approvedBy = 'current_admin_id'; // Reemplazar con ID del admin actual
    const success = await approveUser(userId, approvedBy);

    if (success) {
      return new Response(JSON.stringify({ message: 'Usuario aprobado exitosamente' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response('Error aprobando usuario', { status: 500 });
    }
  } catch (error) {
    console.error('Error en approve API:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
