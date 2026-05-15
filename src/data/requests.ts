/**
 * AquaSphere AI — Water Tanker Request System
 * 
 * Shared TypeScript interface and seed data for the global
 * request state that flows from Citizen → Admin in real time.
 */

export interface WaterRequest {
  id: string;
  rrNumber: string;
  area: string;
  name: string;
  liters: number;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  status: 'Pending' | 'Dispatched' | 'Delivered' | 'Rejected';
  timestamp: string;
  /** BWSSB Sanchari Cauvery computed bill (₹) */
  billAmount?: number;
}

/** Pre-seeded mock requests so the admin panel isn't empty on load */
export const SEED_REQUESTS: WaterRequest[] = [
  {
    id: 'REQ-8891',
    rrNumber: 'W-2345678B',
    area: 'Koramangala 4th Block',
    name: 'Mohammed Irfan',
    liters: 6000,
    urgency: 'high',
    status: 'Pending',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    billAmount: 950,
  },
  {
    id: 'REQ-8892',
    rrNumber: 'W-3456789C',
    area: 'Indiranagar 12th Main',
    name: 'Lakshmi Venkatesh',
    liters: 5000,
    urgency: 'normal',
    status: 'Dispatched',
    timestamp: new Date(Date.now() - 38 * 60000).toISOString(),
    billAmount: 770,
  },
  {
    id: 'REQ-8893',
    rrNumber: 'W-4567890D',
    area: 'Whitefield ITPL Road',
    name: 'Suresh Gowda',
    liters: 12000,
    urgency: 'critical',
    status: 'Pending',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    billAmount: 1640,
  },
  {
    id: 'REQ-8894',
    rrNumber: 'W-5678901E',
    area: 'BTM Layout 2nd Stage',
    name: 'Deepa Rao',
    liters: 5000,
    urgency: 'normal',
    status: 'Delivered',
    timestamp: new Date(Date.now() - 95 * 60000).toISOString(),
    billAmount: 700,
  },
  {
    id: 'REQ-8895',
    rrNumber: 'W-6789012F',
    area: 'HSR Layout Sector 2',
    name: 'Karthik M.',
    liters: 12000,
    urgency: 'high',
    status: 'Pending',
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    billAmount: 1430,
  },
];

let nextId = 8896;
let nextLeakId = 501;

/** Generate a unique sequential request ID */
export function generateRequestId(): string {
  return `REQ-${nextId++}`;
}

/* ═══════════════════════════════════════════════════════
   LEAK REPORT SYSTEM
   ═══════════════════════════════════════════════════════ */

export interface LeakReport {
  id: string;
  ward: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  imageUrl: string | null;     // URL.createObjectURL blob
  status: 'Pending' | 'Dispatched' | 'Resolved';
  timestamp: string;
  reporterName: string;
}

export function generateLeakId(): string {
  return `LEAK-${nextLeakId++}`;
}

/** Seed leak reports so the admin panel isn't empty */
export const SEED_LEAK_REPORTS: LeakReport[] = [
  {
    id: 'LEAK-498',
    ward: 'BTM Layout',
    description: 'Major pipeline burst at Junction 4, Sector 2. Water flooding the street for 2 hours.',
    severity: 'high',
    imageUrl: null,
    status: 'Pending',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    reporterName: 'Ananya Reddy',
  },
  {
    id: 'LEAK-499',
    ward: 'Koramangala',
    description: 'Slow seepage from underground pipe near 5th Block park. Damp ground spreading.',
    severity: 'medium',
    imageUrl: null,
    status: 'Dispatched',
    timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
    reporterName: 'Mohammed Irfan',
  },
  {
    id: 'LEAK-500',
    ward: 'HSR Layout',
    description: 'Low pressure and discolored water from tap. Possible contamination in Sector 7 line.',
    severity: 'low',
    imageUrl: null,
    status: 'Resolved',
    timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
    reporterName: 'Lakshmi Venkatesh',
  },
];
