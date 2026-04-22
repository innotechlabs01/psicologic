commit 5ece1cf284a01f4f6334a61c3d03bd926e2555c8
Author: Anthony Rivera <anthonyrivera51@gmail.com>
Date:   Tue Apr 21 20:26:32 2026 -0500

    feat: implement MailerSend email service, remove Gmail and SendGrid references, remove .env.development from tracking

diff --git a/src/lib/email/mailersend-service.ts b/src/lib/email/mailersend-service.ts
new file mode 100644
index 0000000..616656a
--- /dev/null
+++ b/src/lib/email/mailersend-service.ts
@@ -0,0 +1,95 @@
+import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
+import { generateICSContent, generateGoogleCalendarLink } from './calendar-utils';
+
+// Configurar MailerSend
+const mailerSend = new MailerSend({
+    apiKey: import.meta.env.MAILERSEND_API_KEY,
+});
+
+export async function sendBookingEmail(to: string | string[], bookingDetails: any) {
+    if (!import.meta.env.MAILERSEND_API_KEY) {
+        console.warn("API Key de MailerSend no encontrada. Email no enviado.");
+        return false;
+    }
+
+    try {
+        const { date, startTime, endTime, meetingLink, secureToken, title } = bookingDetails;
+        const eventTitle = title || 'Cita de Asesoría - Psicologic';
+        const description = `Unirse a la videollamada: ${meetingLink}`;
+        const location = 'Videollamada (Psicologic)';
+
+        const icsContent = generateICSContent({
+            date, startTime, endTime,
+            title: eventTitle,
+            description, location,
+            url: meetingLink
+        });
+
+        const googleCalendarLink = generateGoogleCalendarLink({
+            date, startTime, endTime,
+            title: eventTitle,
+            description, location
+        });
+
+        // Definir el remitente
+        const sentFrom = new Sender(
+            import.meta.env.EMAIL_FROM,
+            "Psicologic"
+        );
+
+        // Definir los destinatarios
+        const recipients = Array.isArray(to) 
+            ? to.map(email => new Recipient(email, "")) 
+            : [new Recipient(to, "")];
+
+        // Definir los parámetros del email
+        const emailParams = new EmailParams()
+            .setFrom(sentFrom)
+            .setTo(recipients)
+            .setSubject(`Confirmación de Cita: ${eventTitle}`)
+            .setHtml(`
+                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
+                    <h2 style="color: #8A2BE2;">¡Cita Confirmada!</h2>
+                    <p>Hola,</p>
+                    <p>Tu cita <strong>${eventTitle}</strong> ha sido reservada con éxito.</p>
+                    
+                    <div style="background-color: #F8F9FA; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #8A2BE2;">
+                        <p style="margin: 8px 0; font-size: 16px;"><strong>📅 Fecha:</strong> ${date}</p>
+                        <p style="margin: 8px 0; font-size: 16px;"><strong>⏰ Hora:</strong> ${startTime} - ${endTime || ''}</p>
+                        <p style="margin: 8px 0; font-size: 14px; color: #666;"><strong>🔒 Token:</strong> ${secureToken}</p>
+                    </div>
+                    
+                    <div style="text-align: center; margin: 30px 0;">
+                        <a href="${meetingLink}" style="display: inline-block; background-color: #8A2BE2; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Unirse a la Videollamada</a>
+                    </div>
+                    
+                    <div style="text-align: center; margin-bottom: 30px;">
+                        <a href="${googleCalendarLink}" style="display: inline-block; color: #444; text-decoration: none; border: 1px solid #ddd; padding: 10px 20px; border-radius: 6px; font-size: 14px;">
+                            📅 Agregar a Google Calendar
+                        </a>
+                    </div>
+                    
+                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
+                    
+                    <p style="font-size: 12px; color: #888; text-align: center;">
+                        Si el botón no funciona, copia y pega este enlace: <br/>
+                        <a href="${meetingLink}" style="color: #8A2BE2;">${meetingLink}</a>
+                    </p>
+                </div>
+            `)
+            .addAttachment({
+                content: Buffer.from(icsContent).toString('base64'),
+                filename: 'invite.ics',
+                type: 'text/calendar',
+                disposition: 'attachment'
+            });
+
+        // Enviar el email
+        await mailerSend.send(emailParams);
+        console.log("Email enviado correctamente a:", to);
+        return true;
+    } catch (error) {
+        console.error("Error enviando email con MailerSend:", error);
+        return false;
+    }
+}
\ No newline at end of file
