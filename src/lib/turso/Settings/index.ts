import { createClient } from '@libsql/client';
import type { Games } from './interface';

// Initialize Supabase client with service role key
const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN
});

export async function createGame(game: Games): Promise<Games> {

    const data = await client.execute(
      `
        insert into games values (?,?,?)
      `,
      [game.name, game.description, game.slug]
    );
    
    if (data.rowsAffected === 0) {
        console.error('Error creating game:', data);
        throw data; 
    }
    return data as unknown as Games;
}
