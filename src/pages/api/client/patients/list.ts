import type { APIRoute } from 'astro';
import { db } from '../../../../lib/turso/client';

import { verifyClerkUser } from '../../../../utils/verifyClerkUser';

export const GET: APIRoute = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') || '1');
  const limit = Number(url.searchParams.get('limit') || '10');
  const q = url.searchParams.get('q') || '';
  const includeInactive = url.searchParams.get('include_inactive') === '1';

  // Verify clerk user server-side
  const { userId: clerkUserId } = context.locals.auth();
  console.log(`[list.ts] Request params: page=${page}, limit=${limit}, q=${q}, includeInactive=${includeInactive}`);
  console.log(`[list.ts] Auth check - userId: ${clerkUserId}`);

  try {
    if (!clerkUserId) {
      console.log("[list.ts] No userId found in locals, throwing unauthenticated.");
    }
    await verifyClerkUser(context);
    console.log("[list.ts] verifyClerkUser passed");
  } catch (err: any) {
    console.error(`[list.ts] Auth Error: ${err.message}`, err);
    return new Response(JSON.stringify({ error: err.message || 'unauthenticated' }), { status: 401 });
  }

  const offset = (page - 1) * limit;

  // Simple search filter
  // Excluir pacientes con status = 'inactive' (soft-delete) UNLESS includeInactive is true
  const searchClause = q ? `AND (name LIKE '%' || ? || '%' OR document LIKE '%' || ? || '%' OR email LIKE '%' || ? || '%')` : '';
  const args = [] as any[];

  // Build args depending on whether we're including inactive patients
  if (q) {
    if (includeInactive) {
      args.push(clerkUserId, q, q, q, limit, offset);
    } else {
      args.push(clerkUserId, q, q, q, limit, offset);
    }
  } else {
    args.push(clerkUserId, limit, offset);
  }

  const statusFilter = includeInactive ? '' : `AND (status IS NULL OR status != 'inactive')`;
  const sql = `SELECT id, name, document, email, marital_status, status, membership_paid, created_at FROM patientsClient WHERE userId = ? ${statusFilter} ${searchClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const res = await db.execute({ sql, args });
  const rows = res.rows.map((r: any) => ({ id: r[0], name: r[1], document: r[2], email: r[3], marital_status: r[4], status: r[5], membership_paid: r[6], created_at: r[7] }));

  const countSql = `SELECT COUNT(*) FROM patientsClient WHERE userId = ? AND (status IS NULL OR status != 'inactive') ${searchClause}`;
  const countArgs = q ? [clerkUserId, q, q, q] : [clerkUserId];
  const countRes = await db.execute({ sql: countSql, args: countArgs });
  const total = Number(countRes.rows[0][0] || 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return new Response(JSON.stringify({ data: rows, total, totalPages }), { status: 200 });
};