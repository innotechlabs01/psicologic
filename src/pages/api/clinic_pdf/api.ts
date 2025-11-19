// @ts-ignore
import PDFDocument from "pdfkit";

export const dynamic = "force-node";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const download = searchParams.get("download");

    if (!id) {
      return Response.json(
        { error: "ID de paciente inválido o faltante" },
        { status: 400 }
      );
    }

    // Buscar paciente
    const patientRes = await fetch(
      `${process.env.BASE_PATH}/api/patients/search-template-patients`,
      {
        method: "POST",
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );

    if (!patientRes.ok) {
      return Response.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

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
        "Content-Type": "application/pdf",
        "Content-Length": pdfBuffer.length.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename=HistoriaClinica-${id}.pdf`,
      },
    });

  } catch (error: any) {
    return Response.json(
      { error: error.message || "Error generando PDF" },
      { status: 500 }
    );
  }
}
