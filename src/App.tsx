import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import Header from './components/Header';
import type { ActiveView, AdminTab } from './components/Header';
import LeftPanel from './components/LeftPanel';
import MapPanel from './components/MapPanel';
import RightPanel from './components/RightPanel';
import AdminRequestsPanel from './components/AdminRequestsPanel';
import ManagerReportsPanel from './components/ManagerReportsPanel';
import AdminUsersPanel from './components/AdminUsersPanel';
import AdminSettingsPanel from './components/AdminSettingsPanel';
import PredictiveAnalytics from './components/PredictiveAnalytics';
import CitizenView from './components/CitizenView';
import DriverView from './components/DriverView';
import GuestView from './components/GuestView';
import LoginPage from './components/LoginPage';
import RequestTankerModal from './components/RequestTankerModal';
import ReportLeakModal from './components/ReportLeakModal';
import { type User as DBUser } from './data/users';
import { type WaterRequest, SEED_REQUESTS, generateRequestId, type LeakReport, SEED_LEAK_REPORTS, generateLeakId } from './data/requests';

interface SessionUser {
  email: string;
  role: 'citizen' | 'bwssb_manager' | 'driver' | 'guest';
  sessionToken: string;
  userData: DBUser;
}

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [view, setView] = useState<ActiveView>('bwssb_manager');
  const [showTankerModal, setShowTankerModal] = useState(false);
  const [showLeakModal, setShowLeakModal] = useState(false);

  // ═══ Collapsible panels ═══
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);

  // ═══ Admin sub-tab ═══
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');

  // ═══ Global requests ═══
  const [requests, setRequests] = useState<WaterRequest[]>(SEED_REQUESTS);

  const addCitizenRequest = useCallback((data: {
    name: string; address: string; liters: number;
    urgency: 'low' | 'normal' | 'high' | 'critical';
    billAmount: number;
  }) => {
    const rrNumber = user?.userData && 'rrNumber' in user.userData ? user.userData.rrNumber : 'W-GUEST';
    setRequests(prev => [{
      id: generateRequestId(), rrNumber, area: data.address,
      name: data.name, liters: data.liters, urgency: data.urgency,
      status: 'Pending' as const, timestamp: new Date().toISOString(),
      billAmount: data.billAmount,
    }, ...prev]);
  }, [user]);

  const updateRequestStatus = useCallback((id: string, status: WaterRequest['status']) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }, []);

  const pendingCount = requests.filter(r => r.status === 'Pending').length;

  // ═══ Global leak reports ═══
  const [leakReports, setLeakReports] = useState<LeakReport[]>(SEED_LEAK_REPORTS);

  const addLeakReport = useCallback((data: {
    ward: string; description: string;
    severity: 'low' | 'medium' | 'high';
    imageUrl: string | null;
  }) => {
    const reporterName = user?.userData?.name || 'Anonymous';
    setLeakReports(prev => [{
      id: generateLeakId(),
      ward: data.ward,
      description: data.description,
      severity: data.severity,
      imageUrl: data.imageUrl,
      status: 'Pending' as const,
      timestamp: new Date().toISOString(),
      reporterName,
    }, ...prev]);
  }, [user]);

  const updateLeakStatus = useCallback((id: string, status: LeakReport['status']) => {
    setLeakReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }, []);

  // ═══ Session ═══
  useEffect(() => {
    const s = localStorage.getItem('aquasphere_session');
    if (s) {
      try {
        const session = JSON.parse(s);
        setUser(session);
        // Set default view based on role
        if (session.role === 'bwssb_manager') setView('bwssb_manager');
        else setView(session.role);
      } catch { localStorage.removeItem('aquasphere_session'); }
    }
  }, []);

  const handleLogin = (su: SessionUser) => {
    setUser(su);
    localStorage.setItem('aquasphere_session', JSON.stringify(su));
    if (su.role === 'bwssb_manager') setView('bwssb_manager');
    else setView(su.role);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('aquasphere_session');
    setView('bwssb_manager');
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const displayName = user.userData?.name || user.email;
  const userRR = user.userData && 'rrNumber' in user.userData ? user.userData.rrNumber : undefined;
  const isAdmin = user.role === 'bwssb_manager';

  // Non-admin users can only see their own role's view
  // Admin can see anything via the header toggle
  const handleViewChange = (v: ActiveView) => {
    if (isAdmin) {
      setView(v);
    }
    // Non-admins: header shows static badge, no switching
  };

  // ═══════════════════════════════════════════════════════
  // VIEW RENDERER — resolves which panel to show
  // ═══════════════════════════════════════════════════════
  const renderView = () => {
    switch (view) {
      // ── Command (admin dashboard) ──
      case 'bwssb_manager':
        return (
          <motion.div key={`bwssb-${adminTab}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="h-full overflow-auto lg:overflow-hidden">

            {/* ── DASHBOARD tab: original 3-col collapsible layout ── */}
            {adminTab === 'dashboard' && (
              <>
                {/* Desktop: 3-col collapsible */}
                <div className="hidden lg:flex h-full">
                  <div className="border-r border-[#E2E8F0] overflow-hidden transition-all duration-300 ease-in-out shrink-0"
                    style={{ width: isLeftOpen ? 300 : 0 }}>
                    <div className="w-[300px] h-full overflow-hidden">
                      <LeftPanel onRequestTanker={() => setShowTankerModal(true)} onReportLeak={() => setShowLeakModal(true)} pendingRequestCount={pendingCount} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col relative">
                    <button onClick={() => setIsLeftOpen(p => !p)}
                      className="absolute top-3 left-3 z-[1100] w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#64748B] hover:text-sky-600 hover:border-sky-200 transition-all"
                      title={isLeftOpen ? 'Collapse left' : 'Expand left'}>
                      {isLeftOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
                    </button>
                    <button onClick={() => setIsRightOpen(p => !p)}
                      className="absolute top-3 right-3 z-[1100] w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] shadow-md flex items-center justify-center text-[#64748B] hover:text-sky-600 hover:border-sky-200 transition-all"
                      title={isRightOpen ? 'Collapse right' : 'Expand right'}>
                      {isRightOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
                    </button>
                    <div className="flex-1 min-h-0"><MapPanel pendingRequests={requests.filter(r => r.status === 'Pending')} /></div>
                  </div>

                  <div className="border-l border-[#E2E8F0] overflow-hidden transition-all duration-300 ease-in-out shrink-0"
                    style={{ width: isRightOpen ? 340 : 0 }}>
                    <div className="w-[340px] h-full overflow-auto">
                      <div className="p-4 space-y-4 bg-[#F1F5F9]">
                        <AdminRequestsPanel requests={requests} onUpdateStatus={updateRequestStatus} />
                      </div>
                      <RightPanel />
                    </div>
                  </div>
                </div>

                {/* Mobile/Tablet stacked */}
                <div className="flex flex-col lg:hidden h-auto min-h-full">
                  <div className="w-full h-[50vh] md:h-[55vh] border-b border-[#E2E8F0] overflow-hidden"><MapPanel pendingRequests={requests.filter(r => r.status === 'Pending')} /></div>
                  <div className="p-4 bg-[#F1F5F9] overflow-auto"><AdminRequestsPanel requests={requests} onUpdateStatus={updateRequestStatus} /></div>
                  <div className="hidden md:flex w-full border-t border-[#E2E8F0]">
                    <div className="w-1/2 border-r border-[#E2E8F0] overflow-hidden">
                      <LeftPanel onRequestTanker={() => setShowTankerModal(true)} onReportLeak={() => setShowLeakModal(true)} pendingRequestCount={pendingCount} />
                    </div>
                    <div className="w-1/2 overflow-hidden"><RightPanel /></div>
                  </div>
                  <div className="md:hidden">
                    <div className="border-t border-[#E2E8F0]"><LeftPanel onRequestTanker={() => setShowTankerModal(true)} onReportLeak={() => setShowLeakModal(true)} pendingRequestCount={pendingCount} /></div>
                    <div className="border-t border-[#E2E8F0]"><RightPanel /></div>
                  </div>
                </div>
              </>
            )}

            {/* ── REPORTS tab — text-only unified management ── */}
            {adminTab === 'reports' && (
              <ManagerReportsPanel
                requests={requests}
                leakReports={leakReports}
                onUpdateRequestStatus={updateRequestStatus}
                onUpdateLeakStatus={updateLeakStatus}
              />
            )}

            {/* ── USERS tab ── */}
            {adminTab === 'users' && <AdminUsersPanel />}

            {/* ── ANALYTICS tab ── */}
            {adminTab === 'analytics' && <PredictiveAnalytics />}

            {/* ── SETTINGS tab ── */}
            {adminTab === 'settings' && <AdminSettingsPanel />}
          </motion.div>
        );

      // ── Citizen view ──
      case 'citizen':
        return (
          <motion.div key="citizen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="h-full overflow-auto">
            <CitizenView onRequestTanker={() => setShowTankerModal(true)} onReportLeak={() => setShowLeakModal(true)} />
          </motion.div>
        );

      // ── Driver view ──
      case 'driver':
        return (
          <motion.div key="driver" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="h-full overflow-hidden">
            <DriverView />
          </motion.div>
        );

      // ── Guest view ──
      case 'guest':
        return (
          <motion.div key="guest" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="h-full overflow-hidden">
            <GuestView onReportLeak={() => setShowLeakModal(true)} />
          </motion.div>
        );
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F1F5F9] flex flex-col">
      <Header
        view={view}
        onViewChange={handleViewChange}
        user={{ email: displayName, role: user.role }}
        onLogout={handleLogout}
        adminTab={adminTab}
        onAdminTabChange={setAdminTab}
      />

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {renderView()}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="hidden md:flex h-7 bg-white border-t border-[#E2E8F0] items-center justify-between px-5">
        <div className="flex items-center gap-3 text-[11px] text-[#94A3B8]">
          <span className="font-mono">AquaSphere AI v3.2</span>
          <span className="text-[#E2E8F0]">·</span>
          <span>BWSSB Active</span>
          {isAdmin && (
            <>
              <span className="text-[#E2E8F0]">·</span>
              <span className="text-amber-500 font-semibold font-mono">{pendingCount} Pending</span>
              <span className="text-[#E2E8F0]">·</span>
              <span className="text-sky-500 font-medium">{adminTab.charAt(0).toUpperCase() + adminTab.slice(1)}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#94A3B8]">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>24/24 Nodes</span>
          </div>
          <span className="text-[#E2E8F0]">·</span>
          <span className="text-emerald-500 font-mono">12ms</span>
          <span className="text-[#E2E8F0]">·</span>
          <span className="text-[#64748B]">{displayName}</span>
        </div>
      </div>

      {/* Modals */}
      <RequestTankerModal isOpen={showTankerModal} onClose={() => setShowTankerModal(false)} onSubmitRequest={addCitizenRequest} userRR={userRR} />
      <ReportLeakModal isOpen={showLeakModal} onClose={() => setShowLeakModal(false)} onSubmitLeak={addLeakReport} />
    </div>
  );
}
