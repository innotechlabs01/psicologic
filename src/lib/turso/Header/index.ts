// src/lib/supabase/Header/index.ts
import { createClient } from '@libsql/client';
import type { UserGameHeader } from './interface';

// Initialize Supabase client with service role key
const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN
});

export async function GetUserGameHeader({ userId }: { userId: string }) {
  try {
    // Fetch user by clerk_user_id
    const result = await client.execute(
      `
        select id from usuarios where clerk_user_id = ?
      `,
      [userId]
    );

    if (!result || result.rows.length === 0) {
      console.error('Error buscando usuario:', result);
      throw new Error('Error al consultar el usuario');
    }

    let currentUser = result.rows[0];

    if (!currentUser) {
      throw new Error('User not found');
    }

    const resultUser = await client.execute(
      `
        select id, userId, menu, status from user_games where userId = ? and status = true
      `,
      [currentUser?.id]
    );

    if (!resultUser) {
      console.error('Error checking existing user:', resultUser);
      throw new Error('Error al consultar el usuario existente');
    }
    if (!resultUser.rows[0]) {
      const newUser = await client.execute(
        `
          insert into user_games (userId, menu, status) values (?, ?, ?)
        `,
        [currentUser?.id, JSON.stringify({menu: [{ id: 1, name: 'Juego', slug: 'juego',status: true, subItem:[{"id":1,"name":"cartas","slug":"cartas","status":true}, {"id": 2,"name": "overcome_fears","slug": "globe-alt","status": true}]},{ id: 2, name: 'payment', slug: 'payment', status: true },{ id: 3, name: 'message', slug: 'message', status: true },{ id: 4, name: 'feedback', slug: 'feedback', status: true }]}), true]
      );

      if (!newUser) {
        throw new Error('Error creating new user');
      }
    }

    // Fetch user game header
    const data = await client.execute(
      `
        select id, userId, menu, status from user_games where userId = ? and status = true
      `,
      [currentUser?.id]
    );

    if (!data || data.rows.length === 0) {
      console.error('Error buscando usuario:', data);
      throw new Error('Error al consultar el usuario');
    }

    if (!data.rows[0]) {
      throw new Error('User game header not found');
    }

   const menu = data.rows[0].menu ? JSON.parse(data.rows[0].menu as unknown as string) : null;

    if (!menu) {
     throw new Error('Menu data is invalid');
    }
    
    // Transform data to match expected format
    const transformedData = {
      userId: data?.rows[0].userId,
      menu: menu,
      status: data?.rows[0].status
    };

    return transformedData; // Return a single object
  } catch (error) {
    console.error('Error en GetUserGameHeader:', error);
    throw error;
  }
}