# Psicologic — Security

**Realidad operativa — octubre 2026.** Los mecanismos acá descriptos existen
en el código. Lo marcado PENDIENTE es mejora acordada, no inventada.

---

## 1. Autenticación y autorización

- **Clerk** (`@clerk/astro`, localización esES) — login, sesión, webhook svix.
- `src/middleware.ts`: `clerkMiddleware` + `createRouteMatcher` — protección
  por ruta y por rol (`isAdminRole`, `isClientRole` desde `src/lib/clerk/`).
- `locals.auth()` en cada API route: `{ userId, orgRole }`. Sin userId → 401.
- Roles de negocio en tabla `usuarios` (`clerk_user_id`).
- Usuarios sin aprobar → `pending-approval` (flujo approve/reject/suspend).

**Regla:** ningún endpoint confía en identificadores que vengan del cliente.
El `userId` SIEMPRE sale del session.

## 2. Datos de pacientes (lo más sensible del sistema)

- Historia clínica (`clinical_entries`, `patients`), agenda y pagos.
- **Ley 1581 de 2012 (Colombia)** — tratamiento de datos personales:
  - Acceso mínimo necesario; filtros por usuario logueado SIEMPRE.
  - Nunca loguear contenido clínico ni credenciales.
  - Soft-delete para pacientes (el endpoint `reactivate` existe — no
    introducir DELETEs físicos).
- `access_logs` existe — alimentarlo en acciones críticas.

## 3. SQL

- TODO parametrizado (`execute({ sql, args })`) — el código existente lo
  cumple. Mantener la regla: jamás concatenar SQL.

## 4. Webhooks

- **Bold:** verificación de firma HMAC (`verifyBoldSignature` con crypto).
  Ningún webhook muta DB sin verificar firma primero.
- **Clerk:** svix.
- **MercadoPago:** validar estado del pago antes de conceder acceso
  (`checkUserPaymentAccess`).

## 5. Rate limiting

- `src/lib/turso/rate-limit` (tabla `rate_limits`, por IP via
  `x-forwarded-for`). Aplicado en agenda POST.
- **PENDIENTE:** extender a todos los endpoints públicos mutantes.

## 6. Cabeceras HTTP (`vercel.json`)

- `X-Content-Type-Options: nosniff` ✓
- `Referrer-Policy: strict-origin-when-cross-origin` ✓
- `Permissions-Policy: camera=(self), microphone=(self)` ✓ (WebRTC)
- **CSP permisiva (PENDIENTE hardening):** `default-src *` +
  `unsafe-inline`/`unsafe-eval` en script-src. Objetivo: `default-src 'self'`
  + allowlist explícita (Clerk, Bold checkout, jsdelivr, fonts, supabase,
  vercel.live). Hacerlo gradual verificando cada flujo (pagos, Clerk, video).

## 7. WebRTC

- TURN con credenciales **efímeras** (`turn-credentials` + coturn) — nunca
  credenciales estáticas en el cliente.
- Señalización por endpoint propio + supabase (ver 08-api-specification).

## 8. Secretos

- `.env*` gitignored (solo `.env.example` con placeholders). Pre-commit hook
  bloquea `.env*`, `*.pem` y `e2e/credentials.env`.
- Rotación de claves Clerk/Turso/Bold/MailerSend desde los dashboards.

## 9. Reglas para cambios

1. Feature nueva que toca auth/roles/pagos/pacientes = review con
   `security-and-hardening` skill como gate.
2. Ningún endpoint "temporalmente" sin auth.
3. Nueva tabla con datos personales → documentarla en 04-database-design
   sección 5.
