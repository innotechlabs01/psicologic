import { db as client } from '../../../lib/turso/client';
import type { APIRoute } from 'astro';
import { reportErrorToDiscord } from '../../../lib/monitoring/discord-error';

/**
 * Admin CRM endpoint: returns real-time KPIs across all 6 psychologist lifecycle stages
 * and per-psychologist follow-up metrics. Restricted to org:admin; no patient clinical data.
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const { userId, orgRole } = locals.auth();

    if (!userId || orgRole !== 'org:admin') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const [
      psychUsersRes,
      patientsAggRes,
      agendaAggRes,
      ticketsRes,
      paymentsRes,
      scheduleRes,
      gamesRes,
      feedbackRes,
      gameUsersRes,
      gameAccessRes,
    ] = await Promise.all([
      client.execute({
        sql: `
          SELECT clerk_user_id, email, first_name, last_name, username, avatar_url, status, role, created_at, updated_at
          FROM usuarios
          WHERE role IS NULL OR role != 'org:admin'
          ORDER BY created_at DESC
        `,
        args: [],
      }),
      client.execute({
        sql: `SELECT userId, COUNT(*) as cnt FROM patients GROUP BY userId`,
        args: [],
      }).catch(() => ({ rows: [] as any[] })),
      client.execute({
        sql: `
          SELECT
            userId,
            SUM(CASE WHEN status != 'cancelled' THEN 1 ELSE 0 END) as totalSessions,
            SUM(CASE WHEN status != 'cancelled' AND date >= ? THEN 1 ELSE 0 END) as upcomingSessions,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelledSessions
          FROM agenda
          GROUP BY userId
        `,
        args: [todayStr],
      }).catch(() => ({ rows: [] as any[] })),
      client.execute({
        sql: `
          SELECT
            SUM(CASE WHEN estado = 'Abierto' THEN 1 ELSE 0 END) as openCount,
            SUM(CASE WHEN estado = 'Cerrado' THEN 1 ELSE 0 END) as closedCount
          FROM tickets
        `,
        args: [],
      }).catch(() => ({ rows: [{ openCount: 0, closedCount: 0 }] as any[] })),
      client.execute({
        sql: `
          SELECT p.userId, p.nextPaymentDate, p.blockedPaymentDate, p.status, p.createdAt
          FROM payments p
          INNER JOIN (
            SELECT userId, MAX(createdAt) as maxCreated
            FROM payments
            GROUP BY userId
          ) latest ON p.userId = latest.userId AND p.createdAt = latest.maxCreated
        `,
        args: [],
      }).catch(() => ({ rows: [] as any[] })),
      client.execute({
        sql: `SELECT DISTINCT userId FROM settings_agend_time`,
        args: [],
      }).catch(() => ({ rows: [] as any[] })),
      client.execute({
        sql: `
          SELECT route, COUNT(*) as hits
          FROM access_logs
          WHERE route LIKE '/client/games/%'
          GROUP BY route
          ORDER BY hits DESC
          LIMIT 5
        `,
        args: [],
      }).catch(() => ({ rows: [] as any[] })),
      client.execute({
        sql: `
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as negativeCount,
            AVG(rating) as avgRating
          FROM feedback
        `,
        args: [],
      }).catch(() => ({ rows: [{ total: 0, negativeCount: 0, avgRating: null }] as any[] })),
      client.execute({
        sql: `
          SELECT
            userId,
            COUNT(*) as total,
            SUM(CASE WHEN membership_paid = 1 THEN 1 ELSE 0 END) as paidCount
          FROM patientsClient
          WHERE status IS NULL OR status != 'inactive'
          GROUP BY userId
        `,
        args: [],
      }).catch(() => ({ rows: [] as any[] })),
      client.execute({
        sql: `
          SELECT
            psychologist_id,
            COUNT(*) as grantedCount,
            SUM(CASE WHEN is_paid = 1 THEN 1 ELSE 0 END) as paidGamesCount
          FROM patient_game_access
          GROUP BY psychologist_id
        `,
        args: [],
      }).catch(() => ({ rows: [] as any[] })),
    ]);

    const patientsMap = new Map<string, number>();
    for (const row of patientsAggRes.rows as any[]) {
      patientsMap.set(String(row.userId), Number(row.cnt) || 0);
    }

    const agendaMap = new Map<string, { total: number; upcoming: number; cancelled: number }>();
    for (const row of agendaAggRes.rows as any[]) {
      agendaMap.set(String(row.userId), {
        total: Number(row.totalSessions) || 0,
        upcoming: Number(row.upcomingSessions) || 0,
        cancelled: Number(row.cancelledSessions) || 0,
      });
    }

    const paymentMap = new Map<string, { nextPaymentDate: string | null; blockedPaymentDate: string | null; status: string | null }>();
    for (const row of paymentsRes.rows as any[]) {
      paymentMap.set(String(row.userId), {
        nextPaymentDate: row.nextPaymentDate ? String(row.nextPaymentDate) : null,
        blockedPaymentDate: row.blockedPaymentDate ? String(row.blockedPaymentDate) : null,
        status: row.status ? String(row.status) : null,
      });
    }

    const scheduleSet = new Set<string>();
    for (const row of scheduleRes.rows as any[]) {
      if (row.userId) scheduleSet.add(String(row.userId));
    }

    const gameUsersMap = new Map<string, { total: number; paid: number }>();
    let totalGameUsers = 0;
    for (const row of gameUsersRes.rows as any[]) {
      const total = Number(row.total) || 0;
      totalGameUsers += total;
      gameUsersMap.set(String(row.userId), { total, paid: Number(row.paidCount) || 0 });
    }

    const gameAccessMap = new Map<string, { granted: number; paid: number }>();
    let totalGrantedGames = 0;
    let totalPaidGames = 0;
    for (const row of gameAccessRes.rows as any[]) {
      const granted = Number(row.grantedCount) || 0;
      const paid = Number(row.paidGamesCount) || 0;
      totalGrantedGames += granted;
      totalPaidGames += paid;
      gameAccessMap.set(String(row.psychologist_id), { granted, paid });
    }

    const nowMs = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    let activePsychologists = 0;
    let pendingApproval = 0;
    let deniedOrInactive = 0;
    let expiringSoon = 0;
    let withoutSchedule = 0;
    let retainedPsychologists = 0;
    let totalPatients = 0;
    let totalSessions = 0;
    let upcomingSessions = 0;
    let cancelledSessions = 0;

    for (const cnt of patientsMap.values()) totalPatients += cnt;
    for (const agg of agendaMap.values()) {
      totalSessions += agg.total;
      upcomingSessions += agg.upcoming;
      cancelledSessions += agg.cancelled;
    }

    const psychologists = (psychUsersRes.rows as any[]).map((u) => {
      const uid = String(u.clerk_user_id || '');
      const status = String(u.status || 'active');
      const isActive = status === 'approved' || status === 'active';
      if (isActive) activePsychologists++;
      else if (status === 'pending_approval') pendingApproval++;
      else deniedOrInactive++;

      const patientsCount = patientsMap.get(uid) ?? 0;
      if (isActive && patientsCount > 3) retainedPsychologists++;

      const hasSchedule = scheduleSet.has(uid);
      if (isActive && !hasSchedule) withoutSchedule++;

      const agenda = agendaMap.get(uid) ?? { total: 0, upcoming: 0, cancelled: 0 };
      const pay = paymentMap.get(uid) ?? null;

      let daysPending: number | null = null;
      if (status === 'pending_approval' && u.created_at) {
        const createdMs = new Date(String(u.created_at)).getTime();
        if (!Number.isNaN(createdMs)) {
          daysPending = Math.max(0, Math.floor((nowMs - createdMs) / (1000 * 60 * 60 * 24)));
        }
      }

      let daysToPayment: number | null = null;
      let isPaymentExpiring = false;
      if (pay?.nextPaymentDate) {
        const nextMs = new Date(pay.nextPaymentDate).getTime();
        if (!Number.isNaN(nextMs)) {
          daysToPayment = Math.ceil((nextMs - nowMs) / (1000 * 60 * 60 * 24));
          if (nextMs - nowMs <= sevenDaysMs) {
            isPaymentExpiring = true;
            expiringSoon++;
          }
        }
      }

      const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
        || (u.username ? String(u.username) : '')
        || (u.email ? String(u.email).split('@')[0] : 'Sin nombre');

      return {
        id: uid,
        name: fullName,
        email: String(u.email || ''),
        avatarUrl: u.avatar_url ? String(u.avatar_url) : null,
        status,
        role: String(u.role || 'org:client'),
        patientsCount,
        gameUsersCount: gameUsersMap.get(uid)?.total ?? 0,
        gameUsersPaidCount: gameUsersMap.get(uid)?.paid ?? 0,
        grantedGamesCount: gameAccessMap.get(uid)?.granted ?? 0,
        paidGamesCount: gameAccessMap.get(uid)?.paid ?? 0,
        sessionsCount: agenda.total,
        upcomingCount: agenda.upcoming,
        cancelledCount: agenda.cancelled,
        hasSchedule,
        daysPending,
        paymentStatus: pay?.status ?? 'trial',
        nextPaymentDate: pay?.nextPaymentDate ?? null,
        daysToPayment,
        isPaymentExpiring,
        lastUpdated: u.updated_at ? String(u.updated_at) : (u.created_at ? String(u.created_at) : null),
        createdAt: u.created_at ? String(u.created_at) : null,
      };
    });

    const ticketRow = (ticketsRes.rows[0] as any) || {};
    const openTickets = Number(ticketRow.openCount) || 0;
    const closedTickets = Number(ticketRow.closedCount) || 0;

    const totalAllAgenda = totalSessions + cancelledSessions;
    const cancellationRate = totalAllAgenda > 0 ? Math.round((cancelledSessions / totalAllAgenda) * 100) : 0;

    const topGames = (gamesRes.rows as any[]).map((g) => ({
      route: String(g.route || ''),
      name: String(g.route || '').replace('/client/games/', '') || 'juego',
      hits: Number(g.hits) || 0,
    }));

    const fbRow = (feedbackRes.rows[0] as any) || {};
    const feedback = {
      total: Number(fbRow.total) || 0,
      negativeCount: Number(fbRow.negativeCount) || 0,
      avgRating: fbRow.avgRating != null ? Number(Number(fbRow.avgRating).toFixed(1)) : null,
    };

    return new Response(
      JSON.stringify({
        kpis: {
          totalPsychologists: psychologists.length,
          activePsychologists,
          pendingApproval,
          deniedOrInactive,
          withoutSchedule,
          retainedPsychologists,
          totalPatients,
          totalGameUsers,
          totalGrantedGames,
          totalPaidGames,
          totalSessions,
          upcomingSessions,
          cancelledSessions,
          cancellationRate,
          openTickets,
          closedTickets,
          expiringSoon,
        },
        topGames,
        feedback,
        psychologists,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Dashboard CRM error:', error);
    await reportErrorToDiscord({
      source: 'server',
      route: '/api/dashboard/crm',
      error,
    });
    return new Response(JSON.stringify({ error: 'Error interno al cargar CRM' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
