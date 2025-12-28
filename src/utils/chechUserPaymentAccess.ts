
import { createClient } from "@libsql/client";
import type { PaymentRecord } from "src/constants/interfaces";

// Inicializar Supabase (se asume que estas variables de entorno están disponibles)
const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,   // e.g. "libsql://your-db.turso.io"
  authToken: import.meta.env.TURSO_AUTH_TOKEN, // from `turso db tokens create`
});

/**
 * Valida el estado de pago del usuario y determina si debe tener acceso a la aplicación.
 * @param userId El ID del usuario de Clerk.
 * @returns Un objeto con el estado de acceso (canAccess) y los días restantes.
 */
export async function checkUserPaymentAccess(userId: string): Promise<{ canAccess: boolean, daysRemaining: number }> {
  console.log(`Checking payment access for user: ${userId}`);

  try {
    // 1. Obtener el registro de pago más reciente para el usuario
    const result = await client
      .execute(`select nextPaymentDate, blockedPaymentDate, status from payments where userId = ? order by createdAt desc limit 1`, [userId]);

    const payment = result.rows[0] as unknown as PaymentRecord;

    // 1. Si no hay registro de pago, se asume que el usuario no ha completado el primer inicio de sesión
    // o no ha pasado por el proceso de asignación de rol. Permitir acceso para que el middleware lo cree.
    if (!payment) {
      console.log('ℹ️ No payment record found. Allowing access for initial setup.');
      return { canAccess: true, daysRemaining: 15 };
    }

    const now = new Date();
    const nextPaymentDate = new Date(payment.nextPaymentDate); // Fin del período pagado/prueba
    const blockedPaymentDate = new Date(payment.blockedPaymentDate); // Fin del período de gracia

    // Calcular días restantes hasta la fecha de bloqueo
    const timeToBlock = blockedPaymentDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeToBlock / (1000 * 60 * 60 * 24));

    // Calcular días restantes hasta la fecha de pago
    const timeToPayment = nextPaymentDate.getTime() - now.getTime();
    const daysToPayment = Math.ceil(timeToPayment / (1000 * 60 * 60 * 24));

    console.log(`Payment status: ${payment.status}. Days to Block: ${daysRemaining}. Days to Next Payment: ${daysToPayment}`);


    // 3. Lógica de Acceso:
    // El usuario puede acceder si la fecha de bloqueo (fin de prorroga) aún no ha pasado.
    const canAccess = now < blockedPaymentDate;

    // Lógica para el botón de pago (opcional, pero útil para el frontend)
    // El botón se activa 10 días antes de nextPaymentDate (dias restantes de pago <= 10)
    // Se puede almacenar daysToPayment en la metadata de Clerk o usar una API de Astro para exponerlo.

    // 4. Actualizar estado del usuario en la tabla 'usuarios' si el acceso ha expirado
    if (!canAccess && payment.status !== 'denied') {
      // El usuario debe ser marcado como 'denied' en la tabla 'usuarios'
      console.log(`🚫 Access expired. Denying user ${userId} and setting status to 'denied'.`);
      await client.execute(`update usuarios set status='denied' where clerk_user_id=?`, [userId])
      return { canAccess: false, daysRemaining: daysToPayment };
    } else if (canAccess && payment.status === 'denied') {
      // Si por alguna razón el usuario está marcado como 'denied' pero aún tiene acceso
      // (ej. acaba de pagar), se podría resetear el estado, pero la lógica de pago
      // se encargaría de actualizar el registro principal, lo cual es mejor.
      // Solo nos enfocamos en el bloqueo.
      return { canAccess: false, daysRemaining: 0 };
    }

    return { canAccess, daysRemaining: daysToPayment };

  } catch (error) {
    console.error('❌ Unexpected error in checkUserPaymentAccess:', error);
    // Fallback de seguridad: si algo falla, no bloqueamos el acceso.
    return { canAccess: false, daysRemaining: 999 };
  }
}
