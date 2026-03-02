import type { APIRoute } from 'astro';
import { db } from "../../../../lib/turso/client";
import { v4 as uuidv4 } from 'uuid';
import { validateName, validateCedula, validateEmail, sanitizeString } from '../../../../utils/validators';
import { verifyClerkUser } from '../../../../utils/verifyClerkUser';

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
    const name = sanitizeString(body.name);
    const cedula = sanitizeString(body.cedula || body.document);
    const email = sanitizeString(body.email);
    const marital_status = sanitizeString(body.marital_status || '');

    const vName = validateName(name);
    if (vName) return new Response(JSON.stringify({ ok: false, error: `name_${vName}` }), { status: 400 });
    const vCed = validateCedula(cedula);
    if (vCed) return new Response(JSON.stringify({ ok: false, error: `cedula_${vCed}` }), { status: 400 });
    const vMail = validateEmail(email);
    if (vMail) return new Response(JSON.stringify({ ok: false, error: `email_${vMail}` }), { status: 400 });

    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute({ sql: 'INSERT INTO patientsClient (id, name, document, email, marital_status, membership_paid, status, userId, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', args: [id, name, cedula, email || '', marital_status || '', 0, 'active', clerkUserId, now, now] });

    return new Response(JSON.stringify({ ok: true, id }), { status: 200 });
  } catch (err) {
    console.error('create patient error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
};