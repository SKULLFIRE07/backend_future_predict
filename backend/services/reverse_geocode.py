"""
Reverse geocoding service - converts coordinates to location name.
Uses multiple APIs with fallbacks.
"""
import requests
import logging
import time
from typing import Dict, Optional

logger = logging.getLogger(__name__)


def reverse_geocode_nominatim(lat: float, lon: float) -> Optional[Dict]:
    """
    Reverse geocode using Nominatim (OpenStreetMap).
    Returns location name and metadata.
    """
    try:
        headers = {
            'User-Agent': 'AI-Weather-Predictor/1.0 (Educational Project)'
        }
        
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "lat": str(lat),
            "lon": str(lon),
            "format": "json",
            "addressdetails": 1
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data and data.get("address"):
            address = data.get("address", {})
            display_name = data.get("display_name", "")
            
            # Extract key components
            city = (
                address.get("city") or 
                address.get("town") or 
                address.get("village") or 
                address.get("suburb") or
                ""
            )
            country = address.get("country", "")
            state = address.get("state", "")
            
            # Build a readable name
            name_parts = []
            if city:
                name_parts.append(city)
            if state and state != city:
                name_parts.append(state)
            if country:
                name_parts.append(country)
            
            name = ", ".join(name_parts) if name_parts else display_name.split(",")[0]
            
            return {
                "name": name,
                "display_name": display_name,
                "country": country,
                "city": city,
                "latitude": lat,
                "longitude": lon
            }
        
        time.sleep(1)  # Rate limit
    except Exception as e:
        logger.debug(f"Nominatim reverse geocoding failed: {str(e)}")
    
    return None


def reverse_geocode_openmeteo(lat: float, lon: float) -> Optional[Dict]:
    """
    Reverse geocode using Open-Meteo API.
    Note: Open-Meteo doesn't have direct reverse geocoding, so we'll use a nearby search.
    """
    try:
        # Use a small radius search near the coordinates
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {
            "latitude": lat,
            "longitude": lon,
            "count": 1
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        results = data.get("results", [])
        if results:
            result = results[0]
            return {
                "name": result.get("name", ""),
                "display_name": result.get("name", ""),
                "country": result.get("country", ""),
                "city": result.get("name", ""),
                "latitude": lat,
                "longitude": lon
            }
    except Exception as e:
        logger.debug(f"Open-Meteo reverse geocoding failed: {str(e)}")
    
    return None


def reverse_geocode_google_maps(lat: float, lon: float, api_key: Optional[str] = None) -> Optional[Dict]:
    """
    Reverse geocode using Google Maps Geocoding API.
    Requires API key.
    """
    if not api_key:
        return None
    
    try:
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "latlng": f"{lat},{lon}",
            "key": api_key
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") == "OK" and data.get("results"):
            result = data["results"][0]
            address_components = result.get("address_components", [])
            
            city = None
            country = None
            
            for component in address_components:
                types = component.get("types", [])
                if "locality" in types or "administrative_area_level_1" in types:
                    city = component.get("long_name")
                elif "country" in types:
                    country = component.get("long_name")
            
            return {
                "name": result.get("formatted_address", ""),
                "display_name": result.get("formatted_address", ""),
                "country": country or "",
                "city": city or "",
                "latitude": lat,
                "longitude": lon
            }
    except Exception as e:
        logger.debug(f"Google Maps reverse geocoding failed: {str(e)}")
    
    return None


def reverse_geocode(lat: float, lon: float, google_api_key: Optional[str] = None) -> Dict[str, any]:
    """
    Reverse geocode coordinates to get location name.
    Tries multiple APIs with fallbacks.
    
    Args:
        lat: Latitude
        lon: Longitude
        google_api_key: Optional Google Maps API key
    
    Returns:
        Dictionary with location name and metadata
    """
    geocoders = [
        ("Nominatim", lambda: reverse_geocode_nominatim(lat, lon)),
    ]
    
    # Add Google Maps if API key provided
    if google_api_key:
        geocoders.insert(0, ("Google Maps", lambda: reverse_geocode_google_maps(lat, lon, google_api_key)))
    
    # Try Open-Meteo as fallback (limited but fast)
    geocoders.append(("Open-Meteo", lambda: reverse_geocode_openmeteo(lat, lon)))
    
    for geocoder_name, geocoder_func in geocoders:
        try:
            result = geocoder_func()
            if result:
                logger.info(f"Successfully reverse geocoded ({lat}, {lon}) using {geocoder_name}")
                return result
        except Exception as e:
            logger.warning(f"{geocoder_name} reverse geocoding failed: {str(e)}")
            continue
    
    # Fallback - return coordinates as name
    return {
        "name": f"{lat:.4f}, {lon:.4f}",
        "display_name": f"{lat:.4f}, {lon:.4f}",
        "country": None,
        "city": None,
        "latitude": lat,
        "longitude": lon
    }

