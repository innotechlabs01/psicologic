import { db } from '../../../lib/turso/client';
import type { APIRoute } from 'astro';
import { requireAuth } from '../../../lib/auth/api-guard';

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  const { idPatients, templateId, answers } = await request.json();

  await db.execute({
    sql: `
      INSERT INTO clinical_entries (id, template_id, answers)
      VALUES (?, ?, ?)
    `,
    args: [idPatients, templateId, JSON.stringify(answers)]
  });

  return new Response(JSON.stringify({ ok: true, id: idPatients }), {
    status: 200,
  });
}

