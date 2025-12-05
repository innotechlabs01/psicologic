import { createClient } from '@libsql/client';

const db = createClient({
    url: import.meta.env.TURSO_DATABASE_URL,
    authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

import type { APIRoute } from 'astro';
import { SaveHorariosUsers } from '../../../../lib/turso/agenda/api';

export const POST: APIRoute = async ({ params, request, locals }) => {
    try {
        // 1. OBTENCIÓN DE DATOS Y AUTENTICACIÓN
        const { userId: clerkUserId } = locals.auth();
        const { horarios } = await request.json();

        if (!clerkUserId) {
            return new Response(JSON.stringify({ success: false, error: 'No autenticado' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const saveHorariosUsers = await SaveHorariosUsers({ userId: clerkUserId, payload: horarios });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ success: false, error: 'Error al obtener el usuario' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
