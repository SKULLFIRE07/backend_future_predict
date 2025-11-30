import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeSeriesPoint } from '../types';

interface WeatherChartProps {
  historical: TimeSeriesPoint[];
  apiForecast: TimeSeriesPoint[];
  mlForecast: TimeSeriesPoint[];
  blendedForecast: TimeSeriesPoint[];
  metric: 'temperature_2m' | 'shortwave_radiation' | 'wind_speed_10m';
}

export default function WeatherChart({
  historical,
  apiForecast,
  mlForecast,
  blendedForecast,
  metric,
}: WeatherChartProps) {
  const data = useMemo(() => {
    const result: any[] = [];

    // Add historical data
    historical.forEach((point) => {
      const time = new Date(point.time);
      result.push({
        time: time.toLocaleString(),
        timestamp: time.getTime(),
        Historical: point[metric] ?? null,
        'API Forecast': null,
        'ML Forecast': null,
        'Blended Forecast': null,
      });
    });

    // Add forecast data (all have same timestamps)
    const forecastLength = Math.min(apiForecast.length, blendedForecast.length);
    for (let i = 0; i < forecastLength; i++) {
      const apiPoint = apiForecast[i];
      const mlPoint = mlForecast[i];
      const blendedPoint = blendedForecast[i];

      const time = new Date(apiPoint.time);
      result.push({
        time: time.toLocaleString(),
        timestamp: time.getTime(),
        Historical: null,
        'API Forecast': apiPoint[metric] ?? null,
        'ML Forecast': mlPoint?.[metric] ?? null,
        'Blended Forecast': blendedPoint[metric] ?? null,
      });
    }

    return result.sort((a, b) => a.timestamp - b.timestamp);
  }, [historical, apiForecast, mlForecast, blendedForecast, metric]);

  const getMetricLabel = () => {
    switch (metric) {
      case 'temperature_2m':
        return 'Temperature (°C)';
      case 'shortwave_radiation':
        return 'Solar Radiation (W/m²)';
      case 'wind_speed_10m':
        return 'Wind Speed (m/s)';
      default:
        return metric;
    }
  };

  const getMetricColor = () => {
    switch (metric) {
      case 'temperature_2m':
        return { primary: '#f97316', secondary: '#ef4444' };
      case 'shortwave_radiation':
        return { primary: '#eab308', secondary: '#f59e0b' };
      case 'wind_speed_10m':
        return { primary: '#3b82f6', secondary: '#06b6d4' };
      default:
        return { primary: '#6366f1', secondary: '#8b5cf6' };
    }
  };

  const colors = getMetricColor();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg bg-gradient-to-br from-${metric === 'temperature_2m' ? 'orange' : metric === 'shortwave_radiation' ? 'yellow' : 'blue'}-100`}>
          <svg className={`w-6 h-6 text-${metric === 'temperature_2m' ? 'orange' : metric === 'shortwave_radiation' ? 'yellow' : 'blue'}-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800">{getMetricLabel()}</h3>
      </div>
      
      <ResponsiveContainer width="100%" height={450}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            angle={-45}
            textAnchor="end"
            height={80}
            stroke="#9ca3af"
          />
          <YAxis 
            label={{ value: getMetricLabel(), angle: -90, position: 'insideLeft', style: { fill: '#4b5563' } }}
            stroke="#9ca3af"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '10px'
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line
            type="monotone"
            dataKey="Historical"
            stroke="#94a3b8"
            strokeWidth={1.5}
            dot={false}
            connectNulls={false}
            name="Historical"
          />
          <Line
            type="monotone"
            dataKey="API Forecast"
            stroke="#3b82f6"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            name="API Forecast"
          />
          <Line
            type="monotone"
            dataKey="ML Forecast"
            stroke="#10b981"
            strokeWidth={1.5}
            dot={false}
            connectNulls={false}
            name="ML Forecast"
          />
          <Line
            type="monotone"
            dataKey="Blended Forecast"
            stroke={colors.primary}
            strokeWidth={3}
            dot={false}
            connectNulls={false}
            name="Blended Forecast (Best)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
