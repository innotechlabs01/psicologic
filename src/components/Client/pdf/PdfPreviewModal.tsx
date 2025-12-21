export default function ClinicPdfModal({ entry, onClose }) {
  if (!entry?.id) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[94vh] rounded-2xl shadow-2xl flex flex-col">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex justify-between items-center">
          <h2 className="font-bold text-lg">
            Ficha Clínica — {entry.name}
          </h2>
          <button onClick={onClose} className="text-2xl">×</button>
        </div>

        {/* PDF */}
        <div className="flex-1 bg-gray-100">
          <iframe
            src={`/api/clinic_pdf/api?id=${entry.id}`}
            className="w-full h-full"
            style={{ border: 'none' }}
            title="PDF Ficha Clínica"
          />
        </div>

        {/* FOOTER */}
        <div className="border-t p-4 flex justify-center">
          <a
            href={`/api/clinic_pdf?id=${entry.id}&download=1`}
            className="bg-green-600 text-white px-6 py-2 rounded-lg"
          >
            Descargar PDF
          </a>
        </div>

      </div>
    </div>
  );
}
