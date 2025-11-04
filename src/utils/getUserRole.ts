import { createClient } from "@libsql/client";

const client = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN
});

export function getUserRole(userId: string): Promise<string> {
  return Promise.resolve(client
    .execute(
      `select role from usuarios where clerk_user_id = ?`,
      [userId]
    )
    .then(({ rows }) => {
      if (!rows || rows.length === 0) {
        console.warn("⚠️ Usuario no encontrado en la base de datos o sin rol");
        return ""; // siempre devolver string
      }
      return rows[0].role as string;
    })
);
}
