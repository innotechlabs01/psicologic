// src/pages/api/users/suspend.ts
import type { APIRoute } from 'astro';
import { suspendUser } from '../../../lib/turso/userControl';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { userId: targetUserId } = await request.json();
    const { userId, orgRole } = locals.auth();

    if (!userId || orgRole !== 'org:admin') {
      return new Response('Unauthorized - Admin access required', { status: 403 });
    }

    if (!targetUserId) {
      return new Response('Missing target userId', { status: 400 });
    }

    const success = await suspendUser(targetUserId, userId);

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