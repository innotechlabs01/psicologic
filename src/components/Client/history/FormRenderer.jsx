import { useState } from "react";

export default function FormRenderer({ structure, templateId }) {
  const [values, setValues] = useState({});

  function onChange(id, value) {
    setValues(prev => ({ ...prev, [id]: value }));
  }

  async function save() {
    await fetch("/api/save-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId,
        answers: values
      })
    });

    alert("Guardado correctamente");
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Formulario</h1>

      {structure.components.map((c) => (
        <Field key={c.id} component={c} onChange={onChange} />
      ))}

      <button
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={save}
      >
        Guardar
      </button>
    </div>
  );
}

function Field({ component, onChange }) {
  switch (component.type) {
    case "text":
      return (
        <div>
          <label className="font-semibold">{component.label}</label>
          <input
            className="border p-2 w-full"
            type="text"
            onChange={(e) => onChange(component.id, e.target.value)}
          />
        </div>
      );

    case "checkbox":
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            onChange={(e) => onChange(component.id, e.target.checked)}
          />
          {component.label}
        </label>
      );

    default:
      return <div>Tipo no soportado: {component.type}</div>;
  }
}
