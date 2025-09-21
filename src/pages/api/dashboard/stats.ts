// src/pages/api/dashboard/stats.ts
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const GET: APIRoute = async ({ request }) => {
  try {
    // Verificar autenticación del admin (implementar según tu sistema)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    // Obtener estadísticas en paralelo
    const [usersResult, logsResult, alertsResult, notificationsResult] = await Promise.all([
      // Total de usuarios por estado
      supabase
        .from('usuarios')
        .select('status, role')
        .not('status', 'eq', 'deleted'),
      
      // Logs de acceso de las últimas 24 horas
      supabase
        .from('access_logs')
        .select('action')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      
      // Alertas de seguridad activas
      supabase
        .from('security_alerts')
        .select('severity')
        .eq('status', 'active'),
      
      // Notificaciones no leídas
      supabase
        .from('admin_notifications')
        .select('priority')
        .eq('status', 'unread')
    ]);

    if (usersResult.error) throw usersResult.error;
    if (logsResult.error) throw logsResult.error;
    if (alertsResult.error) throw alertsResult.error;
    if (notificationsResult.error) throw notificationsResult.error;

    const users = usersResult.data || [];
    const logs = logsResult.data || [];
    const alerts = alertsResult.data || [];
    const notifications = notificationsResult.data || [];

    // Calcular estadísticas
    const stats = {
      users: {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        pending: users.filter(u => u.status === 'pending_approval').length,
        suspended: users.filter(u => u.status === 'suspended').length,
        byRole: {
          admin: users.filter(u => u.role === 'org:admin').length,
          client: users.filter(u => u.role === 'org:client').length,
          moderator: users.filter(u => u.role === 'org:moderator').length
        }
      },
      access: {
        total: logs.length,
        successful: logs.filter(l => ['access', 'login'].includes(l.action)).length,
        denied: logs.filter(l => l.action === 'denied').length,
        redirects: logs.filter(l => l.action === 'redirect').length
      },
      security: {
        totalAlerts: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length
      },
      notifications: {
        total: notifications.length,
        urgent: notifications.filter(n => n.priority === 'urgent').length,
        high: notifications.filter(n => n.priority === 'high').length
      }
    };

    return new Response(JSON.stringify({ stats }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// src/pages/api/dashboard/users.ts
export const GET_USERS: APIRoute = async ({ request, url }) => {
  try {
    const searchParams = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    
    let query = supabase
      .from('usuarios')
      .select(`
        *,
        access_logs!left(
          count
        )
      `)
      .not('status', 'eq', 'deleted')
      .order('created_at', { ascending: false });

    // Filtros opcionales
    if (status) {
      query = query.eq('status', status);
    }
    
    if (role) {
      query = query.eq('role', role);
    }

    // Paginación
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return new Response(JSON.stringify({
      users: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { 
      status: 500 
    });
  }
};

// src/pages/api/dashboard/user/[id]/status.ts
export const PATCH: APIRoute = async ({ request, params }) => {
  try {
    const { id } = params;
    const { status, notes } = await request.json();

    if (!id || !status) {
      return new Response(JSON.stringify({ error: 'ID y status son requeridos' }), { 
        status: 400 
      });
    }

    // Validar status permitidos
    const validStatuses = ['active', 'suspended', 'pending_approval', 'inactive'];
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: 'Status inválido' }), { 
        status: 400 
      });
    }

    // Actualizar usuario
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_user_id', id)
      .select()
      .single();

    if (error) throw error;

    // Registrar en audit log
    await supabase
      .from('audit_log')
      .insert({
        actor_user_id: 'admin', // Obtener del token JWT
        target_user_id: id,
        target_table: 'usuarios',
        target_id: data.id.toString(),
        action: 'UPDATE',
        old_values: { status: 'previous_status' }, // Obtener valor anterior
        new_values: { status },
        source: 'admin_dashboard',
        created_at: new Date().toISOString()
      });

    // Crear notificación al usuario si es necesario
    if (status === 'active') {
      await supabase
        .from('admin_notifications')
        .insert({
          type: 'user_approved',
          title: 'Usuario Aprobado',
          message: `El usuario ${data.email} ha sido aprobado y puede acceder al sistema.`,
          data: { userId: id, email: data.email },
          priority: 'medium',
          status: 'unread'
        });
    }

    return new Response(JSON.stringify({ 
      message: 'Usuario actualizado correctamente',
      user: data 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { 
      status: 500 
    });
  }
};

// src/pages/api/dashboard/alerts.ts
export const GET_ALERTS: APIRoute = async ({ request }) => {
  try {
    const searchParams = new URL(request.url).searchParams;
    const severity = searchParams.get('severity');
    const status = searchParams.get('status') || 'active';

    let query = supabase
      .from('security_alerts')
      .select(`
        *,
        usuarios!inner(email, first_name, last_name)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;

    return new Response(JSON.stringify({ alerts: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { 
      status: 500 
    });
  }
};

// src/pages/api/dashboard/alerts/[id]/resolve.ts
export const POST_RESOLVE: APIRoute = async ({ request, params }) => {
  try {
    const { id } = params;
    const { resolution_notes } = await request.json();

    const { data, error } = await supabase
      .from('security_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: 'admin', // Obtener del JWT
        details: {
          // ...data.details,
          resolution_notes
        }
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ 
      message: 'Alerta resuelta correctamente',
      alert: data 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error resolviendo alerta:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { 
      status: 500 
    });
  }
};

// src/pages/api/dashboard/activity.ts - Para tiempo real
export const GET_ACTIVITY: APIRoute = async ({ request }) => {
  try {
    const searchParams = new URL(request.url).searchParams;
    const since = searchParams.get('since') || new Date(Date.now() - 5 * 60 * 1000).toISOString(); // Últimos 5 minutos

    const { data, error } = await supabase
      .from('access_logs')
      .select('*')
      .gte('timestamp', since)
      .order('timestamp', { ascending: false })
      .limit(20);

    if (error) throw error;

    return new Response(JSON.stringify({ 
      activity: data,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Error obteniendo actividad:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { 
      status: 500 
    });
  }
};