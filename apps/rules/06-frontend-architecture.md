# Psicologic — Frontend Architecture

**Realidad operativa — octubre 2026.** Astro 5 SSR (`output: 'server'`,
adapter Vercel) con React 19 islands y una capa de vanilla JS heredada.

---

## 1. Layouts (5)

| Layout | Uso | Particularidades |
|---|---|---|
| `Layout.astro` | Landing/público | Mínimo, sin JS global |
| `LayoutClient.astro` | App del cliente (psicólogo) | `ClientRouter` + `transition:persist` (sidebar, progress bar) |
| `LayoutDashboard.astro` | Dashboard admin | `ClientRouter` + fonts (preconnect + Inter) |
| `LayoutGames.astro` | Juegos | Carga los JS de juegos |
| `LayoutVideoCall.astro` | Videollamada | Aislada a propósito |

`ClientRouter` (view transitions de Astro) YA está activo en client/dashboard:
la navegación es fluida sin recargar. Mantener `transition:persist` en el
shell persistente (sidebar, progress bar).

---

## 2. Política de hidratación de islands

**Censo actual (oct 2026):** 17 `client:load`, 12 `client:only`,
1 `client:visible`, 0 `client:idle`.

| Directiva | Cuándo usarla |
|---|---|
| `client:load` | Interacción inmediata crítica: VideoRoom, chat activo |
| `client:idle` | **Default para islands interactivos** (charts, formularios, listas) |
| `client:visible` | Below the fold (juegos al scroll, widgets lejanos) |
| `client:only` | SOLO componentes con APIs de browser en init (WebRTC). **Nunca para esconder mismatches de hidratación** — si hay mismatch, se arregla el mismatch |

**Regla:** cada island nuevo justifica su directiva. Migrar los `client:only`
no justificados a `client:idle` es una mejora de eficiencia directa.

---

## 3. Islands React (48 componentes .tsx)

- **Agenda:** suite completa de calendario (radix/shadcn, `cva`+`cn`,
  `react-day-picker`, zustand en `store/calendar-store.ts`) + `VideoRoom`
  (515 líneas) + `useWebRTC` (460 líneas) + `useAgendaFetch`.
- **Otros:** Dashboard (charts con `react-chartjs-2`), Chat, Payment,
  Admin, Skeleton, Toast, FormRenderer.
- Estado: zustand por dominio (calendario). Server-state vía fetch con
  hooks custom (`useAgendaFetch`).
- Convenciones: componentes funcionales, `StyleSheet` NO (Tailwind classes),
  archivos < 300 líneas, extraer subcomponentes.

---

## 4. Capa vanilla JS (`public/js/`) — legado funcional

| Archivo | Qué hace |
|---|---|
| `dashboard/dashboard.js` (662) | `DashboardManager`: stats, filtros, **polling cada 30s con `document.visibilityState`** (buen patrón — preservarlo) |
| `games/cartas.js`, `games/overcome_fears.js` | Juegos terapéuticos |
| `settings.js`, `agenda/index.js`, `headerClient/` | Páginas específicas |
| `fetch-interceptor.js` | Monkey-patch de `window.fetch` para el loader global con allowlist de fetches "background" |
| `toast.js` | Toasts globales |

**Política:** el vanilla JS existente se mantiene y se arregla in-place.
Interactividad NUEVA se construye como React islands. Reemplazo incremental
de los manager grandes (dashboard.js) solo con feature que lo justifique.
No crear globals nuevos sin documentarlos acá.

---

## 5. Estilos

- **Fuente única:** `src/styles/global.css` (Tailwind 4, tokens de marca).
- **Build:** `pnpm build:style` → `public/css/main.css` (build output — nunca
  editar a mano).
- `main.css` (180 KB, NO minificado) se carga en `<head>` de cada layout —
  es render-blocking. **Minificar el build es un quick win de LCP.**
- Fonts: Google Fonts Inter con `preconnect` (hoy solo en LayoutDashboard —
  replicar en los layouts que cargan fonts).

---

## 6. Reglas

1. Nuevo contenido interactivo = React island con directiva justificada (§2).
2. El loader global depende de `fetch-interceptor` — no romper el contrato
   `background: true` ni el allowlist.
3. Imágenes: siempre `width`/`height` (evita CLS); usar `astro:assets` para
   assets nuevos.
4. `dist/`, `public/css/main.css` = outputs. Editar las fuentes.
