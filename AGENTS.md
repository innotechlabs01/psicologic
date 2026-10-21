# PSICOLOGIC — AGENTS.md (Rule Manager)

## ESTA ES LA APP (verificado en codigo, octubre 2026)

**Psicologic** — plataforma de gestion para psicologos (Colombia): agenda de
citas, videollamadas WebRTC, pacientes con historia clinica, pagos, juegos
terapeuticos, tickets de soporte y dashboard. UNA app Astro en la raiz del
repo. No es monorepo.

### Stack real (con evidencia en el codigo)

| Capa | Tecnologia |
|---|---|
| Framework | **Astro 5 SSR** (`output: 'server'`, adapter `@astrojs/vercel`) |
| UI | **React 19 islands** (`@astrojs/react`) + Alpine.js + vanilla JS (`public/js/`) |
| Estilos | **Tailwind CSS 4** (`src/styles/global.css` → build a `public/css/main.css`) + radix/shadcn + lucide + tw-animate |
| Auth | **Clerk** (`@clerk/astro`, esES) + `src/middleware.ts` (route matcher por rol) + webhook svix |
| Backend | **Astro API routes** — `src/pages/api/*` (44 endpoints TypeScript). NO hay Go API ni Next.js |
| Database | **TursoDB** via `@libsql/client` — helpers en `src/lib/turso/` |
| Pagos | **MercadoPago** + **Bold** (webhooks propios en `src/pages/api/bold/`) |
| Email | **MailerSend** (via API) |
| PDF | htmldocs / pdfkit / react-pdf (`src/pages/api/clinic_pdf/`) |
| Video | **WebRTC custom** (`useWebRTC`) + `signaling.ts` + TURN (`turn-credentials.ts`) |
| Charts | chart.js + react-chartjs-2 |
| Tests | Playwright (`playwright.config.ts`, `tests/`) |
| Deploy | Vercel, desde branch `productive` (`.github/workflows/deploy-vercel.yml`) |

### LO QUE NO EXISTE (no lo asumas, no lo "arregles")

- **No hay mobile**: sin React Native, Flutter ni Expo. Los tasks T-001/T-002
  del BOARD vienen de OTRO proyecto.
- No hay `apps/api` (Go), `apps/web` (Next.js), `packages/` ni workspaces.
- `apps/rules/` es un corpus **template de otro producto** ("MR Training"):
  no es fuente de verdad tecnica de este repo (ver seccion final).

---

## RAMAS

- `development` = integracion — PRs aca.
- `productive` = deploy (Vercel) — solo se actualiza por merge, NUNCA push directo.
- `main` = stub sin uso. No branchear de aca.

---

## REGLA DE ORO

**ANTES de cualquier cambio de codigo, diseño o configuracion:**

1. Lee este archivo completo.
2. Identifica que zona de la app tocas (pages / api / components / lib / public/js).
3. Lee el CODIGO REAL de esa zona antes de modificarla.

No inventes estructura que no existe. Si algo de este archivo contradice al
codigo, el codigo gana — y corregi este archivo.

---

## MAPA DEL APP

```
src/
├── pages/          54 rutas .astro (index, dashboard, client, games,
│                   agenda/, admin/, payment/, pending-approval)
│                   + API routes en pages/api/ (44 endpoints: agenda, bold,
│                   client/patients, dashboard, feedback, games, patients,
│                   payment, settings, tickets, users, webhooks/clerk)
├── components/     48 componentes React (.tsx islands): Agenda/ (calendario
│                   + VideoRoom WebRTC + hooks), Admin/, Chat/, Client/,
│                   Dashboard/, games/, Payment/, Skeleton/, Toast/, Chartjs/
├── lib/turso/      acceso DB: turso.js, Settings/, agenda/, userControl/, Header/
├── lib/supabaseClient.ts   cliente supabase auxiliar (storage/realtime)
├── lib/clerk/roles.ts      helpers de rol (isAdminRole, isClientRole)
├── middleware.ts   proteccion de rutas por rol (clerkMiddleware)
├── utils/          getUserRole, checkUserPaymentAccess, checkUserGameAccess
└── styles/global.css   fuente Tailwind 4 → pnpm build:style → public/css/main.css

public/js/          vanilla JS: dashboard/, games/ (cartas, overcome_fears),
                   settings, agenda/, toast, fetch-interceptor
public/img/         assets estaticos (png/svg)
docs/superpowers/   specs de features (template: TEMPLATE-coach-feature.md)
scripts/            worktree.sh, check-scaffold.sh
.agents/skills/     skills del proyecto (ver mapa abajo)
```

---

## MAPA DE SKILLS POR TIPO DE CAMBIO

**Bootstrap obligatorio en CADA task:** skill `pipeline-init` (carga
mr-context + herdr-setup, y herdr si HERDR_ENV=1).

| Tipo de cambio | Skills a cargar |
|---|---|
| Feature nueva | `planning-and-task-breakdown` + spec en docs/superpowers/ + `frontend-ui-engineering` |
| UI / estilos | `frontend-design` + `frontend-ui-engineering` + `tailwind-css-patterns` + `accessibility` |
| API route nueva o cambio | `api-and-interface-design` + `nodejs-backend-patterns` + `security-and-hardening` + `clerk-backend-api` |
| DB (src/lib/turso) | `nodejs-best-practices` + `security-and-hardening` |
| Pagos (MercadoPago/Bold) | `security-and-hardening` — webhooks: verificar firma SIEMPRE |
| Bug | `debugging-and-error-recovery` (root cause primero) + test que reproduzca |
| Fluidez / rendimiento | `performance-optimization` |
| Tests E2E | `playwright-best-practices` |
| Refactor | `code-simplification` + `incremental-implementation` |
| Review / PR | `code-review-and-quality` + `work-unit-commits` + `branch-pr` + `caveman-commit` |
| Deploy / CI | `deploy-to-vercel` |
| TypeScript avanzado | `typescript-advanced-types` |
| React patrones | `vercel-react-best-practices` + `vercel-composition-patterns` |
| SEO (landing) | `seo` |

---

## REGLAS TECNICAS OBLIGATORIAS

1. **Toda API route valida auth con Clerk** — sigue el patron existente
   (`verifyClerkUser`, middleware por rol) y los validadores de input
   (`validateName`, `validateCedula`, `validateEmail`).
2. **DB solo con el patron `src/lib/turso/`** — no crees clientes
   @libsql/client sueltos en pages/components.
3. **Estilos:** edita `src/styles/global.css` y corre `pnpm build:style`.
   `public/css/main.css` es build output — nunca lo edites a mano.
4. **Secretos nunca al repo.** `.env*` esta ignorado; solo `.env.example`
   con placeholders.
5. **WebRTC:** todo cambio de video toca `signaling.ts` y
   `turn-credentials.ts` — validalo con DOS navegadores reales.
6. **Pagos:** los webhooks de Bold y MercadoPago verifican firma/estado antes
   de mutar la DB. Nunca confies en el request sin validar.
7. **Datos de pacientes = datos sensibles.** No los loguees, no los expongas
   en respuestas API innecesarias, no los copies a specs/docs.

---

## WORKFLOW OBLIGATORIO

```
Recibes una tarea
  ↓
0. Skill `pipeline-init`. Trabaja SIEMPRE en tu worktree:
   scripts/worktree.sh new feature/<nombre> (base origin/development)
  ↓
1. Identifica el tipo de cambio (mapa de skills arriba)
  ↓
2. Lee el codigo real de la zona afectada
  ↓
3. Ejecuta en slices chicos, commit atomico convencional por slice
  ↓
4. Verifica: pnpm build + build:style + playwright (lo que aplique)
  ↓
5. PR a development. Limpia el worktree tras merge.
```

- Commits: convencionales, atomicos, sin atribucion AI (`caveman-commit`).
- Reply al usuario: modo caveman salvo excepciones (ver 14-team-workflow.md §5).
- Review antes de merge: `code-review-and-quality` como gate.

---

## COMANDOS

```bash
pnpm dev          # dev server (necesita .env con Clerk + Turso — ver .env.example)
pnpm build        # build produccion
pnpm preview      # preview del build
pnpm build:style  # tailwind: src/styles/global.css → public/css/main.css
pnpm watch:style  # tailwind watch

npx playwright test          # E2E
scripts/check-scaffold.sh    # integridad del scaffold (lo que corre CI)
make install-hooks           # instala .githooks/pre-commit
```

---

## `apps/rules/` — REGLAS DEL PROYECTO

Los docs TECNICOS del corpus fueron **reescritos para ESTA app** (oct 2026):
`04-database` (TursoDB real), `05-backend` (API routes), `06-frontend`
(islands + vanilla JS), `08-api` (44 endpoints), `10-devops` (Vercel),
`11-security`, `12-coding-standards`, `13-testing` (Playwright),
`MASTER_PROMPT` y `14-team-workflow` (proceso de equipo).

- `07-mobile-architecture` y `09-ai-specification` fueron eliminados (no hay
  mobile ni AI en este repo; recuperables desde historial git).
- `00`–`03` (product-vision, brand, design-system, ux-workflows) siguen
  siendo contenido del template MR Training — PENDIENTES de decision de
  producto. No usarlos como referencia de este producto.
- Fuente de verdad para trabajar: este archivo + el mapa de skills + los
  docs 04-14 del corpus.
