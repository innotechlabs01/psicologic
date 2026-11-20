import type { APIRoute } from 'astro';
import { createGame } from '../../../../lib/turso/Settings/index';
import { requireAuth } from '../../../../lib/auth/api-guard';
import { db as client } from '../../../../lib/turso/client';
import {
  getGlobalDefaultMenu,
  saveGlobalDefaultMenu,
  type MenuItem,
} from '../../../../lib/turso/Header/default-menu';

function appendGameToMenu(menu: MenuItem[], gameName: string, gameSlug: string): MenuItem[] {
  const next = menu.map((m) => ({
    ...m,
    subItem: Array.isArray(m.subItem) ? [...m.subItem] : undefined,
  }));
  const gameIdx = next.findIndex((m) => m.slug === 'juego' || m.name === 'Juego');
  const newSub = { id: Date.now(), name: gameSlug, slug: gameSlug, nametext: gameName, status: true };

  if (gameIdx === -1) {
    next.push({
      id: Date.now(),
      name: 'Juego',
      slug: 'juego',
      nametext: 'Juegos',
      status: true,
      subItem: [newSub],
    });
  } else {
    const subs = next[gameIdx].subItem || [];
    if (!subs.some((s) => s.name === gameSlug)) {
      subs.push(newSub);
    }
    next[gameIdx].subItem = subs;
  }
  return next;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals, ['org:admin']);
  if (auth instanceof Response) return auth;

  try {
    const game = await request.json();

    if (!game.name || !game.description) {
      return new Response(
        JSON.stringify({ error: 'Nombre y descripción son obligatorios', status: 400 }),
        { status: 400 }
      );
    }

    const slug = String(game.slug || game.name).trim().toLowerCase().replace(/\s+/g, '-');
    const createdGame = await createGame({
      name: String(game.name).trim(),
      description: String(game.description).trim(),
      slug,
    });

    if (game.addToAllMenus !== false) {
      const currentDefault = await getGlobalDefaultMenu();
      const updatedDefault = appendGameToMenu(currentDefault, String(game.name).trim(), slug);
      await saveGlobalDefaultMenu(updatedDefault);

      const rows = await client.execute({
        sql: `SELECT id, menu FROM user_games WHERE status = 1`,
        args: [],
      });
      for (const r of rows.rows as any[]) {
        try {
          const parsed = JSON.parse(String(r.menu || '{}'));
          if (Array.isArray(parsed?.menu)) {
            const nextMenu = appendGameToMenu(parsed.menu, String(game.name).trim(), slug);
            await client.execute({
              sql: `UPDATE user_games SET menu = ? WHERE id = ?`,
              args: [JSON.stringify({ ...parsed, menu: nextMenu }), r.id],
            });
          }
        } catch {
          // skip malformed row
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, createdGame, slug }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating game:', error);
    return new Response(JSON.stringify({ error: 'Error creating game' }), {
      status: 500,
    });
  }
};
