import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Filter, Route, Truck, Radio, Sun, Moon, Maximize2, ChevronDown } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import { useFirestore } from '../hooks/useFirestore';
import type { Ward, Tanker } from '../data/mockData';
import type { WaterRequest } from '../data/requests';
import { densifyPath, type Coordinate } from '../utils/tsp';
import MapZoomControls from './MapZoomControls';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import 'leaflet/dist/leaflet.css';

interface MapTanker extends Tanker {
  targetLat?: number;
  targetLng?: number;
  destination?: string;
}

interface MapPanelProps {
  pendingRequests?: WaterRequest[];
  isDarkMode: boolean;
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
// Smart Supply Corridor (Fallback)
// ══════════════════════════════════════════════════════════
const CORRIDOR_ROUTE: Coordinate[] = [
  [12.9779, 77.5727], [12.9718, 77.5940], [12.9779, 77.6326], 
  [12.9568, 77.6369], [12.9311, 77.6462], [12.9698, 77.7500], 
];

/**
 * Generates a simple multi-point route for animation between two coordinates
 */
function generateLiveRoute(start: Coordinate, end: Coordinate, algo: string): Coordinate[] {
  // Vary the route geometry to make the algorithms look distinct
  if (algo === 'Greedy TSP') {
    return [start, end]; // Efficiency: Direct straight line
  }
  
  if (algo === 'Bellman-Ford') {
    // Traffic Mode: Curved path simulating avoidance of congestion
    const mid: Coordinate = [
      (start[0] + end[0]) / 2 + 0.015,
      (start[1] + end[1]) / 2 - 0.01
    ];
    return [start, mid, end];
  }
  
  // Floyd-Warshall / Dijkstra: High-fidelity multi-segment path
  const mid1: Coordinate = [
    start[0] + (end[0] - start[0]) * 0.4 + 0.008,
    start[1] + (end[1] - start[1]) * 0.6 - 0.008
  ];
  const mid2: Coordinate = [
    start[0] + (end[0] - start[0]) * 0.7 - 0.005,
    start[1] + (end[1] - start[1]) * 0.3 + 0.005
  ];
  return [start, mid1, mid2, end];
}

const ANIM_INTERVAL = 2400; // step interval for marker snapping
const CSS_TRANSITION = 2.2; // near-match for smooth glide

function createTankerIcon(status: string) {
  const color = status === 'in-transit' ? '#0EA5E9' : status === 'delivering' ? '#10B981' : '#F59E0B';
  return L.divIcon({
    html: `<div class="relative flex items-center justify-center">
      <div class="absolute w-10 h-10 rounded-full ${status === 'in-transit' ? 'bg-sky-400/20' : 'bg-emerald-400/20'} animate-ping"></div>
      <div style="
        width: 38px;
        height: 38px;
        background: white;
        border: 2px solid ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 50;
        transition: transform ${CSS_TRANSITION}s linear;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10h1"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
      </div>
    </div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
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
  tanker: Tanker;
  onFly: (pos: [number, number]) => void;
  motionPath: Coordinate[];
}) {
  const stepRef = useRef(0);
  const [pos, setPos] = useState<[number, number]>(motionPath[0] || [tanker.lat, tanker.lng]);
  const icon = useMemo(() => createTankerIcon(tanker.status), [tanker.status]);

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
      {tanker.status === 'in-transit' && (
        <Tooltip permanent direction="bottom" offset={[0, 20]} className="tanker-mission-label bg-transparent border-none shadow-none">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-bg-card/90 border border-sky-500/30 font-bold text-[9px] uppercase tracking-tighter text-sky-400 shadow-sm">
            <Radio size={8} className="animate-pulse" /> {tanker.id}
          </div>
        </Tooltip>
      )}
      <Popup>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.7, color: 'var(--color-text-primary)' }}>
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

function areaToCoordinate(area: string, wards: Ward[]): Coordinate | null {
  const lower = area.toLowerCase();
  const ward = wards.find(w =>
    lower.includes(w.name.toLowerCase()) ||
    w.name.toLowerCase().includes(lower)
  );
  if (!ward) return null;
  return [ward.lat, ward.lng];
}

export default function MapPanel({ pendingRequests = [], isDarkMode }: MapPanelProps) {
  const { data: dbWards } = useFirestore<Ward>('wards');
  const { data: dbTankers } = useFirestore<Tanker>('tankers');
  
  // ── FALLBACK LOGIC ──
  const wards = dbWards.length > 0 ? dbWards : [
    { id: 'W118', name: 'Varthur', lat: 12.9437, lng: 77.7400, status: 'critical', reservoir: 18, demand: 89, supply: 42, population: 156000 },
    { id: 'W174', name: 'HSR Layout', lat: 12.9116, lng: 77.6389, status: 'critical', reservoir: 31, demand: 78, supply: 41, population: 142000 },
    { id: 'W150', name: 'Bellandur', lat: 12.9256, lng: 77.6760, status: 'critical', reservoir: 22, demand: 85, supply: 38, population: 148000 },
    { id: 'W142', name: 'Indiranagar', lat: 12.9784, lng: 77.6408, status: 'risk', reservoir: 42, demand: 71, supply: 52, population: 134000 },
  ] as Ward[];

  const tankers = dbTankers.length > 0 ? dbTankers : [
    { id: 'TNK-PRIMARY', plate: 'KA-01-AQUA-01', status: 'in-transit', driver: 'System Pilot', lat: 12.9716, lng: 77.5946, capacity: 10000, filled: 8500 } as Tanker
  ];

  const displayedTankers = tankers;
  
  const mapMode = isDarkMode ? 'dark' : 'light';
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [routingAlgo, setRoutingAlgo] = useState('Dijkstra + A*');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'metadata', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        setRoutingAlgo(snapshot.data().routing_algo || 'Dijkstra + A*');
      }
    });
    return () => unsub();
  }, []);

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
      .map(req => areaToCoordinate(req.area, wards))
      .filter((coord): coord is Coordinate => Boolean(coord));
  }, [pendingRequests, wards]);

  // ── DYNAMIC ROUTE LOGIC ──
  const activeRoute = useMemo(() => {
    if (activeRequestCoords.length > 0) {
      return generateLiveRoute(BENGALURU_CENTER, activeRequestCoords[0], routingAlgo);
    }
    return CORRIDOR_ROUTE;
  }, [activeRequestCoords, routingAlgo]);

  const denseMotionPath = useMemo(() => densifyPath(activeRoute, 8), [activeRoute]);

  return (
    <div className="h-full flex flex-col relative bg-bg-primary">
      <div className="px-3 md:px-4 py-2 md:py-2.5 border-b border-border-dim bg-bg-secondary flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon animate-pulse" />
          <span className="text-sm font-semibold text-text-primary">Live Ops Command</span>
          <span className="text-xs text-text-dim hidden sm:inline">
            · {wards.length} wards · {pendingRequests.length} pending · {activeRequestCoords.length > 0 ? 'Live Dispatch Active' : 'Corridor patrol'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Radio size={12} className="text-neon animate-pulse-glow" />
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden min-h-0">
        <MapContainer
          key={mapMode}
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

          {/* ── HEATMAP LAYER ── */}
          {wards.filter(w => w.status === 'critical' || w.status === 'risk').map(ward => (
            <Marker
              key={`heatmap-${ward.id}`}
              position={[ward.lat, ward.lng]}
              icon={L.divIcon({
                html: `<div class="heatmap-pulse ${ward.status === 'critical' ? 'critical' : 'risk'}"></div>`,
                className: '',
                iconSize: [60, 60],
                iconAnchor: [30, 30]
              })}
              interactive={false}
            />
          ))}

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
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.7, color: 'var(--color-text-primary)' }}>
                    <div style={{ fontWeight: 700, color, fontSize: 14, marginBottom: 4 }}>{ward.id} {ward.name}</div>
                    <div>Reservoir: <b style={{ color: ward.reservoir < 30 ? '#DC2626' : ward.reservoir < 50 ? '#D97706' : '#059669' }}>{ward.reservoir}%</b></div>
                    <div>Demand / Supply: <b>{ward.demand}</b> / <b>{ward.supply}</b> MLD</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Dynamic route trail */}
          <Polyline
            positions={activeRoute}
            pathOptions={{ 
              color: routingAlgo === 'Greedy TSP' ? '#F59E0B' : 
                     routingAlgo === 'Bellman-Ford' ? '#EC4899' :
                     routingAlgo === 'Floyd-Warshall' ? '#8B5CF6' :
                     isLight ? '#0EA5E9' : '#38BDF8', 
              weight: routingAlgo === 'Bellman-Ford' ? 6 : 4, 
              opacity: 0.8,
              dashArray: routingAlgo === 'Greedy TSP' ? '1, 12' : 
                         routingAlgo === 'Bellman-Ford' ? '10, 10' : 
                         activeRequestCoords.length > 0 ? '1, 10' : undefined
            }}
          />

          {/* Dynamic route trails for assigned tankers */}
          {tankers.map((tanker: any) => {
            if (tanker.targetLat && tanker.targetLng) {
              return (
                <Polyline
                  key={`path-${tanker.id}`}
                  positions={[[tanker.lat, tanker.lng], [tanker.targetLat, tanker.targetLng]]}
                  pathOptions={{ color: '#0EA5E9', weight: 3, opacity: 0.6, dashArray: '5, 10' }}
                />
              );
            }
            return null;
          })}

          {/* Animated tankers with individual paths */}
          {tankers.map((tanker: any) => {
            const tankerPath = (tanker.targetLat && tanker.targetLng)
              ? densifyPath([[tanker.lat, tanker.lng], [tanker.targetLat, tanker.targetLng]], 15)
              : denseMotionPath;
            
            return (
              <AnimatedTankerMarker 
                key={tanker.id} 
                tanker={tanker} 
                onFly={handleFly} 
                motionPath={tankerPath} 
              />
            );
          })}

          {/* Static leak markers */}
          {STATIC_LEAKS.map((leak, i) => (
            <Marker
              key={`leak-${i}`}
              position={[leak.lat, leak.lng]}
              icon={leakIcon}
              eventHandlers={{ click: () => handleFly([leak.lat, leak.lng]) }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.7, color: 'var(--color-text-primary)' }}>
                  <div style={{ fontWeight: 700, color: '#0EA5E9', fontSize: 14, marginBottom: 4 }}>💧 Active Leak</div>
                  <div><b>{leak.ward}</b></div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>{leak.desc}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          <MapZoomControls theme={mapMode} showResetView showLocateUser resetCenter={[12.9716, 77.5946]} resetZoom={12} minZoom={10} maxZoom={17} />
        </MapContainer>

        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] px-3 py-1 rounded-lg text-[10px] md:text-[11px] font-medium bg-bg-secondary/95 text-text-secondary border border-border-dim shadow-sm hidden sm:block">
          <div className="flex items-center gap-1.5">
            <Maximize2 size={10} />
            Majestic → MG Road → Indiranagar → Koramangala → HSR → Bellandur → Whitefield
          </div>
        </div>

        <div className="absolute bottom-[52px] left-3 z-[1000] rounded-xl px-3 py-2 bg-bg-secondary/95 border border-border-dim shadow-sm hidden sm:block">
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
            <div className="w-px h-3.5 bg-border-dim mx-0.5" />
            <div className="flex items-center gap-1.5 text-text-secondary">
              <span className="text-[18px] leading-none shrink-0">🚚</span>
              <span className="font-medium">Tanker</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] leading-none shrink-0">💧</span>
              <span className="text-cyan font-medium">Leak</span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary">
              <div className="w-3 h-[2px] bg-cyan rounded-full" />
              <span className="font-medium">Route</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border-dim bg-bg-secondary z-10 relative">
        <button onClick={() => setToolbarOpen(!toolbarOpen)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-text-dim hover:text-text-secondary transition-colors">
          Tools
          <motion.div animate={{ rotate: toolbarOpen ? 180 : 0 }}><ChevronDown size={12} /></motion.div>
        </button>
        <AnimatePresence>
          {toolbarOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border-dim">
              <div className="flex flex-wrap items-center justify-between px-3 md:px-4 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { key: 'M', label: 'Recalibrate', icon: <MapPin size={11} /> },
                    { key: 'F', label: 'Filter', icon: <Filter size={11} /> },
                    { key: 'R', label: 'Route Path', icon: <Route size={11} /> },
                    { key: 'A', label: 'Allocate', icon: <Truck size={11} /> },
                  ].map(item => (
                    <button key={item.key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border-dim bg-bg-primary text-text-secondary hover:border-cyan hover:bg-cyan/5 hover:text-cyan text-xs font-medium transition-all">
                      {item.icon}
                      <span className="hidden md:inline">{item.label}</span>
                      <span className="font-mono text-[10px] text-cyan">[{item.key}]</span>
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-text-dim hidden lg:inline">
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
