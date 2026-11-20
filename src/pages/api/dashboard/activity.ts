import { db as client } from '../../../lib/turso/client';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const { userId, orgRole } = locals.auth();

    if (orgRole !== 'org:admin') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const since = new URLSearchParams(new URL(request.url).search).get('since');

    let query = `
      SELECT id, user_id, action, route, role, email, created_at
      FROM access_logs
    `;
    const args: any[] = [];

    if (since) {
      query += ` WHERE created_at >= ?`;
      args.push(since);
    }

    query += ` ORDER BY created_at DESC LIMIT 20`;

    const result = await client.execute({
      sql: query,
      args,
    });

    const activity = result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      action: row.action,
      route: row.route,
      role: row.role,
      email: row.email,
      timestamp: row.created_at,
    }));

    return new Response(JSON.stringify({
      activity,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Dashboard activity error:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};