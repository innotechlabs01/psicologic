// // src/lib/services/paymentService.ts
// import { SUBSCRIPTION_PRICE, SUBSCRIPTION_DAYS } from '../mercadopago';
// import type { PaymentData, CustomerData, PreferenceData } from '../mercadopago';

// import { createClient } from '@supabase/supabase-js';
// import mercadopago from 'mercadopago';

// // Configuración MercadoPago
// mercadopago.configure({
//   access_token: import.meta.env.MERCADOPAGO_ACCESS_TOKEN
// });

// const preference = mercadopago.preferences;
// const payment = mercadopago.payment;

// // Simulación de base de datos (reemplazar con acceso real a DB)
// const supabase = createClient(
//   import.meta.env.SUPABASE_URL,
//   import.meta.env.SUPABASE_SERVICE_ROLE_KEY
// );

// export class PaymentService {
  
//   // Obtener información de pagos de un usuario
//   static async getUserPaymentInfo(userId: string) {
//     try {
//       const { data: user, error: userError } = await supabase
//         .from('usuarios')
//         .select('id')
//         .eq('clerk_user_id', userId)
//         .single();

//       if (userError || !user) {
//         throw new Error('Usuario no encontrado');
//       }

//       const { data: userPayment, error: paymentError } = await supabase
//         .from('payments')
//         .select('*')
//         .eq('userId', user?.id)
//         .single();

//       if (paymentError && paymentError.code !== 'PGRST116') {
//         console.error('Error buscando usuario:', paymentError);
//         throw new Error('Error al consultar el usuario');
//       }

//       if (!userPayment) {
//         return {
//           payment_count: 0,
//           last_payment_date: null,
//           next_payment_date: null,
//           subscription_status: 'inactive',
//           days_to_next_payment: 0,
//           is_subscription_active: false
//         };
//       }

//       return userPayment;
//     } catch (error) {
//       console.error('Error al obtener información de pagos:', error);
//       throw error;
//     }
//   }

//   // Obtener historial de transacciones
//   static async getPaymentHistory(userId: string) {
//     try {
//       const { data: user, error: userError } = await supabase
//         .from('usuarios')
//         .select('id')
//         .eq('clerk_user_id', userId)
//         .single();

//       if (userError || !user) {
//         throw new Error('Usuario no encontrado');
//       }
        
//       const { data: history, error: historyError } = await supabase
//         .from('payments')
//         .select('*')
//         .eq('userId', user?.id);

//       if (historyError && historyError.code !== 'PGRST116') {
//         console.error('Error buscando usuario:', historyError);
//         throw new Error('Error al consultar el usuario');
//       }

//       if (!history) {
//         return [];
//       }
//       return history;
//     } catch (error) {
//       console.error('Error al obtener historial:', error);
//       throw error;
//     }
//   }

//   // Crear preferencia de pago (para Checkout Pro)
//   static async createPaymentPreference(userId: string, userEmail: string, userName?: string) {
//     try {
//       const preferenceData: PreferenceData = {
//         items: [{
//           id: 'subscription',
//           title: 'Suscripción Mensual Premium',
//           quantity: 1,
//           unit_price: SUBSCRIPTION_PRICE
//         }],
//         payer: {
//           email: userEmail,
//           name: userName?.split(' ')[0],
//           surname: userName?.split(' ').slice(1).join(' ')
//         },
//         back_urls: {
//           success: `${import.meta.env.PUBLIC_BASE_URL}/payment/success`,
//           failure: `${import.meta.env.PUBLIC_BASE_URL}/payment/failure`,
//           pending: `${import.meta.env.PUBLIC_BASE_URL}/payment/pending`
//         },
//         auto_return: 'approved',
//         notification_url: `${import.meta.env.PUBLIC_BASE_URL}/api/payment/webhook`,
//         external_reference: userId
//       };

//       const response = await preference.create({ body: preferenceData });
//       return response;
//     } catch (error) {
//       console.error('Error al crear preferencia:', error);
//       throw error;
//     }
//   }

//   // Procesar webhook de MercadoPago
//   static async processWebhook(paymentData: any) {
//     try {
//       const paymentInfo = await payment.get({ id: paymentData.id });
//       const userId = paymentInfo.body.external_reference;

//       if (!userId) {
//         throw new Error('No se encontró referencia de usuario');
//       }

//       await supabase
//         .from('payments')
//         .insert({
//           paymentId: uuidv4(), 
//           userId: userId, 
//           amount: paymentInfo.body.transaction_amount, 
//           status: paymentInfo.body.status, 
//           paymentDate: new Date(paymentInfo.body.date_approved), 
//           nextPaymentDate: new Date(Date.now() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000), 
//           blockedPaymentDate: new Date(Date.now() + (SUBSCRIPTION_DAYS + 5) * 24 * 60 * 60 * 1000), 
//           createdAt: new Date(), 
//         });

//       return paymentInfo;
//     } catch (error) {
//       console.error('Error al procesar webhook:', error);
//       throw error;
//     }
//   }

//   // Calcular días restantes para el próximo pago
//   static calculateDaysToNextPayment(nextPaymentDate: string | Date): number {
//     if (!nextPaymentDate) return 0;
    
//     const next = new Date(nextPaymentDate);
//     const today = new Date();
//     const diffTime = next.getTime() - today.getTime();
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
//     return Math.max(0, diffDays);
//   }

//   // Verificar si la suscripción está activa
//   static isSubscriptionActive(nextPaymentDate: string | Date): boolean {
//     if (!nextPaymentDate) return false;
//     return new Date(nextPaymentDate) > new Date();
//   }
// }

// function uuidv4(): string {
//   // Generates a RFC4122 version 4 UUID
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
//     const r = Math.random() * 16 | 0;
//     const v = c === 'x' ? r : (r & 0x3 | 0x8);
//     return v.toString(16);
//   });
// }

