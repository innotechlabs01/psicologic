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
      confirm,
      response,
    } = await request.json();

    const { EPAYCO_PUBLIC_KEY, IsTest } = import.meta.env;

    if (!EPAYCO_PUBLIC_KEY) {
      return new Response(JSON.stringify({ error: 'Llave pública no configurada' }), { status: 500 });
    }

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
      test: IsTest,
      confirmacion: `${import.meta.env.BASE_PATH}${confirm}`,
      response: `${import.meta.env.BASE_PATH}${response}`,
    };

    return new Response(JSON.stringify({ checkoutData, publicKey: EPAYCO_PUBLIC_KEY, isTest: IsTest }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en /create:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};
