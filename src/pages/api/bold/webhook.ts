import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client';
import crypto from 'crypto';

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

const verifyBoldSignature = (body: string, signature: string, secretKey: string): boolean => {
  const encoded = Buffer.from(body).toString('base64');
  const hashed = crypto.createHmac('sha256', secretKey).update(encoded).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hashed), Buffer.from(signature));
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    const signature = request.headers.get('x-bold-signature') || '';
    const BOLD_SECRET_KEY = import.meta.env.BOLD_SECRET_KEY || '';

    // Validar firma (en modo pruebas la secret puede ser string vacío)
    if (BOLD_SECRET_KEY) {
      const isValid = verifyBoldSignature(rawBody, signature, BOLD_SECRET_KEY);
      if (!isValid) {
        console.warn('Firma inválida en webhook de Bold');
        return new Response('Firma inválida', { status: 403 });
      }
    }

    const eventType = body.type; // SALE_APPROVED, SALE_REJECTED, VOID_APPROVED, VOID_REJECTED
    const data = body.data || {};

    console.log('Webhook Bold recibido:', eventType, data.payment_id);

    const amount = parseFloat(String(data.amount?.total)) || 0;
    const transactionId = String(data.payment_id || data.subject || '');

    // Obtener userId de extra_data_1 o metadata
    const clerkUserId = String(data.extra_data_1 || data.metadata?.reference || '');

    if (!clerkUserId) {
      console.warn('No se pudo identificar el userId en el webhook');
      return new Response('OK', { status: 200 });
    }

    const statusMap: Record<string, string> = {
      'SALE_APPROVED': 'approved',
      'SALE_REJECTED': 'rejected',
      'VOID_APPROVED': 'rejected',
      'VOID_REJECTED': 'approved',
    };

    const internalStatus = statusMap[eventType] || 'unknown';

    await saveStatusPayment(clerkUserId, transactionId, amount, internalStatus);

    if (eventType === 'SALE_APPROVED') {
      await client.execute({
        sql: `UPDATE usuarios SET status = ? WHERE clerk_user_id = ?`,
        args: ['approved', clerkUserId]
      });

      try {
        await client.execute({
          sql: `UPDATE patientsClient SET membership_paid = 1, updated_at = ? WHERE userId = ?`,
          args: [new Date().toISOString(), clerkUserId]
        });
      } catch (err) {
        console.warn('No se encontró registro en patientsClient para este usuario.');
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error procesando webhook de Bold:', error);
    return new Response('Internal Error', { status: 500 });
  }
};
