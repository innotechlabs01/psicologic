import type { APIRoute } from 'astro';
import { createPaymentRecord, updateUserMembership, mapEpaycoStatus, validateEpaycoSignature } from '../../../lib/services/epayco-service';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    console.log('📩 Epayco confirmation received:', {
      refPayco: data.x_ref_payco,
      transactionId: data.x_transaction_id,
      response: data.x_response,
      customerId: data.x_cust_id_cliente
    });

    const refPayco = String(data.x_ref_payco || '');
    const transactionId = String(data.x_transaction_id || '');
    const amount = String(data.x_amount || '0');
    const currencyCode = String(data.x_currency_code || 'cop');
    const signature = String(data.x_signature || '');
    const customerId = String(data.x_cust_id_cliente || '');
    const responseCode = parseInt(String(data.x_cod_response || '0'), 10);

    if (!refPayco || !transactionId || !customerId) {
      console.error('Missing required fields in confirmation');
      return new Response('Missing required fields', { status: 400 });
    }

    const isValidSignature = validateEpaycoSignature(
      refPayco,
      transactionId,
      amount,
      currencyCode,
      signature
    );

    if (!isValidSignature) {
      console.warn('⚠️ Invalid signature - possible manipulation attempt');
      return new Response('Invalid signature', { status: 403 });
    }

    const status = mapEpaycoStatus(responseCode);
    const amountNum = parseFloat(amount) || 0;

    await createPaymentRecord(customerId, transactionId, amountNum, status);

    if (status === 'approved') {
      await updateUserMembership(customerId, true);
      console.log(`✅ Payment approved for user ${customerId}`);
    } else if (status === 'rejected' || status === 'failed') {
      await updateUserMembership(customerId, false);
      console.log(`❌ Payment ${status} for user ${customerId}`);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing payment confirmation:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
