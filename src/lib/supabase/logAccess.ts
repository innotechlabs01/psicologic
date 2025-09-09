import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function logAccess({
  userId,
  email,
  role,
  route,
  ip
}: {
  userId: string;
  email?: string;
  role?: string;
  route: string;
  ip?: string;
}) {
  if (!userId) return;

  const { error } = await supabase.from('access_logs').insert([{
    user_id: userId,
    email,
    role,
    route,
    ip
  }]);

  if (error) console.error("Error registrando acceso:", error);
}
