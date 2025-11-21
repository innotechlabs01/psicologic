import { createClient } from "@libsql/client";
import type { APIRoute } from 'astro';
// import { randomUUID } from "node:crypto";

const db = createClient({
    url: import.meta.env.TURSO_DATABASE_URL,
    authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

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

