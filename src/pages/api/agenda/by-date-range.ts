import type { APIRoute } from 'astro';
import { getEventsByDateRange } from '../../../lib/turso/agenda/agenda-db';
import { getSiteUrl } from '../../../lib/site-url';


export const GET: APIRoute = async ({ request, url, locals }) => {
  try {
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');

    if (!start || !end) {
      return new Response(JSON.stringify({ error: 'Missing start or end date' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 🔒 AUTH CHECK: Get logged-in user
    const { userId, orgRole } = locals.auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch events in the date range
    const events = await getEventsByDateRange(start, end, userId);

    // Group events by day of week (0=Domingo, 1=Lunes, ..., 6=Sábado)
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayCounts: Record<string, number> = {};

    for (let i = 0; i < 7; i++) {
      dayNames[i] = dayNames[i]; // keep typed
      dayCounts[dayNames[i]] = 0;
    }

    events.forEach((event: any) => {
      if (event.status !== 'cancelled') {
        const eventDate = new Date(event.date);
        const dayIdx = eventDate.getDay();
        const dayName = dayNames[dayIdx];
        dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
      }
    });

    // Ordenar: Lun a Dom (omitir Domingo al inicio, o mantener como primer día)
    const orderedDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const result = orderedDays.map(day => dayCounts[day] || 0);

    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching agenda by date range:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};