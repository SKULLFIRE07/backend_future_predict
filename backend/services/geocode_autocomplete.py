"""
Autocomplete service for location search.
Provides suggestions as user types, similar to Google Maps.
Uses multiple APIs for best coverage.
"""
import requests
import logging
import time
from typing import List, Dict, Optional
from urllib.parse import quote

logger = logging.getLogger(__name__)


def autocomplete_openmeteo(query: str, limit: int = 5) -> List[Dict]:
    """
    Get autocomplete suggestions from Open-Meteo.
    """
    try:
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {
            "name": query,
            "count": limit,
            "language": "en"
        }
        
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        results = data.get("results", [])
        suggestions = []
        
        for result in results[:limit]:
            lat = result.get("latitude")
            lon = result.get("longitude")
            
            if lat is not None and lon is not None:
                name = result.get("name", "")
                country = result.get("country", "")
                admin1 = result.get("admin1", "")
                
                # Build full address
                parts = [name]
                if admin1:
                    parts.append(admin1)
                if country:
                    parts.append(country)
                
                full_address = ", ".join(parts)
                
                suggestions.append({
                    "display_name": full_address,
                    "name": name,
                    "country": country,
                    "latitude": float(lat),
                    "longitude": float(lon),
                    "source": "Open-Meteo"
                })
        
        return suggestions
    except Exception as e:
        logger.debug(f"Open-Meteo autocomplete failed: {str(e)}")
        return []


def autocomplete_nominatim(query: str, limit: int = 5) -> List[Dict]:
    """
    Get autocomplete suggestions from Nominatim (OpenStreetMap).
    """
    try:
        headers = {
            'User-Agent': 'AI-Weather-Predictor/1.0 (Educational Project)'
        }
        
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": query,
            "format": "json",
            "limit": limit,
            "addressdetails": 1
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        suggestions = []
        
        for item in data[:limit]:
            lat = item.get("lat")
            lon = item.get("lon")
            
            if lat and lon:
                address = item.get("address", {})
                display_name = item.get("display_name", "")
                
                suggestions.append({
                    "display_name": display_name,
                    "name": address.get("city") or address.get("town") or address.get("village") or display_name.split(",")[0],
                    "country": address.get("country") or address.get("country_code", "").upper(),
                    "latitude": float(lat),
                    "longitude": float(lon),
                    "source": "Nominatim"
                })
        
        # Respect rate limit
        time.sleep(0.5)
        return suggestions
    except Exception as e:
        logger.debug(f"Nominatim autocomplete failed: {str(e)}")
        return []


def autocomplete_google_maps(query: str, api_key: Optional[str] = None, limit: int = 5) -> List[Dict]:
    """
    Get autocomplete suggestions from Google Maps Places API.
    Requires API key (optional).
    """
    if not api_key:
        return []
    
    try:
        url = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
        params = {
            "input": query,
            "key": api_key,
            "types": "geocode",
            "language": "en"
        }
        
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") != "OK":
            logger.debug(f"Google Maps API status: {data.get('status')}")
            return []
        
        predictions = data.get("predictions", [])
        suggestions = []
        
        for pred in predictions[:limit]:
            description = pred.get("description", "")
            place_id = pred.get("place_id", "")
            
            # Get place details for coordinates
            details_url = "https://maps.googleapis.com/maps/api/place/details/json"
            details_params = {
                "place_id": place_id,
                "key": api_key,
                "fields": "geometry,formatted_address,name"
            }
            
            details_resp = requests.get(details_url, params=details_params, timeout=5)
            if details_resp.status_code == 200:
                details_data = details_resp.json()
                if details_data.get("status") == "OK":
                    result = details_data.get("result", {})
                    geometry = result.get("geometry", {})
                    location = geometry.get("location", {})
                    
                    if location.get("lat") and location.get("lng"):
                        suggestions.append({
                            "display_name": description,
                            "name": result.get("name") or description.split(",")[0],
                            "country": None,  # Extract from address if needed
                            "latitude": float(location["lat"]),
                            "longitude": float(location["lng"]),
                            "source": "Google Maps"
                        })
        
        return suggestions
    except Exception as e:
        logger.debug(f"Google Maps autocomplete failed: {str(e)}")
        return []


def get_autocomplete_suggestions(query: str, limit: int = 5, google_api_key: Optional[str] = None) -> List[Dict]:
    """
    Get autocomplete suggestions from multiple APIs.
    Returns combined and deduplicated results.
    
    Args:
        query: Search query
        limit: Maximum number of suggestions to return
        google_api_key: Optional Google Maps API key
    
    Returns:
        List of suggestion dictionaries
    """
    if not query or len(query.strip()) < 2:
        return []
    
    query_clean = query.strip()
    
    # Collect suggestions from all APIs
    all_suggestions = []
    
    # Try Open-Meteo first (fastest)
    openmeteo_results = autocomplete_openmeteo(query_clean, limit=limit)
    all_suggestions.extend(openmeteo_results)
    
    # Try Nominatim (most comprehensive)
    if len(all_suggestions) < limit:
        nominatim_results = autocomplete_nominatim(query_clean, limit=limit)
        all_suggestions.extend(nominatim_results)
    
    # Try Google Maps if API key provided (best for addresses)
    if google_api_key and len(all_suggestions) < limit:
        google_results = autocomplete_google_maps(query_clean, google_api_key, limit=limit)
        all_suggestions.extend(google_results)
    
    # Deduplicate based on coordinates (within 0.001 degrees ~100m)
    unique_suggestions = []
    seen_coords = set()
    
    for suggestion in all_suggestions:
        lat = suggestion.get("latitude")
        lon = suggestion.get("longitude")
        
        if lat is None or lon is None:
            continue
        
        # Round to 3 decimal places for deduplication (~100m precision)
        coord_key = (round(float(lat), 3), round(float(lon), 3))
        
        if coord_key not in seen_coords:
            seen_coords.add(coord_key)
            unique_suggestions.append(suggestion)
            
            if len(unique_suggestions) >= limit:
                break
    
    return unique_suggestions

