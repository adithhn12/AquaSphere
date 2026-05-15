import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Droplets, AlertTriangle, MapPin, Phone, Star, Clock, ChevronRight, Trophy, Shield, Award, Gauge, TrendingUp } from 'lucide-react';
import { citizenBadges, leaderboard } from '../data/mockData';

interface CitizenViewProps { onRequestTanker: () => void; onReportLeak: () => void; }

export default function CitizenView({ onRequestTanker, onReportLeak }: CitizenViewProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'tracking' | 'score'>('home');
  const [eta, setEta] = useState(24);
  const [driverLat, setDriverLat] = useState(0.62);
  const [waterLevel, setWaterLevel] = useState(31);

  useEffect(() => {
    const interval = setInterval(() => {
      setEta(prev => Math.max(1, prev - (Math.random() > 0.5 ? 1 : 0)));
      setDriverLat(prev => Math.min(0.95, prev + 0.01));
      setWaterLevel(prev => Math.max(5, Math.min(50, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const conservationScore = 2380;
  const monthlyGoal = 3000;

  return (
    <div className="h-full bg-[#F1F5F9] overflow-hidden flex flex-col">
      {/* Top status bar */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1E293B]">Welcome back, Citizen</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <MapPin size={10} className="text-[#94A3B8]" />
              <span className="text-[11px] text-[#94A3B8]">W174 • HSR Layout, Bengaluru</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] text-red-500 font-semibold">CRITICAL</span>
            </div>
            <span className="text-[10px] text-[#94A3B8]">Level: {waterLevel}%</span>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Alert Banner */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-600">Critical Water Shortage</h3>
                    <p className="text-[13px] text-[#64748B] mt-1">HSR Layout reservoir at {waterLevel}%. BWSSB has deployed emergency tankers.</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onRequestTanker}
                    className="bg-white border border-sky-200 rounded-xl p-4 text-left shadow-sm hover:shadow-md transition-all">
                    <Truck size={24} className="text-sky-500 mb-2" />
                    <h3 className="text-sm font-semibold text-sky-600">Request Tanker</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-1">Get water delivered to your home</p>
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onReportLeak}
                    className="bg-white border border-amber-200 rounded-xl p-4 text-left shadow-sm hover:shadow-md transition-all">
                    <Droplets size={24} className="text-amber-500 mb-2" />
                    <h3 className="text-sm font-semibold text-amber-600">Report Leak</h3>
                    <p className="text-[11px] text-[#94A3B8] mt-1">Help us save water in your area</p>
                  </motion.button>
                </div>

                {/* Active Order */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab('tracking')}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-sm font-semibold text-emerald-600">Active Order #8901</span>
                    </div>
                    <ChevronRight size={14} className="text-[#94A3B8]" />
                  </div>
                  <div className="relative h-2 bg-[#F1F5F9] rounded-full overflow-hidden mb-3">
                    <motion.div animate={{ width: `${driverLat * 100}%` }} className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck size={14} className="text-[#94A3B8]" />
                      <span className="text-[13px] text-[#64748B]"><span className="text-sky-500 font-medium">KA-01-MQ-4421</span></span>
                    </div>
                    <span className="text-sm font-bold font-mono text-sky-600">ETA {eta}m</span>
                  </div>
                </div>

                {/* Water Status */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8] mb-3">Your Area · Water Status</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: <Gauge size={18} />, value: `${waterLevel}%`, label: 'Reservoir', color: 'text-red-500' },
                      { icon: <Clock size={18} />, value: '31m', label: 'Avg ETA', color: 'text-amber-500' },
                      { icon: <TrendingUp size={18} />, value: '84%', label: 'Fulfilled', color: 'text-emerald-500' },
                    ].map((s, i) => (
                      <div key={i} className="text-center bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
                        <div className={`${s.color} mx-auto mb-1.5`}>{s.icon}</div>
                        <span className={`text-lg font-bold font-mono ${s.color} block`}>{s.value}</span>
                        <span className="text-[10px] text-[#94A3B8]">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conservation Score */}
                <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => setActiveTab('score')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className="text-emerald-500" />
                      <span className="text-sm font-semibold text-emerald-600">Conservation Score</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold font-mono text-emerald-600">{conservationScore}</span>
                      <ChevronRight size={14} className="text-[#94A3B8]" />
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 rounded-full" style={{ width: `${(conservationScore / monthlyGoal) * 100}%` }} />
                  </div>
                  <span className="text-[11px] text-[#94A3B8] mt-1 block">{conservationScore}/{monthlyGoal} pts to next rank</span>
                </div>
              </motion.div>
            )}

            {activeTab === 'tracking' && (
              <motion.div key="tracking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <button onClick={() => setActiveTab('home')} className="text-xs text-sky-500 font-medium hover:text-sky-600">← Back to Home</button>
                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-sky-50 p-4 border-b border-sky-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-sky-600">ORDER #8901</span>
                      <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">IN TRANSIT</span>
                    </div>
                    <span className="text-2xl font-bold text-sky-600">ETA {eta} min</span>
                  </div>
                  <div className="p-4 space-y-4">
                    {[
                      { label: 'Order Confirmed', time: '15:48', done: true },
                      { label: 'Tanker Assigned', time: '15:52', done: true },
                      { label: 'Filling Complete', time: '15:58', done: true },
                      { label: 'In Transit', time: '16:05', done: true, active: true },
                      { label: 'Arriving', time: `~16:${String(Math.min(59, 5 + eta)).padStart(2, '0')}`, done: false },
                      { label: 'Delivery Complete', time: '—', done: false },
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full border-2 ${step.done ? step.active ? 'bg-sky-500 border-sky-500' : 'bg-emerald-400 border-emerald-400' : 'border-[#CBD5E1] bg-white'}`} />
                          {i < 5 && <div className={`w-[1px] h-6 ${step.done ? 'bg-emerald-300' : 'bg-[#E2E8F0]'}`} />}
                        </div>
                        <div className="flex-1 flex items-center justify-between -mt-0.5">
                          <span className={`text-[13px] ${step.done ? 'text-[#1E293B]' : 'text-[#94A3B8]'} ${step.active ? 'text-sky-600 font-semibold' : ''}`}>{step.label}</span>
                          <span className="text-[11px] text-[#94A3B8]">{step.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#E2E8F0] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center"><Truck size={18} className="text-sky-500" /></div>
                        <div>
                          <span className="text-sm text-[#1E293B] font-semibold block">Ramesh K.</span>
                          <span className="text-[11px] text-[#94A3B8]">KA-01-MQ-4421 • 12,000L</span>
                          <div className="flex items-center gap-1 mt-0.5"><Star size={10} className="text-amber-400 fill-amber-400" /><span className="text-[11px] text-amber-500">4.8</span></div>
                        </div>
                      </div>
                      <button className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-all"><Phone size={16} className="text-emerald-500" /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'score' && (
              <motion.div key="score" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <button onClick={() => setActiveTab('home')} className="text-xs text-sky-500 font-medium hover:text-sky-600">← Back to Home</button>
                <div className="bg-white border border-emerald-200 rounded-xl p-5 text-center shadow-sm">
                  <Trophy size={32} className="text-emerald-500 mx-auto mb-2" />
                  <span className="text-4xl font-bold font-mono text-emerald-600 block">{conservationScore}</span>
                  <span className="text-xs text-[#94A3B8] uppercase tracking-wider">Conservation Points</span>
                  <div className="mt-3 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(conservationScore / monthlyGoal) * 100}%` }} transition={{ duration: 1, delay: 0.3 }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 rounded-full" />
                  </div>
                  <span className="text-[11px] text-emerald-500 mt-1 block">{monthlyGoal - conservationScore} pts to "Water Guardian"</span>
                </div>
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8] mb-3 flex items-center gap-2"><Award size={14} className="text-amber-500" /> Badges Earned</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {citizenBadges.map(badge => (
                      <div key={badge.name} className={`text-center p-3 rounded-xl border ${badge.earned ? 'border-emerald-200 bg-emerald-50' : 'border-[#E2E8F0] bg-[#F8FAFC] opacity-40'}`}>
                        <span className="text-xl block mb-1">{badge.icon}</span>
                        <span className="text-[9px] text-[#1E293B] font-semibold block">{badge.name}</span>
                        <span className="text-[8px] text-[#94A3B8]">{badge.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[#94A3B8] mb-3 flex items-center gap-2"><Shield size={14} className="text-sky-500" /> Ward Leaderboard</h3>
                  <div className="space-y-2">
                    {leaderboard.map(entry => (
                      <div key={entry.rank} className={`flex items-center gap-3 p-2.5 rounded-xl ${entry.name === 'You' ? 'bg-sky-50 border border-sky-200' : ''}`}>
                        <span className={`text-sm font-bold w-6 text-center ${entry.rank <= 3 ? 'text-amber-500' : 'text-[#94A3B8]'}`}>
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                        </span>
                        <div className="flex-1">
                          <span className={`text-[13px] ${entry.name === 'You' ? 'text-sky-600 font-bold' : 'text-[#1E293B] font-medium'}`}>{entry.name}</span>
                          <span className="text-[10px] text-[#94A3B8] block">{entry.ward}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[13px] font-bold text-[#1E293B]">{entry.score}</span>
                          <span className="text-[10px] text-emerald-500 block">{entry.trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="border-t border-[#E2E8F0] bg-white px-4 py-2">
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {[
            { id: 'home' as const, label: 'Home', icon: <Droplets size={18} /> },
            { id: 'tracking' as const, label: 'My Tanker', icon: <Truck size={18} /> },
            { id: 'score' as const, label: 'Score', icon: <Trophy size={18} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition-all ${activeTab === tab.id ? 'text-sky-500' : 'text-[#94A3B8] hover:text-[#64748B]'}`}>
              {tab.icon}
              <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
