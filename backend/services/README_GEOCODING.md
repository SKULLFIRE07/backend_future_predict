# Geocoding Service - Multi-API System

## Overview

The geocoding service uses **multiple APIs with automatic fallbacks** to ensure that ANY location input can be successfully geocoded. If one API fails or doesn't find the location, the system automatically tries the next one.

## APIs Used (In Order)

### 1. Open-Meteo Geocoding API (Primary)
- **URL**: `https://geocoding-api.open-meteo.com/v1/search`
- **No API Key Required**
- **Features**: Fast, includes elevation data
- **Rate Limits**: Generous free tier

### 2. Nominatim (OpenStreetMap) (Fallback #1)
- **URL**: `https://nominatim.openstreetmap.org/search`
- **No API Key Required**
- **Features**: Very comprehensive database, covers worldwide locations
- **Rate Limits**: 1 request per second (automatically handled)

### 3. GeoCode.xyz (Fallback #2)
- **URL**: `https://geocode.xyz`
- **No API Key Required**
- **Features**: Good coverage for addresses and landmarks
- **Rate Limits**: Free tier available

## How It Works

1. **Location Name Variations**: The service generates multiple variations of the input location:
   - Original input: "Pune"
   - Variations: "Pune, India", "Pune, USA", etc.

2. **Multi-API Fallback**: For each variation, it tries:
   - Open-Meteo first (fastest, includes elevation)
   - Nominatim if Open-Meteo fails (most comprehensive)
   - GeoCode.xyz as final fallback

3. **Automatic Retry**: If a location isn't found with the original name, it automatically tries variations with common country names.

## Example

Input: `"Pune"`

1. Tries "Pune" with Open-Meteo → Success! Returns coordinates
2. If that failed, would try "Pune, India" with Open-Meteo
3. If that failed, would try "Pune" with Nominatim
4. And so on...

## Benefits

- **High Success Rate**: Multiple APIs ensure locations are found
- **No API Keys Required**: All services work without authentication
- **Automatic Fallbacks**: No manual intervention needed
- **Global Coverage**: Works for cities, addresses, landmarks worldwide

## Supported Location Formats

The service accepts ANY location format:
- Cities: `"Pune"`, `"New York"`, `"London"`
- Addresses: `"Flat 502, XYZ Apartments, Baner, Pune"`
- Landmarks: `"Eiffel Tower"`, `"Statue of Liberty"`
- With/without country: `"Pune"` or `"Pune, India"`
- Partial addresses: `"Baner, Pune"`

All formats are automatically handled with intelligent variations and multi-API fallbacks.

