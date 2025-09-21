// src/lib/supabase/Header/index.ts
import { createClient } from '@supabase/supabase-js';
import type { UserGameHeader } from './interface';

// Initialize Supabase client with service role key
const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GetUserGameHeader({ userId }: { userId: string }) {
  try {
    // Fetch user by clerk_user_id
    const { data: user, error: errorUser } = await supabase
      .from('usuarios')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (errorUser || !user) {
      console.error('Error buscando usuario:', errorUser);
      throw new Error('Usuario no encontrado');
    }

    // Fetch user game header
    const { data, error } = await supabase
      .from('user_games')
      .select('id, userId, menu, status')
      .eq('userId', user.id)
      .eq('status', true)
      .single();

    if (error || !data) {
      console.error('Error fetching user game header:', error);
      throw new Error('No se encontraron datos de juego para el usuario');
    }
    
    // Transform data to match expected format
    const transformedData = {
      userId: data.userId,
      menu: data.menu as UserGameHeader['menu'],
      status: data.status
    };

    return transformedData; // Return a single object
  } catch (error) {
    console.error('Error en GetUserGameHeader:', error);
    throw error;
  }
}