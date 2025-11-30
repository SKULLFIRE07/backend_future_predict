"""
Weather data fetching service using Open-Meteo APIs.
Fetches historical, current, and forecast weather/solar data.
"""
import pandas as pd
import requests
import logging
from datetime import date, datetime, timedelta, timezone
from typing import Dict, Optional

logger = logging.getLogger(__name__)


def fetch_historical(lat: float, lon: float, days: int = 60) -> pd.DataFrame:
    """
    Fetch last `days` of hourly historical data for the exact coordinate.
    Uses Open-Meteo Archive API with fallback mechanisms.
    
    Note: Archive API has a data delay (usually 2-7 days), so we request
    data up to 3 days ago to ensure availability.

    Args:
        lat: Latitude
        lon: Longitude
        days: Number of days of historical data to fetch

    Returns:
        DataFrame with:
        - 'time' as pandas.Timestamp (timezone-aware UTC)
        - columns: ['temperature_2m', 'relativehumidity_2m', 'shortwave_radiation',
                    'cloudcover', 'precipitation', 'pressure_msl', 'wind_speed_10m']
    """
    # Archive API has a delay - request data up to 3 days ago to ensure availability
    end_date = date.today() - timedelta(days=3)
    start_date = end_date - timedelta(days=days)
    
    # Ensure we don't request dates too far in the past (archive might not have data)
    # Archive typically goes back many years, but let's be safe
    min_date = date(2020, 1, 1)
    if start_date < min_date:
        logger.warning(f"Requested start date {start_date} is before {min_date}, adjusting to {min_date}")
        start_date = min_date
    
    url = "https://archive-api.open-meteo.com/v1/archive"
    
    # Try different variable sets - some locations might not have all variables
    variable_sets = [
        "temperature_2m,relativehumidity_2m,shortwave_radiation,cloudcover,precipitation,pressure_msl,wind_speed_10m",
        "temperature_2m,relativehumidity_2m,shortwave_radiation,cloudcover,precipitation,pressure_msl",
        "temperature_2m,relativehumidity_2m,shortwave_radiation,cloudcover",
        "temperature_2m,relativehumidity_2m",
    ]
    
    last_error = None
    for variables in variable_sets:
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "hourly": variables,
            "timezone": "UTC"
        }
        
        try:
            logger.info(f"Fetching historical data from {start_date} to {end_date} with variables: {variables.split(',')[:3]}...")
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if we got an error in the response
                if "error" in data or "reason" in data:
                    error_msg = data.get("reason", "Unknown error")
                    logger.warning(f"API returned error: {error_msg}")
                    last_error = error_msg
                    continue
                
                if "hourly" not in data:
                    logger.warning("No hourly data in API response")
                    continue
                
                hourly = data["hourly"]
                if not hourly.get("time"):
                    logger.warning("Empty time array in hourly data")
                    continue
                
                # Build DataFrame with available columns
                df_dict = {"time": pd.to_datetime(hourly["time"], utc=True)}
                
                # Map all possible columns
                column_map = {
                    "temperature_2m": "temperature_2m",
                    "relativehumidity_2m": "relativehumidity_2m",
                    "shortwave_radiation": "shortwave_radiation",
                    "cloudcover": "cloudcover",
                    "precipitation": "precipitation",
                    "pressure_msl": "pressure_msl",
                    "wind_speed_10m": "wind_speed_10m",
                }
                
                for col_name in column_map.values():
                    if col_name in hourly:
                        df_dict[col_name] = hourly.get(col_name, [None] * len(hourly["time"]))
                    else:
                        # Fill with None if column not available
                        df_dict[col_name] = [None] * len(hourly["time"])
                
                df = pd.DataFrame(df_dict)
                
                # Drop rows where time is missing
                df = df.dropna(subset=["time"])
                
                if df.empty:
                    logger.warning("DataFrame is empty after processing")
                    continue
                
                df = df.sort_values("time").reset_index(drop=True)
                logger.info(f"Successfully fetched {len(df)} historical data points")
                return df
                
            else:
                error_text = response.text[:200] if hasattr(response, 'text') else str(response.status_code)
                logger.warning(f"Archive API returned status {response.status_code}: {error_text}")
                last_error = f"Status {response.status_code}: {error_text}"
                continue
                
        except requests.exceptions.Timeout:
            logger.warning("Archive API request timed out")
            last_error = "Request timeout"
            continue
        except requests.exceptions.RequestException as e:
            logger.warning(f"Archive API request failed: {str(e)}")
            last_error = str(e)
            continue
        except Exception as e:
            logger.warning(f"Error processing archive API response: {str(e)}")
            last_error = str(e)
            continue
    
    # If all attempts failed, return empty DataFrame with correct structure
    logger.error(f"Failed to fetch historical data after all attempts. Last error: {last_error}")
    return pd.DataFrame(columns=["time", "temperature_2m", "relativehumidity_2m", "shortwave_radiation",
                                 "cloudcover", "precipitation", "pressure_msl", "wind_speed_10m"])


def fetch_forecast(lat: float, lon: float, days: int = 7) -> pd.DataFrame:
    """
    Fetch next `days` of hourly forecast data using Open-Meteo Forecast API.

    Args:
        lat: Latitude
        lon: Longitude
        days: Number of days to forecast (max ~14 days typically)

    Returns:
        DataFrame with same structure as historical data
    """
    url = "https://api.open-meteo.com/v1/forecast"
    
    # Try different variable sets
    variable_sets = [
        "temperature_2m,relativehumidity_2m,shortwave_radiation,cloudcover,precipitation,pressure_msl,wind_speed_10m",
        "temperature_2m,relativehumidity_2m,shortwave_radiation,cloudcover,precipitation,pressure_msl",
        "temperature_2m,relativehumidity_2m,shortwave_radiation,cloudcover",
        "temperature_2m,relativehumidity_2m",
    ]
    
    for variables in variable_sets:
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": variables,
            "forecast_days": min(days, 14),  # API limit
            "timezone": "UTC"
        }
        
        try:
            logger.info(f"Fetching forecast data with variables: {variables.split(',')[:3]}...")
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if "error" in data or "reason" in data:
                error_msg = data.get("reason", "Unknown error")
                logger.warning(f"Forecast API returned error: {error_msg}")
                continue
            
            if "hourly" not in data:
                logger.warning("No hourly data in forecast API response")
                continue
            
            hourly = data["hourly"]
            if not hourly.get("time"):
                logger.warning("Empty time array in forecast hourly data")
                continue
            
            # Build DataFrame with available columns
            df_dict = {"time": pd.to_datetime(hourly["time"], utc=True)}
            
            column_map = {
                "temperature_2m": "temperature_2m",
                "relativehumidity_2m": "relativehumidity_2m",
                "shortwave_radiation": "shortwave_radiation",
                "cloudcover": "cloudcover",
                "precipitation": "precipitation",
                "pressure_msl": "pressure_msl",
                "wind_speed_10m": "wind_speed_10m",
            }
            
            for col_name in column_map.values():
                if col_name in hourly:
                    df_dict[col_name] = hourly.get(col_name, [None] * len(hourly["time"]))
                else:
                    df_dict[col_name] = [None] * len(hourly["time"])
            
            df = pd.DataFrame(df_dict)
            df = df.dropna(subset=["time"])
            
            if df.empty:
                logger.warning("Forecast DataFrame is empty")
                continue
            
            df = df.sort_values("time").reset_index(drop=True)
            logger.info(f"Successfully fetched {len(df)} forecast data points")
            return df
            
        except requests.exceptions.RequestException as e:
            logger.warning(f"Forecast API request failed with {variables}: {str(e)}")
            continue
        except Exception as e:
            logger.warning(f"Error processing forecast API response: {str(e)}")
            continue
    
    # Return empty DataFrame if all attempts failed
    logger.error("Failed to fetch forecast data after all attempts")
    return pd.DataFrame(columns=["time", "temperature_2m", "relativehumidity_2m", "shortwave_radiation",
                                 "cloudcover", "precipitation", "pressure_msl", "wind_speed_10m"])


def extract_current_from_forecast(forecast_df: pd.DataFrame) -> Dict[str, float]:
    """
    From the forecast DataFrame, pick the row closest to 'now'
    and return a dict of current values.

    Args:
        forecast_df: Forecast DataFrame with 'time' and weather columns

    Returns:
        Dictionary with current conditions (temperature, humidity, etc.)
    """
    if forecast_df.empty:
        return {}

    now = datetime.now(timezone.utc)
    forecast_df = forecast_df.copy()
    forecast_df["time_diff"] = (forecast_df["time"] - now).abs()
    closest_row = forecast_df.loc[forecast_df["time_diff"].idxmin()]

    current = {
        "temperature_2m": float(closest_row.get("temperature_2m", 0)) if pd.notna(closest_row.get("temperature_2m")) else None,
        "relativehumidity_2m": float(closest_row.get("relativehumidity_2m", 0)) if pd.notna(closest_row.get("relativehumidity_2m")) else None,
        "shortwave_radiation": float(closest_row.get("shortwave_radiation", 0)) if pd.notna(closest_row.get("shortwave_radiation")) else None,
        "cloudcover": float(closest_row.get("cloudcover", 0)) if pd.notna(closest_row.get("cloudcover")) else None,
        "precipitation": float(closest_row.get("precipitation", 0)) if pd.notna(closest_row.get("precipitation")) else None,
        "pressure_msl": float(closest_row.get("pressure_msl", 0)) if pd.notna(closest_row.get("pressure_msl")) else None,
        "wind_speed_10m": float(closest_row.get("wind_speed_10m", 0)) if pd.notna(closest_row.get("wind_speed_10m")) else None,
    }

    # Remove None values
    return {k: v for k, v in current.items() if v is not None}
