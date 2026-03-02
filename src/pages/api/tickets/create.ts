import type { APIRoute } from 'astro';
import { db } from '../../../lib/turso/client';

// Función auxiliar para generar un UUID simple (o puedes usar la función DEFAULT de tu tabla)
const generateUUID = () => crypto.randomUUID().replace(/-/g, '');

export const POST: APIRoute = async ({ request, locals }) => {
    // 1. AUTENTICACIÓN Y OBTENCIÓN DEL USUARIO
    const { userId } = locals.auth();

    if (!userId) {
        return new Response(
            JSON.stringify({ error: "No autorizado. Debes iniciar sesión." }),
            { status: 401 }
        );
    }

    try {
        // En un escenario real, deberías buscar el 'id' interno del usuario
        // en tu tabla 'Usuarios' usando el 'clerk_user_id' (que es el 'userId' de Clerk).

        // --- Paso intermedio: Obtener el ID interno de la tabla Usuarios ---
        const userResult = await db.execute({
            sql: "SELECT id, role FROM Usuarios WHERE clerk_user_id = ?",
            args: [userId]
        });

        const userRecord = userResult.rows[0];
        if (!userRecord) {
            return new Response(
                JSON.stringify({ error: "Usuario no encontrado en la base de datos." }),
                { status: 404 }
            );
        }

        const internalUserId = userRecord.id;

        // Opcional: Verificar si el usuario ya tiene un ticket abierto.
        // Esto previene que un usuario abra múltiples chats a la vez.
        const openTicketCheck = await db.execute({
            sql: "SELECT ticket_id FROM Tickets WHERE user_id = ? AND estado = 'Abierto'",
            args: [internalUserId]
        });

        if (openTicketCheck.rows.length > 0) {
            const existingTicketId = openTicketCheck.rows[0].ticket_id;
            // Si ya tiene un ticket abierto, lo redirigimos a ese chat en curso.
            return new Response(
                JSON.stringify({ message: "Ya tienes un chat activo.", ticket_id: existingTicketId }),
                { status: 409 } // Conflicto
            );
        }

        // 2. CREACIÓN DEL NUEVO TICKET
        const newTicketId = generateUUID();
        const initialSubject = "Nuevo chat iniciado por el usuario"; // Asunto inicial por defecto

        await db.execute({
            sql: `INSERT INTO Tickets 
                  (ticket_id, user_id, asunto, estado, fecha_creacion) 
                  VALUES (?, ?, ?, ?, ?)`,
            args: [
                newTicketId,
                internalUserId,
                initialSubject,
                'Abierto',
                Date.now()
            ]
        });

        // 3. RESPUESTA Y REDIRECCIÓN DEL FRONTEND
        return new Response(
            JSON.stringify({
                success: true,
                message: "Ticket creado exitosamente",
                ticket_id: newTicketId
            }),
            { status: 201 }
        );

    } catch (error) {
        console.error("Error al crear el ticket:", error);
        return new Response(
            JSON.stringify({ error: "Error interno del servidor al crear el ticket." }),
            { status: 500 }
        );
    }
};

// Puedes añadir una función GET si es necesario, pero POST es para la creación.
export const GET: APIRoute = () => {
    return new Response(
        JSON.stringify({ error: "Método no permitido" }),
        { status: 405 }
    );
};
