import { createClient } from '@libsql/client';
import type { APIRoute } from 'astro';

const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN
});

export const POST: APIRoute = async ({ request }) => {
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
