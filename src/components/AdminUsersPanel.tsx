import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Truck, Search, Shield, Star, MapPin } from 'lucide-react';
import { citizenUsers, driverUsers, adminUsers } from '../data/users';

type UserFilter = 'all' | 'citizen' | 'driver' | 'admin';

export default function AdminUsersPanel() {
  const [filter, setFilter] = useState<UserFilter>('all');
  const [search, setSearch] = useState('');

  const allPeople = [
    ...citizenUsers.map(u => ({ ...u, type: 'citizen' as const })),
    ...driverUsers.map(u => ({ ...u, type: 'driver' as const })),
    ...adminUsers.map(u => ({ ...u, type: 'admin' as const })),
  ];

  const filtered = allPeople.filter(u => {
    if (filter !== 'all' && u.type !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
    }
    return true;
  });

  const typeStyle: Record<string, { bg: string; text: string; label: string }> = {
    citizen: { bg: 'bg-emerald-50', text: 'text-[#10B981]', label: 'Citizen' },
    driver:  { bg: 'bg-amber-50',   text: 'text-[#F59E0B]', label: 'Driver' },
    admin:   { bg: 'bg-sky-50',     text: 'text-[#0EA5E9]', label: 'Admin' },
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-[#F1F5F9] overflow-auto h-full">
      <div className="flex items-center gap-2">
        <Users size={20} className="text-[#0EA5E9]" />
        <h2 className="text-lg font-semibold text-[#1E293B]">User Management</h2>
        <span className="text-xs text-[#94A3B8] ml-1">{allPeople.length} registered</span>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {([
            { k: 'all' as const, l: 'All', c: citizenUsers.length + driverUsers.length + adminUsers.length },
            { k: 'citizen' as const, l: 'Citizens', c: citizenUsers.length },
            { k: 'driver' as const, l: 'Drivers', c: driverUsers.length },
            { k: 'admin' as const, l: 'Admins', c: adminUsers.length },
          ]).map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filter === f.k ? 'bg-sky-50 text-[#0EA5E9] border-sky-200 shadow-sm' : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]'
              }`}>
              {f.l} <span className="font-mono font-bold ml-1">{f.c}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or ID…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:border-sky-300 transition-colors" />
        </div>
      </div>

      {/* User cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((u, i) => {
          const style = typeStyle[u.type];
          return (
            <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white border border-[#E2E8F0] rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center`}>
                    {u.type === 'citizen' ? <User size={18} className={style.text} /> :
                     u.type === 'driver' ? <Truck size={18} className={style.text} /> :
                     <Shield size={18} className={style.text} />}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#1E293B] block">{u.name}</span>
                    <span className="text-[11px] text-[#94A3B8] font-mono">{u.id}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text} border border-current/15`}>
                  {style.label}
                </span>
              </div>

              <div className="space-y-1.5 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Email</span>
                  <span className="text-[#1E293B] font-medium truncate ml-2 max-w-[180px]">{u.email}</span>
                </div>
                {u.type === 'citizen' && 'ward' in u && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8]">Ward</span>
                    <span className="text-[#1E293B] font-medium flex items-center gap-1"><MapPin size={10} className="text-[#94A3B8]" />{u.ward}</span>
                  </div>
                )}
                {u.type === 'citizen' && 'rrNumber' in u && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8]">RR Number</span>
                    <span className="text-[#0EA5E9] font-mono font-medium">{u.rrNumber}</span>
                  </div>
                )}
                {u.type === 'driver' && 'rating' in u && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8]">Rating</span>
                    <span className="text-[#F59E0B] font-medium flex items-center gap-1"><Star size={10} className="fill-amber-400 text-amber-400" />{u.rating}</span>
                  </div>
                )}
                {u.type === 'driver' && 'tankerPlate' in u && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8]">Vehicle</span>
                    <span className="text-[#1E293B] font-mono font-medium">{u.tankerPlate}</span>
                  </div>
                )}
                {u.type === 'admin' && 'department' in u && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8]">Dept</span>
                    <span className="text-[#1E293B] font-medium">{u.department}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E2E8F0]">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-[#94A3B8]'}`} />
                  <span className={`text-[11px] font-medium ${u.isActive ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <span className="text-[10px] text-[#94A3B8]">{u.phone}</span>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-[#94A3B8] text-sm">No users match your search.</div>
        )}
      </div>
    </div>
  );
}
