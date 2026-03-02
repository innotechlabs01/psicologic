import type { APIRoute } from 'astro';
import { db } from '../../../lib/turso/client';

export const GET: APIRoute = async (context) => {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    let res;
    res = await db.execute({ sql: 'SELECT id, template FROM template_history WHERE userId = ? and status = 1 LIMIT 1', args: [id] });
    if (!res.rows.length) return new Response(JSON.stringify({ ok: false, message: 'No Tiene Template configurado, por favor registre un template' }), { status: 404 });
    const row = res.rows[0];
    return new Response(JSON.stringify({ ok: true, structure: JSON.parse(row[1]?.toString() || '{}'), id: row[0] }), { status: 200 });
}
