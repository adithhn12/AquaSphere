import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, Truck, CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronDown, MapPin, Map } from 'lucide-react';
import type { WaterRequest } from '../data/requests';

interface Props {
  requests: WaterRequest[];
  onUpdateStatus: (id: string, status: WaterRequest['status']) => void;
}

/* ── Static data for dropdowns ──────────────────────── */
const BENGALURU_ZONES = [
  { value: 'all', label: 'All Zones' },
  { value: 'east',    label: 'East Zone' },
  { value: 'south',   label: 'South Zone' },
  { value: 'west',    label: 'West Zone' },
  { value: 'north',   label: 'North Zone' },
  { value: 'central', label: 'Central Zone' },
] as const;

const WARD_BY_ZONE: Record<string, { value: string; label: string }[]> = {
  all: [
    { value: 'all', label: 'All Wards' },
    { value: 'Indiranagar',  label: 'Indiranagar' },
    { value: 'Koramangala',  label: 'Koramangala' },
    { value: 'Jayanagar',    label: 'Jayanagar' },
    { value: 'Whitefield',   label: 'Whitefield' },
    { value: 'HSR Layout',   label: 'HSR Layout' },
    { value: 'BTM Layout',   label: 'BTM Layout' },
    { value: 'Hebbal',       label: 'Hebbal' },
    { value: 'Malleshwaram', label: 'Malleshwaram' },
    { value: 'Rajajinagar',  label: 'Rajajinagar' },
    { value: 'Yelahanka',    label: 'Yelahanka' },
    { value: 'Varthur',      label: 'Varthur' },
    { value: 'Bellandur',    label: 'Bellandur' },
  ],
  east:    [{ value: 'all', label: 'All Wards' }, { value: 'Indiranagar', label: 'Indiranagar' }, { value: 'Whitefield', label: 'Whitefield' }, { value: 'Varthur', label: 'Varthur' }],
  south:   [{ value: 'all', label: 'All Wards' }, { value: 'Koramangala', label: 'Koramangala' }, { value: 'Jayanagar', label: 'Jayanagar' }, { value: 'HSR Layout', label: 'HSR Layout' }, { value: 'BTM Layout', label: 'BTM Layout' }, { value: 'Bellandur', label: 'Bellandur' }],
  west:    [{ value: 'all', label: 'All Wards' }, { value: 'Rajajinagar', label: 'Rajajinagar' }, { value: 'Malleshwaram', label: 'Malleshwaram' }],
  north:   [{ value: 'all', label: 'All Wards' }, { value: 'Hebbal', label: 'Hebbal' }, { value: 'Yelahanka', label: 'Yelahanka' }],
  central: [{ value: 'all', label: 'All Wards' }, { value: 'Malleshwaram', label: 'Malleshwaram' }],
};

const AVAILABLE_DRIVERS = [
  { id: 'DRV-2026-987', name: 'Ramesh K.',   plate: 'KA-01-MQ-4421', tankerId: 'TNK-218' },
  { id: 'DRV-2026-445', name: 'Suresh M.',   plate: 'KA-03-AB-7891', tankerId: 'TNK-307' },
  { id: 'DRV-2026-312', name: 'Praveen L.',  plate: 'KA-05-CD-2345', tankerId: 'TNK-409' },
  { id: 'DRV-2026-678', name: 'Kumar R.',    plate: 'KA-02-EF-6789', tankerId: 'TNK-512' },
  { id: 'DRV-2026-890', name: 'Anil S.',     plate: 'KA-04-GH-1234', tankerId: 'TNK-615' },
];

/* ── Helpers ────────────────────────────────────────── */
function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

const STATUS_BADGE: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  Pending:    { bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-500',   label: 'Pending' },
  Dispatched: { bg: 'bg-sky-50',     text: 'text-sky-600',     dot: 'bg-sky-500',     label: 'Dispatched' },
  Delivered:  { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Delivered' },
  Rejected:   { bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-400',     label: 'Rejected' },
};

const URGENCY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-amber-500',
  normal: 'bg-sky-400',
  low: 'bg-slate-300',
};

const ROWS_PER_PAGE = 6;

/* Reusable styled select */
const selectClass =
  'appearance-none w-full bg-white border border-[#E2E8F0] rounded-lg pl-9 pr-8 py-2 text-[13px] font-medium text-[#1E293B] shadow-sm focus:outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-200 transition-all cursor-pointer';

const selectArrowStyle: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
};

/* ── Component ──────────────────────────────────────── */
export default function AdminRequestsPanel({ requests, onUpdateStatus }: Props) {
  const [zone, setZone] = useState('all');
  const [ward, setWard] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | WaterRequest['status']>('all');
  const [page, setPage] = useState(0);
  // Track which row has the driver dropdown open
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const pendingCount    = requests.filter(r => r.status === 'Pending').length;
  const dispatchedCount = requests.filter(r => r.status === 'Dispatched').length;
  const deliveredCount  = requests.filter(r => r.status === 'Delivered').length;

  const wardOptions = WARD_BY_ZONE[zone] || WARD_BY_ZONE.all;

  const filtered = useMemo(() => {
    let list = requests;
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter);
    if (ward !== 'all') {
      const q = ward.toLowerCase();
      list = list.filter(r => r.area.toLowerCase().includes(q));
    }
    return list;
  }, [requests, statusFilter, ward]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageSlice = filtered.slice(safePage * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE + ROWS_PER_PAGE);

  const resetPage = () => setPage(0);

  const handleAssignDriver = (reqId: string, _driverId: string) => {
    onUpdateStatus(reqId, 'Dispatched');
    setAssigningId(null);
  };

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
      {/* ── Header ─────────────────────────────────── */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Inbox size={18} className="text-sky-500" />
            <h3 className="text-[15px] font-semibold text-[#1E293B]">Incoming Requests</h3>
            {pendingCount > 0 && (
              <motion.span key={pendingCount} initial={{ scale: 1.4 }} animate={{ scale: 1 }}
                className="bg-red-50 text-red-500 border border-red-200 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
                {pendingCount} NEW
              </motion.span>
            )}
          </div>
          <span className="text-xs text-[#94A3B8]">{requests.length} total</span>
        </div>

        {/* ── Status filter pills ────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {([
            { key: 'all' as const,        label: 'All',        count: requests.length },
            { key: 'Pending' as const,     label: 'Pending',    count: pendingCount },
            { key: 'Dispatched' as const,  label: 'Dispatched', count: dispatchedCount },
            { key: 'Delivered' as const,   label: 'Delivered',  count: deliveredCount },
          ]).map(p => (
            <button key={p.key} onClick={() => { setStatusFilter(p.key); resetPage(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                statusFilter === p.key
                  ? 'bg-sky-50 text-sky-600 border-sky-200 shadow-sm'
                  : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]'
              }`}>
              {p.label} <span className="font-mono ml-1 font-bold">{p.count}</span>
            </button>
          ))}
        </div>

        {/* ── Zone & Ward dropdown selectors ──────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Zone dropdown */}
          <div className="relative">
            <Map size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none z-10" />
            <select
              value={zone}
              onChange={e => { setZone(e.target.value); setWard('all'); resetPage(); }}
              className={selectClass}
              style={selectArrowStyle}
            >
              {BENGALURU_ZONES.map(z => (
                <option key={z.value} value={z.value}>{z.label}</option>
              ))}
            </select>
          </div>

          {/* Ward dropdown */}
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none z-10" />
            <select
              value={ward}
              onChange={e => { setWard(e.target.value); resetPage(); }}
              className={selectClass}
              style={selectArrowStyle}
            >
              {wardOptions.map(w => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-y border-[#E2E8F0] bg-[#F8FAFC]">
              <th className="px-5 py-2.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Request ID</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">RR Number</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Area / Location</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Volume</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Bill (₹)</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Time</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Status</th>
              <th className="px-5 py-2.5 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody>
            <AnimatePresence initial={false}>
              {pageSlice.length === 0 && (
                <tr>
                   <td colSpan={8} className="px-5 py-12 text-center text-[#94A3B8] text-sm">
                    No requests found for the selected zone and ward.
                  </td>
                </tr>
              )}

              {pageSlice.map((req) => {
                const badge = STATUS_BADGE[req.status] || STATUS_BADGE.Pending;
                const isAssigning = assigningId === req.id;

                return (
                  <motion.tr
                    key={req.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors align-top"
                  >
                    {/* Request ID */}
                    <td className="px-5 py-3">
                      <span className="font-mono text-[13px] font-semibold text-[#1E293B]">{req.id}</span>
                    </td>

                    {/* RR Number */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-[13px] text-sky-600">{req.rrNumber}</span>
                    </td>

                    {/* Area */}
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-[#1E293B] font-medium block">{req.area}</span>
                      <span className="text-[11px] text-[#94A3B8]">{req.name}</span>
                    </td>

                    {/* Volume */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${URGENCY_DOT[req.urgency]}`} />
                        <span className="text-[13px] text-[#1E293B] font-mono">{req.liters.toLocaleString()}L</span>
                      </div>
                    </td>

                    {/* Bill Amount */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      {req.billAmount ? (
                        <span className="text-[13px] text-[#10B981] font-bold font-mono">₹{req.billAmount.toLocaleString()}</span>
                      ) : (
                        <span className="text-[11px] text-[#94A3B8]">—</span>
                      )}
                    </td>

                    {/* Time */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-[12px] text-[#94A3B8]">{timeAgo(req.timestamp)}</span>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3 text-right">
                      {req.status === 'Pending' && !isAssigning && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setAssigningId(req.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-600 text-[11px] font-semibold hover:bg-sky-100 transition-all"
                          >
                            <Truck size={12} /> Assign Driver <ChevronDown size={10} />
                          </button>
                          <button
                            onClick={() => onUpdateStatus(req.id, 'Rejected')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-500 text-[11px] font-semibold hover:bg-red-100 transition-all"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      )}

                      {/* Driver assignment dropdown */}
                      {req.status === 'Pending' && isAssigning && (
                        <div className="flex flex-col items-end gap-2">
                          <div className="relative w-56">
                            <Truck size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none z-10" />
                            <select
                              defaultValue=""
                              onChange={e => {
                                if (e.target.value) handleAssignDriver(req.id, e.target.value);
                              }}
                              className="appearance-none w-full bg-white border border-sky-200 rounded-lg pl-8 pr-7 py-2 text-[12px] font-medium text-[#1E293B] shadow-md focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 cursor-pointer"
                              style={selectArrowStyle}
                            >
                              <option value="" disabled>Select driver & tanker…</option>
                              {AVAILABLE_DRIVERS.map(d => (
                                <option key={d.id} value={d.id}>
                                  {d.name} [{d.plate}] — {d.tankerId}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button onClick={() => setAssigningId(null)}
                            className="text-[10px] text-[#94A3B8] hover:text-[#64748B] transition-colors">
                            Cancel
                          </button>
                        </div>
                      )}

                      {req.status === 'Dispatched' && (
                        <button
                          onClick={() => onUpdateStatus(req.id, 'Delivered')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-[11px] font-semibold hover:bg-emerald-100 transition-all"
                        >
                          <CheckCircle size={12} /> Mark Delivered
                        </button>
                      )}

                      {req.status === 'Delivered' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                          <CheckCircle size={12} /> Complete
                        </span>
                      )}

                      {req.status === 'Rejected' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-400 font-medium">
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* ── Pagination ─────────────────────────────── */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-[#E2E8F0] flex items-center justify-between">
          <span className="text-xs text-[#94A3B8]">
            {safePage * ROWS_PER_PAGE + 1}–{Math.min((safePage + 1) * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0}
              className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] disabled:opacity-30 hover:bg-[#F8FAFC] transition-all">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-lg border text-xs font-medium transition-all ${
                  i === safePage ? 'bg-sky-50 border-sky-200 text-sky-600' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                }`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}
              className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] disabled:opacity-30 hover:bg-[#F8FAFC] transition-all">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
