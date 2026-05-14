// Exemplos de Personalización - AppointmentsChart
// Este archivo contiene ejemplos de cómo personalizar el componente según necesidades

import type React from 'react';
import AppointmentsChart from './AppointmentsChart';
import AppointmentsQuickSummary from './AppointmentsQuickSummary';

// ============================================================================
// EJEMPLO 1: Configuración Básica (Por defecto)
// ============================================================================

export const BasicExample: React.FC<{ userId: string }> = ({ userId }) => {
  return (
    <AppointmentsChart 
      userId={userId}
      chartType="line"
      defaultView="monthly"
    />
  );
};

// ============================================================================
// EJEMPLO 2: Vista Semanal para Planificación A Corto Plazo
// ============================================================================

export const WeeklyPlanningExample: React.FC<{ userId: string }> = ({ userId }) => {
  return (
    <AppointmentsChart 
      userId={userId}
      chartType="bar"      // Barras son mejores para periodos cortos
      defaultView="weekly"  // Muestra últimas 4 semanas
    />
  );
};

// ============================================================================
// EJEMPLO 3: Vista Anual para Análisis Completo
// ============================================================================

export const YearlyAnalysisExample: React.FC<{ userId: string }> = ({ userId }) => {
  return (
    <AppointmentsChart 
      userId={userId}
      chartType="line"      // Líneas muestran mejor tendencias
      defaultView="monthly"  // Muestra 12 meses
    />
  );
};

// ============================================================================
// EJEMPLO 4: Resumen Rápido para Widgets
// ============================================================================

export const QuickWidgetExample: React.FC<{ userId: string }> = ({ userId }) => {
  return (
    <AppointmentsQuickSummary 
      userId={userId}
      months={6}  // Últimos 6 meses
    />
  );
};

// ============================================================================
// EJEMPLO 5: Dashboard Responsive (Múltiples Vistas)
// ============================================================================

export const ResponsiveDashboardExample: React.FC<{ userId: string }> = ({ userId }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Resumen rápido en columna lateral */}
      <div className="lg:col-span-1">
        <h3 className="text-lg font-bold mb-4">Resumen Rápido</h3>
        <AppointmentsQuickSummary 
          userId={userId}
          months={3}
        />
      </div>

      {/* Gráfico principal */}
      <div className="lg:col-span-2">
        <h3 className="text-lg font-bold mb-4">Análisis Detallado</h3>
        <AppointmentsChart 
          userId={userId}
          chartType="line"
          defaultView="monthly"
        />
      </div>
    </div>
  );
};

// ============================================================================
// EJEMPLO 6: Comparativa Múltiples Usuarios (Requiere componente extendido)
// ============================================================================

/*
export const MultiUserComparisonExample: React.FC<{ userIds: string[] }> = ({ userIds }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {userIds.map(userId => (
        <div key={userId} className="border rounded-lg p-4">
          <h4 className="font-bold mb-3">{userId}</h4>
          <AppointmentsChart 
            userId={userId}
            chartType="bar"
            defaultView="monthly"
          />
        </div>
      ))}
    </div>
  );
};
*/

// ============================================================================
// CONFIGURACIONES RECOMENDADAS POR CASO DE USO
// ============================================================================

export const RECOMMENDED_CONFIGS = {
  // Para pacientes: ver evolución del tratamiento
  PATIENT_VIEW: {
    chartType: 'line' as const,
    defaultView: 'monthly' as const,
    description: 'Muestra tendencias mensuales del tratamiento',
  },

  // Para terapeutas: control de agenda
  THERAPIST_AGENDA: {
    chartType: 'bar' as const,
    defaultView: 'weekly' as const,
    description: 'Control semanal de citas confirmadas y pendientes',
  },

  // Para administradores: análisis de carga
  ADMIN_WORKLOAD: {
    chartType: 'line' as const,
    defaultView: 'monthly' as const,
    description: 'Análisis mensual de carga de trabajo',
  },

  // Para reportes: resumen ejecutivo
  EXECUTIVE_REPORT: {
    chartType: 'bar' as const,
    defaultView: 'monthly' as const,
    description: 'Resumen de últimos 12 meses',
  },

  // Para móvil: consumo de datos mínimo
  MOBILE_OPTIMIZED: {
    chartType: 'line' as const,
    defaultView: 'weekly' as const,
    description: 'Optimizado para dispositivos móviles',
  },
};

// ============================================================================
// VARIACIONES DE COLOR - Necesita modificación en AppointmentsChart.tsx
// ============================================================================

export const COLOR_SCHEMES = {
  // Esquema actual (Naranja/Verde)
  DEFAULT: {
    pending: { border: '#F59E0B', background: '#FCD34D' },
    confirmed: { border: '#10B981', background: '#86EFAC' },
  },

  // Esquema profesional (Azul/Verde)
  PROFESSIONAL: {
    pending: { border: '#3B82F6', background: '#93C5FD' },
    confirmed: { border: '#10B981', background: '#86EFAC' },
  },

  // Esquema corporativo (Rojo/Azul)
  CORPORATE: {
    pending: { border: '#EF4444', background: '#FCA5A5' },
    confirmed: { border: '#006BA6', background: '#5DADE2' },
  },

  // Esquema minimalista (Gris/Negro)
  MINIMALIST: {
    pending: { border: '#9CA3AF', background: '#D1D5DB' },
    confirmed: { border: '#1F2937', background: '#4B5563' },
  },

  // Esquema vibrante
  VIBRANT: {
    pending: { border: '#F97316', background: '#FFEDD5' },
    confirmed: { border: '#06B6D4', background: '#CFFAFE' },
  },
};

// ============================================================================
// PLANTILLAS DE DASHBOARDS
// ============================================================================

/**
 * Dashboard Clínico Completo
 * - Estadísticas de citas
 * - Gráfico de tendencias
 * - Información de próxima cita
 */
export const ClinicalDashboardTemplate: React.FC<{ userId: string }> = ({ userId }) => {
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Dashboard Clínico</h1>
        <p className="text-gray-600">Monitoreo de citas y evolución del tratamiento</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total de Citas</p>
          <p className="text-3xl font-bold text-blue-600">24</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Asistencia</p>
          <p className="text-3xl font-bold text-green-600">95%</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Mejora</p>
          <p className="text-3xl font-bold text-yellow-600">↑ 23%</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Próxima</p>
          <p className="text-lg font-bold text-purple-600">Hoy 3pm</p>
        </div>
      </div>

      {/* Gráfico Principal */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <AppointmentsChart 
          userId={userId}
          chartType="line"
          defaultView="monthly"
        />
      </div>

      {/* Información Adicional */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4">Patrones de Asistencia</h3>
          <ul className="space-y-2 text-sm">
            <li>📅 Día más concurrido: Martes (87% asistencia)</li>
            <li>🕐 Hora preferida: 3pm (92% asistencia)</li>
            <li>📈 Tendencia: En aumento</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4">Recomendaciones</h3>
          <ul className="space-y-2 text-sm">
            <li>✅ Mantener consistencia de asistencia</li>
            <li>⏰ Confirmar citas con 24 horas de anticipación</li>
            <li>📝 Completar formularios previos a la cita</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

/**
 * Dashboard Simple (Para móvil)
 */
export const SimpleMobileDashboard: React.FC<{ userId: string }> = ({ userId }) => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Mis Citas</h1>
      <AppointmentsQuickSummary 
        userId={userId}
        months={3}
      />
      <button className="w-full bg-indigo-600 text-white py-2 rounded-lg">
        Agendar Nueva Cita
      </button>
    </div>
  );
};

// ============================================================================
// CONFIGURACIÓN POR VIEWPORT
// ============================================================================

export const ResponsiveConfiguration = {
  MOBILE: {
    chartType: 'line' as const,
    defaultView: 'weekly' as const,
    containerHeight: 'h-64',
  },
  TABLET: {
    chartType: 'bar' as const,
    defaultView: 'weekly' as const,
    containerHeight: 'h-80',
  },
  DESKTOP: {
    chartType: 'line' as const,
    defaultView: 'monthly' as const,
    containerHeight: 'h-96',
  },
};

// ============================================================================
// PERFORMANCE OPTIMIZATION TIPS
// ============================================================================

export const PERFORMANCE_TIPS = [
  '1. Usa client:idle para carga diferida',
  '2. Implementa React.memo para evitar re-renders',
  '3. Usa useCallback para event handlers',
  '4. Implementa paginación para datos grandes',
  '5. Cachea respuestas del API',
  '6. Usa imagen estática mientras carga',
  '7. Considera virtual scrolling para listas grandes',
];

// ============================================================================
// EXPORTAR CONFIGURACIONES
// ============================================================================

export default {
  BasicExample,
  WeeklyPlanningExample,
  YearlyAnalysisExample,
  QuickWidgetExample,
  ResponsiveDashboardExample,
  ClinicalDashboardTemplate,
  SimpleMobileDashboard,
  RECOMMENDED_CONFIGS,
  COLOR_SCHEMES,
  ResponsiveConfiguration,
  PERFORMANCE_TIPS,
};
