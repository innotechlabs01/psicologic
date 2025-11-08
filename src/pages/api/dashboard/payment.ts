// /pages/api/payments.ts
import { createClient } from "@libsql/client";
import type { APIRoute } from 'astro';

const client = createClient({
    url: import.meta.env.TURSO_DATABASE_URL,
    authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

export const GET: APIRoute = async ({ request }) => {
    try {
        // Ejecutar consulta a Turso (ajusta tu consulta SQL real aquí)
        const result = await client.execute(`select py.* ,
            u.username ,
            u.email
            from payments py
            INNER JOIN usuarios u on py.userId = u.clerk_user_id`); 
        
        // Devolver los datos
        return new Response(JSON.stringify(result.rows), { // result.rows contendrá tus datos
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error("Error al obtener pagos:", error);
        return new Response(JSON.stringify({ message: "Error al obtener datos de pagos" }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}
