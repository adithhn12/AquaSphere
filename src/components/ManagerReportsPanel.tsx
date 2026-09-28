import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Droplets, Search, BarChart3, Camera, X as XIcon, Eye } from 'lucide-react';
import type { WaterRequest } from '../data/requests';
import type { LeakReport } from '../data/requests';

interface Props {
  leakReports: LeakReport[];
  onUpdateLeakStatus: (id: string, status: LeakReport['status']) => void;
}

interface UnifiedRow {
  id: string;
  type: 'Leak Report';
  ward: string;
  status: string;
  timestamp: string;
  detail: string;
  sourceType: 'leak';
  imageUrl?: string | null;
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
  Resolved:   'bg-emerald-50 text-[#10B981] border-emerald-200',
  Rejected:   'bg-red-50 text-[#EF4444] border-red-200',
};

const STATUS_OPTIONS_LEAK = ['Pending', 'Dispatched', 'Resolved', 'Rejected'] as const;

export default function ManagerReportsPanel({ leakReports, onUpdateLeakStatus }: Props) {
  const [search, setSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const unified = useMemo<UnifiedRow[]>(() => {
    const leakRows: UnifiedRow[] = leakReports.map(r => ({
      id: r.id,
      type: 'Leak Report',
      ward: r.ward,
      status: r.status,
      timestamp: r.timestamp,
      detail: `${r.severity.toUpperCase()} · ${r.reporterName}`,
      sourceType: 'leak',
      imageUrl: r.imageUrl,
    }));
    let all = [...leakRows].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (search.trim()) {
      const q = search.toLowerCase();
      all = all.filter(r => r.id.toLowerCase().includes(q) || r.ward.toLowerCase().includes(q) || r.detail.toLowerCase().includes(q));
    }
    return all;
  }, [leakReports, search]);

  const pendingLeaks = leakReports.filter(r => r.status === 'Pending').length;
  const resolvedLeaks = leakReports.filter(r => r.status === 'Resolved').length;

  const handleStatusChange = (row: UnifiedRow, newStatus: string) => {
    onUpdateLeakStatus(row.id, newStatus as LeakReport['status']);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 bg-[#F1F5F9] overflow-auto h-full">
      <div className="flex items-center gap-2">
        <Droplets size={20} className="text-[#0EA5E9]" />
        <h2 className="text-lg font-semibold text-[#1E293B]">Infrastructure Leak Management</h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Reports', value: leakReports.length, color: 'text-[#0EA5E9]', bg: 'bg-sky-50 border-sky-200' },
          { label: 'Pending Issues', value: pendingLeaks, color: 'text-[#F59E0B]', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Resolved Leaks', value: resolvedLeaks, color: 'text-[#10B981]', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Active Repairs', value: leakReports.filter(r => r.status === 'Dispatched').length, color: 'text-sky-500', bg: 'bg-sky-50 border-sky-200' },
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
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, ward, or reporter name…"
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
                  const opts = STATUS_OPTIONS_LEAK;
                  return (
                    <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors align-top">
                      <td className="px-4 py-3"><span className="font-mono text-[13px] font-semibold text-[#1E293B]">{row.id}</span></td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#F59E0B]">
                          <Droplets size={12} />
                          {row.type}
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className="text-[13px] text-[#1E293B] font-medium">{row.ward}</span></td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-[#64748B]">{row.detail}</span>
                          {row.imageUrl && (
                            <button 
                              onClick={() => setSelectedImage(row.imageUrl!)}
                              className="p-1 rounded-md bg-sky-50 text-[#0EA5E9] hover:bg-sky-100 transition-colors flex items-center gap-1 text-[10px] font-bold"
                              title="View Evidence"
                            >
                              <Camera size={12} />
                              VIEW
                            </button>
                          )}
                        </div>
                      </td>
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
      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-md transition-all"
                >
                  <XIcon size={20} />
                </button>
              </div>
              <div className="p-2">
                <img src={selectedImage} alt="Leak Evidence" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
              </div>
              <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#64748B]">
                  <Camera size={16} />
                  <span className="text-sm font-medium">Citizen Reported Evidence</span>
                </div>
                <span className="text-xs text-[#94A3B8]">Evidence verified via GPS stamping</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
