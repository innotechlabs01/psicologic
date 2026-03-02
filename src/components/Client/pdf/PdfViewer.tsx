'use client';

import { useState } from "react";
import { pdfjs } from "../../../lib/react-pdf-shim.js";
import { Document as Doc, Page as PageDoc } from "@htmldocs/react";

pdfjs.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function PdfViewer({ url }: { url: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [numPages, setNumPages] = useState(0);

  return (
    <div className="w-full h-full overflow-auto bg-muted p-4">
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
          <div className="animate-spin h-8 w-8 border-4 border-gray-400 border-t-transparent rounded-full mb-4"></div>
          <p className="text-lg font-medium">Cargando PDF...</p>
        </div>
      )}

      <Doc
        size="A4"
        orientation="portrait"
      >
        {!isLoading &&
          Array.from({ length: numPages }, (_, i) => (
            <PageDoc
              key={i}
              className="shadow-lg mb-6 mx-auto bg-card"
            >
              <h1>My Document Title</h1>
              <p>This is the content of my first page.</p>
            </PageDoc>
          ))}
      </Doc>
    </div>
  );
}
