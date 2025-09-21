// src/pages/api/payment/create-preference.ts
import type { APIRoute } from 'astro';
import { PaymentService } from '../../../lib/services/paymentService';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { userId, userEmail, userName } = await request.json();

    if (!userId || !userEmail) {
      return new Response(JSON.stringify({
        error: 'Faltan datos requeridos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const preference = await PaymentService.createPaymentPreference(userId, userEmail, userName);

    return new Response(JSON.stringify({
      success: true,
      preference_id: preference.id,
      init_point: preference.init_point
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al crear preferencia:', error);
    return new Response(JSON.stringify({
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};