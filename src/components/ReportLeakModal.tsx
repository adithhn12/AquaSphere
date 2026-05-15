import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Droplets, MapPin, Camera, CheckCircle } from 'lucide-react';

const WARD_OPTIONS = [
  'HSR Layout', 'Koramangala', 'Indiranagar', 'BTM Layout', 'Whitefield',
  'Jayanagar', 'Hebbal', 'Varthur', 'Bellandur', 'Malleshwaram',
  'Rajajinagar', 'Yelahanka',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmitLeak?: (data: {
    ward: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    imageUrl: string | null;
  }) => void;
}

export default function ReportLeakModal({ isOpen, onClose, onSubmitLeak }: Props) {
  const [ward, setWard] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!ward) errs.push('Please select a ward / area');
    if (!description.trim()) errs.push('Description is required');
    if (description.trim().length < 10) errs.push('Please add more detail (min 10 chars)');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmitLeak?.({
      ward,
      description: description.trim(),
      severity,
      imageUrl: imagePreview, // blob URL passed to global state
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setWard('');
      setDescription('');
      setSeverity('medium');
      removeImage();
      setErrors([]);
      onClose();
    }, 2500);
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
            className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <Droplets size={16} className="text-[#F59E0B]" />
                </div>
                <h2 className="text-base font-semibold text-[#1E293B]">Report Water Leak</h2>
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
                        <X size={10} /> {err}
                      </div>
                    ))}
                  </div>
                )}

                {/* Ward Dropdown */}
                <div>
                  <label className="text-xs font-medium text-[#64748B] block mb-1.5">
                    <MapPin size={11} className="inline mr-1" />Ward / Area
                  </label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                    <select value={ward} onChange={e => setWard(e.target.value)}
                      className="appearance-none w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-10 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:border-amber-300 transition-colors"
                      style={selectArrow}>
                      <option value="">Select ward…</option>
                      {WARD_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-[#64748B] block mb-1.5">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#1E293B] focus:border-amber-300 focus:outline-none transition-colors resize-none h-24 placeholder:text-[#94A3B8]"
                    placeholder="Describe the leak — pipe burst, seepage, overflow, discolored water…" />
                </div>

                {/* Severity */}
                <div>
                  <label className="text-xs font-medium text-[#64748B] block mb-1.5">Severity</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as const).map(s => (
                      <button key={s} type="button" onClick={() => setSeverity(s)}
                        className={`py-2.5 rounded-xl border text-xs font-medium transition-all ${
                          severity === s
                            ? s === 'high' ? 'border-red-200 bg-red-50 text-[#EF4444]'
                            : s === 'medium' ? 'border-amber-200 bg-amber-50 text-[#F59E0B]'
                            : 'border-emerald-200 bg-emerald-50 text-[#10B981]'
                            : 'border-[#E2E8F0] text-[#94A3B8] hover:text-[#64748B]'
                        }`}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="text-xs font-medium text-[#64748B] block mb-1.5">
                    <Camera size={11} className="inline mr-1" />Photo Evidence
                  </label>

                  {/* Hidden native file input */}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {!imageFile ? (
                    /* ── Empty state: clickable upload zone ────── */
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full py-8 rounded-xl border-2 border-dashed border-[#E2E8F0] hover:border-[#F59E0B] bg-[#F8FAFC] hover:bg-amber-50/30 transition-all flex flex-col items-center gap-2.5 group cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-full bg-[#F1F5F9] group-hover:bg-amber-50 border border-[#E2E8F0] group-hover:border-amber-200 flex items-center justify-center transition-all">
                        <Camera size={20} className="text-[#94A3B8] group-hover:text-[#F59E0B] transition-colors" />
                      </div>
                      <div className="text-center">
                        <span className="text-[13px] text-[#64748B] group-hover:text-[#1E293B] font-medium block transition-colors">
                          Upload Image from Device
                        </span>
                        <span className="text-[11px] text-[#CBD5E1] mt-0.5 block">
                          JPG, PNG up to 10 MB
                        </span>
                      </div>
                    </button>
                  ) : (
                    /* ── File selected: clean info row ─────────── */
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-3">
                      {/* Green camera icon */}
                      <div className="w-9 h-9 rounded-lg bg-white border border-emerald-200 flex items-center justify-center shrink-0">
                        <Camera size={16} className="text-[#10B981]" />
                      </div>

                      {/* File name + size */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] text-[#1E293B] font-medium block truncate">
                          {imageFile.name}
                        </span>
                        <span className="text-[11px] text-[#94A3B8]">
                          {(imageFile.size / 1024).toFixed(0)} KB · Ready to upload
                        </span>
                      </div>

                      {/* ✕ remove button */}
                      <button
                        type="button"
                        onClick={removeImage}
                        className="w-7 h-7 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#94A3B8] hover:text-[#EF4444] hover:border-red-200 transition-all shrink-0"
                        title="Remove file"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* GPS indicator */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-2.5">
                  <MapPin size={14} className="text-[#F59E0B]" />
                  <div>
                    <span className="text-xs text-[#F59E0B] font-medium">GPS Location Pinned</span>
                    <span className="text-[11px] text-[#94A3B8] block">12.9116° N, 77.6389° E</span>
                  </div>
                </div>

                {/* Submit */}
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit"
                  className="w-full py-3 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] font-semibold text-sm hover:bg-[#F59E0B]/25 transition-all">
                  Submit Report →
                </motion.button>
              </form>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-10 text-center">
                <CheckCircle size={48} className="text-[#10B981] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#10B981] mb-2">Report Filed!</h3>
                <p className="text-sm text-[#64748B]">Your leak report has been sent to BWSSB for inspection.</p>
                <p className="text-xs text-[#94A3B8] mt-2">+50 Conservation Points earned 🏆</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
