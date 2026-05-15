import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Droplets, Truck, AlertTriangle, TrendingUp, TrendingDown, FileText, Clock, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { demandHistory, wards } from '../data/mockData';
import type { LeakReport } from '../data/requests';

interface Props {
  leakReports: LeakReport[];
  onUpdateLeakStatus: (id: string, status: LeakReport['status']) => void;
}

const leakTrend = [
  { day: 'Mon', leaks: 5 }, { day: 'Tue', leaks: 8 }, { day: 'Wed', leaks: 3 },
  { day: 'Thu', leaks: 12 }, { day: 'Fri', leaks: 7 }, { day: 'Sat', leaks: 4 }, { day: 'Sun', leaks: 6 },
];

const dispatchLog = [
  { id: 'LOG-001', time: '14:32', event: 'Tanker TNK-218 dispatched to HSR Layout', type: 'dispatch' },
  { id: 'LOG-002', time: '14:18', event: 'Leak report filed — BTM Layout Sec 2', type: 'leak' },
  { id: 'LOG-003', time: '13:55', event: 'Delivery confirmed — Koramangala 4th Block (8,000L)', type: 'delivery' },
  { id: 'LOG-004', time: '13:42', event: 'Critical alert triggered — Varthur reservoir 18%', type: 'alert' },
  { id: 'LOG-005', time: '13:20', event: 'Tanker TNK-409 returned to depot', type: 'dispatch' },
  { id: 'LOG-006', time: '12:58', event: 'Contamination report — Varthur TDS >800ppm', type: 'alert' },
];

const logColors: Record<string, string> = {
  dispatch: 'text-[#0EA5E9] bg-sky-50',
  leak: 'text-[#F59E0B] bg-amber-50',
  delivery: 'text-[#10B981] bg-emerald-50',
  alert: 'text-[#EF4444] bg-red-50',
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  return `${h}h ago`;
}

const sevStyle: Record<string, { badge: string; dot: string }> = {
  high:   { badge: 'bg-red-50 text-[#EF4444] border-red-200',    dot: 'bg-red-500' },
  medium: { badge: 'bg-amber-50 text-[#F59E0B] border-amber-200', dot: 'bg-amber-500' },
  low:    { badge: 'bg-emerald-50 text-[#10B981] border-emerald-200', dot: 'bg-emerald-500' },
};

const statusStyle: Record<string, { badge: string }> = {
  Pending:    { badge: 'bg-amber-50 text-[#F59E0B] border-amber-200' },
  Dispatched: { badge: 'bg-sky-50 text-[#0EA5E9] border-sky-200' },
  Resolved:   { badge: 'bg-emerald-50 text-[#10B981] border-emerald-200' },
};

export default function AdminReportsPanel({ leakReports, onUpdateLeakStatus }: Props) {
  const criticalWards = wards.filter(w => w.status === 'critical').length;
  const riskWards = wards.filter(w => w.status === 'risk').length;
  const pendingLeaks = leakReports.filter(r => r.status === 'Pending').length;
  const [_expandedLeak] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-6 space-y-6 bg-[#F1F5F9] overflow-auto h-full">
      <div className="flex items-center gap-2">
        <BarChart3 size={20} className="text-[#0EA5E9]" />
        <h2 className="text-lg font-semibold text-[#1E293B]">Reports Overview</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Dispatches', value: '2,847', icon: <Truck size={18} />, color: 'text-[#0EA5E9]', bg: 'bg-sky-50 border-sky-200', trend: '+12%', up: true },
          { label: 'Water Distributed', value: '45.2 MLD', icon: <Droplets size={18} />, color: 'text-[#10B981]', bg: 'bg-emerald-50 border-emerald-200', trend: '+3.2%', up: true },
          { label: 'Leak Reports', value: String(leakReports.length), icon: <AlertTriangle size={18} />, color: 'text-[#F59E0B]', bg: 'bg-amber-50 border-amber-200', trend: `${pendingLeaks} pending`, up: false },
          { label: 'Critical Wards', value: String(criticalWards), icon: <AlertTriangle size={18} />, color: 'text-[#EF4444]', bg: 'bg-red-50 border-red-200', trend: `${riskWards} at risk`, up: false },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`${c.bg} border rounded-xl p-4`}>
            <div className={`${c.color} mb-2`}>{c.icon}</div>
            <span className="text-2xl font-bold text-[#1E293B] block">{c.value}</span>
            <span className="text-xs text-[#94A3B8]">{c.label}</span>
            <div className="flex items-center gap-1 mt-1">
              {c.up ? <TrendingUp size={12} className="text-[#10B981]" /> : <TrendingDown size={12} className="text-[#EF4444]" />}
              <span className={`text-[11px] font-medium ${c.up ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{c.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════
         LEAK INSPECTION FEED — citizen-submitted reports
         ════════════════════════════════════════════════ */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-[#F59E0B]" />
            <h3 className="text-sm font-semibold text-[#1E293B]">Citizen Leak Reports</h3>
            {pendingLeaks > 0 && (
              <span className="bg-red-50 text-[#EF4444] border border-red-200 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
                {pendingLeaks} NEW
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#94A3B8]">{leakReports.length} total</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {leakReports.map((report, i) => {
            const sev = sevStyle[report.severity];
            const stat = statusStyle[report.status];
            // Future: expandable detail view
            void _expandedLeak;

            return (
              <motion.div key={report.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden hover:shadow-md transition-shadow">

                {/* Image preview (if available) */}
                {report.imageUrl && (
                  <img src={report.imageUrl} alt={`Leak at ${report.ward}`}
                    className="w-full h-36 object-cover border-b border-[#E2E8F0]" />
                )}
                {!report.imageUrl && (
                  <div className="w-full h-24 bg-[#F1F5F9] border-b border-[#E2E8F0] flex items-center justify-center">
                    <ImageIcon size={28} className="text-[#CBD5E1]" />
                  </div>
                )}

                {/* Card body */}
                <div className="p-3.5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-[#1E293B]">{report.ward}</span>
                        <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-md border ${sev.badge}`}>
                          {report.severity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                        <Clock size={10} />
                        <span>{timeAgo(report.timestamp)}</span>
                        <span>·</span>
                        <span>{report.reporterName}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${stat.badge}`}>
                      {report.status}
                    </span>
                  </div>

                  <p className="text-[12px] text-[#64748B] leading-relaxed mb-3 line-clamp-2">
                    {report.description}
                  </p>

                  <span className="text-[10px] text-[#94A3B8] font-mono block mb-3">{report.id}</span>

                  {/* Action menu */}
                  {report.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => onUpdateLeakStatus(report.id, 'Dispatched')}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-sky-50 border border-sky-200 text-[#0EA5E9] text-[11px] font-semibold hover:bg-sky-100 transition-all">
                        <Truck size={12} /> Dispatch Crew
                      </button>
                      <button onClick={() => onUpdateLeakStatus(report.id, 'Resolved')}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[#10B981] text-[11px] font-semibold hover:bg-emerald-100 transition-all">
                        <CheckCircle size={12} /> Mark Resolved
                      </button>
                    </div>
                  )}
                  {report.status === 'Dispatched' && (
                    <button onClick={() => onUpdateLeakStatus(report.id, 'Resolved')}
                      className="w-full flex items-center justify-center gap-1 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[#10B981] text-[11px] font-semibold hover:bg-emerald-100 transition-all">
                      <CheckCircle size={12} /> Mark Resolved
                    </button>
                  )}
                  {report.status === 'Resolved' && (
                    <div className="flex items-center justify-center gap-1 py-2 text-[11px] text-[#10B981] font-medium">
                      <CheckCircle size={12} /> Resolved
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {leakReports.length === 0 && (
            <div className="col-span-full text-center py-10 text-[#94A3B8] text-sm">
              No leak reports yet. Citizen submissions will appear here.
            </div>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Today's Demand vs Supply</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demandHistory} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="rDemand" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} /><stop offset="95%" stopColor="#EF4444" stopOpacity={0} /></linearGradient>
                  <linearGradient id="rSupply" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.15} /><stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="hour" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="demand" stroke="#EF4444" fill="url(#rDemand)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="supply" stroke="#0EA5E9" fill="url(#rSupply)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Leak Reports This Week</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leakTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="leaks" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#0EA5E9]" />
            <h3 className="text-sm font-semibold text-[#1E293B]">Recent System Logs</h3>
          </div>
          <span className="text-[11px] text-[#94A3B8]">{dispatchLog.length} entries</span>
        </div>
        <div className="space-y-2">
          {dispatchLog.map((log, i) => (
            <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-white transition-colors">
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md shrink-0 ${logColors[log.type]}`}>
                {log.type.toUpperCase()}
              </span>
              <span className="text-[13px] text-[#1E293B] flex-1">{log.event}</span>
              <span className="text-[11px] text-[#94A3B8] font-mono shrink-0">{log.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
