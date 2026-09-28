import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, MapPin, Navigation, Phone, Droplets, CheckCircle, DollarSign, Route, ChevronRight, Star, Package, AlertTriangle, Radio, Bell, Users, Shield } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import { useFirestore } from '../hooks/useFirestore';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import MapZoomControls from './MapZoomControls';

function MapContent({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
      map.setView(center, 14);
    }
  }, [map, center]);
  return null;
}

interface PeerAlert {
  id: string;
  driverId: string;
  driverName: string;
  type: 'sos' | 'mechanical' | 'hazard';
  message: string;
  location: string;
  coordinates: [number, number];
  time: string;
  distance: string;
}

interface DriverViewProps {
  user?: any;
}

export default function DriverView({ user }: DriverViewProps) {
  const { data: tankers } = useFirestore<any>('tankers');
  const { data: requests } = useFirestore<any>('requests');
  const { data: dbAlerts } = useFirestore<PeerAlert>('peer_alerts');
  
  const userName = user?.name || 'Pilot';
  
  // In a real app, we'd get this from the user session
  const [activeTab, setActiveTab] = useState<'deliveries' | 'route' | 'earnings' | 'alerts'>('deliveries');
  
  // Find the tanker assigned to this driver (mocking for demo)
  const currentTanker = tankers.find(t => t.id === user?.tankerId || t.driver === userName) 
    || tankers.find(t => t.id === 'TNK-218')
    || tankers[0] 
    || { 
      lat: 12.9116, 
      lng: 77.6389, 
      id: user?.tankerId || 'TNK-ACTIVE', 
      plate: 'KA-01-AQ-2026', 
      filled: 8500, 
      capacity: 10000, 
      route: [[12.9716, 77.5946], [12.9116, 77.6389]],
      driver: userName
    };
  
  // Use real requests from Firestore, filtered by assignment
  const deliveries = useMemo(() => {
    const relevant = requests.filter((r: any) => 
      (r.status === 'Dispatched' || r.status === 'Delivered') && 
      r.assignedTankers?.includes(currentTanker.id)
    );
    
    const formatted = relevant.map((r: any) => ({
      id: r.id,
      address: r.area,
      liters: r.liters,
      status: r.status === 'Dispatched' ? 'current' : 'completed',
      customer: r.name,
      phone: '+91 98765 43210',
      urgency: r.urgency
    }));
    
    return formatted.sort((a, b) => {
      const order: Record<string, number> = { current: 0, completed: 1 };
      return order[a.status] - order[b.status];
    });
  }, [requests, currentTanker.id]);

  const currentDelivery = deliveries.find(d => d.status === 'current');
  const [eta, setEta] = useState(24);
  const [showSOS, setShowSOS] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<'stranded' | 'mechanical' | 'hazard'>('stranded');

  const peerAlerts = useMemo(() => {
    // Combine DB alerts with some high-fidelity mocks if DB is empty
    const list = dbAlerts.length > 0 ? dbAlerts : [
      {
        id: 'ALERT-001',
        driverId: 'DRV-2026-445',
        driverName: 'Tanker-307',
        type: 'mechanical',
        message: 'Mechanical failure on ORR near Silk Board. Requesting backup for 8000L load.',
        location: 'Silk Board Junction',
        coordinates: [12.9177, 77.6238],
        time: '2 min ago',
        distance: '3.2 km away',
      } as PeerAlert
    ];
    return list.sort((a, b) => (b as any).timestamp?.localeCompare((a as any).timestamp) || 0);
  }, [dbAlerts]);

  const completedDeliveries = deliveries.filter(d => d.status === 'completed');
  const todayEarnings = {
    trips: completedDeliveries.length,
    liters: completedDeliveries.reduce((sum, d) => sum + (d.liters || 0), 0),
    base: completedDeliveries.length * 600, // ₹600 per trip
    bonus: completedDeliveries.length * 100, // ₹100 efficiency bonus
    tips: 0,
    total: completedDeliveries.length * 700,
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setEta(prev => Math.max(1, prev - (Math.random() > 0.6 ? 1 : 0)));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // SOS countdown
  useEffect(() => {
    if (showSOS && sosCountdown > 0) {
      const timer = setTimeout(() => setSosCountdown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (showSOS && sosCountdown === 0 && !sosActive) {
      const triggerSOSInDB = async () => {
        setSosActive(true);
        const alertId = 'ALERT-' + Date.now();
        const newAlert: any = {
          id: alertId,
          driverId: user?.driverId || user?.id || 'DRV-GUEST',
          driverName: user?.name || 'Tanker Pilot',
          type: selectedEmergencyType === 'stranded' ? 'sos' : selectedEmergencyType,
          message: selectedEmergencyType === 'stranded' 
            ? 'Emergency SOS broadcast. Driver requires immediate assistance.' 
            : selectedEmergencyType === 'mechanical' 
              ? 'Mechanical failure reported. Vehicle stationary.' 
              : 'Hazardous road conditions reported. Proceed with caution.',
          location: currentDelivery?.address?.split('—')[0]?.trim() || 'HSR Layout, 14th Main',
          coordinates: [currentTanker.lat, currentTanker.lng],
          timestamp: new Date().toISOString(),
          time: 'Just now',
          distance: '0 km',
        };

        try {
          await setDoc(doc(db, 'peer_alerts', alertId), newAlert);
        } catch (e) {
          console.error("SOS failed to broadcast", e);
        }
      };
      triggerSOSInDB();
    }
  }, [showSOS, sosCountdown, currentTanker, user, selectedEmergencyType, currentDelivery, sosActive]);

  const completeDelivery = async () => {
    if (currentDelivery) {
      try {
        const docRef = doc(db, 'requests', currentDelivery.id);
        await updateDoc(docRef, { status: 'Delivered' });
        setEta(Math.floor(Math.random() * 20) + 15);
      } catch (error) {
        console.error("Error completing delivery:", error);
      }
    }
  };


  const triggerSOS = () => {
    setShowSOS(true);
    setSosCountdown(5);
  };

  const cancelSOS = () => {
    setShowSOS(false);
    setSosCountdown(5);
    setSosActive(false);
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'sos': return { bg: 'bg-red/10', border: 'border-red/30', text: 'text-red' };
      case 'mechanical': return { bg: 'bg-amber/10', border: 'border-amber/30', text: 'text-amber' };
      case 'hazard': return { bg: 'bg-cyan/10', border: 'border-cyan/30', text: 'text-cyan' };
      default: return { bg: 'bg-bg-card', border: 'border-border-dim', text: 'text-text-primary' };
    }
  };

  return (
    <div className="h-full bg-bg-primary overflow-hidden flex flex-col">
      {/* SOS Modal */}
      <AnimatePresence>
        {showSOS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className={`bg-white border ${sosActive ? 'border-emerald-200 shadow-lg' : 'border-red-200 shadow-lg'} rounded-2xl w-full max-w-sm overflow-hidden`}
            >
              {!sosActive ? (
                <div className="p-6 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <AlertTriangle size={48} className="text-red mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-mono font-bold text-red mb-2">EMERGENCY SOS</h3>
                  <p className="text-[11px] font-mono text-text-secondary mb-4">
                    Broadcasting emergency alert to all nearby drivers in <span className="text-red font-bold">{sosCountdown}</span> seconds
                  </p>
                  
                  <div className="h-2 bg-bg-primary rounded-full overflow-hidden mb-4">
                    <motion.div
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: 5, ease: 'linear' }}
                      className="h-full bg-red rounded-full"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { id: 'stranded', label: 'Stranded' },
                      { id: 'mechanical', label: 'Mechanical' },
                      { id: 'hazard', label: 'Hazard' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedEmergencyType(type.id as any)}
                        className={`py-2 px-2 rounded border font-mono text-[9px] transition-all ${
                          selectedEmergencyType === type.id 
                            ? 'bg-red text-white border-red shadow-md' 
                            : 'border-border-dim bg-bg-card text-text-secondary hover:border-red/30 hover:text-red'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={cancelSOS}
                    className="w-full py-3 rounded border border-text-dim bg-bg-card text-text-secondary font-mono font-bold text-sm uppercase tracking-wider hover:bg-bg-card-hover transition-all"
                  >
                    Cancel SOS
                  </motion.button>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Radio size={48} className="text-neon mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-mono font-bold text-neon mb-2">SOS BROADCAST ACTIVE</h3>
                  <p className="text-[11px] font-mono text-text-secondary mb-2">
                    Your emergency signal is being transmitted to <span className="text-cyan">12 nearby drivers</span>
                  </p>
                  <p className="text-[10px] font-mono text-text-dim mb-4">
                    Location: 12.9116°N, 77.6389°E • HSR Layout
                  </p>
                  
                  <div className="bg-bg-card border border-neon/20 rounded p-3 mb-4">
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                      />
                      <span className="text-[10px] font-mono text-neon">BWSSB Control notified</span>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={cancelSOS}
                    className="w-full py-3 rounded border border-red/40 bg-red/10 text-red font-mono font-bold text-sm uppercase tracking-wider hover:bg-red/20 transition-all"
                  >
                    Cancel Emergency
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top status bar */}
      <div className="bg-bg-secondary border-b border-border-dim px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-center">
              <Truck size={20} className="text-amber" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">{userName}</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-cyan">{currentTanker.id}</span>
                <span className="text-[9px] font-mono text-text-dim">• {currentTanker.plate}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Peer alert indicator */}
            {peerAlerts.length > 0 && (
              <motion.button
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                onClick={() => setActiveTab('alerts')}
                className="relative w-8 h-8 rounded-full bg-red/10 border border-red/30 flex items-center justify-center"
              >
                <Bell size={14} className="text-red" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red text-[8px] font-mono text-white flex items-center justify-center">
                  {peerAlerts.length}
                </span>
              </motion.button>
            )}
            
            {/* SOS Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={triggerSOS}
              className="px-3 py-1.5 rounded-full bg-red/10 border border-red/30 flex items-center gap-1.5 hover:bg-red/20 transition-all"
            >
              <AlertTriangle size={12} className="text-red" />
              <span className="text-[9px] font-mono text-red font-bold">SOS</span>
            </motion.button>
            
            <div className="text-right ml-2">
              <div className="flex items-center gap-1">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                />
                <span className="text-[10px] font-mono text-neon font-semibold">ON DUTY</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={10} className="text-amber fill-amber" />
                <span className="text-[9px] font-mono text-amber">4.8</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'deliveries' && (
              <motion.div
                key="deliveries"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-bg-card border border-border-dim rounded-lg p-3 text-center">
                    <span className="text-xs font-mono font-bold text-cyan block">{todayEarnings.trips}</span>
                    <span className="text-[8px] font-mono text-text-dim uppercase">Trips</span>
                  </div>
                  <div className="bg-bg-card border border-border-dim rounded-lg p-3 text-center">
                    <span className="text-xs font-mono font-bold text-neon block">{(todayEarnings.liters/1000).toFixed(1)}K</span>
                    <span className="text-[8px] font-mono text-text-dim uppercase">Liters</span>
                  </div>
                  <div className="bg-bg-card border border-border-dim rounded-lg p-3 text-center">
                    <span className="text-xs font-mono font-bold text-amber block">₹{todayEarnings.total}</span>
                    <span className="text-[8px] font-mono text-text-dim uppercase">Earned</span>
                  </div>
                </div>

                {/* Vehicle Health */}
                <div className="bg-bg-card border border-border-dim rounded-lg px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                      <Shield size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-text-dim block uppercase">Vehicle Health</span>
                      <span className="text-xs font-mono text-emerald-400 font-bold tracking-tight">SYSTEMS NOMINAL</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-text-dim block">Fuel</span>
                    <span className="text-xs font-mono text-text-primary">84%</span>
                  </div>
                </div>
                {/* Current delivery card */}
                {currentDelivery ? (
                  <div className="bg-bg-card border border-neon/20 rounded-lg overflow-hidden glow-neon">
                    <div className="bg-neon/10 px-4 py-2 border-b border-neon/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                        />
                        <span className="text-[10px] font-mono uppercase text-neon font-bold">
                          {currentDelivery.status === 'current' ? 'Active Mission' : 'Assigned - Standby'}
                        </span>
                      </div>
                      <span className="text-lg font-mono font-bold text-neon">ETA {eta}m</span>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-red/10 border border-red/30 flex items-center justify-center shrink-0">
                          <MapPin size={14} className="text-red" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-mono text-text-primary font-semibold block">{currentDelivery?.address}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-mono text-cyan">{currentDelivery?.liters?.toLocaleString()}L</span>
                            <span className="text-[9px] font-mono text-text-dim">•</span>
                            <span className={`text-[9px] font-mono ${currentDelivery?.urgency === 'high' ? 'text-red' : 'text-text-dim'}`}>
                              {currentDelivery?.urgency?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Customer info */}
                      <div className="flex items-center justify-between mb-4 bg-bg-primary/50 rounded p-3">
                        <div>
                          <span className="text-[10px] font-mono text-text-dim block">Customer</span>
                          <span className="text-xs font-mono text-text-primary font-semibold">{currentDelivery?.customer}</span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => window.location.href = `tel:${currentDelivery?.phone || '+919876543210'}`}
                          className="w-10 h-10 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center hover:bg-neon/20 transition-all"
                        >
                          <Phone size={16} className="text-neon" />
                        </motion.button>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setActiveTab('route');
                            const destination = encodeURIComponent(currentDelivery?.address || '');
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
                          }}
                          className="py-3 rounded border border-cyan/40 bg-cyan/10 text-cyan font-mono font-bold text-[10px] uppercase tracking-wider hover:bg-cyan/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Navigation size={14} />
                          Navigate
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={completeDelivery}
                          className="py-3 rounded border border-neon/40 bg-neon/10 text-neon font-mono font-bold text-[10px] uppercase tracking-wider hover:bg-neon/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle size={14} />
                          Complete
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-bg-card border border-border-dim border-dashed rounded-lg p-8 text-center">
                    <Truck size={32} className="text-text-dim mx-auto mb-3 opacity-20" />
                    <h3 className="text-sm font-mono font-bold text-text-dim uppercase">Awaiting Dispatch</h3>
                    <p className="text-[10px] font-mono text-text-dim mt-1">Standby for new delivery coordinates from BWSSB Command.</p>
                  </div>
                )}

                {/* Citizen Requests Queue */}
                <div className="bg-bg-card border border-border-dim rounded-lg p-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-dim mb-3 flex items-center gap-2">
                    <Users size={12} className="text-cyan" />
                    Citizen Requests ({deliveries.filter(d => d.status === 'pending').length} pending)
                  </h3>
                  <div className="space-y-2">
                    {deliveries.length === 0 && (
                      <div className="py-8 text-center border border-dashed border-border-dim rounded-lg">
                        <Package size={24} className="text-text-dim mx-auto mb-2 opacity-30" />
                        <p className="text-[10px] font-mono text-text-dim uppercase">No pending requests</p>
                      </div>
                    )}
                    {deliveries.map((delivery, i) => (
                      <div
                        key={delivery.id}
                        className={`p-3 rounded border ${
                          delivery.status === 'current'
                            ? 'border-neon/30 bg-neon/5'
                            : delivery.status === 'completed'
                            ? 'border-text-dim/20 bg-bg-primary/30 opacity-50'
                            : 'border-border-dim bg-bg-primary/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            delivery.status === 'completed'
                              ? 'bg-neon/10 border border-neon/30'
                              : delivery.status === 'current'
                              ? 'bg-neon/10 border border-neon/30'
                              : 'bg-bg-card border border-border-dim'
                          }`}>
                            {delivery.status === 'completed' ? (
                              <CheckCircle size={12} className="text-neon" />
                            ) : (
                              <span className="text-[9px] font-mono text-text-dim">{i + 1}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-text-primary">{delivery.address}</span>
                              <span className="text-[8px] font-mono text-text-dim">{delivery.customer}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] font-mono text-cyan">{delivery.liters.toLocaleString()}L</span>
                              {delivery.urgency === 'high' && (
                                <span className="text-[8px] font-mono text-red bg-red/10 px-1.5 py-0.5 rounded">URGENT</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tank status */}
                <div className="bg-bg-card border border-border-dim rounded-lg p-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-dim mb-3 flex items-center gap-2">
                    <Droplets size={12} className="text-cyan" />
                    Tank Status
                  </h3>
                  <div className="relative h-3 bg-bg-primary rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentTanker.filled / currentTanker.capacity) * 100}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-gradient-to-r from-cyan to-neon rounded-full"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-text-dim">Capacity</span>
                    <span className="text-cyan font-bold">
                      {currentTanker.filled.toLocaleString()}L / {currentTanker.capacity.toLocaleString()}L
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'route' && (
              <motion.div
                key="route"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <button
                  onClick={() => setActiveTab('deliveries')}
                  className="text-[10px] font-mono text-cyan hover:text-cyan/80 transition-colors"
                >
                  ← Back to Deliveries
                </button>

                {/* Map */}
                <div className="h-[300px] rounded-lg overflow-hidden border border-cyan/20 glow-cyan">
                  <MapContainer
                    center={[currentTanker.lat || 12.9716, currentTanker.lng || 77.5946]}
                    zoom={14}
                    className="h-full w-full"
                    zoomControl={false}
                    attributionControl={false}
                  >
                    <MapContent center={[currentTanker.lat || 12.9716, currentTanker.lng || 77.5946]} />
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    
                    {currentDelivery?.status === 'current' && (
                      <>
                        <Polyline
                          positions={currentTanker.route || [[currentTanker.lat, currentTanker.lng], [currentTanker.targetLat || currentTanker.lat, currentTanker.targetLng || currentTanker.lng]]}
                          pathOptions={{
                            color: '#10B981',
                            weight: 3,
                            opacity: 0.8,
                            dashArray: '10 6',
                          }}
                        />

                        <CircleMarker
                          center={[currentTanker.targetLat || currentTanker.lat, currentTanker.targetLng || currentTanker.lng]}
                          radius={8}
                          pathOptions={{
                            color: '#EF4444',
                            fillColor: '#EF4444',
                            fillOpacity: 0.6,
                            weight: 2,
                          }}
                        />
                      </>
                    )}

                    <CircleMarker
                      center={[currentTanker.lat || 12.9716, currentTanker.lng || 77.5946]}
                      radius={8}
                      pathOptions={{
                        color: '#0EA5E9',
                        fillColor: '#0EA5E9',
                        fillOpacity: 0.8,
                        weight: 2,
                      }}
                    />

                    {/* Peer alert locations */}
                    {peerAlerts.map(alert => (
                      <CircleMarker
                        key={alert.id}
                        center={alert.coordinates}
                        radius={6}
                        pathOptions={{
                          color: alert.type === 'sos' ? '#EF4444' : '#F59E0B',
                          fillColor: alert.type === 'sos' ? '#EF4444' : '#F59E0B',
                          fillOpacity: 0.5,
                          weight: 2,
                        }}
                      />
                    ))}

                    {/* Zoom Controls */}
                    <MapZoomControls
                      theme="dark"
                      showResetView={true}
                      showLocateUser={false}
                      resetCenter={[currentTanker.lat, currentTanker.lng]}
                      resetZoom={14}
                      minZoom={11}
                      maxZoom={17}
                    />
                  </MapContainer>
                </div>

                {/* Route info */}
                <div className="bg-bg-card border border-border-dim rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase text-text-dim">Optimized Route</span>
                    <span className="text-[9px] font-mono text-neon bg-neon/10 px-2 py-0.5 rounded">A* ALGORITHM</span>
                  </div>
                  <div className="space-y-3">
                    {currentDelivery?.status === 'current' ? (
                      (currentTanker.route || [[currentTanker.lat, currentTanker.lng], [currentTanker.targetLat || currentTanker.lat, currentTanker.targetLng || currentTanker.lng]]).map((point: any, i: number, arr: any[]) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                            i === 0 ? 'border-cyan bg-cyan/10' : i === arr.length - 1 ? 'border-red bg-red/10' : 'border-border-dim'
                          }`}>
                            {i === 0 ? (
                              <Truck size={10} className="text-cyan" />
                            ) : i === arr.length - 1 ? (
                              <MapPin size={10} className="text-red" />
                            ) : (
                              <span className="text-[8px] font-mono text-text-dim">{i}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <span className="text-[10px] font-mono text-text-primary">
                              {i === 0 ? 'Current Location' : i === arr.length - 1 ? (currentTanker.destinationArea || currentDelivery?.address || 'Destination') : `Waypoint ${i}`}
                            </span>
                            <span className="text-[8px] font-mono text-text-dim block">
                              {point[0]?.toFixed(4)}°N, {point[1]?.toFixed(4)}°E
                            </span>
                          </div>
                          {i < arr.length - 1 && (
                            <ChevronRight size={12} className="text-text-dim" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center">
                        <Navigation size={20} className="text-text-dim mx-auto mb-2 opacity-20" />
                        <p className="text-[10px] font-mono text-text-dim uppercase">No active route assigned</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'alerts' && (
              <motion.div
                key="alerts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-mono uppercase tracking-[0.15em] text-text-primary flex items-center gap-2">
                    <Bell size={14} className="text-red" />
                    Peer Emergency Alerts
                  </h3>
                  <span className="text-[9px] font-mono text-text-dim">{peerAlerts.length} active</span>
                </div>

                {peerAlerts.length === 0 ? (
                  <div className="bg-bg-card border border-border-dim rounded-lg p-6 text-center">
                    <Shield size={32} className="text-neon mx-auto mb-2 opacity-50" />
                    <p className="text-[11px] font-mono text-text-secondary">No active emergency alerts</p>
                    <p className="text-[9px] font-mono text-text-dim mt-1">All drivers in your vicinity are safe</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {peerAlerts.map((alert, idx) => {
                      const colors = getAlertColor(alert.type);
                      return (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`${colors.bg} border ${colors.border} rounded-lg p-4`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {alert.type === 'sos' ? (
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 0.5, repeat: Infinity }}
                                >
                                  <AlertTriangle size={14} className={colors.text} />
                                </motion.div>
                              ) : (
                                <Radio size={14} className={colors.text} />
                              )}
                              <span className={`text-[10px] font-mono font-bold uppercase ${colors.text}`}>
                                {alert.type === 'sos' ? 'EMERGENCY SOS' : alert.type === 'mechanical' ? 'MECHANICAL ISSUE' : 'ROAD HAZARD'}
                              </span>
                            </div>
                            <span className="text-[8px] font-mono text-text-dim">{alert.time}</span>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-bg-card border border-border-dim flex items-center justify-center">
                              <Truck size={10} className="text-amber" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono text-text-primary font-semibold">{alert.driverName}</span>
                              <span className="text-[8px] font-mono text-text-dim block">{alert.driverId}</span>
                            </div>
                          </div>

                          <p className="text-[10px] font-mono text-text-secondary mb-3">{alert.message}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <MapPin size={10} className="text-text-dim" />
                              <span className="text-[9px] font-mono text-text-dim">{alert.location}</span>
                            </div>
                            <span className="text-[9px] font-mono text-cyan">{alert.distance}</span>
                          </div>

                          {alert.driverName !== 'You' && (
                            <div className="grid grid-cols-2 gap-2 mt-3">
                              <button 
                                onClick={() => {
                                  const dest = alert.coordinates ? `${alert.coordinates[0]},${alert.coordinates[1]}` : encodeURIComponent(alert.location);
                                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
                                }}
                                className="py-2 rounded border border-neon/30 bg-neon/10 text-neon font-mono text-[9px] uppercase hover:bg-neon/20 transition-all flex items-center justify-center gap-1"
                              >
                                <Navigation size={10} />
                                Navigate
                              </button>
                              <button 
                                onClick={() => window.location.href = `tel:+919876543210`}
                                className="py-2 rounded border border-cyan/30 bg-cyan/10 text-cyan font-mono text-[9px] uppercase hover:bg-cyan/20 transition-all flex items-center justify-center gap-1"
                              >
                                <Phone size={10} />
                                Call Driver
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'earnings' && (
              <motion.div
                key="earnings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Today's earnings */}
                <div className="bg-bg-card border border-neon/20 rounded-lg p-5 text-center glow-neon">
                  <DollarSign size={24} className="text-neon mx-auto mb-2" />
                  <span className="text-3xl font-mono font-bold text-neon block">₹{todayEarnings.total.toLocaleString()}</span>
                  <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider">Today's Earnings</span>
                </div>

                {/* Breakdown */}
                <div className="bg-bg-card border border-border-dim rounded-lg p-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-dim mb-3">Breakdown</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Base Pay', value: todayEarnings.base, color: 'text-text-primary' },
                      { label: 'Surge Bonus', value: todayEarnings.bonus, color: 'text-amber' },
                      { label: 'Tips', value: todayEarnings.tips, color: 'text-neon' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-border-dim last:border-0">
                        <span className="text-[11px] font-mono text-text-dim">{item.label}</span>
                        <span className={`text-[11px] font-mono font-bold ${item.color}`}>₹{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-card border border-border-dim rounded-lg p-4 text-center">
                    <Route size={16} className="text-cyan mx-auto mb-1" />
                    <span className="text-xl font-mono font-bold text-cyan block">{todayEarnings.trips}</span>
                    <span className="text-[8px] font-mono text-text-dim uppercase">Trips Today</span>
                  </div>
                  <div className="bg-bg-card border border-border-dim rounded-lg p-4 text-center">
                    <Droplets size={16} className="text-cyan mx-auto mb-1" />
                    <span className="text-xl font-mono font-bold text-cyan block">{(todayEarnings.liters / 1000).toFixed(0)}K</span>
                    <span className="text-[8px] font-mono text-text-dim uppercase">Liters Delivered</span>
                  </div>
                </div>

                {/* Recent Payouts */}
                <div className="bg-bg-card border border-border-dim rounded-lg p-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-dim mb-3">Recent Payouts</h3>
                  <div className="space-y-2">
                    {completedDeliveries.length > 0 ? (
                      completedDeliveries.map((delivery, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border-dim last:border-0">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={10} className="text-emerald-400" />
                            <span className="text-[10px] font-mono text-text-primary">Trip #{delivery.id.slice(-4)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-mono text-text-primary font-bold">₹700</span>
                            <span className="text-[8px] font-mono text-emerald-400 block">Settled</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center border border-dashed border-border-dim rounded">
                        <p className="text-[9px] font-mono text-text-dim uppercase">No recent payouts</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Weekly trend */}
                <div className="bg-bg-card border border-border-dim rounded-lg p-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-dim mb-3">This Week</h3>
                  <div className="flex items-end justify-between h-16 gap-1">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                      const height = [60, 75, 45, 90, 80, 100, 70][i];
                      const isToday = i === 5;
                      return (
                        <div key={day} className="flex-1 flex flex-col items-center gap-1">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className={`w-full rounded-t ${isToday ? 'bg-neon' : 'bg-cyan/40'}`}
                          />
                          <span className={`text-[7px] font-mono ${isToday ? 'text-neon' : 'text-text-dim'}`}>{day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="border-t border-border-dim bg-bg-secondary px-4 py-2">
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {[
            { id: 'deliveries' as const, label: 'Requests', icon: <Package size={16} /> },
            { id: 'route' as const, label: 'Route', icon: <Route size={16} /> },
            { id: 'alerts' as const, label: 'Alerts', icon: <Bell size={16} />, badge: peerAlerts.length },
            { id: 'earnings' as const, label: 'Earnings', icon: <DollarSign size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center gap-1 px-4 py-1 rounded transition-all ${
                activeTab === tab.id
                  ? 'text-amber'
                  : 'text-text-dim hover:text-text-secondary'
              }`}
            >
              {tab.icon}
              <span className="text-[8px] font-mono uppercase tracking-wider">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 right-1 w-4 h-4 rounded-full bg-red text-[7px] font-mono text-white flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
