import nodemailer from 'nodemailer';

// Configure transporter
// In production, use environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com', // Default to Gmail for example
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendBookingEmail(to: string, bookingDetails: any) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP credentials not found. Email sending skipped. Check .env variables.");
        return false;
    }

    try {
        const { date, startTime, meetingLink, secureToken, name } = bookingDetails;

        const info = await transporter.sendMail({
            from: `"Agenda Psicologic" <${process.env.SMTP_USER}>`, // sender address
            to, // list of receivers
            subject: "Confirmación de Cita - Psicologic", // Subject line
            text: `Hola ${name},\n\nTu cita ha sido confirmada para el ${date} a las ${startTime}.\n\nPara unirte a la videollamada, usa este enlace seguro:\n${meetingLink}\n\nToken de Seguridad: ${secureToken}\n\nGracias.`, // plain text body
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #4f46e5;">¡Cita Confirmada!</h2>
                    <p>Hola <strong>${name}</strong>,</p>
                    <p>Tu cita de asesoría ha sido reservada con éxito.</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> ${date}</p>
                        <p style="margin: 5px 0;"><strong>⏰ Hora:</strong> ${startTime}</p>
                        <p style="margin: 5px 0;"><strong>🔒 Token:</strong> <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 4px;">${secureToken}</code></p>
                    </div>
                    <p>Haz clic en el siguiente botón para unirte a la sala a la hora acordada:</p>
                    <a href="${meetingLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Unirse a la Videollamada</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">Si el botón no funciona, copia y pega este enlace: <br/>${meetingLink}</p>
                </div>
            `,
        });

        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}
