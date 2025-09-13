// src/lib/supabase/userControl.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  status: 'pending_approval' | 'approved' | 'rejected' | 'suspended' | 'deleted';
  role: 'org:admin' | 'org:members' | 'org:client';
  metadata: any;
  created_at: string;
  updated_at: string;
  approved_by: string | null;
  approved_at: string | null;
}

// Obtener usuario por Clerk ID
export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error en getUserByClerkId:', error);
    return null;
  }
}

// Verificar si un usuario está aprobado
export async function isUserApproved(clerkUserId: string): Promise<boolean> {
  const user = await getUserByClerkId(clerkUserId);
  return user?.status === 'approved';
}

// Aprobar un usuario
export async function approveUser(userId: string, approvedBy: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error aprobando usuario:', error);
      return false;
    }

    // Crear notificación
    await createNotification(userId, 'status_change', 'Usuario aprobado exitosamente');
    
    return true;
  } catch (error) {
    console.error('Error en approveUser:', error);
    return false;
  }
}

// Rechazar un usuario
export async function rejectUser(userId: string, rejectedBy: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        status: 'rejected',
        approved_by: rejectedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error rechazando usuario:', error);
      return false;
    }

    // Crear notificación
    await createNotification(userId, 'status_change', 'Usuario rechazado');
    
    return true;
  } catch (error) {
    console.error('Error en rejectUser:', error);
    return false;
  }
}

// Suspender un usuario
export async function suspendUser(userId: string, suspendedBy: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        status: 'suspended',
        approved_by: suspendedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error suspendiendo usuario:', error);
      return false;
    }

    // Crear notificación
    await createNotification(userId, 'status_change', 'Usuario suspendido');
    
    return true;
  } catch (error) {
    console.error('Error en suspendUser:', error);
    return false;
  }
}

// Cambiar rol de usuario
export async function changeUserRole(
  userId: string, 
  newRole: 'org:admin' | 'org:members' | 'org:client',
  changedBy: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error cambiando rol:', error);
      return false;
    }

    // Crear notificación
    await createNotification(userId, 'role_change', `Rol cambiado a ${newRole}`);
    
    return true;
  } catch (error) {
    console.error('Error en changeUserRole:', error);
    return false;
  }
}

// Obtener usuarios pendientes de aprobación
export async function getPendingUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo usuarios pendientes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error en getPendingUsers:', error);
    return [];
  }
}

// Obtener todos los usuarios con filtros
export async function getUsers(filters?: {
  status?: string;
  role?: string;
  search?: string;
}): Promise<User[]> {
  try {
    let query = supabase.from('users').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.role) {
      query = query.eq('role', filters.role);
    }

    if (filters?.search) {
      query = query.or(`email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo usuarios:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error en getUsers:', error);
    return [];
  }
}

// Crear notificación
async function createNotification(userId: string, type: string, message: string) {
  try {
    await supabase
      .from('admin_notifications')
      .insert({
        user_id: userId,
        type,
        message
      });
  } catch (error) {
    console.error('Error creando notificación:', error);
  }
}
