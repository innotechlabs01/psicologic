import type { APIContext, APIRoute } from 'astro';
import { getEventsByDateRange } from '../../../lib/turso/agenda/agenda-db';

export const GET: APIRoute = async (context: APIContext) => {
  try {
    const { userId } = context.locals.auth();

    if (!userId) {
      console.error('[API] No userId found in auth');
      return new Response(JSON.stringify({ error: 'Unauthorized', message: 'No user session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(context.request.url);
    const queryUserId = url.searchParams.get('userId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    console.log('[API] Request:', { queryUserId, startDate, endDate, authUserId: userId });


    if (queryUserId && queryUserId !== userId) {
      console.error('[API] User ID mismatch:', { queryUserId, authUserId: userId });
      return new Response(JSON.stringify({ error: 'Forbidden', message: 'User ID mismatch' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!startDate || !endDate) {
      console.error('[API] Missing dates:', { startDate, endDate });
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'startDate and endDate are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[API] Fetching appointments for:', { userId, startDate, endDate });
    const appointments = await getEventsByDateRange(startDate, endDate, userId);

    console.log('[API] Found appointments:', appointments.length);

    return new Response(JSON.stringify(appointments), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[API] Error fetching appointments:', { error: errorMessage, stack: error instanceof Error ? error.stack : undefined });

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
