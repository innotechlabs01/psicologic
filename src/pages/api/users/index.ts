import type { APIRoute } from 'astro';
import { getPendingUsers } from '../../../lib/turso/userControl';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const { userId } = locals.auth();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const users = await getPendingUsers();
    
    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
