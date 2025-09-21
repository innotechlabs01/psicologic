// src/pages/api/users/reject.ts
import type { APIRoute } from 'astro';
import { rejectUser } from '../../../lib/supabase/userControl';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return new Response('Missing userId', { status: 400 });
    }

    // TODO: Verificar que el usuario actual sea admin
    const rejectedBy = 'current_admin_id'; // Reemplazar con ID del admin actual
    const success = await rejectUser(userId, rejectedBy);

    if (success) {
      return new Response(JSON.stringify({ message: 'Usuario rechazado' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response('Error rechazando usuario', { status: 500 });
    }
  } catch (error) {
    console.error('Error en reject API:', error);
    return new Response('Internal server error', { status: 500 });
  }
};