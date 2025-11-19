// src/lib/react-pdf-shim.js
import * as pdf from 'react-pdf';

// Exporta los componentes como named exports para que Vite los vea felices
export const Document = pdf.Document;
export const Page = pdf.Page;
export const pdfjs = pdf.pdfjs;
export const PDFViewer = pdf.PDFViewer;  // ¡Este es el que te faltaba!
export const PDFDownloadLink = pdf.PDFDownloadLink;  // Bonus, si lo necesitas después