'use client';

async function fetchClinicTemplate(entryId) {
  const response = await fetch(`/api/patients/search-template-patients`, {
    method: "POST",
    body: JSON.stringify({ id: entryId }),
    headers: { "Content-Type": "application/json" },
  });

  return await response.json();
}

export default async function ClinicalViewModal({ entry, onClose }) {
  if (!entry) return null;

  const data = await fetchClinicTemplate(entry.id);
  const sections = data.sections || {};

  let normalizedSections = {};

  if (Object.keys(sections).length === 1) {
    const onlyKey = Object.keys(sections)[0];

    normalizedSections = {
      "Información Registrada": sections[onlyKey]
    };
  } else {
    normalizedSections = sections;
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">

      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-fadeIn">

        {/* HEADER */}
        <header className="px-10 py-7 bg-gradient-to-r from-gray-50 to-gray-100 border-b flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Ficha Clínica — {entry.name}
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Registro creado el:{" "}
              {entry.created_at
                ? new Date(entry.created_at).toLocaleDateString()
                : "Fecha no disponible"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 transition p-3 rounded-full hover:bg-gray-200"
          >
            ✕
          </button>
        </header>

        {/* BODY */}
        <div className="p-10 max-h-[75vh] overflow-y-auto space-y-12 bg-gray-50">

          {Object.keys(normalizedSections).length === 0 && (
            <p className="text-center text-gray-500 italic">
              No hay información disponible para esta ficha clínica.
            </p>
          )}

          {Object.keys(normalizedSections).map((secName) => (
            <SectionBlock
              key={secName}
              title={secName}
              fields={normalizedSections[secName]}
            />
          ))}

        </div>

        {/* FOOTER */}
        <footer className="p-6 border-t flex justify-end bg-white">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-gray-900 text-white rounded-lg shadow hover:bg-gray-800 transition"
          >
            Cerrar Vista
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ----------------------------- SUBCOMPONENTES ----------------------------- */

function SectionBlock({ title, fields }) {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 border-l-4 border-indigo-600 pl-4">
        {title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        {fields.map((f) => (
          <FieldCard key={f.id} field={f} />
        ))}
      </div>
    </section>
  );
}

function FieldCard({ field }) {
  const { label, type, value, options } = field;

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">

      <h3 className="text-sm font-semibold text-indigo-700 tracking-wide uppercase mb-2 border-b pb-1">
        {label}
      </h3>

      <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
        {renderValue(type, value, options)}
      </div>
    </div>
  );
}

/* ---- Render inteligente según tipo ---- */
function renderValue(type, value, options) {
  if (value == null || value === "") {
    return <span className="text-gray-400 italic">Sin respuesta</span>;
  }

  switch (type) {
    case "boolean":
    case "checkbox":
      return value ? "Sí" : "No";

    case "select":
    case "radio":
      const opt = options?.find((o) => o.value === value);
      return opt ? opt.label : value;

    case "textarea":
      return <pre className="whitespace-pre-wrap">{value}</pre>;

    default:
      return value;
  }
}
