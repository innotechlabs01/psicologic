// src/pages/api/game/menu.ts
import type { APIRoute } from 'astro';
import { GetUserGameHeader } from '../../../../lib/supabase/Header/index';

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
    const userGameHeader = await GetUserGameHeader({ userId });

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