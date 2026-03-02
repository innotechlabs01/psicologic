// src/pages/api/webhooks/clerk.ts
import type { APIContext, APIRoute } from 'astro';
import { Webhook } from 'svix';
import { clerkClient } from '@clerk/astro/server';
import type { ClerkUserEvent } from './interface';
import { db } from '../../../lib/turso/client';

// 🆕 FUNCIÓN PARA CREAR USUARIO DESDE CLERK (LLAMADA DESDE MIDDLEWARE)
export async function createUserFromClerk(userData: ClerkUserEvent['data'], context?: APIContext, isGameLogin: boolean = false): Promise<any> {

  const primaryEmail = userData.email_addresses.find((email: any) =>
    email.verification.status === 'verified'
  )?.email_address || userData.email_addresses[0]?.email_address;

  try {
    // Primero verificar si el usuario ya existe
    const result = await db.execute(
      `select id, status, role from usuarios where clerk_user_id=? limit 1`, [userData.id]
    )

    if (result.rows[0] || result.rows.length > 0) {
      // Usuario existe, actualizar información
      const result = await db.execute(
        `update usuarios set 
          email=?,
          first_name=?,
          last_name=?,
          username=?,
          avatar_url=?,
          updated_at=?
          where clerk_user_id=?`,
        [
          primaryEmail,
          userData.first_name,
          userData.last_name,
          userData.username,
          userData.image_url,
          new Date(userData.updated_at || Date.now()).toISOString(),
          userData.id
        ]
      )
      if (!result || result.rows.length === 0) {
        throw result;
      }

      // If a patient exists with this email, activate their membership and link to this clerk user
      try {
        const patientRes = await db.execute(
          `select id from patientsClient where email = ? limit 1`, [primaryEmail]
        );
        if (patientRes && patientRes.rows[0]) {
          const patientId = patientRes.rows[0].id;
          await db.execute(
            `update patientsClient set membership_paid = ?, updated_at = ? where id = ?`,
            [1, new Date().toISOString(), patientId]
          );
          console.log(`✅ Activated membership for patient ${patientId} matching email ${primaryEmail}`);
        }
      } catch (err) {
        console.error('Error activating membership for patient:', err);
      }

      return result.rows[0];
    } else {

      // Usuario no existe, crear nuevo
      await db.execute(
        `
          insert into usuarios (
            clerk_user_id,
            email,
            first_name,
            last_name,
            username,
            avatar_url,
            status,
            role,
            login_count,
            created_at,
            updated_at,
            metadata
          ) values (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )
        `,
        [
          userData.id,
          primaryEmail,
          userData.first_name,
          userData.last_name,
          userData.username,
          userData.image_url,
          'active', // Estado inicial
          isGameLogin ? "org:moderator" : "org:client", // Rol por defecto
          0, // login_count
          new Date(userData.created_at || Date.now()).toISOString(),
          new Date(userData.updated_at || Date.now()).toISOString(),
          JSON.stringify({
            event: 'user_created_from_middleware',
            source: 'middleware_role_assignment',
            role: isGameLogin ? "org:moderator" : "org:client"
          })
        ]
      )

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

      // Check patientsClient table for matching email and activate membership/link user
      try {
        const patientRes = await db.execute(
          `select id from patientsClient where email = ? limit 1`, [primaryEmail]
        );
        if (patientRes && patientRes.rows[0]) {
          const patientId = patientRes.rows[0].id;
          await db.execute(
            `update patientsClient set membership_paid = ?, updated_at = ? where id = ?`,
            [1, new Date().toISOString(), patientId]
          );
          console.log(`✅ Activated membership for patient ${patientId} matching email ${primaryEmail}`);
        }
      } catch (err) {
        console.error('Error activating membership for patient:', err);
      }

      const result = await db.execute(
        `select * from usuarios where clerk_user_id=? limit 1`, [userData.id]
      )

      // Notificar a admins de nuevo usuario
      await notifyAdminsOfNewUser(result.rows[0]);

      return result.rows[0];
    }
  } catch (error) {
    console.error('Error en createUserFromClerk:', error);
    throw error;
  }
}

export async function createUserFromAdminClerk(userData: ClerkUserEvent['data']): Promise<any> {
  const primaryEmail = userData.email_addresses.find((email: any) =>
    email.verification.status === 'verified'
  )?.email_address || userData.email_addresses[0]?.email_address;

  try {
    // Primero verificar si el usuario ya existe
    const result = await db.execute(
      `select id, status, role from usuarios where clerk_user_id=? limit 1`, [userData.id]
    )

    if (result.rows[0] || result.rows.length > 0) {
      // Usuario existe, actualizar información
      const result = await db.execute(
        `update usuarios set 
          email=?,
          first_name=?,
          last_name=?,
          username=?,
          avatar_url=?,
          updated_at=?
          where clerk_user_id=?`,
        [
          primaryEmail,
          userData.first_name,
          userData.last_name,
          userData.username,
          userData.image_url,
          new Date(userData.updated_at || Date.now()).toISOString(),
          userData.id
        ]
      )
      if (!result) {
        throw result;
      }

      // If a patient exists with this email, activate their membership and link to this clerk user
      try {
        const patientRes = await db.execute(
          `select id from patientsClient where email = ? limit 1`, [primaryEmail]
        );
        if (patientRes && patientRes.rows[0]) {
          const patientId = patientRes.rows[0].id;
          await db.execute(
            `update patientsClient set membership_paid = ?, userId = ?, updated_at = ? where id = ?`,
            [1, userData.id, new Date().toISOString(), patientId]
          );
          console.log(`✅ Activated membership for patient ${patientId} matching email ${primaryEmail}`);
        }
      } catch (err) {
        console.error('Error activating membership for patient:', err);
      }

      return result.rows[0];
    } else {

      // Usuario no existe, crear nuevo
      await db.execute(
        `
          insert into usuarios (
            clerk_user_id,
            email,
            first_name,
            last_name,
            username,
            avatar_url,
            status,
            role,
            login_count,
            created_at,
            updated_at,
            metadata
          ) values (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )
        `,
        [
          userData.id,
          primaryEmail,
          userData.first_name,
          userData.last_name,
          userData.username,
          userData.image_url,
          'active', // Estado inicial
          'org:admin', // Rol por defecto
          0, // login_count
          new Date(userData.created_at || Date.now()).toISOString(),
          new Date(userData.updated_at || Date.now()).toISOString(),
          JSON.stringify({
            event: 'user_created_from_middleware',
            source: 'middleware_role_assignment',
            role: 'org:admin'
          })
        ]
      )

      // 📊 Registrar evento de creación
      await triggerUserAccessEvent({
        userId: userData.id,
        email: primaryEmail,
        action: 'login',
        route: '/register',
        role: 'org:admin',
        metadata: {
          event: 'user_created_from_middleware',
          source: 'middleware_role_assignment',
          userAgent: 'middleware'
        }
      });

      // Check patientsClient table for matching email and activate membership/link user
      try {
        const patientRes = await db.execute(
          `select id from patientsClient where email = ? limit 1`, [primaryEmail]
        );
        if (patientRes && patientRes.rows[0]) {
          const patientId = patientRes.rows[0].id;
          await db.execute(
            `update patientsClient set membership_paid = ?, userId = ?, updated_at = ? where id = ?`,
            [1, userData.id, new Date().toISOString(), patientId]
          );
          console.log(`✅ Activated membership for patient ${patientId} matching email ${primaryEmail}`);
        }
      } catch (err) {
        console.error('Error activating membership for patient:', err);
      }

      const result = await db.execute(
        `select * from usuarios where clerk_user_id=? limit 1`, [userData.id]
      )

      return result.rows[0];
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
    const result = await db.execute(
      `
      insert into access_logs (
        clerk_user_id,
        email,
        action,
        route,
        role,
        ip_address,
        user_agent,
        metadata,
        timestamp
      ) values (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      `,
      [
        payload.userId,
        payload.email ?? null,
        payload.action,
        payload.route,
        payload.role ?? null,
        payload.ip ?? null,
        payload.userAgent ?? null,
        JSON.stringify(payload.metadata),
        new Date().toISOString()
      ]
    )

    if (!result) {
      console.error('Error registrando access_log:', result);
    } else {
      console.log('✅ Access log registrado correctamente');
    }

    // 2. Actualizar última actividad del usuario
    if (payload.action === 'access' || payload.action === 'login') {
      const result = await db.execute(
        `
        update usuarios set 
          last_login = ?,
          last_ip = ?,
          login_count = login_count + 1
          where clerk_user_id = ?
        `,
        [
          new Date().toISOString(),
          payload.ip ?? null,
          payload.userId
        ]
      )

      if (!result) {
        console.error('Error actualizando última actividad:', result);
      } else {
        console.log('✅ Última actividad actualizada');
      }
    }

    // 3. Detectar actividad sospechosa (solo para acciones específicas)
    if (['denied', 'access'].includes(payload.action)) {
      await detectSuspiciousActivity(payload);
    }

    return result;
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
      const result = await db.execute(
        `
        select ip_address from access_logs
        where clerk_user_id = ? and timestamp >= ?
        limit 10
        `,
        [
          payload.userId,
          new Date(Date.now() - 30 * 60 * 1000).toISOString()
        ]
      )

      const uniqueIPs = [...new Set(result.rows?.map((log: any) => log.ip_address).filter(Boolean))];

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
      const result = await db.execute(
        `
        select id, route, timestamp from access_logs
        where clerk_user_id = ? and action = 'denied' and timestamp >= ?
        limit 5
        `,
        [
          payload.userId,
          new Date(Date.now() - 15 * 60 * 1000).toISOString()
        ]
      )

      if (result && result.rows.length >= 3) {
        await createSecurityAlert({
          userId: payload.userId,
          alertType: 'repeated_denied_access',
          severity: 'high',
          details: {
            attempts: result.rows.length,
            route: payload.route,
            timeframe: '15_minutes',
            attemptedRoutes: result.rows.map((a: any) => a.route)
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

    const result = await db.execute(
      `
      insert into security_alerts (clerk_user_id, alert_type, severity, details, status, created_at)
      values (?, ?, ?, ?, 'active', ?)
      returning *
      `,
      [
        alert.userId,
        alert.alertType,
        alert.severity,
        JSON.stringify(alert.details),
        new Date().toISOString()
      ]
    )

    if (!result) {
      throw new Error('Error creando alerta de seguridad');
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
    const primaryEmail = userData.email_addresses.find((email: any) =>
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
    const result = await db.execute(
      `
      update usuarios
      set status = 'deleted',
        deleted_at = ?
      where clerk_user_id = ?
      returning *
      `,
      [
        new Date().toISOString(),
        userId
      ]
    )

    if (!result) {
      throw new Error('Error actualizando usuario en la base de datos');
    }

    // 📊 Registrar evento de eliminación
    await triggerUserAccessEvent({
      userId,
      action: 'logout',
      route: '/deleted',
      metadata: { event: 'user_deleted', source: 'webhook' }
    });

    return result;
  } catch (error) {
    console.error('Error en handleUserDeleted:', error);
    throw error;
  }
}

async function notifyAdminsOfNewUser(user: any) {
  try {
    const result = await db.execute(
      `
      insert into admin_notifications (
        type,
        title,
        message,
        data,
        priority,
        status,
        created_at
      ) values (
        'new_user',
        'Nuevo usuario registrado',
        ?,
        ?,
        'medium',
        'unread',
        ?
      )
      `,
      [
        `El usuario ${user.email} se ha registrado y está activo.`,
        JSON.stringify({ userId: user.clerk_user_id, email: user.email }),
        new Date().toISOString()
      ]
    )

    if (!result) {
      console.error('Error creando notificación admin:', result);
    } else {
      console.log('✅ Notificación a admins creada correctamente');
    }
  } catch (error) {
    console.error('Error en notifyAdminsOfNewUser:', error);
  }
}

async function notifyAdminsSecurityAlert(alert: any) {
  try {

    const result = await db.execute(
      `
      insert into admin_notifications (
        type,
        title,
        message,
        data,
        priority,
        status,
        created_at
      ) values (
        'security_alert',
        'Alerta de Seguridad: ${alert.alertType}',
        'Se detectó actividad sospechosa para el usuario ${alert.userId}',
        ?,
        ${alert.severity === 'critical' ? 'urgent' : 'high'},
        'unread',
        ?
      )
      `,
      [
        JSON.stringify(alert),
        new Date().toISOString()
      ]
    )

    if (!result) {
      console.error('Error creando notificación de seguridad:', result);
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