# Psicologic — DevOps

**Realidad operativa — octubre 2026.** Vercel + GitHub. Sin Docker, sin
Kubernetes, sin infra propia: no inventar infraestructura que no existe.

---

## 1. Deploy

- **Plataforma:** Vercel (SSR, adapter `@astrojs/vercel`, `output: 'server'`).
- **Branch de deploy:** `productive` — SOLO se actualiza por merge, nunca
  push directo.
- **Workflow:** `.github/workflows/deploy-vercel.yml` (build de Astro +
  vercel-action, secrets en GitHub: `VERCEL_TOKEN`, `VERCEL_ORG_ID`,
  `VERCEL_PROJECT_ID`, `CLERK_*`).
- **Rollback:** instant rollback desde el dashboard de Vercel a cualquier
  deploy anterior. Es el procedimiento estándar ante un deploy malo.

## 2. Ramas

- `development` = integración (PRs acá; corre `ci.yml`).
- `productive` = producción.
- `main` = stub sin uso. No tocar.
- Feature branches: `feature/<nombre>` desde `origin/development` via
  `scripts/worktree.sh new` (un branch = un worktree).

## 3. CI

| Workflow | Trigger | Qué hace |
|---|---|---|
| `ci.yml` | push/PR a `development` | `scripts/check-scaffold.sh` + shellcheck |
| `deploy-vercel.yml` | push/PR a `productive` | Build Astro + deploy Vercel |

Mejora pendiente: correr Playwright smoke contra el preview de Vercel en PRs.

## 4. Env vars

- Viven en: **Vercel dashboard** (producción/preview) y `.env` local
  (gitignored). `.env.example` es el inventario: Clerk, Turso, Bold,
  MailerSend, TURN (coturn), supabase (señalización WebRTC).
- Nunca commitear valores reales. El pre-commit hook bloquea `.env*`.

## 5. Seguridad HTTP (`vercel.json`)

- CSP: **permisiva hoy** (`default-src *`, `unsafe-inline`, `unsafe-eval` en
  script-src) — hardening pendiente: restringir `connect-src`/`default-src`
  a los orígenes reales (Clerk, Bold, jsdelivr, supabase, fonts).
- `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
  (camera/mic self — requerido por WebRTC) ✓.

## 6. Desarrollo local

```bash
pnpm install
cp .env.example .env        # llenar con claves de dev
pnpm dev                    # http://localhost:4321
pnpm build:style            # regenerar public/css/main.css tras tocar global.css
```

DB local = no existe: Turso se usa directo (crear DB de desarrollo en Turso
para cambios de esquema).

## 7. Reglas operativas

1. Nunca pushear directo a `productive`.
2. Un deploy malo se revierte con rollback de Vercel — no con "hotfix
   a las apuradas" sin verificar.
3. Cambio de esquema de DB = documentado en 04-database-design + probado en
   DB de desarrollo de Turso antes de producción.
4. Después de cada merge a `productive`, verificar el deploy en el
   dashboard (build + funciones SSR).
