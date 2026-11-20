import { db } from '../turso/client';
import crypto from 'crypto';

export interface GameAccessCheckResult {
  allowed: boolean;
  reason: 'psychologist' | 'paid' | 'not_assigned' | 'payment_required' | 'unauthenticated';
  price?: number;
}

export async function ensurePatientGameTable(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS patient_game_access (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      psychologist_id TEXT NOT NULL,
      game_slug TEXT NOT NULL,
      is_paid INTEGER DEFAULT 0,
      price INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending_payment',
      granted_at TEXT,
      paid_at TEXT
    )
  `);
}

async function findPatientForClerkUser(clerkUserId: string) {
  const userRes = await db.execute({
    sql: `SELECT email FROM usuarios WHERE clerk_user_id = ? LIMIT 1`,
    args: [clerkUserId],
  });
  const email = userRes.rows?.[0]?.email ? String(userRes.rows[0].email) : '';

  const patientRes = await db.execute({
    sql: `SELECT id, membership_paid, userId FROM patientsClient WHERE userId = ? OR (? != '' AND LOWER(email) = LOWER(?)) LIMIT 1`,
    args: [clerkUserId, email, email],
  });
  return (patientRes.rows?.[0] as any) || null;
}

export async function checkPatientGamePermission(
  clerkUserId: string | null | undefined,
  orgRole: string | null | undefined,
  gameSlug: string
): Promise<GameAccessCheckResult> {
  if (!clerkUserId) {
    return { allowed: false, reason: 'unauthenticated' };
  }

  // Psicólogos y administradores siempre pueden acceder a los juegos
  if (orgRole === 'org:admin' || orgRole === 'org:client') {
    return { allowed: true, reason: 'psychologist' };
  }

  try {
    await ensurePatientGameTable();
    const patient = await findPatientForClerkUser(clerkUserId);
    if (!patient) {
      return { allowed: false, reason: 'not_assigned' };
    }

    const accessRes = await db.execute({
      sql: `SELECT id, is_paid, price, status FROM patient_game_access WHERE patient_id = ? AND game_slug = ? LIMIT 1`,
      args: [String(patient.id), gameSlug],
    });

    const row = accessRes.rows?.[0] as any;
    if (!row) {
      return { allowed: false, reason: 'not_assigned' };
    }

    const price = Number(row.price) || 0;
    const isPaid = Number(row.is_paid) === 1 || Number(patient.membership_paid) === 1 || price === 0;

    if (isPaid) {
      return { allowed: true, reason: 'paid' };
    }

    return { allowed: false, reason: 'payment_required', price };
  } catch (err) {
    console.error('checkPatientGamePermission error:', err);
    return { allowed: false, reason: 'not_assigned' };
  }
}

export async function grantGameToPatient(
  psychologistId: string,
  patientId: string,
  gameSlug: string,
  price: number = 0
): Promise<void> {
  await ensurePatientGameTable();
  const existing = await db.execute({
    sql: `SELECT id FROM patient_game_access WHERE patient_id = ? AND game_slug = ? LIMIT 1`,
    args: [patientId, gameSlug],
  });

  const now = new Date().toISOString();
  const isFree = price <= 0 ? 1 : 0;
  const status = isFree ? 'active' : 'pending_payment';

  if (existing.rows && existing.rows.length > 0) {
    await db.execute({
      sql: `UPDATE patient_game_access SET price = ?, is_paid = CASE WHEN ? = 1 THEN 1 ELSE is_paid END, status = CASE WHEN ? = 1 THEN 'active' ELSE status END WHERE id = ?`,
      args: [price, isFree, isFree, existing.rows[0].id],
    });
    return;
  }

  await db.execute({
    sql: `INSERT INTO patient_game_access (id, patient_id, psychologist_id, game_slug, is_paid, price, status, granted_at, paid_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(),
      patientId,
      psychologistId,
      gameSlug,
      isFree,
      price,
      status,
      now,
      isFree ? now : null,
    ],
  });
}

export async function revokeGameFromPatient(
  psychologistId: string,
  patientId: string,
  gameSlug: string
): Promise<void> {
  await ensurePatientGameTable();
  await db.execute({
    sql: `DELETE FROM patient_game_access WHERE patient_id = ? AND psychologist_id = ? AND game_slug = ?`,
    args: [patientId, psychologistId, gameSlug],
  });
}

export async function markPatientGamesPaid(clerkUserId: string): Promise<void> {
  try {
    await ensurePatientGameTable();
    const patient = await findPatientForClerkUser(clerkUserId);
    if (!patient) return;

    const now = new Date().toISOString();
    await db.execute({
      sql: `UPDATE patient_game_access SET is_paid = 1, status = 'active', paid_at = ? WHERE patient_id = ?`,
      args: [now, String(patient.id)],
    });
  } catch (err) {
    console.warn('markPatientGamesPaid warning:', err);
  }
}
