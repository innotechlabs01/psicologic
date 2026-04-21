import type { APIRoute } from 'astro';
import { createEvent, getEventsByDateRange, getEventByToken, getAgendaSettings, isTimeEnabled } from '../../../lib/turso/agenda/agenda-db';


export const GET: APIRoute = async ({ request, url, locals }) => {
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const token = url.searchParams.get('token');

    // Token-based access (public meeting link)
    if (token) {
        const event = await getEventByToken(token);
        if (event) {
            return new Response(JSON.stringify(event), { status: 200 });
        }
        return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });
    }

    if (!startDate || !endDate) {
        return new Response(JSON.stringify({ error: 'Missing date range' }), { status: 400 });
    }

    // 🔒 AUTH CHECK: Get logged-in user
    const { userId, orgRole } = locals.auth();

    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Fetch events ONLY for the logged in user
    const events = await getEventsByDateRange(startDate, endDate, userId);

    // Auth Check for Admin (Legacy/Optional logic kept if needed, but primary filter is now userId)
    const isAdmin = orgRole === 'org:admin';

    if (isAdmin) {
        // Return FULL data for Admin Dashboard
        return new Response(JSON.stringify(events), { status: 200 });
    }

    // SECURITY: Sanitize response for public view (if non-admin user needs sanitized view of own events? 
    // Usually a user wants to see their own details. Assuming logged in user OK to see details.)
    // But if original logic required sanitization, we keep it or adjust.
    // Given "todo tiene que ser con la información del usuario que esta logeado", user implies OWNING the agenda.
    // We will return full events for the owner.
    return new Response(JSON.stringify(events), { status: 200 });
};

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {

    try {
        // RATE LIMITING
        // Get IP from header (Vercel/Proxies) or clientAddress
        const ip = request.headers.get('x-forwarded-for') || clientAddress || 'unknown';

        // Dynamic import to avoid circular dep issues during init if any
        const { checkRateLimit } = await import('../../../lib/turso/rate-limit');
        const limit = await checkRateLimit(ip);

        if (!limit.success) {
            return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), { status: 429 });
        }

        // 🔒 AUTH CHECK: Get logged-in user to validate THEIR settings
        const { userId } = locals.auth();
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized - Must be logged in to book on own calendar' }), { status: 401 });
        }

        const body = await request.json();

        // Basic validation
        if (!body.date || !body.startTime || !body.endTime || body.participants.length === 0) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
        }

        // 🕒 VALIDACIÓN DE HORARIO HABILITADO (Using Logged In User's Settings)
        // const settings = await getAgendaSettings(userId);
        // if (!settings) {
        //     // Si no hay configuración, por defecto bloqueamos o permitimos? 
        //     // Asumiremos que si no hay configuración no se puede agendar.
        //     return new Response(JSON.stringify({ error: 'La agenda no está configurada.' }), { status: 409 });
        // }

        // const isEnabled = isTimeEnabled(body.date, body.startTime, settings);

        // if (!isEnabled) {
        //     return new Response(JSON.stringify({ error: 'No tienes habilitado este horario.' }), { status: 409 });
        // }

        const newEvent = {
            id: crypto.randomUUID(),
            title: body.title || 'Cita de Asesoría',
            startTime: body.startTime,
            endTime: body.endTime || '00:00', // Calculate based on start + duration if needed
            date: body.date,
            participants: body.participants,
            meetingLink: '', // Will be generated
            secureToken: crypto.randomUUID(), // Anti-fraud secure token
            userId: userId, // Ensure event is owned by logged in user
            status: 'confirmed' as const
        };

        // Generate meeting link (pointing to the same app's video room)
        // Always use the host from the request
        const origin = new URL(request.url).origin;

        newEvent.meetingLink = `${origin}/agenda/meet?token=${newEvent.secureToken}`;

        let created;
        try {
            created = await createEvent(newEvent);
        } catch (err) {
            console.error('createEvent threw error:', err);
            throw err;
        }

        if (created) {
            // Send Email asynchronously
            // Participants is an array of strings (emails)
            import('../../../lib/email/email-service').then(({ sendBookingEmail }) => {
                sendBookingEmail(body.participants, created);
            });

            return new Response(JSON.stringify(created), { status: 201 });
        } else {
            return new Response(JSON.stringify({ error: 'Slot already booked or invalid' }), { status: 409 });
        }

    } catch (error: any) {
        console.error('Error in POST /api/agenda:', error);
        if (error.message === 'SLOT_ALREADY_BOOKED') {
            return new Response(JSON.stringify({ error: 'This time slot is already booked.' }), { status: 409 });
        }
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
};

