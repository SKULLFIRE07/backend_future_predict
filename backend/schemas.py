"""
Pydantic schemas for API request/response models.
"""
from pydantic import BaseModel
from typing import List, Dict, Optional


class LocationRequest(BaseModel):
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    historical_days: int = 60
    forecast_days: int = 7
    
    def __init__(self, **data):
        super().__init__(**data)
        # Validate that either location or coordinates are provided
        if not self.location and (self.latitude is None or self.longitude is None):
            raise ValueError("Either 'location' or 'latitude' and 'longitude' must be provided")


class AutocompleteSuggestion(BaseModel):
    display_name: str
    name: str
    country: Optional[str] = None
    latitude: float
    longitude: float
    source: Optional[str] = None


class AutocompleteResponse(BaseModel):
    suggestions: List[AutocompleteSuggestion]


class TimeSeriesPoint(BaseModel):
    time: str  # ISO timestamp
    temperature_2m: Optional[float] = None
    shortwave_radiation: Optional[float] = None
    wind_speed_10m: Optional[float] = None
    relativehumidity_2m: Optional[float] = None
    cloudcover: Optional[float] = None
    precipitation: Optional[float] = None
    pressure_msl: Optional[float] = None


class LocationMetadata(BaseModel):
    resolved_name: str
    country: Optional[str] = None
    latitude: float
    longitude: float
    elevation: Optional[float] = None


class DataResponse(BaseModel):
    location: LocationMetadata
    current: Dict[str, float]  # current conditions
    historical: List[TimeSeriesPoint]  # raw historical
    api_forecast: List[TimeSeriesPoint]  # raw forecast from API
    ml_forecast: List[TimeSeriesPoint]  # ML-only forecast
    blended_forecast: List[TimeSeriesPoint]  # final blended forecast

