// src/pages/api/payment/webhook.ts
import type { APIRoute } from 'astro';
import { PaymentService } from '../../../lib/services/paymentService';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Verificar que sea una notificación de pago
    if (body.type === 'payment') {
      const paymentData = {
        id: body.data.id
      };

      await PaymentService.processWebhook(paymentData);
    }

    return new Response('OK', { status: 200 });
    
  } catch (error) {
    console.error('Error en webhook:', error);
    return new Response('Error', { status: 500 });
  }
};
