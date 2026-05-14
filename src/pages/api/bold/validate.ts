import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client';

const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

const saveStatusPayment = async (userId: string, paymentId: string, amount: number, status: string) => {
  try {
    function isLeapYear(year: number): boolean {
      return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    const today = new Date();
    const daysInMonth = [31, isLeapYear(today.getFullYear()) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const actualDays = daysInMonth[today.getMonth()];

    const nextPaymentDate = new Date(today);
    nextPaymentDate.setDate(today.getDate() + actualDays);

    const blockedPaymentDate = new Date(nextPaymentDate);
    blockedPaymentDate.setDate(nextPaymentDate.getDate() + 5);

    await client.execute({
      sql: `INSERT INTO payments (paymentId, userId, amount, status, paymentDate, nextPaymentDate, blockedPaymentDate, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        paymentId,
        userId,
        amount,
        status,
        new Date().toISOString(),
        nextPaymentDate.toISOString(),
        blockedPaymentDate.toISOString(),
        new Date().toISOString()
      ]
    });
  } catch (error) {
    console.error('Error al guardar el estado de la transacción:', error);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { orderId, userId } = await request.json();

    if (!orderId || !userId) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros: orderId, userId' }), { status: 400 });
    }

    const BOLD_API_KEY = import.meta.env.BOLD_API_KEY;
    if (!BOLD_API_KEY) {
      return new Response(JSON.stringify({ error: 'API Key de Bold no configurada' }), { status: 500 });
    }

    // Consultar estado en Bold
    const res = await fetch(
      `https://payments.api.bold.co/v2/payment-voucher/${orderId}`,
      {
        headers: {
          'Authorization': `x-api-key ${BOLD_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await res.json();

    if (result.payment_status === 'NO_TRANSACTION_FOUND') {
      return new Response(JSON.stringify({ success: false, status: 'not_found', message: 'Transacción no encontrada' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const paymentStatus = String(result.payment_status || '').toUpperCase();
    const amount = parseFloat(String(result.total)) || 0;
    const transactionId = String(result.transaction_id || orderId);

    // Mapear estados de Bold a estados internos
    const statusMap: Record<string, string> = {
      'APPROVED': 'approved',
      'REJECTED': 'rejected',
      'PROCESSING': 'pending',
      'PENDING': 'pending',
      'FAILED': 'failed',
      'VOIDED': 'rejected',
    };

    const internalStatus = statusMap[paymentStatus] || 'unknown';

    // Guardar en BD solo si no existe ya un registro con este paymentId
    await saveStatusPayment(userId, transactionId, amount, internalStatus);

    if (paymentStatus === 'APPROVED') {
      await client.execute({
        sql: `UPDATE usuarios SET status = ? WHERE clerk_user_id = ?`,
        args: ['approved', userId]
      });

      try {
        await client.execute({
          sql: `UPDATE patientsClient SET membership_paid = 1, updated_at = ? WHERE userId = ?`,
          args: [new Date().toISOString(), userId]
        });
      } catch (err) {
        console.warn('No se encontró registro en patientsClient para este usuario.');
      }
    }

    return new Response(JSON.stringify({ success: true, status: internalStatus }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en bold/validate:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};
