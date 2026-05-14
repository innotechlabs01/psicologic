# ✅ Verificación Rápida - Gráfico de Citas

## 📋 Checklist de Instalación

### 1. Verificar archivos creados

```bash
# Ir a la carpeta del proyecto
cd c:\Users\jamg-\Trabajo\psicologic

# Verificar que los archivos existen
dir src\components\Chartjs\AppointmentsChart.tsx
dir src\components\Chartjs\AppointmentsQuickSummary.tsx
dir src\pages\api\appointments\history.ts
dir src\components\Chartjs\types.ts
```

### 2. Verificar dependencias

Las siguientes dependencias ya están en `package.json`:

```json
"chart.js": "^4.5.1",
"react-chartjs-2": "^5.x.x",  // Necesita verificar
"date-fns": "^4.1.0",
"@astrojs/react": "4.4.2",
"@clerk/astro": "^2.11.11"
```

**Si falta react-chartjs-2**:
```bash
pnpm add react-chartjs-2
# o npm install react-chartjs-2
```

### 3. Verificar integración en cliente.astro

Buscar en `src/pages/client.astro`:
- ✅ Import del componente AppointmentsChart
- ✅ Componente renderizado con `client:only="react"`
- ✅ Parámetro `userId` pasado correctamente

---

## 🧪 Testing Rápido

### Test 1: Desarrollo Local

```bash
# 1. Iniciar servidor de desarrollo
pnpm dev

# 2. Ir a http://localhost:3000/client
# 3. Debería ver el gráfico en la página

# 4. Abirir Developer Tools (F12)
# 5. Ir a Network tab
# 6. Simular solicitud a /api/appointments/history
# 7. Verificar respuesta en formato JSON
```

### Test 2: Responsividad

```bash
# En DevTools (F12) → Toggle Device Toolbar (Ctrl+Shift+M)

- [ ] Móvil (375px): Gráfico visible y funcional
- [ ] Tablet (768px): Gráfico bien distribuido
- [ ] Desktop (1200px): Gráfico completo
```

### Test 3: Funcionalidad

```
- [ ] Cargar página /client
- [ ] Esperar a que cargue el gráfico
- [ ] Hacer clic en botones Semanal/Mensual/Anual
- [ ] Hacer clic en Anterior/Siguiente
- [ ] Cambiar entre Línea/Barras
- [ ] Pasar cursor sobre el gráfico (tooltip)
```

### Test 4: Datos

```
- [ ] Verificar que se traen datos de la BD
- [ ] Comprobar que se ven dos colores (pendiente/confirmado)
- [ ] Verificar estadísticas (totales arriba)
- [ ] Si no hay datos: debe mostrar "No hay citas"
```

### Test 5: Seguridad

```
- [ ] Abrir DevTools → Console
- [ ] En Network tab, ver que /api/appointments/history tiene autenticación
- [ ] Intentar acceder como otro usuario (debería fallar)
- [ ] Verificar que no hay errores CORS
```

---

## 🔧 Troubleshooting Rápido

### Problema: "Module not found"

```
Error: Cannot find module 'react-chartjs-2'
```

**Solución**:
```bash
pnpm install
# o
pnpm add react-chartjs-2
npm install
npm run build
```

### Problema: Gráfico en blanco

**Causas comunes**:
1. No hay datos en BD → Verificar con: `SELECT * FROM agenda WHERE userId = ?`
2. Chart.js no está registrado → Error en consola
3. Componente no tiene userId → Verificar auth en cliente.astro

**Solución**:
```
1. Abrir DevTools (F12)
2. Console tab
3. Buscar errores en rojo
4. Si dice "Cannot find module" → ejecutar pnpm install
5. Si dice "ChartJS not registered" → Verificar useEffect
```

### Problema: "Unauthorized" en API

**Causa**: No hay sesión de Clerk activa

**Solución**:
1. Asegurarse que está logueado
2. Ir a `/client` (página protegida)
3. Verificar que Clerk está configurado

### Problema: Datos de otro usuario visible

**Esto es un BUG de seguridad**

**Acción inmediata**:
1. Revisar `/api/appointments/history.ts`
2. Verificar que `queryUserId === userId` (línea 20)
3. Si no está: agregar validación

---

## 📸 Verificación Visual

### Lo que DEBERÍA verse:

```
┌─────────────────────────────────────────────────┐
│  Historial de Citas Médicas                    │
│  Evolución de citas por período                │
├─────────────────────────────────────────────────┤
│  [Semanal] [Mensual] [Anual]  [Línea] [Barras] │
│  ← Anterior    01 mar 2026 - 30 abr 2026    → │
├─────────────────────────────────────────────────┤
│  │ Citas Pendientes: 12  │ Citas Confirmadas: 8│
├─────────────────────────────────────────────────┤
│                                                 │
│     GRÁFICO CON LÍNEAS NARANJA Y VERDE         │
│     (Interactivo, con tooltips)                │
│                                                 │
│  ◆ Citas Pendientes    ◆ Citas Confirmadas     │
│                                                 │
│  💡 Pasa el cursor para ver detalles            │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Siguiente: Actualizar Dependencias

Si `react-chartjs-2` no está instalado:

```bash
# 1. Abrir terminal en la carpeta del proyecto
cd c:\Users\jamg-\Trabajo\psicologic

# 2. Instalar dependencia
pnpm add react-chartjs-2

# 3. Verificar que se agregó a package.json
cat package.json | findstr "react-chartjs-2"

# 4. Instalar todas las dependencias
pnpm install

# 5. Reiniciar servidor
pnpm dev
```

---

## 📊 Performance Check

Abrir DevTools (F12) → Performance tab:

```
- [ ] Carga inicial: < 2 segundos
- [ ] Interacción: < 100ms
- [ ] Animaciones fluidas (60fps)
```

---

## ✅ Verificación Final

Si todo lo siguiente es TRUE, está listo:

- ✅ Archivo `AppointmentsChart.tsx` existe
- ✅ Archivo `history.ts` existe
- ✅ Componente renderiza sin errores
- ✅ Los datos cargan desde la BD
- ✅ El gráfico muestra dos líneas/barras (naranja/verde)
- ✅ Es responsive en móvil
- ✅ Los tooltips funcionan
- ✅ El botón Anterior/Siguiente navega
- ✅ Cambiar vista (Semanal/Mensual) funciona
- ✅ No hay errores en consola
- ✅ No hay errores de seguridad

---

## 📝 Logs Recomendados Monitorear

En el DevTools Console, buscar:

```javascript
// Debería ver:
"User ID from auth:", "abc123..."
"Pending count:", 5
"Confirmed count:", 3

// Debería NO ver:
"Unauthorized"
"Cannot find module"
"ChartJS is not defined"
"CORS error"
```

---

## 🎓 Documentación Rápida

| Necesidad | Archivo |
|-----------|---------|
| "¿Cómo usar?" | APPOINTMENTS_CHART_README.md |
| "¿Cómo integrar?" | INTEGRATION_GUIDE.md |
| "¿Ejemplos?" | CUSTOMIZATION_EXAMPLES.tsx |
| "¿Tipos?" | types.ts |
| "¿Historial?" | CHANGELOG.md |

---

## 🔄 Reset / Limpiar (Si algo falla)

```bash
# 1. Limpiar caché
rm -r node_modules
rm pnpm-lock.yaml

# 2. Reinstalar
pnpm install

# 3. Limpiar build
rm -r dist

# 4. Reiniciar servidor
pnpm dev
```

---

## 📞 Errores Específicos

### Error: "Cannot find module 'react-chartjs-2'"
```bash
pnpm add react-chartjs-2@^5.2.0
```

### Error: "ChartJS is not registered"
-> Verificar que `ChartJS.register(...)` se ejecute antes del render

### Error: "Unauthorized" en gráfico
-> Verificar que está logueado en `/client`

### Error: "CORS error"
-> El endpoint `/api/appointments/history` devuelve error 401/403

### Error: Gráfico pequeño/cortado
-> Cambiar `h-96` a una altura mayor en el padre

---

## ✨ Felicidades!

Si pasaste todos los tests, ¡el gráfico está funcionando correctamente!

**Próximos pasos**:
1. ✅ Probar en producción
2. ✅ Monitorear performance
3. ✅ Recopilar feedback de usuarios
4. ✅ Implementar mejoras de Fase 2

---

**Documento de verificación creado**: 15/04/2026
**Versión**: 1.0.0
**Status**: Listo para testear ✅
