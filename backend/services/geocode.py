"""
Geocoding service using multiple APIs with fallbacks.
Converts location text to exact coordinates, elevation, and metadata.
Tries multiple geocoding APIs to ensure any location can be found.
"""
import requests
import logging
import time
from typing import Dict, Optional, List
from urllib.parse import quote

logger = logging.getLogger(__name__)


def _geocode_openmeteo(location_name: str) -> Optional[Dict]:
    """
    Try geocoding using Open-Meteo API.
    Returns result dict or None if failed.
    """
    try:
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {
            "name": location_name,
            "count": 10,
            "language": "en"
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        results = data.get("results", [])
        if results and len(results) > 0:
            result = results[0]
            lat = result.get("latitude")
            lon = result.get("longitude")
            
            if lat is not None and lon is not None:
                return {
                    "name": result.get("name", location_name),
                    "country": result.get("country", None),
                    "latitude": float(lat),
                    "longitude": float(lon),
                    "elevation": float(result.get("elevation")) if result.get("elevation") is not None else None
                }
    except Exception as e:
        logger.debug(f"Open-Meteo geocoding failed: {str(e)}")
    
    return None


def _geocode_nominatim(location_name: str) -> Optional[Dict]:
    """
    Try geocoding using Nominatim (OpenStreetMap) API.
    Returns result dict or None if failed.
    Note: Nominatim requires a user agent and has rate limits.
    """
    try:
        # Nominatim requires a proper User-Agent
        headers = {
            'User-Agent': 'AI-Weather-Predictor/1.0 (Educational Project)'
        }
        
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": location_name,
            "format": "json",
            "limit": 5,
            "addressdetails": 1,
            "extratags": 1
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data and len(data) > 0:
            result = data[0]
            lat = result.get("lat")
            lon = result.get("lon")
            
            if lat is not None and lon is not None:
                address = result.get("address", {})
                country = address.get("country") or address.get("country_code")
                name = result.get("display_name", location_name).split(",")[0]
                
                # Try to get elevation from the result if available
                elevation = result.get("extratags", {}).get("elevation")
                if elevation:
                    try:
                        elevation = float(elevation)
                    except (ValueError, TypeError):
                        elevation = None
                
                return {
                    "name": name,
                    "country": country,
                    "latitude": float(lat),
                    "longitude": float(lon),
                    "elevation": elevation
                }
        
        # Respect rate limit (1 request per second)
        time.sleep(1)
    except Exception as e:
        logger.debug(f"Nominatim geocoding failed: {str(e)}")
    
    return None


def _geocode_geocodexyz(location_name: str) -> Optional[Dict]:
    """
    Try geocoding using GeoCode.xyz API (free tier available).
    Returns result dict or None if failed.
    """
    try:
        url = "https://geocode.xyz"
        params = {
            "geoit": "JSON",
            "scantext": location_name,
            "json": 1
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # GeoCode.xyz returns different structure
        if data.get("latt") and data.get("longt"):
            try:
                lat = float(data["latt"])
                lon = float(data["longt"])
                
                # Check if coordinates are valid (not 0,0 which means not found)
                if lat != 0.0 or lon != 0.0:
                    return {
                        "name": data.get("standard", {}).get("city") or data.get("standard", {}).get("addresst", {}).get("") or location_name,
                        "country": data.get("standard", {}).get("countryname"),
                        "latitude": lat,
                        "longitude": lon,
                        "elevation": None  # GeoCode.xyz doesn't provide elevation
                    }
            except (ValueError, KeyError, TypeError):
                pass
    except Exception as e:
        logger.debug(f"GeoCode.xyz geocoding failed: {str(e)}")
    
    return None


def _geocode_google_maps(location_name: str, api_key: Optional[str] = None) -> Optional[Dict]:
    """
    Try geocoding using Google Maps Geocoding API.
    Requires API key. Returns result dict or None if failed.
    """
    if not api_key:
        return None
    
    try:
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "address": location_name,
            "key": api_key
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") != "OK" or not data.get("results"):
            return None
        
        result = data["results"][0]
        geometry = result.get("geometry", {})
        location = geometry.get("location", {})
        
        if location.get("lat") and location.get("lng"):
            address_components = result.get("address_components", [])
            country = None
            city = None
            
            for component in address_components:
                types = component.get("types", [])
                if "country" in types:
                    country = component.get("long_name")
                elif "locality" in types or "administrative_area_level_1" in types:
                    city = component.get("long_name")
            
            return {
                "name": result.get("formatted_address", location_name),
                "country": country,
                "latitude": float(location["lat"]),
                "longitude": float(location["lng"]),
                "elevation": None  # Google doesn't provide elevation in geocoding
            }
    except Exception as e:
        logger.debug(f"Google Maps geocoding failed: {str(e)}")
    
    return None


def _try_with_variations(location_name: str) -> List[str]:
    """
    Generate location name variations to try.
    """
    variations = [location_name.strip()]
    location_clean = location_name.strip()
    
    # If no comma, try adding common countries
    if "," not in location_clean:
        variations.extend([
            f"{location_clean}, India",
            f"{location_clean}, USA",
            f"{location_clean}, United States",
            f"{location_clean}, UK",
            f"{location_clean}, United Kingdom",
            f"{location_clean}, Canada",
            f"{location_clean}, Australia",
            f"{location_clean}, Germany",
            f"{location_clean}, France",
        ])
    
    return variations


def geocode_location(location_name: str, google_api_key: Optional[str] = None) -> Dict[str, any]:
    """
    Geocode location using multiple APIs with fallbacks.
    Tries Open-Meteo, Nominatim, and GeoCode.xyz in sequence.
    
    Args:
        location_name: Free text location (e.g., "Pune", "Flat 502, XYZ Apartments, Baner, Pune")
    
    Returns:
        Dictionary with:
        {
            "name": str,
            "country": str | None,
            "latitude": float,
            "longitude": float,
            "elevation": float | None
        }
    
    Raises:
        ValueError: If location not found after trying all APIs
    """
    location_clean = location_name.strip()
    
    if not location_clean:
        raise ValueError("Location name cannot be empty")
    
    logger.info(f"Geocoding location: {location_clean}")
    
    # Generate variations of the location name
    variations = _try_with_variations(location_clean)
    
    # List of geocoding functions to try (in order)
    # Google Maps first if API key provided (best for specific addresses)
    geocoders = []
    
    if google_api_key:
        geocoders.append(("Google Maps", lambda loc: _geocode_google_maps(loc, google_api_key)))
    
    geocoders.extend([
        ("Open-Meteo", _geocode_openmeteo),
        ("Nominatim", _geocode_nominatim),
        ("GeoCode.xyz", _geocode_geocodexyz),
    ])
    
    # Try each variation with each geocoder
    for variation in variations:
        logger.info(f"Trying variation: {variation}")
        
        for geocoder_name, geocoder_func in geocoders:
            try:
                logger.info(f"Trying {geocoder_name} API...")
                result = geocoder_func(variation)
                
                if result:
                    logger.info(
                        f"Successfully geocoded '{location_clean}' using {geocoder_name} "
                        f"to: {result.get('name')} at ({result.get('latitude')}, {result.get('longitude')})"
                    )
                    return result
                
            except Exception as e:
                logger.warning(f"{geocoder_name} API failed for '{variation}': {str(e)}")
                continue
    
    # If all attempts failed
    error_msg = (
        f"Could not find location '{location_clean}' using any geocoding service.\n\n"
        f"Please try:\n"
        f"- A more specific address (e.g., 'Pune, India' or 'Baner, Pune')\n"
        f"- Including country name (e.g., 'Pune, India')\n"
        f"- Checking spelling\n"
        f"- Trying a nearby landmark or city"
    )
    
    raise ValueError(error_msg)
