import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Droplets, Truck, Bell, Shield, Save, RotateCcw } from 'lucide-react';

interface ConfigItem {
  id: string;
  label: string;
  description: string;
  type: 'number' | 'toggle' | 'select';
  value: number | boolean | string;
  unit?: string;
  options?: string[];
}

const initialConfig: ConfigItem[] = [
  { id: 'max_capacity', label: 'Max Tanker Capacity', description: 'Maximum liters per single tanker load', type: 'number', value: 12000, unit: 'L' },
  { id: 'min_capacity', label: 'Min Tanker Capacity', description: 'Minimum order volume accepted', type: 'number', value: 2000, unit: 'L' },
  { id: 'critical_threshold', label: 'Critical Reservoir Threshold', description: 'Ward marked critical below this level', type: 'number', value: 25, unit: '%' },
  { id: 'risk_threshold', label: 'Risk Reservoir Threshold', description: 'Ward marked at-risk below this level', type: 'number', value: 45, unit: '%' },
  { id: 'dispatch_radius', label: 'Dispatch Radius', description: 'Maximum distance for tanker assignment', type: 'number', value: 15, unit: 'km' },
  { id: 'auto_dispatch', label: 'Auto-Dispatch', description: 'Automatically assign nearest tanker to critical requests', type: 'toggle', value: true },
  { id: 'sos_broadcast', label: 'SOS Broadcast', description: 'Enable driver emergency broadcast system', type: 'toggle', value: true },
  { id: 'leak_notifications', label: 'Leak Notifications', description: 'Send alerts to admin when leaks are reported', type: 'toggle', value: true },
  { id: 'forecast_model', label: 'Forecast Model', description: 'AI model used for shortage predictions', type: 'select', value: 'Prophet v2.1', options: ['Prophet v2.1', 'Prophet v3.0-beta', 'ARIMA', 'LSTM'] },
  { id: 'routing_algo', label: 'Routing Algorithm', description: 'Algorithm for tanker route optimization', type: 'select', value: 'Dijkstra + A*', options: ['Dijkstra + A*', 'Bellman-Ford', 'Floyd-Warshall', 'Greedy TSP'] },
];

export default function AdminSettingsPanel() {
  const [config, setConfig] = useState(initialConfig);
  const [saved, setSaved] = useState(false);

  const updateValue = (id: string, newValue: number | boolean | string) => {
    setConfig(prev => prev.map(c => c.id === id ? { ...c, value: newValue } : c));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setConfig(initialConfig);
    setSaved(false);
  };

  // Group config items
  const capacityItems = config.filter(c => c.id.includes('capacity'));
  const thresholdItems = config.filter(c => c.id.includes('threshold') || c.id === 'dispatch_radius');
  const toggleItems = config.filter(c => c.type === 'toggle');
  const selectItems = config.filter(c => c.type === 'select');

  const renderInput = (item: ConfigItem) => {
    if (item.type === 'number') {
      return (
        <div className="flex items-center gap-2">
          <input type="number" value={item.value as number}
            onChange={e => updateValue(item.id, parseInt(e.target.value) || 0)}
            className="w-24 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1E293B] font-mono text-right focus:outline-none focus:border-sky-300 transition-colors" />
          {item.unit && <span className="text-xs text-[#94A3B8] font-medium">{item.unit}</span>}
        </div>
      );
    }
    if (item.type === 'toggle') {
      const on = item.value as boolean;
      return (
        <button onClick={() => updateValue(item.id, !on)}
          className={`w-11 h-6 rounded-full relative transition-colors ${on ? 'bg-[#0EA5E9]' : 'bg-[#CBD5E1]'}`}>
          <motion.div animate={{ x: on ? 20 : 2 }}
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
        </button>
      );
    }
    if (item.type === 'select') {
      return (
        <select value={item.value as string} onChange={e => updateValue(item.id, e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1E293B] focus:outline-none focus:border-sky-300 transition-colors appearance-none pr-8"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}>
          {item.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    return null;
  };

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-[#1E293B]">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const Row = ({ item }: { item: ConfigItem }) => (
    <div className="flex items-center justify-between py-1">
      <div className="flex-1 mr-4">
        <span className="text-[13px] text-[#1E293B] font-medium block">{item.label}</span>
        <span className="text-[11px] text-[#94A3B8]">{item.description}</span>
      </div>
      {renderInput(item)}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 bg-[#F1F5F9] overflow-auto h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-[#0EA5E9]" />
          <h2 className="text-lg font-semibold text-[#1E293B]">System Settings</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-medium text-[#64748B] hover:border-[#CBD5E1] transition-all">
            <RotateCcw size={12} /> Reset
          </button>
          <button onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              saved ? 'bg-emerald-50 border border-emerald-200 text-[#10B981]' : 'bg-[#0EA5E9] text-white hover:bg-sky-600'
            }`}>
            <Save size={12} /> {saved ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Water Capacity Limits" icon={<Droplets size={16} className="text-[#0EA5E9]" />}>
          {capacityItems.map(item => <Row key={item.id} item={item} />)}
        </Section>

        <Section title="Threshold Configuration" icon={<Shield size={16} className="text-[#F59E0B]" />}>
          {thresholdItems.map(item => <Row key={item.id} item={item} />)}
        </Section>

        <Section title="System Toggles" icon={<Bell size={16} className="text-[#10B981]" />}>
          {toggleItems.map(item => <Row key={item.id} item={item} />)}
        </Section>

        <Section title="AI & Routing" icon={<Truck size={16} className="text-[#0EA5E9]" />}>
          {selectItems.map(item => <Row key={item.id} item={item} />)}
        </Section>
      </div>
    </div>
  );
}
