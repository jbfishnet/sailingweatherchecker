export interface WeatherData {
  time: string;
  temp: number;
  windSpeed: number; // in km/h or m/s? I'll use km/h and convert to Beaufort
  windDirection: number;
  windGusts: number;
  cloudCover: number;
  precipitation: number;
  waveHeight?: number;
  weatherCode: number;
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
