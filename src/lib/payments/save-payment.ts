import { db } from '../turso/client';

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Próximo cobro: mismo día del mes "un mes calendario" adelante
 * (días del mes en curso + la fecha actual), igual que la regla original.
 */
export function calculateNextPaymentDate(from: Date = new Date()): Date {
  const daysInMonth = [31, isLeapYear(from.getFullYear()) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const actualDays = daysInMonth[from.getMonth()];
  const next = new Date(from);
  next.setDate(from.getDate() + actualDays);
  return next;
}

/**
 * Bloqueo de acceso: 5 días de gracia después del próximo cobro.
 */
export function calculateBlockedPaymentDate(nextPaymentDate: Date): Date {
  const blocked = new Date(nextPaymentDate);
  blocked.setDate(nextPaymentDate.getDate() + 5);
  return blocked;
}

/**
 * Persiste el estado de una transacción de pago (Bold).
 * Compartido por /api/bold/webhook y /api/bold/validate.
 */
export async function saveStatusPayment(
  userId: string,
  paymentId: string,
  amount: number,
  status: string,
): Promise<void> {
  try {
    const now = new Date();
    const nextPaymentDate = calculateNextPaymentDate(now);
    const blockedPaymentDate = calculateBlockedPaymentDate(nextPaymentDate);

    await db.execute({
      sql: `INSERT INTO payments (paymentId, userId, amount, status, paymentDate, nextPaymentDate, blockedPaymentDate, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        paymentId,
        userId,
        amount,
        status,
        now.toISOString(),
        nextPaymentDate.toISOString(),
        blockedPaymentDate.toISOString(),
        now.toISOString(),
      ],
    });
  } catch (error) {
    console.error('Error al guardar el estado de la transacción:', error);
  }
}
