import { useMemo } from 'react';
import { DataResponse } from '../types';

interface InsightsProps {
  data: DataResponse;
}

export default function Insights({ data }: InsightsProps) {
  const insights = useMemo(() => {
    const blended = data.blended_forecast;

    // Find max temperature
    const tempValues = blended.map((p) => p.temperature_2m).filter((v) => v !== null && v !== undefined) as number[];
    const maxTemp = tempValues.length > 0 ? Math.max(...tempValues) : 0;
    const minTemp = tempValues.length > 0 ? Math.min(...tempValues) : 0;
    const avgTemp = tempValues.length > 0 ? tempValues.reduce((a, b) => a + b, 0) / tempValues.length : 0;

    // Find max solar radiation
    const solarValues = blended.map((p) => p.shortwave_radiation).filter((v) => v !== null && v !== undefined) as number[];
    const maxSolar = solarValues.length > 0 ? Math.max(...solarValues) : 0;
    const avgSolar = solarValues.length > 0 ? solarValues.reduce((a, b) => a + b, 0) / solarValues.length : 0;

    // Find max wind speed
    const windValues = blended.map((p) => p.wind_speed_10m).filter((v) => v !== null && v !== undefined) as number[];
    const maxWind = windValues.length > 0 ? Math.max(...windValues) : 0;
    const avgWind = windValues.length > 0 ? windValues.reduce((a, b) => a + b, 0) / windValues.length : 0;

    // Find time of max wind
    const maxWindPoint = blended.find((p) => p.wind_speed_10m === maxWind);
    const maxWindTime = maxWindPoint && maxWindPoint.wind_speed_10m !== null 
      ? new Date(maxWindPoint.time).toLocaleString() 
      : 'N/A';

    return {
      maxTemp,
      minTemp,
      avgTemp,
      maxSolar,
      avgSolar,
      maxWind,
      avgWind,
      maxWindTime,
      historicalDays: data.historical.length / 24, // Approximate days
    };
  }, [data]);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800">AI Insights</h3>
      </div>
      
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <p className="text-gray-700">
          We trained a small ML model on the last <strong className="text-blue-700">{insights.historicalDays.toFixed(0)} days</strong> of
          hourly data for this exact location. The AI prediction is blended with the official forecast
          (50% ML, 50% API) for more robust results.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-100 to-red-100 border-2 border-orange-200 rounded-xl p-5 hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">🌡️</span>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Temperature Forecast</p>
          <p className="text-2xl font-bold text-orange-700 mb-1">{insights.maxTemp.toFixed(1)}°C</p>
          <p className="text-xs text-gray-600">Range: {insights.minTemp.toFixed(1)}° - {insights.maxTemp.toFixed(1)}°</p>
          <p className="text-xs text-gray-500 mt-1">Avg: {insights.avgTemp.toFixed(1)}°C</p>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-100 to-amber-100 border-2 border-yellow-200 rounded-xl p-5 hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">☀️</span>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Solar Radiation</p>
          <p className="text-2xl font-bold text-yellow-700 mb-1">{insights.maxSolar.toFixed(1)} W/m²</p>
          <p className="text-xs text-gray-600">Peak Value</p>
          <p className="text-xs text-gray-500 mt-1">Avg: {insights.avgSolar.toFixed(1)} W/m²</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-200 rounded-xl p-5 hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">💨</span>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Wind Speed</p>
          <p className="text-2xl font-bold text-blue-700 mb-1">{insights.maxWind.toFixed(1)} m/s</p>
          <p className="text-xs text-gray-600">Max Wind</p>
          <p className="text-xs text-gray-500 mt-1">Avg: {insights.avgWind.toFixed(1)} m/s</p>
          <p className="text-xs text-gray-400 mt-1 truncate">Peak: {insights.maxWindTime.split(',')[0]}</p>
        </div>
      </div>
    </div>
  );
}
