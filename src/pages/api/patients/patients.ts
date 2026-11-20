import { db } from '../../../lib/turso/client';
import type { APIRoute } from 'astro';
import { requireAuth } from '../../../lib/auth/api-guard';

export const GET:APIRoute = async (context) => {
  const { request, locals } = context;
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') || '1');
  const limit = Number(url.searchParams.get('limit') || '10');
  const requestedUserId = url.searchParams.get('userId');
  const clerkUserId = auth.orgRole === 'org:admin' && requestedUserId ? requestedUserId : auth.userId;

  const offset = (page - 1) * limit;

  const res = await db.execute({ sql: 'SELECT id, name, document, phone FROM patients where userId = :userId ORDER BY created_at DESC LIMIT ? OFFSET ?', args: [clerkUserId, limit, offset, ] });
  const rows = res.rows.map(r => ({ id: r[0], name: r[1], document: r[2], phone: r[3] }));

  // total count
  const countRes = await db.execute({ sql: 'SELECT COUNT(*) FROM patients where userId = :userId', args: [clerkUserId] });
  const total = Number(countRes.rows[0][0] || 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return new Response(JSON.stringify({ data: rows, total, totalPages }), { status: 200 });
}
