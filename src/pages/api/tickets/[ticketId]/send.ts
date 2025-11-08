import type { APIRoute } from 'astro';
import { createClient } from '@libsql/client';

const db = createClient({
    url: import.meta.env.TURSO_DATABASE_URL,
    authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

// Función auxiliar para generar un UUID simple
const generateUUID = () => crypto.randomUUID().replace(/-/g, ''); 

export const POST: APIRoute = async ({ params, request, locals }) => {
    // 1. OBTENCIÓN DE DATOS Y AUTENTICACIÓN
    const { ticketId } = params; // Obtenido de la URL: /api/tickets/TICKET_ID/send
    const { userId: clerkUserId } = locals.auth();

    if (!clerkUserId || !ticketId) {
        return new Response(
            JSON.stringify({ error: "Datos faltantes o no autorizado." }),
            { status: 401 }
        );
    }
    
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return new Response(
            JSON.stringify({ error: "Formato de cuerpo de solicitud inválido." }),
            { status: 400 }
        );
    }

    const { content, type, urlAdjunto } = body; // Recibidos del componente React
    
    // Validar el tipo de mensaje
    if (!['texto', 'imagen', 'archivo'].includes(type)) {
        return new Response(
            JSON.stringify({ error: "Tipo de mensaje inválido." }),
            { status: 400 }
        );
    }
    // 2. OBTENER ID INTERNO DEL REMITENTE Y ESTADO DEL TICKET
    try {
        
        // Buscar el ID interno del usuario en tu tabla Usuarios
        const userResult = await db.execute({
            sql: "SELECT id FROM Usuarios WHERE clerk_user_id = ?",
            args: [clerkUserId]
        });

        const senderId = userResult.rows[0]?.id;
        if (!senderId) {
            return new Response(
                JSON.stringify({ error: "Remitente no encontrado en la base de datos." }),
                { status: 404 }
            );
        }
        
        
        // Verificar el estado del ticket: NO SE PUEDE ENVIAR MENSAJES A TICKETS CERRADOS
        const ticketResult = await db.execute({
            sql: "SELECT estado FROM Tickets WHERE ticket_id = ?",
            args: [ticketId]
        });

        const ticketEstado = ticketResult.rows[0]?.estado;
        if (!ticketEstado) {
            return new Response(
                JSON.stringify({ error: "Ticket no encontrado." }),
                { status: 404 }
            );
        }
        if (ticketEstado === 'Cerrado') {
            return new Response(
                JSON.stringify({ error: "No se pueden enviar mensajes a una conversación cerrada." }),
                { status: 403 }
            );
        }
        
        // 3. INSERCIÓN DEL NUEVO MENSAJE
        const newMsgId = generateUUID();
        const now = Date.now(); // Usar timestamp en milisegundos

        await db.execute({
            sql: `INSERT INTO Messages 
                  (message_id, ticket_id, sender_id, contenido, tipo, url_adjunto, fecha_envio) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
                newMsgId, 
                ticketId, 
                senderId, 
                content || null, // Contenido puede ser NULL si solo es una imagen/archivo
                type, 
                urlAdjunto || null, // URL es NULL si es solo texto
                now
            ]
        });

        // 4. RESPUESTA EXITOSA
        return new Response(
            JSON.stringify({ 
                success: true, 
                message: "Mensaje enviado", 
                message_id: newMsgId 
            }),
            { status: 201 }
        );

    } catch (error) {
        console.error(`Error al enviar mensaje para ticket ${ticketId}:`, error);
        return new Response(
            JSON.stringify({ error: "Error interno del servidor al procesar el mensaje." }),
            { status: 500 }
        );
    }
};
