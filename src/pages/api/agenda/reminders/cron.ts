import { db as client } from 'src/lib/turso/client';
import { sendBookingEmail } from 'src/lib/email/email-service';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
    try {
        const { userId, orgRole } = locals.auth();

        if (orgRole !== 'org:admin') {
            return new Response(JSON.stringify({ error: 'No autorizado' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const now = new Date();
        const nowISO = now.toISOString();

        // --- 24 horas antes ---
        // Events starting between now+23h55m and now+24h05m (window de 10 min para idempotencia)
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const twentyFourHoursAndFiveMinsFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 5 * 60 * 1000);

        const events24hResult = await client.execute({
            sql: `
                SELECT e.id, e.title, e.date, e.startTime, e.endTime, e.participants, u.email, u.first_name, u.last_name
                FROM agenda e
                JOIN usuarios u ON e.userId = u.clerk_user_id
                WHERE e.status = 'confirmed'
                AND CAST(e.date AS DATE) >= CAST(? AS DATE)
                AND CAST(e.date AS DATE) <= CAST(? AS DATE)
            `,
            args: [nowISO, twentyFourHoursAndFiveMinsFromNow.toISOString().split('T')[0]],
        });

        const events24h = events24hResult.rows || [];

        // Procesar eventos de 24h: extraer emails de participants
        const reminders24h = events24h.map((event: any) => {
            // Parse participants - puede ser string JSON u objeto
            let participantEmails: string[] = [];
            if (event.participants) {
                const participantsArray = Array.isArray(event.participants) ? event.participants : JSON.parse(event.participants);
                participantsArray.forEach((p: any) => {
                    const email = p.email || p.participantEmail;
                    if (email) participantEmails.push(email);
                });
            }

            const eventDateTime = event.date ? new Date(event.date + 'T' + (event.startTime || '09:00')) : null;
            const daysDiff = eventDateTime ? Math.ceil((eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

            return {
                eventId: event.id,
                title: event.title,
                date: event.date,
                startTime: event.startTime,
                participantEmails,
                daysUntil: daysDiff,
                reminderType: '24h',
            };
        });

        // Filtrar solo los que están exactamente en la ventana de 24h (±5 min)
        const twentyFourWindow = reminders24h.filter(r => r.daysUntil >= 0 && r.daysUntil <= 1);

        // --- 1 hora antes ---
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const oneHourAndFiveMinsFromNow = new Date(now.getTime() + 60 * 60 * 1000 + 5 * 60 * 1000);

        const events1hResult = await client.execute({
            sql: `
                SELECT e.id, e.title, e.date, e.startTime, e.endTime, e.participants, u.email, u.first_name, u.last_name
                FROM agenda e
                JOIN usuarios u ON e.userId = u.clerk_user_id
                WHERE e.status = 'confirmed'
                AND CAST(e.date AS DATE) >= CAST(? AS DATE)
                AND CAST(e.date AS DATE) <= CAST(? AS DATE)
            `,
            args: [nowISO, oneHourAndFiveMinsFromNow.toISOString().split('T')[0]],
        });

        const events1h = events1hResult.rows || [];

        const reminders1h = events1h.map((event: any) => {
            let participantEmails: string[] = [];
            if (event.participants) {
                const participantsArray = Array.isArray(event.participants) ? event.participants : JSON.parse(event.participants);
                participantsArray.forEach((p: any) => {
                    const email = p.email || p.participantEmail;
                    if (email) participantEmails.push(email);
                });
            }

            const eventDateTime = event.date ? new Date(event.date + 'T' + (event.startTime || '09:00')) : null;
            const daysDiff = eventDateTime ? Math.ceil((eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

            return {
                eventId: event.id,
                title: event.title,
                date: event.date,
                startTime: event.startTime,
                participantEmails,
                daysUntil: daysDiff,
                reminderType: '1h',
            };
        });

        const oneHourWindow = reminders1h.filter(r => r.daysUntil >= 0 && r.daysUntil <= 1);

        // Enviar correos de recordatorio 24h
        for (const reminder of twentyFourWindow) {
            if (reminder.participantEmails.length === 0) continue;

            const emailPromises = reminder.participantEmails.map((email: string) => {
                const bookingDetails = {
                    title: reminder.title,
                    date: reminder.date,
                    startTime: reminder.startTime,
                    meetingLink: `${Astro.url.origin}/client/agenda/${reminder.eventId}`,
                };
                return sendBookingEmail(email, bookingDetails);
            });

            await Promise.all(emailPromises);
        }

        // Enviar correos de recordatorio 1h
        for (const reminder of oneHourWindow) {
            if (reminder.participantEmails.length === 0) continue;

            const emailPromises = reminder.participantEmails.map((email: string) => {
                const bookingDetails = {
                    title: reminder.title,
                    date: reminder.date,
                    startTime: reminder.startTime,
                    meetingLink: `${Astro.url.origin}/client/agenda/${reminder.eventId}`,
                };
                return sendBookingEmail(email, bookingDetails);
            });

            await Promise.all(emailPromises);
        }

        return new Response(JSON.stringify({
            processed24h: twentyFourWindow.length,
            sent24h: twentyFourWindow.length,
            processed1h: oneHourWindow.length,
            sent1h: oneHourWindow.length,
            message: `Recordatorios procesados: ${twentyFourWindow.length} de 24h + ${oneHourWindow.length} de 1h`,
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('Reminder cron error:', error);
        return new Response(JSON.stringify({ error: 'Error interno' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};