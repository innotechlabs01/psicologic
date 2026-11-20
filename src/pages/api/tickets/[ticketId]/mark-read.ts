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
import { db } from '../../../../lib/turso/client';
import { requireAuth } from '../../../../lib/auth/api-guard';


export const POST: APIRoute = async ({ params, locals }) => {
    const auth = requireAuth(locals);
    if (auth instanceof Response) return auth;

    const { ticketId } = params;

    await db.execute(
        `UPDATE Messages SET leido_por_cliente = 1 WHERE ticket_id = ?`,
        [ticketId ?? '']
    );
    
    return new Response(null, { status: 200 });
}