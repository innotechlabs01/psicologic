# Psicologic — Backend Architecture

**Realidad operativa — octubre 2026.** El backend de esta app SON las Astro
API routes (`src/pages/api/*`, 44 endpoints) + `src/middleware.ts`.
No hay Go API ni Next.js: no los inventes.

---

## 1. Flujo de un request

```
Request
  → src/middleware.ts          Clerk: auth + rol (route matcher)
  → API route (pages/api/*)    locals.auth() → validación de input
  → src/lib/turso/             acceso a datos (parametrizado)
  → Response JSON               { data } | { error } + status correcto
```

### Auth (patrones existentes — seguirlos)

- `locals.auth()` da `{ userId, orgRole }` — TODO endpoint privado lo valida
  y devuelve 401 si no hay sesión.
- `orgRole === 'org:admin'` habilita vistas administrativas.
- Roles de negocio viven en `usuarios` (ver 04-database-design).
- Acceso público por **token** (ej. link de reunión de agenda) — validar
  que el token exista y pertenezca al recurso.

### Validación

- Validadores existentes: `validateName`, `validateCedula`, `validateEmail`.
- Toda ruta valida el body/params ANTES de tocar la DB y devuelve 400.

### Rate limiting

- `src/lib/turso/rate-limit` (`rate_limits` por IP) — usado en agenda POST.
- **Regla:** todo endpoint público que muta estado (webhooks, login-adyacentes,
  creación) aplica rate limit. GETs privados no lo necesitan.

---

## 2. Webhooks (verificar firma SIEMPRE)

| Webhook | Verificación |
|---|---|
| Clerk (`webhooks/clerk.ts`) | svix |
| Bold (`bold/webhook.ts`) | firma HMAC (`verifyBoldSignature`, crypto) |
| MercadoPago | estado/validación del pago |

Regla: ningún webhook muta la DB sin verificar firma/origen primero.

---

## 3. Conveniones de respuesta

- Success: `Response(JSON.stringify(data), { status: 200 })`.
- Error: `Response(JSON.stringify({ error: 'mensaje' }), { status: 4xx|5xx })`.
- Status correcto: 400 validación, 401 auth, 404 no existe, 429 rate limit.
- Envolver el handler en `try/catch` — un error de DB debe devolver 500 JSON,
  no HTML crudo.

---

## 4. Deuda conocida (no la empeores)

| Problema | Evidencia | Remedio |
|---|---|---|
| Lógica de negocio dentro de webhooks | `bold/webhook.ts` calcula `nextPaymentDate` (con isLeapYear) dentro del handler | Extraer a `src/lib/` y que el webhook solo verifique + persista |
| Middleware importa de una ruta | `src/middleware.ts` importa `createUserFromClerk` de `pages/api/webhooks/clerk` | Mover la lógica compartida a `src/lib/clerk/` |
| Clientes DB dispersos | middleware y bold/webhook crean su propio cliente libsql | Centralizar en `src/lib/turso/` |
| Comentarios de razonamiento | `api/agenda/index.ts` tiene comentarios de decisión de diseño | Borrarlos; el porqué vive en docs/commits |
| Rate limit incompleto | Solo algunos POST lo aplican | Extender a todo endpoint público mutante |

---

## 5. Reglas para rutas nuevas

1. Auth primero, validación segundo, DB tercero, respuesta cuarta.
2. Una ruta = un recurso/acción. Si crece, extraer a `lib/`.
3. Filtrar por `userId` del session — nunca confiar en un id del cliente.
4. En listas: `LIMIT`/paginación explícito.
5. Sin dependencias nuevas sin justificación (ver 12-coding-standards §6).
