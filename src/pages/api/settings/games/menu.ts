// src/pages/api/game/menu.ts
import type { APIRoute } from 'astro';
import { GetUserGameHeader } from '../../../../lib/turso/Header/index';

function parseCookies(cookieHeader?: string) {
  return (cookieHeader || '').split(';').map(c => c.trim()).reduce<Record<string, string>>((acc, kv) => {
    if (!kv) return acc;
    const [k, ...vParts] = kv.split('=');
    const v = vParts.join('=');
    if (k && v !== undefined) acc[k] = decodeURIComponent(v);
    return acc;
  }, {});
}

export const GET: APIRoute = async (context) => {

  const { locals } = context;
  const { isAuthenticated, userId } = locals.auth();

  if (!isAuthenticated || !userId) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Prefer query param or header first (client may set ?isGame=true or header 'x-auth-source')
    const url = new URL(context.request.url);
    let isGame = url.searchParams.get('isGame') === 'true';
    let gameId: string | null = null;

    // Check header 'x-auth-source' (e.g. 'game:cartas')
    if (!isGame) {
      const headerAuth = context.request.headers.get('x-auth-source');
      if (headerAuth && typeof headerAuth === 'string' && headerAuth.startsWith('game:')) {
        isGame = true;
        gameId = headerAuth.split(':')[1] || null;
      }
    }

    // Fallback to cookie 'auth_source'
    if (!isGame) {
      const cookies = parseCookies(context.request.headers.get('cookie') ?? '');
      const authSource = cookies['auth_source'];
      const isGameLogin = typeof authSource === 'string' && authSource.startsWith('game:');
      gameId = isGameLogin ? authSource.split(':')[1] : null;
      if (gameId) {
        isGame = true;
      }
    }

    const userGameHeader = await GetUserGameHeader({ userId, isGame });

    // If the client expects an array, wrap the single object in an array
    const responseData = Array.isArray(userGameHeader) ? userGameHeader : [userGameHeader];

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ Error al obtener el menú:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};