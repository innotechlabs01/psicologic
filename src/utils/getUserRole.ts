import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export function getUserRole(userId: string): Promise<string> {
  return Promise.resolve(supabase
    .from("usuarios")
    .select("role")
    .eq("clerk_user_id", userId)
    .single()
    .then(({ data, error }) => {
      if (error || !data || !data.role) {
        console.warn("⚠️ Usuario no encontrado en Supabase o sin rol:", error);
        return ""; // siempre devolver string
      }
      return data.role as string;
    })
);
}
