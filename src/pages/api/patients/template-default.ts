import { createClient } from '@libsql/client'

const db = createClient({
    url: import.meta.env.TURSO_DATABASE_URL,
    authToken: import.meta.env.TURSO_AUTH_TOKEN,
})

import type { APIRoute } from 'astro';

export const GET:APIRoute = async (context) => {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    let res;
    if (id) {
        res = await db.execute({ sql: 'SELECT id, template FROM template_history WHERE userId = ? and status = 1 LIMIT 1', args: [id] });
    } else {
        res = await db.execute({ sql: 'SELECT id, template FROM template_history where status = 1 LIMIT 1' });
    }
    if (!res.rows.length) return new Response(JSON.stringify({ ok: false, message: 'not found' }), { status: 404 });
    const row = res.rows[0];
    return new Response(JSON.stringify({ ok: true, structure: JSON.parse(row[1]?.toString() || '{}'), id: row[0] }), { status: 200 });
}
