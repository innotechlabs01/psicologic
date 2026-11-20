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

    // Total usuarios
    const totalUsersResult = await client.execute({
      sql: `SELECT COUNT(*) as count FROM usuarios`,
      args: [],
    });
    const totalUsers = parseInt(String(totalUsersResult.rows[0].count));

    // Usuarios activos (status='approved')
    const activeUsersResult = await client.execute({
      sql: `SELECT COUNT(*) as count FROM usuarios WHERE status = 'approved'`,
      args: [],
    });
    const activeUsers = parseInt(String(activeUsersResult.rows[0].count));

    // Usuarios pending_approval
    const pendingUsersResult = await client.execute({
      sql: `SELECT COUNT(*) as count FROM usuarios WHERE status = 'pending_approval'`,
      args: [],
    });
    const pendingUsers = parseInt(String(pendingUsersResult.rows[0].count));

    // Distribución por rol
    const byRoleResult = await client.execute({
      sql: `SELECT role, COUNT(*) as count FROM usuarios GROUP BY role`,
      args: [],
    });
    const byRole: Record<string, number> = {};
    byRoleResult.rows.forEach((row: any) => {
      byRole[row.role] = parseInt(String(row.count));
    });

    // Accesos de hoy (accesos totales hoy + intentos denegados)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const accessTotalResult = await client.execute({
      sql: `SELECT COUNT(*) as count FROM access_logs WHERE timestamp >= ? AND timestamp < ?`,
      args: [today.toISOString(), tomorrow.toISOString()],
    });
    const accessTotal = parseInt(String(accessTotalResult.rows[0].count));

    const accessDeniedResult = await client.execute({
      sql: `SELECT COUNT(*) as count FROM access_logs WHERE timestamp >= ? AND timestamp < ? AND action = 'denied'`,
      args: [today.toISOString(), tomorrow.toISOString()],
    });
    const accessDenied = parseInt(String(accessDeniedResult.rows[0].count));

    // Alertas de seguridad activas
    const alertsResult = await client.execute({
      sql: `SELECT COUNT(*) as count FROM security_alerts WHERE status = 'active'`,
      args: [],
    });
    const totalAlerts = parseInt(String(alertsResult.rows[0].count));

    return new Response(JSON.stringify({
      users: {
        total: totalUsers,
        active: activeUsers,
        pending: pendingUsers,
        byRole,
      },
      access: {
        total: accessTotal,
        denied: accessDenied,
      },
      security: {
        totalAlerts,
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};