import type { APIRoute } from 'astro';
import { db } from '../../../lib/turso/client';

export const GET: APIRoute = async (context) => {
    try {
        const { locals } = context;
        const { isAuthenticated, userId } = locals.auth();

        if (!isAuthenticated || !userId) {
            return new Response(JSON.stringify({ error: 'No autenticado' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const games = await db.execute({
            sql: 'SELECT * FROM games',
            args: [],
        });

        return new Response(JSON.stringify({
            games: games.rows || []
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
        });

    } catch (error) {
        console.error('Error al obtener juegos:', error);
        return new Response(JSON.stringify({
            error: 'Fallo interno al obtener los juegos.'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
        });
    }
};
