// Asunción: src/pages/api/tickets/[ticketId]/mark-read.ts
// Ejemplo de lógica interna:
/*
    const { ticketId } = Astro.params;
    await db.execute(
        `UPDATE Tickets SET leido_por_cliente = 1 WHERE ticket_id = ?`,
        [ticketId]
    );
    return new Response(null, { status: 200 });
*/

import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client';

const db = createClient({
    url: import.meta.env.TURSO_DATABASE_URL,
    authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

export const POST: APIRoute = async ({ params, request, locals }) => {
    const { ticketId } = params;

    await db.execute(
        `UPDATE Messages SET leido_por_cliente = 1 WHERE ticket_id = ?`,
        [ticketId ?? '']
    );
    
    return new Response(null, { status: 200 });
}