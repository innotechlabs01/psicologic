import type { APIRoute } from 'astro';
import { getTomorrowEvents } from '../../../lib/turso/agenda/agenda-db';
import { sendReminderEmail } from '../../../lib/email/email-service';

export const GET: APIRoute = async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    
    // Verify cron secret to prevent unauthorized access
    if (authHeader !== `Bearer ${import.meta.env.CRON_SECRET}`) {
        if (import.meta.env.DEV) {
            console.log('⚠️ Running reminder cron in DEV mode (no auth required)');
        } else {
            return new Response('Unauthorized', { status: 401 });
        }
    }

    try {
        console.log('🔔 Starting daily reminder cron job...');
        
        const tomorrowEvents = await getTomorrowEvents();
        
        if (tomorrowEvents.length === 0) {
            console.log('📭 No appointments found for tomorrow');
            return new Response(JSON.stringify({ 
                success: true, 
                message: 'No appointments found for tomorrow',
                sent: 0 
            }), { status: 200 });
        }

        let sentCount = 0;
        let failedCount = 0;

        for (const event of tomorrowEvents) {
            const participants = Array.isArray(event.participants) 
                ? event.participants 
                : [event.participants];

            for (const participant of participants) {
                if (participant && participant.includes('@')) {
                    try {
                        const success = await sendReminderEmail(participant, {
                            date: event.date,
                            startTime: event.startTime,
                            endTime: event.endTime,
                            meetingLink: event.meetingLink,
                            title: event.title
                        });

                        if (success) {
                            sentCount++;
                            console.log(`✅ Reminder sent to ${participant} for ${event.date}`);
                        } else {
                            failedCount++;
                            console.warn(`⚠️ Failed to send reminder to ${participant}`);
                        }
                    } catch (err) {
                        failedCount++;
                        console.error(`❌ Error sending to ${participant}:`, err);
                    }
                }
            }
        }

        console.log(`📧 Reminder cron completed: ${sentCount} sent, ${failedCount} failed`);

        return new Response(JSON.stringify({
            success: true,
            message: `Reminders processed`,
            totalAppointments: tomorrowEvents.length,
            sent: sentCount,
            failed: failedCount
        }), { status: 200 });

    } catch (error) {
        console.error('❌ Error in reminder cron:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error'
        }), { status: 500 });
    }
};
