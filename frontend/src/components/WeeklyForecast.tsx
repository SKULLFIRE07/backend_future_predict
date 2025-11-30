import { TimeSeriesPoint } from '../types';

interface WeeklyForecastProps {
  forecast: TimeSeriesPoint[];
}

interface WeekSummary {
  avgTemp: number;
  minTemp: number;
  maxTemp: number;
  totalPrecipitation: number;
  avgHumidity: number;
  avgWindSpeed: number;
  sunnyDays: number;
  rainyDays: number;
}

export default function WeeklyForecast({ forecast }: WeeklyForecastProps) {
  const temps = forecast.map(f => f.temperature_2m).filter((t): t is number => t !== null);
  const precipitations = forecast.map(f => f.precipitation).filter((p): p is number => p !== null);
  const humidities = forecast.map(f => f.relativehumidity_2m).filter((h): h is number => h !== null);
  const windSpeeds = forecast.map(f => f.wind_speed_10m).filter((w): w is number => w !== null);
  const cloudCovers = forecast.map(f => f.cloudcover).filter((c): c is number => c !== null);

  // Group by day to count sunny/rainy days
  const dayMap = new Map<string, { precipitation: number; cloudCover: number }>();
  forecast.forEach((point) => {
    const dateKey = new Date(point.time).toISOString().split('T')[0];
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, { precipitation: 0, cloudCover: 0 });
    }
    const day = dayMap.get(dateKey)!;
    if (point.precipitation) day.precipitation += point.precipitation;
    if (point.cloudcover) day.cloudCover += point.cloudcover;
  });

  const summary: WeekSummary = {
    avgTemp: temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 0,
    minTemp: temps.length > 0 ? Math.min(...temps) : 0,
    maxTemp: temps.length > 0 ? Math.max(...temps) : 0,
    totalPrecipitation: precipitations.reduce((a, b) => a + b, 0),
    avgHumidity: humidities.length > 0 ? humidities.reduce((a, b) => a + b, 0) / humidities.length : 0,
    avgWindSpeed: windSpeeds.length > 0 ? windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length : 0,
    sunnyDays: Array.from(dayMap.values()).filter(d => d.cloudCover < 50).length,
    rainyDays: Array.from(dayMap.values()).filter(d => d.precipitation > 1).length,
  };

  const statCards = [
    {
      label: 'Average Temperature',
      value: `${summary.avgTemp.toFixed(1)}°C`,
      icon: '🌡️',
      color: 'from-orange-100 to-red-100 border-orange-200',
    },
    {
      label: 'Temperature Range',
      value: `${Math.round(summary.minTemp)}° - ${Math.round(summary.maxTemp)}°`,
      icon: '📊',
      color: 'from-yellow-100 to-orange-100 border-yellow-200',
    },
    {
      label: 'Total Precipitation',
      value: `${summary.totalPrecipitation.toFixed(1)} mm`,
      icon: '🌧️',
      color: 'from-blue-100 to-cyan-100 border-blue-200',
    },
    {
      label: 'Average Humidity',
      value: `${summary.avgHumidity.toFixed(1)}%`,
      icon: '💧',
      color: 'from-cyan-100 to-blue-100 border-cyan-200',
    },
    {
      label: 'Average Wind Speed',
      value: `${summary.avgWindSpeed.toFixed(1)} m/s`,
      icon: '💨',
      color: 'from-gray-100 to-slate-100 border-gray-200',
    },
    {
      label: 'Sunny Days',
      value: `${summary.sunnyDays} days`,
      icon: '☀️',
      color: 'from-yellow-100 to-amber-100 border-yellow-200',
    },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Weekly Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${stat.color} border-2 rounded-xl p-5 hover:scale-105 transition-transform duration-200`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-3xl">{stat.icon}</span>
            </div>
            <div className="text-sm font-medium text-gray-600 mb-1">
              {stat.label}
            </div>
            <div className="text-xl font-bold text-gray-900">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

