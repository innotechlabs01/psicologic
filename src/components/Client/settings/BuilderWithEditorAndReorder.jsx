/*
BuilderWithEditorAndReorder.jsx
React (native HTML5 drag & drop) + Tailwind version

Hecho para evitar problemas de bundling/ESM con librerías externas (ej. @dnd-kit, zustand, nanoid) —
esta versión usa APIs nativas de drag & drop para:
  - Arrastrar desde la paleta al lienzo (palette -> canvas)
  - Reordenar dentro del lienzo (drag sobre items)

Ventajas:
  - Más compatible con entornos como Astro donde a veces hay problemas con ESM bundling
  - Fácil de entender y depurar

Instalación (project root):
  - No requiere librerías adicionales para que funcione esta versión.
  - Solo asegúrate de tener Tailwind configurado en tu proyecto Astro para que las clases funcionen.

Cómo usar:
  - Guarda este archivo en: src/components/Builder/BuilderWithEditorAndReorder.jsx
  - En tu página Astro (por ejemplo src/pages/builder.astro) importa y usa el componente como React Island:
      ---
      import Builder from '../components/Builder/BuilderWithEditorAndReorder.jsx'
      ---
      <Builder />

Notas:
  - Si quieres integración con TursoDB, puedo generar también el endpoint /api/save según tu stack (Astro server route).
  - Si prefieres volver a la versión con @dnd-kit y zustand, puedo ayudarte a ajustar la configuración de bundler.

*/

import React, { useEffect, useMemo, useRef, useState } from 'react';

// -------------------- Helpers --------------------
function genId(prefix = 'c') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}

function moveItem(arr, fromIndex, toIndex) {
  const copy = arr.slice();
  const [item] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, item);
  return copy;
}

// -------------------- Palette --------------------
const PALETTE = [
  { type: 'text', label: 'Texto (label)' },
  { type: 'input', label: 'Input' },
  { type: 'checkbox', label: 'Checkbox' },
  { type: 'select', label: 'Select' },
];

function PaletteItem({ item }) {
  return (
    <div
      className="cursor-grab select-none rounded-md border p-2 mb-2 bg-white hover:shadow"
      draggable
      onDragStart={(e) => {
        // Payload for creating a new component
        e.dataTransfer.setData('application/builder-item', JSON.stringify({ type: item.type }));
        // set effect
        e.dataTransfer.effectAllowed = 'copy';
      }}
    >
      {item.label}
    </div>
  );
}

// -------------------- Main Builder --------------------
export default function BuilderWithEditorAndReorder() {
  // components: array of { id, type, label, placeholder, options }
  const [components, setComponents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const canvasRef = useRef(null);

  // Add a new component of given type
  function addComponent(type) {
    const base = {
      id: genId('comp'),
      type,
      label: type === 'text' ? 'Texto' : type === 'input' ? 'Entrada' : type === 'checkbox' ? 'Checkbox' : 'Select',
      placeholder: type === 'input' ? 'Escribe aquí...' : '',
      options: type === 'select' ? ['Opción 1', 'Opción 2'] : [],
    };
    setComponents((s) => [...s, base]);
    // select newly added
    setSelectedId(base.id);
  }

  // Update component by id
  function updateComponent(id, patch) {
    setComponents((s) => s.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeComponent(id) {
    setComponents((s) => s.filter((c) => c.id !== id));
    setSelectedId((sid) => (sid === id ? null : sid));
  }

  // Native drop handlers for the canvas area
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    function onDragOver(e) {
      e.preventDefault();
      // allow drop
      e.dataTransfer.dropEffect = 'copy';
    }

    function onDrop(e) {
      e.preventDefault();
      try {
        const raw = e.dataTransfer.getData('application/builder-item');
        if (raw) {
          const payload = JSON.parse(raw);
          if (payload?.type) {
            addComponent(payload.type);
            return;
          }
        }

        // If not a palette drop, maybe it's a reorder drop (we handle reorder on items)
      } catch (err) {
        // ignore
      }
    }

    el.addEventListener('dragover', onDragOver);
    el.addEventListener('drop', onDrop);

    return () => {
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('drop', onDrop);
    };
  }, []);

  // ---------- Reordering with native DnD ----------
  // We'll use dataTransfer with type 'application/builder-reorder' and payload { id }
  function handleItemDragStart(e, id) {
    e.dataTransfer.setData('application/builder-reorder', id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleItemDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleItemDrop(e, targetIndex) {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('application/builder-reorder');
    if (!draggedId) return;
    const fromIndex = components.findIndex((c) => c.id === draggedId);
    if (fromIndex === -1) return;
    const toIndex = targetIndex;
    if (fromIndex === toIndex) return;
    setComponents((s) => moveItem(s, fromIndex, toIndex));
  }

  // ---------- Inspector UI ----------
  const selectedComp = useMemo(() => components.find((c) => c.id === selectedId), [components, selectedId]);

  // Save action (calls server endpoint)
  async function saveForm() {
    try {
      const res = await fetch('/api/settings/template/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Historia Clínica', structure: { components } }),
      });
      if (!res.ok) throw new Error('Error saving');
      const data = await res.json();
      window.alert('Guardado con id: ' + (data.id || 's/n'));
    } catch (err) {
      window.alert('Error guardando: ' + (err?.message || String(err)));
    }
  }

  function clearAll() {
    if (!confirm('¿Eliminar todos los componentes?')) return;
    setComponents([]);
    setSelectedId(null);
  }

  // Quick load example
  function loadExample() {
    setComponents([
      { id: genId('comp'), type: 'text', label: 'Motivo de consulta' },
      { id: genId('comp'), type: 'input', label: 'Nombre', placeholder: 'Nombres completos' },
      { id: genId('comp'), type: 'checkbox', label: '¿Alergias?' },
    ]);
    setSelectedId(null);
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Template - Historias Clínicas</h2>
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-white border rounded" onClick={() => addComponent('text')}>+ Texto</button>
          <button className="px-3 py-2 bg-white border rounded" onClick={() => addComponent('input')}>+ Input</button>
          <button className="px-3 py-2 bg-white border rounded" onClick={() => addComponent('checkbox')}>+ Checkbox</button>
          <button className="px-3 py-2 bg-white border rounded" onClick={() => addComponent('select')}>+ Select</button>
          <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={saveForm}>Guardar</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-3">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-3">Componentes</h3>
            {PALETTE.map((p) => (<PaletteItem key={p.type} item={p} />))}

            <div className="mt-4 border-t pt-4">
              <h4 className="text-sm font-medium">Acciones</h4>
              <button className="mt-2 w-full px-3 py-2 border rounded" onClick={clearAll}>Limpiar</button>
              <button className="mt-2 w-full px-3 py-2 border rounded" onClick={loadExample}>Cargar ejemplo</button>
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <main className="col-span-6">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold mb-3">Lienzo</h3>

            <div ref={canvasRef} className="p-4 rounded-md border-dashed border-2 border-gray-200 min-h-[300px] bg-gray-50">
              {components.length === 0 && (
                <div className="text-center text-gray-400 py-16">Arrastra componentes desde la izquierda o haz click en "+ Añadir"</div>
              )}

              <div className="space-y-3">
                {components.map((c, idx) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={(e) => handleItemDragStart(e, c.id)}
                    onDragOver={handleItemDragOver}
                    onDrop={(e) => handleItemDrop(e, idx)}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(c.id); }}
                    className={`flex items-start gap-3 p-3 rounded-md border bg-white hover:shadow cursor-move ${selectedId === c.id ? 'ring-2 ring-indigo-400' : ''}`}
                  >
                    <div className="w-full">
                      <div className="text-sm text-gray-600">{c.type.toUpperCase()} — <span className="font-mono text-xs">{c.id}</span></div>
                      <div className="mt-2">
                        {c.type === 'text' && <div className="text-base">{c.label}</div>}
                        {c.type === 'input' && (
                          <input className="w-full border rounded p-2" placeholder={c.placeholder} disabled />
                        )}
                        {c.type === 'checkbox' && (
                          <label className="inline-flex items-center gap-2"><input type="checkbox" disabled /> {c.label}</label>
                        )}
                        {c.type === 'select' && (
                          <select className="w-full border rounded p-2" disabled>
                            {c.options.map((o, i) => (<option key={i}>{o}</option>))}
                          </select>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">☰</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>

        {/* Inspector */}
        <aside className="col-span-3">
          <div className="bg-white rounded shadow p-4 sticky top-6">
            {!selectedComp && (
              <div>
                <h4 className="font-semibold">Inspector</h4>
                <p className="text-sm text-gray-500">Selecciona un componente para editar sus propiedades</p>
              </div>
            )}

            {selectedComp && (
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold">Inspector</h4>
                  <button className="text-red-600 text-sm" onClick={() => removeComponent(selectedComp.id)}>Eliminar</button>
                </div>

                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500">Label</label>
                    <input value={selectedComp.label} onChange={(e) => updateComponent(selectedComp.id, { label: e.target.value })} className="w-full border rounded p-2" />
                  </div>

                  {selectedComp.type === 'input' && (
                    <div>
                      <label className="block text-xs text-gray-500">Placeholder</label>
                      <input value={selectedComp.placeholder} onChange={(e) => updateComponent(selectedComp.id, { placeholder: e.target.value })} className="w-full border rounded p-2" />
                    </div>
                  )}

                  {selectedComp.type === 'select' && (
                    <div>
                      <label className="block text-xs text-gray-500">Opciones (separadas por coma)</label>
                      <input value={selectedComp.options.join(', ')} onChange={(e) => updateComponent(selectedComp.id, { options: e.target.value.split(',').map(s => s.trim()) })} className="w-full border rounded p-2" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-gray-500">ID</label>
                    <div className="font-mono text-sm p-2 border rounded bg-gray-50">{selectedComp.id}</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </aside>
      </div>
    </div>
  );
}
