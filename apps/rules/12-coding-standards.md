# Psicologic — Coding Standards

**Realidad operativa — octubre 2026.** TypeScript strict ya está activo
(`astro/tsconfigs/strict`). Este archivo describe cómo se escribe código
en ESTA app (Astro + React islands + vanilla JS + SQL).

---

## 1. TypeScript

- strict SIEMPRE (ya configurado). No `any`, no `as any`.
- Tipos explícitos en exports y firmas de funciones públicas.
- Tipos compartidos por dominio cerca de quien los usa (`src/constants/interfaces/`).
- No crear tipos "por si acaso" — tipar lo que existe.

## 2. React islands (`.tsx`)

- Componentes funcionales + hooks. Sin class components.
- Archivos < 300 líneas; component > 200 = extraer subcomponentes.
- Estado: zustand por dominio (ej. `calendar-store`); server-state via hooks
  de fetch (`useAgendaFetch`), nunca duplicar server-state en stores.
- Estilos: clases Tailwind + tokens de `global.css`. Sin CSS inline suelto.
- Componentes base: radix/shadcn con `cva` + `cn` — seguir el patrón
  existente de `components/Agenda/ui/`.
- Directiva de hidratación justificada (ver 06-frontend-architecture §2).
- Props: sin objetos nuevos por render en listas (referencias estables).

## 3. Vanilla JS (`public/js/`)

- Clases manager (`DashboardManager` es el patrón de referencia).
- Event delegation / listeners al init; limpiar intervalos (`clearInterval`).
- Respetar el contrato de `fetch-interceptor` (fetches "background" con
  `background: true` o en el allowlist).
- Sin globals nuevos sin documentarlos en 06-frontend-architecture §4.

## 4. API routes (`src/pages/api/`)

- Orden: auth → validación → negocio → respuesta.
- SQL parametrizado vía `src/lib/turso/` — no crear clientes libsql sueltos.
- Respuestas: `{ error }` + status correcto; try/catch alrededor del handler.
- Lógica de negocio en `src/lib/`, no en la ruta ni en webhooks.
- Listas con límite explícito.

## 5. Nombres y archivos

| Concepto | Convención | Ejemplo |
|---|---|---|
| Componentes | PascalCase, named export | `WorkoutCard.tsx` → `export function WorkoutCard` |
| Hooks | `use` + camelCase | `useAgendaFetch` |
| Stores | camelCase + `Store` | `calendar-store.ts` → `useCalendarStore` |
| Lib por dominio | camelCase | `userControl.ts` |
| API routes | kebab-case de recurso | `turn-credentials.ts` |
| Constantes | SCREAMING_SNAKE_CASE | `MAX_...` |
| Archivo | una responsabilidad, < 300 líneas | |

## 6. Comentarios y dependencias

- Comentarios explican POR QUÉ, no qué.
- **Borrar comentarios de razonamiento de diseño** (ej. los de
  `api/agenda/index.ts`) — el porqué vive en commits y docs.
- Dependencia nueva: ¿la resuelve el stack? (Tailwind/radix/zustand/charts
  cubren casi todo). Si no, justificar peso y mantenimiento en el PR.
- Dependencias muertas se eliminan (ej. `@astrojs/preact` + `preact`
  instalados sin uso — candidato a remover).

## 7. Git

### 7.1 Branches

- `feature/<desc>` desde `origin/development` via `scripts/worktree.sh new`.
- Un branch = un worktree. Nunca trabajar en `productive` ni `main`.

### 7.2 Commits (atómicos, convencionales)

- Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
- Un commit = un cambio lógico revisable (~100 líneas objetivo).
- Subject imperativo, standalone: "Delete the FizzBuzz RPC", no "fix bug".
- Body: qué + porqué + verificación. Sin atribución AI.
- Tests y docs del cambio van en el MISMO commit que el código.

### 7.3 Pull Requests

- PR a `development`. Título = intención. Descripción: qué cambia, porqué,
  cómo se verificó (build + build:style + playwright lo que aplique).
- Review con `code-review-and-quality` como gate antes de merge.
- Refactor y feature = PRs separados.
- Tras merge: `scripts/worktree.sh remove <branch>` y cleanup.
