import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Plus, Trash2, Wind, Sun, Waves, BellOff, RefreshCw, Search, Cloud } from 'lucide-react';
import { format } from 'date-fns';
import SpotMap from '../components/SpotMap';
import { kmhToBeaufort, windDirectionText, wmoToDescription, wmoToEmoji } from '../utils/weather';

const POLL_INTERVAL_MS = 15 * 60 * 1000;

export default function Dashboard() {
  const [spots, setSpots] = useState<any[]>([]);
  const [newSpot, setNewSpot] = useState({ name: '', lat: '', lon: '' });
  const [weather, setWeather] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pendingPin, setPendingPin] = useState<[number, number] | null>(null);
  const spotsRef = useRef<any[]>([]);

  useEffect(() => { spotsRef.current = spots; }, [spots]);

  const fetchWeather = useCallback(async (id: number) => {
    try {
      const res = await axios.get(`/api/weather/${id}`);
      setWeather(prev => ({ ...prev, [id]: res.data }));
    } catch (e) {
      console.error('Weather fetch failed for spot', id, e);
    }
  }, []);

  const fetchSpots = useCallback(async () => {
    const res = await axios.get('/api/spots');
    setSpots(res.data);
    res.data.forEach((s: any) => fetchWeather(s.id));
  }, [fetchWeather]);

  useEffect(() => {
    fetchSpots();
    const interval = setInterval(() => {
      spotsRef.current.forEach(s => fetchWeather(s.id));
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchSpots]);

  const addSpot = async () => {
    if (!newSpot.name || !newSpot.lat || !newSpot.lon) return;
    await axios.post('/api/spots', newSpot);
    setNewSpot({ name: '', lat: '', lon: '' });
    setPendingPin(null);
    fetchSpots();
  };

  const deleteSpot = async (id: number) => {
    await axios.delete(`/api/spots/${id}`);
    setWeather(prev => { const next = { ...prev }; delete next[id]; return next; });
    setSpots(prev => prev.filter(s => s.id !== id));
  };

  const refresh = async () => {
    setLoading(true);
    await axios.post('/api/refresh');
    await fetchSpots();
    setLoading(false);
  };

  const snooze = async (id: number) => {
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await axios.post(`/api/spots/${id}/snooze`, { until });
    setSpots(prev => prev.map(s => s.id === id ? { ...s, snooze_until: until } : s));
  };

  const unsnooze = async (id: number) => {
    await axios.post(`/api/spots/${id}/snooze`, { until: null });
    setSpots(prev => prev.map(s => s.id === id ? { ...s, snooze_until: null } : s));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await axios.get(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectResult = async (r: any) => {
    const lat = String(parseFloat(r.lat).toFixed(5));
    const lon = String(parseFloat(r.lon).toFixed(5));
    const name = r.name || r.display_name?.split(',')[0] || searchQuery;
    setSearchResults([]);
    setSearchQuery('');
    await axios.post('/api/spots', { name, lat, lon });
    setPendingPin(null);
    fetchSpots();
  };

  const handleMapClick = (lat: number, lon: number) => {
    const latStr = lat.toFixed(5);
    const lonStr = lon.toFixed(5);
    setNewSpot(prev => ({ ...prev, lat: latStr, lon: lonStr }));
    setPendingPin([lat, lon]);
    setSearchResults([]);
  };

  return (
    <div>
      {/* Map — full viewport width, breaks out of the max-w container */}
      <SpotMap spots={spots} weather={weather} pendingPin={pendingPin} onMapClick={handleMapClick} />

      {/* All content below is constrained to max-w-4xl */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 pb-8 space-y-8">

        {/* Add Spot Panel */}
        <div className="glass-card p-5 space-y-4">
          <p className="text-xs uppercase font-bold opacity-50 tracking-widest">Add a Sailspot — click map or search</p>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <input
                className="flex-1 bg-slate-800 p-2.5 rounded neon-border focus:outline-none text-sm"
                placeholder="Hamburg, Kiel or 53.5,9.9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} disabled={searchLoading} className="bg-slate-700 px-3 rounded hover:bg-slate-600 transition-colors">
                <Search size={18} className={searchLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            <input className="w-full md:w-36 bg-slate-800 p-2.5 rounded text-sm" placeholder="Name" value={newSpot.name} onChange={e => setNewSpot({ ...newSpot, name: e.target.value })} />
            <input className="w-full md:w-28 bg-slate-800 p-2.5 rounded text-sm" placeholder="Lat" value={newSpot.lat} onChange={e => setNewSpot({ ...newSpot, lat: e.target.value })} />
            <input className="w-full md:w-28 bg-slate-800 p-2.5 rounded text-sm" placeholder="Lon" value={newSpot.lon} onChange={e => setNewSpot({ ...newSpot, lon: e.target.value })} />
            <button
              onClick={addSpot}
              disabled={!newSpot.name || !newSpot.lat || !newSpot.lon}
              className="bg-neon-blue text-slate-900 font-bold px-5 py-2.5 rounded flex items-center gap-1 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Plus size={18} /> Add
            </button>
          </div>

          {/* Search results — inline, pushes content down rather than overlaying it */}
          {searchResults.length > 0 && (
            <div className="rounded-lg border border-neon-blue overflow-hidden"
                 style={{ boxShadow: '0 0 0 1px rgba(0,242,255,0.3)' }}>
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => selectResult(r)}
                  className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 text-sm border-b border-slate-700 last:border-b-0 transition-colors leading-snug"
                >
                  <span className="font-medium">{r.display_name?.split(',')[0]}</span>
                  <span className="text-xs opacity-50 ml-2">{r.display_name?.split(',').slice(1, 3).join(',')}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black uppercase tracking-widest neon-text">Your Sailspots</h2>
          <button
            onClick={refresh}
            className="flex items-center gap-2 text-sm bg-slate-800 px-4 py-2 rounded-full hover:bg-slate-700 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

      </div> {/* end max-w-4xl container */}

      {/* Spot Cards — full viewport width, wrap when window narrows */}
      <div className="px-4 md:px-8 pb-8 mt-2">
        {spots.length === 0 && (
          <div className="glass-card p-12 text-center opacity-40">
            <p className="text-lg">No spots yet. Click on the map or search to add your first sailspot.</p>
          </div>
        )}
        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))' }}>
        {spots.map(spot => {
          const w = weather[spot.id];
          const isSnoozed = spot.snooze_until && new Date(spot.snooze_until) > new Date();
          const bft = w ? kmhToBeaufort(w.windSpeed) : null;
          const gustBft = w ? kmhToBeaufort(w.windGusts) : null;

          return (
            <div key={spot.id} className="glass-card group flex flex-col">
              {/* Card header */}
              <div className="p-5 pb-3">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold leading-tight">{spot.name}</h3>
                    <p className="text-xs opacity-40">{Number(spot.lat).toFixed(3)}°N, {Number(spot.lon).toFixed(3)}°E</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Status badge */}
                    {w && !isSnoozed && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${w.isGood ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'}`}>
                        {w.isGood ? '⛵ Sailable' : '⛔ No go'}
                      </span>
                    )}
                    {isSnoozed && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                        😴 Snoozed
                      </span>
                    )}
                  </div>
                </div>

                {w ? (
                  <>
                    {/* Current conditions grid */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                        <Wind className="mx-auto mb-1 text-neon-blue" size={16} />
                        <div className="text-base font-bold">{bft} Bft</div>
                        <div className="text-[10px] opacity-50 uppercase">{windDirectionText(w.windDirection)}</div>
                      </div>
                      <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                        <Sun className="mx-auto mb-1 text-yellow-400" size={16} />
                        <div className="text-base font-bold">{w.temp}°C</div>
                        <div className="text-[10px] opacity-50 uppercase">Temp</div>
                      </div>
                      <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                        <Waves className="mx-auto mb-1 text-blue-400" size={16} />
                        <div className="text-base font-bold">{w.waveHeight != null ? `${w.waveHeight}m` : '—'}</div>
                        <div className="text-[10px] opacity-50 uppercase">Waves</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                        <Wind className="mx-auto mb-1 text-orange-400" size={14} />
                        <div className="text-sm font-bold">{gustBft} Bft</div>
                        <div className="text-[10px] opacity-50 uppercase">Gusts</div>
                      </div>
                      <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-slate-700 col-span-1">
                        <div className="text-lg mb-0.5">{wmoToEmoji(w.weatherCode)}</div>
                        <div className="text-[10px] opacity-70 leading-tight">{wmoToDescription(w.weatherCode)}</div>
                      </div>
                      <div className="text-center p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                        <Cloud className="mx-auto mb-1 text-slate-400" size={14} />
                        <div className="text-sm font-bold">{w.cloudCover}%</div>
                        <div className="text-[10px] opacity-50 uppercase">Cloud</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-24 flex items-center justify-center opacity-30 text-sm">Loading weather…</div>
                )}
              </div>

              {/* 7-day forecast strip */}
              {w?.daily && (
                <div className="flex border-t border-slate-700">
                  {w.daily.slice(0, 7).map((day: any, i: number) => {
                    const dayBft = kmhToBeaufort(day.windSpeedMax);
                    const isGoodWind = dayBft >= 2 && dayBft <= 4;
                    return (
                      <div
                        key={i}
                        className={`flex-1 text-center py-2 px-0.5 border-r border-slate-700 last:border-r-0 ${isGoodWind ? 'bg-green-900/20' : ''}`}
                      >
                        <div className="text-[9px] opacity-50 uppercase font-bold">
                          {format(new Date(day.date + 'T12:00:00'), 'EEE')}
                        </div>
                        <div className="text-sm my-0.5">{wmoToEmoji(day.weatherCode)}</div>
                        <div className={`text-[10px] font-bold ${isGoodWind ? 'text-green-400' : 'opacity-60'}`}>
                          {dayBft}Bft
                        </div>
                        <div className="text-[9px] opacity-40">{Math.round(day.tempMax)}°</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Card footer */}
              <div className="bg-slate-800/60 px-4 py-2 flex justify-between items-center text-xs">
                <span className="opacity-40">
                  {w ? `Updated ${format(new Date(), 'HH:mm')}` : 'Fetching…'}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => isSnoozed ? unsnooze(spot.id) : snooze(spot.id)}
                    className={`p-1.5 rounded hover:bg-slate-700 transition-colors ${isSnoozed ? 'text-yellow-400' : 'opacity-30 hover:opacity-60'}`}
                    title={isSnoozed ? 'Un-snooze' : 'Snooze 24h'}
                  >
                    <BellOff size={14} />
                  </button>
                  <button
                    onClick={() => deleteSpot(spot.id)}
                    className="p-1.5 rounded hover:bg-red-900/40 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete spot"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div> {/* end full-width cards section */}
    </div>
  );
}
