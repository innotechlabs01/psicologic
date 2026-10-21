// Webhook de Clerk (svix) — SOLO verificación de firma y dispatch de eventos.
// La lógica de provisioning/accesos vive en src/lib/clerk/user-provisioning.
import type { APIRoute } from 'astro';
import { Webhook } from 'svix';
import {
  createUserFromClerk,
  triggerUserAccessEvent,
  softDeleteUser,
} from '../../../lib/clerk/user-provisioning';
import type { ClerkUserEvent } from '../../../lib/clerk/types';

async function handleUserCreated(userData: ClerkUserEvent['data']) {
  return await createUserFromClerk(userData);
}

async function handleUserUpdated(userData: ClerkUserEvent['data']) {

  try {
    const result = await createUserFromClerk(userData);

    // 📊 Registrar evento de actualización
    const primaryEmail = userData.email_addresses.find(email =>
      email.verification.status === 'verified'
    )?.email_address || userData.email_addresses[0]?.email_address;

    await triggerUserAccessEvent({
      userId: userData.id,
      email: primaryEmail,
      action: 'access',
      route: '/profile',
      metadata: { event: 'user_updated', source: 'webhook' }
    });

    return result;
  } catch (error) {
    console.error('Error en handleUserUpdated:', error);
    throw error;
  }
}

export const POST: APIRoute = async ({ request }) => {
  const WEBHOOK_SECRET = import.meta.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET no está configurado');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  try {
    console.log('🔗 Procesando webhook de Clerk...');

    // Obtener headers necesarios para verificar el webhook
    const svix_id = request.headers.get('svix-id');
    const svix_timestamp = request.headers.get('svix-timestamp');
    const svix_signature = request.headers.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Headers de svix faltantes');
      return new Response('Error: Missing svix headers', { status: 400 });
    }

    // Obtener el body del request
    const body = await request.text();

    // Crear instancia del webhook de svix
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: ClerkUserEvent;

    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as ClerkUserEvent;

      console.log(`✅ Webhook verificado correctamente - Tipo: ${evt.type}`);
    } catch (err) {
      console.error('Error verificando webhook:', err);
      return new Response('Error: Verification failed', { status: 400 });
    }

    // Manejar diferentes tipos de eventos
    let result;
    switch (evt.type) {
      case 'user.created':
        console.log('🆕 Procesando creación de usuario:', evt.data.id);
        result = await handleUserCreated(evt.data);
        console.log('✅ Usuario creado procesado correctamente');
        break;

      case 'user.updated':
        console.log('🔄 Procesando actualización de usuario:', evt.data.id);
        result = await handleUserUpdated(evt.data);
        console.log('✅ Usuario actualizado procesado correctamente');
        break;

      case 'user.deleted':
        console.log('🗑️ Procesando eliminación de usuario:', evt.data.id);
        result = await softDeleteUser(evt.data.id);
        console.log('✅ Usuario eliminado procesado correctamente');
        break;

      default:
        console.log(`⚠️ Evento no manejado: ${evt.type}`);
        return new Response(`Event type ${evt.type} not handled`, { status: 200 });
    }

    console.log('✅ Webhook procesado exitosamente');
    return new Response(JSON.stringify({
      success: true,
      eventType: evt.type,
      processed: true,
      result: result ? 'User processed' : 'No result'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
