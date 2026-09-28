import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, Truck, CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronDown, MapPin, Map } from 'lucide-react';
import type { WaterRequest } from '../data/requests';

interface Props {
  requests: WaterRequest[];
  onUpdateStatus: (id: string, status: WaterRequest['status'], driverIds?: string[]) => void;
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
  Pending:    { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500', label: 'Pending' },
  Dispatched: { bg: 'bg-sky-500/10',   text: 'text-sky-500',   dot: 'bg-sky-500',   label: 'Dispatched' },
  Delivered:  { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500', label: 'Delivered' },
  Rejected:   { bg: 'bg-red-500/10',     text: 'text-red-500',     dot: 'bg-red-500',     label: 'Rejected' },
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
  'appearance-none w-full bg-bg-primary border border-border-dim rounded-lg pl-9 pr-8 py-2 text-[13px] font-medium text-text-primary shadow-sm focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/20 transition-all cursor-pointer';

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
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [dispatchedDemoIds, setDispatchedDemoIds] = useState<string[]>([]);

  const pendingCount    = requests.filter(r => r.status === 'Pending').length;
  const dispatchedCount = requests.filter(r => r.status === 'Dispatched').length;
  const deliveredCount  = requests.filter(r => r.status === 'Delivered').length;

  const wardOptions = WARD_BY_ZONE[zone] || WARD_BY_ZONE.all;

  const { filtered, counts } = useMemo(() => {
    // Combine real DB requests with demo requests
    const fullList = [...requests];
    const demoItems = [
      { id: 'DEMO-REQ-7721', rrNumber: '10928374', name: 'B. Somashekar', area: 'HSR Layout Sector 2', liters: 8500, urgency: 'high', status: 'Pending', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), billAmount: 2400 },
      { id: 'DEMO-REQ-8832', rrNumber: '22334455', name: 'Prestige Ferns Res', area: 'Indiranagar 100ft Rd', liters: 12000, urgency: 'medium', status: 'Pending', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), billAmount: 3600 },
      { id: 'DEMO-REQ-9943', rrNumber: '44556677', name: 'Columbia Asia Hosp', area: 'Whitefield Main Rd', liters: 20000, urgency: 'high', status: 'Pending', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), billAmount: 5800 }
    ];

    demoItems.forEach(demo => {
      if (!fullList.some(r => r.id === demo.id)) {
        const isDispatched = dispatchedDemoIds.includes(demo.id);
        fullList.push({ ...demo, status: isDispatched ? 'Dispatched' : 'Pending' } as any);
      }
    });

    const counts = {
      all: fullList.length,
      Pending: fullList.filter(r => r.status === 'Pending').length,
      Dispatched: fullList.filter(r => r.status === 'Dispatched').length,
      Delivered: fullList.filter(r => r.status === 'Delivered').length,
    };

    let list = fullList;
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter);
    if (ward !== 'all') {
      const q = ward.toLowerCase();
      list = list.filter(r => r.area.toLowerCase().includes(q));
    }
    return { filtered: list, counts };
  }, [requests, statusFilter, ward, dispatchedDemoIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageSlice = filtered.slice(safePage * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE + ROWS_PER_PAGE);

  const resetPage = () => setPage(0);

  const toggleDriver = (id: string) => {
    setSelectedDrivers(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleConfirmDispatch = (reqId: string) => {
    if (reqId.startsWith('DEMO-')) {
      setDispatchedDemoIds(prev => [...prev, reqId]);
    }
    onUpdateStatus(reqId, 'Dispatched', selectedDrivers);
    setAssigningId(null);
    setSelectedDrivers([]);
  };

  return (
    <div className="rounded-xl border border-border-dim bg-bg-card shadow-sm overflow-hidden">
      {/* ── Header ─────────────────────────────────── */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Inbox size={18} className="text-cyan" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">Incoming Requests</h3>
              <p className="text-[10px] text-text-dim font-medium uppercase tracking-wider">Live Traffic Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="px-2 py-1 rounded bg-red/10 border border-red/20 text-red text-[10px] font-bold">3 NEW</div>
            <div className="px-2 py-1 rounded bg-bg-primary border border-border-dim text-text-dim text-[10px] font-bold">{requests.length} total</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {[
            { key: 'all', label: 'All', count: counts.all },
            { key: 'Pending', label: 'Pending', count: counts.Pending },
            { key: 'Dispatched', label: 'Dispatched', count: counts.Dispatched },
            { key: 'Delivered', label: 'Delivered', count: counts.Delivered },
          ].map((p) => (
            <button key={p.key} onClick={() => { setStatusFilter(p.key as any); resetPage(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                statusFilter === p.key
                  ? 'bg-cyan/10 text-cyan border-cyan/20 shadow-sm'
                  : 'bg-bg-primary text-text-secondary border-border-dim hover:border-text-dim'
              }`}>
              {p.label} <span className="font-mono ml-1 font-bold">{p.count}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Map size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none z-10" />
            <select
              value={zone}
              onChange={e => { setZone(e.target.value); setWard('all'); resetPage(); }}
              className={selectClass}
              style={selectArrowStyle}
            >
              {BENGALURU_ZONES.map(z => (
                <option key={z.value} value={z.value} className="bg-bg-card">{z.label}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none z-10" />
            <select
              value={ward}
              onChange={e => { setWard(e.target.value); resetPage(); }}
              className={selectClass}
              style={selectArrowStyle}
            >
              {wardOptions.map(w => (
                <option key={w.value} value={w.value} className="bg-bg-card">{w.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-y border-border-dim bg-bg-primary/50">
              <th className="px-5 py-2.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider whitespace-nowrap">Request ID</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider whitespace-nowrap">RR Number</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider whitespace-nowrap">Area / Location</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Volume</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Bill (₹)</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Time</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider whitespace-nowrap">Status</th>
              <th className="px-5 py-2.5 text-[11px] font-semibold text-text-dim uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody>
            <AnimatePresence initial={false}>
              {pageSlice.length === 0 && (
                <tr>
                   <td colSpan={8} className="px-5 py-12 text-center text-text-dim text-sm">
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
                    className="border-b border-border-dim hover:bg-bg-primary transition-colors align-top"
                  >
                    <td className="px-5 py-3">
                      <span className="font-mono text-[13px] font-semibold text-text-primary">{req.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[13px] text-cyan">{req.rrNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-text-primary font-medium block">{req.area}</span>
                      <span className="text-[11px] text-text-dim">{req.name}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${URGENCY_DOT[req.urgency]}`} />
                        <span className="text-[13px] text-text-primary font-mono">{req.liters.toLocaleString()}L</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {req.billAmount ? (
                        <span className="text-[13px] text-neon font-bold font-mono">₹{req.billAmount.toLocaleString()}</span>
                      ) : (
                        <span className="text-[11px] text-text-dim">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-[12px] text-text-dim">{timeAgo(req.timestamp)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {req.status === 'Pending' && !isAssigning && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setAssigningId(req.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan/10 border border-cyan/20 text-cyan text-[11px] font-semibold hover:bg-cyan/20 transition-all"
                          >
                            <Truck size={12} /> Assign Driver <ChevronDown size={10} />
                          </button>
                        </div>
                      )}
                      {isAssigning && (
                        <div className="flex flex-col gap-1.5 items-end">
                          <span className="text-[10px] text-text-dim font-mono uppercase">Select Fleet Units:</span>
                          <div className="flex flex-col gap-1">
                            {AVAILABLE_DRIVERS.map(driver => (
                              <button
                                key={driver.id}
                                onClick={() => toggleDriver(driver.tankerId)}
                                className={`px-3 py-1.5 rounded-lg border text-[11px] transition-all text-right whitespace-nowrap ${
                                  selectedDrivers.includes(driver.tankerId)
                                    ? 'bg-cyan/20 border-cyan text-cyan'
                                    : 'bg-bg-primary border-border-dim text-text-secondary hover:border-text-dim'
                                }`}
                              >
                                {selectedDrivers.includes(driver.tankerId) && '✓ '}
                                {driver.name} • {driver.tankerId}
                              </button>
                            ))}
                            {selectedDrivers.length > 0 && (
                              <button
                                onClick={() => handleConfirmDispatch(req.id)}
                                className="w-full mt-1 py-2 rounded-lg bg-cyan text-white text-[11px] font-bold hover:bg-cyan-hover transition-all shadow-lg shadow-cyan/20 animate-pulse"
                              >
                                DISPATCH {selectedDrivers.length > 1 ? 'FLEET' : 'TANKER'}
                              </button>
                            )}
                            <button 
                              onClick={() => { setAssigningId(null); setSelectedDrivers([]); }}
                              className="text-[10px] text-red mt-1 hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────── */}
      <div className="px-5 py-3 bg-bg-primary/30 flex items-center justify-between border-t border-border-dim">
        <span className="text-[11px] text-text-dim">
          Showing <span className="font-bold text-text-primary">{pageSlice.length}</span> of <span className="font-bold text-text-primary">{filtered.length}</span> results
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1.5 rounded-lg border border-border-dim bg-bg-card text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-bg-primary transition-all"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-6 h-6 rounded-lg text-[11px] font-bold transition-all ${
                  page === i ? 'bg-cyan text-white' : 'text-text-dim hover:bg-bg-primary'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1.5 rounded-lg border border-border-dim bg-bg-card text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-bg-primary transition-all"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
