import type { APIRoute } from 'astro';
import { getClinicalEntry, getTemplate, updateClinicalEntry, deleteClinicalEntry } from '../../../../../lib/turso/clinical/clinical-db';
import { verifyClerkUser } from '../../../../../utils/verifyClerkUser';

export const GET: APIRoute = async (context) => {
  try {
    try {
      await verifyClerkUser(context);
    } catch (err: any) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthenticated' }), { status: 401 });
    }

    const url = new URL(context.request.url);
    const id = url.pathname.split('/').slice(-1)[0];

    if (!id) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_entry_id' }), { status: 400 });
    }

    const entry = await getClinicalEntry(id);
    if (!entry) {
      return new Response(JSON.stringify({ ok: false, error: 'entry_not_found' }), { status: 404 });
    }

    const template = await getTemplate(entry.template_id);

    return new Response(JSON.stringify({ ok: true, entry, template }), { status: 200 });
  } catch (err) {
    console.error('get clinical entry error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
};

export const PATCH: APIRoute = async (context) => {
  try {
    try {
      await verifyClerkUser(context);
    } catch (err: any) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthenticated' }), { status: 401 });
    }

    const url = new URL(context.request.url);
    const id = url.pathname.split('/').slice(-1)[0];

    if (!id) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_entry_id' }), { status: 400 });
    }

    const body = await context.request.json();
    const { answers } = body;

    if (!answers || typeof answers !== 'object') {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_answers' }), { status: 400 });
    }

    const updated = await updateClinicalEntry(id, answers);
    if (!updated) {
      return new Response(JSON.stringify({ ok: false, error: 'entry_not_found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('update clinical entry error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    try {
      await verifyClerkUser(context);
    } catch (err: any) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthenticated' }), { status: 401 });
    }

    const url = new URL(context.request.url);
    const id = url.pathname.split('/').slice(-1)[0];

    if (!id) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_entry_id' }), { status: 400 });
    }

    const deleted = await deleteClinicalEntry(id);
    if (!deleted) {
      return new Response(JSON.stringify({ ok: false, error: 'entry_not_found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('delete clinical entry error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
};
