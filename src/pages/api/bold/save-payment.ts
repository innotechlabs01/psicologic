import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client';

const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

const calculateNextPaymentDates = () => {
  const today = new Date();
  const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };
  const daysInMonth = [31, isLeapYear(today.getFullYear()) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const actualDays = daysInMonth[today.getMonth()];

  const nextPaymentDate = new Date(today);
  nextPaymentDate.setDate(today.getDate() + actualDays);

  const blockedPaymentDate = new Date(nextPaymentDate);
  blockedPaymentDate.setDate(nextPaymentDate.getDate() + 5);

  return {
    nextPaymentDate: nextPaymentDate.toISOString(),
    blockedPaymentDate: blockedPaymentDate.toISOString(),
  };
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { orderId, userId, status, amount } = await request.json();

    if (!orderId || !userId || !status) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros: orderId, userId, status' }), { status: 400 });
    }

    const { nextPaymentDate, blockedPaymentDate } = calculateNextPaymentDates();
    const paymentAmount = amount || 140000;

    // Check if payment already exists for this order
    const existingPayment = await client.execute({
      sql: 'SELECT id FROM payments WHERE paymentId = ?',
      args: [orderId],
    });

    if (existingPayment.rows.length > 0) {
      // Update existing payment
      await client.execute({
        sql: `UPDATE payments SET status = ?, updated_at = ? WHERE paymentId = ?`,
        args: [status, new Date().toISOString(), orderId],
      });
    } else {
      // Insert new payment
      await client.execute({
        sql: `INSERT INTO payments (paymentId, userId, amount, status, paymentDate, nextPaymentDate, blockedPaymentDate, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          orderId,
          userId,
          paymentAmount,
          status,
          new Date().toISOString(),
          nextPaymentDate,
          blockedPaymentDate,
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      });
    }

    // Update user status if approved
    if (status === 'approved') {
      await client.execute({
        sql: `UPDATE usuarios SET status = ? WHERE clerk_user_id = ?`,
        args: ['approved', userId],
      });

      try {
        await client.execute({
          sql: `UPDATE patientsClient SET membership_paid = 1, updated_at = ? WHERE userId = ?`,
          args: [new Date().toISOString(), userId],
        });
      } catch (err) {
        console.warn('No se encontró registro en patientsClient para este usuario.');
      }
    }

    return new Response(JSON.stringify({ success: true, status }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en bold/save-payment:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};