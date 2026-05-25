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
  windSpeed: number; // km/h — convert with kmhToBeaufort
  windDirection: number;
  windGusts: number;
  cloudCover: number;
  precipitation: number;
  waveHeight?: number;
  weatherCode: number;
  daily: DailyForecast[];
}

export interface Spot {
  id: number;
  name: string;
  lat: number;
  lon: number;
  snooze_until?: string | null;
}

export interface AppSettings {
  minBeaufort: number;
  maxBeaufort: number;
  sunnyOnly: boolean;
  minTemp: number;
  maxPrecipitation: number;
  maxGusts: number;
  maxWaveHeight: number;
  twilioSid?: string;
  twilioToken?: string;
  twilioFrom?: string;
  twilioTo?: string;
  emailHost?: string;
  emailPort?: number;
  emailUser?: string;
  emailPass?: string;
  emailFrom?: string;
  emailTo?: string;
  teamsWebhook?: string;
}
