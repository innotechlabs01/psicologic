import type { APIRoute } from 'astro';
import { getDefaultTemplate, getTemplate } from '../../../../lib/turso/clinical/clinical-db';
import { verifyClerkUser } from '../../../../utils/verifyClerkUser';

export const GET: APIRoute = async (context) => {
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

    const url = new URL(context.request.url);
    const templateId = url.searchParams.get('id');

    let template;
    if (templateId) {
      template = await getTemplate(templateId);
    } else {
      template = await getDefaultTemplate(clerkUserId);
    }

    if (!template) {
      return new Response(JSON.stringify({ ok: false, error: 'no_template_available', message: 'No tienes un template configurado. Por favor crea uno en Configuración.' }), { status: 404 });
    }

    return new Response(JSON.stringify({ ok: true, template }), { status: 200 });
  } catch (err) {
    console.error('get template error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
};
