import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Language } from '../types';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Configure standard Leaflet default marker icon for Vite bundle compatibility
delete (L.Icon.Default.prototype as any)._getIconUrl;
const defaultMarkerIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultMarkerIcon;

interface LocationMapProps {
  coords: { lat: number; lng: number };
  onChangeCoords: (coords: { lat: number; lng: number }) => void;
  lang: Language;
  address?: string;
}

// Subcomponent to smoothly pan / fly to updated coords (GPS or ward selection)
function MapRecenter({ coords }: { coords: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.lat && coords.lng) {
      map.flyTo([coords.lat, coords.lng], map.getZoom() || 15, {
        animate: true,
        duration: 0.8,
      });
    }
  }, [coords.lat, coords.lng, map]);
  return null;
}

// Subcomponent to handle map clicks to move marker
function MapEventsHandler({ onLocationChange }: { onLocationChange: (coords: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function LocationMap({ coords, onChangeCoords, lang, address }: LocationMapProps) {
  const markerRef = useRef<L.Marker>(null);

  // Drag event handler for marker
  const markerEventHandlers = useMemo(
    () => ({
      dragend(e: any) {
        const marker = markerRef.current || e.target;
        if (marker) {
          const latlng = marker.getLatLng();
          onChangeCoords({ lat: latlng.lat, lng: latlng.lng });
        }
      },
    }),
    [onChangeCoords]
  );

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        isolation: 'isolate',
        zIndex: 1,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div style={{ height: '260px', width: '100%', position: 'relative' }}>
        <MapContainer
          center={[coords.lat, coords.lng]}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Map Click Listener */}
          <MapEventsHandler onLocationChange={onChangeCoords} />

          {/* Smooth Recenter when coords prop updates */}
          <MapRecenter coords={coords} />

          {/* Draggable Marker */}
          <Marker
            draggable={true}
            eventHandlers={markerEventHandlers}
            position={[coords.lat, coords.lng]}
            icon={defaultMarkerIcon}
            ref={markerRef}
          >
            <Popup>
              <div style={{ fontSize: '0.8125rem' }}>
                <strong style={{ color: 'var(--primary-forest)' }}>
                  {lang === 'mr' ? 'निवडलेले स्थान' : lang === 'hi' ? 'चयनित स्थान' : 'Selected Location'}
                </strong>
                <br />
                {address || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`}
                <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#666' }}>
                  {lang === 'mr' ? 'पिन ड्रॅग करून स्थान बदलू शकता' : 'Drag pin to adjust'}
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Lat/Long bar with instructional helper */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.45rem 0.75rem',
          background: 'var(--warm-beige-light)',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary-forest)' }}>
            pin_drop
          </span>
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: 'var(--text-main)' }}>
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--primary-forest)', fontWeight: 600 }}>
          {lang === 'mr'
            ? '📍 नकाशावर क्लिक करा किंवा पिन ड्रॅग करा'
            : lang === 'hi'
            ? '📍 नक़्शे पर क्लिक करें या पिन खींचें'
            : '📍 Click map or drag pin to adjust'}
        </div>
      </div>
    </div>
  );
}

export default LocationMap;
