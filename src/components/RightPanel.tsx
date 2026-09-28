import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Radio, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';
import ForecastBar from './ForecastBar';
import IncidentCard from './IncidentCard';
import { useFirestore } from '../hooks/useFirestore';
import type { Incident, DemandDataPoint } from '../data/mockData';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface ForecastWard {
  id: string;
  name: string;
  prob: number;
  change: string;
  status: 'critical' | 'risk' | 'stable';
}

export default function RightPanel() {
  const { data: dbForecastWards } = useFirestore<ForecastWard>('forecastWards');
  const { data: dbIncidents } = useFirestore<Incident>('incidents');
  const [chartData, setChartData] = useState<DemandDataPoint[]>([]);

  // Fallback logic for lists
  const forecastWards = dbForecastWards.length > 0 ? dbForecastWards : [
    { id: 'W118', name: 'Varthur', prob: 94, change: '+28%', status: 'critical' as const },
    { id: 'W174', name: 'HSR Layout', prob: 89, change: '+31%', status: 'critical' as const },
    { id: 'W150', name: 'Bellandur', prob: 86, change: '+22%', status: 'critical' as const },
  ];

  const incidents = dbIncidents.length > 0 ? dbIncidents : [
    { id: 'F1', type: 'LEAK_REPORT', time: 'Now', ward: 'BTM Layout', description: 'Major leak reported at Sec 4', severity: 'high' as const },
  ];

  useEffect(() => {
    console.log("Listening for demandHistory...");
    const unsub = onSnapshot(doc(db, 'stats', 'demandHistory'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data().data;
        console.log("Demand data received:", data);
        setChartData(data);
      } else {
        // FALLBACK: Use local mock data if DB is empty
        console.warn("stats/demandHistory document does not exist. Using local fallback.");
        import('../data/mockData').then(m => setChartData(m.demandHistory));
      }
    }, (error) => {
      console.error("Firestore Error in RightPanel:", error);
      // FALLBACK on error
      import('../data/mockData').then(m => setChartData(m.demandHistory));
    });
    return () => unsub();
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-bg-primary">
      {/* Forecast */}
      <div className="rounded-xl border border-border-dim bg-bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-cyan" />
            <h3 className="text-sm font-semibold text-text-primary">7-Day Shortage Forecast</h3>
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
      <div className="rounded-xl border border-border-dim bg-bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary">Incident Feed</h3>
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
      <div className="rounded-xl border border-border-dim bg-bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-cyan" />
            <h3 className="text-sm font-semibold text-text-primary">Today's Demand vs Supply</h3>
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
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-dim)" />
              <XAxis dataKey="hour" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border-dim)' }} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border-dim)' }} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-dim)', borderRadius: 12, fontSize: 12, color: 'var(--color-text-primary)' }}
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
