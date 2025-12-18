'use client';

import { View } from "lucide-react";
import { useEffect, useState } from "react";
// ✅ NUEVA IMPORTACIÓN: Usamos la librería estándar react-pdf
import { Document, Page, Text, StyleSheet } from '@react-pdf/renderer';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

export default function ClinicPdfModal({ entry, onClose }: { entry: any; onClose: () => void }) {

  const [pdfUrl, setPdfUrl] = useState("");
  const [numPages, setNumPages] = useState<number | null>(null);

  useEffect(() => {
    if (!entry?.id) return;

    // Aquí cargas tu PDF
    const url = `/api/clinic_pdf?id=${entry.id}`;
    setPdfUrl(url);
    console.log("PDF URL SOLICITADA:", url); // <-- ¡Agrega esto!
  }, [entry]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const styles = StyleSheet.create({
    page: { backgroundColor: 'tomato' },
    section: { color: 'white', textAlign: 'center', margin: 30 }
  });

  if (!entry) return null;

  // Creamos un array para renderizar todas las páginas
  const pages = Array.from({ length: numPages || 0 }, (_, index) => (
    <Page
      key={`page_${index + 1}`}
      pageNumber={index + 1}
      width={800} // Puedes ajustar el ancho para que quepa en el modal
      className="mb-4 shadow-lg border border-gray-200"
    />
  ));

  const MyDocument = () => (
    <Document>
      <Page size="A4" style={{ backgroundColor: 'tomato' }}>
        <View style={{ color: 'white', textAlign: 'center', margin: 30 }}>
          <Text>Section #1</Text>
        </View>
      </Page>
    </Document>
  );


  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[94vh] flex flex-col relative">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex justify-between items-center">
          <h3 className="text-2xl font-bold">Ficha Clínica — {entry.name}</h3>
          <button onClick={onClose} className="text-4xl hover:text-red-300">×</button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto p-4 flex justify-center">
          {pdfUrl ? (
            <MyDocument />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              Cargando URL del PDF...
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
