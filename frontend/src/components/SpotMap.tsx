import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { kmhToBeaufort, wmoToEmoji } from '../utils/weather';

// Fix Leaflet default icon paths broken by Vite's asset bundling
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({ iconUrl, iconRetinaUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
L.Marker.mergeOptions({ icon: DefaultIcon });

const GoodIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
const BadIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });

interface SpotMapProps {
  spots: any[];
  weather: Record<number, any>;
  pendingPin: [number, number] | null;
  onMapClick: (lat: number, lon: number) => void;
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({ click: e => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function SpotMap({ spots, weather, pendingPin, onMapClick }: SpotMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (spots.length > 0) return [spots[0].lat, spots[0].lon];
    return [54.5, 10.0]; // Default: Baltic Sea / North Germany
  }, [spots.length === 0]);

  return (
    <div className="border-y border-slate-700 mb-6" style={{ height: 450 }}>
      <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }} className="z-0">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ClickHandler onMapClick={onMapClick} />

        {spots.map(spot => {
          const w = weather[spot.id];
          const icon = !w ? DefaultIcon : w.isGood ? GoodIcon : BadIcon;
          return (
            <Marker key={spot.id} position={[Number(spot.lat), Number(spot.lon)]} icon={icon}>
              <Popup>
                <div style={{ minWidth: 140, fontFamily: 'sans-serif' }}>
                  <strong>{spot.name}</strong>
                  {w && (
                    <div style={{ marginTop: 4, fontSize: 13 }}>
                      {wmoToEmoji(w.weatherCode)} {kmhToBeaufort(w.windSpeed)} Bft &bull; {w.temp}°C
                      {w.waveHeight != null && ` · ${w.waveHeight}m swell`}
                      <br />
                      <span style={{ color: w.isGood ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                        {w.isGood ? '⛵ Sailable' : '⛔ No go'}
                      </span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {pendingPin && (
          <Marker position={pendingPin} opacity={0.7}>
            <Popup>New spot here</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
