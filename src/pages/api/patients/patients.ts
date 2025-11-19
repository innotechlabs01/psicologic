import { createClient } from '@libsql/client'

const db = createClient({
    url: import.meta.env.TURSO_DATABASE_URL,
    authToken: import.meta.env.TURSO_AUTH_TOKEN,
})


import type { APIRoute } from 'astro';


export const GET:APIRoute = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') || '1');
  const limit = Number(url.searchParams.get('limit') || '10');
  const clerkUserId = url.searchParams.get('userId');

  const offset = (page - 1) * limit;

  const res = await db.execute({ sql: 'SELECT id, name, document, phone FROM patients where userId = :userId ORDER BY created_at DESC LIMIT ? OFFSET ?', args: [clerkUserId, limit, offset, ] });
  const rows = res.rows.map(r => ({ id: r[0], name: r[1], document: r[2], phone: r[3] }));

  // total count
  const countRes = await db.execute({ sql: 'SELECT COUNT(*) FROM patients where userId = :userId', args: [clerkUserId] });
  const total = Number(countRes.rows[0][0] || 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return new Response(JSON.stringify({ data: rows, total, totalPages }), { status: 200 });
}
