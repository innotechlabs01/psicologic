"use client";

import { useState, useEffect, useCallback } from "react";
import ClinicPdfModal from "../pdf/PdfPreviewModal.tsx";

import { showToast } from "../../../utils/toast";

function formatLabel(str) {
  return str.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// FUNCIÓN AUXILIAR DE CARGA DE DATOS COMPLETOS
async function fetchFullClinicalEntry(clinicalEntryId) {
  const response = await fetch(`/api/patients/search-template-patients`,
    {
      method: "POST",
      body: JSON.stringify({ id: clinicalEntryId }),
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(`Failed to fetch clinical data. Status: ${response.status}. Detail: ${errorBody.message || 'Check network tab.'}`);
  }
  return await response.json();
}

// Componente ClinicalViewModal (Integrado)
function ClinicalViewModal({ entry, onClose }) {

  // Si 'entry' es null o undefined (mientras se carga), mostramos un estado de carga.
  if (!entry) {
    return (
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="text-white text-xl flex items-center space-x-3">
          <svg className="animate-spin h-6 w-6 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Cargando historia clínica...</span>
        </div>
      </div>
    );
  }

  // Obtener historial clínico y secciones generales de forma segura.
  const clinicHistory = entry.clinicHistory ?? {};
  const generalSections = entry.sections?.General ?? {};

  // Intentar parsear las respuestas del JSON, con fallback seguro.
  let answers = {};

  try {
    // generalSections puede ser string JSON o un objeto
    const raw = typeof generalSections === "string"
      ? generalSections
      : JSON.stringify(generalSections);

    answers = JSON.parse(raw);

  } catch (error) {
    console.error("No se pudo convertir 'generalSections' a JSON válido:", error);
    answers = {}; // fallback seguro si falla el parseo
  }

  // Convertir el objeto de respuestas en pares [clave, valor]
  const answerEntries = Object.entries(answers);

  return (
    // Overlay y Fondo
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">

      {/* Contenedor del Modal - Estilo de Ficha Técnica */}
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden animate-fadeIn border border-gray-100">

        {/* Encabezado Principal */}
        <div className="px-8 py-5 border-b bg-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900">Ficha Clínica — {entry.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Registro creado el: {clinicHistory.created_at ? new Date(clinicHistory.created_at).toLocaleDateString() : 'Fecha no disponible'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-2 transition duration-150 rounded-full hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cuerpo de la Historia Clínica - Scrollable */}
        <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto bg-gray-50">
          {answerEntries.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p>No hay respuestas registradas para esta entrada o el formato es incorrecto.</p>
              <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-xs text-left overflow-x-auto">
                Datos brutos del paciente: {JSON.stringify(entry, null, 2)}
              </pre>
            </div>
          ) : (
            // Contenedor de las Secciones/Respuestas
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {answerEntries.map(([key, obj]) => {
                // obj = { label, type, value }
                const label = obj?.label ?? formatLabel(key);
                const value = obj?.value ?? "Sin respuesta";

                return (
                  <section
                    key={key}
                    className="bg-white border border-gray-200 rounded-lg p-5 shadow-md hover:shadow-lg transition duration-200"
                  >
                    {/* Título */}
                    <h3 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2 border-b pb-1">
                      {label}
                    </h3>

                    {/* Contenido */}
                    <div className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                      {typeof value === "boolean"
                        ? value ? "Sí" : "No"
                        : typeof value === "object"
                          ? JSON.stringify(value, null, 2)
                          : value}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

        </div>

        {/* Pie de Página */}
        <div className="px-8 py-4 border-t bg-white flex justify-end sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-700 transition duration-150 shadow-md"
          >
            Cerrar Vista
          </button>
        </div>
      </div>
    </div>
  );
}
// --- End ClinicalViewModal Component ---


export default function PatientModule({ clerkUserId }) {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPreviewModalPDF, setShowPreviewModalPDF] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({ name: "", document: "", email: "", phone: "" });

  const [templateStructure, setTemplateStructure] = useState(null);
  const [templateAnswers, setTemplateAnswers] = useState({});

  // 1. Estado para el paciente seleccionado (activador de la vista)
  const [activeEntryView, setActiveEntryView] = useState(null);
  // 2. Nuevo estado para los datos COMPLETOS de la ficha, cargados de la API.
  const [fullModalEntry, setFullModalEntry] = useState(null);

  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfEntry, setPdfEntry] = useState(null);

  // Carga inicial de pacientes
  useEffect(() => {
    loadPatients();
  }, [page, rowsPerPage, clerkUserId]);

  useEffect(() => {
    if (activeEntryView) {
      // Establecer fullModalEntry a null para que el modal muestre el loading
      setFullModalEntry(null);

      async function loadEntryData() {
        try {
          // Cargar los datos completos de la API
          const data = await fetchFullClinicalEntry(activeEntryView.id);

          // Combinar los datos básicos (name, etc.) con los datos clínicos (clinicHistory)
          setFullModalEntry({
            ...activeEntryView,
            ...data,
          });
        } catch (error) {
          console.error("Error al cargar la ficha clínica:", error);
          // Si falla, cerramos la vista.
          setActiveEntryView(null);
        }
      }
      loadEntryData();
    }
  }, [activeEntryView]);

  const loadPatients = useCallback(async () => {
    // Usamos useCallback y pasamos clerkUserId como dependencia para evitar advertencias
    const res = await fetch(`/api/patients/patients?page=${page}&limit=${rowsPerPage}&userId=${clerkUserId}`);
    const json = await res.json();

    setPatients(json.data);
    setTotalPages(json.totalPages);
  }, [page, rowsPerPage, clerkUserId]);

  function filteredPatients() {
    return patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }

  async function generatePDF(patientId) {
    try {
      const response = await fetch(`/api/pdf?id=${patientId}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("No se pudo generar el PDF");
      }

      // Convertimos la respuesta en un blob
      const blob = await response.blob();

      // Creamos una URL temporal
      const url = window.URL.createObjectURL(blob);

      // Abrir en una nueva pestaña
      window.open(url, "_blank");

      // Si quieres provocar descarga automática, descomenta:
      // const a = document.createElement("a");
      // a.href = url;
      // a.download = `HistoriaClinica-${patientId}.pdf`;
      // a.click();

    } catch (err) {
      console.error("Error generando PDF:", err);
    }
  }


  async function saveNewPatient() {
    const tRes = await fetch(`/api/patients/template-default?id=${clerkUserId}`);
    const tJson = await tRes.json();

    if (!tJson.ok) {
      setShowCreateModal(false);
      showToast(`${tJson.message}`, 'error')
      return null // 👈 corta el flujo
    }

    // Lógica de guardar paciente y obtener template... (sin cambios)
    const res = await fetch("/api/patients/patient-create", {
      method: "POST",
      body: JSON.stringify({ ...createData, clerkUserId }),
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();

    setSelectedPatient(json.id);
    setTemplateStructure(tJson);
    setShowCreateModal(false);
  }

  async function submitTemplate() {
    // Lógica de envío de plantilla... (sin cambios)
    const saveEntity = {
      idPatients: selectedPatient,
      templateId: templateStructure.id,
      answers: templateAnswers,
    };

    await fetch("/api/patients/save-entry", {
      method: "POST",
      body: JSON.stringify(saveEntity),
      headers: { "Content-Type": "application/json" },
    });

    await loadPatients();
    setTemplateStructure(null);
  }

  // Función para cerrar el modal de vista
  const handleCloseViewModal = useCallback(() => {
    setActiveEntryView(null);
    setFullModalEntry(null);
  }, []);

  function renderTemplateForm() {
    if (!templateStructure?.structure?.components) return null;

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 ">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <h2 className="text-xl font-semibold ">Historia Clínica</h2>

          {templateStructure?.structure?.components?.map((field) => (
            <div key={field.id} className="space-y-1">
              <label className="font-medium text-gray-700">{field.label}</label>

              {field.type === "text" && (
                <input
                  className="border p-2 rounded w-full"
                  onChange={(e) => setTemplateAnswers({ ...templateAnswers, [field.id]: e.target.value })}
                />
              )}

              {field.type === "textarea" && (
                <textarea
                  className="border p-2 rounded w-full"
                  onChange={(e) => setTemplateAnswers({ ...templateAnswers, [field.id]: e.target.value })}
                />
              )}

              {field.type === "bool" && (
                <select
                  className="border p-2 rounded w-full"
                  onChange={(e) =>
                    setTemplateAnswers({ ...templateAnswers, [field.id]: e.target.value === "true" })
                  }
                >
                  <option value="">Seleccione…</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3">
            <button onClick={() => setTemplateStructure(null)} className="px-4 py-2 bg-gray-600 text-white rounded">
              Cancelar
            </button>
            <button onClick={submitTemplate} className="px-4 py-2 bg-blue-600 text-white rounded">
              Guardar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 font-medium text-black dark:text-white dark:bg-gray-800">
      <div className="flex items-center gap-4">
        <input
          className="border p-2 rounded w-64"
          placeholder="Buscar paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => setShowCreateModal(true)}
        >
          Crear
        </button>
      </div>

      {/* TABLE */}
      <table className="w-full border mt-6 text-sm font-medium text-black dark:text-white dark:bg-gray-800">
        <thead>
          <tr className="bg-gray-100 text-left font-medium text-black dark:text-white dark:bg-gray-800">
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border w-40">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredPatients().length === 0 ? (
            // ⬇️ Caso 1: Array vacío (length es 0)
            <tr>
              <td colSpan={2} className="border p-2 text-center">
                **No se encontraron pacientes**
              </td>
            </tr>
          ) : (
            // ⬇️ Caso 2: Array con datos (length > 0)
            filteredPatients().map((p) => (
              <tr key={p.id}>
                <td className="border p-2">{p.name}</td>
                <td className="border p-2 flex gap-2">
                  <button
                    className="px-2 py-1 bg-gray-900 text-white rounded"
                    // Al hacer clic, establecemos el paciente básico. El useEffect se encarga de cargar los datos completos.
                    onClick={() => setActiveEntryView(p)}
                  >
                    Vista
                  </button>
                  <button
                    className="px-2 py-1 bg-blue-600 text-white rounded"
                    onClick={async () => {
                      setPdfModalOpen(true);
                      // Cargar los datos completos si no los tienes
                      const data = await fetchFullClinicalEntry(p.id);
                      setPdfEntry({ ...p, ...data });
                    }}
                  >
                    PDF
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex gap-4 mt-4 items-center">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded">
          Prev
        </button>
        <span>
          Página {page} / {totalPages}
        </span>
        <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded">
          Next
        </button>

        <select
          value={rowsPerPage}
          onChange={(e) => setRowsPerPage(Number(e.target.value))}
          className="ml-4 border p-1 rounded"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 ">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl  font-medium text-black dark:text-white dark:bg-gray-800">
            <h2 className="text-xl font-semibold">Crear Paciente</h2>

            <input
              className="border p-2 rounded w-full"
              placeholder="Nombre"
              type="text"
              required
              onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
            />

            <input
              className="border p-2 rounded w-full"
              placeholder="Documento"
              type="number"
              required
              onChange={(e) => setCreateData({ ...createData, document: e.target.value })}
            />

            <input
              className="border p-2 rounded w-full"
              placeholder="Email"
              type="email"
              required
              onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
            />

            <input
              className="border p-2 rounded w-full"
              placeholder="Teléfono"
              type="number"
              required
              onChange={(e) => setCreateData({ ...createData, phone: e.target.value })}
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-600 text-white rounded">
                Cancelar
              </button>
              <button onClick={saveNewPatient} className="px-4 py-2 bg-blue-600 text-white rounded">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE FORM */}
      {renderTemplateForm()}

      {/* VIEW ENTRY MODAL */}
      {activeEntryView && (
        <ClinicalViewModal
          // Pasamos los datos completos que pueden ser NULL mientras se carga
          entry={fullModalEntry}
          // Usamos el handler para cerrar
          onClose={handleCloseViewModal}
        />
      )}

      {/* PDF PREVIEW MODAL */}
      {pdfModalOpen && pdfEntry && (
        <ClinicPdfModal
          entry={pdfEntry}
          onClose={() => {
            setPdfModalOpen(false);
            setPdfEntry(null);
          }}
        />
      )}
    </div>
  );
}
