import { useState, useEffect, useRef } from 'react';
import { getAutocompleteSuggestions, AutocompleteSuggestion } from '../api/autocomplete';

interface LocationSearchProps {
  onSearch: (location: string) => void;
  onSearchByCoordinates: (lat: number, lon: number) => void;
  isLoading: boolean;
  resolvedLocationName?: string | null; // Location name after reverse geocoding
  onLocationError?: (error: string) => void; // Callback for location errors
}

export default function LocationSearch({ onSearch, onSearchByCoordinates, isLoading, resolvedLocationName, onLocationError }: LocationSearchProps) {
  const [location, setLocation] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const watchIdRef = useRef<number | null>(null); // Track geolocation watch ID
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update location text when resolved location name is available (from reverse geocoding)
  useEffect(() => {
    if (resolvedLocationName && resolvedLocationName.trim() && !isLoading) {
      setLocation(resolvedLocationName);
    }
  }, [resolvedLocationName, isLoading]);

  // Debounced autocomplete search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't trigger autocomplete for status messages or empty input
    const locationTrimmed = location.trim();
    const isStatusMessage = locationTrimmed.toLowerCase().includes('getting') || 
                           locationTrimmed.toLowerCase().includes('current location') ||
                           locationTrimmed.toLowerCase().includes('locating') ||
                           locationTrimmed.toLowerCase().includes('precise');
    
    if (locationTrimmed.length < 2 || isStatusMessage) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await getAutocompleteSuggestions(locationTrimmed);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        // Silently fail for autocomplete - don't spam console
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [location]);

  // Cleanup geolocation watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      setShowSuggestions(false);
      onSearch(location.trim());
    }
  };

  const handleSuggestionClick = (suggestion: AutocompleteSuggestion) => {
    setLocation(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    // Trigger search immediately
    onSearch(suggestion.display_name);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      if (onLocationError) {
        onLocationError('Geolocation is not supported by your browser. Please enter a location manually.');
      }
      return;
    }

    setIsGettingLocation(true);
    setShowSuggestions(false);
    setLocation('Getting precise location with GPS...');

    // Clear any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const MAX_ACCEPTABLE_ACCURACY = 50; // Accept readings better than 50 meters
    let bestPosition: GeolocationPosition | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 5; // Get up to 5 readings to find best accuracy
    const MAX_WAIT_TIME = 25000; // Maximum 25 seconds wait

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true, // Force GPS usage
      timeout: 30000, // 30 seconds timeout
      maximumAge: 0 // Force fresh GPS reading, never use cached
    };

    const successCallback = (position: GeolocationPosition) => {
      attempts++;
      const accuracy = position.coords.accuracy || Infinity;
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      
      console.log(`📍 Location attempt ${attempts}: Accuracy: ${accuracy.toFixed(0)}m`);
      
      // Validate coordinates
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        console.error('Invalid coordinates received');
        return;
      }

      // Track best position
      if (!bestPosition || accuracy < (bestPosition.coords.accuracy || Infinity)) {
        bestPosition = position;
        console.log(`✅ Best accuracy so far: ${accuracy.toFixed(0)}m`);
      }

      // If accuracy is acceptable or we've tried enough times, use it
      if (accuracy <= MAX_ACCEPTABLE_ACCURACY || attempts >= MAX_ATTEMPTS) {
        // Cleanup
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        setIsGettingLocation(false);
        setLocation('');
        
        const finalLat = bestPosition.coords.latitude;
        const finalLon = bestPosition.coords.longitude;
        const finalAccuracy = bestPosition.coords.accuracy || 0;
        
        console.log(`🎯 Using location: Lat ${finalLat.toFixed(6)}, Lon ${finalLon.toFixed(6)}, Accuracy: ${finalAccuracy.toFixed(0)}m`);
        
        // Automatically trigger search with coordinates
        onSearchByCoordinates(finalLat, finalLon);
      } else {
        // Continue waiting for better accuracy
        console.log(`⏳ Waiting for better accuracy (current: ${accuracy.toFixed(0)}m, target: ≤${MAX_ACCEPTABLE_ACCURACY}m)...`);
      }
    };

    const errorCallback = (error: GeolocationPositionError) => {
      // Cleanup
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // If we have a best position despite error, use it
      if (bestPosition) {
        setIsGettingLocation(false);
        setLocation('');
        const finalLat = bestPosition.coords.latitude;
        const finalLon = bestPosition.coords.longitude;
        const finalAccuracy = bestPosition.coords.accuracy || 0;
        console.log(`⚠️ Using best available location (accuracy: ${finalAccuracy.toFixed(0)}m) after error`);
        onSearchByCoordinates(finalLat, finalLon);
        return;
      }

      setIsGettingLocation(false);
      setLocation('');

      let errorMessage = 'Unable to get your location. ';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please allow location access in your browser settings and try again.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Your location is currently unavailable. Please ensure GPS/WiFi is enabled and try again.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out. Please ensure you have GPS signal and try again.';
          break;
        default:
          errorMessage = 'Unable to get your location. Please try again or enter a location manually.';
          break;
      }
      
      if (onLocationError) {
        onLocationError(errorMessage);
      } else {
        console.error('Geolocation error:', errorMessage);
      }
    };

    // Use watchPosition for continuous updates - GPS gets more accurate over time
    watchIdRef.current = navigator.geolocation.watchPosition(successCallback, errorCallback, geoOptions);

    // Fallback: After max wait time, use the best position we have
    timeoutRef.current = setTimeout(() => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      
      if (bestPosition) {
        setIsGettingLocation(false);
        setLocation('');
        const finalLat = bestPosition.coords.latitude;
        const finalLon = bestPosition.coords.longitude;
        const finalAccuracy = bestPosition.coords.accuracy || 0;
        console.log(`⏱️ Using best available location after timeout (accuracy: ${finalAccuracy.toFixed(0)}m)`);
        onSearchByCoordinates(finalLat, finalLon);
      } else {
        setIsGettingLocation(false);
        setLocation('');
        if (onLocationError) {
          onLocationError('Timeout getting accurate location. Please ensure GPS is enabled and try again.');
        }
      }
      timeoutRef.current = null;
    }, MAX_WAIT_TIME);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative">
      <form onSubmit={handleSubmit} className="flex gap-4">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter location (e.g., Ramyanagari Bibwewadi Pune)"
            className="w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none shadow-lg transition-all"
            disabled={isLoading || isGettingLocation}
          />
          
          {/* Loading indicator for suggestions */}
          {isLoadingSuggestions && location.trim().length >= 2 && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.latitude}-${suggestion.longitude}-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50'
                  } ${index > 0 ? 'border-t border-gray-100' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-base">
                        {suggestion.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {suggestion.display_name}
                      </p>
                      {suggestion.country && (
                        <p className="text-xs text-gray-400 mt-1">
                          {suggestion.country}
                        </p>
                      )}
                    </div>
                    {suggestion.source && (
                      <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {suggestion.source}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLoading || isGettingLocation}
          className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg transition-all flex items-center gap-2"
          title="Get my current location with high accuracy GPS"
        >
          {isGettingLocation ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Locating...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>My Location</span>
            </>
          )}
        </button>
        <button
          type="submit"
          disabled={isLoading || !location.trim() || isGettingLocation}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg transition-all"
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>
    </div>
  );
}
