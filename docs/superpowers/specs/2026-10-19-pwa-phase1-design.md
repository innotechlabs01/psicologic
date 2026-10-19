# PWA Fase 1 — Design Spec

> Aprobada por el usuario (oct 2026): "hazlo" tras la consulta de PWA.
> Fase 1 = instalable + velocidad. Fase 2 (offline shell) y Fase 3
> (web push) quedan fuera de scope.

## 1. Problema
Psicologic es una web que los psicólogos usan a diario, pero no es
instalable y cada visita re-descarga todo el bundle. Un PWA da la
experiencia de app nativa (icono, standalone, carga casi instantánea)
sin mantener RN/Flutter — exactamente lo que este proyecto decidió no ser.

## 2. Solución
- `@vite-pwa/astro` (integración oficial, workbox por debajo) en
  `astro.config.mjs`.
- Manifest: nombre Psicologic, `start_url: /client`, `display:
  standalone`, theme `#007BFF` (azul principal de la paleta),
  iconos 192/512 (purpose any+maskable).
- Iconos: burbuja de conversación (metáfora de terapia) sobre el
  gradiente de marca #007BFF→#8A2BE2, generados con sharp desde
  `public/img/pwa/icon-source.svg` (fuente versionada para regenerar).
- Registro del SW: script inline manual en los 5 layouts (la
  integración NO auto-inyecta con componentes Astro; `injectRegister:
  null`).

## 3. Estrategia de caching (el corazón de la seguridad)
| Recurso | Estrategia | Por qué |
|---|---|---|
| `dist/client` (bundles `_astro/*`, css, favicon) | **Precache** al instalar | el app-shell: carga instantánea |
| `/api/*` | **NetworkOnly** — NUNCA en cache | datos de sesión/pacientes/pagos (11-security.md) |
| Imágenes propias (png/jpg/webp) | CacheFirst, 30 días, máx 150 | assets estables |
| fonts.googleapis/gstatic | CacheFirst, 1 año | inmutables |
| Páginas HTML | Red directa (SSR) | contenido por sesión; `navigateFallback: null` — **offline real NO** es parte de esta fase |

## 4. Acceptance Criteria
- AC-1: build genera `sw.js` + `manifest.webmanifest` en el output del
  cliente, servidos en la raíz.
- AC-2: `astro check` sigue en 0 errores; build completo pasa.
- AC-3: manifest válido (JSON parseable, iconos existen, theme/lang es).
- AC-4: ninguna respuesta de `/api/*` queda en cache (config NetworkOnly).
- AC-5: tags PWA (manifest, theme-color, apple-touch-icon) en los 5 layouts.
- AC-6: registro del SW idempotente, con guard `'serviceWorker' in
  navigator`, silencioso si falla (no rompe la app).

## 5. Caveats documentados (decirselos a los psicólogos)
- **iOS + videollamadas**: testear getUserMedia desde la PWA instalada
  en iPhone antes de promover la instalación (Android sin problema).
- Instalación en iOS es manual (Compartir → Añadir a pantalla de
  inicio); Android sugiere el banner solo.
- Offline: NO en esta fase (app SSR + Clerk + DB).

## 6. Verificación runtime pendiente (necesita deploy de preview)
Lighthouse PWA audit + DevTools → Application → Service Worker:
registro activo, precache poblado, `/api/*` ausente del cache storage.
