import type { APIRoute } from 'astro';
import { getClinicalEntries, getPatientById } from '../../../../lib/turso/clinical/clinical-db';
import { verifyClerkUser } from '../../../../utils/verifyClerkUser';

export const GET: APIRoute = async (context) => {
  try {
    try {
      await verifyClerkUser(context);
    } catch (err: any) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthenticated' }), { status: 401 });
    }

    const { userId: clerkUserId } = context.locals.auth();
    const url = new URL(context.request.url);
    const patientId = url.pathname.split('/').slice(-2)[0];

    if (!patientId) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_patient_id' }), { status: 400 });
    }

    const patient = await getPatientById(patientId);
    if (!patient) {
      return new Response(JSON.stringify({ ok: false, error: 'patient_not_found' }), { status: 404 });
    }

    const entries = await getClinicalEntries(patientId);

    return new Response(JSON.stringify({ ok: true, patient, entries }), { status: 200 });
  } catch (err) {
    console.error('get clinical entries error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
};
