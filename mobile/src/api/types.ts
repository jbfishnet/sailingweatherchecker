// Shapes mirror the backend contract (backend/src/routes/*, backend/src/types/weather.ts).

export interface Spot {
  id: number;
  name: string;
  lat: number;
  lon: number;
  snooze_until?: string | null;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  windSpeedMax: number;
  windGustsMax: number;
  windDirection: number;
  precipitationSum: number;
}

export interface WeatherData {
  time: string;
  temp: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  cloudCover: number;
  precipitation: number;
  weatherCode: number;
  waveHeight?: number;
  isGood: boolean;
  daily: DailyForecast[];
}

export interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
}
