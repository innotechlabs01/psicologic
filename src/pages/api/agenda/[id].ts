import type { APIRoute } from 'astro';
import { deleteEvent, updateEvent, getAgendaSettings } from '../../../lib/turso/agenda/agenda-db';

export const DELETE: APIRoute = async ({ params, locals }) => {
    const { id } = params;

    // 🔒 AUTH CHECK
    const { userId } = locals.auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (!id) {
        return new Response(JSON.stringify({ error: 'Missing event ID' }), { status: 400 });
    }

    try {
        const success = await deleteEvent(id, userId);
        if (success) {
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ error: 'Event not found or could not be deleted' }), { status: 404 });
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};

export const PUT: APIRoute = async ({ request, params, locals }) => {
    const { id } = params;

    // 🔒 AUTH CHECK
    const { userId } = locals.auth();
    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (!id) {
        return new Response(JSON.stringify({ error: 'Missing event ID' }), { status: 400 });
    }

    try {
        const body = await request.json();

        // Basic validation
        if (!body.title || !body.date || !body.startTime || !body.endTime) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
        }

        const updateData = {
            id,
            userId,
            title: body.title,
            date: body.date,
            startTime: body.startTime,
            endTime: body.endTime,
            participants: body.participants || []
        };

        const success = await updateEvent(updateData);

        if (success) {
            return new Response(JSON.stringify({ success: true, ...updateData }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ error: 'Event not found or could not be updated' }), { status: 404 });
        }

    } catch (error) {
        console.error('Error updating event:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};
