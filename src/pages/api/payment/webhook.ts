// src/pages/api/payment/webhook.ts
import type { APIRoute } from 'astro';
import { PaymentService } from '../../../lib/services/paymentService';

export const POST: APIRoute = async ({ request }) => {
  try {
    const paymentData = await request.json();
    
    if (paymentData.type === 'payment') {
      const result = await PaymentService.processWebhook(paymentData.data);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({ message: 'Evento ignorado' }), { 
      status: 200 
    });
  } catch (error) {
    console.error('Error en webhook:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { 
      status: 500 
    });
  }
};
