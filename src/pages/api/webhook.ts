import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

const CLERK_SECRET_KEY = import.meta.env.CLERK_SECRET_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.text();
    const event = JSON.parse(payload);

    if (event.type === 'user.created') {
      const user = event.data;
      const userId = user.id;
      const email = user.email_addresses?.[0]?.email_address || '';

      console.log(`Usuario creado: ${userId}. Asignando rol 'client' y flag 'isNewUser'.`);

      // 🔄 Actualizar metadatos vía API REST de Clerk
      await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`
        },
        body: JSON.stringify({
          public_metadata: {
            role: 'client',
            isNewUser: true
          }
        })
      });

      // 🗃️ Guardar en Supabase
      await supabase.from('users').insert([{
        user_id: userId,
        email,
        role: 'client',
        is_new_user: true
      }]);

      console.log(`Usuario ${userId} registrado en Supabase`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return new Response(JSON.stringify({ error: 'Error procesando webhook' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
