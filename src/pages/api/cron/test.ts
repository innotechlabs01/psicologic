import type { APIRoute } from 'astro';
import { getTomorrowEvents, getEventsByDateRange } from '../../../lib/turso/agenda/agenda-db';
import { sendReminderEmail, sendBookingEmail } from '../../../lib/email/email-service';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { action, date, email, eventId } = body;

        if (!action) {
            return new Response(JSON.stringify({ error: 'Action is required' }), { status: 400 });
        }

        switch (action) {
            case 'send-reminder': {
                if (!email) {
                    return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
                }

                let eventData = null;
                
                if (eventId) {
                    const events = await getEventsByDateRange(date || new Date().toISOString().split('T')[0], date || new Date().toISOString().split('T')[0], 'any');
                    eventData = events.find(e => e.id === eventId);
                }

                if (!eventData && date) {
                    const events = await getEventsByDateRange(date, date, 'any');
                    eventData = events.find(e => e.participants.includes(email));
                }

                const success = await sendReminderEmail(email, eventData || {
                    date: date || new Date().toISOString().split('T')[0],
                    startTime: '09:00',
                    endTime: '10:00',
                    meetingLink: `${new URL(request.url).origin}/agenda/meet?token=test`,
                    title: 'Cita de Prueba'
                });

                return new Response(JSON.stringify({
                    success,
                    message: success ? `Reminder sent to ${email}` : 'Failed to send reminder'
                }), { status: success ? 200 : 500 });
            }

            case 'send-test-email': {
                if (!email) {
                    return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
                }

                const success = await sendBookingEmail(email, {
                    date: new Date().toISOString().split('T')[0],
                    startTime: '14:00',
                    endTime: '15:00',
                    meetingLink: `${new URL(request.url).origin}/agenda/meet?token=test`,
                    secureToken: 'test-token-123',
                    title: 'Cita de Prueba - Test Email'
                });

                return new Response(JSON.stringify({
                    success,
                    message: success ? `Test email sent to ${email}` : 'Failed to send email'
                }), { status: success ? 200 : 500 });
            }

            case 'list-tomorrow': {
                const events = await getTomorrowEvents();
                return new Response(JSON.stringify({
                    success: true,
                    count: events.length,
                    events: events.map(e => ({
                        id: e.id,
                        title: e.title,
                        date: e.date,
                        startTime: e.startTime,
                        endTime: e.endTime,
                        participants: e.participants
                    }))
                }), { status: 200 });
            }

            default:
                return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
        }

    } catch (error) {
        console.error('Error in test email endpoint:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
};
