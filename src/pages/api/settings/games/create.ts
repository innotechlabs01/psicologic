import type { APIRoute } from 'astro';
import { createGame } from '../../../../lib/supabase/Settings/index';

export const POST:APIRoute = async ({request}) => {
    try {
        const game = await request.json();

        if (!game.name || !game.description) {
            return new Response(JSON.stringify({ error: 'Not Send Empty' ,
                status: 400,
            }), {
                status: 400,
            });
        }

        const createdGame = await createGame(game);
        return new Response(JSON.stringify(createdGame), {
            status: 201,
        });
    } catch (error) {
        console.error('Error creating game:', error);
        return new Response(JSON.stringify({ error: 'Error creating game' }), {
            status: 500,
        });
    }
}