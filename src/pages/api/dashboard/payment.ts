import { db as client } from '../../../lib/turso/client';
import type { APIRoute } from 'astro';
import { requireAuth } from '../../../lib/auth/api-guard';
import { reportErrorToDiscord } from '../../../lib/monitoring/discord-error';

/**
 * Safely parses ISO strings, SQLite datetimes, or Unix timestamps (ms or seconds)
 * into an ISO string, returning null for empty or invalid values.
 */
function safeToIso(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') {
    const ms = raw < 1e12 ? raw * 1000 : raw;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const str = String(raw).trim();
  if (!str) return null;
  if (/^\d+(\.\d+)?$/.test(str)) {
    const num = Number(str);
    const ms = num < 1e12 ? num * 1000 : num;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function inferPlanName(status: string, amount: number): string {
  if (status === 'trial') return 'Prueba gratuita';
  if (amount <= 0) return 'Sin plan pago';
  if (amount >= 100000) return 'Plan Pro';
  return 'Plan Estándar';
}

export const GET: APIRoute = async ({ locals }) => {
  const auth = requireAuth(locals, ['org:admin']);
  if (auth instanceof Response) return auth;

  try {
    const [txRes, psychRes] = await Promise.all([
      client.execute({
        sql: `
          SELECT
            py.id,
            py.paymentId,
            py.userId,
            py.amount,
            py.status,
            py.paymentDate,
            py.nextPaymentDate,
            py.blockedPaymentDate,
            py.created_at,
            u.username,
            u.first_name,
            u.last_name,
            u.email
          FROM payments py
          LEFT JOIN usuarios u ON py.userId = u.clerk_user_id
          ORDER BY COALESCE(py.paymentDate, py.created_at) DESC
        `,
        args: [],
      }),
      client.execute({
        sql: `
          SELECT clerk_user_id, email, first_name, last_name, username, status, created_at
          FROM usuarios
          WHERE role IS NULL OR role != 'org:admin'
          ORDER BY created_at DESC
        `,
        args: [],
      }),
    ]);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonthPrefix = todayStr.slice(0, 7);

    let revenueToday = 0;
    let revenueMonth = 0;
    let revenueTotal = 0;

    const latestByUser = new Map<string, any>();

    const transactions = (txRes.rows as any[]).map((row) => {
      const amount = Number(row.amount) || 0;
      const status = String(row.status || 'unknown');
      const paymentDateIso = safeToIso(row.paymentDate) ?? safeToIso(row.created_at);
      const nextPaymentIso = safeToIso(row.nextPaymentDate);
      const blockedPaymentIso = safeToIso(row.blockedPaymentDate);

      if (status === 'approved') {
        revenueTotal += amount;
        if (paymentDateIso?.startsWith(todayStr)) revenueToday += amount;
        if (paymentDateIso?.startsWith(currentMonthPrefix)) revenueMonth += amount;
      }

      const uid = String(row.userId || '');
      if (uid && !latestByUser.has(uid)) {
        latestByUser.set(uid, {
          status,
          amount,
          paymentDate: paymentDateIso,
          nextPaymentDate: nextPaymentIso,
          blockedPaymentDate: blockedPaymentIso,
        });
      }

      const name =
        [row.first_name, row.last_name].filter(Boolean).join(' ').trim() ||
        (row.username ? String(row.username) : '') ||
        (row.email ? String(row.email).split('@')[0] : 'Usuario');

      return {
        id: String(row.id || row.paymentId || ''),
        paymentId: String(row.paymentId || ''),
        userId: uid,
        name,
        email: String(row.email || ''),
        amount,
        planName: inferPlanName(status, amount),
        status,
        paymentDate: paymentDateIso,
        nextPaymentDate: nextPaymentIso,
        blockedPaymentDate: blockedPaymentIso,
      };
    });

    let activeMemberships = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;
    let trialCount = 0;
    let noRecordCount = 0;

    const nowMs = now.getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    const memberships = (psychRes.rows as any[]).map((u) => {
      const uid = String(u.clerk_user_id || '');
      const latest = latestByUser.get(uid) || null;
      const name =
        [u.first_name, u.last_name].filter(Boolean).join(' ').trim() ||
        (u.username ? String(u.username) : '') ||
        (u.email ? String(u.email).split('@')[0] : 'Sin nombre');

      const registeredIso = safeToIso(u.created_at);
      const registeredMs = registeredIso ? new Date(registeredIso).getTime() : null;
      const isNewPsychologist = registeredMs !== null ? nowMs - registeredMs <= thirtyDaysMs : false;

      let daysRemaining: number | null = null;
      let membershipState: 'active' | 'expiring' | 'expired' | 'trial' | 'none' = 'none';

      if (!latest) {
        noRecordCount++;
        membershipState = 'none';
      } else {
        if (latest.nextPaymentDate) {
          const nextMs = new Date(latest.nextPaymentDate).getTime();
          if (!Number.isNaN(nextMs)) {
            daysRemaining = Math.ceil((nextMs - nowMs) / (1000 * 60 * 60 * 24));
          }
        }

        if (latest.status === 'trial') {
          trialCount++;
          membershipState = daysRemaining !== null && daysRemaining <= 0 ? 'expired' : 'trial';
        } else if (daysRemaining !== null && daysRemaining <= 0) {
          expiredCount++;
          membershipState = 'expired';
        } else if (daysRemaining !== null && daysRemaining <= 7) {
          expiringSoonCount++;
          membershipState = 'expiring';
        } else if (latest.status === 'approved') {
          activeMemberships++;
          membershipState = 'active';
        } else {
          membershipState = 'expired';
          expiredCount++;
        }
      }

      return {
        userId: uid,
        name,
        email: String(u.email || ''),
        accountStatus: String(u.status || 'active'),
        tenure: isNewPsychologist ? 'Nuevo' : 'Antiguo',
        registeredAt: registeredIso,
        planName: latest ? inferPlanName(latest.status, latest.amount) : 'Sin plan',
        paymentStatus: latest?.status ?? 'none',
        membershipState,
        amount: latest?.amount ?? 0,
        lastPaymentDate: latest?.paymentDate ?? null,
        nextPaymentDate: latest?.nextPaymentDate ?? null,
        blockedPaymentDate: latest?.blockedPaymentDate ?? null,
        daysRemaining,
      };
    });

    return new Response(
      JSON.stringify({
        summary: {
          revenueToday,
          revenueMonth,
          revenueTotal,
          activeMemberships,
          expiringSoonCount,
          expiredCount,
          trialCount,
          noRecordCount,
          totalTransactions: transactions.length,
        },
        memberships,
        transactions,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    await reportErrorToDiscord({
      source: 'server',
      route: '/api/dashboard/payment',
      error,
      userId: auth.userId,
    });
    return new Response(JSON.stringify({ error: 'Error al obtener datos de pagos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
