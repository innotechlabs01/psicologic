import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import React, { useEffect, useState } from 'react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AgendaEvent } from '../../lib/turso/agenda/agenda-db';

type ViewType = 'daily' | 'weekly' | 'monthly';
type ChartType = 'line' | 'bar';

interface ChartDataPoint {
  date: string;
  pending: number;
  confirmed: number;
}

interface Props {
  userId: string;
  chartType?: ChartType;
  defaultView?: ViewType;
  initialData?: AgendaEvent[];
}

export const AppointmentsChart: React.FC<Props> = ({
  userId,
  chartType = 'line',
  defaultView = 'monthly',
  initialData,
}) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [allAppointments, setAllAppointments] = useState<AgendaEvent[]>(initialData || []);
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(!initialData);
  const [viewType, setViewType] = useState<ViewType>(defaultView);
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [selectedChartType, setSelectedChartType] = useState<ChartType>(chartType);

  // Register Chart.js plugins
  useEffect(() => {
    ChartJS.register(
      LineElement,
      BarElement,
      PointElement,
      LinearScale,
      Title,
      CategoryScale,
      Tooltip,
      Legend,
      Filler
    );
    setIsRegistered(true);
  }, []);

  // Fetch and process appointment data
  useEffect(() => {
    if (!isRegistered) return;

    const processData = () => {
      console.log('[Chart] Processing appointments:', allAppointments.length);
      // Process data based on view type
      const chartData = processAppointmentsData(allAppointments, viewType, startDate, endDate);
      setData(chartData);
      setLoading(false);
    };

    // Si tenemos datos iniciales, procesarlos
    if (allAppointments.length > 0) {
      console.log('[Chart] Using initial data:', allAppointments.length);
      processData();
      return;
    }

    // Si no tenemos datos iniciales, hacer fetch
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const startFormatted = format(startDate, 'yyyy-MM-dd');
        const endFormatted = format(endDate, 'yyyy-MM-dd');
        const url = `/api/appointments/history?startDate=${startFormatted}&endDate=${endFormatted}`;
        
        console.log('[Chart] Fetching appointments:', { startFormatted, endFormatted });
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Chart] API Error:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
            url,
          });
          setData([]);
          setLoading(false);
          return;
        }

        const appointments: AgendaEvent[] = await response.json();
        console.log('[Chart] Appointments fetched:', appointments.length);
        setAllAppointments(appointments);

        // Process data based on view type
        const chartData = processAppointmentsData(appointments, viewType, startDate, endDate);
        setData(chartData);
      } catch (error) {
        console.error('[Chart] Error fetching appointments:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [isRegistered, viewType, startDate, endDate]);

  // Process appointments into chart data
  const processAppointmentsData = (
    appointments: AgendaEvent[],
    view: ViewType,
    start: Date,
    end: Date
  ): ChartDataPoint[] => {
    let intervals: Date[] = [];

    switch (view) {
      case 'daily':
        intervals = eachDayOfInterval({ start, end });
        break;
      case 'weekly':
        intervals = eachWeekOfInterval(
          { start, end },
          { weekStartsOn: 1 }
        ).map(d => startOfWeek(d, { weekStartsOn: 1 }));
        // Remove duplicates
        intervals = [...new Set(intervals.map(d => d.getTime()))].map(t => new Date(t));
        break;
      case 'monthly':
        intervals = eachMonthOfInterval({ start, end });
        break;
    }

    return intervals.map(date => {
      const dayStart = startOfDay(date);
      let dayEnd: Date;

      switch (view) {
        case 'daily':
          dayEnd = endOfDay(date);
          break;
        case 'weekly':
          dayEnd = endOfWeek(date, { weekStartsOn: 1 });
          break;
        case 'monthly':
          dayEnd = endOfMonth(date);
          break;
      }

      const periodAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= dayStart && aptDate <= dayEnd;
      });

      return {
        date: formatDateLabel(date, view),
        pending: periodAppointments.filter(apt => apt.status === 'pending').length,
        confirmed: periodAppointments.filter(apt => apt.status === 'confirmed').length,
      };
    });
  };

  // Format date label based on view
  const formatDateLabel = (date: Date, view: ViewType): string => {
    switch (view) {
      case 'daily':
        return format(date, 'dd MMM', { locale: es });
      case 'weekly':
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        return `${format(date, 'dd')} - ${format(weekEnd, 'dd MMM')}`;
      case 'monthly':
        return format(date, 'MMM yyyy', { locale: es });
    }
  };

  // Handle date range changes
  const handlePreviousPeriod = () => {
    let newStart: Date;
    let newEnd: Date;

    switch (viewType) {
      case 'daily':
        newStart = addDays(startDate, -7);
        newEnd = addDays(endDate, -7);
        break;
      case 'weekly':
        newStart = addWeeks(startDate, -4);
        newEnd = addWeeks(endDate, -4);
        break;
      case 'monthly':
        newStart = addMonths(startDate, -12);
        newEnd = addMonths(endDate, -12);
        break;
    }

    setStartDate(newStart);
    setEndDate(newEnd);
  };

  const handleNextPeriod = () => {
    let newStart: Date;
    let newEnd: Date;
    const now = new Date();

    switch (viewType) {
      case 'daily':
        newStart = addDays(startDate, 7);
        newEnd = addDays(endDate, 7);
        break;
      case 'weekly':
        newStart = addWeeks(startDate, 4);
        newEnd = addWeeks(endDate, 4);
        break;
      case 'monthly':
        newStart = addMonths(startDate, 12);
        newEnd = addMonths(endDate, 12);
        break;
    }

    // Don't go beyond current date for future periods
    if (newStart <= now) {
      setStartDate(newStart);
      setEndDate(newEnd > now ? now : newEnd);
    }
  };

  const handleViewChange = (newView: ViewType) => {
    setViewType(newView);
    const now = new Date();

    switch (newView) {
      case 'daily':
        setStartDate(addDays(now, -7));
        setEndDate(now);
        break;
      case 'weekly':
        setStartDate(startOfWeek(addMonths(now, -3), { weekStartsOn: 1 }));
        setEndDate(endOfWeek(now, { weekStartsOn: 1 }));
        break;
      case 'monthly':
        setStartDate(startOfMonth(addMonths(now, -11)));
        setEndDate(endOfMonth(now));
        break;
    }
  };

  if (!isRegistered || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Cargando datos de citas...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartLabels = data.map(d => d.date);
  const pendingData = data.map(d => d.pending);
  const confirmedData = data.map(d => d.confirmed);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Citas Pendientes',
        data: pendingData,
        borderColor: '#F59E0B',
        backgroundColor: selectedChartType === 'bar' ? '#FCD34D' : 'rgba(245, 158, 11, 0.1)',
        fill: selectedChartType === 'line',
        tension: 0.4,
        pointBackgroundColor: '#F59E0B',
        pointBorderColor: '#FFFFFF',
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2,
      },
      {
        label: 'Citas Confirmadas',
        data: confirmedData,
        borderColor: '#10B981',
        backgroundColor: selectedChartType === 'bar' ? '#86EFAC' : 'rgba(16, 185, 129, 0.1)',
        fill: selectedChartType === 'line',
        tension: 0.4,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#FFFFFF',
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          color: '#374151',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 12,
        },
        borderColor: '#e5e7eb',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: ${context.parsed.y} citas`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
          },
          color: '#6B7280',
        },
        grid: {
          color: '#E5E7EB',
          drawBorder: false,
        },
        title: {
          display: true,
          text: 'Cantidad de Citas',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: 11,
          },
          color: '#6B7280',
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          display: false,
          drawBorder: false,
        },
      },
    },
  };

  const totalPending = pendingData.reduce((a, b) => a + b, 0);
  const totalConfirmed = confirmedData.reduce((a, b) => a + b, 0);

  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Historial de Citas Médicas</h2>
        <p className="text-gray-600 text-sm mt-1">Evolución de citas por período</p>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
        {/* View Type Buttons */}
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as ViewType[]).map(view => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewType === view
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {view === 'daily' ? 'Semanal' : view === 'weekly' ? 'Mensual' : 'Anual'}
            </button>
          ))}
        </div>

        {/* Chart Type Buttons */}
        <div className="flex gap-2">
          {(['line', 'bar'] as ChartType[]).map(type => (
            <button
              key={type}
              onClick={() => setSelectedChartType(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedChartType === type
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {type === 'line' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Línea
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Barras
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation and Date Range */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
        <button
          onClick={handlePreviousPeriod}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
        >
          ← Anterior
        </button>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {format(startDate, 'dd MMMM yyyy', { locale: es })} - {format(endDate, 'dd MMMM yyyy', { locale: es })}
          </p>
        </div>
        <button
          onClick={handleNextPeriod}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
        >
          Siguiente →
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-400">
          <p className="text-amber-600 text-sm font-medium">Citas Pendientes</p>
          <p className="text-3xl font-bold text-amber-700 mt-1">{totalPending}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
          <p className="text-green-600 text-sm font-medium">Citas Confirmadas</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{totalConfirmed}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-96 mb-6">
        {selectedChartType === 'line' ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No hay citas en este período</p>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
        <p>💡 Pasa el cursor sobre el gráfico para ver los detalles de cada período.</p>
      </div>
    </div>
  );
};

export default AppointmentsChart;
