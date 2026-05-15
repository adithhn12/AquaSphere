import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, AlertTriangle, Droplets, Clock, CheckCircle, ArrowRight, Lightbulb, Gauge } from 'lucide-react';
import StatTile from './StatTile';
import { conservationTips } from '../data/mockData';

interface LeftPanelProps {
  onRequestTanker: () => void;
  onReportLeak?: () => void;
  /** Live count from global state — replaces the static 87 */
  pendingRequestCount?: number;
}

export default function LeftPanel({ onRequestTanker, onReportLeak, pendingRequestCount }: LeftPanelProps) {
  const [eta, setEta] = useState(24);
  const [progress, setProgress] = useState(62);
  const [tipIndex, setTipIndex] = useState(0);
  const [activeTankers, setActiveTankers] = useState(412);
  const pendingReqs = pendingRequestCount ?? 87;
  const [wardsAtRisk, setWardsAtRisk] = useState(14);
  const [fulfilled, setFulfilled] = useState(84);

  useEffect(() => {
    const interval = setInterval(() => {
      setEta(prev => Math.max(1, prev + (Math.random() > 0.6 ? -1 : 0)));
      setProgress(prev => Math.min(99, prev + (Math.random() > 0.5 ? 1 : 0)));
      setActiveTankers(prev => prev + Math.floor(Math.random() * 5) - 2);
      setWardsAtRisk(prev => Math.max(0, Math.min(20, prev + (Math.random() > 0.7 ? 1 : Math.random() < 0.3 ? -1 : 0))));
      setFulfilled(prev => Math.max(70, Math.min(99, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTipIndex(prev => (prev + 1) % conservationTips.length), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-[#F1F5F9]">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8]">Quick Actions</h2>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onRequestTanker}
          className="py-4 rounded-xl border border-cyan/20 bg-white text-cyan font-semibold text-sm hover:bg-cyan/5 transition-all flex flex-col items-center gap-2 group shadow-sm">
          <Truck size={20} />
          <span className="flex items-center gap-1">Request Tanker <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></span>
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onReportLeak}
          className="py-4 rounded-xl border border-amber/20 bg-white text-amber font-semibold text-sm hover:bg-amber/5 transition-all flex flex-col items-center gap-2 shadow-sm">
          <Droplets size={20} />
          Report Leak
        </motion.button>
      </div>

      {/* Active Order */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon animate-pulse" />
            <span className="text-sm font-semibold text-neon">Active Order #8901</span>
          </div>
          <span className="text-sm font-bold font-mono text-cyan">ETA {eta}m</span>
        </div>
        <div className="relative h-2 bg-[#F1F5F9] rounded-full overflow-hidden mb-3">
          <motion.div animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-cyan to-neon rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Truck size={14} className="text-[#94A3B8]" />
          <p className="text-[13px] text-[#64748B]">
            <span className="text-cyan font-medium">KA-01-MQ-4421</span> — Indiranagar 80ft Rd
          </p>
        </div>
      </div>

      {/* Your Ward */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#1E293B]">HSR Layout <span className="text-[#94A3B8] font-normal text-xs">W174</span></h3>
        </div>
        <div className="flex items-center gap-2.5 bg-red/5 border border-red/15 rounded-lg px-3 py-2.5 mb-3">
          <AlertTriangle size={16} className="text-red shrink-0" />
          <span className="text-[13px] text-red font-medium">Critical Shortage Alert</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-center">
            <Droplets size={16} className="text-red mx-auto mb-1.5" />
            <span className="text-lg font-bold font-mono text-red block">31%</span>
            <span className="text-[11px] text-[#94A3B8]">Reservoir</span>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-center">
            <Clock size={16} className="text-amber mx-auto mb-1.5" />
            <span className="text-lg font-bold font-mono text-amber block">31m</span>
            <span className="text-[11px] text-[#94A3B8]">Avg ETA</span>
          </div>
        </div>
      </div>

      {/* Ops Snapshot */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Gauge size={14} className="text-[#94A3B8]" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8]">Ops Snapshot</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Tankers" value={activeTankers} color="cyan" compact icon={<Truck size={12} />} />
          <StatTile label="Pending" value={pendingReqs} color="amber" compact fluctuate={false} icon={<Clock size={12} />} />
          <StatTile label="At Risk" value={wardsAtRisk} color="red" compact icon={<AlertTriangle size={12} />} />
          <StatTile label="Fulfilled" value={`${fulfilled}%`} color="neon" compact fluctuate={false} icon={<CheckCircle size={12} />} />
        </div>
      </div>

      {/* Tip */}
      <div className="rounded-xl border border-neon/15 bg-neon/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb size={14} className="text-neon" />
          <span className="text-xs font-semibold text-neon/80 uppercase tracking-wider">Conservation Tip</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={tipIndex} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="text-[13px] text-[#64748B] leading-relaxed">
            {conservationTips[tipIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
