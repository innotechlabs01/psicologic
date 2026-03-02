import { db as client } from "../lib/turso/client";

export function getUserRole(userId: string): Promise<string> {
  return Promise.resolve(client
    .execute(
      `select role from usuarios where clerk_user_id = ?`,
      [userId]
    )
    .then(({ rows }: any) => {
      if (!rows || rows.length === 0) {
        console.warn("⚠️ Usuario no encontrado en la base de datos o sin rol");
        return ""; // siempre devolver string
      }
      return rows[0].role as string;
    })
  );
}
