"""
FastAPI backend for AI Weather & Solar Predictor.
Main application entry point.
"""
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from typing import Dict, List

import os
from schemas import LocationRequest, DataResponse, LocationMetadata, TimeSeriesPoint, AutocompleteResponse, AutocompleteSuggestion
from services.geocode import geocode_location
from services.reverse_geocode import reverse_geocode
from services.geocode_autocomplete import get_autocomplete_suggestions
from services.weather import fetch_historical, fetch_forecast, extract_current_from_forecast
from services.ml import train_local_model, forecast_with_model, blend_ml_and_api

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Weather & Solar Predictor API",
    description="Historical, real-time and AI-enhanced forecasts for any exact location.",
    version="1.0.0"
)

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional Google Maps API key from environment
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", None)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "AI Weather & Solar Predictor API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "autocomplete": "/api/autocomplete?q=<query>",
            "weather_data": "/api/data (POST)"
        }
    }


@app.get("/api/autocomplete", response_model=AutocompleteResponse)
async def autocomplete_location(q: str):
    """
    Autocomplete endpoint for location search.
    Returns suggestions as user types.
    """
    if not q or len(q.strip()) < 2:
        return AutocompleteResponse(suggestions=[])
    
    try:
        suggestions_data = get_autocomplete_suggestions(
            q.strip(),
            limit=8,
            google_api_key=GOOGLE_MAPS_API_KEY
        )
        
        suggestions = [
            AutocompleteSuggestion(
                display_name=s["display_name"],
                name=s["name"],
                country=s.get("country"),
                latitude=s["latitude"],
                longitude=s["longitude"],
                source=s.get("source")
            )
            for s in suggestions_data
        ]
        
        return AutocompleteResponse(suggestions=suggestions)
    except Exception as e:
        logger.error(f"Autocomplete error: {str(e)}")
        return AutocompleteResponse(suggestions=[])


def dataframe_to_timeseries(df: pd.DataFrame) -> List[TimeSeriesPoint]:
    """
    Convert a DataFrame with 'time' and weather columns to List[TimeSeriesPoint].
    """
    if df.empty:
        return []

    points = []
    for _, row in df.iterrows():
        point = TimeSeriesPoint(
            time=row["time"].isoformat() if pd.notna(row["time"]) else "",
            temperature_2m=float(row["temperature_2m"]) if pd.notna(row.get("temperature_2m")) else None,
            relativehumidity_2m=float(row["relativehumidity_2m"]) if pd.notna(row.get("relativehumidity_2m")) else None,
            shortwave_radiation=float(row["shortwave_radiation"]) if pd.notna(row.get("shortwave_radiation")) else None,
            cloudcover=float(row["cloudcover"]) if pd.notna(row.get("cloudcover")) else None,
            precipitation=float(row["precipitation"]) if pd.notna(row.get("precipitation")) else None,
            pressure_msl=float(row["pressure_msl"]) if pd.notna(row.get("pressure_msl")) else None,
            wind_speed_10m=float(row["wind_speed_10m"]) if pd.notna(row.get("wind_speed_10m")) else None,
        )
        points.append(point)

    return points


def create_ml_forecast_df(historical_df: pd.DataFrame, forecast_df: pd.DataFrame, target_column: str) -> pd.DataFrame:
    """
    Train ML model and generate forecasts for a target column.
    Returns DataFrame with 'time' and the predicted values.
    """
    if historical_df.empty or forecast_df.empty:
        return pd.DataFrame(columns=["time", target_column])

    # Get historical series for this column
    historical_series = historical_df.set_index("time")[target_column]
    historical_series = historical_series.dropna()

    if len(historical_series) < 48:  # Need at least 48 hours of data
        logger.warning(f"Insufficient historical data for {target_column}, using API forecast only")
        return forecast_df[["time", target_column]].copy()

    try:
        # Train model
        model, lags = train_local_model(historical_series, lags=24)

        # Generate predictions for forecast horizon
        steps = len(forecast_df)
        predictions = forecast_with_model(model, historical_series, steps=steps, lags=lags)

        # Create result DataFrame
        ml_forecast = pd.DataFrame({
            "time": forecast_df["time"].values,
            target_column: predictions
        })

        return ml_forecast

    except Exception as e:
        logger.error(f"Error creating ML forecast for {target_column}: {str(e)}")
        # Fallback to API forecast
        return forecast_df[["time", target_column]].copy()


@app.post("/api/data", response_model=DataResponse)
async def get_weather_data(request: LocationRequest):
    """
    Main endpoint: geocode location, fetch weather data, train ML models, and return predictions.
    """
    try:
        # Step 1: Get coordinates - either from provided coordinates or geocode location
        if request.latitude is not None and request.longitude is not None:
            # Coordinates provided directly
            lat = request.latitude
            lon = request.longitude
            logger.info(f"Using provided coordinates: ({lat}, {lon})")
            
            # Reverse geocode to get location name
            try:
                reverse_geo = reverse_geocode(lat, lon, google_api_key=GOOGLE_MAPS_API_KEY)
                geo_data = {
                    "name": reverse_geo.get("display_name") or reverse_geo.get("name"),
                    "country": reverse_geo.get("country"),
                    "latitude": lat,
                    "longitude": lon,
                    "elevation": None  # Reverse geocoding doesn't typically provide elevation
                }
                logger.info(f"Reverse geocoded to: {geo_data.get('name')}")
            except Exception as e:
                logger.warning(f"Reverse geocoding failed: {str(e)}, using coordinates as name")
                geo_data = {
                    "name": f"{lat:.4f}, {lon:.4f}",
                    "country": None,
                    "latitude": lat,
                    "longitude": lon,
                    "elevation": None
                }
        elif request.location:
            # Location text provided - geocode it
            logger.info(f"Geocoding location: {request.location}")
            try:
                geo_data = geocode_location(request.location, google_api_key=GOOGLE_MAPS_API_KEY)
                lat = geo_data["latitude"]
                lon = geo_data["longitude"]
                logger.info(f"Successfully geocoded to: {geo_data.get('name')} at ({lat}, {lon})")
            except Exception as e:
                logger.error(f"Geocoding failed for '{request.location}': {str(e)}")
                raise
        else:
            raise ValueError("Either 'location' or 'latitude' and 'longitude' must be provided")

        # Step 2: Fetch historical data (with fallback)
        logger.info(f"Fetching historical data for {request.historical_days} days...")
        try:
            historical_df = fetch_historical(lat, lon, days=request.historical_days)
            if historical_df.empty:
                logger.warning("Historical data is empty, continuing with forecast only")
        except Exception as e:
            logger.warning(f"Failed to fetch historical data: {str(e)}, continuing with forecast only")
            historical_df = pd.DataFrame(columns=["time", "temperature_2m", "relativehumidity_2m", 
                                                  "shortwave_radiation", "cloudcover", "precipitation", 
                                                  "pressure_msl", "wind_speed_10m"])

        # Step 3: Fetch forecast data (required)
        logger.info(f"Fetching forecast data for {request.forecast_days} days...")
        forecast_df = fetch_forecast(lat, lon, days=request.forecast_days)
        
        if forecast_df.empty:
            raise ValueError("Failed to fetch forecast data. Please try again later.")

        # Step 4: Extract current conditions
        current = extract_current_from_forecast(forecast_df)

        # Step 5: Train ML models and generate forecasts for each target variable
        logger.info("Training ML models...")
        target_variables = ["temperature_2m", "shortwave_radiation", "wind_speed_10m"]

        ml_forecasts = {}
        for var in target_variables:
            if var in historical_df.columns and var in forecast_df.columns:
                ml_forecast_df = create_ml_forecast_df(historical_df, forecast_df, var)
                ml_forecasts[var] = ml_forecast_df

        # Step 6: Blend ML and API forecasts
        logger.info("Blending ML and API forecasts...")
        blended_df = forecast_df.copy()

        for var in target_variables:
            if var in ml_forecasts and not ml_forecasts[var].empty:
                ml_series = pd.Series(
                    ml_forecasts[var][var].values,
                    index=pd.to_datetime(ml_forecasts[var]["time"])
                )
                api_series = pd.Series(
                    forecast_df[var].values,
                    index=pd.to_datetime(forecast_df["time"])
                )

                try:
                    # Use higher ML weight (0.6) for better accuracy based on local patterns
                    blended_series = blend_ml_and_api(ml_series, api_series, alpha=0.6)
                    blended_df[var] = blended_series.values
                except Exception as e:
                    logger.warning(f"Could not blend {var}: {str(e)}, using API forecast only")

        # Step 7: Convert to response format
        ml_forecast_combined = forecast_df.copy()
        for var in target_variables:
            if var in ml_forecasts and not ml_forecasts[var].empty:
                ml_forecast_combined[var] = ml_forecasts[var][var].values

        response = DataResponse(
            location=LocationMetadata(
                resolved_name=geo_data["name"],
                country=geo_data.get("country"),
                latitude=lat,
                longitude=lon,
                elevation=geo_data.get("elevation")
            ),
            current=current,
            historical=dataframe_to_timeseries(historical_df),
            api_forecast=dataframe_to_timeseries(forecast_df),
            ml_forecast=dataframe_to_timeseries(ml_forecast_combined),
            blended_forecast=dataframe_to_timeseries(blended_df)
        )

        logger.info("Request completed successfully")
        return response

    except ValueError as e:
        error_msg = str(e)
        logger.error(f"Validation error: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        error_msg = f"Internal server error: {str(e)}"
        logger.error(f"Unexpected error: {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)

