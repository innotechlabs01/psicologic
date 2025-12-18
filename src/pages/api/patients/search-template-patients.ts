import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client';

const db = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

// Tipo para que TS no se queje
type SectionMap = Record<string, {
  id: string;
  label: string;
  type: string;
  options: any[];
  value: any;
}[]>;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { id } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing clinical entry ID" }), { status: 400 });
    }

    // 1. Buscar entrada clínica
    const entryRes = await db.execute({
      sql: "SELECT * FROM clinical_entries WHERE id = ?",
      args: [id],
    });

    const clinicHistory = entryRes.rows?.[0] || null;

    if (!clinicHistory) {
      return new Response(JSON.stringify({ error: "Entry not found" }), { status: 404 });
    }

    // 2. Buscar template asociado
    let templateRaw = null;
    if (clinicHistory.template_id) {
      const templateRes = await db.execute({
        sql: "SELECT template FROM template_history WHERE id = ?",
        args: [clinicHistory.template_id],
      });

      templateRaw = templateRes.rows?.[0]?.template || null;
    }

    if (!templateRaw || templateRaw === null) {
      return new Response(JSON.stringify({ error: "Template no encontrado." }), { status: 404 });
    }

    // 3. Parsear template + answers
    let template: any = null;
    let answers: any = {};

    try { template = templateRaw ? JSON.parse(templateRaw.toString()) : null; } catch { }
    try { answers = clinicHistory.answers ? JSON.parse(clinicHistory.answers.toString()) : {}; } catch { }

    // 4. Construir las secciones tipadas
    const sections: SectionMap = {};

    if (template?.components) {
      for (const comp of template.components) {
        const sec = comp.section || "General";

        if (!sections[sec]) sections[sec] = [];

        sections[sec].push({
          id: comp.id,
          label: comp.label,
          type: comp.type,
          options: comp.options || [],
          value: answers?.[comp.id] ?? null,
        });
      }
    }

    return new Response(JSON.stringify({
      clinicHistory,
      template,
      sections,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("API Error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
