import type { APIRoute } from 'astro';
import { createClinicalEntry, getDefaultTemplate, getPatientById } from '../../../../lib/turso/clinical/clinical-db';
import { verifyClerkUser } from '../../../../utils/verifyClerkUser';

export const POST: APIRoute = async (context) => {
  try {
    try {
      await verifyClerkUser(context);
    } catch (err: any) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthenticated' }), { status: 401 });
    }

    const { userId: clerkUserId } = context.locals.auth();
    
    if (!clerkUserId) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthenticated' }), { status: 401 });
    }

    const body = await context.request.json();
    const { patient_id, template_id, answers } = body;

    if (!patient_id) {
      return new Response(JSON.stringify({ ok: false, error: 'missing_patient_id' }), { status: 400 });
    }

    const patient = await getPatientById(patient_id);
    if (!patient) {
      return new Response(JSON.stringify({ ok: false, error: 'patient_not_found' }), { status: 404 });
    }

    if (!patient.document || patient.document.trim() === '') {
      return new Response(JSON.stringify({ ok: false, error: 'patient_without_document', message: 'El paciente no tiene documento de identidad. Por favor edita el paciente y agrega su documento.' }), { status: 400 });
    }

    let templateId = template_id;
    if (!templateId) {
      const template = await getDefaultTemplate(clerkUserId);
      templateId = template?.id || null;
    }

    if (!templateId) {
      return new Response(JSON.stringify({ ok: false, error: 'no_template_available', message: 'No tienes un template configurado. Por favor crea uno en Configuración.' }), { status: 400 });
    }

    const entryId = await createClinicalEntry(patient_id, templateId, answers || {});

    return new Response(JSON.stringify({ ok: true, id: entryId }), { status: 200 });
  } catch (err) {
    console.error('create clinical entry error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
};
