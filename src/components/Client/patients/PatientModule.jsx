"use client";

import { useState, useEffect, useCallback } from "react";
import ClinicPdfModal from "../pdf/PdfPreviewModal.tsx";
import ClinicalViewModal from "../history/modal/ClinicalViewModal.jsx";
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

export default function PatientModule({ clerkUserId }) {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({ name: "", document: "", email: "", phone: "" });

  const [templateStructure, setTemplateStructure] = useState(null);
  const [templateAnswers, setTemplateAnswers] = useState({});

  const [activeEntryView, setActiveEntryView] = useState(null);
  const [fullModalEntry, setFullModalEntry] = useState(null);

  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfEntry, setPdfEntry] = useState(null);

  // Estados para validación de template
  const [hasTemplate, setHasTemplate] = useState(null); // null = cargando, true/false
  const [templateData, setTemplateData] = useState(null);

  // Carga inicial y validación de template
  useEffect(() => {
    checkTemplate();
    loadPatients();
  }, [page, rowsPerPage, clerkUserId]);

  const checkTemplate = async () => {
    try {
      const res = await fetch(`/api/patients/template-default?id=${clerkUserId}`);
      const json = await res.json();
      if (json.ok) {
        setHasTemplate(true);
        setTemplateData(json);
      } else {
        setHasTemplate(false);
      }
    } catch (error) {
      console.error("Error checking template:", error);
      setHasTemplate(false);
    }
  };

  useEffect(() => {
    if (activeEntryView) {
      setFullModalEntry(null);

      async function loadEntryData() {
        try {
          const data = await fetchFullClinicalEntry(activeEntryView.id);
          setFullModalEntry({
            ...activeEntryView,
            ...data,
          });
        } catch (error) {
          console.error("Error al cargar la ficha clínica:", error);
          setActiveEntryView(null);
        }
      }
      loadEntryData();
    }
  }, [activeEntryView]);

  const loadPatients = useCallback(async () => {
    const res = await fetch(`/api/patients/patients?page=${page}&limit=${rowsPerPage}&userId=${clerkUserId}`);
    const json = await res.json();

    setPatients(json.data);
    setTotalPages(json.totalPages);
  }, [page, rowsPerPage, clerkUserId]);

  function filteredPatients() {
    return patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }

  async function saveNewPatient() {
    if (!hasTemplate) {
      showToast("Debes configurar un template antes de crear pacientes", "warning");
      window.location.href = "/client/settings/template";
      return;
    }

    try {
      const res = await fetch("/api/patients/patient-create", {
        method: "POST",
        body: JSON.stringify({ ...createData, clerkUserId }),
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Error al crear paciente");

      setSelectedPatient(json.id);
      setTemplateStructure(templateData);
      setShowCreateModal(false);
      showToast("Paciente creado. Complete la historia clínica.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  async function submitTemplate() {
    const saveEntity = {
      idPatients: selectedPatient,
      templateId: templateStructure.id,
      answers: templateAnswers,
    };

    try {
      const res = await fetch("/api/patients/save-entry", {
        method: "POST",
        body: JSON.stringify(saveEntity),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Error al guardar historia clínica");

      showToast("Historia clínica guardada correctamente", "success");
      await loadPatients();
      setTemplateStructure(null);
      setTemplateAnswers({});
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  const handleCloseViewModal = useCallback(() => {
    setActiveEntryView(null);
    setFullModalEntry(null);
  }, []);

  // Si no hay template, mostramos un aviso prominente
  if (hasTemplate === false) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-dashed border-gray-300">
        <div className="bg-indigo-100 p-4 rounded-full mb-4">
          <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Planilla no configurada</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
          Para comenzar a registrar historias clínicas, primero debes definir y activar una plantilla en la configuración del sistema.
        </p>
        <a
          href="/client/settings/template"
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
        >
          Configurar Plantilla
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 font-medium text-black dark:text-white dark:bg-gray-800">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            className="border p-2.5 pl-10 rounded-xl w-full focus:ring-2 focus:ring-indigo-500 outline-none transition"
            placeholder="Buscar paciente por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <button
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold flex items-center gap-2 shadow-md"
          onClick={() => setShowCreateModal(true)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Crear Paciente
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden border rounded-2xl shadow-sm bg-white dark:bg-gray-900">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-b">
            <tr>
              <th className="p-4 font-semibold">Paciente</th>
              <th className="p-4 font-semibold">Documento</th>
              <th className="p-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredPatients().length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500 italic">
                  No se encontraron pacientes registrados
                </td>
              </tr>
            ) : (
              filteredPatients().map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <td className="p-4 font-semibold text-gray-900 dark:text-white">
                    <div className="flex flex-col">
                      <span>{p.name}</span>
                      <span className="text-xs font-normal text-gray-500">{p.email}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{p.document || '---'}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition text-xs font-bold"
                      onClick={() => setActiveEntryView(p)}
                    >
                      Ver Historia
                    </button>
                    <button
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-lg transition text-xs font-bold"
                      onClick={async () => {
                        setPdfModalOpen(true);
                        const data = await fetchFullClinicalEntry(p.id);
                        setPdfEntry({ ...p, ...data });
                      }}
                    >
                      Descargar PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Mostrar</span>
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="border rounded-lg px-2 py-1 outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          <span>pacientes</span>
        </div>

        <div className="flex gap-2 items-center">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 border rounded-lg disabled:opacity-30 hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold">
            {page} de {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 border rounded-lg disabled:opacity-30 hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* CREATE PATIENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-8 space-y-6 shadow-2xl scale-in">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nuevo Paciente</h2>
              <p className="text-sm text-gray-500 mt-1">Ingresa los datos básicos para iniciar la historia clínica.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Nombre Completo</label>
                <input
                  className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Documento de Identidad</label>
                <input
                  className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  type="number"
                  placeholder="Ej: 12345678"
                  onChange={(e) => setCreateData({ ...createData, document: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                  <input
                    className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    type="email"
                    placeholder="juan@email.com"
                    onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Teléfono</label>
                  <input
                    className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    type="text"
                    placeholder="Ej: 3001234567"
                    onChange={(e) => setCreateData({ ...createData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2.5 text-gray-500 hover:text-gray-700 font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={saveNewPatient}
                className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE FORM MODAL */}
      {templateStructure && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-2xl shadow-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto scale-in">
            <div className="flex justify-between items-center border-b pb-4 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Registrar Historia Clínica</h2>
                <p className="text-sm text-gray-500">Paciente: {createData.name}</p>
              </div>
              <button onClick={() => setTemplateStructure(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {templateStructure?.structure?.components?.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">{field.label}</label>

                  {field.type === "text" && field.label.length <= 40 && (
                    <input
                      className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 transition"
                      placeholder={field.placeholder || "Escriba aquí..."}
                      onChange={(e) => setTemplateAnswers({ ...templateAnswers, [field.id]: e.target.value })}
                    />
                  )}

                  {(field.type === "textarea" || (field.type === "text" && field.label.length > 40) || field.type === "input") && (
                    <textarea
                      className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 transition min-h-[100px]"
                      placeholder={field.placeholder || "Detalle la información..."}
                      onChange={(e) => setTemplateAnswers({ ...templateAnswers, [field.id]: e.target.value })}
                    />
                  )}

                  {(field.type === "checkbox" || field.type === "bool") && (
                    <div className="flex gap-4">
                      {["Sí", "No"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setTemplateAnswers({ ...templateAnswers, [field.id]: opt === "Sí" })}
                          className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition ${templateAnswers[field.id] === (opt === "Sí")
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white dark:bg-gray-700 text-gray-600 border-gray-200 hover:border-indigo-300"
                            }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {field.type === "select" && (
                    <select
                      className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 transition"
                      onChange={(e) => setTemplateAnswers({ ...templateAnswers, [field.id]: e.target.value })}
                    >
                      <option value="">Seleccione una opción...</option>
                      {field.options?.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t font-bold">
              <button
                onClick={() => setTemplateStructure(null)}
                className="px-6 py-3 text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={submitTemplate}
                className="px-10 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
              >
                Guardar Historia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ENTRY MODAL */}
      {activeEntryView && (
        <ClinicalViewModal
          entry={fullModalEntry}
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
