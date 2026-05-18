import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Wind, Sun, Waves, BellOff, RefreshCw, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [spots, setSpots] = useState<any[]>([]);
  const [newSpot, setNewSpot] = useState({ name: '', lat: '', lon: '' });
  const [weather, setWeather] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSpots = async () => {
    const res = await axios.get('/api/spots');
    setSpots(res.data);
    res.data.forEach((s: any) => fetchWeather(s.id));
  };

  const fetchWeather = async (id: number) => {
    try {
      const res = await axios.get(`/api/weather/${id}`);
      setWeather((prev: any) => ({ ...prev, [id]: res.data }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  const addSpot = async () => {
    if (!newSpot.name || !newSpot.lat || !newSpot.lon) return;
    await axios.post('/api/spots', newSpot);
    setNewSpot({ name: '', lat: '', lon: '' });
    fetchSpots();
  };

  const deleteSpot = async (id: number) => {
    await axios.delete(`/api/spots/${id}`);
    fetchSpots();
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
    fetchSpots();
  };

  const parseSearch = async () => {
    // Basic coordinate extraction from string
    const coordsMatch = searchQuery.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (coordsMatch) {
      setNewSpot({ ...newSpot, lat: coordsMatch[1], lon: coordsMatch[2] });
      return;
    }
    // Attempt Nominatim search
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
      if (res.data.length > 0) {
        const first = res.data[0];
        setNewSpot({ name: first.display_name.split(',')[0], lat: first.lat, lon: first.lon });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-xs uppercase font-bold opacity-50">Search or Paste Coords/Link</label>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-slate-800 p-2 rounded neon-border focus:outline-none"
              placeholder="Hamburg or 53.5, 9.9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button onClick={parseSearch} className="bg-slate-700 p-2 rounded hover:bg-slate-600">
              <Search size={20} />
            </button>
          </div>
        </div>
        <div className="w-full md:w-32 space-y-2">
          <label className="text-xs uppercase font-bold opacity-50">Name</label>
          <input className="w-full bg-slate-800 p-2 rounded" value={newSpot.name} onChange={e => setNewSpot({...newSpot, name: e.target.value})} />
        </div>
        <div className="w-full md:w-32 space-y-2">
          <label className="text-xs uppercase font-bold opacity-50">Lat</label>
          <input className="w-full bg-slate-800 p-2 rounded" value={newSpot.lat} onChange={e => setNewSpot({...newSpot, lat: e.target.value})} />
        </div>
        <div className="w-full md:w-32 space-y-2">
          <label className="text-xs uppercase font-bold opacity-50">Lon</label>
          <input className="w-full bg-slate-800 p-2 rounded" value={newSpot.lon} onChange={e => setNewSpot({...newSpot, lon: e.target.value})} />
        </div>
        <button onClick={addSpot} className="bg-neon-blue text-slate-900 p-2 rounded h-10 w-10 flex items-center justify-center hover:bg-white transition-colors">
          <Plus />
        </button>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black uppercase tracking-widest neon-text">Your Sailspots</h2>
        <button onClick={refresh} className={`flex items-center gap-2 text-sm bg-slate-800 px-4 py-2 rounded-full hover:bg-slate-700 ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {spots.map(spot => {
          const w = weather[spot.id];
          const isSnoozed = spot.snooze_until && new Date(spot.snooze_until) > new Date();

          return (
            <div key={spot.id} className="glass-card group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{spot.name}</h3>
                    <p className="text-xs opacity-50">{spot.lat}, {spot.lon}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => snooze(spot.id)} className={`p-2 rounded hover:bg-slate-800 ${isSnoozed ? 'text-yellow-500' : 'opacity-30'}`}>
                      <BellOff size={18} />
                    </button>
                    <button onClick={() => deleteSpot(spot.id)} className="p-2 rounded hover:bg-red-900/30 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {w ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <Wind className="mx-auto mb-1 text-neon-blue" size={20} />
                      <div className="text-lg font-bold">{(w.windSpeed / 3.6).toFixed(1)}</div>
                      <div className="text-[10px] uppercase opacity-50">m/s</div>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <Sun className="mx-auto mb-1 text-yellow-400" size={20} />
                      <div className="text-lg font-bold">{w.temp}°C</div>
                      <div className="text-[10px] uppercase opacity-50">Temp</div>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <Waves className="mx-auto mb-1 text-blue-400" size={20} />
                      <div className="text-lg font-bold">{w.waveHeight || '0.0'}</div>
                      <div className="text-[10px] uppercase opacity-50">Waves (m)</div>
                    </div>
                  </div>
                ) : (
                  <div className="h-20 flex items-center justify-center opacity-30">Loading weather...</div>
                )}
              </div>
              <div className="bg-slate-800/80 p-2 px-6 text-xs flex justify-between">
                <span>Next Week: Clear</span>
                <span>Updated: {format(new Date(), 'HH:mm')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
