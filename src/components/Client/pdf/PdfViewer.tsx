'use client';

import { useState } from "react";
import { Document, Page, pdfjs } from "../../../lib/react-pdf-shim.js";

pdfjs.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function PdfViewer({ url }: { url: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [numPages, setNumPages] = useState(0);

  return (
    <div className="w-full h-full overflow-auto bg-gray-100 p-4">
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-10 text-gray-600">
          <div className="animate-spin h-8 w-8 border-4 border-gray-400 border-t-transparent rounded-full mb-4"></div>
          <p className="text-lg font-medium">Cargando PDF...</p>
        </div>
      )}

      <Document
        file={url}
        loading={<></>}
        onLoadSuccess={({ numPages }: { numPages: number }) => {
          setNumPages(numPages);
          setIsLoading(false);
        }}
        onLoadError={(err: Error) => {
          console.error("Error cargando PDF:", err);
          setIsLoading(false);
        }}
      >
        {!isLoading &&
          Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i}
              pageNumber={i + 1}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              width={900}
              className="shadow-lg mb-6 mx-auto bg-white"
            />
          ))}
      </Document>
    </div>
  );
}
