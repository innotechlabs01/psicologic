// src/components/PaymentStatus.tsx
import { createClient } from '@libsql/client';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import type { PropsPaymentStatus } from 'src/constants';
import type { PaymentModel } from 'src/constants/interfaces';

const client = createClient({
  url: import.meta.env.PUBLIC_TURSO_DATABASE_URL,
  authToken: import.meta.env.PUBLIC_TURSO_AUTH_TOKEN,
});

const getPaymentStatus = (status: number): string => {
  const normalizedStatus = Math.trunc(status); // Convierte 1.0 → 1, 2.0 → 2, etc.

  switch (normalizedStatus) {
    case 1:
      return 'approved';
    case 2:
      return 'rejected';
    case 3:
      return 'pending';
    case 4:
      return 'canceled';
    default:
      return 'unknown';
  }
};

const saveStatusPayment = async (userId: string, paymentId: string, amount: number, status: number) => {
  try {

    let nextPaymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); 
    let blockedPaymentDate = new Date(Date.now() + (30 + 5) * 24 * 60 * 60 * 1000); 

    if (userId === "user_33QQtauDI314VtzXnGnZQPan2Cw" || userId === "user_33RoQhnBva6vjdOAXGuHVgxRQNl") {
      nextPaymentDate = new Date(Date.now() + 1360 * 24 * 60 * 60 * 1000); 
      blockedPaymentDate = new Date(Date.now() + (1360 + 5) * 24 * 60 * 60 * 1000); 
    }

    const statusPayment = getPaymentStatus(status);

    await client.execute(
      `
        INSERT INTO payments (paymentId, userId, amount, status, paymentDate, nextPaymentDate, blockedPaymentDate, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        paymentId, // Usar un ID de transacción único
        userId,
        amount, // Monto 0 para la prueba
        statusPayment, // Estado inicial de prueba
        new Date(), // Fecha de inicio de la prueba
        nextPaymentDate,
        blockedPaymentDate,
        new Date()
      ]
    );

    if(statusPayment === 'approved') {
      await client.execute(
        `
          update usuarios set status = ? where userId = ?
        `,
        ['active', userId]
      );
    }


  } catch (error) {
    console.error('Error al actualizar el estado de la transacción:', error);
  }
}

export default function PaymentStatus({ refPayco, userId }: PropsPaymentStatus) {
  const [estado, setEstado] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('Consultando estado de la transacción...');
  const [color, setColor] = useState('text-gray-600');
  const [icono, setIcono] = useState('⏳');

  useEffect(() => {
    if (!refPayco) return;
    
    if (!refPayco || refPayco === 'undefined') {
      toast.warning('La transacción está en proceso de validación.');
      return;
    }

    toast.info(`Consultando estado de la transacción #${refPayco}`);

    fetch(`https://secure.epayco.co/validation/v1/reference/${refPayco}`)
      .then(res => res.json())
      .then(async data => {
        const respuesta = data.data?.x_cod_response;
        const transaction = data.data?.x_transaction_id;
        setTransactionId(transaction);
        setEstado(respuesta);

        switch (respuesta) {
          case 1:
            await saveStatusPayment(userId ?? '', transaction ?? '', 140000, 1);
            setMensaje('¡Pago aprobado!');
            setColor('text-green-600');
            setIcono('✅');
            toast.success('Pago aprobado');
            break;
          case 2:
            await saveStatusPayment(userId ?? '', transaction ?? '', 140000, 2);
            setMensaje('Pago rechazado.');
            setColor('text-red-600');
            setIcono('❌');
            toast.error('Pago rechazado');
            break;
          case 3: 
            await saveStatusPayment(userId ?? '', transaction ?? '', 140000, 3);
            setMensaje('Pago pendiente de validación.');
            setColor('text-yellow-600');
            setIcono('⏳');
            toast.warning('Pago pendiente');
            break;
          case 4:
            await saveStatusPayment(userId ?? '', transaction ?? '', 140000, 4);
            setMensaje('Transacción fallida.');
            setColor('text-orange-600');
            setIcono('⚠️');
            toast.error('Transacción fallida');
            break;
          default:
            setMensaje('Estado desconocido.');
            setColor('text-gray-600');
            setIcono('🔍');
            toast.info('Estado desconocido');
        }
      })
      .catch(() => {
        toast.error('Error al consultar el estado del pago');
      });
  }, [refPayco]);

  if (!refPayco || refPayco === 'undefined') return null;

  return (
    <div></div>
  );
}
function uuidv4(): import("@libsql/client").InValue {
  throw new Error('Function not implemented.');
}

