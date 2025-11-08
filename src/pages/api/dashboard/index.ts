import { createClient } from '@libsql/client'
import type { APIRoute } from 'astro';

const client = createClient({
    url: import.meta.env.TURSO_DATABASE_URL,
    authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

export const GET: APIRoute = async ({ request }) => {

    const result = await client.execute('SELECT COUNT(*) as count FROM admin_notifications WHERE type = "new_user"');
    const countUser = result.rows[0].count;

    const resultTicket = await client.execute('SELECT COUNT(*) as count FROM tickets WHERE estado = "Abierto"');
    const countTicket = resultTicket.rows[0].count;

    const resultChatActive = await client.execute('SELECT COUNT(*) as count FROM tickets WHERE estado = "Abierto"');
    const countChatActive = resultChatActive.rows[0].count;

    const resultChatClose = await client.execute('SELECT COUNT(*) as count FROM tickets WHERE estado = "Cerrado"');
    const countChatClose = resultChatClose.rows[0].count;

    return new Response(JSON.stringify({ countUser, countTicket, countChatActive, countChatClose }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    })
}