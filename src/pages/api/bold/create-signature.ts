import type { APIRoute } from 'astro';
import crypto from 'crypto';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { orderId, amount } = await request.json();

    if (!orderId || !amount) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros: orderId, amount' }), { status: 400 });
    }

    const BOLD_SECRET_KEY = import.meta.env.BOLD_SECRET_KEY;
    if (!BOLD_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Llave secreta de Bold no configurada' }), { status: 500 });
    }

    const cadenaConcatenada = `${orderId}${amount}COP${BOLD_SECRET_KEY}`;
    const signature = crypto.createHash('sha256').update(cadenaConcatenada).digest('hex');

    return new Response(JSON.stringify({ signature }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en bold/create-signature:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};
