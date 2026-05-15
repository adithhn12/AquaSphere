import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Droplets, Search, BarChart3 } from 'lucide-react';
import type { WaterRequest } from '../data/requests';
import type { LeakReport } from '../data/requests';

interface Props {
  requests: WaterRequest[];
  leakReports: LeakReport[];
  onUpdateRequestStatus: (id: string, status: WaterRequest['status']) => void;
  onUpdateLeakStatus: (id: string, status: LeakReport['status']) => void;
}

type ItemType = 'all' | 'tanker' | 'leak';

interface UnifiedRow {
  id: string;
  type: 'Tanker Request' | 'Leak Report';
  ward: string;
  status: string;
  timestamp: string;
  detail: string;
  sourceType: 'request' | 'leak';
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

const STATUS_STYLE: Record<string, string> = {
  Pending:    'bg-amber-50 text-[#F59E0B] border-amber-200',
  Dispatched: 'bg-sky-50 text-[#0EA5E9] border-sky-200',
  Delivered:  'bg-emerald-50 text-[#10B981] border-emerald-200',
  Resolved:   'bg-emerald-50 text-[#10B981] border-emerald-200',
  Rejected:   'bg-red-50 text-[#EF4444] border-red-200',
};

const STATUS_OPTIONS_REQUEST = ['Pending', 'Dispatched', 'Delivered', 'Rejected'] as const;
const STATUS_OPTIONS_LEAK = ['Pending', 'Dispatched', 'Resolved'] as const;

export default function ManagerReportsPanel({ requests, leakReports, onUpdateRequestStatus, onUpdateLeakStatus }: Props) {
  const [typeFilter, setTypeFilter] = useState<ItemType>('all');
  const [search, setSearch] = useState('');

  const unified = useMemo<UnifiedRow[]>(() => {
    const reqRows: UnifiedRow[] = requests.map(r => ({
      id: r.id,
      type: 'Tanker Request',
      ward: r.area,
      status: r.status,
      timestamp: r.timestamp,
      detail: `${r.liters.toLocaleString()}L · ${r.name}${r.billAmount ? ` · ₹${r.billAmount.toLocaleString()}` : ''}`,
      sourceType: 'request',
    }));
    const leakRows: UnifiedRow[] = leakReports.map(r => ({
      id: r.id,
      type: 'Leak Report',
      ward: r.ward,
      status: r.status,
      timestamp: r.timestamp,
      detail: `${r.severity.toUpperCase()} · ${r.reporterName}`,
      sourceType: 'leak',
    }));
    let all = [...reqRows, ...leakRows].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (typeFilter === 'tanker') all = all.filter(r => r.sourceType === 'request');
    if (typeFilter === 'leak') all = all.filter(r => r.sourceType === 'leak');
    if (search.trim()) {
      const q = search.toLowerCase();
      all = all.filter(r => r.id.toLowerCase().includes(q) || r.ward.toLowerCase().includes(q) || r.detail.toLowerCase().includes(q));
    }
    return all;
  }, [requests, leakReports, typeFilter, search]);

  const pendingReqs = requests.filter(r => r.status === 'Pending').length;
  const pendingLeaks = leakReports.filter(r => r.status === 'Pending').length;

  const handleStatusChange = (row: UnifiedRow, newStatus: string) => {
    if (row.sourceType === 'request') onUpdateRequestStatus(row.id, newStatus as WaterRequest['status']);
    else onUpdateLeakStatus(row.id, newStatus as LeakReport['status']);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 bg-[#F1F5F9] overflow-auto h-full">
      <div className="flex items-center gap-2">
        <BarChart3 size={20} className="text-[#0EA5E9]" />
        <h2 className="text-lg font-semibold text-[#1E293B]">Request & Report Management</h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Requests', value: requests.length, color: 'text-[#0EA5E9]', bg: 'bg-sky-50 border-sky-200' },
          { label: 'Pending Requests', value: pendingReqs, color: 'text-[#F59E0B]', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Total Leak Reports', value: leakReports.length, color: 'text-[#0EA5E9]', bg: 'bg-sky-50 border-sky-200' },
          { label: 'Pending Leaks', value: pendingLeaks, color: 'text-[#EF4444]', bg: 'bg-red-50 border-red-200' },
        ].map((c, i) => (
          <div key={i} className={`${c.bg} border rounded-xl p-3 text-center`}>
            <span className={`text-2xl font-bold font-mono ${c.color}`}>{c.value}</span>
            <span className="text-[11px] text-[#94A3B8] block mt-0.5">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-2">
            {([
              { k: 'all' as const, l: 'All', c: unified.length },
              { k: 'tanker' as const, l: 'Tanker Requests', c: requests.length },
              { k: 'leak' as const, l: 'Leak Reports', c: leakReports.length },
            ]).map(f => (
              <button key={f.k} onClick={() => setTypeFilter(f.k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  typeFilter === f.k ? 'bg-sky-50 text-[#0EA5E9] border-sky-200' : 'bg-white text-[#64748B] border-[#E2E8F0]'
                }`}>
                {f.l} <span className="font-mono font-bold ml-1">{f.c}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, ward, or name…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-sky-300" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-y border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Item ID</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Issue Type</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Location / Ward</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider hidden md:table-cell">Details</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider hidden sm:table-cell">Time</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {unified.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#94A3B8] text-sm">No items match your filter.</td></tr>
                )}
                {unified.map(row => {
                  const sty = STATUS_STYLE[row.status] || STATUS_STYLE.Pending;
                  const opts = row.sourceType === 'request' ? STATUS_OPTIONS_REQUEST : STATUS_OPTIONS_LEAK;
                  return (
                    <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors align-top">
                      <td className="px-4 py-3"><span className="font-mono text-[13px] font-semibold text-[#1E293B]">{row.id}</span></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
                          row.sourceType === 'request' ? 'text-[#0EA5E9]' : 'text-[#F59E0B]'
                        }`}>
                          {row.sourceType === 'request' ? <Truck size={12} /> : <Droplets size={12} />}
                          {row.type}
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className="text-[13px] text-[#1E293B] font-medium">{row.ward}</span></td>
                      <td className="px-4 py-3 hidden md:table-cell"><span className="text-[12px] text-[#64748B]">{row.detail}</span></td>
                      <td className="px-4 py-3 hidden sm:table-cell"><span className="text-[12px] text-[#94A3B8]">{timeAgo(row.timestamp)}</span></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${sty}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={row.status}
                          onChange={e => handleStatusChange(row, e.target.value)}
                          className="appearance-none bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-[11px] font-medium text-[#1E293B] focus:outline-none focus:border-sky-300 cursor-pointer pr-7"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 8px center',
                          }}
                        >
                          {opts.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
