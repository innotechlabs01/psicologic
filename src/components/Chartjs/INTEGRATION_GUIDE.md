# Guía de Integración - Gráficos de Citas

Esta guía proporciona ejemplos de cómo integrar los componentes de gráficos de citas en diferentes secciones del dashboard clínico.

## Componentes Disponibles

### 1. AppointmentsChart (Completo)
- Vista completa con múltiples opciones
- Cambio entre gráficos de línea y barras
- Filtrado por rango de fechas
- Vistas diaria, semanal y mensual
- **Uso**: Página principal del cliente, panel de análisis

### 2. AppointmentsQuickSummary (Compacto)
- Resumen visual rápido
- Gráfico de línea simple
- Último período seleccionable
- **Uso**: Widgets, sidebars, dashboards secundarios

---

## Ejemplos de Integración

### Ejemplo 1: Página Principal del Cliente

**Archivo**: `src/pages/client.astro`

```astro
---
import AppointmentsChart from "../components/Chartjs/AppointmentsChart";

const { userId } = Astro.locals.auth();
---

<div class="dashboard-container">
  <!-- Contenido existente... -->
  
  <!-- Gráfico de análisis de citas -->
  {userId && (
    <section class="my-8">
      <AppointmentsChart 
        userId={userId}
        chartType="line"
        defaultView="monthly"
        client:only="react"
      />
    </section>
  )}
</div>
```

### Ejemplo 2: Dashboard para Administradores

Para dashboards administrativos, se puede crear una versión que muestre citas de múltiples usuarios:

```astro
---
// src/pages/admin/appointments-report.astro
import AppointmentsChart from "../../components/Chartjs/AppointmentsChart";

const therapistId = Astro.params.therapistId;
---

<div class="admin-dashboard">
  <h1>Reporte de Citas - {therapistId}</h1>
  
  <AppointmentsChart 
    userId={therapistId}
    chartType="bar"
    defaultView="weekly"
    client:only="react"
  />
</div>
```

### Ejemplo 3: Widget en Sidebar

**Archivo**: `src/components/Sidebar/AppointmentsSummary.astro`

```astro
---
// Para pequeños espacios, usar el resumen rápido
import AppointmentsQuickSummary from "../Chartjs/AppointmentsQuickSummary";

const userId = Astro.locals.auth().userId;
---

<aside class="sidebar-widget">
  <AppointmentsQuickSummary 
    userId={userId}
    months={3}
    client:only="react"
  />
</aside>
```

### Ejemplo 4: En un Layout Responsive

```astro
---
// src/layouts/AnalyticsLayout.astro
import AppointmentsChart from "../components/Chartjs/AppointmentsChart";
import AppointmentsQuickSummary from "../components/Chartjs/AppointmentsQuickSummary";

const { userId } = Astro.locals.auth();
---

<div class="analytics-grid">
  <!-- Resumen rápido en móvil -->
  <div class="hidden md:block md:col-span-1">
    <AppointmentsQuickSummary 
      userId={userId}
      months={6}
      client:only="react"
    />
  </div>

  <!-- Gráfico completo -->
  <div class="md:col-span-2">
    <AppointmentsChart 
      userId={userId}
      chartType="line"
      defaultView="monthly"
      client:only="react"
    />
  </div>
</div>
```

---

## Casos de Uso Recomendados

### Para Pacientes

1. **Vista Mensual (Por defecto)**
   - Muestra tendencias a largo plazo
   - Ideal para ver evolución de tratamiento
   
2. **Vista Semanal**
   - Planificación a corto plazo
   - Mejor visualización de semana por semana

### Para Terapeutas

1. **Vista Diaria**
   - Control de agenda semanal
   - Visualización de slots disponibles
   
2. **Vista Anual**
   - Análisis de carga de trabajo
   - Tendencias de demanda

### Para Administradores

1. **Múltiples Gráficos**
   - Uno por terapeuta
   - Comparativas de métricas
   
2. **Exportación de Datos**
   - Para reportes
   - Análisis de negocio

---

## Configuración por Rol

### Paciente

```tsx
<AppointmentsChart 
  userId={userId}
  chartType="line"
  defaultView="monthly"
/>
```

### Terapeuta

```tsx
<AppointmentsChart 
  userId={userId}
  chartType="bar"
  defaultView="weekly"
/>
```

### Administrador

```tsx
// Necesitaría una versión especial que acepte múltiples usuarios
<AdminAppointmentsChart 
  userIds={therapistIds}
  chartType="bar"
  defaultView="monthly"
  showComparison={true}
/>
```

---

## Personalizaciones Comunes

### 1. Cambiar Rango de Fechas Inicial

Edita el `defaultView` en AppointmentsChart:

```tsx
// Para 3 meses
defaultView="weekly"  // Muestra 4 semanas (1 mes)

// Para 1 año
defaultView="monthly"  // Muestra 12 meses
```

### 2. Cambiar Tipo de Gráfico por Defecto

```tsx
// Gráfico de barras
chartType="bar"

// Gráfico de línea
chartType="line"
```

### 3. Colores Personalizados

En `AppointmentsChart.tsx`, busca:

```typescript
// Citas Pendientes - Cambiar naranja por otro color
borderColor: '#F59E0B',
backgroundColor: '#FCD34D',

// Citas Confirmadas - Cambiar verde por otro color
borderColor: '#10B981',
backgroundColor: '#86EFAC',
```

Colores sugeridos por estado:
- **Pendientes**: Naranja (#F59E0B), Amarillo (#EAB308), Azul (#3B82F6)
- **Confirmadas**: Verde (#10B981), Teal (#14B8A6), Púrpura (#A855F7)

### 4. Añadir más Categorías

Para agregar estado 'cancelled':

```typescript
{
  label: 'Citas Canceladas',
  data: data.map(d => cancelledData),
  borderColor: '#EF4444',
  // ...
}
```

### 5. Cambiar Idioma

Reemplaza en `AppointmentsChart.tsx`:

```typescript
import { en } from 'date-fns/locale';  // Inglés
import { es } from 'date-fns/locale';  // Español (actual)
import { fr } from 'date-fns/locale';  // Francés
```

Y actualiza las etiquetas:

```typescript
label: 'Pending Appointments'    // En lugar de 'Citas Pendientes'
label: 'Confirmed Appointments'  // En lugar de 'Citas Confirmadas'
```

---

## Optimización de Performance

### Lazy Loading

```astro
<AppointmentsChart 
  userId={userId}
  client:idle  <!-- Carga cuando el navegador está ocioso -->
/>
```

### Carga en Viewport

```astro
<AppointmentsChart 
  userId={userId}
  client:visible  <!-- Carga cuando es visible -->
/>
```

### Carga Inmediata (Por defecto)

```astro
<AppointmentsChart 
  userId={userId}
  client:only="react"  <!-- Carga inmediatamente -->
/>
```

---

## Manejo de Errores

### En el componente

El componente ya maneja errores internamente:

```typescript
catch (error) {
  console.error('Error fetching appointments:', error);
  setData([]);  // Mostrar gráfico vacío
}
```

### Con TRY-CATCH en la página

```astro
---
try {
  const userId = Astro.locals.auth().userId;
  // Validaciones...
} catch (error) {
  console.error('Auth error:', error);
}
-->
```

### Mostrar Estado de Error

```astro
---
import AppointmentsChart from "../components/Chartjs/AppointmentsChart";

let userId: string | null = null;
let authError = false;

try {
  userId = Astro.locals.auth().userId;
} catch (error) {
  authError = true;
}
---

{authError && (
  <div class="error-banner">
    Error loading appointments
  </div>
)}

{userId && !authError && (
  <AppointmentsChart userId={userId} client:only="react" />
)}
```

---

## Testing

### Unit Tests

```typescript
// AppointmentsChart.test.tsx
import { render, screen } from '@testing-library/react';
import AppointmentsChart from './AppointmentsChart';

describe('AppointmentsChart', () => {
  it('renders loading state', () => {
    render(<AppointmentsChart userId="test-user" />);
    expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
  });

  it('renders chart when data loads', async () => {
    // Mock fetch...
    render(<AppointmentsChart userId="test-user" />);
    // Assertions...
  });
});
```

---

## Troubleshooting Común

| Problema | Solución |
|----------|----------|
| Gráfico no muestra datos | Verifica que el endpoint API devuelva datos válidos |
| Colores no cambian | Busca todas las referencias a colores en el componente |
| No responde a clics | Asegúrate que `client:only="react"` esté presente |
| Datos de otro usuario | Verifica seguridad en el endpoint API |
| Gráfico cortado | Aumenta la altura del contenedor `.h-96` |

---

## Próximos Pasos

1. ✅ Integrar en `client.astro`
2. ✅ Crear endpoint API `/api/appointments/history`
3. ⬜ Añadir más tipos de gráficos (scatter, area)
4. ⬜ Implementar exportación a PDF
5. ⬜ Agregar análisis estadístico
6. ⬜ Crear versión para admin
7. ⬜ Implementar caché de datos

