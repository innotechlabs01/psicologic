import { createClient } from '@libsql/client';

/**
 * Único cliente libsql/TursoDB de la app.
 * Env: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (.env.example / dashboard Vercel).
 * No crear clientes createClient en otro archivo — importar este
 * (ver apps/rules/04-database-design.md §1).
 */
export const db = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
});
