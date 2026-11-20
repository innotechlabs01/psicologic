import type { APIRoute } from 'astro';
import { db } from '../../../../lib/turso/client';
import { requireAuth } from '../../../../lib/auth/api-guard';
import {
  ensurePatientGameTable,
  grantGameToPatient,
  revokeGameFromPatient,
} from '../../../../lib/games/patient-game-access';
import { reportErrorToDiscord } from '../../../../lib/monitoring/discord-error';

const BASE_GAMES = [
  { slug: 'cartas', name: 'Cartas Terapéuticas' },
  { slug: 'miedo', name: 'Superar Miedos' },
  { slug: 'emociones', name: 'Emociones' },
];

export const GET: APIRoute = async ({ url, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  try {
    await ensurePatientGameTable();
    const patientId = url.searchParams.get('patientId');

    if (!patientId) {
      return new Response(JSON.stringify({ error: 'Falta patientId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const patientCheck = await db.execute({
      sql: `SELECT id, userId, membership_paid FROM patientsClient WHERE id = ? LIMIT 1`,
      args: [patientId],
    });
    const patientRow = patientCheck.rows?.[0] as any;
    if (!patientRow) {
      return new Response(JSON.stringify({ error: 'Paciente no encontrado' }), { status: 404 });
    }
    if (auth.orgRole !== 'org:admin' && String(patientRow.userId) !== auth.userId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
    }

    const [assignedRes, catalogRes] = await Promise.all([
      db.execute({
        sql: `SELECT game_slug, is_paid, price, status, granted_at, paid_at FROM patient_game_access WHERE patient_id = ?`,
        args: [patientId],
      }),
      db.execute({ sql: `SELECT name, slug FROM games`, args: [] }).catch(() => ({ rows: [] as any[] })),
    ]);

    const catalogMap = new Map<string, string>();
    for (const g of BASE_GAMES) catalogMap.set(g.slug, g.name);
    for (const r of catalogRes.rows as any[]) {
      if (r.slug && r.name) catalogMap.set(String(r.slug), String(r.name));
    }

    const availableGames = Array.from(catalogMap.entries()).map(([slug, name]) => ({ slug, name }));
    const assigned = (assignedRes.rows as any[]).map((r) => ({
      gameSlug: String(r.game_slug),
      isPaid: Number(r.is_paid) === 1 || Number(patientRow.membership_paid) === 1,
      price: Number(r.price) || 0,
      status: String(r.status || 'pending_payment'),
      grantedAt: r.granted_at ? String(r.granted_at) : null,
      paidAt: r.paid_at ? String(r.paid_at) : null,
    }));

    return new Response(JSON.stringify({ availableGames, assigned }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en GET /api/client/patients/games:', error);
    await reportErrorToDiscord({
      source: 'server',
      route: '/api/client/patients/games',
      error,
      userId: auth.userId,
    });
    return new Response(JSON.stringify({ error: 'Error cargando juegos del paciente' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const patientId = String(body?.patientId || '');
    const gameSlug = String(body?.gameSlug || '');
    const price = Math.max(0, Number(body?.price) || 0);

    if (!patientId || !gameSlug) {
      return new Response(JSON.stringify({ error: 'Faltan patientId o gameSlug' }), { status: 400 });
    }

    const patientCheck = await db.execute({
      sql: `SELECT id, userId FROM patientsClient WHERE id = ? LIMIT 1`,
      args: [patientId],
    });
    const patientRow = patientCheck.rows?.[0] as any;
    if (!patientRow) {
      return new Response(JSON.stringify({ error: 'Paciente no encontrado' }), { status: 404 });
    }
    if (auth.orgRole !== 'org:admin' && String(patientRow.userId) !== auth.userId) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
    }

    await grantGameToPatient(String(patientRow.userId), patientId, gameSlug, price);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en POST /api/client/patients/games:', error);
    await reportErrorToDiscord({
      source: 'server',
      route: '/api/client/patients/games',
      error,
      userId: auth.userId,
    });
    return new Response(JSON.stringify({ error: 'Error otorgando juego' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const auth = requireAuth(locals);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const patientId = String(body?.patientId || '');
    const gameSlug = String(body?.gameSlug || '');

    if (!patientId || !gameSlug) {
      return new Response(JSON.stringify({ error: 'Faltan patientId o gameSlug' }), { status: 400 });
    }

    await revokeGameFromPatient(auth.userId, patientId, gameSlug);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en DELETE /api/client/patients/games:', error);
    return new Response(JSON.stringify({ error: 'Error revocando juego' }), { status: 500 });
  }
};
