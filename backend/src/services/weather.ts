import axios from 'axios';
import { WeatherData, DailyForecast } from '../types/weather.js';
import { kmhToBeaufort } from '../utils/beaufort.js';

export async function getWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=auto`;

  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height&timezone=auto`;

  const [weatherRes, marineRes] = await Promise.allSettled([
    axios.get(url),
    axios.get(marineUrl)
  ]);

  if (weatherRes.status === 'rejected') {
    throw new Error('Failed to fetch weather data');
  }

  const current = weatherRes.value.data.current;
  const dailyRaw = weatherRes.value.data.daily;

  let waveHeight = undefined;
  if (marineRes.status === 'fulfilled') {
    waveHeight = marineRes.value.data.current?.wave_height ?? undefined;
  }

  const daily: DailyForecast[] = (dailyRaw.time as string[]).map((date, i) => ({
    date,
    weatherCode: dailyRaw.weather_code[i],
    tempMax: dailyRaw.temperature_2m_max[i],
    tempMin: dailyRaw.temperature_2m_min[i],
    windSpeedMax: dailyRaw.wind_speed_10m_max[i],
    windGustsMax: dailyRaw.wind_gusts_10m_max[i],
    windDirection: dailyRaw.wind_direction_10m_dominant[i],
    precipitationSum: dailyRaw.precipitation_sum[i],
  }));

  return {
    time: current.time,
    temp: current.temperature_2m,
    windSpeed: current.wind_speed_10m,
    windDirection: current.wind_direction_10m,
    windGusts: current.wind_gusts_10m,
    cloudCover: current.cloud_cover,
    precipitation: current.precipitation,
    weatherCode: current.weather_code,
    waveHeight,
    daily,
  };
}

export function isGoodConditions(data: WeatherData, settings: any): boolean {
  const bft = kmhToBeaufort(data.windSpeed);

  const windOk = bft >= Number(settings.minBeaufort) && bft <= Number(settings.maxBeaufort);
  const gustsOk = data.windGusts <= Number(settings.maxGusts || 100);
  const tempOk = data.temp >= Number(settings.minTemp || -100);
  const precipOk = data.precipitation <= Number(settings.maxPrecipitation || 100);
  const wavesOk = !settings.maxWaveHeight || Number(settings.maxWaveHeight) === 0 || (data.waveHeight || 0) <= Number(settings.maxWaveHeight);

  const sunnyOk = (settings.sunnyOnly === 'false' || settings.sunnyOnly === false) || (data.cloudCover < 30 && [0, 1, 2].includes(data.weatherCode));

  return windOk && gustsOk && tempOk && precipOk && wavesOk && sunnyOk;
}
