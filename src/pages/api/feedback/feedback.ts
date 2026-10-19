import type { APIRoute } from 'astro';
import { db as client } from '../../../lib/turso/client';
import { checkRateLimit } from '../../../lib/turso/rate-limit';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Rate limit (endpoint público sin auth): 5 req/min por IP
  const ip = request.headers.get('x-forwarded-for') || clientAddress || 'unknown';
  const limit = await checkRateLimit(ip);
  if (!limit.success) {
    return new Response(
      JSON.stringify({ success: false, error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' }),
      { status: 429 }
    );
  }

  const body = await request.json();
  const { mood, rating, comment } = body;

  const result = await client.execute(
    `insert into feedback (mood, rating, comment, created_at) values (?, ?, ?, ?)`,
    [mood, rating, comment, new Date().toUTCString()]
  );

  if (!result) {
    return new Response(JSON.stringify({ success: false, error: 'Error creating feedback' }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
