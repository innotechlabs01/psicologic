import { createClient } from '@supabase/supabase-js';
import type { Games } from './interface';

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function createGame(game: Games): Promise<Games> {

    const { data, error } = await supabase
      .from('games')
      .insert(game)
      .select()
      .single();
    if (error) {
        console.error('Error creating game:', error);
        throw error;
    }
    return data as Games;
}
