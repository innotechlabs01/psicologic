// src/lib/services/paymentService.ts
import { createClient, type Value } from '@libsql/client';
import type { paymentHistory, PaymentInfo } from 'src/constants/interfaces';

// Initialize Supabase client with service role key
const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN
});

// 🇪🇸 Formato dd/mm/yyyy
const formattedDate = (date: number) => {
    const newDate = new Date(date);
    return newDate.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
};

const statusHistory = (status: string) => {
    switch (status) {
        case 'trial':
            return 'trial';
        case 'approved':
            return 'approved';
        case 'pending':
            return 'pending';
        case 'denied':
            return 'denied';
        default:
            return 'unknown';
    }
}

export class PaymentService {
  
  // Obtener información de pagos de un usuario
  static async getUserPaymentInfo(userId: string) {
    try {
      const result = await client.execute(
        `
        SELECT id, clerk_user_id FROM usuarios WHERE clerk_user_id = ?
        `,
        [userId]
      )

      if (!result) {
        throw new Error('Usuario no encontrado');
      }

      const paymentResult = await client.execute(
        `
        select * from payments where userId = ? order by paymentDate desc
        `,
        [result.rows[0].clerk_user_id]
      )

      if (!paymentResult) {
        console.error('Error buscando usuario:', paymentResult);
        throw new Error('Error al consultar el usuario');
      }

      if (!paymentResult.rows[0]) {
        return {
          payment_count: 0,
          last_payment_date: null,
          next_payment_date: null,
          subscription_status: 'inactive',
          days_to_next_payment: 0,
          is_subscription_active: false
        };
      }

    const paymentDate = formattedDate(parseInt(paymentResult.rows[0].paymentDate?.toString() || '0'));
    const nextPaymentDate = formattedDate(parseInt(paymentResult.rows[0].nextPaymentDate?.toString() || '0'));
    const blockedPaymentDate = formattedDate(parseInt(paymentResult.rows[0].blockedPaymentDate?.toString() || '0'));
    const subscriptionStatus = this.isSubscriptionActive(nextPaymentDate);
    const daysToNextPayment = this.calculateDaysToNextPayment(nextPaymentDate);

    return {
        paymentId: paymentResult.rows[0].paymentId as string,
        userId: paymentResult.rows[0].userId as string,
        paymentDate: paymentDate,
        paymentCount: paymentResult.rows.length as number,
        nextPaymentDate: nextPaymentDate,
        lastPaymentDate: blockedPaymentDate,
        daysToNext: daysToNextPayment,
        subscriptionStatus: paymentResult.rows[0].status as string,
        isActive: subscriptionStatus
    }
      
    } catch (error) {
      console.error('Error al obtener información de pagos:', error);
      throw error;
    }
  }

  // Obtener historial de transacciones
  static async getPaymentHistory(userId: string) {
    try {
      const result = await client.execute(
        `
        SELECT id, clerk_user_id FROM usuarios WHERE clerk_user_id = ?
        `,
        [userId]
      )

      if (!result) {
        throw new Error('Usuario no encontrado');
      }
        
      const historyResult = await client.execute(
        `
        select * from payments where userId = ? order by paymentDate desc
        `,
        [result.rows[0].clerk_user_id]
      )

      if (!historyResult) {
        console.error('Error buscando usuario:', historyResult);
        throw new Error('Error al consultar el usuario');
      }

      if (!historyResult.rows[0]) {
        return [];
      }
      
      const newPaymentHistory: paymentHistory[] = [];

      historyResult.rows.forEach((item) => {
        const paymentDate = formattedDate(parseInt(item.paymentDate?.toString() || '0'));
        const nextPaymentDate = formattedDate(parseInt(item.nextPaymentDate?.toString() || '0'));
        const status = statusHistory(item.status as string);

        newPaymentHistory.push({
          id: item.id as number,
          transaction_date: paymentDate,
          amount: item.amount as string,
          status: status,
          payment_method: 'epayCO',
          subscription_period_start: paymentDate,
          subscription_period_end: nextPaymentDate,
        })
      })

      return newPaymentHistory.sort(
        (a, b) => 
            new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    );

    } catch (error) {
      console.error('Error al obtener historial:', error);
      throw error;
    }
  }

  // Calcular días restantes para el próximo pago
  static calculateDaysToNextPayment(nextPaymentDate: string | Date): number {
    if (!nextPaymentDate) return 0;
    
    const next = new Date(nextPaymentDate);
    const today = new Date();
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  // Verificar si la suscripción está activa
  static isSubscriptionActive(nextPaymentDate: string | Date): boolean {
    if (!nextPaymentDate) return false;
    return new Date(nextPaymentDate) > new Date();
  }
}

function uuidv4(): string {
  // Generates a RFC4122 version 4 UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

