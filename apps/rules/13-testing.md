# Psicologic — Testing

**Realidad operativa — octubre 2026.** El framework de testing es
**Playwright** (`playwright.config.ts`, `tests/` — hoy 1 spec de ejemplo).
No hay suite de unit tests de frontend: la estrategia es E2E-first sobre
los flujos críticos, creciendo por slice de feature.

---

## 1. Estrategia

| Nivel | Herramienta | Estado |
|---|---|---|
| E2E críticos | Playwright | Base existe; suite a crecer |
| Smoke de deploy | Playwright contra preview Vercel | PENDIENTE (en PRs) |
| Unit (lógica de lib/) | Sin framework hoy | AEvaluar cuando `src/lib/` crezca en lógica pura |

**Regla:** un slice que cambia comportamiento incluye su test E2E en el
mismo PR. No se mergea sin los checks del slice.

## 2. Flujos críticos a cubrir (prioridad)

1. **Login + redirección por rol** — admin → dashboard, client → app,
   sin aprobar → pending-approval.
2. **Agendar cita** — POST agenda (validación, rate limit, rango de fechas).
3. **Página de videollamada** — carga con token de reunión válido;
   token inválido → error, no crash.
4. **Estado de pago** — `/api/payment/status/[userId]` refleja
   nextPaymentDate/blockedPaymentDate y el acceso se bloquea vencido.
5. **Tickets** — crear ticket + mensaje + mark-read.
6. **Webhooks** — Bold con firma inválida → rechazado (test de contrato).

## 3. Setup

```bash
pnpm dev                          # app en :4321 (necesita .env)
npx playwright test               # headless
npx playwright test --headed      # verlo correr
npx playwright codegen            # grabar flujos nuevos
```

- **Usuarios de prueba** (Clerk dashboard + roles en `usuarios`):
  admin@test / client@test (ver TESTING.md).
- Descomentar `baseURL` en `playwright.config.ts` apuntando a localhost:4321
  al escribir specs.

## 4. Reglas

1. Tests prueban COMPORTAMIENTO (lo que ve el usuario), no implementación.
2. Cada spec es independiente — crea sus propios datos o usa prefijo único.
3. Flaky (3 fallos seguidos) se cuarentena y se arregla antes del release.
4. Al tocar pagos/auth/pacientes, el PR incluye el test del flujo afectado.
5. Playwright-best-practices skill es la referencia de patrones (selectores,
  fixtures, CI).

## 5. Cobertura objetivo

- Flujos críticos (§2): 100% cubiertos antes de agregar features nuevas.
- Regresión de bug: el test que lo reproduce entra con el fix — sin excepción.
