import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client';
import { verifyClerkUser } from '../../../../utils/verifyClerkUser';

const db = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

export const POST: APIRoute = async (context) => {
  try {
    // Verify clerk user server-side
    try {
      await verifyClerkUser(context);
    } catch (err: any) {
      return new Response(JSON.stringify({ ok: false, error: err.message || 'unauthenticated' }), { status: 401 });
    }

    const { userId: clerkUserId } = context.locals.auth();
    const body = await context.request.json();
    const id = body?.id;
    if (!id) return new Response(JSON.stringify({ ok: false, error: 'missing_id' }), { status: 400 });

    const check = await db.execute({ sql: 'SELECT userId, status FROM patientsClient WHERE id = ?', args: [id] });
    if (!check.rows.length) return new Response(JSON.stringify({ ok: false, error: 'not_found' }), { status: 404 });
    const owner = check.rows[0][0];
    const currentStatus = check.rows[0][1];
    if (owner !== clerkUserId) return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403 });

    if (currentStatus === 'active') return new Response(JSON.stringify({ ok: true, message: 'already_active' }), { status: 200 });

    const now = new Date().toISOString();
    await db.execute({ sql: 'UPDATE patientsClient SET status = ?, updated_at = ? WHERE id = ?', args: ['active', now, id] });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('reactivate patient error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
};