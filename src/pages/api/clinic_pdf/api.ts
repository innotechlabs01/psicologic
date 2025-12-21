// @ts-ignore
import type { APIRoute } from "astro";
import PDFDocument from "pdfkit";

export const dynamic = "force-node";

export const GET: APIRoute = async ({ request }) => {
  try {

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const download = searchParams.get("download");

    if (!id) {
      return Response.json(
        { error: "ID de paciente inválido o faltante" },
        { status: 400 }
      );
    }

    const apiUrl = new URL(
      '/api/patients/search-template-patients',
      request.url
    );

    // Buscar paciente
    const patientRes = await fetch(apiUrl.toString(), {
      method: "POST",
      body: JSON.stringify({ id }),
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    // 💡 MEJORA: Manejar respuesta fallida antes de intentar parsear a JSON
    if (!patientRes.ok) {
      console.error("PDF GENERATION ERROR:", patientRes); // <-- ¡Agrega esto!
      return Response.json(
        { error: `Error al buscar paciente. Código: ${patientRes.status}` },
        { status: patientRes.status }
      );
    }

    console.log('Salio del res y tiene la informacion para jacer el json')

    const patientData = await patientRes.json();

    // GENERAR PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    // CONTENIDO PDF
    doc.fontSize(20).text(`Ficha Clínica — ${patientData.name}`, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(
      `Creado: ${patientData.clinicHistory?.created_at ?? "No disponible"}`
    );
    doc.moveDown();

    const sections = patientData.sections?.General || {};
    for (const [key, obj] of Object.entries(sections)) {
      const label = (obj as any)?.label || key;
      const value = (obj as any)?.value || "Sin respuesta";

      doc.fontSize(14).text(label);
      doc.fontSize(12).text(
        typeof value === "object"
          ? JSON.stringify(value, null, 2)
          : value
      );
      doc.moveDown();
    }

    doc.end();

    const pdfBuffer = await pdfPromise;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="HistoriaClinica.pdf"',
        'Cache-Control': 'no-store',
      },
    });

  } catch (error: any) {
    console.error("PDF GENERATION ERROR:", error); // <-- ¡Agrega esto!
    return Response.json(
      { error: error.message || "Error generando PDF" },
      { status: 500 }
    );
  }
}
