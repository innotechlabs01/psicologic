import type { APIRoute } from 'astro';
import { db as client } from '../../../lib/turso/client';
import { checkRateLimit } from '../../../lib/turso/rate-limit';

// POST: feedback de un usuario logueado (rate-limited).
// Registra la cadencia en usuarios.metadata.last_feedback_at (spec
// 2026-10-18-feedback-revival-design.md).
export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  const { userId } = locals.auth();
  if (!userId) {
    return new Response(
      JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }),
      { status: 401 },
    );
  }

  // Rate limit: 5 req/min por IP
  const ip = request.headers.get('x-forwarded-for') || clientAddress || 'unknown';
  const limit = await checkRateLimit(ip);
  if (!limit.success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.',
      }),
      { status: 429 },
    );
  }

  const body = await request.json();
  const { mood, rating, comment } = body;

  if (!mood || typeof rating !== 'number' || rating < 1 || rating > 10) {
    return new Response(
      JSON.stringify({ success: false, error: 'Mood y rating (1-10) son obligatorios.' }),
      { status: 400 },
    );
  }

  const result = await client.execute(
    `insert into feedback (mood, rating, comment, created_at) values (?, ?, ?, ?)`,
    [mood, rating, comment ?? '', new Date().toUTCString()],
  );

  if (!result) {
    return new Response(
      JSON.stringify({ success: false, error: 'Error creating feedback' }),
      { status: 500 },
    );
  }

  // Cadencia (best-effort): marca el último feedback del usuario.
  // Nunca bloquea el envío si falla.
  try {
    const meta = await client.execute({
      sql: 'SELECT metadata FROM usuarios WHERE clerk_user_id = ? LIMIT 1',
      args: [userId],
    });
    let metadata: Record<string, unknown> = {};
    if (meta.rows[0]?.metadata) {
      try {
        metadata = JSON.parse(String(meta.rows[0].metadata)) || {};
      } catch {
        // metadata corrupta → se sobreescribe
      }
    }
    metadata.last_feedback_at = new Date().toISOString();
    await client.execute({
      sql: 'UPDATE usuarios SET metadata = ? WHERE clerk_user_id = ?',
      args: [JSON.stringify(metadata), userId],
    });
  } catch (error) {
    console.error('Error registrando cadencia de feedback (no bloquea el envío):', error);
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

// GET: listado + stats — solo admins (patrón de users/approve.ts).
export const GET: APIRoute = async ({ locals }) => {
  const { userId, orgRole } = locals.auth();
  if (!userId || orgRole !== 'org:admin') {
    return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });
  }

  // Columnas explícitas y normalizadas a tipos JSON-safe.
  const res = await client.execute(
    `SELECT mood, rating, comment, created_at FROM feedback ORDER BY created_at DESC LIMIT 500`,
  );

  const feedback = (res.rows ?? []).map((r) => ({
    mood: String(r.mood ?? ''),
    rating: Number(r.rating ?? 0),
    comment: String(r.comment ?? ''),
    created_at: String(r.created_at ?? ''),
  }));

  const total = feedback.length;
  const avgRating = total
    ? Number((feedback.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1))
    : 0;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const last30 = feedback.filter((f) => new Date(f.created_at).getTime() >= thirtyDaysAgo).length;
  const byMood: Record<string, number> = {};
  for (const f of feedback) byMood[f.mood] = (byMood[f.mood] || 0) + 1;

  return new Response(
    JSON.stringify({ feedback, stats: { total, avgRating, last30, byMood } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};
