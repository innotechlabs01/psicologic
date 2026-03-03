"use client";

import { useEffect, useState } from "react";

function formatLabel(str) {
  return str.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ClinicalViewModal({ entry, onClose }) {
  // Manejo de carga
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

  const clinicHistory = entry.clinicHistory ?? {};
  const generalSections = entry.sections?.General ?? {};

  let answers = {};
  try {
    const raw = typeof generalSections === "string"
      ? generalSections
      : JSON.stringify(generalSections);
    answers = JSON.parse(raw);
  } catch (error) {
    console.error("Error parsing sections:", error);
    answers = {};
  }

  const answerEntries = Object.entries(answers);

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 scale-in">

        {/* HEADER */}
        <div className="px-8 py-6 border-b bg-white dark:bg-gray-800 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ficha Clínica — {entry.name}</h1>
            <p className="text-sm text-gray-500 mt-1 italic">
              Registro creado el: {clinicHistory.created_at ? new Date(clinicHistory.created_at).toLocaleDateString() : 'Fecha no disponible'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 transition duration-150 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* BODY */}
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {answerEntries.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">No hay registros detallados</p>
              <p className="text-sm">Esta historia clínica no tiene respuestas grabadas aún.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {answerEntries.map(([key, obj]) => {
                const label = obj?.label ?? formatLabel(key);
                const value = obj?.value ?? "---";

                return (
                  <section
                    key={key}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition duration-200"
                  >
                    <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                      {label}
                    </h3>

                    <div className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap leading-relaxed font-medium">
                      {typeof value === "boolean"
                        ? (value ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Sí
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            No
                          </span>
                        ))
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

        {/* FOOTER */}
        <div className="px-8 py-5 border-t bg-white dark:bg-gray-800 flex justify-end sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="px-8 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:opacity-90 transition duration-150 shadow-lg"
          >
            Cerrar Vista
          </button>
        </div>
      </div>
    </div>
  );
}
