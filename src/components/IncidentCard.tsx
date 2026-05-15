import { motion } from 'framer-motion';
import { AlertTriangle, Droplets, Clock, ShieldAlert, Wrench, Activity } from 'lucide-react';
import type { Incident } from '../data/mockData';

interface IncidentCardProps { incident: Incident; index: number; }

const iconMap: Record<string, React.ReactNode> = {
  LEAK_REPORT: <Droplets size={14} />,
  LOW_PRESSURE: <Activity size={14} />,
  TANKER_DELAY: <Clock size={14} />,
  CONTAMINATION: <ShieldAlert size={14} />,
  PIPE_BURST: <AlertTriangle size={14} />,
  PUMP_FAILURE: <Wrench size={14} />,
  OVERFLOW: <Droplets size={14} />,
};

const sev: Record<string, { icon: string; badge: string; border: string }> = {
  critical: { icon: 'text-red',   badge: 'bg-red/10 text-red border-red/15',     border: 'border-red/10' },
  high:     { icon: 'text-amber', badge: 'bg-amber/10 text-amber border-amber/15', border: 'border-amber/10' },
  medium:   { icon: 'text-cyan',  badge: 'bg-cyan/10 text-cyan border-cyan/15',   border: 'border-cyan/10' },
  low:      { icon: 'text-neon',  badge: 'bg-neon/10 text-neon border-neon/15',   border: 'border-neon/10' },
};

export default function IncidentCard({ incident, index }: IncidentCardProps) {
  const c = sev[incident.severity];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className={`${c.border} border rounded-xl p-3.5 mb-2.5 last:mb-0 bg-white hover:bg-[#F8FAFC] transition-colors`}>
      <div className="flex items-start gap-3">
        <div className={`${c.icon} mt-0.5 shrink-0`}>{iconMap[incident.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md border ${c.badge}`}>
              {incident.type.replace('_', ' ')}
            </span>
            <span className="text-[11px] text-[#94A3B8]">{incident.time}</span>
          </div>
          <p className="text-[13px] text-[#64748B] leading-relaxed">
            <span className={`${c.icon} font-semibold`}>{incident.ward}:</span> {incident.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
