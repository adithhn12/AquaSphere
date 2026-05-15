export interface Ward {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'stable' | 'risk' | 'critical';
  reservoir: number;
  demand: number;
  supply: number;
  population: number;
  shortageProb?: number;
  demandChange?: string;
}

export interface Tanker {
  id: string;
  plate: string;
  lat: number;
  lng: number;
  status: 'in-transit' | 'delivering' | 'idle' | 'returning';
  capacity: number;
  filled: number;
  destination: string;
  origin: string;
  eta: number;
  driver: string;
  phone: string;
  earnings: number;
  deliveries: number;
  route: [number, number][];
}

export interface Incident {
  id: string;
  type: 'LEAK_REPORT' | 'LOW_PRESSURE' | 'TANKER_DELAY' | 'CONTAMINATION' | 'PIPE_BURST' | 'PUMP_FAILURE' | 'OVERFLOW';
  time: string;
  ward: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DemandDataPoint {
  hour: string;
  demand: number;
  supply: number;
}

export const wards: Ward[] = [
  { id: 'W22', name: 'Yelahanka', lat: 13.1005, lng: 77.5960, status: 'stable', reservoir: 72, demand: 45, supply: 68, population: 89000 },
  { id: 'W84', name: 'Hebbal', lat: 13.0358, lng: 77.5970, status: 'risk', reservoir: 48, demand: 62, supply: 51, population: 112000 },
  { id: 'W67', name: 'Malleshwaram', lat: 13.0035, lng: 77.5647, status: 'stable', reservoir: 65, demand: 41, supply: 59, population: 95000 },
  { id: 'W10', name: 'Rajajinagar', lat: 12.9910, lng: 77.5520, status: 'stable', reservoir: 61, demand: 38, supply: 55, population: 78000 },
  { id: 'W142', name: 'Indiranagar', lat: 12.9784, lng: 77.6408, status: 'risk', reservoir: 42, demand: 71, supply: 52, population: 134000, shortageProb: 64, demandChange: '+18%' },
  { id: 'W118', name: 'Varthur', lat: 12.9437, lng: 77.7400, status: 'critical', reservoir: 18, demand: 89, supply: 42, population: 156000, shortageProb: 94, demandChange: '+28%' },
  { id: 'W161', name: 'Koramangala', lat: 12.9352, lng: 77.6245, status: 'risk', reservoir: 44, demand: 67, supply: 49, population: 128000 },
  { id: 'W150', name: 'Bellandur', lat: 12.9256, lng: 77.6760, status: 'critical', reservoir: 22, demand: 85, supply: 38, population: 148000, shortageProb: 86, demandChange: '+22%' },
  { id: 'W201', name: 'Jayanagar', lat: 12.9250, lng: 77.5838, status: 'stable', reservoir: 58, demand: 44, supply: 61, population: 102000 },
  { id: 'W198', name: 'BTM Layout', lat: 12.9166, lng: 77.6101, status: 'risk', reservoir: 39, demand: 63, supply: 47, population: 118000 },
  { id: 'W174', name: 'HSR Layout', lat: 12.9116, lng: 77.6389, status: 'critical', reservoir: 31, demand: 78, supply: 41, population: 142000, shortageProb: 89, demandChange: '+31%' },
  { id: 'W245', name: 'Whitefield', lat: 12.9698, lng: 77.7500, status: 'risk', reservoir: 35, demand: 72, supply: 48, population: 165000, shortageProb: 68, demandChange: '+15%' },
];

export const tankers: Tanker[] = [
  {
    id: 'TNK-218',
    plate: 'KA-01-MQ-4421',
    lat: 12.9750,
    lng: 77.6350,
    status: 'in-transit',
    capacity: 12000,
    filled: 12000,
    destination: 'HSR Layout',
    origin: 'TK Halli Plant',
    eta: 24,
    driver: 'Ramesh K.',
    phone: '+91 98765 43210',
    earnings: 2400,
    deliveries: 3,
    route: [[12.9600, 77.5900], [12.9650, 77.6100], [12.9700, 77.6250], [12.9750, 77.6350], [12.9116, 77.6389]],
  },
  {
    id: 'TNK-307',
    plate: 'KA-03-AB-7891',
    lat: 12.9500,
    lng: 77.7100,
    status: 'in-transit',
    capacity: 10000,
    filled: 10000,
    destination: 'Varthur',
    origin: 'Cauvery Stage IV',
    eta: 18,
    driver: 'Suresh M.',
    phone: '+91 98765 43211',
    earnings: 1800,
    deliveries: 2,
    route: [[12.9400, 77.6800], [12.9450, 77.6950], [12.9500, 77.7100], [12.9437, 77.7400]],
  },
  {
    id: 'TNK-409',
    plate: 'KA-05-CD-2345',
    lat: 12.9300,
    lng: 77.6500,
    status: 'delivering',
    capacity: 8000,
    filled: 3200,
    destination: 'Bellandur',
    origin: 'Hebbal Reservoir',
    eta: 5,
    driver: 'Praveen L.',
    phone: '+91 98765 43212',
    earnings: 3200,
    deliveries: 4,
    route: [[13.0358, 77.5970], [12.9784, 77.6408], [12.9300, 77.6500], [12.9256, 77.6760]],
  },
  {
    id: 'TNK-512',
    plate: 'KA-02-EF-6789',
    lat: 13.0200,
    lng: 77.5800,
    status: 'idle',
    capacity: 15000,
    filled: 15000,
    destination: 'Malleshwaram',
    origin: 'Hesaraghatta Plant',
    eta: 0,
    driver: 'Kumar R.',
    phone: '+91 98765 43213',
    earnings: 1200,
    deliveries: 1,
    route: [[13.0500, 77.5700], [13.0358, 77.5970], [13.0200, 77.5800], [13.0035, 77.5647]],
  },
  {
    id: 'TNK-615',
    plate: 'KA-04-GH-1234',
    lat: 12.9800,
    lng: 77.5600,
    status: 'returning',
    capacity: 10000,
    filled: 0,
    destination: 'TK Halli Plant',
    origin: 'Jayanagar',
    eta: 35,
    driver: 'Anil S.',
    phone: '+91 98765 43214',
    earnings: 2800,
    deliveries: 3,
    route: [[12.9250, 77.5838], [12.9500, 77.5700], [12.9800, 77.5600]],
  },
];

export const incidents: Incident[] = [
  {
    id: 'INC-001',
    type: 'LEAK_REPORT',
    time: '14:21',
    ward: 'BTM Layout Sec 2',
    description: 'Major pipeline burst at Junction 4. Water flow disrupted to blocks 12-18.',
    severity: 'critical',
  },
  {
    id: 'INC-002',
    type: 'LOW_PRESSURE',
    time: '13:45',
    ward: 'HSR Layout Sec 7',
    description: 'Low pressure reported across Sector 7. Multiple households affected.',
    severity: 'high',
  },
  {
    id: 'INC-003',
    type: 'TANKER_DELAY',
    time: '13:12',
    ward: 'Bellandur',
    description: 'TNK-409 delayed by 45min due to traffic on ORR. ETA revised to 16:30.',
    severity: 'medium',
  },
  {
    id: 'INC-004',
    type: 'CONTAMINATION',
    time: '12:58',
    ward: 'Varthur',
    description: 'Water quality alert: TDS levels above 800ppm in borewell samples.',
    severity: 'critical',
  },
  {
    id: 'INC-005',
    type: 'PIPE_BURST',
    time: '12:30',
    ward: 'Whitefield',
    description: 'Underground pipe fracture on ITPL Main Road. Repair crew dispatched.',
    severity: 'high',
  },
  {
    id: 'INC-006',
    type: 'PUMP_FAILURE',
    time: '11:45',
    ward: 'Koramangala',
    description: 'Pump station #3 motor failure. Backup pump activated.',
    severity: 'medium',
  },
  {
    id: 'INC-007',
    type: 'LOW_PRESSURE',
    time: '11:20',
    ward: 'Indiranagar',
    description: 'Intermittent supply reported in 12th Main. BWSSB team investigating.',
    severity: 'medium',
  },
  {
    id: 'INC-008',
    type: 'OVERFLOW',
    time: '10:55',
    ward: 'Hebbal',
    description: 'Overhead tank overflow at Kempapura. Valve malfunction suspected.',
    severity: 'low',
  },
];

export const demandHistory: DemandDataPoint[] = [
  { hour: '00', demand: 32, supply: 45 },
  { hour: '03', demand: 18, supply: 42 },
  { hour: '06', demand: 58, supply: 48 },
  { hour: '09', demand: 82, supply: 62 },
  { hour: '12', demand: 75, supply: 58 },
  { hour: '15', demand: 88, supply: 55 },
  { hour: '18', demand: 92, supply: 51 },
  { hour: '21', demand: 65, supply: 48 },
];

export const conservationTips = [
  "Fix leaky faucets — a single drip wastes 20L/day. That's 7,300L/year per household.",
  "Use a bucket instead of a hose to wash vehicles. Saves up to 150L per wash.",
  "Install aerators on taps to reduce flow by 50% without losing pressure.",
  "Rainwater harvesting can offset 40% of domestic consumption in Bengaluru.",
  "Run washing machines only with full loads. Saves 45L per cycle.",
  "Water plants in early morning or late evening to reduce evaporation by 60%.",
];

export const forecastWards = [
  { id: 'W118', name: 'Varthur', prob: 94, change: '+28%', status: 'critical' as const },
  { id: 'W174', name: 'HSR Layout', prob: 89, change: '+31%', status: 'critical' as const },
  { id: 'W150', name: 'Bellandur', prob: 86, change: '+22%', status: 'critical' as const },
  { id: 'W245', name: 'Whitefield', prob: 68, change: '+15%', status: 'risk' as const },
  { id: 'W142', name: 'Indiranagar', prob: 64, change: '+18%', status: 'risk' as const },
];

export const citizenBadges = [
  { name: 'Water Warrior', icon: '🛡️', description: 'Reported 5 leaks', earned: true },
  { name: 'Conservation Champion', icon: '🏆', description: 'Saved 500L this month', earned: true },
  { name: 'Rain Harvester', icon: '🌧️', description: 'Installed RWH system', earned: false },
  { name: 'Community Leader', icon: '👥', description: 'Helped 10 neighbors', earned: true },
  { name: 'Zero Waste Hero', icon: '♻️', description: 'Zero water waste week', earned: false },
  { name: 'Sensor Guardian', icon: '📡', description: 'Maintained IoT sensors', earned: false },
];

export const leaderboard = [
  { rank: 1, name: 'Priya S.', ward: 'HSR Layout', score: 2840, trend: '+12%' },
  { rank: 2, name: 'Rahul M.', ward: 'Koramangala', score: 2695, trend: '+8%' },
  { rank: 3, name: 'Anita K.', ward: 'Indiranagar', score: 2510, trend: '+15%' },
  { rank: 4, name: 'You', ward: 'HSR Layout', score: 2380, trend: '+22%' },
  { rank: 5, name: 'Vikram D.', ward: 'BTM Layout', score: 2215, trend: '+5%' },
];
