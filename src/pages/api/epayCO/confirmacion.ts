// src/pages/api/epayCO/confirmacion.ts
import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client';
import crypto from 'crypto';

const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

const saveStatusPayment = async (userId: string, paymentId: string, amount: number, status: string) => {
  try {
    // Función auxiliar para verificar año bisiesto
    function isLeapYear(year: number): boolean {
      return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    // Calcular 30 o 31 días dependiendo del mes actual
    const today = new Date();
    const daysInMonth = [31, isLeapYear(today.getFullYear()) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const actualDays = daysInMonth[today.getMonth()];

    const nextPaymentDate = new Date(today);
    nextPaymentDate.setDate(today.getDate() + actualDays);

    const blockedPaymentDate = new Date(nextPaymentDate);
    blockedPaymentDate.setDate(nextPaymentDate.getDate() + 5); // 5 días de prórroga

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
    console.error('Error al actualizar el estado de la transacción:', error);
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const data = Object.fromEntries(form.entries());

    console.log('📩 Confirmación ePayco recibida:', data);

    const EPAYCO_P_KEY = import.meta.env.EPAYCO_P_KEY;

    // Validar firma digital
    const signatureSource = `${EPAYCO_P_KEY}~${data.x_cust_id_cliente}~${data.x_ref_payco}~${data.x_transaction_id}~${data.x_amount}~${data.x_currency_code}`;
    const firmaEsperada = crypto.createHash('md5').update(signatureSource).digest('hex');

    if (firmaEsperada !== data.x_signature) {
      console.warn('⚠️ Firma inválida detectada en confirmación.');
      return new Response('Firma inválida', { status: 403 });
    }

    const amount = parseFloat(String(data.x_amount)) || 0;
    const responseCode = String(data.x_cod_response); // 1=Aceptada, 2=Rechazada, 3=Pendiente, 4=Fallida
    const clerkUserId = String(data.x_extra1 || data.x_cust_id_cliente); // Usamos extra1 para pasar el clerk_user_id real

    const statusMap: Record<string, string> = {
      '1': 'approved',
      '2': 'rejected',
      '3': 'pending',
      '4': 'failed'
    };

    const statusStr = statusMap[responseCode] || 'unknown';

    await saveStatusPayment(clerkUserId, data.x_transaction_id.toString(), amount, statusStr);

    if (responseCode === '1') {
      // Activar usuario
      await client.execute({
        sql: `update usuarios set status = ? where clerk_user_id = ?`,
        args: ['approved', clerkUserId]
      });

      // Marcar membresía pagada en pacientes (si aplica el flujo)
      try {
        await client.execute({
          sql: `update patientsClient set membership_paid = 1, updated_at = ? where userId = ?`,
          args: [new Date().toISOString(), clerkUserId]
        });
      } catch (err) {
        console.warn('⚠️ No se encontró registro en patientsClient para este usuario.');
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error procesando confirmación:', error);
    return new Response('Internal Error', { status: 500 });
  }
};
