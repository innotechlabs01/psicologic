// types.ts - Tipos TypeScript para AppointmentsChart

import type { ChartOptions, TooltipItem } from 'chart.js';

/**
 * Tipo de vista temporal para el gráfico
 */
export type ViewType = 'daily' | 'weekly' | 'monthly';

/**
 * Tipo de gráfico
 */
export type ChartType = 'line' | 'bar';

/**
 * Estado de una cita médica
 */
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

/**
 * Propiedades del componente AppointmentsChart
 */
export interface AppointmentsChartProps {
  /** ID del usuario propietario de las citas */
  userId: string;

  /** Tipo de gráfico a mostrar ('line' o 'bar') */
  chartType?: ChartType;

  /** Vista temporal inicial ('daily', 'weekly', 'monthly') */
  defaultView?: ViewType;
}

/**
 * Propiedades del componente AppointmentsQuickSummary
 */
export interface AppointmentsQuickSummaryProps {
  /** ID del usuario propietario de las citas */
  userId: string;

  /** Número de meses a mostrar (default: 12) */
  months?: number;
}

/**
 * Estructura de datos de una cita médica
 */
export interface AgendaEvent {
  /** ID único de la cita */
  id: string;

  /** Título o descripción de la cita */
  title: string;

  /** Fecha de la cita (formato: YYYY-MM-DD) */
  date: string;

  /** Hora de inicio (formato: HH:MM) */
  startTime: string;

  /** Hora de fin (formato: HH:MM) */
  endTime: string;

  /** Estado actual de la cita */
  status: AppointmentStatus;

  /** Link de reunión (si aplica) */
  meetingLink?: string;

  /** Token seguro para acceso a la reunión */
  secureToken?: string;

  /** ID del usuario propietario */
  userId: string;

  /** Participantes de la cita */
  participants?: any;

  /** Fecha de creación */
  created_at?: string;

  /** Fecha de última actualización */
  updated_at?: string;
}

/**
 * Punto de datos para el gráfico
 */
export interface ChartDataPoint {
  /** Etiqueta de fecha/período */
  date: string;

  /** Cantidad de citas pendientes */
  pending: number;

  /** Cantidad de citas confirmadas */
  confirmed: number;
}

/**
 * Respuesta del endpoint /api/appointments/history
 */
export interface AppointmentsHistoryResponse extends Array<AgendaEvent> {}

/**
 * Opciones del endpoint
 */
export interface FetchOptions {
  /** ID del usuario */
  userId: string;

  /** Fecha inicio (YYYY-MM-DD) */
  startDate: string;

  /** Fecha fin (YYYY-MM-DD) */
  endDate: string;
}

/**
 * Códigos de error del API
 */
export enum ApiErrorCode {
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  BAD_REQUEST = 400,
  INTERNAL_ERROR = 500,
}

/**
 * Colores para el esquema del gráfico
 */
export interface ColorScheme {
  pending: {
    border: string;
    background: string;
  };
  confirmed: {
    border: string;
    background: string;
  };
}

/**
 * Configuración de Chart.js para tooltips
 */
export type TooltipCallback = (items: TooltipItem<'line' | 'bar'>[]) => string;

/**
 * Validador de tipos para ViewType
 */
export function isValidViewType(view: unknown): view is ViewType {
  return view === 'daily' || view === 'weekly' || view === 'monthly';
}

/**
 * Validador de tipos para ChartType
 */
export function isValidChartType(type: unknown): type is ChartType {
  return type === 'line' || type === 'bar';
}

/**
 * Validador de tipos para AppointmentStatus
 */
export function isValidStatus(status: unknown): status is AppointmentStatus {
  return (
    status === 'pending' ||
    status === 'confirmed' ||
    status === 'cancelled' ||
    status === 'completed'
  );
}

/**
 * Validador de evento de agenda
 */
export function isValidAgendaEvent(obj: unknown): obj is AgendaEvent {
  if (!obj || typeof obj !== 'object') return false;

  const event = obj as Record<string, unknown>;

  return (
    typeof event.id === 'string' &&
    typeof event.title === 'string' &&
    typeof event.date === 'string' &&
    typeof event.startTime === 'string' &&
    typeof event.endTime === 'string' &&
    isValidStatus(event.status) &&
    typeof event.userId === 'string'
  );
}

/**
 * Validador de opciones de fetch
 */
export function isValidFetchOptions(obj: unknown): obj is FetchOptions {
  if (!obj || typeof obj !== 'object') return false;

  const opts = obj as Record<string, unknown>;

  return (
    typeof opts.userId === 'string' &&
    typeof opts.startDate === 'string' &&
    typeof opts.endDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(opts.startDate as string) &&
    /^\d{4}-\d{2}-\d{2}$/.test(opts.endDate as string)
  );
}

/**
 * Utilidades para formato de fecha
 */
export const DateFormatPatterns = {
  ISO_DATE: 'yyyy-MM-dd',
  TIME_24H: 'HH:mm',
  DISPLAY_FULL: 'EEEE, dd MMMM yyyy',
  DISPLAY_SHORT: 'dd MMM',
  DISPLAY_MONTH: 'MMM yyyy',
} as const;

/**
 * Constantes de límites
 */
export const LIMITS = {
  MIN_RANGE_DAYS: 1,
  MAX_RANGE_DAYS: 365,
  MAX_DATA_POINTS: 100,
  API_TIMEOUT_MS: 10000,
} as const;

/**
 * Mensajes de error comunes
 */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'No autorizado. Por favor inicia sesión.',
  FORBIDDEN: 'No tienes permiso para ver estas citas.',
  BAD_REQUEST: 'Solicitud inválida. Verifica los parámetros.',
  INTERNAL_ERROR: 'Error en el servidor. Intenta más tarde.',
  FETCH_ERROR: 'Error al obtener las citas.',
  INVALID_DATE: 'Formato de fecha inválido.',
  INVALID_USER_ID: 'ID de usuario inválido.',
} as const;

/**
 * Configuración por defecto del gráfico
 */
export const DEFAULT_CONFIG = {
  chartType: 'line' as ChartType,
  defaultView: 'monthly' as ViewType,
  months: 12,
  containerHeight: 'h-96',
  colors: {
    pending: {
      border: '#F59E0B',
      background: 'rgba(245, 158, 11, 0.1)',
    },
    confirmed: {
      border: '#10B981',
      background: 'rgba(16, 185, 129, 0.1)',
    },
  },
} as const;

/**
 * Etiquetas en español
 */
export const LABELS_ES = {
  TITLE: 'Historial de Citas Médicas',
  SUBTITLE: 'Evolución de citas por período',
  PENDING: 'Citas Pendientes',
  CONFIRMED: 'Citas Confirmadas',
  CANCELLED: 'Citas Canceladas',
  COMPLETED: 'Citas Completadas',
  PREVIOUS: '← Anterior',
  NEXT: 'Siguiente →',
  LOADING: 'Cargando datos de citas...',
  NO_DATA: 'No hay citas en este período',
  VIEW_DAILY: 'Semanal',
  VIEW_WEEKLY: 'Mensual',
  VIEW_MONTHLY: 'Anual',
  CHART_LINE: 'Línea',
  CHART_BAR: 'Barras',
} as const;

/**
 * Hooks recomendados para usar con el componente
 */
export interface UseAppointmentsOptions {
  userId: string;
  startDate: Date;
  endDate: Date;
}

export interface UseAppointmentsReturn {
  data: AgendaEvent[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}
