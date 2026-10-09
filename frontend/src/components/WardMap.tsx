import React, { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Language, WardStat, Ward } from '../types';
import { PUNE_WARDS } from '../data/mockData';

// Safe number helper
function safeNum(val: any, fallback = 0): number {
  const n = Number(val);
  return typeof n === 'number' && !isNaN(n) && isFinite(n) ? n : fallback;
}

// Brand color mapping for the 10 official wards
const WARD_COLORS: Record<number, string> = {
  1: '#344F1F', // Shivajinagar (Forest Green)
  2: '#F4991A', // Kasba Peth (Saffron)
  3: '#344F1F', // Aundh-Baner (Forest Green)
  4: '#283D18', // Kothrud (Deep Forest)
  5: '#F4991A', // Hadapsar (Saffron)
  6: '#344F1F', // Yerawada (Forest Green)
  7: '#283D18', // Bibwewadi (Deep Forest)
  8: '#F4991A', // Sinhagad Rd (Saffron)
  9: '#344F1F', // Warje (Forest Green)
  10: '#283D18' // Nagar Road (Deep Forest)
};

interface WardMapProps {
  wardStats: WardStat[];
  selectedFilterWard: string;
  onSelectWard: (wardId: number) => void;
  lang: Language;
}

/**
 * Subcomponent to smoothly pan / fly to the selected ward or reset to Pune overview.
 * Also invalidates map size to ensure all tiles render edge-to-edge.
 */
function MapController({
  selectedFilterWard,
  wardMarkersRef,
}: {
  selectedFilterWard: string;
  wardMarkersRef: React.MutableRefObject<Record<number, L.Marker | null>>;
}) {
  const map = useMap();

  // Invalidate size once after mount so tiles render cleanly
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  // Recenter or fly to selected ward
  useEffect(() => {
    if (selectedFilterWard !== 'all') {
      const wardId = Number(selectedFilterWard);
      const ward = PUNE_WARDS.find((w) => w.id === wardId);
      if (ward && isFinite(ward.lat) && isFinite(ward.lng)) {
        map.flyTo([ward.lat, ward.lng], 14, {
          animate: true,
          duration: 0.8,
        });

        // Open popup for selected ward
        const marker = wardMarkersRef.current[wardId];
        if (marker) {
          setTimeout(() => {
            marker.openPopup();
          }, 350);
        }
      }
    } else {
      map.flyTo([18.5204, 73.8567], 12, {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedFilterWard, map, wardMarkersRef]);

  return null;
}

/**
 * Creates custom L.divIcon for ward centroid markers.
 * Displays ward ID, complaint count badge, and ward name label.
 */
function createWardDivIcon(
  ward: Ward,
  totalComplaints: number,
  isSelected: boolean,
  color: string
): L.DivIcon {
  const size = isSelected ? 38 : 32;
  const pulseStyle = isSelected
    ? 'box-shadow: 0 0 0 5px rgba(244, 153, 26, 0.45), 0 4px 14px rgba(0,0,0,0.35); transform: scale(1.12);'
    : 'box-shadow: 0 3px 8px rgba(0,0,0,0.22);';

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${isSelected ? '#F4991A' : color};
        border: 2.5px solid #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-weight: 800;
        font-size: ${isSelected ? '14px' : '12px'};
        transition: all 0.2s ease;
        ${pulseStyle}
      ">
        <span>${ward.id}</span>
      </div>
      <div style="
        margin-top: 3px;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid ${isSelected ? '#F4991A' : '#D0D7DE'};
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 10px;
        font-weight: ${isSelected ? '800' : '600'};
        color: ${isSelected ? '#344F1F' : '#24292F'};
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0,0,0,0.12);
        pointer-events: none;
      ">
        ${ward.name.split('-')[0]} (${totalComplaints})
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'ward-centroid-custom-icon',
    iconSize: [size, size + 20],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

export const WardMap: React.FC<WardMapProps> = ({
  wardStats,
  selectedFilterWard,
  onSelectWard,
  lang,
}) => {
  const wardMarkersRef = useRef<Record<number, L.Marker | null>>({});

  // Pune municipal center coordinates
  const PUNE_CENTER: [number, number] = [18.5204, 73.8567];

  // Selected ward info
  const activeWard = useMemo(() => {
    if (selectedFilterWard === 'all') return null;
    return PUNE_WARDS.find((w) => String(w.id) === selectedFilterWard) || null;
  }, [selectedFilterWard]);

  const activeWardStat = useMemo(() => {
    if (!activeWard) return null;
    return wardStats.find((w) => w.ward_id === activeWard.id) || null;
  }, [activeWard, wardStats]);

  return (
    <div
      style={{
        width: '100%',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        background: '#F0EFE9',
        position: 'relative',
        zIndex: 1,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Real Leaflet Map Container */}
      <div style={{ width: '100%', height: '380px', position: 'relative' }}>
        <MapContainer
          center={PUNE_CENTER}
          zoom={12}
          scrollWheelZoom={false}
          style={{ width: '100%', height: '100%', background: '#F2EFE9' }}
        >
          {/* Real OpenStreetMap Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
          />

          {/* Controller to fly-to and invalidate size */}
          <MapController
            selectedFilterWard={selectedFilterWard}
            wardMarkersRef={wardMarkersRef}
          />

          {/* Overlay all 10 Pune Ward Centroid Markers */}
          {PUNE_WARDS.map((ward) => {
            const stat = wardStats.find((w) => w.ward_id === ward.id);
            const total = safeNum(stat?.total, 0);
            const resolved = safeNum(stat?.by_status?.resolved, 0);
            const pending = Math.max(0, total - resolved);
            const resRate =
              total > 0 ? Math.min(100, Math.round((resolved / total) * 100)) : 0;
            const isSelected = selectedFilterWard === String(ward.id);
            const color = WARD_COLORS[ward.id] || '#344F1F';

            const icon = createWardDivIcon(ward, total, isSelected, color);

            return (
              <Marker
                key={ward.id}
                position={[ward.lat, ward.lng]}
                icon={icon}
                ref={(el) => {
                  wardMarkersRef.current[ward.id] = el;
                }}
                eventHandlers={{
                  click: () => {
                    onSelectWard(ward.id);
                  },
                }}
              >
                <Popup>
                  <div style={{ minWidth: '190px', fontSize: '0.8125rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #E5E7EB',
                        paddingBottom: '0.35rem',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <strong
                        style={{
                          color: 'var(--primary-forest, #344F1F)',
                          fontSize: '0.875rem',
                        }}
                      >
                        {ward.name}
                      </strong>
                      <span
                        style={{
                          background: 'var(--warm-beige, #EDE8D0)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        #{ward.id}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary, #64748B)',
                        marginBottom: '0.5rem',
                        lineHeight: 1.3,
                      }}
                    >
                      📍 {ward.officeAddress}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.35rem',
                        background: '#F8FAFC',
                        padding: '0.4rem',
                        borderRadius: '6px',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <div>
                        <span style={{ color: '#64748B', fontSize: '0.7rem' }}>
                          {lang === 'mr' ? 'एकूण तक्रारी' : 'Total'}:
                        </span>
                        <div style={{ fontWeight: 700, color: '#1E293B' }}>
                          {total}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: '#16A34A', fontSize: '0.7rem' }}>
                          {lang === 'mr' ? 'निवारण' : 'Resolved'}:
                        </span>
                        <div style={{ fontWeight: 700, color: '#16A34A' }}>
                          {resolved}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: '#E11D48', fontSize: '0.7rem' }}>
                          {lang === 'mr' ? 'प्रलंबित' : 'Pending'}:
                        </span>
                        <div style={{ fontWeight: 700, color: '#E11D48' }}>
                          {pending}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: '#D97706', fontSize: '0.7rem' }}>
                          {lang === 'mr' ? 'निवारण दर' : 'Rate'}:
                        </span>
                        <div style={{ fontWeight: 700, color: '#D97706' }}>
                          {resRate}%
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectWard(ward.id)}
                      style={{
                        width: '100%',
                        background: isSelected
                          ? 'var(--saffron-accent, #F4991A)'
                          : 'var(--primary-forest, #344F1F)',
                        color: isSelected ? '#1E293B' : '#FFFFFF',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.35rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {isSelected
                        ? lang === 'mr'
                          ? '✓ निवडलेला प्रभाग (Selected)'
                          : '✓ Selected Ward'
                        : lang === 'mr'
                        ? 'हा प्रभाग निवडा (Select Ward)'
                        : 'Select this Ward'}
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Info Overlay Bar at the bottom of the map card */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.55rem 0.85rem',
          background: 'var(--warm-beige-light, #FAF8F2)',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.8125rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            style={{
              fontWeight: 700,
              color: 'var(--primary-forest)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            📍{' '}
            {activeWard && activeWardStat ? (
              <span>
                {activeWard.name} (एकूण: {safeNum(activeWardStat.total)} | पूर्ण:{' '}
                {safeNum(activeWardStat.by_status?.resolved)} | प्रलंबित:{' '}
                {Math.max(
                  0,
                  safeNum(activeWardStat.total) -
                    safeNum(activeWardStat.by_status?.resolved)
                )}
                )
              </span>
            ) : lang === 'mr' ? (
              'पुणे शहर प्रभाग नकाशा — प्रभागावर क्लिक करून माहिती पहा'
            ) : (
              'Pune Urban Ward Map — Click any marker to view stats'
            )}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {selectedFilterWard !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectWard(Number(selectedFilterWard))}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--saffron-accent)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: 0,
              }}
            >
              ✕ {lang === 'mr' ? 'निवड काढा' : 'Deselect'}
            </button>
          )}
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            🗺️ OpenStreetMap &copy;
          </span>
        </div>
      </div>
    </div>
  );
};

export default WardMap;
