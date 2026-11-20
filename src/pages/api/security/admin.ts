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

    // Get active security alerts
    const alertsResult = await client.execute({
      sql: `SELECT id, title, message, severity, created_at, resolved_at FROM security_alerts WHERE status = 'active' ORDER BY created_at DESC LIMIT 20`,
      args: [],
    });

    const alerts = alertsResult.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      severity: row.severity || 'medium',
      created_at: row.created_at,
      resolved_at: row.resolved_at,
    }));

    // Get recent denied access logs
    const since = new URLSearchParams(new URL(request.url).search).get('since');

    let logQuery = `
      SELECT id, user_id, action, route, email, created_at 
      FROM access_logs 
      WHERE action = 'denied'
    `;
    const logArgs: any[] = [];

    if (since) {
      logQuery += ` AND created_at >= ?`;
      logArgs.push(since);
    }

    logQuery += ` ORDER BY created_at DESC LIMIT 20`;

    const logsResult = await client.execute({
      sql: logQuery,
      args: logArgs,
    });

    const deniedLogs = logsResult.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      action: row.action,
      route: row.route,
      email: row.email,
      created_at: row.created_at,
    }));

    return new Response(JSON.stringify({
      alerts,
      deniedLogs,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Security admin error:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};