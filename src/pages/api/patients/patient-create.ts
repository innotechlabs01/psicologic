import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client'

const db = createClient({
    url: import.meta.env.TURSO_DATABASE_URL,
    authToken: import.meta.env.TURSO_AUTH_TOKEN,
})

import { v4 as uuidv4 } from 'uuid';

export const POST:APIRoute = async (context) => {
  const { request } = context;
  const body = await request.json();
  const id = uuidv4();
  await db.execute({ sql: 'INSERT INTO patients (id, name, document, phone, userId) VALUES (?, ?, ?, ?, ?)', args: [id, body.name, body.document || '', body.phone || '', body.clerkUserId] });

  // decide templateId — e.g. default one
  const templateRes = await db.execute({ sql: 'SELECT id FROM template_history LIMIT 1' });
  const templateId = templateRes.rows.length ? templateRes.rows[0][0] : null;

  return new Response(JSON.stringify({ ok: true, id, templateId }), { status: 200 });
}
