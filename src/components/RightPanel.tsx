import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Radio, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import ForecastBar from './ForecastBar';
import IncidentCard from './IncidentCard';
import { forecastWards, incidents, demandHistory } from '../data/mockData';

export default function RightPanel() {
  const [chartData, setChartData] = useState(demandHistory);

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev =>
        prev.map(d => ({
          ...d,
          demand: Math.max(10, Math.min(100, d.demand + (Math.random() * 4 - 2))),
          supply: Math.max(10, Math.min(100, d.supply + (Math.random() * 3 - 1.5))),
        }))
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-[#F1F5F9]">
      {/* Forecast */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-cyan" />
            <h3 className="text-sm font-semibold text-[#1E293B]">7-Day Shortage Forecast</h3>
          </div>
          <span className="text-[10px] font-mono text-cyan bg-cyan/8 px-2 py-1 rounded-md border border-cyan/15">
            PROPHET v2.1
          </span>
        </div>
        {forecastWards.map((ward, index) => (
          <ForecastBar key={ward.id} wardId={ward.id} wardName={ward.name}
            probability={ward.prob} demandChange={ward.change} status={ward.status} index={index} />
        ))}
      </div>

      {/* Incident Feed */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#1E293B]">Incident Feed</h3>
            <motion.div animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-red" />
          </div>
          <div className="flex items-center gap-1.5">
            <Radio size={10} className="text-red animate-pulse-glow" />
            <span className="text-[11px] text-red font-medium">Live</span>
          </div>
        </div>
        <div className="max-h-[240px] overflow-y-auto incident-scroll">
          {incidents.map((incident, index) => (
            <IncidentCard key={incident.id} incident={incident} index={index} />
          ))}
        </div>
      </div>

      {/* Demand Chart */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-cyan" />
            <h3 className="text-sm font-semibold text-[#1E293B]">Today's Demand vs Supply</h3>
          </div>
        </div>
        <div className="h-[170px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="supplyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="hour" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 12, color: '#1E293B' }}
                labelStyle={{ color: '#94A3B8' }} />
              <Area type="monotone" dataKey="demand" stroke="#EF4444" fill="url(#demandGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="supply" stroke="#0EA5E9" fill="url(#supplyGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-[3px] bg-red rounded-full" />
            <span className="text-xs text-[#94A3B8]">Demand</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-[3px] bg-cyan rounded-full" />
            <span className="text-xs text-[#94A3B8]">Supply</span>
          </div>
        </div>
      </div>
    </div>
  );
}
