import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client';

const db = createClient({
    url: import.meta.env.TURSO_DATABASE_URL,
    authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

export const POST: APIRoute = async ({ params, request, locals }) => {
    // 1. OBTENCIÓN DE DATOS Y AUTENTICACIÓN
    const { ticketId } = params; // Obtenido de la URL: /api/tickets/TICKET_ID/close
    const { userId: clerkUserId } = locals.auth();

    if (!clerkUserId || !ticketId) {
        return new Response(
            JSON.stringify({ error: "Datos faltantes o no autorizado." }),
            { status: 401 }
        );
    }
    
    // 2. VERIFICACIÓN DE ROL Y OBTENCIÓN DE ID INTERNO
    try {
        const userResult = await db.execute({
            sql: "SELECT id, role FROM Usuarios WHERE clerk_user_id = ?",
            args: [clerkUserId]
        });

        const userRecord = userResult.rows[0];
        if (!userRecord) {
            return new Response(
                JSON.stringify({ error: "Usuario no encontrado." }),
                { status: 404 }
            );
        }
        
        const { role, id: agentId } = userRecord;

        // **CRUCIAL:** Solo los agentes pueden cerrar el chat.
        if (role !== 'agente_soporte' && role !== 'org:admin') {
            return new Response(
                JSON.stringify({ error: "Permiso denegado. Solo un agente puede cerrar el ticket." }),
                { status: 403 }
            );
        }
        
        // 3. ACTUALIZACIÓN DEL ESTADO DEL TICKET
        const now = Date.now(); 

        const updateResult = await db.execute({
            sql: `UPDATE Tickets 
                  SET estado = 'Cerrado', 
                      fecha_cierre = ?,
                      cliente_id = ? -- Aseguramos que el agente que lo cierra quede registrado
                  WHERE ticket_id = ? AND estado = 'Abierto'`,
            args: [now, agentId, ticketId]
        });

        // Verificar si se actualizó alguna fila
        if (updateResult.rowsAffected === 0) {
            // Esto sucede si el ticket_id no existe o ya estaba cerrado.
            return new Response(
                JSON.stringify({ error: "El ticket no existe o ya fue cerrado." }),
                { status: 404 }
            );
        }

        // 4. RESPUESTA EXITOSA
        return new Response(
            JSON.stringify({ 
                success: true, 
                message: "Conversación cerrada exitosamente." 
            }),
            { status: 200 }
        );

    } catch (error) {
        console.error(`Error al cerrar ticket ${ticketId}:`, error);
        return new Response(
            JSON.stringify({ error: "Error interno del servidor al intentar cerrar el ticket." }),
            { status: 500 }
        );
    }
};
