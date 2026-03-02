import type { APIRoute } from 'astro';
import { db } from '../../../lib/turso/client';
import { GetUserGameClientHeader } from '../../../lib/turso/Header';

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

        const userGameHeader = await GetUserGameClientHeader();

        if (!userGameHeader) {
            return new Response(JSON.stringify({
                error: 'No se encontraron juegos para este usuario.'
            }), {
                status: 404,
                headers: {
                    'Content-Type': 'application/json'
                },
            });
        }

        // If the client expects an array, wrap the single object in an array
        const responseData = Array.isArray(userGameHeader) ? userGameHeader : [userGameHeader];

        return new Response(JSON.stringify({
            settings: responseData
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
        });

    } catch (error) {
        console.error('Error al obtener configuraciones:', error);
        return new Response(JSON.stringify({
            error: 'Fallo interno al obtener las configuraciones.'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
        });
    }
};

export const PATCH: APIRoute = async (context) => {
    try {
        const { locals } = context;
        const { isAuthenticated, userId } = locals.auth();

        if (!isAuthenticated || !userId) {
            return new Response(JSON.stringify({ error: 'No autenticado' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Always return a Response to satisfy the APIRoute type
        return new Response(JSON.stringify({ message: 'Not implemented' }), {
            status: 501,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error al actualizar configuraciones:', error);
        return new Response(JSON.stringify({
            error: 'Fallo interno al actualizar las configuraciones.'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
        });
    }
}
