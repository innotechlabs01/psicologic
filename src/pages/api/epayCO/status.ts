import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const refPayco = url.searchParams.get('ref_payco');
  if (!refPayco) return new Response('Falta ref_payco', { status: 400 });

  const res = await fetch(`https://secure.epayco.co/validation/v1/reference/${refPayco}`);
  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};
