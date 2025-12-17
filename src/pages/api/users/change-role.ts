// src/pages/api/users/change-role.ts
import type { APIRoute } from 'astro';
import { changeUserRole } from '../../../lib/turso/userControl';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { userId: targetUserId, newRole } = await request.json();
    const { userId, orgRole } = locals.auth();

    if (!userId || orgRole !== 'org:admin') {
      return new Response('Unauthorized - Admin access required', { status: 403 });
    }

    if (!targetUserId || !newRole) {
      return new Response('Missing userId or newRole', { status: 400 });
    }

    if (!['org:admin', 'org:members', 'org:client'].includes(newRole)) {
      return new Response('Invalid role', { status: 400 });
    }

    const success = await changeUserRole(targetUserId, newRole, userId);

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
