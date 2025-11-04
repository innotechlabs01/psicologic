// src/pages/api/epayCO/confirmacion.ts
import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client';

const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

const saveStatusPayment = async (userId: string, paymentId: string, amount: number, status: string) => {
  try {
    const nextPaymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); 
    const blockedPaymentDate = new Date(Date.now() + (30 + 5) * 24 * 60 * 60 * 1000); 

    await client.execute(
      `
        INSERT INTO payments (paymentId, userId, amount, status, paymentDate, nextPaymentDate, blockedPaymentDate, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        paymentId, // Usar un ID de transacción único
        userId,
        amount, // Monto 0 para la prueba
        status, // Estado inicial de prueba
        new Date(), // Fecha de inicio de la prueba
        nextPaymentDate,
        blockedPaymentDate,
        new Date()
      ]
    );
  } catch (error) {
    console.error('Error al actualizar el estado de la transacción:', error);
  }
}

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const data = Object.fromEntries(form.entries());

  console.log('📩 Confirmación ePayco recibida:', data);

  // Validar firma digital (opcional pero recomendado)
  const firmaEsperada = require('crypto')
    .createHash('md5')
    .update(
      `${import.meta.env.EPAYCO_P_KEY}~${data.x_cust_id_cliente}~${data.x_ref_payco}~${data.x_transaction_id}~${data.x_amount}~${data.x_currency_code}`
    )
    .digest('hex');

  if (firmaEsperada !== data.x_signature) {
    console.warn('⚠️ Firma inválida. Posible intento de manipulación.');
    return new Response('Firma inválida', { status: 403 });
  }

  // Aquí puedes actualizar el estado del pago en tu base de datos
  // según data.x_response (1 = Aceptada, 2 = Rechazada, 3 = Pendiente, 4 = Fallida)
  await saveStatusPayment(data.x_cust_id_cliente.toString(), data.x_transaction_id.toString(), 140000, data.x_response.toString());

  return new Response('OK', { status: 200 });
};
