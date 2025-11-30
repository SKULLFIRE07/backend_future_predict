import { LocationMetadata } from '../types';

interface LocationCardProps {
  location: LocationMetadata;
}

export default function LocationCard({ location }: LocationCardProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800">Location Details</h3>
      </div>
      <div className="space-y-3">
        <div className="pb-3 border-b border-gray-200">
          <p className="text-xl font-bold text-gray-900">{location.resolved_name}</p>
          {location.country && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {location.country}
            </p>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <span className="text-gray-600 font-medium">Latitude</span>
            <span className="text-gray-900 font-semibold">{location.latitude.toFixed(6)}°</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <span className="text-gray-600 font-medium">Longitude</span>
            <span className="text-gray-900 font-semibold">{location.longitude.toFixed(6)}°</span>
          </div>
          {location.elevation !== null && (
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-gray-600 font-medium">Elevation</span>
              <span className="text-gray-900 font-semibold">{location.elevation.toFixed(1)} m</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
