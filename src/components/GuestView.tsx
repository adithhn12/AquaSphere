import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Droplets, Truck, Globe, Lock, AlertTriangle, ChevronRight, Radio, TrendingUp } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from 'react-leaflet';
import { wards, tankers } from '../data/mockData';
import MapZoomControls from './MapZoomControls';

function MapContent() {
  const map = useMap();
  useEffect(() => {
    map.setView([12.9616, 77.6300], 11);
  }, [map]);
  return null;
}

interface GuestViewProps {
  onReportLeak: () => void;
}

export default function GuestView({ onReportLeak }: GuestViewProps) {
  const [activeTab, setActiveTab] = useState<'track' | 'report' | 'stats'>('track');
  const [selectedWard, setSelectedWard] = useState<string | null>(null);

  // Public statistics (anonymized)
  const publicStats = {
    activeTankers: 412,
    wardsServed: 198,
    avgDeliveryTime: '32 min',
    dailyDeliveries: 2847,
  };

  // Ward-level public data (no private addresses)
  const wardStats = wards.slice(0, 6).map(w => ({
    ...w,
    tankersActive: Math.floor(Math.random() * 5) + 1,
    pendingRequests: Math.floor(Math.random() * 15) + 5,
  }));

  return (
    <div className="h-full bg-bg-primary overflow-hidden flex flex-col">
      {/* Guest Mode Banner */}
      <div className="bg-text-secondary/10 border-b border-text-secondary/20 px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-2">
          <Globe size={12} className="text-text-secondary" />
          <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">
            Guest Mode — Public Data Only • Login for personalized features
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-bg-secondary border-b border-border-dim px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Public Dashboard</h2>
            <span className="text-[10px] font-mono text-text-dim">Bengaluru Water Distribution Network</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
            />
            <span className="text-[10px] font-mono text-neon">LIVE DATA</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {activeTab === 'track' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Public Map */}
              <div className="h-[300px] rounded-lg overflow-hidden border border-border-dim relative">
                <MapContainer
                  center={[12.9616, 77.6300]}
                  zoom={11}
                  className="h-full w-full"
                  zoomControl={false}
                  attributionControl={false}
                >
                  <MapContent />
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

                  {/* Ward markers (public) */}
                  {wards.map((ward) => (
                    <CircleMarker
                      key={ward.id}
                      center={[ward.lat, ward.lng]}
                      radius={ward.status === 'critical' ? 8 : ward.status === 'risk' ? 6 : 5}
                      pathOptions={{
                        color: ward.status === 'critical' ? '#EF4444' : ward.status === 'risk' ? '#F59E0B' : '#10B981',
                        fillColor: ward.status === 'critical' ? '#EF4444' : ward.status === 'risk' ? '#F59E0B' : '#10B981',
                        fillOpacity: 0.3,
                        weight: 1.5,
                      }}
                      eventHandlers={{
                        click: () => setSelectedWard(ward.id),
                      }}
                    />
                  ))}

                  {/* Public tanker routes (anonymized) */}
                  {tankers.slice(0, 3).map((tanker) => (
                    <Polyline
                      key={tanker.id}
                      positions={tanker.route}
                      pathOptions={{
                        color: '#0EA5E9',
                        weight: 1.5,
                        opacity: 0.3,
                        dashArray: '8 10',
                      }}
                    />
                  ))}

                  {/* Zoom Controls */}
                  <MapZoomControls
                    theme="dark"
                    showResetView={true}
                    showLocateUser={false}
                    resetCenter={[12.9616, 77.6300]}
                    resetZoom={11}
                    minZoom={10}
                    maxZoom={15}
                  />
                </MapContainer>

                {/* Map overlay - privacy notice */}
                <div className="absolute bottom-2 left-2 bg-bg-secondary/90 backdrop-blur-sm border border-border-dim rounded px-2 py-1">
                  <div className="flex items-center gap-1">
                    <Lock size={8} className="text-text-dim" />
                    <span className="text-[7px] font-mono text-text-dim">Private addresses hidden</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="absolute bottom-2 right-2 bg-bg-secondary/90 backdrop-blur-sm border border-border-dim rounded px-2 py-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-neon" />
                      <span className="text-[7px] font-mono text-text-dim">Stable</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber" />
                      <span className="text-[7px] font-mono text-text-dim">Risk</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red" />
                      <span className="text-[7px] font-mono text-text-dim">Critical</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Ward Info */}
              {selectedWard && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-bg-card border border-cyan/20 rounded-lg p-4"
                >
                  {(() => {
                    const ward = wards.find(w => w.id === selectedWard);
                    if (!ward) return null;
                    return (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-mono font-bold ${
                              ward.status === 'critical' ? 'text-red' : ward.status === 'risk' ? 'text-amber' : 'text-neon'
                            }`}>
                              {ward.id} {ward.name}
                            </span>
                            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                              ward.status === 'critical' ? 'bg-red/10 text-red' : ward.status === 'risk' ? 'bg-amber/10 text-amber' : 'bg-neon/10 text-neon'
                            }`}>
                              {ward.status.toUpperCase()}
                            </span>
                          </div>
                          <button onClick={() => setSelectedWard(null)} className="text-text-dim hover:text-text-secondary">×</button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-bg-primary rounded">
                            <span className="text-lg font-mono font-bold text-cyan">{ward.reservoir}%</span>
                            <span className="text-[8px] font-mono text-text-dim block">Reservoir</span>
                          </div>
                          <div className="text-center p-2 bg-bg-primary rounded">
                            <span className="text-lg font-mono font-bold text-amber">{ward.demand}</span>
                            <span className="text-[8px] font-mono text-text-dim block">Demand (MLD)</span>
                          </div>
                          <div className="text-center p-2 bg-bg-primary rounded">
                            <span className="text-lg font-mono font-bold text-neon">{ward.supply}</span>
                            <span className="text-[8px] font-mono text-text-dim block">Supply (MLD)</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              )}

              {/* Public Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Active Tankers', value: publicStats.activeTankers, icon: <Truck size={14} />, color: 'cyan' },
                  { label: 'Wards Served', value: publicStats.wardsServed, icon: <MapPin size={14} />, color: 'neon' },
                  { label: 'Avg Delivery', value: publicStats.avgDeliveryTime, icon: <TrendingUp size={14} />, color: 'amber' },
                  { label: "Today's Deliveries", value: publicStats.dailyDeliveries, icon: <Droplets size={14} />, color: 'cyan' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`bg-bg-card border border-${stat.color}/20 rounded-lg p-3 text-center`}
                  >
                    <div className={`text-${stat.color} mx-auto mb-1`}>{stat.icon}</div>
                    <span className={`text-lg font-mono font-bold text-${stat.color} block`}>{stat.value}</span>
                    <span className="text-[8px] font-mono text-text-dim uppercase">{stat.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Ward Activity Feed (Public) */}
              <div className="bg-bg-card border border-border-dim rounded-lg p-4">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-dim mb-3 flex items-center gap-2">
                  <Radio size={12} className="text-cyan" />
                  Neighborhood Dispatch Activity
                </h3>
                <div className="space-y-2">
                  {wardStats.map((ward, i) => (
                    <motion.div
                      key={ward.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between py-2 border-b border-border-dim last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          ward.status === 'critical' ? 'bg-red' : ward.status === 'risk' ? 'bg-amber' : 'bg-neon'
                        }`} />
                        <span className="text-[10px] font-mono text-text-primary">{ward.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[9px] font-mono">
                        <span className="text-cyan">{ward.tankersActive} tankers</span>
                        <span className="text-text-dim">{ward.pendingRequests} pending</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Restricted features notice */}
              <div className="bg-bg-card border border-border-dim rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Lock size={16} className="text-text-dim shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-mono text-text-secondary font-semibold mb-1">Login for Full Access</h4>
                    <ul className="space-y-1">
                      {[
                        'Request water tanker to your address',
                        'Track your personal tanker deliveries',
                        'View detailed ward-level data',
                        'Earn conservation points',
                      ].map((feature, i) => (
                        <li key={i} className="text-[9px] font-mono text-text-dim flex items-center gap-1">
                          <ChevronRight size={8} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'report' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="bg-bg-card border border-amber/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-amber" />
                  <h3 className="text-sm font-mono text-amber font-bold">Report Water Leak</h3>
                </div>
                <p className="text-[10px] font-mono text-text-secondary mb-4">
                  Help the municipality identify pipeline failures and water wastage. Guest reports are reviewed and prioritized based on verification.
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onReportLeak}
                  className="w-full py-3 rounded border border-amber/40 bg-amber/10 text-amber font-mono font-bold text-sm uppercase tracking-wider glow-amber hover:bg-amber/20 transition-all flex items-center justify-center gap-2"
                >
                  <Droplets size={16} />
                  Report a Leak
                </motion.button>
              </div>

              {/* Recent public reports */}
              <div className="bg-bg-card border border-border-dim rounded-lg p-4">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-dim mb-3">
                  Recent Public Reports
                </h3>
                <div className="space-y-2">
                  {[
                    { location: 'BTM Layout, Sec 2', type: 'Pipe Burst', time: '2h ago', status: 'Under Review' },
                    { location: 'HSR Layout, 14th Main', type: 'Street Overflow', time: '4h ago', status: 'Dispatched' },
                    { location: 'Koramangala, 5th Block', type: 'Low Pressure', time: '6h ago', status: 'Resolved' },
                  ].map((report, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border-dim last:border-0">
                      <div>
                        <span className="text-[10px] font-mono text-text-primary block">{report.location}</span>
                        <span className="text-[9px] font-mono text-text-dim">{report.type} • {report.time}</span>
                      </div>
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded ${
                        report.status === 'Resolved' ? 'bg-neon/10 text-neon' :
                        report.status === 'Dispatched' ? 'bg-cyan/10 text-cyan' :
                        'bg-amber/10 text-amber'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="bg-bg-card border border-border-dim rounded-lg p-4">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] text-text-dim mb-3">
                  City-Wide Statistics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-primary rounded p-3 text-center">
                    <span className="text-2xl font-mono font-bold text-cyan">198</span>
                    <span className="text-[9px] font-mono text-text-dim block">Total Wards</span>
                  </div>
                  <div className="bg-bg-primary rounded p-3 text-center">
                    <span className="text-2xl font-mono font-bold text-neon">1.2M</span>
                    <span className="text-[9px] font-mono text-text-dim block">Households Served</span>
                  </div>
                  <div className="bg-bg-primary rounded p-3 text-center">
                    <span className="text-2xl font-mono font-bold text-amber">850+</span>
                    <span className="text-[9px] font-mono text-text-dim block">Registered Tankers</span>
                  </div>
                  <div className="bg-bg-primary rounded p-3 text-center">
                    <span className="text-2xl font-mono font-bold text-red">14</span>
                    <span className="text-[9px] font-mono text-text-dim block">Wards Critical</span>
                  </div>
                </div>
              </div>

              {/* Today's overview */}
              <div className="bg-bg-card border border-cyan/20 rounded-lg p-4">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] text-cyan mb-3">
                  Today's Overview
                </h3>
                <div className="space-y-2">
                  {[
                    { label: 'Water Distributed', value: '45.2 MLD', trend: '+3.2%' },
                    { label: 'Requests Fulfilled', value: '2,847', trend: '+12%' },
                    { label: 'Avg Response Time', value: '32 min', trend: '-8%' },
                    { label: 'Leaks Reported', value: '23', trend: '-15%' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <span className="text-[10px] font-mono text-text-secondary">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-text-primary">{item.value}</span>
                        <span className={`text-[9px] font-mono ${item.trend.startsWith('+') ? 'text-neon' : 'text-red'}`}>
                          {item.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="border-t border-border-dim bg-bg-secondary px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          {[
            { id: 'track' as const, label: 'Track Tankers', icon: <MapPin size={16} /> },
            { id: 'report' as const, label: 'Report Leak', icon: <Droplets size={16} /> },
            { id: 'stats' as const, label: 'Statistics', icon: <TrendingUp size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded transition-all ${
                activeTab === tab.id
                  ? 'text-text-secondary'
                  : 'text-text-dim hover:text-text-secondary'
              }`}
            >
              {tab.icon}
              <span className="text-[8px] font-mono uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
