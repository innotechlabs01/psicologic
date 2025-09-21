// src/pages/api/webhooks/clerk.ts
import type { APIContext, APIRoute } from 'astro';
import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';
import type { ClerkUserEvent } from './interface';

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🆕 FUNCIÓN PARA CREAR USUARIO DESDE CLERK (LLAMADA DESDE MIDDLEWARE)
export async function createUserFromClerk(userData: ClerkUserEvent['data']): Promise<any> {
  const primaryEmail = userData.email_addresses.find(email => 
    email.verification.status === 'verified'
  )?.email_address || userData.email_addresses[0]?.email_address;

  try {
    // Primero verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id, status, role')
      .eq('clerk_user_id', userData.id)
      .single();

    if (existingUser) {
      // Usuario existe, actualizar información
      const { data, error } = await supabase
        .from('usuarios')
        .update({
          email: primaryEmail,
          first_name: userData.first_name,
          last_name: userData.last_name,
          username: userData.username,
          avatar_url: userData.image_url,
          updated_at: new Date(userData.updated_at || Date.now()).toISOString(),
          metadata: userData.public_metadata
        })
        .eq('clerk_user_id', userData.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } else {
      
      // Usuario no existe, crear nuevo
      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          clerk_user_id: userData.id,
          email: primaryEmail,
          first_name: userData.first_name,
          last_name: userData.last_name,
          username: userData.username,
          avatar_url: userData.image_url,
          status: 'pending_approval', // Estado inicial
          role: 'org:client', // Rol por defecto
          login_count: 0,
          created_at: new Date(userData.created_at || Date.now()).toISOString(),
          updated_at: new Date(userData.updated_at || Date.now()).toISOString(),
          metadata: userData.public_metadata
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      // 📊 Registrar evento de creación
      await triggerUserAccessEvent({
        userId: userData.id,
        email: primaryEmail,
        action: 'login',
        route: '/register',
        role: 'org:client',
        metadata: { 
          event: 'user_created_from_middleware', 
          source: 'middleware_role_assignment',
          userAgent: 'middleware'
        }
      });
      
      // Notificar a admins de nuevo usuario
      await notifyAdminsOfNewUser(data);
      
      return data;
    }
  } catch (error) {
    console.error('Error en createUserFromClerk:', error);
    throw error;
  }
}

// 🔗 FUNCIÓN PARA LLAMAR DESDE EL MIDDLEWARE
export async function triggerUserAccessEvent(payload: {
  userId: string;
  email?: string;
  action: 'login' | 'logout' | 'access' | 'redirect' | 'denied';
  route: string;
  role?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}) {
  try {
    // Saltar logging para administradores si es solo acceso normal
    if (payload.role === 'org:admin' && payload.action === 'access') {
      console.log('✅ Usuario es administrador - registro simplificado.');
      return;
    }

    // 1. Registrar en tabla de access_logs
    const { data: accessLog, error: accessError } = await supabase
      .from('access_logs')
      .insert({
        clerk_user_id: payload.userId,
        email: payload.email,
        action: payload.action,
        route: payload.route,
        role: payload.role,
        ip_address: payload.ip,
        user_agent: payload.userAgent,
        metadata: payload.metadata,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (accessError) {
      console.error('Error registrando access_log:', accessError);
    } else {
      console.log('✅ Access log registrado correctamente');
    }

    // 2. Actualizar última actividad del usuario
    if (payload.action === 'access' || payload.action === 'login') {      
      const { error: userError } = await supabase
        .from('usuarios')
        .update({
          last_login: new Date().toISOString(),
          last_ip: payload.ip,
          login_count: supabase.rpc('increment_login_count', { user_id: payload.userId })
        })
        .eq('clerk_user_id', payload.userId);

      if (userError) {
        console.error('Error actualizando última actividad:', userError);
      } else {
        console.log('✅ Última actividad actualizada');
      }
    }

    // 3. Detectar actividad sospechosa (solo para acciones específicas)
    if (['denied', 'access'].includes(payload.action)) {
      await detectSuspiciousActivity(payload);
    }

    return accessLog;
  } catch (error) {
    console.error('Error en triggerUserAccessEvent:', error);
    return null;
  }
}

// 🛡️ DETECCIÓN DE ACTIVIDAD SOSPECHOSA
async function detectSuspiciousActivity(payload: {
  userId: string;
  ip?: string;
  route: string;
  action: string;
}) {
  try {
    // Verificar múltiples IPs en corto tiempo
    if (payload.ip && payload.userId !== 'anonymous') {
      const { data: recentIPs } = await supabase
        .from('access_logs')
        .select('ip_address')
        .eq('clerk_user_id', payload.userId)
        .gte('timestamp', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Últimos 30 min
        .limit(10);

      const uniqueIPs = [...new Set(recentIPs?.map(log => log.ip_address).filter(Boolean))];
      
      if (uniqueIPs.length > 3) {
        await createSecurityAlert({
          userId: payload.userId,
          alertType: 'multiple_ips',
          severity: 'medium',
          details: { ips: uniqueIPs, count: uniqueIPs.length, timeframe: '30_minutes' }
        });
      }
    }

    // Verificar intentos de acceso denegado repetidos
    if (payload.action === 'denied' && payload.userId !== 'anonymous') {
      const { data: deniedAttempts } = await supabase
        .from('access_logs')
        .select('id, route, timestamp')
        .eq('clerk_user_id', payload.userId)
        .eq('action', 'denied')
        .gte('timestamp', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Últimos 15 min
        .limit(5);

      if (deniedAttempts && deniedAttempts.length >= 3) {
        await createSecurityAlert({
          userId: payload.userId,
          alertType: 'repeated_denied_access',
          severity: 'high',
          details: { 
            attempts: deniedAttempts.length, 
            route: payload.route,
            timeframe: '15_minutes',
            attemptedRoutes: deniedAttempts.map(a => a.route)
          }
        });
      }
    }

    // Verificar accesos fuera de horario (opcional)
    const currentHour = new Date().getHours();
    if (payload.action === 'access' && (currentHour < 6 || currentHour > 22)) {
      // Opcional: crear alerta de baja prioridad para accesos fuera de horario
      await createSecurityAlert({
        userId: payload.userId,
        alertType: 'off_hours_access',
        severity: 'low',
        details: { 
          hour: currentHour, 
          route: payload.route,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Error detectando actividad sospechosa:', error);
  }
}

// 🚨 CREAR ALERTA DE SEGURIDAD
async function createSecurityAlert(alert: {
  userId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
}) {
  try {

    const { error } = await supabase
      .from('security_alerts')
      .insert({
        clerk_user_id: alert.userId,
        alert_type: alert.alertType,
        severity: alert.severity,
        details: alert.details,
        status: 'active',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creando alerta de seguridad:', error);
    } else {      
      // Notificar a admins si es crítica o alta
      if (['critical', 'high'].includes(alert.severity)) {
        await notifyAdminsSecurityAlert(alert);
      }
    }
  } catch (error) {
    console.error('Error en createSecurityAlert:', error);
  }
}

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

async function handleUserDeleted(userId: string) {
  try {

    
    const { data, error } = await supabase
      .from('usuarios')
      .update({ 
        status: 'deleted',
        deleted_at: new Date().toISOString()
      })
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 📊 Registrar evento de eliminación
    await triggerUserAccessEvent({
      userId,
      action: 'logout',
      route: '/deleted',
      metadata: { event: 'user_deleted', source: 'webhook' }
    });

    return data;
  } catch (error) {
    console.error('Error en handleUserDeleted:', error);
    throw error;
  }
}

async function notifyAdminsOfNewUser(user: any) {
  try {    
    const { error } = await supabase
      .from('admin_notifications')
      .insert({
        type: 'new_user',
        title: 'Nuevo usuario registrado',
        message: `El usuario ${user.email} se ha registrado y está pendiente de aprobación.`,
        data: { userId: user.clerk_user_id, email: user.email },
        priority: 'medium',
        status: 'unread',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creando notificación admin:', error);
    } else {
      console.log('✅ Notificación a admins creada correctamente');
    }
  } catch (error) {
    console.error('Error en notifyAdminsOfNewUser:', error);
  }
}

async function notifyAdminsSecurityAlert(alert: any) {
  try {
    
    const { error } = await supabase
      .from('admin_notifications')
      .insert({
        type: 'security_alert',
        title: `Alerta de Seguridad: ${alert.alertType}`,
        message: `Se detectó actividad sospechosa para el usuario ${alert.userId}`,
        data: alert,
        priority: alert.severity === 'critical' ? 'urgent' : 'high',
        status: 'unread',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creando notificación de seguridad:', error);
    } else {
      console.log('✅ Notificación de alerta de seguridad creada');
    }
  } catch (error) {
    console.error('Error en notifyAdminsSecurityAlert:', error);
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
        result = await handleUserDeleted(evt.data.id);
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