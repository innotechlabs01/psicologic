import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const {
      name,
      description,
      invoice,
      currency,
      amount,
      tax_base,
      tax,
      country,
      lang,
      email_billing,
      userId
    } = await request.json();

    const publicKey = import.meta.env.EPAYCO_PUBLIC_KEY;
    const pKey = import.meta.env.EPAYCO_P_KEY;
    const isTest = import.meta.env.EPAYCO_TEST_MODE === 'true';

    if (!publicKey || !pKey) {
      return new Response(JSON.stringify({ error: 'Epayco keys not configured' }), { status: 500 });
    }

    const basePath = import.meta.env.BASE_PATH || '';
    
    const checkoutData = {
      name,
      description,
      invoice,
      currency,
      amount,
      tax_base,
      tax,
      country,
      lang,
      external: 'true',
      email_billing,
      test: isTest,
      confirmation: `${basePath}/api/epayco/confirmacion`,
      response: `${basePath}/client/payment`,
      merchantId: import.meta.env.EPAYCO_MERCHANT_ID || '',
    };

    return new Response(JSON.stringify({ 
      checkoutData, 
      publicKey, 
      isTest 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
