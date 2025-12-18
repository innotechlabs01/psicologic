// src/pages/api/users/reject.ts
import type { APIRoute } from 'astro';
import { rejectUser } from '../../../lib/turso/userControl';

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

    const success = await rejectUser(targetUserId, userId);

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