import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface AutocompleteSuggestion {
  display_name: string;
  name: string;
  country: string | null;
  latitude: number;
  longitude: number;
  source?: string;
}

export interface AutocompleteResponse {
  suggestions: AutocompleteSuggestion[];
}

export async function getAutocompleteSuggestions(query: string): Promise<AutocompleteSuggestion[]> {
  if (!query || query.length < 2) {
    return [];
  }

  // Skip autocomplete for status messages
  const queryLower = query.toLowerCase().trim();
  if (queryLower.includes('getting') || 
      queryLower.includes('locating') || 
      queryLower.includes('current location') ||
      queryLower.startsWith('current location')) {
    return [];
  }

  try {
    const response = await axios.get<AutocompleteResponse>(
      `${API_BASE_URL}/api/autocomplete`,
      {
        params: { q: query },
        timeout: 5000,
      }
    );
    return response.data.suggestions;
  } catch (error) {
    // Silently fail - don't spam console with autocomplete errors
    return [];
  }
}
