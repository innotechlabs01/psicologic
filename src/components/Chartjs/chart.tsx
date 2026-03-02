import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  type ChartData,
  Tooltip,
} from 'chart.js';
import React, { useEffect, useState, useRef } from 'react';

export const MyLine = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && !isRegistered) {
      ChartJS.register(
        LineElement,
        PointElement,
        LinearScale,
        Title,
        CategoryScale,
        Tooltip
      );
      setIsRegistered(true);
    }
  }, [isVisible, isRegistered]);

  if (!isVisible) {
    return (
      <div ref={chartRef} className="h-[300px] flex items-center justify-center">
        <div className="animate-pulse bg-muted h-full w-full rounded-lg" />
      </div>
    );
  }

  if (!isRegistered) return null;

  return (
    <div ref={chartRef}>
      <Line
        data={{
          labels: [1500, 1600, 1700, 1750, 1800, 1850, 1900, 1950, 1999, 2050],
          datasets: [
            {
              data: [86, 114, 106, 106, 107, 111, 133, 221, 783, 2478],
              label: 'Africa',
              borderColor: '#007BFF',
              fill: false,
            },
            {
              data: [282, 350, 411, 502, 635, 809, 947, 1402, 3700, 5267],
              label: 'Asia',
              borderColor: '#8A2BE2',
              fill: false,
            },
            {
              data: [168, 170, 178, 190, 203, 276, 408, 547, 675, 734],
              label: 'Europe',
              borderColor: '#3cba9f',
              fill: false,
            },
            {
              data: [40, 20, 10, 16, 24, 38, 74, 167, 508, 784],
              label: 'Latin America',
              borderColor: '#e8c3b9',
              fill: false,
            },
            {
              data: [6, 3, 2, 2, 7, 26, 82, 172, 312, 433],
              label: 'North America',
              borderColor: '#c45850',
              fill: false,
            },
          ],
        }}
        options={{ responsive: true, maintainAspectRatio: false }}
      />
    </div>
  );
};
