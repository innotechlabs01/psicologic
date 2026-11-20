import type { APIRoute } from 'astro';
import { db as client } from '../../../lib/turso/client';
import { requireAuth } from '../../../lib/auth/api-guard';
import { reportErrorToDiscord } from '../../../lib/monitoring/discord-error';
import {
  getGlobalDefaultMenu,
  saveGlobalDefaultMenu,
  type MenuItem,
} from '../../../lib/turso/Header/default-menu';

export const GET: APIRoute = async ({ locals }) => {
  const auth = requireAuth(locals, ['org:admin']);
  if (auth instanceof Response) return auth;

  try {
    const [defaultMenu, res] = await Promise.all([
      getGlobalDefaultMenu(),
      client.execute({
        sql: `
          SELECT
            u.id as db_id,
            u.clerk_user_id,
            u.email,
            u.first_name,
            u.last_name,
            u.username,
            u.status as user_status,
            ug.id as user_game_id,
            ug.menu as menu_json
          FROM usuarios u
          LEFT JOIN user_games ug ON ug.userId = u.id AND ug.status = 1
          WHERE u.role IS NULL OR u.role != 'org:admin'
          ORDER BY u.created_at DESC
        `,
        args: [],
      }),
    ]);

    const psychologists = (res.rows as any[]).map((row) => {
      let menu: MenuItem[] = defaultMenu;
      if (row.menu_json) {
        try {
          const parsed = JSON.parse(String(row.menu_json));
          if (Array.isArray(parsed?.menu)) menu = parsed.menu;
        } catch {
          // keep default
        }
      }
      const name =
        [row.first_name, row.last_name].filter(Boolean).join(' ').trim() ||
        (row.username ? String(row.username) : '') ||
        String(row.email || '').split('@')[0] ||
        'Sin nombre';

      return {
        dbId: Number(row.db_id),
        clerkUserId: String(row.clerk_user_id || ''),
        name,
        email: String(row.email || ''),
        status: String(row.user_status || 'active'),
        hasCustomMenu: Boolean(row.user_game_id),
        menu,
      };
    });

    return new Response(JSON.stringify({ psychologists, defaultMenu }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en GET /api/settings/modules:', error);
    await reportErrorToDiscord({
      source: 'server',
      route: '/api/settings/modules',
      error,
      userId: auth.userId,
    });
    return new Response(JSON.stringify({ error: 'Error cargando módulos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals, ['org:admin']);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const scope = body?.scope === 'global' ? 'global' : 'user';
    const menu = body?.menu;

    if (!Array.isArray(menu)) {
      return new Response(JSON.stringify({ error: 'El menú debe ser un arreglo válido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (scope === 'global') {
      await saveGlobalDefaultMenu(menu);

      if (body?.applyToExisting === true) {
        const serialized = JSON.stringify({ menu });
        const psychs = await client.execute({
          sql: `SELECT id FROM usuarios WHERE role IS NULL OR role != 'org:admin'`,
          args: [],
        });

        for (const row of psychs.rows as any[]) {
          const uid = Number(row.id);
          const existing = await client.execute({
            sql: `SELECT id FROM user_games WHERE userId = ? AND status = 1 LIMIT 1`,
            args: [uid],
          });
          if (existing.rows && existing.rows.length > 0) {
            await client.execute({
              sql: `UPDATE user_games SET menu = ? WHERE id = ?`,
              args: [serialized, existing.rows[0].id],
            });
          } else {
            await client.execute({
              sql: `INSERT INTO user_games (userId, menu, status) VALUES (?, ?, 1)`,
              args: [uid, serialized],
            });
          }
        }
      }

      return new Response(JSON.stringify({ ok: true, scope: 'global' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const dbId = Number(body?.dbId);
    if (!dbId) {
      return new Response(JSON.stringify({ error: 'Parámetros inválidos (dbId)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const serialized = JSON.stringify({ menu });
    const existing = await client.execute({
      sql: `SELECT id FROM user_games WHERE userId = ? AND status = 1 LIMIT 1`,
      args: [dbId],
    });

    if (existing.rows && existing.rows.length > 0) {
      await client.execute({
        sql: `UPDATE user_games SET menu = ? WHERE id = ?`,
        args: [serialized, existing.rows[0].id],
      });
    } else {
      await client.execute({
        sql: `INSERT INTO user_games (userId, menu, status) VALUES (?, ?, 1)`,
        args: [dbId, serialized],
      });
    }

    return new Response(JSON.stringify({ ok: true, scope: 'user' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en PATCH /api/settings/modules:', error);
    await reportErrorToDiscord({
      source: 'server',
      route: '/api/settings/modules',
      error,
      userId: auth.userId,
    });
    return new Response(JSON.stringify({ error: 'Error actualizando módulos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
