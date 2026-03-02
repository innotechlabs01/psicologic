import nodemailer from 'nodemailer';
import { generateICSContent, generateGoogleCalendarLink } from './calendar-utils';

interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
    }>;
}

const getTransporter = () => {
    const config: EmailConfig = {
        host: import.meta.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(import.meta.env.SMTP_PORT || '587'),
        secure: import.meta.env.SMTP_SECURE === 'true',
        auth: {
            user: import.meta.env.SMTP_USER || '',
            pass: import.meta.env.SMTP_PASS || '',
        },
    };

    if (!config.auth.user || !config.auth.pass) {
        console.warn('⚠️ SMTP credentials not configured. Email sending will be skipped.');
        return null;
    }

    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
    });
};

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
    const transporter = getTransporter();
    
    if (!transporter) {
        console.warn('⚠️ Email transporter not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables.');
        return false;
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    try {
        const info = await transporter.sendMail({
            from: import.meta.env.SMTP_FROM || '"Psicologic" <noreply@psicologic.com>',
            to: recipients.join(', '),
            subject: options.subject,
            html: options.html,
            attachments: options.attachments,
            encoding: 'utf-8',
        });

        console.log('✅ Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
}

export async function sendBookingEmail(to: string | string[], bookingDetails: any): Promise<boolean> {
    const { date, startTime, endTime, meetingLink, secureToken, title } = bookingDetails;
    const eventTitle = title || 'Cita de Asesoría - Psicologic';
    const description = `Unirse a la videollamada: ${meetingLink}`;
    const location = 'Videollamada (Psicologic)';

    const icsContent = generateICSContent({
        date,
        startTime,
        endTime,
        title: eventTitle,
        description,
        location,
        url: meetingLink,
    });

    const googleCalendarLink = generateGoogleCalendarLink({
        date,
        startTime,
        endTime,
        title: eventTitle,
        description,
        location,
    });

    const icsBuffer = Buffer.from(icsContent);

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #6CAF9D 0%, #8A2BE2 100%); padding: 30px 40px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">¡Cita Confirmada!</h1>
                                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Psicologic - Tu plataforma de salud mental</p>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px;">
                                    <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">Hola,</p>
                                    <p style="color: #333333; font-size: 16px; margin: 0 0 30px 0;">Tu cita <strong style="color: #6CAF9D;">${eventTitle}</strong> ha sido reservada exitosamente.</p>
                                    
                                    <!-- Details Card -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F9FA; border-radius: 12px; overflow: hidden; margin: 30px 0;">
                                        <tr>
                                            <td style="padding: 20px;">
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #666666; font-size: 14px;">
                                                            <strong>📅 Fecha:</strong>
                                                        </td>
                                                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right;">
                                                            ${date}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #666666; font-size: 14px; border-top: 1px solid #eeeeee;">
                                                            <strong>⏰ Hora:</strong>
                                                        </td>
                                                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right; border-top: 1px solid #eeeeee;">
                                                            ${startTime} - ${endTime || 'Por definir'}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #666666; font-size: 14px; border-top: 1px solid #eeeeee;">
                                                            <strong>🔒 Referencia:</strong>
                                                        </td>
                                                        <td style="padding: 8px 0; color: #999999; font-size: 12px; text-align: right; border-top: 1px solid #eeeeee; font-family: monospace;">
                                                            ${secureToken?.substring(0, 8)}...
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- CTA Button -->
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="padding: 30px 0;">
                                                <a href="${meetingLink}" style="display: inline-block; background-color: #6CAF9D; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(108, 175, 157, 0.3);">
                                                    Unirse a la Videollamada
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- Google Calendar -->
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center">
                                                <a href="${googleCalendarLink}" style="display: inline-block; color: #666666; text-decoration: none; border: 1px solid #dddddd; padding: 12px 24px; border-radius: 8px; font-size: 14px; background-color: #ffffff;">
                                                    📅 Agregar a Google Calendar
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f9f9f9; padding: 30px 40px; text-align: center; border-top: 1px solid #eeeeee;">
                                    <p style="color: #999999; font-size: 12px; margin: 0;">
                                        Si el botón no funciona, copia y pega este enlace en tu navegador:
                                    </p>
                                    <p style="color: #6CAF9D; font-size: 12px; margin: 8px 0 0 0; word-break: break-all;">
                                        ${meetingLink}
                                    </p>
                                    <p style="color: #cccccc; font-size: 11px; margin: 20px 0 0 0;">
                                        © ${new Date().getFullYear()} Psicologic. Todos los derechos reservados.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    return sendEmail({
        to,
        subject: `Confirmación de Cita: ${eventTitle}`,
        html,
        attachments: [
            {
                filename: 'invite.ics',
                content: icsBuffer,
            },
        ],
    });
}

export async function sendReminderEmail(to: string | string[], bookingDetails: any): Promise<boolean> {
    const { date, startTime, endTime, meetingLink, title } = bookingDetails;
    const eventTitle = title || 'Cita de Asesoría - Psicologic';

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #F59E0B 0%, #F97316 100%); padding: 30px 40px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">⏰ Recordatorio de Cita</h1>
                                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Psicologic - Tu cita es mañana</p>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px;">
                                    <p style="color: #333333; font-size: 16px; margin: 0 0 20px 0;">Hola,</p>
                                    <p style="color: #333333; font-size: 16px; margin: 0 0 30px 0;">
                                        Este es un recordatorio de tu cita <strong style="color: #6CAF9D;">${eventTitle}</strong> programada para <strong>mañana</strong>.
                                    </p>
                                    
                                    <!-- Details Card -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FEF3C7; border-radius: 12px; overflow: hidden; margin: 30px 0;">
                                        <tr>
                                            <td style="padding: 20px;">
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #92400E; font-size: 14px;">
                                                            <strong>📅 Fecha:</strong>
                                                        </td>
                                                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right;">
                                                            ${date}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 8px 0; color: #92400E; font-size: 14px; border-top: 1px solid #FDE68A;">
                                                            <strong>⏰ Hora:</strong>
                                                        </td>
                                                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right; border-top: 1px solid #FDE68A;">
                                                            ${startTime} - ${endTime || 'Por definir'}
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- CTA Button -->
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="padding: 30px 0;">
                                                <a href="${meetingLink}" style="display: inline-block; background-color: #6CAF9D; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
                                                    Unirse a la Videollamada
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f9f9f9; padding: 30px 40px; text-align: center; border-top: 1px solid #eeeeee;">
                                    <p style="color: #999999; font-size: 11px; margin: 0;">
                                        © ${new Date().getFullYear()} Psicologic. Todos los derechos reservados.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    return sendEmail({
        to,
        subject: `⏰ Recordatorio: Tu cita ${eventTitle} es mañana`,
        html,
    });
}
