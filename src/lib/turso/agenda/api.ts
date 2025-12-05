// src/lib/supabase/Header/index.ts
import { createClient } from '@libsql/client';

// Initialize Supabase client with service role key
const client = createClient({
    url: import.meta.env.TURSO_DATABASE_URL,
    authToken: import.meta.env.TURSO_AUTH_TOKEN
});

export async function SaveHorariosUsers({ userId, payload }: { userId: string, payload: any }) {
    try {

    } catch (error) {
        console.error('Error en GetUserGameHeader:', error);
        throw error;
    }
}
