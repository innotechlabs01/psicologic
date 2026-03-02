import { db } from '../../../lib/turso/client';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
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

