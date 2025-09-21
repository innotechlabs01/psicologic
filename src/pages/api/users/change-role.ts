// src/pages/api/users/change-role.ts
import type { APIRoute } from 'astro';
import { changeUserRole } from '../../../lib/supabase/userControl';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userId, newRole } = await request.json();
    
    if (!userId || !newRole) {
      return new Response('Missing userId or newRole', { status: 400 });
    }

    if (!['org:admin', 'org:members', 'org:client'].includes(newRole)) {
      return new Response('Invalid role', { status: 400 });
    }

    const changedBy = 'current_admin_id'; // Reemplazar con ID del admin actual
    const success = await changeUserRole(userId, newRole, changedBy);

    if (success) {
      return new Response(JSON.stringify({ message: 'Rol actualizado exitosamente' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response('Error cambiando rol', { status: 500 });
    }
  } catch (error) {
    console.error('Error en change-role API:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
