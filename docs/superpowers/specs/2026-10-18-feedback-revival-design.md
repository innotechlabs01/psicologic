# Feedback recurrente de psicólogos — Design Spec

> Feature aprobada por el usuario (oct 2026): revivir el feedback "de
> manera chevere", con cadencia **mensual** y re-pregunta a los **15 días**
> cuando se descarta.

## 1. Problema

La página admin `/dashboard/feedback` está muerta (entera comentada) y su
código viejo consultaba la DB **desde el navegador** (roto e inseguro). El
formulario de feedback existe (`/client/feedback` + `FeedbackForm.tsx`)
pero nadie lo visita: no hay cadencia de recolección.

## 2. Roles

- **Psicólogo** (client): recibe el prompt recurrente; puede dar feedback
  cuando quiera desde `/client/feedback`.
- **Admin** (org:admin): ve el panel `/dashboard/feedback` con data
  agregada. No recibe prompt.

## 3. Acceptance Criteria

- **AC-1:** Given un psicólogo sin feedback previo, When entra a la app,
  Then ve el panel de feedback ~1.5s después de cargar (no bloqueante).
- **AC-2:** Given un feedback enviado hace menos de 30 días, When entra,
  Then no ve el prompt (cadencia cross-device vía
  `usuarios.metadata.last_feedback_at`).
- **AC-3:** Given un psicólogo que descarta el prompt, When navegan menos
  de 15 días, Then no vuelve a verlo pero sí un pill discreto para
  reabrirlo; a los 15 días vuelve el prompt.
- **AC-4:** Given feedback enviado OK, Then el panel se cierra y queda
  registrada la cadencia en metadata.
- **AC-5:** Given un admin en `/dashboard/feedback`, Then ve cards
  (mood/rating/comentario/fecha) + doughnut de moods + stats (total,
  promedio, últimos 30 días) servidos por `GET /api/feedback/feedback`.
- **AC-6:** Given un no-admin pide el listado, Then 403.
- **AC-7:** POST requiere sesión (401 sin ella) + rate limit 5/min por IP.
  El comentario se escapa al renderizar (XSS).

## 4. Criterios UX

- Panel bottom-right no bloqueante, entrada animada, X y "Ahora no".
- Reusa `FeedbackForm` (moods + slider + comentario) — cero duplicación.
- El prompt vive en `LayoutClient` con `transition:persist`: se consulta
  el status UNA vez por sesión, no en cada navegación.

## 5. Flujo

```
LayoutClient monta FeedbackPrompt (persist)
  → GET /api/feedback/status (admin=false, lastFeedbackAt, 30d)
  → shouldPrompt? → panel con FeedbackForm
  → POST /api/feedback/feedback (auth + rate limit + metadata)
  → panel se cierra hasta el próximo ciclo
```

## 6. Out of scope

- Link del sidebar: el menú es DB-driven (admin de headers) — se agrega
  desde ahí, no hardcodeado.
- Columna `clerk_user_id` en `feedback` (atribución por usuario): queda
  como migración aditiva futura (04-database-design).
- Emails/recordatorios.
