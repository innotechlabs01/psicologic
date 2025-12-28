// src/lib/supabase/Header/index.ts
import { createClient } from '@libsql/client';
import type { UserGameHeader } from './interface';

// Initialize Supabase client with service role key
const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN
});

export async function GetUserGameHeader({ userId, isGame = false }: { userId: string; isGame?: boolean }) {
  try {
    // Fetch user by clerk_user_id
    const result = await client.execute(
      `
        select id, username from usuarios where clerk_user_id = ?
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

    if (!resultUser.rows[0]) {
      let newUser;
      if (isGame) {
        newUser = await client.execute(
          `
            insert into user_games (userId, menu, status) values (?, ?, ?)
          `,
          [currentUser?.id, JSON.stringify({ menu: [{ id: 1, name: "Juego", slug: "juego", status: true, subItem: [{ "id": 1, "name": "cartas", "slug": "cartas", "status": true }, { "id": 2, "name": "miedo", "slug": "globe-alt", "status": true }] }, { "id": 2, "name": "payment", "slug": "payment", "status": true }] }), true]
        );

      } else {
        newUser = await client.execute(
          `
            insert into user_games (userId, menu, status) values (?, ?, ?)
          `,
          [currentUser?.id, JSON.stringify({ menu: [{ id: 1, name: "users", slug: "users", status: true }, { id: 2, name: "agenda", slug: "history", status: true }, { id: 3, name: "Historia Clinica", slug: "history", status: true }, { id: 4, name: "Juego", slug: "juego", status: true, subItem: [{ "id": 1, "name": "cartas", "slug": "cartas", "status": true }, { "id": 2, "name": "miedo", "slug": "globe-alt", "status": true }] }, { "id": 5, "name": "payment", "slug": "payment", "status": true }, { id: 6, name: "message", slug: "message", status: true }, { id: 7, name: "feedback", slug: "feedback", status: true }, { id: 8, name: "Configuraciones", slug: "settings", status: true, subItem: [{ "id": 1, "name": "template", "slug": "cartas", "status": true }, { "id": 2, "name": "config_agend", "slug": "cartas", "status": true }] }] }), true]
        );
      }

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

    let menu = data.rows[0].menu ? JSON.parse(data.rows[0].menu as unknown as string) : null;

    if (!menu) {
      throw new Error('Menu data is invalid');
    }

    // If requested as a game session, ensure game menu exists
    if (isGame) {
      try {
        // Normalize menu to an array
        let menuArray: any[] = [];
        let isWrapped = false;

        if (Array.isArray(menu)) {
          menuArray = menu;
        } else if (menu && typeof menu === 'object' && Array.isArray(menu.menu)) {
          menuArray = menu.menu;
          isWrapped = true;
        }

        const hasGame = menuArray.some((m: any) => m && m.slug === 'juego');

        if (!hasGame) {
          const gameMenu = { id: 1, name: "Juego", slug: "juego", status: true, subItem: [{ id: 1, name: "cartas", slug: "cartas", status: true }, { id: 2, name: "miedo", slug: "globe-alt", status: true }] };
          menuArray.unshift(gameMenu);

          // Re-wrap if it was wrapped, or just save the array if that's the convention you want to enforce.
          // Based on the insert statements, it seems the intention is { menu: [...] }
          const newMenuData = isWrapped ? { ...menu, menu: menuArray } : menuArray;

          await client.execute(
            `update user_games set menu = ? where userId = ?`,
            [JSON.stringify(newMenuData), currentUser?.id]
          );

          // Update local variable to reflect change
          menu = newMenuData;
        }
      } catch (err) {
        console.error('Error ensuring game menu:', err);
      }
    }

    // Transform data to match expected format
    const transformedData = {
      username: currentUser?.username,
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

export async function GetUserGameClientHeader() {
  try {
    // Fetch user by clerk_user_id
    const result = await client.execute(
      `
        select id, username from usuarios where role = ?
      `,
      ['org:client']
    );

    if (!result || result.rows.length === 0) {
      console.error('Error buscando usuario:', result);
      throw new Error('Error al consultar el usuario');
    }

    let currentUser = result.rows;

    if (!currentUser) {
      throw new Error('User not found');
    }

    let newArrayGames = []

    for (let item of currentUser) {
      const resultUser = await client.execute(
        `
          select id, userId, menu, status from user_games where userId = ? and status = true
        `,
        [item?.id]
      );

      if (!resultUser) {
        console.error('Error checking existing user:', resultUser);
        throw new Error('Error al consultar el usuario existente');
      }

      const menu = resultUser.rows[0].menu ? JSON.parse(resultUser.rows[0].menu as unknown as string) : null;

      if (!menu) {
        throw new Error('Menu data is invalid');
      }

      // Transform data to match expected format
      const transformedData = {
        username: item?.username,
        userId: resultUser?.rows[0].userId,
        menu: menu,
        status: resultUser?.rows[0].status
      };

      newArrayGames.push(transformedData)
    }

    return newArrayGames;

  } catch (error) {
    console.error('Error en GetUserGameHeader:', error);
    throw error;
  }
}
