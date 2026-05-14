# AppointmentsChart Component

Componente interactivo React que muestra gráficos de historial de citas médicas con visualización de tendencias.

## Características

✅ **Dos tipos de gráficos**: Línea y Barras
✅ **Tres vistas temporales**: Diaria (semanal), Semanal (mensual), Mensual (anual)
✅ **Dos categorías de citas**: Pendientes (naranja) y Confirmadas (verde)
✅ **Filtrado por rango de fechas**: Navegación anterior/siguiente
✅ **Tooltips interactivos**: Información detallada al pasar el cursor
✅ **Leyenda clara**: Identificación visual de categorías
✅ **Completamente responsive**: Adaptable a cualquier tamaño de pantalla
✅ **Localización en español**: Etiquetas y formatos de fecha en español

## Uso Básico

### En un componente Astro:

```astro
---
import AppointmentsChart from "../components/Chartjs/AppointmentsChart";

const userId = "user-123"; // Obtenido del contexto de autenticación
---

<AppointmentsChart 
  userId={userId} 
  chartType="line" 
  defaultView="monthly"
  client:only="react" 
/>
```

### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `userId` | `string` | Requerido | ID del usuario para filtrar citas |
| `chartType` | `'line' \| 'bar'` | `'line'` | Tipo de gráfico inicial |
| `defaultView` | `'daily' \| 'weekly' \| 'monthly'` | `'monthly'` | Vista temporal inicial |

## Funcionalidades Detalladas

### 1. Vistas Temporales

- **Semanal (7 días)**: Vista diaria de los últimos 7 días
- **Mensual (4 semanas)**: Vista semanal de los últimos 3 meses
- **Anual (12 meses)**: Vista mensual del último año

### 2. Navegación

- Botones "Anterior" y "Siguiente" para cambiar períodos
- El botón "Siguiente" se desactiva cuando se alcanza la fecha actual
- Muestra el rango de fechas del período actual

### 3. Filtrado de Datos

El endpoint API en `/api/appointments/history`:
- Valida que el usuario solo pueda acceder sus propias citas
- Filtra citas por rango de fechas
- Solo incluye citas no canceladas
- Devuelve estados: 'pending' y 'confirmed'

### 4. Estadísticas Resumidas

Tarjetas superiores que muestran:
- Total de citas pendientes en el período
- Total de citas confirmadas en el período
- Colores diferenciados para cada tipo

## Estructura de Datos

### Objeto AgendaEvent

```typescript
interface AgendaEvent {
  id: string;
  title: string;
  date: string;           // Formato: YYYY-MM-DD
  startTime: string;      // Formato: HH:MM
  endTime: string;        // Formato: HH:MM
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  participants: any;
  userId: string;
  // ... otros campos
}
```

### Respuesta del Endpoint

```json
[
  {
    "id": "event-1",
    "title": "Sesión de Terapia",
    "date": "2026-04-15",
    "startTime": "10:00",
    "endTime": "11:00",
    "status": "confirmed",
    "userId": "user-123",
    ...
  },
  ...
]
```

## Endpoint API

### GET `/api/appointments/history`

**Parámetros Query:**
- `userId` (string, requerido): ID del usuario
- `startDate` (string, requerido): Fecha inicio (YYYY-MM-DD)
- `endDate` (string, requerido): Fecha fin (YYYY-MM-DD)

**Autenticación:** Requiere sesión de Clerk activa

**Respuesta:** Array de `AgendaEvent`

**Errores:**
- 401: No autenticado
- 403: Intentando acceder datos de otro usuario
- 400: Parámetros inválidos
- 500: Error del servidor

## Personalización

### Cambiar Colores

Edita los colores en `AppointmentsChart.tsx`:

```typescript
// Para Citas Pendientes
borderColor: '#F59E0B',        // Naranja
backgroundColor: '#FCD34D',     // Naranja claro

// Para Citas Confirmadas
borderColor: '#10B981',         // Verde
backgroundColor: '#86EFAC',     // Verde claro
```

### Cambiar Idioma

El componente usa `date-fns` con localización en español. Para otro idioma:

```typescript
import { es } from 'date-fns/locale'; // Cambiar a: de, fr, it, etc.
```

### Personalizar Etiquetas

Busca las strings hardcodeadas en el componente y reemplázalas:

```typescript
// En el componente
label: 'Citas Pendientes' // Cambiar aquí
label: 'Citas Confirmadas' // Cambiar aquí
```

## Requisitos

- React 18+
- Chart.js 4.5.1+
- react-chartjs-2
- date-fns 4+
- Tailwind CSS para estilos

## Dependencias Necesarias en package.json

```json
{
  "dependencies": {
    "chart.js": "^4.5.1",
    "react-chartjs-2": "^5.x.x",
    "date-fns": "^4.1.0"
  }
}
```

## Performance

- Carga lazy de datos: solo se cargan citas en el rango visible
- Memoización de cálculos de procesamiento de datos
- Re-render optimizado solo cuando cambia `viewType` o rango de fechas
- Gráficos responsive sin necesidad de redibujado completo

## Troubleshooting

### "Error fetching appointments"
- Verifica que el endpoint `/api/appointments/history` esté implementado
- Comprueba que la sesión de Clerk esté activa
- Revisa la consola del navegador para más detalles

### Gráfico vacío
- Verifica que hay citas en el rango de fechas
- Comprueba que las citas tienen `status` válido ('pending' o 'confirmed')
- Revisa la respuesta del API en Network tab

### Tooltips no aparecen
- Asegúrate de que `Tooltip` esté registrado en ChartJS
- Verifica que los datos no sean undefined

## Ejemplos Adicionales

### Con tipo de gráfico pre-seleccionado

```astro
<AppointmentsChart 
  userId={userId} 
  chartType="bar" 
  defaultView="weekly"
  client:only="react" 
/>
```

### En un dashboard con múltiples gráficos

```astro
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <AppointmentsChart userId={userId} client:only="react" />
  <OtherChart {...props} client:only="react" />
</div>
```

## Mejoras Futuras

- [ ] Exportar datos a CSV/PDF
- [ ] Compartir gráfico por email
- [ ] Integración con calendario visual
- [ ] Análisis de patrones (días más concurridos)
- [ ] Predicciones de disponibilidad
- [ ] Comparativa año a año
- [ ] Filtro por tipo de cita/especialidad
