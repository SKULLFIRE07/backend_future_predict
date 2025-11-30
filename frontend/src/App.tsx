import { useState } from 'react';
import LocationSearch from './components/LocationSearch';
import LocationCard from './components/LocationCard';
import CurrentConditions from './components/CurrentConditions';
import WeatherChart from './components/WeatherChart';
import MetricSelector from './components/MetricSelector';
import Insights from './components/Insights';
import HourlyForecast from './components/HourlyForecast';
import DailyForecast from './components/DailyForecast';
import WeeklyForecast from './components/WeeklyForecast';
import ForecastViewSelector from './components/ForecastViewSelector';
import { fetchLocationData } from './api/client';
import { DataResponse } from './types';

function App() {
  const [data, setData] = useState<DataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'temperature_2m' | 'shortwave_radiation' | 'wind_speed_10m'>('temperature_2m');
  const [forecastView, setForecastView] = useState<'hourly' | 'daily' | 'weekly'>('hourly');

  const handleSearch = async (location: string) => {
    if (!location || !location.trim()) {
      setError('Please enter a location');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchLocationData({
        location: location.trim(),
        historical_days: 60,
        forecast_days: 7,
      });
      setData(result);
    } catch (err: any) {
      let errorMessage = 'Failed to fetch weather data';
      
      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail || err.response.data?.message;
        
        if (status === 404) {
          errorMessage = `Location not found. Please try:\n- A more specific address (e.g., "Pune, India")\n- Include country name\n- Check spelling`;
        } else if (status === 400) {
          errorMessage = detail || 'Invalid request. Please check your input.';
        } else if (status === 500) {
          errorMessage = detail || 'Server error. Please try again later.';
        } else {
          errorMessage = detail || `Server error (${status})`;
        }
      } else if (err.request) {
        errorMessage = 'Cannot connect to backend server. Please ensure the backend is running on http://localhost:8000.';
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      console.error('Error fetching weather data:', err);
      setError(errorMessage);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchByCoordinates = async (lat: number, lon: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchLocationData({
        latitude: lat,
        longitude: lon,
        historical_days: 60,
        forecast_days: 7,
      });
      setData(result);
    } catch (err: any) {
      let errorMessage = 'Failed to fetch weather data for your location';
      
      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail || err.response.data?.message;
        
        if (status === 400) {
          errorMessage = detail || 'Invalid coordinates.';
        } else if (status === 500) {
          errorMessage = detail || 'Server error. Please try again later.';
        } else {
          errorMessage = detail || `Server error (${status})`;
        }
      } else if (err.request) {
        errorMessage = 'Cannot connect to backend server. Please ensure the backend is running.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred.';
      }
      
      console.error('Error fetching weather data:', err);
      setError(errorMessage);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-xl shadow-xl border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                🌍 AI Weather & Solar Predictor
              </h1>
              <p className="text-gray-600 mt-2 text-lg font-medium">
                Historical, real-time and AI-enhanced forecasts for any exact location.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold text-green-700">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8 animate-fade-in">
          <LocationSearch 
            onSearch={handleSearch} 
            onSearchByCoordinates={handleSearchByCoordinates}
            isLoading={isLoading}
            resolvedLocationName={data?.location?.resolved_name || null}
            onLocationError={(errorMsg) => setError(errorMsg)}
          />
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-3xl p-10 shadow-2xl max-w-md w-full mx-4 transform transition-all border-2 border-purple-200">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-200 border-t-purple-600"></div>
                  <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border-2 border-purple-400 opacity-30"></div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800 mb-2">Analyzing Location</p>
                  <p className="text-sm text-gray-500">Fetching weather data and training AI models...</p>
                  <div className="mt-4 flex gap-1 justify-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6 shadow-xl animate-slide-down card-hover">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-800 mb-2">Error</h3>
                <p className="text-red-700 whitespace-pre-line">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {data && !isLoading && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Location and Current Conditions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LocationCard location={data.location} />
              <CurrentConditions current={data.current} />
            </div>

            {/* Insights */}
            <Insights data={data} />

            {/* Forecast Views - Hourly, Daily, Weekly */}
            <div className="space-y-6">
              <ForecastViewSelector selected={forecastView} onSelect={setForecastView} />
              {forecastView === 'hourly' && (
                <HourlyForecast forecast={data.blended_forecast} hours={48} />
              )}
              {forecastView === 'daily' && (
                <DailyForecast forecast={data.blended_forecast} days={7} />
              )}
              {forecastView === 'weekly' && (
                <WeeklyForecast forecast={data.blended_forecast} />
              )}
            </div>

            {/* Charts */}
            <div className="space-y-6">
              <MetricSelector selected={selectedMetric} onSelect={setSelectedMetric} />
              <WeatherChart
                historical={data.historical}
                apiForecast={data.api_forecast}
                mlForecast={data.ml_forecast}
                blendedForecast={data.blended_forecast}
                metric={selectedMetric}
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!data && !isLoading && !error && (
          <div className="text-center py-24 animate-fade-in">
            <div className="max-w-md mx-auto">
              <div className="mb-8 animate-bounce-slow">
                <div className="text-8xl">🌍</div>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4 gradient-text">Welcome to AI Weather Predictor</h3>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Enter any location above or click <span className="font-bold text-purple-600">"My Location"</span> to get started with AI-powered weather predictions.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-white/60 backdrop-blur rounded-xl">
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="text-sm font-semibold text-gray-700">AI Powered</div>
                </div>
                <div className="p-4 bg-white/60 backdrop-blur rounded-xl">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-sm font-semibold text-gray-700">Real-time Data</div>
                </div>
                <div className="p-4 bg-white/60 backdrop-blur rounded-xl">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="text-sm font-semibold text-gray-700">Accurate Forecasts</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative bg-white/60 backdrop-blur-xl border-t border-white/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-700 font-medium">
            Powered by <span className="font-bold text-purple-600">Open-Meteo APIs</span> and <span className="font-bold text-indigo-600">scikit-learn</span> ML models
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Made with ❤️ using FastAPI, React, and advanced ensemble ML algorithms
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
