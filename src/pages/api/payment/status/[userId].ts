import type { APIRoute } from 'astro';
import { PaymentService } from '../../../../lib/services/paymentService';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { userId } = params;

    if (!userId) {
      return new Response(JSON.stringify({
        error: 'ID de usuario requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const paymentInfo = await PaymentService.getUserPaymentInfo(userId);
    const paymentHistory = await PaymentService.getPaymentHistory(userId);
    
    const daysToNext = PaymentService.calculateDaysToNextPayment(paymentInfo.next_payment_date);
    const isActive = PaymentService.isSubscriptionActive(paymentInfo.next_payment_date);

    return new Response(JSON.stringify({
      success: true,
      data: {
        paymentInfo: {
          ...paymentInfo,
          days_to_next_payment: daysToNext,
          is_subscription_active: isActive
        },
        paymentHistory
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al obtener estado:', error);
    return new Response(JSON.stringify({
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};