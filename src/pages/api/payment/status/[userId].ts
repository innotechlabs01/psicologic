import type { APIRoute } from 'astro';
import { PaymentService } from '../../../../lib/services/paymentService';

export const GET: APIRoute = async ({ params }) => {
  try {
    const userId = params.userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { 
        status: 400 
      });
    }

    const paymentInfo = await PaymentService.getUserPaymentInfo(userId);
    const paymentHistory = await PaymentService.getPaymentHistory(userId);

    return new Response(JSON.stringify({
      paymentInfo,
      paymentHistory
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error en status endpoint:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { 
      status: 500 
    });
  }
};