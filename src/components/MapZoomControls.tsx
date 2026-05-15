import { useEffect, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { Plus, Minus, Locate, Maximize } from 'lucide-react';

interface MapZoomControlsProps {
  theme?: 'light' | 'dark';
  showResetView?: boolean;
  showLocateUser?: boolean;
  resetCenter?: [number, number];
  resetZoom?: number;
  minZoom?: number;
  maxZoom?: number;
}

export default function MapZoomControls({
  theme = 'light',
  showResetView = true,
  showLocateUser = false,
  resetCenter = [12.9716, 77.5946],
  resetZoom = 11,
  minZoom = 10,
  maxZoom = 16,
}: MapZoomControlsProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(resetZoom);

  useEffect(() => {
    const h = () => setZoom(map.getZoom());
    map.on('zoomend', h);
    setZoom(map.getZoom());
    return () => { map.off('zoomend', h); };
  }, [map]);

  const zoomIn = useCallback(() => { if (zoom < maxZoom) map.setZoom(zoom + 1, { animate: true }); }, [map, zoom, maxZoom]);
  const zoomOut = useCallback(() => { if (zoom > minZoom) map.setZoom(zoom - 1, { animate: true }); }, [map, zoom, minZoom]);
  const reset = useCallback(() => { map.flyTo(resetCenter, resetZoom, { duration: 1 }); }, [map, resetCenter, resetZoom]);
  const locate = useCallback(() => { map.flyTo([12.9116, 77.6389], 15, { duration: 1 }); }, [map]);

  const isLight = theme === 'light';
  const base = isLight
    ? 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] active:bg-[#F1F5F9] text-[#64748B] shadow-sm'
    : 'bg-[#1E293B] border-[#334155] hover:bg-[#334155] text-[#94A3B8]';
  const disabled = 'text-[#CBD5E1]';

  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[1000] flex flex-col items-center gap-1">
      <motion.button whileTap={{ scale: 0.9 }} onClick={zoomIn} disabled={zoom >= maxZoom}
        className={`w-9 h-9 rounded-t-xl border flex items-center justify-center transition-all ${base} ${zoom >= maxZoom ? 'cursor-not-allowed opacity-50' : ''}`}>
        <Plus size={16} className={zoom >= maxZoom ? disabled : ''} />
      </motion.button>
      <div className={`w-9 border-x flex items-center justify-center ${isLight ? 'bg-white border-[#E2E8F0]' : 'bg-[#1E293B] border-[#334155]'}`}>
        <span className={`text-[10px] font-mono font-bold tabular-nums ${isLight ? 'text-cyan' : 'text-cyan'}`}>{zoom}</span>
      </div>
      <motion.button whileTap={{ scale: 0.9 }} onClick={zoomOut} disabled={zoom <= minZoom}
        className={`w-9 h-9 rounded-b-xl border flex items-center justify-center transition-all ${base} ${zoom <= minZoom ? 'cursor-not-allowed opacity-50' : ''}`}>
        <Minus size={16} className={zoom <= minZoom ? disabled : ''} />
      </motion.button>
      <div className="h-2" />
      {showResetView && (
        <motion.button whileTap={{ scale: 0.9 }} onClick={reset}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${base}`}>
          <Maximize size={14} />
        </motion.button>
      )}
      {showLocateUser && (
        <motion.button whileTap={{ scale: 0.9 }} onClick={locate}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all mt-1 ${base}`}>
          <Locate size={14} className="text-cyan" />
        </motion.button>
      )}
    </div>
  );
}
