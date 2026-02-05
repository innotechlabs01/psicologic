import { Resend } from 'resend';

// Initialize Resend with the key from environment variables
const resend = new Resend(import.meta.env.VITE_RESEND_KEY);

import { generateICSContent, generateGoogleCalendarLink } from './calendar-utils';

export async function sendBookingEmail(to: string | string[], bookingDetails: any) {
    if (!import.meta.env.VITE_RESEND_KEY) {
        console.warn("Resend API key not found (VITE_RESEND_KEY). Email sending skipped.");
        return false;
    }

    try {
        // Extract details (fallback title if missing)
        const { date, startTime, endTime, meetingLink, secureToken, title } = bookingDetails;
        const eventTitle = title || 'Cita de Asesoría - Psicologic';
        const description = `Unirse a la videollamada: ${meetingLink}`;
        const location = 'Videollamada (Psicologic)';

        // Generate Calendar Artifacts
        const icsContent = generateICSContent({
            date,
            startTime,
            endTime,
            title: eventTitle,
            description,
            location,
            url: meetingLink
        });

        const googleCalendarLink = generateGoogleCalendarLink({
            date,
            startTime,
            endTime,
            title: eventTitle,
            description,
            location
        });

        // Convert string content to Buffer for attachment (Resend expects content as string or buffer, usually Buffer for files)
        const icsBuffer = Buffer.from(icsContent);

        const { data, error } = await resend.emails.send({
            from: 'Psicologic <noreply@mail.innotechlabs.com>',
            to: to,
            subject: `Confirmación de Cita: ${eventTitle}`,
            attachments: [
                {
                    filename: 'invite.ics',
                    content: icsBuffer,
                },
            ],
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #8A2BE2;">¡Cita Confirmada!</h2>
                    <p>Hola,</p>
                    <p>Tu cita <strong>${eventTitle}</strong> ha sido reservada con éxito.</p>
                    
                    <div style="background-color: #F8F9FA; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #8A2BE2;">
                        <p style="margin: 8px 0; font-size: 16px;"><strong>📅 Fecha:</strong> ${date}</p>
                        <p style="margin: 8px 0; font-size: 16px;"><strong>⏰ Hora:</strong> ${startTime} - ${endTime || ''}</p>
                        <p style="margin: 8px 0; font-size: 14px; color: #666;"><strong>🔒 Token:</strong> ${secureToken}</p>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${meetingLink}" style="display: inline-block; background-color: #8A2BE2; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(138, 43, 226, 0.25);">Unirse a la Videollamada</a>
                    </div>
                    
                    <div style="text-align: center; margin-bottom: 30px;">
                        <a href="${googleCalendarLink}" style="display: inline-block; color: #444; text-decoration: none; border: 1px solid #ddd; padding: 10px 20px; border-radius: 6px; font-size: 14px; background-color: white;">
                            📅 Agregar a Google Calendar
                        </a>
                    </div>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    
                    <p style="font-size: 12px; color: #888; text-align: center;">
                        Si el botón no funciona, copia y pega este enlace: <br/>
                        <a href="${meetingLink}" style="color: #8A2BE2;">${meetingLink}</a>
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error("Error sending email via Resend:", error);
            return false;
        }

        console.log("Message sent via Resend:", data?.id);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}
