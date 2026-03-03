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
        const { refPayco, userId } = await request.json();

        if (!refPayco || !userId) {
            return new Response(JSON.stringify({ error: 'Faltan parámetros' }), { status: 400 });
        }

        const res = await fetch(`https://secure.epayco.co/validation/v1/reference/${refPayco}`);
        const result = await res.json();

        if (!result.success) {
            return new Response(JSON.stringify({ error: 'Validación fallida con epayco' }), { status: 400 });
        }

        const data = result.data;
        const responseCode = String(data.x_cod_response);
        const amount = parseFloat(String(data.x_amount)) || 0;
        const transactionId = String(data.x_transaction_id);

        const statusMap: Record<string, string> = {
            '1': 'approved',
            '2': 'rejected',
            '3': 'pending',
            '4': 'failed'
        };

        const statusStr = statusMap[responseCode] || 'unknown';

        // Guardar el estado
        await saveStatusPayment(userId, transactionId, amount, statusStr);

        if (responseCode === '1') {
            await client.execute({
                sql: `update usuarios set status = ? where clerk_user_id = ?`,
                args: ['approved', userId]
            });
            try {
                await client.execute({
                    sql: `update patientsClient set membership_paid = 1, updated_at = ? where userId = ?`,
                    args: [new Date().toISOString(), userId]
                });
            } catch (err) { }
        }

        return new Response(JSON.stringify({ success: true, status: statusStr }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error en process-validation:', error);
        return new Response(JSON.stringify({ error: 'Internal Error' }), { status: 500 });
    }
}
