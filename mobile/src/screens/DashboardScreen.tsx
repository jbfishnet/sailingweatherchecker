import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../App';
import SpotCard from '../components/SpotCard';
import type {Spot, WeatherData, GeocodeResult} from '../api/types';
import {
  listSpots,
  createSpot,
  deleteSpot,
  getWeather,
  refreshAll,
  geocode,
  loadBaseUrl,
} from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({navigation}: Props) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [weather, setWeather] = useState<Record<number, WeatherData>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add-spot form
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);

  const loadWeather = useCallback(async (list: Spot[]) => {
    const entries = await Promise.all(
      list.map(async s => {
        try {
          return [s.id, await getWeather(s.id)] as const;
        } catch {
          return [s.id, undefined] as const;
        }
      }),
    );
    setWeather(prev => {
      const next = {...prev};
      for (const [id, w] of entries) {
        if (w) next[id] = w;
      }
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await listSpots();
      setSpots(list);
      await loadWeather(list);
    } catch (e: any) {
      setError(`Could not reach backend. Check the URL in Settings.\n${e?.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }, [loadWeather]);

  useEffect(() => {
    (async () => {
      await loadBaseUrl();
      await load();
    })();
  }, [load]);

  // Reload when returning from Settings (base URL may have changed).
  useEffect(() => navigation.addListener('focus', load), [navigation, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } catch {
      // best-effort; still refetch below
    }
    await load();
    setRefreshing(false);
  }, [load]);

  const onSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      setResults(await geocode(query.trim()));
    } catch (e: any) {
      Alert.alert('Search failed', e?.message ?? String(e));
    } finally {
      setSearching(false);
    }
  }, [query]);

  const onPick = useCallback(
    async (r: GeocodeResult) => {
      try {
        await createSpot({
          name: r.name || r.display_name.split(',')[0],
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
        });
        setQuery('');
        setResults([]);
        await load();
      } catch (e: any) {
        Alert.alert('Could not add spot', e?.message ?? String(e));
      }
    },
    [load],
  );

  const onDelete = useCallback(
    (id: number) => {
      Alert.alert('Delete spot?', 'This removes the spot and its alerts.', [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSpot(id);
              await load();
            } catch (e: any) {
              Alert.alert('Delete failed', e?.message ?? String(e));
            }
          },
        },
      ]);
    },
    [load],
  );

  return (
    <View style={styles.container}>
      <View style={styles.addBox}>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Search place or 'lat,lon'"
            placeholderTextColor="#6b7280"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={onSearch}
            autoCapitalize="none"
          />
          <Pressable style={styles.searchBtn} onPress={onSearch}>
            {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchText}>Search</Text>}
          </Pressable>
        </View>
        {results.map((r, i) => (
          <Pressable key={`${r.lat},${r.lon},${i}`} style={styles.result} onPress={() => onPick(r)}>
            <Text style={styles.resultText} numberOfLines={1}>
              {r.display_name}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop: 40}} size="large" color="#38bdf8" />
      ) : (
        <FlatList
          data={spots}
          keyExtractor={s => String(s.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
          renderItem={({item}) => (
            <SpotCard spot={item} weather={weather[item.id]} loading={refreshing} onDelete={onDelete} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              {error ? (
                <Text style={styles.error}>{error}</Text>
              ) : (
                <Text style={styles.muted}>No spots yet. Search above to add one.</Text>
              )}
            </View>
          }
          contentContainerStyle={spots.length === 0 ? {flexGrow: 1} : {paddingVertical: 6}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#030712'},
  addBox: {padding: 12, borderBottomWidth: 1, borderBottomColor: '#1f2937'},
  row: {flexDirection: 'row'},
  input: {
    flex: 1,
    backgroundColor: '#111827',
    color: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  searchBtn: {
    marginLeft: 8,
    backgroundColor: '#0369a1',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchText: {color: '#fff', fontWeight: '600'},
  result: {paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f2937'},
  resultText: {color: '#cbd5e1'},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24},
  muted: {color: '#6b7280', textAlign: 'center'},
  error: {color: '#f87171', textAlign: 'center'},
});
