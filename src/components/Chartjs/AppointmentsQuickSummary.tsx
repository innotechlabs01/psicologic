import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import React, { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, eachMonthOfInterval } from 'date-fns';
import type { AgendaEvent } from '../../lib/turso/agenda/agenda-db';

interface Props {
  userId: string;
  months?: number;
}

export const AppointmentsQuickSummary: React.FC<Props> = ({
  userId,
  months = 12,
}) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [data, setData] = useState<Array<{ date: string; pending: number; confirmed: number }>>([]);
  const [loading, setLoading] = useState(true);

  // Register Chart.js plugins
  useEffect(() => {
    ChartJS.register(
      LineElement,
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

  // Fetch appointments
  useEffect(() => {
    if (!isRegistered) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const startDate = addMonths(startOfMonth(now), -months + 1);
        const endDate = endOfMonth(now);

        const response = await fetch(
          `/api/appointments/history?userId=${userId}&startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
        );
        const appointments: AgendaEvent[] = await response.json();

        // Group by month
        const monthIntervals = eachMonthOfInterval({ start: startDate, end: endDate });
        const chartData = monthIntervals.map(date => {
          const monthStart = startOfMonth(date);
          const monthEnd = endOfMonth(date);

          const periodAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate >= monthStart && aptDate <= monthEnd;
          });

          return {
            date: format(date, 'MMM'),
            pending: periodAppointments.filter(apt => apt.status === 'pending').length,
            confirmed: periodAppointments.filter(apt => apt.status === 'confirmed').length,
          };
        });

        setData(chartData);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isRegistered, userId, months]);

  if (!isRegistered || loading) {
    return (
      <div className="bg-white rounded-lg p-4 h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const chartLabels = data.map(d => d.date);
  const pendingData = data.map(d => d.pending);
  const confirmedData = data.map(d => d.confirmed);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Pendientes',
        data: pendingData,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
      {
        label: 'Confirmadas',
        data: confirmedData,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
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
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 10,
          font: { size: 10 },
          color: '#6B7280',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 8,
        titleFont: { size: 11 },
        bodyFont: { size: 10 },
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 10 },
          color: '#6B7280',
        },
        grid: { color: '#E5E7EB', drawBorder: false },
      },
      x: {
        ticks: {
          font: { size: 10 },
          color: '#6B7280',
        },
        grid: { display: false },
      },
    },
  };

  const totalPending = pendingData.reduce((a, b) => a + b, 0);
  const totalConfirmed = confirmedData.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="font-semibold text-gray-800 mb-4">Resumen de Citas (Últimos {months} meses)</h3>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-amber-50 rounded p-3 border-l-2 border-amber-400">
          <p className="text-xs text-amber-600">Pendientes</p>
          <p className="text-2xl font-bold text-amber-700">{totalPending}</p>
        </div>
        <div className="bg-green-50 rounded p-3 border-l-2 border-green-400">
          <p className="text-xs text-green-600">Confirmadas</p>
          <p className="text-2xl font-bold text-green-700">{totalConfirmed}</p>
        </div>
      </div>

      <div className="h-48">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default AppointmentsQuickSummary;
