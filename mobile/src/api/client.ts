import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Spot, WeatherData, GeocodeResult} from './types';

// The phone must be told where the LAN backend lives. Default to the k3s
// LoadBalancer address; override in the Settings screen (persisted below).
export const DEFAULT_BASE_URL = 'http://192.168.1.22:9921';
const BASE_URL_KEY = 'sailing.baseUrl';

const api = axios.create({baseURL: DEFAULT_BASE_URL, timeout: 15000});

export async function loadBaseUrl(): Promise<string> {
  const stored = await AsyncStorage.getItem(BASE_URL_KEY);
  const url = stored?.trim() || DEFAULT_BASE_URL;
  api.defaults.baseURL = url;
  return url;
}

export async function setBaseUrl(url: string): Promise<void> {
  const clean = url.trim().replace(/\/+$/, '');
  await AsyncStorage.setItem(BASE_URL_KEY, clean);
  api.defaults.baseURL = clean;
}

export function getBaseUrl(): string {
  return api.defaults.baseURL ?? DEFAULT_BASE_URL;
}

// ── Spots ────────────────────────────────────────────────────────────────
export async function listSpots(): Promise<Spot[]> {
  const {data} = await api.get<Spot[]>('/api/spots');
  return data;
}

export async function createSpot(input: {name: string; lat: number; lon: number}): Promise<Spot> {
  const {data} = await api.post<Spot>('/api/spots', input);
  return data;
}

export async function deleteSpot(id: number): Promise<void> {
  await api.delete(`/api/spots/${id}`);
}

// ── Weather ──────────────────────────────────────────────────────────────
export async function getWeather(spotId: number): Promise<WeatherData> {
  const {data} = await api.get<WeatherData>(`/api/weather/${spotId}`);
  return data;
}

export async function refreshAll(): Promise<void> {
  await api.post('/api/refresh');
}

// ── Geocoding ──────────────────────────────────────────────────────────────
export async function geocode(query: string): Promise<GeocodeResult[]> {
  const {data} = await api.get<GeocodeResult[]>('/api/geocode', {params: {q: query}});
  return data;
}

export default api;
