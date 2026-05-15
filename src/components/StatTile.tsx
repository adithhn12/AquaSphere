import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface StatTileProps {
  label: string;
  value: number | string;
  unit?: string;
  color?: 'cyan' | 'neon' | 'amber' | 'red';
  icon?: React.ReactNode;
  fluctuate?: boolean;
  compact?: boolean;
}

const palette = {
  cyan:  { text: 'text-cyan',  bg: 'bg-cyan/8',  border: 'border-cyan/15' },
  neon:  { text: 'text-neon',  bg: 'bg-neon/8',  border: 'border-neon/15' },
  amber: { text: 'text-amber', bg: 'bg-amber/8', border: 'border-amber/15' },
  red:   { text: 'text-red',   bg: 'bg-red/8',   border: 'border-red/15' },
};

export default function StatTile({ label, value, unit, color = 'cyan', icon, fluctuate = true, compact = false }: StatTileProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (!fluctuate || typeof value !== 'number') return;
    const interval = setInterval(() => {
      const v = Math.floor(Math.random() * 5) - 2;
      setDisplayValue(Math.max(0, (value as number) + v));
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [value, fluctuate]);

  const c = palette[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white ${c.border} border rounded-xl ${compact ? 'p-3' : 'p-4'} transition-all hover:shadow-sm`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className={`${c.text} opacity-70`}>{icon}</span>}
        <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <motion.span
          key={String(displayValue)}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          className={`${c.text} font-mono font-bold ${compact ? 'text-xl' : 'text-2xl'} leading-none`}
        >
          {displayValue}
        </motion.span>
        {unit && <span className="text-xs text-[#94A3B8]">{unit}</span>}
      </div>
    </motion.div>
  );
}
