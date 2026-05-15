import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, MapPin, Droplets, AlertTriangle, CheckCircle, IndianRupee } from 'lucide-react';
import { calculateTankerBill, CAPACITY_OPTIONS, type TankerCapacity } from '../utils/pricing';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRequest?: (data: {
    name: string;
    address: string;
    liters: number;
    urgency: 'low' | 'normal' | 'high' | 'critical';
    billAmount: number;
  }) => void;
  userRR?: string;
}

// Simulated delivery distance from BWSSB pumping station (km)
// In production this would come from the map route distance calculation
const SIMULATED_DISTANCES: Record<string, number> = {
  'HSR Layout': 5.2,
  'Koramangala': 3.8,
  'Indiranagar': 2.4,
  'BTM Layout': 4.1,
  'Whitefield': 8.6,
  'Jayanagar': 1.5,
  'Hebbal': 6.3,
  'Varthur': 9.1,
  'Bellandur': 7.4,
  'Malleshwaram': 3.0,
  'Rajajinagar': 4.5,
  'Yelahanka': 7.8,
};

const WARD_OPTIONS = Object.keys(SIMULATED_DISTANCES);

export default function RequestTankerModal({ isOpen, onClose, onSubmitRequest, userRR }: Props) {
  const [name, setName] = useState('');
  const [ward, setWard] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState<TankerCapacity>(5000);
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Live pricing calculation
  const distanceKm = SIMULATED_DISTANCES[ward] || 3.0;
  const pricing = useMemo(() => calculateTankerBill(capacity, distanceKm), [capacity, distanceKm]);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!name.trim()) errs.push('Name is required');
    if (!ward) errs.push('Please select a ward');
    if (!address.trim() || address.trim().length < 5) errs.push('Please enter your street / house address');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmitRequest?.({
      name: name.trim(),
      address: `${ward} — ${address.trim()}`,
      liters: capacity,
      urgency,
      billAmount: pricing.totalAmount,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName(''); setWard(''); setAddress(''); setCapacity(5000); setUrgency('normal'); setErrors([]);
      onClose();
    }, 3000);
  };

  const selectArrow: React.CSSProperties = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
                  <Truck size={16} className="text-[#0EA5E9]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#1E293B]">Request Tanker</h2>
                  {userRR && <span className="text-[10px] text-[#94A3B8] font-mono">RR {userRR}</span>}
                </div>
              </div>
              <button onClick={onClose} className="text-[#94A3B8] hover:text-[#1E293B] transition-colors p-1"><X size={18} /></button>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Errors */}
                {errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
                    {errors.map((err, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-[#EF4444]">
                        <AlertTriangle size={11} /> {err}
                      </div>
                    ))}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="text-xs font-medium text-[#64748B] block mb-1.5">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#1E293B] focus:border-sky-300 focus:outline-none placeholder:text-[#94A3B8]"
                    placeholder="Enter your name" />
                </div>

                {/* Ward dropdown */}
                <div>
                  <label className="text-xs font-medium text-[#64748B] block mb-1.5"><MapPin size={11} className="inline mr-1" />Ward / Area</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                    <select value={ward} onChange={e => setWard(e.target.value)}
                      className="appearance-none w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-10 py-2.5 text-sm text-[#1E293B] focus:border-sky-300 focus:outline-none"
                      style={selectArrow}>
                      <option value="">Select ward…</option>
                      {WARD_OPTIONS.map(w => <option key={w} value={w}>{w} ({SIMULATED_DISTANCES[w]} km)</option>)}
                    </select>
                  </div>
                </div>

                {/* Street address */}
                <div>
                  <label className="text-xs font-medium text-[#64748B] block mb-1.5">Street / House Address</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#1E293B] focus:border-sky-300 focus:outline-none placeholder:text-[#94A3B8]"
                    placeholder="House No, Street, Landmark" />
                </div>

                {/* Tanker Capacity + Urgency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#64748B] block mb-1.5"><Droplets size={11} className="inline mr-1" />Tanker Capacity</label>
                    <div className="relative">
                      <Droplets size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                      <select value={capacity} onChange={e => setCapacity(Number(e.target.value) as TankerCapacity)}
                        className="appearance-none w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-10 py-2.5 text-sm text-[#1E293B] focus:border-sky-300 focus:outline-none"
                        style={selectArrow}>
                        {CAPACITY_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label} — ₹{o.basePrice}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#64748B] block mb-1.5"><AlertTriangle size={11} className="inline mr-1" />Urgency</label>
                    <select value={urgency} onChange={e => setUrgency(e.target.value as typeof urgency)}
                      className="appearance-none w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 pr-10 py-2.5 text-sm text-[#1E293B] focus:border-sky-300 focus:outline-none"
                      style={selectArrow}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Live Pricing Breakdown */}
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <IndianRupee size={14} className="text-[#0EA5E9]" />
                    <span className="text-xs font-semibold text-[#0EA5E9] uppercase tracking-wider">BWSSB Sanchari Cauvery Rate</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Base price ({(pricing.capacityLitres / 1000).toFixed(0)}KL)</span>
                    <span className="text-[#1E293B] font-semibold font-mono">₹{pricing.basePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Distance ({pricing.distanceKm} km)</span>
                    <span className="text-[#94A3B8] text-xs">{pricing.distanceKm <= 2 ? 'Within free radius' : `${pricing.surchargeableKm} km × ₹70`}</span>
                  </div>
                  {pricing.distanceSurcharge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Distance surcharge</span>
                      <span className="text-[#F59E0B] font-semibold font-mono">+ ₹{pricing.distanceSurcharge.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-sky-200 pt-2 mt-1 flex justify-between">
                    <span className="text-[#1E293B] font-semibold">Total Estimated Bill</span>
                    <span className="text-[#0EA5E9] font-bold text-lg font-mono">₹{pricing.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Delivery time estimate */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-sm">
                  <span className="text-[#64748B]">Estimated Delivery</span>
                  <span className="text-[#F59E0B] font-bold">
                    {pricing.distanceKm <= 3 ? '20 – 35 min' : pricing.distanceKm <= 6 ? '30 – 50 min' : '45 – 75 min'}
                  </span>
                </div>

                {/* Submit */}
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit"
                  className="w-full py-3 rounded-xl bg-[#0EA5E9]/15 border border-[#0EA5E9]/30 text-[#0EA5E9] font-semibold text-sm hover:bg-[#0EA5E9]/25 transition-all">
                  Submit Request — ₹{pricing.totalAmount.toLocaleString()} →
                </motion.button>
              </form>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-10 text-center">
                <CheckCircle size={48} className="text-[#10B981] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#10B981] mb-2">Request Submitted!</h3>
                <p className="text-sm text-[#64748B]">
                  Your {(capacity / 1000).toFixed(0)}KL tanker request for <b>₹{pricing.totalAmount.toLocaleString()}</b> has been sent to BWSSB.
                </p>
                <p className="text-xs text-[#94A3B8] mt-2">You'll be notified when a driver is assigned.</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
