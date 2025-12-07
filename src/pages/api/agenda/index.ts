import type { APIRoute } from 'astro';
import { createEvent, getEventsByDateRange, getEventByToken } from '../../../lib/turso/agenda/agenda-db';

export const GET: APIRoute = async ({ request, url, locals }) => {
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const token = url.searchParams.get('token');

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

    const events = await getEventsByDateRange(startDate, endDate);

    // Auth Check for Admin
    const { orgRole } = locals.auth();
    const isAdmin = orgRole === 'org:admin';

    if (isAdmin) {
        // Return FULL data for Admin Dashboard
        return new Response(JSON.stringify(events), { status: 200 });
    }

    // SECURITY: Sanitize response for public view. 
    // Do NOT return meetingLink, secureToken, or participant details.
    const publicEvents = events.map(e => ({
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
        status: 'busy' // Hide actual status if internal, just show busy
    }));

    return new Response(JSON.stringify(publicEvents), { status: 200 });
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
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

        const body = await request.json();

        // Basic validation
        if (!body.date || !body.startTime || !body.email) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
        }

        const newEvent = {
            id: crypto.randomUUID(),
            title: body.title || 'Cita de Asesoría',
            startTime: body.startTime,
            endTime: body.endTime || '00:00', // Calculate based on start + duration if needed
            date: body.date,
            participants: {
                name: body.name,
                email: body.email
            },
            meetingLink: '', // Will be generated
            secureToken: crypto.randomUUID(), // Anti-fraud secure token
            userId: body.userId || 'guest', // or derived from auth
            status: 'confirmed' as const
        };

        // Generate meeting link (pointing to the same app's video room)
        const origin = new URL(request.url).origin;
        newEvent.meetingLink = `${origin}/agenda/meet?token=${newEvent.secureToken}`;

        const created = await createEvent(newEvent);

        if (created) {
            // Send Email asynchronously
            import('../../../lib/email/email-service').then(({ sendBookingEmail }) => {
                sendBookingEmail(body.email, created);
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
