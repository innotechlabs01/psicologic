import type { APIRoute } from 'astro';
import { getPaymentInfo, getPaymentHistory } from '../../../lib/services/epayco-service';

export const GET: APIRoute = async (context) => {
  try {
    const { userId } = context.locals.auth();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const paymentInfo = await getPaymentInfo(userId);
    const paymentHistory = await getPaymentHistory(userId);

    return new Response(JSON.stringify({
      paymentInfo,
      paymentHistory
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching payment data:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
