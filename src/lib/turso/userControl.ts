// src/lib/supabase/userControl.ts
import { createClient } from '@libsql/client';

const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN
});

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
    const result = await client.execute(
      `
        select * from usuarios where clerk_user_id = ?
      `,
      [clerkUserId]
    )

    if (!result || result.rows.length === 0) {
      console.error('Error obteniendo usuario:', result);
      return null;
    }

    return result.rows[0] as unknown as User;  
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
    const result = await client.execute(
      `
        update usuarios set
          status = 'approved',
          approved_by = ?,
          approved_at = ?
        where id = ?
      `,
      [approvedBy, new Date().toISOString(), userId]
    );

    if (!result || result.rowsAffected === 0) {
      console.error('Error aprobando usuario:', result);
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
    const result = await client.execute(
      `
        update usuarios set
          status = 'rejected',
          approved_by = ?,
          approved_at = ?
        where id = ?
      `,
      [rejectedBy, new Date().toISOString(), userId]
    );

    if (!result || result.rowsAffected === 0) {
      console.error('Error rechazando usuario:', result);
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
    const result = await client.execute(
      `
        update usuarios set
          status = 'suspended',
          approved_by = ?,
          approved_at = ?
        where id = ?
      `,
      [suspendedBy, new Date().toISOString(), userId]
    );

    if (!result || result.rowsAffected === 0) {
      console.error('Error suspendiendo usuario:', result);
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
    const result = await client.execute(
      `
        update usuarios set
          role = ?,
          updated_at = ?
        where id = ?
      `,
      [newRole, new Date().toISOString(), userId]
    );

    if (!result || result.rowsAffected === 0) {
      console.error('Error cambiando rol:', result);
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
    const result = await client.execute(
      `
        select * from usuarios where status = 'pending_approval' order by created_at desc
      `
    );

    if (!result || result.rows.length === 0) {
      console.error('Error obteniendo usuarios pendientes:', result);
      return [];
    }

    return result.rows as unknown as User[];
  } catch (error) {
    console.error('Error en getPendingUsers:', error);
    return [];
  }
}

// Crear notificación
async function createNotification(userId: string, type: string, message: string) {
  try {
    await client.execute(
      `
        insert into admin_notifications (user_id, type, message)
        values (?, ?, ?)
      `,
      [userId, type, message]
    );
  } catch (error) {
    console.error('Error creando notificación:', error);
  }
}
