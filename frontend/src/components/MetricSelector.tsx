interface MetricSelectorProps {
  selected: 'temperature_2m' | 'shortwave_radiation' | 'wind_speed_10m';
  onSelect: (metric: 'temperature_2m' | 'shortwave_radiation' | 'wind_speed_10m') => void;
}

export default function MetricSelector({ selected, onSelect }: MetricSelectorProps) {
  const metrics = [
    { key: 'temperature_2m' as const, label: 'Temperature', icon: '🌡️', color: 'from-orange-500 to-red-500' },
    { key: 'shortwave_radiation' as const, label: 'Solar Radiation', icon: '☀️', color: 'from-yellow-500 to-amber-500' },
    { key: 'wind_speed_10m' as const, label: 'Wind Speed', icon: '💨', color: 'from-blue-500 to-cyan-500' },
  ];

  return (
    <div className="flex gap-3 p-1 bg-gray-100 rounded-xl">
      {metrics.map((metric) => (
        <button
          key={metric.key}
          onClick={() => onSelect(metric.key)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
            selected === metric.key
              ? `bg-gradient-to-r ${metric.color} text-white shadow-lg transform scale-105`
              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
          }`}
        >
          <span className="text-xl">{metric.icon}</span>
          <span>{metric.label}</span>
        </button>
      ))}
    </div>
  );
}
