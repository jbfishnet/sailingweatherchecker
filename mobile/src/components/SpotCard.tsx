import React from 'react';
import {View, Text, StyleSheet, ScrollView, Pressable} from 'react-native';
import type {Spot, WeatherData} from '../api/types';
import {kmhToBeaufort, windDirectionText, wmoToEmoji, wmoToDescription} from '../utils/weather';

interface Props {
  spot: Spot;
  weather?: WeatherData;
  loading?: boolean;
  onDelete?: (id: number) => void;
}

export default function SpotCard({spot, weather, loading, onDelete}: Props) {
  const good = weather?.isGood ?? false;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{flex: 1}}>
          <Text style={styles.name}>{spot.name}</Text>
          <Text style={styles.coords}>
            {spot.lat.toFixed(3)}, {spot.lon.toFixed(3)}
          </Text>
        </View>
        {weather && (
          <View style={[styles.badge, good ? styles.badgeGood : styles.badgeBad]}>
            <Text style={styles.badgeText}>{good ? '⛵ Sailable' : '⛔ No go'}</Text>
          </View>
        )}
      </View>

      {loading && !weather && <Text style={styles.muted}>Loading conditions…</Text>}

      {weather && (
        <>
          <View style={styles.grid}>
            <Metric
              label="Wind"
              value={`${kmhToBeaufort(weather.windSpeed)} Bft ${windDirectionText(weather.windDirection)}`}
            />
            <Metric label="Temp" value={`${Math.round(weather.temp)}°C`} />
            <Metric
              label="Waves"
              value={weather.waveHeight != null ? `${weather.waveHeight.toFixed(1)} m` : '—'}
            />
            <Metric label="Gusts" value={`${kmhToBeaufort(weather.windGusts)} Bft`} />
            <Metric label="Sky" value={`${wmoToEmoji(weather.weatherCode)} ${wmoToDescription(weather.weatherCode)}`} />
            <Metric label="Cloud" value={`${Math.round(weather.cloudCover)}%`} />
          </View>

          {weather.daily?.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecast}>
              {weather.daily.slice(0, 7).map(day => {
                const bft = kmhToBeaufort(day.windSpeedMax);
                const goodWind = bft >= 2 && bft <= 4;
                return (
                  <View key={day.date} style={[styles.dayCol, goodWind && styles.dayGood]}>
                    <Text style={styles.dayName}>{shortDay(day.date)}</Text>
                    <Text style={styles.dayEmoji}>{wmoToEmoji(day.weatherCode)}</Text>
                    <Text style={styles.daySmall}>{bft} Bft</Text>
                    <Text style={styles.daySmall}>{Math.round(day.tempMax)}°</Text>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </>
      )}

      {onDelete && (
        <Pressable onPress={() => onDelete(spot.id)} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      )}
    </View>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function shortDay(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, {weekday: 'short'});
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  header: {flexDirection: 'row', alignItems: 'center'},
  name: {color: '#e5e7eb', fontSize: 18, fontWeight: '700'},
  coords: {color: '#6b7280', fontSize: 12, marginTop: 2},
  badge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999},
  badgeGood: {backgroundColor: '#065f46'},
  badgeBad: {backgroundColor: '#7f1d1d'},
  badgeText: {color: '#fff', fontWeight: '600', fontSize: 12},
  muted: {color: '#6b7280', marginTop: 8},
  grid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 12},
  metric: {width: '33%', paddingVertical: 6},
  metricLabel: {color: '#6b7280', fontSize: 11},
  metricValue: {color: '#e5e7eb', fontSize: 14, fontWeight: '600'},
  forecast: {marginTop: 12},
  dayCol: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 6,
    backgroundColor: '#0b1220',
  },
  dayGood: {backgroundColor: '#064e3b'},
  dayName: {color: '#9ca3af', fontSize: 11},
  dayEmoji: {fontSize: 18, marginVertical: 2},
  daySmall: {color: '#d1d5db', fontSize: 11},
  deleteBtn: {marginTop: 12, alignSelf: 'flex-start'},
  deleteText: {color: '#f87171', fontSize: 13},
});
