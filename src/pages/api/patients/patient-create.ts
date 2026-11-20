import type { APIRoute } from 'astro';
import { db } from '../../../lib/turso/client';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../../../lib/auth/api-guard';

export const POST:APIRoute = async (context) => {
  const { request, locals } = context;
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const body = await request.json();
  const ownerUserId = auth.orgRole === 'org:admin' && body.clerkUserId ? body.clerkUserId : auth.userId;
  const id = uuidv4();
  await db.execute({ sql: 'INSERT INTO patients (id, name, document, phone, userId) VALUES (?, ?, ?, ?, ?)', args: [id, body.name, body.document || '', body.phone || '', ownerUserId] });

  // decide templateId — e.g. default one
  const templateRes = await db.execute({ sql: 'SELECT id FROM template_history LIMIT 1' });
  const templateId = templateRes.rows.length ? templateRes.rows[0][0] : null;

  return new Response(JSON.stringify({ ok: true, id, templateId }), { status: 200 });
}
