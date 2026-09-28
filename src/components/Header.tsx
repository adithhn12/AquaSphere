import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield, User, Radio, LogOut, Truck, Droplets, Menu, X, Globe, BarChart3, Users, Settings, Sun, Moon } from 'lucide-react';

export type ActiveView = 'bwssb_manager' | 'citizen' | 'driver' | 'guest';
export type AdminTab = 'dashboard' | 'requests' | 'leaks' | 'users' | 'analytics' | 'settings';

interface HeaderProps {
  view: ActiveView;
  onViewChange: (view: ActiveView) => void;
  user?: { email: string; role: 'citizen' | 'bwssb_manager' | 'driver' | 'guest' } | null;
  onLogout?: () => void;
  /** Admin sub-navigation */
  adminTab?: AdminTab;
  onAdminTabChange?: (tab: AdminTab) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

/* ── Admin sub-nav tabs ────────────────────────────── */
const ADMIN_TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'BWSSB Dashboard', icon: <Shield size={14} /> },
  { id: 'requests',  label: 'Requests',      icon: <Truck size={14} /> },
  { id: 'leaks',     label: 'Leaks',         icon: <Droplets size={14} /> },
  { id: 'users',     label: 'Users',       icon: <Users size={14} /> },
  { id: 'analytics', label: 'Analytics',   icon: <BarChart3 size={14} /> },
  { id: 'settings',  label: 'Settings',    icon: <Settings size={14} /> },
];

/* ── Role badge config for non-admin users ─────────── */
const ROLE_COLOR: Record<string, string> = {
  bwssb_manager: 'text-[#0EA5E9]',
  citizen: 'text-[#10B981]',
  driver: 'text-[#F59E0B]',
  guest: 'text-[#94A3B8]',
};
const ROLE_BG: Record<string, string> = {
  bwssb_manager: 'bg-sky-50 border-sky-200',
  citizen: 'bg-emerald-50 border-emerald-200',
  driver: 'bg-amber-50 border-amber-200',
  guest: 'bg-slate-50 border-slate-200',
};
const ROLE_ICON: Record<string, React.ReactNode> = {
  bwssb_manager: <Shield size={13} />,
  citizen: <User size={13} />,
  driver: <Truck size={13} />,
  guest: <Globe size={13} />,
};

export default function Header({ 
  view, onViewChange, user, onLogout, 
  adminTab = 'dashboard', onAdminTabChange,
  isDarkMode, onToggleDarkMode
}: HeaderProps) {
  const [time, setTime] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`);
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  const isAdmin = user?.role === 'bwssb_manager';

  return (
    <header className="bg-bg-secondary border-b border-border-dim relative z-50">
      {/* ── Main row ───────────────────────────────── */}
      <div className="h-14 flex items-center justify-between px-4 md:px-5">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center shrink-0">
            <Droplets size={16} className="text-cyan" />
          </div>
          <div className="hidden sm:block">
            <span className="font-semibold text-sm tracking-wide text-text-primary block leading-tight">AquaSphere AI</span>
            <span className="text-[10px] text-text-dim font-medium">Bengaluru Water CMD</span>
          </div>
          <span className="sm:hidden font-semibold text-sm text-text-primary">AquaSphere</span>
          <div className="hidden xl:flex items-center gap-2 ml-2 text-[11px] text-text-dim font-mono">
            <span>12.97°N, 77.59°E</span>
            <span className="text-border-dim">|</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-500 font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Center: Admin sub-nav OR non-admin static badge */}
        <div className="hidden md:flex items-center">
          {isAdmin && view === 'bwssb_manager' ? (
            <nav className="flex items-center gap-1">
              {ADMIN_TABS.map(tab => {
                const active = adminTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onAdminTabChange?.(tab.id)}
                    className={`relative flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium transition-colors ${
                      active ? 'text-cyan' : 'text-text-dim hover:text-text-secondary'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {active && (
                      <motion.div
                        layoutId="admin-tab-indicator"
                        className="absolute bottom-0 left-2 right-2 h-[2px] bg-cyan rounded-full"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          ) : (
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border ${ROLE_BG[user?.role || 'guest']}`}>
              {ROLE_ICON[user?.role || 'guest']}
              <span className={`text-xs font-semibold ${ROLE_COLOR[user?.role || 'guest']}`}>
                {(user?.role || 'Guest').charAt(0).toUpperCase() + (user?.role || 'guest').slice(1)} Mode
              </span>
            </div>
          )}
        </div>

        {/* Right: Clock + User + Burger */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 mr-2">
            <Radio size={10} className="text-cyan animate-pulse-glow" />
            <span className="font-mono text-xs text-cyan tabular-nums">{time}</span>
            <span className="text-[10px] text-text-dim">IST</span>
          </div>

          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-slate-800 text-amber-400 border border-slate-700' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {user && onLogout && (
            <>
              <div className="hidden md:block h-5 w-px bg-border-dim" />
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-text-primary block leading-tight font-medium">
                    {user.email.length > 18 ? user.email.slice(0, 18) + '…' : user.email}
                  </span>
                  <span className={`text-[10px] font-medium ${ROLE_COLOR[user.role]}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
                <button onClick={onLogout}
                  className="w-8 h-8 rounded-lg border border-border-dim bg-bg-secondary flex items-center justify-center text-text-dim hover:text-red-500 hover:border-red-200 transition-all"
                  title="Logout">
                  <LogOut size={14} />
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-8 h-8 rounded-lg border border-border-dim bg-bg-secondary flex items-center justify-center text-text-secondary"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ─────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-border-dim bg-bg-secondary"
          >
            <div className="p-4 space-y-3">
              {isAdmin && view === 'bwssb_manager' && (
                <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-bg-primary p-1 border border-border-dim">
                  {ADMIN_TABS.map(tab => (
                    <button key={tab.id}
                      onClick={() => { onAdminTabChange?.(tab.id); setMobileOpen(false); }}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-[10px] font-medium transition-all ${
                        adminTab === tab.id
                          ? 'bg-bg-secondary text-cyan shadow-sm border border-border-dim'
                          : 'text-text-dim'
                      }`}>
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {!isAdmin && (
                <div className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border ${ROLE_BG[user?.role || 'guest']} bg-bg-secondary`}>
                  {ROLE_ICON[user?.role || 'guest']}
                  <span className={`text-xs font-semibold ${ROLE_COLOR[user?.role || 'guest']}`}>
                    {(user?.role || 'Guest').charAt(0).toUpperCase() + (user?.role || 'guest').slice(1)} Mode
                  </span>
                </div>
              )}

              {user && (
                <div className="flex items-center justify-between py-2 border-t border-border-dim">
                  <div>
                    <span className="text-sm text-text-primary font-medium block">{user.email}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[11px] text-emerald-500 font-medium">Online</span>
                      </div>
                      <span className="text-[11px] text-text-dim font-mono">{time} IST</span>
                    </div>
                  </div>
                  {onLogout && (
                    <button onClick={onLogout}
                      className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-all">
                      Logout
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
