import type { APIRoute } from 'astro';
import { db as client } from '../../../lib/turso/client';
import { requireAuth } from '../../../lib/auth/api-guard';
import { reportErrorToDiscord } from '../../../lib/monitoring/discord-error';

export const GET: APIRoute = async ({ locals }) => {
  const auth = requireAuth(locals, ['org:admin']);
  if (auth instanceof Response) return auth;

  try {
    const [usersRes, patientsRes, agendaRes] = await Promise.all([
      client.execute({
        sql: `
          SELECT clerk_user_id, email, first_name, last_name, username, avatar_url, status, role, created_at, updated_at
          FROM usuarios
          ORDER BY
            CASE WHEN status = 'pending_approval' THEN 0 ELSE 1 END,
            created_at DESC
        `,
        args: [],
      }),
      client.execute({
        sql: `SELECT userId, COUNT(*) as cnt FROM patients GROUP BY userId`,
        args: [],
      }).catch(() => ({ rows: [] as any[] })),
      client.execute({
        sql: `SELECT userId, COUNT(*) as cnt FROM agenda WHERE status != 'cancelled' GROUP BY userId`,
        args: [],
      }).catch(() => ({ rows: [] as any[] })),
    ]);

    const patientsMap = new Map<string, number>();
    for (const r of patientsRes.rows as any[]) {
      patientsMap.set(String(r.userId), Number(r.cnt) || 0);
    }

    const agendaMap = new Map<string, number>();
    for (const r of agendaRes.rows as any[]) {
      agendaMap.set(String(r.userId), Number(r.cnt) || 0);
    }

    const users = (usersRes.rows as any[]).map((u) => {
      const id = String(u.clerk_user_id || '');
      return {
        id,
        first_name: String(u.first_name || ''),
        last_name: String(u.last_name || ''),
        username: String(u.username || ''),
        email: String(u.email || ''),
        avatar_url: u.avatar_url ? String(u.avatar_url) : null,
        status: String(u.status || 'active'),
        role: String(u.role || 'org:client'),
        patientsCount: patientsMap.get(id) ?? 0,
        sessionsCount: agendaMap.get(id) ?? 0,
        created_at: u.created_at ? String(u.created_at) : null,
        updated_at: u.updated_at ? String(u.updated_at) : null,
      };
    });

    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en /api/users/list:', error);
    await reportErrorToDiscord({
      source: 'server',
      route: '/api/users/list',
      error,
      userId: auth.userId,
    });
    return new Response(JSON.stringify({ error: 'Error cargando usuarios' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
