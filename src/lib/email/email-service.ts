import nodemailer from 'nodemailer';
import { generateICSContent, generateGoogleCalendarLink } from './calendar-utils';

// Configurar transporter de Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: import.meta.env.EMAIL_USER,
        pass: import.meta.env.EMAIL_PASS,
    },
});

export async function sendBookingEmail(to: string | string[], bookingDetails: any) {
    if (!import.meta.env.EMAIL_USER || !import.meta.env.EMAIL_PASS) {
        console.warn("Credenciales de Gmail no encontradas. Email no enviado.");
        return false;
    }

    try {
        const { date, startTime, endTime, meetingLink, secureToken, title } = bookingDetails;
        const eventTitle = title || 'Cita de Asesoría - Psicologic';
        const description = `Unirse a la videollamada: ${meetingLink}`;
        const location = 'Videollamada (Psicologic)';

        // URL de confirmación con el token seguro
        const siteUrl = import.meta.env.SITE_URL || 'http://localhost:4321';
        const confirmUrl = `${siteUrl}/agenda/confirm?token=${secureToken}`;

        const icsContent = generateICSContent({
            date, startTime, endTime,
            title: eventTitle,
            description, location,
            url: meetingLink
        });

        const googleCalendarLink = generateGoogleCalendarLink({
            date, startTime, endTime,
            title: eventTitle,
            description, location
        });

        await transporter.sendMail({
            from: `"Psicologic" <${import.meta.env.EMAIL_USER}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject: `Confirmación de Cita: ${eventTitle}`,
            attachments: [
                {
                    filename: 'invite.ics',
                    content: Buffer.from(icsContent),
                    contentType: 'text/calendar',
                },
            ],
            html: `
                <div style="font-family: Arial, sans-serif; background: #f4f4f5; padding: 32px 16px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7;">

    <!-- Header -->
    <div style="background: #6B21A8; padding: 32px 32px 24px; text-align: center;">
      <p style="margin: 0 0 6px; font-size: 12px; color: #DDD6FE; letter-spacing: 0.08em; text-transform: uppercase;">Psicologic</p>
      <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #ffffff;">Cita confirmada</h1>
    </div>

    <!-- Check icon -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: -20px; margin-bottom: 8px;">
    <tr>
        <td align="center">
        <span style="display: inline-block; width: 40px; height: 40px; border-radius: 50%; background: #22c55e; border: 3px solid #ffffff; text-align: center; line-height: 40px; font-size: 20px; color: white;">✓</span>
        </td>
    </tr>
    </table>

    <!-- Body -->
    <div style="padding: 16px 32px 24px;">
      <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">Hola, tu cita <strong>${eventTitle}</strong> ha sido reservada con éxito.</p>

      <!-- Details card -->
      <div style="background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 16px;">Detalles de la cita</p>

        <table style="width: 100%; border-collapse: collapse;">
         <tr>
                <td style="padding: 8px 12px 8px 0; vertical-align: middle; width: 38px; text-align: center;">
                    <span style="display: inline-block; width: 30px; height: 30px; background: #EDE9FE; border-radius: 6px; text-align: center; line-height: 30px; font-size: 16px;">📅</span>
                </td>
                <td style="padding: 8px 0; vertical-align: middle;">
                    <p style="margin: 0; font-size: 11px; color: #9ca3af;">Fecha</p>
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">${date}</p>
                </td>
                </tr>

                <tr>
                <td style="padding: 8px 12px 8px 0; vertical-align: middle; width: 38px; text-align: center;">
                    <span style="display: inline-block; width: 30px; height: 30px; background: #EDE9FE; border-radius: 6px; text-align: center; line-height: 30px; font-size: 16px;">⏰</span>
                </td>
                <td style="padding: 8px 0; vertical-align: middle;">
                    <p style="margin: 0; font-size: 11px; color: #9ca3af;">Hora</p>
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">${startTime} – ${endTime}</p>
                </td>
                </tr>

                <tr>
                <td style="padding: 8px 12px 8px 0; vertical-align: middle; width: 38px; text-align: center;">
                    <span style="display: inline-block; width: 30px; height: 30px; background: #EDE9FE; border-radius: 6px; text-align: center; line-height: 30px; font-size: 16px;">🔑</span>
                </td>
                <td style="padding: 8px 0; vertical-align: middle;">
                    <p style="margin: 0; font-size: 11px; color: #9ca3af;">Token de seguridad</p>
                    <p style="margin: 0; font-size: 13px; font-weight: 600; color: #111827; font-family: monospace; letter-spacing: 0.05em;">${secureToken}</p>
                </td>
            </tr>
        </table>
      </div>

      <!-- Primary CTA -->
      <div style="text-align: center; margin-bottom: 12px;">
        <a href="${confirmUrl}" style="display: inline-block; background: #22c55e; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;">
          ✅ Confirmar asistencia
        </a>
      </div>

      <!-- Secondary CTAs -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${meetingLink}" style="display: inline-block; background: #6B21A8; color: #ffffff; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; margin: 4px;">
          🎥 Unirse a la videollamada
        </a>
        <a href="${googleCalendarLink}" style="display: inline-block; background: #ffffff; color: #374151; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-size: 14px; border: 1px solid #d1d5db; margin: 4px;">
          📅 Google Calendar
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 16px;">
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
        Si los botones no funcionan, copia este enlace:<br/>
        <a href="${meetingLink}" style="color: #6B21A8;">${meetingLink}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 32px; text-align: center;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">© 2025 Psicologic · Mensaje generado automáticamente</p>
    </div>

  </div>
</div>
            `,
        });

        console.log("Email enviado correctamente a:", to);
        return true;
    } catch (error) {
        console.error("Error enviando email:", error);
        return false;
    }
}