// src/lib/mercadopago.ts
// Tipos para TypeScript
export interface PaymentData {
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  external_reference?: string;
  notification_url?: string;
}

export interface CustomerData {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: {
    area_code: string;
    number: string;
  };
}

export interface PreferenceData {
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
  }>;
  payer?: {
    email: string;
    name?: string;
    surname?: string;
  };
  back_urls?: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: 'approved' | 'all';
  notification_url?: string;
  external_reference?: string;
}

// Constantes
export const SUBSCRIPTION_PRICE = 100.000; // Precio de la suscripción mensual
export const SUBSCRIPTION_DAYS = 30; // Duración en días