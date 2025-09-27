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

    if (errorUser && errorUser.code !== 'PGRST116') {
      console.error('Error buscando usuario:', errorUser);
      throw new Error('Error al consultar el usuario');
    }

    let currentUser = user;

    if (!user) {
      throw new Error('User not found');
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from('user_games')
      .select('id')
      .eq('userId', currentUser?.id)
      .select()
      .single();

    if (existingUserError && existingUserError.code !== 'PGRST116') {
      console.error('Error checking existing user:', existingUserError);
      throw new Error('Error al consultar el usuario existente');
    }
    if (!existingUser) {
      const { data: newUser, error: insertError } = await supabase
        .from('user_games')
        .insert({ 
          userId: currentUser?.id,
          menu: JSON.stringify({menu: [{ id: 1, name: 'Juego', slug: 'juego',status: true, subItem:[{"id":1,"name":"cartas","slug":"cartas","status":true}]},{ id: 2, name: 'payment', slug: 'payment', status: true },{ id: 3, name: 'message', slug: 'message', status: true },{ id: 4, name: 'feedback', slug: 'feedback', status: true }]}),
          status: true })
        .select()
        .single();

      if (insertError || !newUser) {
        throw new Error('Error creating new user');
      }
    }

    // Fetch user game header
    const { data, error } = await supabase
      .from('user_games')
      .select('id, userId, menu, status')
      .eq('userId', currentUser?.id)
      .eq('status', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error buscando usuario:', error);
      throw new Error('Error al consultar el usuario');
    }

    if (!data) {
      throw new Error('User game header not found');
    }

   // const menu = data.menu ? JSON.parse(data.menu as unknown as string) : null;

    //if (!menu) {
    //  throw new Error('Menu data is invalid');
    //}
    
    // Transform data to match expected format
    const transformedData = {
      userId: data?.userId,
      menu: data.menu,
      status: data?.status
    };

    return transformedData; // Return a single object
  } catch (error) {
    console.error('Error en GetUserGameHeader:', error);
    throw error;
  }
}