import { TimeSeriesPoint } from '../types';

interface HourlyForecastProps {
  forecast: TimeSeriesPoint[];
  hours?: number;
}

export default function HourlyForecast({ forecast, hours = 24 }: HourlyForecastProps) {
  const hourlyData = forecast.slice(0, hours).map((point, index) => {
    const date = new Date(point.time);
    return {
      time: date,
      hour: date.getHours(),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      temperature: point.temperature_2m,
      humidity: point.relativehumidity_2m,
      windSpeed: point.wind_speed_10m,
      precipitation: point.precipitation,
      cloudCover: point.cloudcover,
      radiation: point.shortwave_radiation,
    };
  });

  const getWeatherIcon = (temp: number | null, cloudCover: number | null, hour: number) => {
    if (!temp) return '🌤️';
    const isDay = hour >= 6 && hour < 20;
    
    if (cloudCover && cloudCover > 80) return '☁️';
    if (cloudCover && cloudCover > 50) return '⛅';
    if (temp > 30) return isDay ? '☀️' : '🌙';
    if (temp > 20) return isDay ? '🌤️' : '🌙';
    return isDay ? '🌥️' : '🌙';
  };

  const getTempColor = (temp: number | null) => {
    if (!temp) return 'text-gray-400';
    if (temp > 30) return 'text-orange-600';
    if (temp > 25) return 'text-yellow-600';
    if (temp > 20) return 'text-green-600';
    if (temp > 15) return 'text-blue-600';
    return 'text-blue-400';
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Hourly Forecast</h3>
        <span className="text-sm text-gray-500">Next {hours} hours</span>
      </div>
      
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {hourlyData.map((hour, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-28 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="text-center">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {hour.day}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {hour.date}
                </div>
                <div className="text-2xl mb-2">
                  {getWeatherIcon(hour.temperature, hour.cloudCover, hour.hour)}
                </div>
                <div className={`text-2xl font-bold mb-1 ${getTempColor(hour.temperature)}`}>
                  {hour.temperature !== null ? `${Math.round(hour.temperature)}°` : '--'}
                </div>
                <div className="text-xs text-gray-600 mb-3 space-y-1">
                  {hour.humidity !== null && (
                    <div className="flex items-center justify-center gap-1">
                      <span>💧</span>
                      <span>{Math.round(hour.humidity)}%</span>
                    </div>
                  )}
                  {hour.windSpeed !== null && (
                    <div className="flex items-center justify-center gap-1">
                      <span>💨</span>
                      <span>{hour.windSpeed.toFixed(1)}m/s</span>
                    </div>
                  )}
                  {hour.precipitation !== null && hour.precipitation > 0 && (
                    <div className="flex items-center justify-center gap-1 text-blue-600">
                      <span>🌧️</span>
                      <span>{hour.precipitation.toFixed(1)}mm</span>
                    </div>
                  )}
                </div>
                <div className="text-xs font-medium text-gray-500">
                  {hour.hour.toString().padStart(2, '0')}:00
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

