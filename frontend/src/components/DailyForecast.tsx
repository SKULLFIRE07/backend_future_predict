import { TimeSeriesPoint } from '../types';

interface DailyForecastProps {
  forecast: TimeSeriesPoint[];
  days?: number;
}

interface DailyData {
  date: Date;
  dayName: string;
  dateStr: string;
  high: number | null;
  low: number | null;
  avg: number | null;
  humidity: number | null;
  windSpeed: number | null;
  precipitation: number | null;
  cloudCover: number | null;
  radiation: number | null;
  hours: number;
}

export default function DailyForecast({ forecast, days = 7 }: DailyForecastProps) {
  // Group hourly data by day
  const dailyDataMap = new Map<string, DailyData>();

  forecast.forEach((point) => {
    const date = new Date(point.time);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dailyDataMap.has(dateKey)) {
      dailyDataMap.set(dateKey, {
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        dateStr: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        high: null,
        low: null,
        avg: null,
        humidity: null,
        windSpeed: null,
        precipitation: null,
        cloudCover: null,
        radiation: null,
        hours: 0,
      });
    }

    const dayData = dailyDataMap.get(dateKey)!;
    
    if (point.temperature_2m !== null) {
      if (dayData.high === null || point.temperature_2m > dayData.high) {
        dayData.high = point.temperature_2m;
      }
      if (dayData.low === null || point.temperature_2m < dayData.low) {
        dayData.low = point.temperature_2m;
      }
    }

    if (point.relativehumidity_2m !== null) {
      dayData.humidity = dayData.humidity === null 
        ? point.relativehumidity_2m 
        : (dayData.humidity + point.relativehumidity_2m) / 2;
    }

    if (point.wind_speed_10m !== null) {
      dayData.windSpeed = dayData.windSpeed === null
        ? point.wind_speed_10m
        : (dayData.windSpeed + point.wind_speed_10m) / 2;
    }

    if (point.precipitation !== null && point.precipitation > 0) {
      dayData.precipitation = (dayData.precipitation || 0) + point.precipitation;
    }

    if (point.cloudcover !== null) {
      dayData.cloudCover = dayData.cloudCover === null
        ? point.cloudcover
        : (dayData.cloudCover + point.cloudcover) / 2;
    }

    if (point.shortwave_radiation !== null) {
      dayData.radiation = dayData.radiation === null
        ? point.shortwave_radiation
        : (dayData.radiation + point.shortwave_radiation) / 2;
    }

    dayData.hours++;
  });

  // Calculate averages and convert to array
  const dailyData: DailyData[] = Array.from(dailyDataMap.values())
    .map((day) => ({
      ...day,
      avg: day.high !== null && day.low !== null 
        ? (day.high + day.low) / 2 
        : day.high || day.low,
    }))
    .slice(0, days)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const getWeatherIcon = (avg: number | null, cloudCover: number | null, date: Date) => {
    const isToday = date.toDateString() === new Date().toDateString();
    const month = date.getMonth();
    const isSummer = month >= 4 && month <= 9;
    
    if (!avg) return '🌤️';
    
    if (cloudCover && cloudCover > 80) return '☁️';
    if (cloudCover && cloudCover > 50) return '⛅';
    if (avg > 30) return '☀️';
    if (avg > 25) return '🌤️';
    if (avg > 20) return '🌥️';
    return '🌧️';
  };

  const getTempGradient = (avg: number | null) => {
    if (!avg) return 'from-gray-100 to-gray-200';
    if (avg > 30) return 'from-orange-100 to-red-100';
    if (avg > 25) return 'from-yellow-100 to-orange-100';
    if (avg > 20) return 'from-green-100 to-yellow-100';
    if (avg > 15) return 'from-blue-100 to-green-100';
    return 'from-blue-100 to-indigo-100';
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800">7-Day Forecast</h3>
        <span className="text-sm text-gray-500">Daily Overview</span>
      </div>
      
      <div className="space-y-3">
        {dailyData.map((day, index) => (
          <div
            key={index}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
              isToday(day.date)
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-md'
                : `bg-gradient-to-r ${getTempGradient(day.avg)} border-gray-200 hover:border-blue-300`
            }`}
          >
            <div className="flex-shrink-0 w-24">
              <div className={`text-sm font-semibold ${isToday(day.date) ? 'text-blue-700' : 'text-gray-700'}`}>
                {isToday(day.date) ? 'Today' : day.dayName.slice(0, 3)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {day.dateStr}
              </div>
            </div>
            
            <div className="flex-shrink-0 text-3xl">
              {getWeatherIcon(day.avg, day.cloudCover, day.date)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {day.high !== null && day.low !== null ? (
                  <>
                    <span className="text-2xl font-bold text-gray-800">
                      {Math.round(day.high)}°
                    </span>
                    <span className="text-lg text-gray-500">
                      / {Math.round(day.low)}°
                    </span>
                  </>
                ) : day.avg !== null ? (
                  <span className="text-2xl font-bold text-gray-800">
                    {Math.round(day.avg)}°
                  </span>
                ) : (
                  <span className="text-xl text-gray-400">--</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {day.precipitation !== null && day.precipitation > 0 && (
                <div className="flex items-center gap-1 text-blue-600">
                  <span>🌧️</span>
                  <span>{day.precipitation.toFixed(1)}mm</span>
                </div>
              )}
              {day.humidity !== null && (
                <div className="flex items-center gap-1">
                  <span>💧</span>
                  <span>{Math.round(day.humidity)}%</span>
                </div>
              )}
              {day.windSpeed !== null && (
                <div className="flex items-center gap-1">
                  <span>💨</span>
                  <span>{day.windSpeed.toFixed(1)}m/s</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

