import type { APIRoute } from 'astro';
import { getActiveTickets, getUserByClerkId } from '../../../../lib/services/chat-service';

export const GET: APIRoute = async (context) => {
  try {
    const { userId } = context.locals.auth();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    const isAgent = user.role === 'agente_soporte' || user.role === 'org:admin';
    
    if (!isAgent) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const tickets = await getActiveTickets();

    return new Response(JSON.stringify({ tickets }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
