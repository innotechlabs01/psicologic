// src/components/Toast/ToastRoot.tsx
import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componente cliente para asegurar que se renderice solo en el navegador
export default function ToastRoot() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Solo renderiza el ToastContainer en el cliente
  if (!isMounted) {
    return null;
  }

  return <ToastContainer position="top-right" autoClose={5000} />;
}
