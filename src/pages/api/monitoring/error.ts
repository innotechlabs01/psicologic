import type { APIRoute } from 'astro';
import { reportErrorToDiscord } from '../../../lib/monitoring/discord-error';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { userId } = locals.auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.message !== 'string') {
      return new Response(JSON.stringify({ error: 'Payload inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const err = new Error(body.message.slice(0, 500));
    if (typeof body.stack === 'string') {
      err.stack = body.stack.slice(0, 1500);
    }

    await reportErrorToDiscord({
      source: 'client',
      route: typeof body.route === 'string' ? body.route.slice(0, 200) : '/',
      error: err,
      userId,
      severity: body.severity === 'warning' ? 'warning' : 'error',
      context: {
        userAgent: request.headers.get('user-agent')?.slice(0, 150) || undefined,
      },
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
