'use client';

import { useEffect, useState } from "react";
import PdfViewer from "./PdfViewer";

export default function ClinicPdfModal({ entry, onClose }: { entry: any; onClose: () => void }) {
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    if (!entry?.id) return;

    // Generamos solo 1 URL estable
    const url = `/api/clinic_pdf/api?id=${entry.id}`;
    setPdfUrl(url);
  }, [entry]);

  if (!entry) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[94vh] flex flex-col relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex justify-between items-center">
          <h3 className="text-2xl font-bold">Ficha Clínica — {entry.name}</h3>
          <button onClick={onClose} className="text-4xl hover:text-red-300">×</button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden">
          {pdfUrl ? (
            <PdfViewer url={pdfUrl} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              Cargando PDF...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-100 border-t text-center">
          <a
            href={`/api/clinic_pdf?id=${entry.id}&download=1`}
            download
            className="inline-block px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
          >
            Descargar PDF
          </a>
        </div>
      </div>
    </div>
  );
}
