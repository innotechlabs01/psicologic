import type { APIRoute } from 'astro';
import { db } from '../../../../lib/turso/client';

export const GET: APIRoute = async ({ request, params, locals }) => {
    // 1. Obtener ID del Ticket y Autenticar Usuario
    const ticketId = params.ticketId;
    const { userId: clerkUserId } = locals.auth();

    if (!clerkUserId || !ticketId) {
        return new Response(
            JSON.stringify({ error: "No autorizado o falta ID del ticket." }),
            { status: 401 }
        );
    }

    let userRecord, currentUserId;
    let userResult, currentUserRole;

    try {

        // 2. Obtener ID interno y Rol del usuario
        userResult = await db.execute({
            sql: "SELECT id, role FROM Usuarios WHERE clerk_user_id = ?",
            args: [clerkUserId]
        });

        if (userResult.rows.length === 0) {
            return new Response(
                JSON.stringify({ error: "Usuario no registrado en la BD." }),
                { status: 403 }
            );
        }
        userRecord = userResult.rows[0];
        currentUserId = userRecord.id;
        currentUserRole = String(userRecord.role ?? 'usuario_final');

        const isAgent = currentUserRole === 'agente_soporte' || currentUserRole === 'org:admin';

        // 3. Verificar Autorización (Cliente O Agente)

        const ticketDetail = await db.execute({
            sql: "SELECT user_id, estado FROM Tickets WHERE ticket_id = ?",
            args: [ticketId]
        });

        if (ticketDetail.rows.length === 0) {
            return new Response(
                JSON.stringify({ error: "Ticket no encontrado." }),
                { status: 404 }
            );
        }

        const ticketRecord = ticketDetail.rows[0];
        const isClientOwner = ticketRecord.user_id === currentUserId;

        // Autorización: Es el cliente propietario O es un agente.
        const isAuthorized = isClientOwner || isAgent;

        if (!isAuthorized) {
            return new Response(
                JSON.stringify({ error: "No tienes permiso para ver este ticket." }),
                { status: 403 }
            );
        }

        // 4. Obtener Mensajes
        const messagesResult = await db.execute({
            sql: `
                SELECT 
                    message_id, 
                    sender_id, 
                    contenido, 
                    tipo, 
                    url_adjunto, 
                    fecha_envio
                FROM Messages 
                WHERE ticket_id = ? 
                ORDER BY fecha_envio ASC
            `,
            args: [ticketId]
        });

        const isClosed = ticketRecord.estado !== 'Abierto';

        // 5. Enviar Respuesta (compatible con ChatInterface.jsx)
        return new Response(
            JSON.stringify({
                messages: messagesResult.rows,
                isClosed: isClosed // Clave para detener el Polling en el frontend
            }),
            { status: 200 }
        );

    } catch (error) {
        console.error("Error al obtener mensajes:", error);
        return new Response(
            JSON.stringify({ error: "Error interno del servidor al obtener mensajes." }),
            { status: 500 }
        );
    }
};

export const POST: APIRoute = () => {
    return new Response(null, { status: 405 });
};
