import axios from 'axios';
import { DataResponse, LocationRequest } from '../types';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function fetchLocationData(req: LocationRequest): Promise<DataResponse> {
  const payload: any = {
    historical_days: req.historical_days || 60,
    forecast_days: req.forecast_days || 7,
  };
  
  // Include location or coordinates
  if (req.location) {
    payload.location = req.location;
  } else if (req.latitude !== undefined && req.longitude !== undefined) {
    payload.latitude = req.latitude;
    payload.longitude = req.longitude;
  }
  
  const response = await axios.post<DataResponse>(
    `${API_BASE_URL}/api/data`,
    payload
  );
  return response.data;
}

export async function healthCheck(): Promise<{ status: string }> {
  const response = await axios.get(`${API_BASE_URL}/health`);
  return response.data;
}

export async function reverseGeocode(lat: number, lon: number): Promise<any> {
  const response = await axios.get(
    `${API_BASE_URL}/api/reverse-geocode`,
    { params: { latitude: lat, longitude: lon } }
  );
  return response.data;
}
