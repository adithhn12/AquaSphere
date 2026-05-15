/**
 * BengaluruCrisisFeed.ts
 *
 * Simulated 2026 ground-reality telemetry for the Bengaluru
 * municipal water grid. All figures reflect the documented
 * severity of the city's groundwater and supply crisis.
 */

/* ── Water-Stressed Zone Tally ───────────────────────── */
export const waterStressedZones = {
  totalDepletedNeighborhoods: 448,
  criticalPockets: [
    { name: 'Frazer Town',         borewellFailures: 38, depthMeters: 320, status: 'critical' as const },
    { name: 'Kalkere',             borewellFailures: 45, depthMeters: 380, status: 'critical' as const },
    { name: 'Ramamurthy Nagar',    borewellFailures: 52, depthMeters: 410, status: 'critical' as const },
    { name: 'Thanisandra',         borewellFailures: 31, depthMeters: 290, status: 'critical' as const },
    { name: 'Horamavu',            borewellFailures: 42, depthMeters: 350, status: 'critical' as const },
    { name: 'Mahadevapura',        borewellFailures: 28, depthMeters: 270, status: 'severe' as const },
    { name: 'KR Puram',            borewellFailures: 36, depthMeters: 340, status: 'critical' as const },
    { name: 'Yelahanka New Town',  borewellFailures: 22, depthMeters: 240, status: 'severe' as const },
  ],
  avgBorewellDepthMeters: 340,
  yearOverYearDeclinePercent: 18.5,
  lastUpdated: '2026-01-20T08:00:00Z',
};

/* ── Municipal Tanker Logistics ──────────────────────── */
export const tankerLogistics = {
  totalSanchariCauveryUnits: 1260,
  activeToday: 1142,
  underMaintenance: 87,
  standbyReserve: 31,
  avgTripsPerUnitPerDay: 4.2,
  avgCapacityLiters: 6000,
  dailyWaterDistributedMLD: 28.7,
  coverageNeighborhoods: 312,
  pipelineBypassReason: 'Structural failures in aging trunk lines — 40% of East Zone mains exceed 30-year lifespan',
  fleetExpansionTarget2027: 1500,
};

/* ── Regulatory Compliance Tracker ───────────────────── */
export const regulatoryCompliance = {
  rwh: {
    label: 'Rainwater Harvesting (RWH) Mandate',
    totalPropertiesMonitored: 285000,
    compliant: 198450,
    nonCompliant: 86550,
    compliancePercent: 69.6,
    finePerViolation: 5000,
    totalFinesIssuedFY26: 14200,
    totalRevenueCollected: 71000000, // ₹7.1 Cr
    status: 'active' as const,
  },
  wastewater: {
    label: 'Domestic Wastewater Discharge Standards',
    monitoringStations: 142,
    violationsThisMonth: 38,
    baselineFine: 5000,
    maxFine: 25000,
    status: 'enforcing' as const,
  },
  borewellRegistration: {
    label: 'Borewell Registration & Depth Limit',
    registeredBorewells: 42800,
    unregisteredEstimate: 18500,
    maxPermittedDepth: 200, // meters
    violationsLogged: 1240,
    status: 'active' as const,
  },
};

/* ── Predictive Model Input Parameters ───────────────── */
export interface WardForecastInput {
  ward: string;
  currentTempCelsius: number;
  seasonalIndex: number; // 0–1, higher = drier / peak summer
  past7DayConsumptionMLD: number[];
  borewellDepletionRatePercent: number;
  populationDensityPerSqKm: number;
}

export const wardForecastInputs: WardForecastInput[] = [
  {
    ward: 'Whitefield',
    currentTempCelsius: 34.2,
    seasonalIndex: 0.82,
    past7DayConsumptionMLD: [4.8, 5.1, 5.3, 4.9, 5.5, 5.8, 6.0],
    borewellDepletionRatePercent: 12.4,
    populationDensityPerSqKm: 8200,
  },
  {
    ward: 'Indiranagar',
    currentTempCelsius: 33.8,
    seasonalIndex: 0.78,
    past7DayConsumptionMLD: [3.2, 3.5, 3.4, 3.6, 3.8, 3.7, 3.9],
    borewellDepletionRatePercent: 8.1,
    populationDensityPerSqKm: 12400,
  },
  {
    ward: 'Electronic City',
    currentTempCelsius: 35.0,
    seasonalIndex: 0.85,
    past7DayConsumptionMLD: [7.2, 7.5, 7.8, 7.4, 8.0, 8.2, 8.5],
    borewellDepletionRatePercent: 15.6,
    populationDensityPerSqKm: 6800,
  },
  {
    ward: 'Jayanagar',
    currentTempCelsius: 33.0,
    seasonalIndex: 0.72,
    past7DayConsumptionMLD: [2.8, 2.9, 3.0, 2.7, 3.1, 3.0, 3.2],
    borewellDepletionRatePercent: 5.3,
    populationDensityPerSqKm: 9600,
  },
  {
    ward: 'HSR Layout',
    currentTempCelsius: 34.5,
    seasonalIndex: 0.80,
    past7DayConsumptionMLD: [4.0, 4.3, 4.5, 4.2, 4.8, 4.9, 5.1],
    borewellDepletionRatePercent: 11.2,
    populationDensityPerSqKm: 10200,
  },
  {
    ward: 'Koramangala',
    currentTempCelsius: 33.5,
    seasonalIndex: 0.76,
    past7DayConsumptionMLD: [3.5, 3.7, 3.6, 3.8, 4.0, 3.9, 4.1],
    borewellDepletionRatePercent: 7.8,
    populationDensityPerSqKm: 11800,
  },
];
