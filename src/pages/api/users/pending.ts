// src/pages/api/users/suspend.ts
import type { APIRoute } from 'astro';
import { suspendUser } from '../../../lib/supabase/userControl';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return new Response('Missing userId', { status: 400 });
    }

    const suspendedBy = 'current_admin_id'; // Reemplazar con ID del admin actual
    const success = await suspendUser(userId, suspendedBy);

    if (success) {
      return new Response(JSON.stringify({ message: 'Usuario suspendido' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response('Error suspendiendo usuario', { status: 500 });
    }
  } catch (error) {
    console.error('Error en suspend API:', error);
    return new Response('Internal server error', { status: 500 });
  }
};