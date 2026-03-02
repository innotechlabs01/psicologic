import { db } from '../turso/client';
import { createHash } from 'crypto';

export interface PaymentRecord {
  id: string;
  paymentId: string;
  userId: string;
  amount: number;
  status: string;
  paymentDate: string;
  nextPaymentDate: string;
  created_at: string;
}

export interface PaymentInfo {
  paymentId?: string;
  userId: string;
  paymentDate: string | null;
  nextPaymentDate: string | null;
  daysToNext: number;
  subscriptionStatus: string;
  isActive: boolean;
}

const SUBSCRIPTION_DAYS = 30;
const GRACE_DAYS = 5;

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function calculateDaysToNext(nextPaymentDate: string | null): number {
  if (!nextPaymentDate) return 0;
  const next = new Date(nextPaymentDate);
  const today = new Date();
  const diff = next.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function validateEpaycoSignature(
  refPayco: string,
  transactionId: string,
  amount: string,
  currencyCode: string,
  signature: string
): boolean {
  const pKey = import.meta.env.EPAYCO_P_KEY;
  if (!pKey) {
    console.error('EPAYCO_P_KEY not configured');
    return false;
  }

  const signatureString = `${pKey}~${refPayco}~${transactionId}~${amount}~${currencyCode}`;
  const expectedSignature = createHash('sha256').update(signatureString).digest('hex');

  return signature === expectedSignature;
}

export async function createPaymentRecord(
  userId: string,
  paymentId: string,
  amount: number,
  status: string
): Promise<void> {
  const now = new Date();
  const paymentDate = formatDate(now);
  const nextPaymentDate = formatDate(new Date(now.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000));
  const blockedDate = formatDate(new Date(now.getTime() + (SUBSCRIPTION_DAYS + GRACE_DAYS) * 24 * 60 * 60 * 1000));

  await db.execute({
    sql: `INSERT INTO payments (paymentId, userId, amount, status, paymentDate, nextPaymentDate, blockedPaymentDate, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [paymentId, userId, amount, status, paymentDate, nextPaymentDate, blockedDate, now.toISOString()]
  });
}

export async function updateUserMembership(userId: string, isPaid: boolean): Promise<void> {
  const now = new Date().toISOString();
  
  await db.execute({
    sql: `UPDATE patientsClient SET membership_paid = ?, updated_at = ? WHERE userId = ?`,
    args: [isPaid ? 1 : 0, now, userId]
  });

  await db.execute({
    sql: `UPDATE usuarios SET status = ? WHERE clerk_user_id = ?`,
    args: [isPaid ? 'active' : 'inactive', userId]
  });
}

export async function getPaymentInfo(userId: string): Promise<PaymentInfo> {
  const result = await db.execute({
    sql: `SELECT id, paymentId, userId, amount, status, paymentDate, nextPaymentDate 
          FROM payments WHERE userId = ? ORDER BY paymentDate DESC LIMIT 1`,
    args: [userId]
  });

  if (!result.rows.length) {
    return {
      userId,
      paymentDate: null,
      nextPaymentDate: null,
      daysToNext: 0,
      subscriptionStatus: 'inactive',
      isActive: false
    };
  }

  const row = result.rows[0];
  const nextPaymentDate = row[5] ? String(row[5]) : null;
  const isActive = nextPaymentDate ? new Date(nextPaymentDate) > new Date() : false;

  return {
    paymentId: String(row[1]),
    userId: String(row[2]),
    paymentDate: row[4] ? String(row[4]) : null,
    nextPaymentDate,
    daysToNext: calculateDaysToNext(nextPaymentDate),
    subscriptionStatus: isActive ? 'active' : 'expired',
    isActive
  };
}

export async function getPaymentHistory(userId: string): Promise<PaymentRecord[]> {
  const result = await db.execute({
    sql: `SELECT id, paymentId, userId, amount, status, paymentDate, nextPaymentDate, created_at 
          FROM payments WHERE userId = ? ORDER BY paymentDate DESC`,
    args: [userId]
  });

  return result.rows.map((row: any) => ({
    id: String(row[0]),
    paymentId: String(row[1]),
    userId: String(row[2]),
    amount: Number(row[3]) || 0,
    status: String(row[4]),
    paymentDate: row[5] ? String(row[5]) : '',
    nextPaymentDate: row[6] ? String(row[6]) : '',
    created_at: row[7] ? String(row[7]) : ''
  }));
}

export function mapEpaycoStatus(codResponse: number): string {
  switch (codResponse) {
    case 1:
      return 'approved';
    case 2:
      return 'rejected';
    case 3:
      return 'pending';
    case 4:
      return 'failed';
    default:
      return 'unknown';
  }
}
