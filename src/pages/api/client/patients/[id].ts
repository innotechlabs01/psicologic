import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client';

const db = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

import { validateName, validateCedula, validateEmail, sanitizeString } from '../../../../utils/validators';
import { verifyClerkUser } from '../../../../utils/verifyClerkUser';

export const PATCH: APIRoute = async (context) => {
  try {
    // Verify clerk user server-side
    try {
      await verifyClerkUser(context);
    } catch (err: any) {
      return new Response(JSON.stringify({ ok: false, error: err.message || 'unauthenticated' }), { status: 401 });
    }

    const { userId: clerkUserId } = context.locals.auth();

    const url = new URL(context.request.url);
    const id = url.pathname.split('/').pop();
    if (!id) return new Response(JSON.stringify({ ok: false, error: 'missing_id' }), { status: 400 });

    const body = await context.request.json();
    const allowedFields = ['name','document','email','marital_status','status','membership_paid'];
    const updateParts: string[] = [];
    const args: any[] = [];

    // Validate & sanitize inputs
    if (body.name !== undefined) {
      const name = sanitizeString(body.name);
      const v = validateName(name);
      if (v) return new Response(JSON.stringify({ ok: false, error: `name_${v}` }), { status: 400 });
      updateParts.push('name = ?');
      args.push(name);
    }
    if (body.document !== undefined) {
      const document = sanitizeString(body.document);
      const v = validateCedula(document);
      if (v) return new Response(JSON.stringify({ ok: false, error: `cedula_${v}` }), { status: 400 });
      updateParts.push('document = ?');
      args.push(document);
    }
    if (body.email !== undefined) {
      const email = sanitizeString(body.email);
      const v = validateEmail(email);
      if (v) return new Response(JSON.stringify({ ok: false, error: `email_${v}` }), { status: 400 });
      updateParts.push('email = ?');
      args.push(email);
    }
    if (body.marital_status !== undefined) {
      const ms = sanitizeString(body.marital_status);
      updateParts.push('marital_status = ?');
      args.push(ms);
    }
    if (body.status !== undefined) {
      const s = sanitizeString(body.status);
      if (!['active','inactive'].includes(s)) return new Response(JSON.stringify({ ok: false, error: 'invalid_status' }), { status: 400 });
      updateParts.push('status = ?');
      args.push(s);
    }
    if (body.membership_paid !== undefined) {
      const mp = Number(body.membership_paid);
      if (!Number.isFinite(mp) || (mp !== 0 && mp !== 1)) return new Response(JSON.stringify({ ok: false, error: 'invalid_membership_paid' }), { status: 400 });
      updateParts.push('membership_paid = ?');
      args.push(mp);
    }

    if (!updateParts.length) return new Response(JSON.stringify({ ok: false, error: 'no_fields' }), { status: 400 });

    // Ensure the patient belongs to the requesting user
    const check = await db.execute({ sql: 'SELECT userId FROM patientsClient WHERE id = ?', args: [id] });
    if (!check.rows.length) return new Response(JSON.stringify({ ok: false, error: 'not_found' }), { status: 404 });
    const owner = check.rows[0][0];
    if (owner !== clerkUserId) return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403 });

    const now = new Date().toISOString();
    args.push(now);
    args.push(id);

    const sql = `UPDATE patientsClient SET ${updateParts.join(', ')}, updated_at = ? WHERE id = ?`;
    await db.execute({ sql, args });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('patch patient error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
};

export const GET: APIRoute = async (context) => {
  try {
    // Verify clerk user server-side
    try {
      await verifyClerkUser(context);
    } catch (err: any) {
      return new Response(JSON.stringify({ ok: false, error: err.message || 'unauthenticated' }), { status: 401 });
    }

    const { userId: clerkUserId } = context.locals.auth();

    const url = new URL(context.request.url);
    const id = url.pathname.split('/').pop();
    if (!id) return new Response(JSON.stringify({ ok: false, error: 'missing_id' }), { status: 400 });

    const res = await db.execute({ sql: 'SELECT id, name, document, email, marital_status, status, membership_paid, created_at, userId FROM patientsClient WHERE id = ?', args: [id] });
    if (!res.rows.length) return new Response(JSON.stringify({ ok: false, error: 'not_found' }), { status: 404 });
    const row = res.rows[0];

    // Verify owner
    const owner = row[8];
    if (owner !== clerkUserId) return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403 });

    const data = { id: row[0], name: row[1], document: row[2], email: row[3], marital_status: row[4], status: row[5], membership_paid: row[6], created_at: row[7] };
    return new Response(JSON.stringify({ ok: true, data }), { status: 200 });
  } catch (err) {
    console.error('get patient error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
};