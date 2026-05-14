import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const orderId = url.searchParams.get('orderId');
  if (!orderId) {
    return new Response(JSON.stringify({ error: 'Falta orderId' }), { status: 400 });
  }

  const BOLD_API_KEY = import.meta.env.BOLD_API_KEY;
  if (!BOLD_API_KEY) {
    return new Response(JSON.stringify({ error: 'API Key de Bold no configurada' }), { status: 500 });
  }

  try {
    const res = await fetch(
      `https://payments.api.bold.co/v2/payment-voucher/${orderId}`,
      {
        headers: {
          'Authorization': `x-api-key ${BOLD_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en bold/status:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
};
