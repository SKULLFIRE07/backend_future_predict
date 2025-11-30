export interface LocationMetadata {
  resolved_name: string;
  country: string | null;
  latitude: number;
  longitude: number;
  elevation: number | null;
}

export interface TimeSeriesPoint {
  time: string;
  temperature_2m: number | null;
  shortwave_radiation: number | null;
  wind_speed_10m: number | null;
  relativehumidity_2m: number | null;
  cloudcover: number | null;
  precipitation: number | null;
  pressure_msl: number | null;
}

export interface DataResponse {
  location: LocationMetadata;
  current: Record<string, number>;
  historical: TimeSeriesPoint[];
  api_forecast: TimeSeriesPoint[];
  ml_forecast: TimeSeriesPoint[];
  blended_forecast: TimeSeriesPoint[];
}

export interface LocationRequest {
  location?: string;
  latitude?: number;
  longitude?: number;
  historical_days?: number;
  forecast_days?: number;
}

