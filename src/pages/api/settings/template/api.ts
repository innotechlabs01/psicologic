import { createClient } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';

const db = createClient({
    url: import.meta.env.TURSO_DATABASE_URL,
    authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({locals, request}) => {
    const { userId: clerkUserId } = locals.auth();
    
    const body = await request.json();

    try {
        await db.execute(
            `
                UPDATE template_history
                    SET status = false
                    WHERE userId = :userId
            `,
            { userId: clerkUserId }
        )

        // Insertar o actualizar el template en la base de datos
        await db.execute({
            sql: 'INSERT INTO template_history (id, template, status, userId) VALUES (:id, :template, :status, :userId);',
            args: { id: uuidv4().toString(), template: JSON.stringify(body.structure), status: true, userId: clerkUserId }
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error al guardar el template:', error);
        return new Response(JSON.stringify({ error: 'Fallo interno al guardar el template.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
