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
                           locationTrimmed.toLowerCase().includes('locating');
    
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
      // Show error in a better way - pass it to parent
      return;
    }

    setIsGettingLocation(true);
    setShowSuggestions(false);
    // Don't set any location text that could trigger autocomplete
    setLocation('');

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout
      maximumAge: 60000 // Accept cached location if less than 1 minute old
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          // Validate coordinates
          if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            throw new Error('Invalid coordinates received');
          }
          
        setIsGettingLocation(false);
        // Don't set location text here - it will be updated after reverse geocoding
        setLocation('');
        
        // Automatically trigger search with coordinates - it will analyze immediately
        // The location name will be populated via resolvedLocationName prop
        onSearchByCoordinates(lat, lon);
        } catch (err) {
          setIsGettingLocation(false);
          setLocation('');
          console.error('Error processing location:', err);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        setLocation('');
        
        let errorMessage = 'Unable to get your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access in your browser settings and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Your location is currently unavailable. Please try entering a location manually.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again or enter a location manually.';
            break;
          default:
            errorMessage = 'Unable to get your location. Please try again or enter a location manually.';
            break;
        }
        
        // Pass error to parent component for better error handling
        if (onLocationError) {
          onLocationError(errorMessage);
        } else {
          console.error('Geolocation error:', errorMessage);
        }
      },
      geoOptions
    );
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
            className="w-full px-6 py-4 text-lg rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none shadow-lg"
            disabled={isLoading}
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
          className="px-6 py-4 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg transition-colors flex items-center gap-2"
          title="Get my current location"
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
          disabled={isLoading || !location.trim()}
          className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg transition-colors"
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>
    </div>
  );
}
