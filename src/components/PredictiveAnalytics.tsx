import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, Truck, AlertTriangle, Shield, Thermometer, Activity, Scale } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import * as fallbackData from '../data/BengaluruCrisisFeed';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, ReferenceLine 
} from 'recharts';

export default function PredictiveAnalytics() {
  const { data: dbAnalytics, loading } = useFirestore<any>('analytics');
  const [isCrisis, setIsCrisis] = useState(false);

  if (loading && dbAnalytics.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#F1F5F9] space-y-4">
        <Brain className="text-sky-500 animate-pulse" size={48} />
        <h2 className="text-lg font-semibold text-[#1E293B]">Analyzing Grid...</h2>
      </div>
    );
  }

  const feed = dbAnalytics?.find(d => d.id === 'crisisFeed') || {
    waterStressedZones: fallbackData.waterStressedZones,
    tankerLogistics: fallbackData.tankerLogistics,
    regulatoryCompliance: fallbackData.regulatoryCompliance
  };
  const rawInputs = dbAnalytics?.find(d => d.id === 'forecastInputs')?.data || fallbackData.wardForecastInputs;
  
  // Simulate crisis mode by boosting depletion rates
  const inputs = isCrisis 
    ? rawInputs.map((i: any) => ({ ...i, borewellDepletionRatePercent: Math.min(98, i.borewellDepletionRatePercent + 40) }))
    : rawInputs;

  const { waterStressedZones, tankerLogistics, regulatoryCompliance } = feed;

  return (
    <div className="p-6 space-y-6 bg-[#F1F5F9] overflow-auto h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-[#0EA5E9]" />
          <h2 className="text-lg font-semibold text-[#1E293B]">Predictive Analytics</h2>
        </div>
        <button 
          onClick={() => setIsCrisis(!isCrisis)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
            isCrisis 
              ? 'bg-red-500 text-white hover:bg-red-600 ring-4 ring-red-100' 
              : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-red-50 hover:text-red-500 hover:border-red-200'
          }`}
        >
          <Activity size={14} className={isCrisis ? 'animate-pulse' : ''} />
          {isCrisis ? 'CRISIS SIMULATION ACTIVE' : 'RUN AI STRESS TEST'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-[#EF4444]">
            <AlertTriangle size={18} />
            <h3 className="text-sm font-semibold">Stress Zones</h3>
          </div>
          <span className="text-3xl font-bold text-[#1E293B]">{waterStressedZones?.totalDepletedNeighborhoods || 448}</span>
          <p className="text-xs text-[#94A3B8] mt-1">Neighborhoods with critical groundwater depletion</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-[#0EA5E9]">
            <Truck size={18} />
            <h3 className="text-sm font-semibold">Tanker Fleet</h3>
          </div>
          <span className="text-3xl font-bold text-[#1E293B]">{tankerLogistics?.totalSanchariCauveryUnits || 1260}</span>
          <p className="text-xs text-[#94A3B8] mt-1">Active Sanchari Cauvery units in rotation</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-[#10B981]">
            <Scale size={18} />
            <h3 className="text-sm font-semibold">Regulatory</h3>
          </div>
          <span className="text-3xl font-bold text-[#1E293B]">{regulatoryCompliance?.rwh?.compliancePercent || 69.6}%</span>
          <p className="text-xs text-[#94A3B8] mt-1">RWH mandate compliance across property base</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#1E293B]">Ward Telemetry Analytics</h3>
            <p className="text-[11px] text-[#94A3B8]">Borewell Depletion Rate (%) vs Ward Geography</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold">
            <div className="flex items-center gap-1.5 text-emerald-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              STABLE
            </div>
            <div className="flex items-center gap-1.5 text-red-500">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              CRITICAL
            </div>
          </div>
        </div>
        <div className="p-6 h-[400px]">
          {inputs.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inputs} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="ward" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  unit="%"
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }}
                />
                <ReferenceLine y={50} stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Stress Threshold', fill: '#EF4444', fontSize: 10 }} />
                <Bar 
                  dataKey="borewellDepletionRatePercent" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                  animationDuration={1500}
                >
                  {inputs.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.borewellDepletionRatePercent > 50 ? '#EF4444' : '#10B981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#94A3B8]">
              <Activity className="mb-2 opacity-20" size={48} />
              <p className="text-sm">No telemetry data found. Please seed the database.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
