// src/components/Payment/js/PaymentStatus.tsx
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import type { PropsPaymentStatus } from 'src/constants';

export default function PaymentStatus({ orderId, userId, initialStatus }: PropsPaymentStatus) {
  const [status, setStatus] = useState<'loading' | 'approved' | 'rejected' | 'pending' | 'failed' | 'error'>('loading');
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (!orderId || orderId === 'undefined' || processed) return;

    // If we already have status from URL (bold-tx-status), use it directly
    if (initialStatus) {
      const statusMap: Record<string, 'approved' | 'rejected' | 'pending' | 'failed'> = {
        'approved': 'approved',
        'rejected': 'rejected',
        'pending': 'pending',
        'failed': 'failed',
      };
      const mappedStatus = statusMap[initialStatus.toLowerCase()] || 'error';
      
      // Save payment to database when we have URL status
      if (mappedStatus !== 'error' && userId) {
        fetch('/api/bold/save-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            orderId, 
            userId, 
            status: mappedStatus 
          })
        }).catch(saveError => {
          console.error('Error saving payment:', saveError);
        });
      }
      
      setStatus(mappedStatus);
      
      if (mappedStatus === 'approved') {
        toast.success('¡Tu pago ha sido aprobado exitosamente!');
      } else if (mappedStatus === 'pending') {
        toast.warning('Tu pago está siendo procesado.');
      } else {
        toast.error('Hubo un problema con tu pago.');
      }
      setProcessed(true);
      return;
    }

    const validatePayment = async () => {
      try {
        const res = await fetch('/api/bold/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, userId })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setStatus(data.status);
          if (data.status === 'approved') {
            toast.success('¡Tu pago ha sido aprobado exitosamente!');
          } else if (data.status === 'pending') {
            toast.warning('Tu pago está siendo procesado.');
          } else {
            toast.error('Hubo un problema con tu pago.');
          }
        } else {
          setStatus('error');
          toast.error('No se pudo validar la transacción.');
        }
      } catch (error) {
        console.error('Validation Error:', error);
        setStatus('error');
      } finally {
        setProcessed(true);
      }
    };

    validatePayment();
  }, [orderId, userId, processed, initialStatus]);

  if (!orderId || orderId === 'undefined') return null;

  const statusConfigs = {
    loading: {
      icon: <Loader2 className="size-8 text-indigo-500 animate-spin" />,
      title: 'Validando Transacción',
      description: 'Estamos verificando el estado de tu pago con Bold...',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-700 dark:text-indigo-300'
    },
    approved: {
      icon: <CheckCircle2 className="size-8 text-green-500" />,
      title: '¡Pago Aprobado!',
      description: 'Tu suscripción ha sido activada correctamente. Gracias por confiar en nosotros.',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300'
    },
    rejected: {
      icon: <XCircle className="size-8 text-red-500" />,
      title: 'Pago Rechazado',
      description: 'La transacción fue declinada. Por favor intenta de nuevo.',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-300'
    },
    pending: {
      icon: <Clock className="size-8 text-yellow-500" />,
      title: 'Pago Pendiente',
      description: 'Tu transacción está en proceso de validación. Te avisaremos pronto.',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-700 dark:text-yellow-300'
    },
    failed: {
      icon: <AlertTriangle className="size-8 text-orange-500" />,
      title: 'Transacción Fallida',
      description: 'El proceso de pago no pudo completarse. Por favor verifica tus datos.',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-700 dark:text-orange-300'
    },
    error: {
      icon: <AlertTriangle className="size-8 text-gray-500" />,
      title: 'Error de Validación',
      description: 'No pudimos conectar con el servicio de validación. Contacta a soporte.',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      textColor: 'text-gray-700 dark:text-gray-300'
    }
  };

  const config = statusConfigs[status] || statusConfigs.error;

  return (
    <div className={`mt-8 p-6 rounded-3xl border border-transparent transition-all duration-500 ${config.bgColor}`}>
      <div className="flex items-center gap-5">
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        <div>
          <h3 className={`text-lg font-bold ${config.textColor}`}>
            {config.title}
          </h3>
          <p className={`text-sm opacity-80 ${config.textColor}`}>
            {config.description}
          </p>
        </div>
      </div>
    </div>
  );
}
