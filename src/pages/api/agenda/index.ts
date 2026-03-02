import type { APIRoute } from 'astro';
import { createEvent, getEventsByDateRange, getEventByToken, getAgendaSettings, isTimeEnabled } from '../../../lib/turso/agenda/agenda-db';

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

    const { userId, orgRole } = locals.auth();

    if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const events = await getEventsByDateRange(startDate, endDate, userId);
    const isAdmin = orgRole === 'org:admin';

    if (isAdmin) {
        return new Response(JSON.stringify(events), { status: 200 });
    }

    return new Response(JSON.stringify(events), { status: 200 });
};

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {

    try {
        const ip = request.headers.get('x-forwarded-for') || clientAddress || 'unknown';

        const { checkRateLimit } = await import('../../../lib/turso/rate-limit');
        const limit = await checkRateLimit(ip);

        if (!limit.success) {
            return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), { status: 429 });
        }

        const { userId } = locals.auth();
        if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized - Must be logged in to book on own calendar' }), { status: 401 });
        }

        const body = await request.json();

        if (!body.date || !body.startTime || !body.endTime || body.participants.length === 0) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
        }

        const newEvent = {
            id: crypto.randomUUID(),
            title: body.title || 'Cita de Asesoría',
            startTime: body.startTime,
            endTime: body.endTime || '00:00',
            date: body.date,
            participants: body.participants,
            meetingLink: '',
            secureToken: crypto.randomUUID(),
            userId: userId,
            status: 'confirmed' as const
        };

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
            // Send email asynchronously with proper error handling
            const { sendBookingEmail } = await import('../../../lib/email/email-service');
            sendBookingEmail(body.participants, created)
                .then((success: boolean) => {
                    if (success) {
                        console.log('✅ Confirmation email sent to:', body.participants);
                    } else {
                        console.warn('⚠️ Failed to send confirmation email to:', body.participants);
                    }
                })
                .catch((err: Error) => {
                    console.error('❌ Error sending email:', err);
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

