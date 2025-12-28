# Psicologic — Proyecto

**Psicologic** es una aplicación construida con Astro y Tailwind CSS para la gestión de citas, historial de pacientes, y herramientas de apoyo para terapeutas y pacientes.

## 🧩 Resumen del proyecto

- Stack: **Astro**, **TailwindCSS**, **TypeScript**, **Clerk** (autenticación) y servicios propios.
- Estructura principal: `src/` para componentes, layouts y páginas; `public/` para assets estáticos.
- Tests: `playwright` para E2E y specs con Vitest/Playwright según la carpeta `tests/`.

## ⚙️ Comandos útiles

```bash
pnpm install     # Instala dependencias
pnpm dev         # Inicia servidor de desarrollo
pnpm build       # Genera el build de producción
pnpm preview     # Previsualiza el build
pnpm test        # Ejecuta pruebas (si aplica)
```

---

## 🎨 Paleta de colores (IT InnoTech Labs SAS) 💡

Usamos una paleta reducida y coherente para mantener la identidad visual. A continuación los tokens y ejemplos de uso:

| Token CSS | Color (HEX) | Uso recomendado |
|-----------|-------------|-----------------|
| `--color-azul-principal` | `#007BFF` | Acciones principales: botones, links, borders importantes ✅ |
| `--color-morado-principal` | `#8A2BE2` | Acentos secundarios, loaders, highlights 🔮 |
| `--color-azul-oscuro` | `#0A1F44` | Texto principal, títulos, cuerpos de texto 📝 |
| `--color-lavanda` | `#C3A6FF` | Fondos suaves, badges, estados neutrales 💜 |
| `--color-gris-claro` | `#F5F5F5` | Fondos de pantalla y contenedores claros 🪶 |

### Ejemplo rápido (CSS)

```css
:root {
  --color-azul-principal: #007BFF;
  --color-morado-principal: #8A2BE2;
  --color-azul-oscuro: #0A1F44;
  --color-lavanda: #C3A6FF;
  --color-gris-claro: #F5F5F5;
}

body {
  background-color: var(--color-gris-claro);
  color: var(--color-azul-oscuro);
}

button.primary {
  background-color: var(--color-azul-principal);
  color: white;
}

button.primary:hover {
  background-color: var(--color-morado-principal);
}
```

> Consejo: preferir tokens CSS (`var(--color-...)`) para que el tema sea fácil de mantener y reusar.

---

## 🧪 Cambios aplicados (resumen)

- Añadidos tokens de color en `src/styles/global.css`.
- Actualizados estilos y componentes clave para usar la paleta (loader, skeleton, charts, emails, estilos globales).
- Reemplazados colores directos por tokens o por los hex de la paleta donde aplica.
- Seguridad y APIs: añadido verificación `verifyClerkUser` en endpoints, validadores de entrada (`validateName`, `validateCedula`, `validateEmail`) y endpoint `POST /api/client/patients/reactivate` para reactivar pacientes (soft-delete pattern).

Si quieres que sustituya más colores (ej. paleta de gráficas completa o paleta de los juegos), dímelo y lo aplico en los archivos restantes.

---

## 📦 Contribuir

1. Clona el repo
2. Instala dependencias: `pnpm install`
3. Corre en modo desarrollo: `pnpm dev`

---

## 📬 Contacto

Si necesitas ayuda con la implementación del diseño, o quieres que haga una revisión completa de estilos para dejar todo 100% alineado con la paleta, dime y lo dejo listo.

