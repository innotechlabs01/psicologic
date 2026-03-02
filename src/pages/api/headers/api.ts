// src/pages/api/headers/api.ts

import type { APIRoute } from 'astro';
import { db } from '../../../lib/turso/client';

export const GET: APIRoute = async () => {
    try {
        const unreadCountResult = await db.execute(`
            SELECT count(*) AS unread_tickets
                FROM messages m
            inner join tickets t
                on m.ticket_id = t.ticket_id
            where m.leido_por_cliente = 0
                GROUP BY t.ticket_id;
        `);

        // El resultado es un array de filas; tomamos la primera y el campo unread_tickets.
        const unreadCount = unreadCountResult.rows.length === 0 ? 0 : unreadCountResult.rows[0].unread_tickets as number;

        return new Response(JSON.stringify({
            unreadCount: unreadCount
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
        });

    } catch (error) {
        console.error('Error al obtener conteo de no leídos:', error);
        return new Response(JSON.stringify({
            error: 'Fallo interno al obtener el conteo de tickets no leídos.'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
        });
    }
};
