import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Sun, Moon } from 'lucide-react';
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
import { type WaterRequest, generateRequestId, type LeakReport, generateLeakId, SEED_REQUESTS, SEED_LEAK_REPORTS } from './data/requests';
import { db } from './firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  query,
  orderBy
} from 'firebase/firestore';

interface SessionUser {
  email: string;
  role: 'citizen' | 'bwssb_manager' | 'driver' | 'guest';
  sessionToken: string;
  userData: DBUser;
}

export default function App() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [view, setView] = useState<ActiveView>('bwssb_manager');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showTankerModal, setShowTankerModal] = useState(false);
  const [showLeakModal, setShowLeakModal] = useState(false);

  // ═══ Collapsible panels ═══
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);

  // ═══ Admin sub-tab ═══
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');

  // ═══ Global requests ═══
  const [requests, setRequests] = useState<WaterRequest[]>(SEED_REQUESTS);

  useEffect(() => {
    const q = query(collection(db, 'requests'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs: WaterRequest[] = [];
      snapshot.forEach((doc) => {
        reqs.push({ ...doc.data() } as WaterRequest);
      });
      if (reqs.length === 0) {
        import('./data/requests').then(m => setRequests(m.SEED_REQUESTS));
      } else {
        setRequests(reqs);
      }
    });
    return () => unsubscribe();
  }, []);

  const addCitizenRequest = useCallback(async (data: {
    name: string; address: string; liters: number;
    urgency: 'low' | 'normal' | 'high' | 'critical';
    billAmount: number;
  }) => {
    const rrNumber = user?.userData && 'rrNumber' in user.userData ? user.userData.rrNumber : 'W-GUEST';
    const requestId = generateRequestId();
    const newRequest: WaterRequest = {
      id: requestId, rrNumber, area: data.address,
      name: data.name, liters: data.liters, urgency: data.urgency,
      status: 'Pending' as const, timestamp: new Date().toISOString(),
      billAmount: data.billAmount,
    };

    try {
      await setDoc(doc(db, 'requests', requestId), newRequest);
      
    } catch (error) {
      console.error("Error adding request: ", error);
    }
  }, [user]);

  // ═══ Seed the fleet ═══
  useEffect(() => {
    const seedFleet = async () => {
      const fleet = [
        { id: 'TNK-218', plate: 'KA-01-MQ-4421', driver: 'Ravi Kumar', lat: 12.9352, lng: 77.6245, status: 'idle', capacity: 10000, filled: 8500 },
        { id: 'TNK-307', plate: 'KA-51-AQ-8892', driver: 'Suresh Patil', lat: 12.9718, lng: 77.6411, status: 'idle', capacity: 12000, filled: 12000 },
        { id: 'TNK-112', plate: 'KA-03-BW-1122', driver: 'Mohammed Ali', lat: 13.0031, lng: 77.5644, status: 'idle', capacity: 8000, filled: 4000 },
        { id: 'TNK-404', plate: 'KA-05-MM-4040', driver: 'Pradeep J.', lat: 12.9166, lng: 77.6101, status: 'idle', capacity: 10000, filled: 9000 },
      ];

      for (const t of fleet) {
        try {
          // Only set if it doesn't exist or force update for demo stability
          await setDoc(doc(db, 'tankers', t.id), t, { merge: true });
        } catch (e) { console.error("Fleet seeding failed:", e); }
      }
    };
    seedFleet();
  }, []);

  const updateRequestStatus = useCallback(async (id: string, status: WaterRequest['status'], driverIds?: string[]) => {
    const AREA_COORDS: Record<string, [number, number]> = {
      'HSR Layout': [12.9116, 77.6389],
      'Koramangala': [12.9352, 77.6245],
      'Indiranagar': [12.9718, 77.6411],
      'Whitefield': [12.9698, 77.7500],
      'BTM Layout': [12.9166, 77.6101],
      'Jayanagar': [12.9300, 77.5800],
      'Malleswaram': [13.0031, 77.5644],
    };

    try {
      if (!id.startsWith('DEMO-')) {
        await updateDoc(doc(db, 'requests', id), { 
          status,
          assignedTankers: driverIds || [] // Store who is assigned to this request
        });
      }
      
      // If dispatched, update the tankers' routes on the map
      if (status === 'Dispatched' && driverIds && driverIds.length > 0) {
        const allPossible = [...requests, { id: 'DEMO-REQ-7721', area: 'HSR Layout' }, { id: 'DEMO-REQ-8832', area: 'Indiranagar' }, { id: 'DEMO-REQ-9943', area: 'Whitefield' }];
        const req = allPossible.find(r => r.id === id);
        
        const areaName = req?.area.split(' ')[0] || '';
        const destCoords = AREA_COORDS[areaName] || [12.97 + (Math.random()-0.5)*0.1, 77.59 + (Math.random()-0.5)*0.1];

        for (const tId of driverIds) {
          try {
            const tRef = doc(db, 'tankers', tId);
            await updateDoc(tRef, {
              status: 'in-transit',
              currentTask: id,
              destinationArea: req?.area || 'Bengaluru',
              targetLat: destCoords[0],
              targetLng: destCoords[1],
              lastUpdate: new Date().toISOString()
            });
          } catch (e) { console.error("Tanker update failed", e); }
        }
      }
    } catch (error) {
      console.error("Error updating request status: ", error);
    }
  }, [requests]);

  const pendingCount = requests.filter(r => r.status === 'Pending').length;

  // ═══ Global leak reports ═══
  const [leakReports, setLeakReports] = useState<LeakReport[]>(SEED_LEAK_REPORTS);

  useEffect(() => {
    const q = query(collection(db, 'leakReports'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports: LeakReport[] = [];
      snapshot.forEach((doc) => {
        reports.push({ ...doc.data() } as LeakReport);
      });
      if (reports.length > 0) {
        setLeakReports(reports);
      }
    });
    return () => unsubscribe();
  }, []);

  const addLeakReport = useCallback(async (data: {
    ward: string; description: string;
    severity: 'low' | 'medium' | 'high';
    imageUrl: string | null;
  }) => {
    const reporterName = user?.userData?.name || 'Anonymous';
    const leakId = generateLeakId();
    const newReport: LeakReport = {
      id: leakId,
      ward: data.ward,
      description: data.description,
      severity: data.severity,
      imageUrl: data.imageUrl,
      status: 'Pending' as const,
      timestamp: new Date().toISOString(),
      reporterName,
    };

    try {
      await setDoc(doc(db, 'leakReports', leakId), newReport);
      
      // Update user score if logged in as citizen
      if (user?.userData && user.role === 'citizen') {
        const userDocRef = doc(db, 'users', user.userData.id);
        const currentScore = user.userData.conservationScore || 0;
        const newScore = currentScore + 50;
        
        await updateDoc(userDocRef, { 
          conservationScore: newScore,
          leaksReported: (user.userData.leaksReported || 0) + 1
        });

        // Update local state to reflect changes immediately
        const updatedUser = {
          ...user,
          userData: {
            ...user.userData,
            conservationScore: newScore,
            leaksReported: (user.userData.leaksReported || 0) + 1
          }
        };
        setUser(updatedUser);
        localStorage.setItem('aquasphere_session', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Error adding leak report: ", error);
    }
  }, [user]);

  const updateLeakStatus = useCallback(async (id: string, status: LeakReport['status']) => {
    try {
      await updateDoc(doc(db, 'leakReports', id), { status });
    } catch (error) {
      console.error("Error updating leak status: ", error);
    }
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
                  <div className="border-r border-[#E2E8F0] dark:border-slate-800 overflow-hidden transition-all duration-300 ease-in-out shrink-0"
                    style={{ width: isLeftOpen ? 300 : 0 }}>
                    <div className="w-[300px] h-full overflow-hidden">
                      <LeftPanel isAdmin={isAdmin} onRequestTanker={() => setShowTankerModal(true)} onReportLeak={() => setShowLeakModal(true)} pendingRequestCount={pendingCount} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col relative">
                    <button onClick={() => setIsLeftOpen(p => !p)}
                      className="absolute top-3 left-3 z-[1100] w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-md flex items-center justify-center text-[#64748B] hover:text-sky-600 hover:border-sky-200 transition-all"
                      title={isLeftOpen ? 'Collapse left' : 'Expand left'}>
                      {isLeftOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
                    </button>
                    <button onClick={() => setIsRightOpen(p => !p)}
                      className="absolute top-3 right-3 z-[1100] w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 shadow-md flex items-center justify-center text-[#64748B] hover:text-sky-600 hover:border-sky-200 transition-all"
                      title={isRightOpen ? 'Collapse right' : 'Expand right'}>
                      {isRightOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
                    </button>
                    <div className="flex-1 min-h-0"><MapPanel pendingRequests={requests.filter(r => r.status === 'Pending')} isDarkMode={isDarkMode} /></div>
                  </div>

                  <div className="border-l border-border-dim overflow-hidden transition-all duration-300 ease-in-out shrink-0"
                    style={{ width: isRightOpen ? 340 : 0 }}>
                    <div className="w-[340px] h-full overflow-auto bg-bg-primary">
                      <div className="p-4 space-y-4">
                        <RightPanel />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile/Tablet stacked */}
                <div className="flex flex-col lg:hidden h-auto min-h-full">
                  <div className="w-full h-[50vh] md:h-[55vh] border-b border-[#E2E8F0] overflow-hidden"><MapPanel pendingRequests={requests.filter(r => r.status === 'Pending')} /></div>
                  <div className="p-4 bg-[#F1F5F9] overflow-auto"><RightPanel /></div>
                  <div className="hidden md:flex w-full border-t border-[#E2E8F0]">
                    <div className="w-1/2 border-r border-[#E2E8F0] overflow-hidden">
                      <LeftPanel isAdmin={isAdmin} onRequestTanker={() => setShowTankerModal(true)} onReportLeak={() => setShowLeakModal(true)} pendingRequestCount={pendingCount} />
                    </div>
                    <div className="w-1/2 overflow-hidden"><RightPanel /></div>
                  </div>
                  <div className="md:hidden">
                    <div className="border-t border-[#E2E8F0]"><LeftPanel isAdmin={isAdmin} onRequestTanker={() => setShowTankerModal(true)} onReportLeak={() => setShowLeakModal(true)} pendingRequestCount={pendingCount} /></div>
                    <div className="border-t border-[#E2E8F0]"><RightPanel /></div>
                  </div>
                </div>
              </>
            )}

            {/* ── REQUESTS tab — specialized dispatch control ── */}
            {adminTab === 'requests' && (
              <div className="p-4 lg:p-6 h-full overflow-auto bg-bg-primary">
                <div className="max-w-6xl mx-auto">
                  <AdminRequestsPanel requests={requests} onUpdateStatus={updateRequestStatus} />
                </div>
              </div>
            )}

            {/* ── LEAKS tab — infrastructure management ── */}
            {adminTab === 'leaks' && (
              <ManagerReportsPanel
                leakReports={leakReports}
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
            <CitizenView
              onRequestTanker={() => setShowTankerModal(true)}
              onReportLeak={() => setShowLeakModal(true)}
              requests={requests}
              user={user.userData}
            />
          </motion.div>
        );

      // ── Driver view ──
      case 'driver':
        return (
          <motion.div key="driver" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
            className="h-full overflow-hidden">
            <DriverView user={user.userData} />
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

      default:
        return null;
    }
  };

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      <Header
        view={view}
        onViewChange={handleViewChange}
        user={{ email: displayName, role: user.role }}
        onLogout={handleLogout}
        adminTab={adminTab}
        onAdminTabChange={setAdminTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {renderView()}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="hidden md:flex h-7 bg-bg-secondary border-t border-border-dim items-center justify-between px-5">
        <div className="flex items-center gap-3 text-[11px] text-text-dim">
          <span className="font-mono">AquaSphere AI v3.2</span>
          <span className="text-border-dim">·</span>
          <span>BWSSB Active</span>
          {isAdmin && (
            <>
              <span className="text-border-dim">·</span>
              <span className="text-amber-500 font-semibold font-mono">{pendingCount} Pending</span>
              <span className="text-border-dim">·</span>
              <span className="text-sky-500 font-medium">{adminTab.charAt(0).toUpperCase() + adminTab.slice(1)}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-text-dim">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>24/24 Nodes</span>
          </div>
          <span className="text-border-dim">·</span>
          <span className="text-emerald-500 font-mono">12ms</span>
          <span className="text-border-dim">·</span>
          <span className="text-text-secondary">{displayName}</span>
        </div>
      </div>

      {/* Modals */}
      <RequestTankerModal isOpen={showTankerModal} onClose={() => setShowTankerModal(false)} onSubmitRequest={addCitizenRequest} userRR={userRR} user={user.userData} />
      <ReportLeakModal isOpen={showLeakModal} onClose={() => setShowLeakModal(false)} onSubmitLeak={addLeakReport} user={user.userData} />
    </div>
  );
}
