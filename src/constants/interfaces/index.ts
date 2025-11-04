/**
 * Define la estructura del registro de pago de un usuario.
 */
export interface PaymentRecord {
  id: string;
  userId: string;
  nextPaymentDate: string; // ISO string
  blockedPaymentDate: string; // ISO string
  status: 'trial' | 'approved' | 'pending' | 'denied';
}

export interface PaymentModel {
  id: string;
  paymentId: string;
  userId: string;
  amount: number;
  status: string;
  paymentDate: string; // ISO string
  nextPaymentDate: string; // ISO string
  blockedPaymentDate: string; // ISO string
  created_at: string; // ISO string
}

export interface PaymentInfo {
  paymentId: string;
  userId: string;
  paymentDate: number; // ISO string
  payment_count: number;
  last_payment_date: number; // ISO string
  blocked_payment_date: number; // ISO string
  days_to_next_payment: number;
  is_subscription_active: boolean;
}

export interface paymentHistory {
  id: number;
  amount: string;
  status: string;
  payment_method: string;
  transaction_date: string;
  subscription_period_start: string;
  subscription_period_end: string;
}
