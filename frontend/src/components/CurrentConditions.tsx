interface CurrentConditionsProps {
  current: Record<string, number>;
}

export default function CurrentConditions({ current }: CurrentConditionsProps) {
  const formatValue = (key: string, value: number): string => {
    switch (key) {
      case 'temperature_2m':
        return `${value.toFixed(1)} °C`;
      case 'relativehumidity_2m':
        return `${value.toFixed(1)} %`;
      case 'wind_speed_10m':
        return `${value.toFixed(1)} m/s`;
      case 'precipitation':
        return `${value.toFixed(2)} mm`;
      case 'cloudcover':
        return `${value.toFixed(0)} %`;
      case 'pressure_msl':
        return `${value.toFixed(1)} hPa`;
      case 'shortwave_radiation':
        return `${value.toFixed(1)} W/m²`;
      default:
        return value.toFixed(2);
    }
  };

  const getLabel = (key: string): string => {
    const labels: Record<string, string> = {
      temperature_2m: 'Temperature',
      relativehumidity_2m: 'Humidity',
      wind_speed_10m: 'Wind Speed',
      precipitation: 'Precipitation',
      cloudcover: 'Cloud Cover',
      pressure_msl: 'Pressure',
      shortwave_radiation: 'Solar Radiation',
    };
    return labels[key] || key;
  };

  const getIcon = (key: string) => {
    const icons: Record<string, string> = {
      temperature_2m: '🌡️',
      relativehumidity_2m: '💧',
      wind_speed_10m: '💨',
      precipitation: '🌧️',
      cloudcover: '☁️',
      pressure_msl: '📊',
      shortwave_radiation: '☀️',
    };
    return icons[key] || '📌';
  };

  const getColor = (key: string): string => {
    const colors: Record<string, string> = {
      temperature_2m: 'from-orange-100 to-red-100 border-orange-200',
      relativehumidity_2m: 'from-blue-100 to-cyan-100 border-blue-200',
      wind_speed_10m: 'from-gray-100 to-slate-100 border-gray-200',
      precipitation: 'from-indigo-100 to-purple-100 border-indigo-200',
      cloudcover: 'from-gray-100 to-zinc-100 border-gray-200',
      pressure_msl: 'from-green-100 to-emerald-100 border-green-200',
      shortwave_radiation: 'from-yellow-100 to-amber-100 border-yellow-200',
    };
    return colors[key] || 'from-gray-100 to-gray-200 border-gray-300';
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-100 rounded-lg">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800">Current Conditions</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(current).map(([key, value]) => (
          <div
            key={key}
            className={`bg-gradient-to-br ${getColor(key)} border rounded-xl p-4 hover:scale-105 transition-transform duration-200`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{getIcon(key)}</span>
            </div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">{getLabel(key)}</p>
            <p className="text-xl font-bold text-gray-900">{formatValue(key, value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
