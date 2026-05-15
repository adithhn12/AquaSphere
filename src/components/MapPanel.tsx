import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Filter, Route, Truck, Radio, Sun, Moon, Maximize2, ChevronDown } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import { wards, tankers } from '../data/mockData';
import type { WaterRequest } from '../data/requests';
import { densifyPath, type Coordinate } from '../utils/tsp';
import MapZoomControls from './MapZoomControls';
import 'leaflet/dist/leaflet.css';

interface MapPanelProps {
  pendingRequests?: WaterRequest[];
}

// ── Bengaluru BBMP bounds ──────────────────────────────
const BENGALURU_BOUNDS: L.LatLngBoundsExpression = [[12.84, 77.48], [13.15, 77.78]];
const BENGALURU_CENTER: L.LatLngExpression = [12.9716, 77.5946];
const DEFAULT_ZOOM = 12;

const TILE_LAYERS = {
  light: { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
};

// Static leak markers
const STATIC_LEAKS: readonly { lat: number; lng: number; ward: string; desc: string }[] = [
  { lat: 12.9352, lng: 77.6245, ward: 'Koramangala', desc: 'Major pipeline burst at 4th Block junction' },
  { lat: 12.9166, lng: 77.6101, ward: 'BTM Layout', desc: 'Underground pipe fracture near Sec 2 market' },
  { lat: 12.9437, lng: 77.7400, ward: 'Varthur', desc: 'TDS contamination — levels above 800 ppm' },
] as const;

// ══════════════════════════════════════════════════════════
// Detailed Bengaluru tanker corridor route
// Majestic → MG Road → Indiranagar → Koramangala → HSR
// → Outer Ring Road → Bellandur → Whitefield
// 19 closely spaced points for realistic road-following visuals
// ══════════════════════════════════════════════════════════
const TANKER_ROUTE: Coordinate[] = [
  [12.9779, 77.5727], // Majestic / Central Bengaluru
  [12.9758, 77.5806], // Cubbon Park edge
  [12.9736, 77.5881], // Brigade Road approach
  [12.9718, 77.5940], // MG Road core
  [12.9728, 77.6023], // Trinity Circle stretch
  [12.9738, 77.6112], // Ulsoor / Old Madras Rd connector
  [12.9756, 77.6218], // 100 Feet Road western Indiranagar edge
  [12.9779, 77.6326], // 100 Feet Road, Indiranagar core
  [12.9787, 77.6395], // CMH / 80 Feet Road turn
  [12.9726, 77.6408], // Domlur flyover corridor
  [12.9649, 77.6394], // EGL / Intermediate Ring Rd
  [12.9568, 77.6369], // Koramangala 80 Feet Road
  [12.9488, 77.6380], // Koramangala–HSR connector
  [12.9389, 77.6401], // HSR Layout north edge
  [12.9311, 77.6462], // ORR merge near Agara
  [12.9258, 77.6599], // Bellandur ORR west
  [12.9237, 77.6758], // Bellandur ORR center
  [12.9310, 77.7035], // Marathahalli / ORR eastbound
  [12.9698, 77.7500], // Whitefield / ITPL corridor
];

const ANIM_INTERVAL = 2400; // step interval for marker snapping
const CSS_TRANSITION = 2.2; // near-match for smooth glide

function createTankerIcon() {
  return L.divIcon({
    html: `<div style="
      width:34px;
      height:34px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:28px;
      line-height:1;
      text-align:center;
      filter:drop-shadow(0 2px 5px rgba(0,0,0,0.20));
      transition:transform ${CSS_TRANSITION}s linear;
    ">🚚</div>`,
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  });
}

function createLeakIcon() {
  return L.divIcon({
    html: `<div style="position:relative;width:40px;height:40px;">
      <div class="leak-ripple" style="position:absolute;top:6px;left:6px;"></div>
      <div class="leak-ripple" style="position:absolute;top:6px;left:6px;"></div>
      <div class="leak-ripple" style="position:absolute;top:6px;left:6px;"></div>
      <div class="leak-drop-icon" style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
        font-size:22px;line-height:1;z-index:10;
        filter:drop-shadow(0 2px 6px rgba(14,165,233,0.4));
      ">💧</div>
    </div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -34],
  });
}

function MapController({ mapMode, flyTarget }: { mapMode: 'light' | 'dark'; flyTarget: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    map.setView(BENGALURU_CENTER, DEFAULT_ZOOM);
    map.setMaxBounds(L.latLngBounds([12.74, 77.38], [13.25, 77.88]));
    map.setMinZoom(10);
    map.setMaxZoom(17);
    map.scrollWheelZoom.enable();
  }, [map]);

  useEffect(() => {
    const c = map.getContainer();
    c.classList.remove('light-map', 'dark-map');
    c.classList.add(mapMode === 'light' ? 'light-map' : 'dark-map');
  }, [map, mapMode]);

  useEffect(() => {
    if (flyTarget) map.flyTo(flyTarget, 15, { duration: 1.2 });
  }, [map, flyTarget]);

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

function AnimatedTankerMarker({
  tanker,
  onFly,
  motionPath,
}: {
  tanker: typeof tankers[0];
  onFly: (pos: [number, number]) => void;
  motionPath: Coordinate[];
}) {
  const stepRef = useRef(0);
  const [pos, setPos] = useState<[number, number]>(motionPath[0] || [tanker.lat, tanker.lng]);
  const icon = useMemo(() => createTankerIcon(), []);

  useEffect(() => {
    if (!motionPath.length) return;
    setPos(motionPath[0]);
    stepRef.current = 0;

    const interval = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % motionPath.length;
      setPos(motionPath[stepRef.current]);
    }, ANIM_INTERVAL);

    return () => clearInterval(interval);
  }, [motionPath]);

  const color = tanker.status === 'in-transit' ? '#0EA5E9'
    : tanker.status === 'delivering' ? '#10B981'
    : tanker.status === 'idle' ? '#F59E0B' : '#94A3B8';

  return (
    <Marker position={pos} icon={icon} eventHandlers={{ click: () => onFly(pos) }}>
      <Popup>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.7, color: '#1E293B' }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color, fontSize: 14 }}>🚚 {tanker.id}</div>
          <div>Plate: <b style={{ color }}>{tanker.plate}</b></div>
          <div>Status: <b style={{ color }}>{tanker.status.toUpperCase()}</b></div>
          <div>Driver: {tanker.driver}</div>
          <div>Majestic → MG Road → Indiranagar → Koramangala → HSR → ORR → Whitefield</div>
        </div>
      </Popup>
    </Marker>
  );
}

function areaToCoordinate(area: string): Coordinate | null {
  const lower = area.toLowerCase();
  const ward = wards.find(w =>
    lower.includes(w.name.toLowerCase()) ||
    w.name.toLowerCase().includes(lower)
  );
  if (!ward) return null;
  return [ward.lat, ward.lng];
}

export default function MapPanel({ pendingRequests = [] }: MapPanelProps) {
  const [mapMode, setMapMode] = useState<'light' | 'dark'>('light');
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  const isLight = mapMode === 'light';
  const leakIcon = useMemo(() => createLeakIcon(), []);

  const getWardColor = useCallback((status: string) => {
    switch (status) {
      case 'stable': return '#059669';
      case 'risk': return '#D97706';
      case 'critical': return '#DC2626';
      default: return '#0891B2';
    }
  }, []);

  const handleFly = useCallback((pos: [number, number]) => {
    setFlyTarget(null);
    setTimeout(() => setFlyTarget(pos), 50);
  }, []);

  const activeRequestCoords = useMemo(() => {
    return pendingRequests
      .map(req => areaToCoordinate(req.area))
      .filter((coord): coord is Coordinate => Boolean(coord));
  }, [pendingRequests]);

  // Densified path for smooth tanker movement along the detailed corridor
  const denseMotionPath = useMemo(() => densifyPath(TANKER_ROUTE, 8), []);

  return (
    <div className="h-full flex flex-col relative bg-[#F1F5F9]">
      <div className="px-3 md:px-4 py-2 md:py-2.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon animate-pulse" />
          <span className="text-sm font-semibold text-[#1E293B]">Live Map</span>
          <span className="text-xs text-[#94A3B8] hidden sm:inline">
            · {wards.length} wards · {pendingRequests.length} pending · corridor route active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg p-0.5 border bg-[#F1F5F9] border-[#E2E8F0]">
            <button onClick={() => setMapMode('light')}
              className={`p-1.5 rounded-md transition-all ${mapMode === 'light' ? 'bg-white text-amber-500 shadow-sm border border-[#E2E8F0]' : 'text-[#94A3B8]'}`}
              title="Day Mode"><Sun size={13} /></button>
            <button onClick={() => setMapMode('dark')}
              className={`p-1.5 rounded-md transition-all ${mapMode === 'dark' ? 'bg-white text-indigo-500 shadow-sm border border-[#E2E8F0]' : 'text-[#94A3B8]'}`}
              title="Night Mode"><Moon size={13} /></button>
          </div>
          <Radio size={12} className="text-neon animate-pulse-glow" />
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden min-h-0">
        <MapContainer
          center={BENGALURU_CENTER}
          zoom={DEFAULT_ZOOM}
          className={`h-full w-full ${mapMode === 'light' ? 'light-map' : 'dark-map'}`}
          zoomControl={false}
          attributionControl={false}
          maxBounds={BENGALURU_BOUNDS}
          maxBoundsViscosity={0.8}
        >
          <MapController mapMode={mapMode} flyTarget={flyTarget} />
          <TileLayer key={mapMode} url={TILE_LAYERS[mapMode].url} />

          {/* City boundary */}
          <Polyline
            positions={[[13.15,77.48],[13.15,77.78],[12.84,77.78],[12.84,77.48],[13.15,77.48]]}
            pathOptions={{ color: '#0891B2', weight: 1, opacity: 0.2, dashArray: '12 6' }}
          />

          {/* Ward markers */}
          {wards.map(ward => {
            const color = getWardColor(ward.status);
            const r = ward.status === 'critical' ? 9 : ward.status === 'risk' ? 7 : 5;
            return (
              <CircleMarker
                key={ward.id}
                center={[ward.lat, ward.lng]}
                radius={r}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.5, weight: ward.id === 'W174' ? 3 : 1.5, opacity: 0.9 }}
                eventHandlers={{ click: () => handleFly([ward.lat, ward.lng]) }}
              >
                <Tooltip permanent direction="top" offset={[0, -8]} className="leaflet-ward-label">
                  <span style={{ color, fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: 600, textShadow: isLight ? '0 0 4px white, 0 0 8px white' : `0 0 6px ${color}88, 0 0 12px rgba(0,0,0,0.8)` }}>
                    {ward.id} {ward.name}
                  </span>
                </Tooltip>
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.7, color: '#1E293B' }}>
                    <div style={{ fontWeight: 700, color, fontSize: 14, marginBottom: 4 }}>{ward.id} {ward.name}</div>
                    <div>Reservoir: <b style={{ color: ward.reservoir < 30 ? '#DC2626' : ward.reservoir < 50 ? '#D97706' : '#059669' }}>{ward.reservoir}%</b></div>
                    <div>Demand / Supply: <b>{ward.demand}</b> / <b>{ward.supply}</b> MLD</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Detailed multi-way route trail — vivid neon in dark mode */}
          <Polyline
            positions={TANKER_ROUTE}
            pathOptions={{ color: isLight ? '#0EA5E9' : '#38BDF8', weight: isLight ? 4 : 4.5, opacity: isLight ? 0.92 : 1 }}
          />

          {/* Pending request delivery points snapped to ward coordinates */}
          {activeRequestCoords.map((coord, idx) => (
            <CircleMarker
              key={`stop-${idx}`}
              center={coord}
              radius={5}
              pathOptions={{ color: '#0EA5E9', fillColor: '#0EA5E9', fillOpacity: 0.55, weight: 2 }}
              eventHandlers={{ click: () => handleFly(coord) }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#1E293B' }}>
                  <div style={{ fontWeight: 700, color: '#0EA5E9' }}>Delivery Stop #{idx + 1}</div>
                  <div>Active citizen request waypoint</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Animated tanker follows the detailed corridor path */}
          <AnimatedTankerMarker tanker={tankers[0]} onFly={handleFly} motionPath={denseMotionPath} />

          {/* Static leak markers */}
          {STATIC_LEAKS.map((leak, i) => (
            <Marker
              key={`leak-${i}`}
              position={[leak.lat, leak.lng]}
              icon={leakIcon}
              eventHandlers={{ click: () => handleFly([leak.lat, leak.lng]) }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.7, color: '#1E293B' }}>
                  <div style={{ fontWeight: 700, color: '#0EA5E9', fontSize: 14, marginBottom: 4 }}>💧 Active Leak</div>
                  <div><b>{leak.ward}</b></div>
                  <div style={{ color: '#64748B' }}>{leak.desc}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          <MapZoomControls theme={mapMode} showResetView showLocateUser resetCenter={[12.9716, 77.5946]} resetZoom={12} minZoom={10} maxZoom={17} />
        </MapContainer>

        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] px-3 py-1 rounded-lg text-[10px] md:text-[11px] font-medium bg-white/95 text-[#64748B] border border-[#E2E8F0] shadow-sm hidden sm:block">
          <div className="flex items-center gap-1.5">
            <Maximize2 size={10} />
            Majestic → MG Road → Indiranagar → Koramangala → HSR → Bellandur → Whitefield
          </div>
        </div>

        <div className={`absolute top-2 right-14 z-[1000] px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-medium shadow-sm ${
          isLight ? 'bg-white border border-[#E2E8F0] text-amber-500' : 'bg-[#1E293B] border border-[#334155] text-cyan'
        }`}>
          {mapMode === 'light' ? <><Sun size={11} /> Day</> : <><Moon size={11} /> Night</>}
        </div>

        <div className="absolute bottom-[52px] left-3 z-[1000] rounded-xl px-3 py-2 bg-white/95 border border-[#E2E8F0] shadow-sm hidden sm:block">
          <div className="flex items-center gap-3 text-[11px] leading-none">
            {[
              { c: '#059669', l: 'Stable' },
              { c: '#D97706', l: 'Risk' },
              { c: '#DC2626', l: 'Critical' },
            ].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c }} />
                <span style={{ color: c, fontWeight: 500 }}>{l}</span>
              </div>
            ))}
            <div className="w-px h-3.5 bg-[#E2E8F0] mx-0.5" />
            <div className="flex items-center gap-1.5">
              <span className="text-[18px] leading-none shrink-0">🚚</span>
              <span className="text-[#64748B] font-medium">Tanker</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] leading-none shrink-0">💧</span>
              <span className="text-[#0EA5E9] font-medium">Leak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-[2px] bg-[#0EA5E9] rounded-full" />
              <span className="text-[#64748B] font-medium">Route</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E2E8F0] bg-white z-10 relative">
        <button onClick={() => setToolbarOpen(!toolbarOpen)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-[#94A3B8] hover:text-[#64748B] transition-colors">
          Tools
          <motion.div animate={{ rotate: toolbarOpen ? 180 : 0 }}><ChevronDown size={12} /></motion.div>
        </button>
        <AnimatePresence>
          {toolbarOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-[#E2E8F0]">
              <div className="flex flex-wrap items-center justify-between px-3 md:px-4 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { key: 'M', label: 'Recalibrate', icon: <MapPin size={11} /> },
                    { key: 'F', label: 'Filter', icon: <Filter size={11} /> },
                    { key: 'R', label: 'Route Path', icon: <Route size={11} /> },
                    { key: 'A', label: 'Allocate', icon: <Truck size={11} /> },
                  ].map(item => (
                    <button key={item.key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:border-cyan hover:bg-cyan/5 hover:text-cyan text-xs font-medium transition-all">
                      {item.icon}
                      <span className="hidden md:inline">{item.label}</span>
                      <span className="font-mono text-[10px] text-cyan">[{item.key}]</span>
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-[#94A3B8] hidden lg:inline">
                  Detailed Corridor Path · 19 Waypoints · Solid Blue Polyline
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
