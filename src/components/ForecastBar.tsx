import { motion } from 'framer-motion';

interface ForecastBarProps {
  wardId: string;
  wardName: string;
  probability: number;
  demandChange: string;
  status: 'critical' | 'risk' | 'stable';
  index: number;
}

export default function ForecastBar({ wardId, wardName, probability, demandChange, status, index }: ForecastBarProps) {
  const barColor = status === 'critical' ? 'bg-red' : status === 'risk' ? 'bg-amber' : 'bg-neon';
  const textColor = status === 'critical' ? 'text-red' : status === 'risk' ? 'text-amber' : 'text-neon';
  const trackColor = 'bg-[#F1F5F9]';

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] mb-2.5 last:mb-0"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#94A3B8] font-mono">{wardId}</span>
          <span className="text-sm text-[#1E293B] font-medium">{wardName}</span>
        </div>
        <span className={`text-sm font-bold font-mono ${textColor}`}>{probability}%</span>
      </div>
      <div className={`relative h-2.5 ${trackColor} rounded-full overflow-hidden`}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${probability}%` }}
          transition={{ delay: index * 0.08 + 0.2, duration: 0.7, ease: 'easeOut' }}
          className={`h-full ${barColor} rounded-full`} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[11px] text-[#94A3B8]">Demand spike</span>
        <span className={`text-[11px] font-semibold font-mono ${textColor}`}>{demandChange}</span>
      </div>
    </motion.div>
  );
}
