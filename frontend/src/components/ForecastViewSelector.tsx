type ForecastView = 'hourly' | 'daily' | 'weekly';

interface ForecastViewSelectorProps {
  selected: ForecastView;
  onSelect: (view: ForecastView) => void;
}

export default function ForecastViewSelector({ selected, onSelect }: ForecastViewSelectorProps) {
  const views: { key: ForecastView; label: string; icon: string }[] = [
    { key: 'hourly', label: 'Hourly', icon: '🕐' },
    { key: 'daily', label: 'Daily', icon: '📅' },
    { key: 'weekly', label: 'Weekly', icon: '📊' },
  ];

  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
      {views.map((view) => (
        <button
          key={view.key}
          onClick={() => onSelect(view.key)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
            selected === view.key
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105'
              : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
          }`}
        >
          <span className="text-xl">{view.icon}</span>
          <span>{view.label}</span>
        </button>
      ))}
    </div>
  );
}

