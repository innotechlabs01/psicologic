// src/pages/api/webhooks/clerk.ts
import type { APIRoute } from 'astro';
import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

interface ClerkUserEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      verification: {
        status: string;
      };
    }>;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    image_url: string | null;
    created_at: number;
    updated_at: number;
    public_metadata: Record<string, any>;
    private_metadata: Record<string, any>;
    unsafe_metadata: Record<string, any>;
  };
}

async function handleUserCreated(userData: ClerkUserEvent['data']) {
  const primaryEmail = userData.email_addresses.find(email => 
    email.verification.status === 'verified'
  )?.email_address || userData.email_addresses[0]?.email_address;

  try {
    // Insertar usuario en Supabase
    const { data, error } = await supabase
      .from('users') // Ajusta el nombre de tu tabla
      .insert({
        clerk_user_id: userData.id,
        email: primaryEmail,
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username,
        avatar_url: userData.image_url,
        status: 'pending_approval', // Estado inicial para control
        role: 'org:client', // Rol por defecto
        created_at: new Date(userData.created_at),
        updated_at: new Date(userData.updated_at),
        metadata: userData.public_metadata
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting user into Supabase:', error);
      throw error;
    }

    console.log('Usuario creado en Supabase:', data);
    
    // Opcional: Enviar email de notificación a admins
    await notifyAdminsOfNewUser(data);
    
    return data;
  } catch (error) {
    console.error('Error en handleUserCreated:', error);
    throw error;
  }
}

async function handleUserUpdated(userData: ClerkUserEvent['data']) {
  const primaryEmail = userData.email_addresses.find(email => 
    email.verification.status === 'verified'
  )?.email_address || userData.email_addresses[0]?.email_address;

  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        email: primaryEmail,
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username,
        avatar_url: userData.image_url,
        updated_at: new Date(userData.updated_at),
        metadata: userData.public_metadata
      })
      .eq('clerk_user_id', userData.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user in Supabase:', error);
      throw error;
    }

    console.log('Usuario actualizado en Supabase:', data);
    return data;
  } catch (error) {
    console.error('Error en handleUserUpdated:', error);
    throw error;
  }
}

async function handleUserDeleted(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        status: 'deleted',
        deleted_at: new Date()
      })
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error marking user as deleted in Supabase:', error);
      throw error;
    }

    console.log('Usuario marcado como eliminado:', data);
    return data;
  } catch (error) {
    console.error('Error en handleUserDeleted:', error);
    throw error;
  }
}

async function notifyAdminsOfNewUser(user: any) {
  // Aquí puedes implementar notificaciones por email, Slack, etc.
  console.log('Nuevo usuario registrado, notificar admins:', user.email);
  
  // Ejemplo: Enviar email a admins
  // await sendEmailToAdmins({
  //   subject: 'Nuevo usuario registrado',
  //   message: `El usuario ${user.email} se ha registrado y está pendiente de aprobación.`
  // });
}

export const POST: APIRoute = async ({ request }) => {
  const WEBHOOK_SECRET = import.meta.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET no está configurado');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  try {
    // Obtener headers necesarios para verificar el webhook
    const svix_id = request.headers.get('svix-id');
    const svix_timestamp = request.headers.get('svix-timestamp');
    const svix_signature = request.headers.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
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
    } catch (err) {
      console.error('Error verificando webhook:', err);
      return new Response('Error: Verification failed', { status: 400 });
    }

    // Manejar diferentes tipos de eventos
    switch (evt.type) {
      case 'user.created':
        console.log('Nuevo usuario creado:', evt.data.id);
        await handleUserCreated(evt.data);
        break;

      case 'user.updated':
        console.log('Usuario actualizado:', evt.data.id);
        await handleUserUpdated(evt.data);
        break;

      case 'user.deleted':
        console.log('Usuario eliminado:', evt.data.id);
        await handleUserDeleted(evt.data.id);
        break;

      default:
        console.log('Evento no manejado:', evt.type);
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
