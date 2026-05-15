import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, Truck, AlertTriangle, Shield, Thermometer, Activity, Scale } from 'lucide-react';
import {
  waterStressedZones,
  tankerLogistics,
  regulatoryCompliance,
  wardForecastInputs,
  type WardForecastInput,
} from '../data/BengaluruCrisisFeed';

/* ═══════════════════════════════════════════════════════════
   SIMULATED ML PREDICTIVE MODEL
   ─────────────────────────────────────────────────────────
   A lightweight heuristic mimicking a linear / time-series
   ML model. It reads:
     • currentTempCelsius
     • seasonalIndex (0–1, higher = drier peak summer)
     • past7DayConsumptionMLD (rolling window)
     • borewellDepletionRatePercent
     • populationDensityPerSqKm
   and outputs:
     • meanWeeklyDemand  (avg of 7-day window)
     • predictedSurgeProb (0–100%)
     • recommendation     (operational badge)
   ═══════════════════════════════════════════════════════════ */

interface ForecastResult {
  ward: string;
  meanWeeklyDemandMLD: number;
  borewellDepletionRate: number;
  predictedSurgePercent: number;
  recommendation: 'Deploy Fleet Booster' | 'Increase Monitoring' | 'Stable Supply';
  recommendationColor: string;
}

function predictWardDemand(input: WardForecastInput): ForecastResult {
  const { ward, currentTempCelsius, seasonalIndex, past7DayConsumptionMLD, borewellDepletionRatePercent, populationDensityPerSqKm } = input;

  // Mean weekly demand
  const meanWeeklyDemandMLD =
    past7DayConsumptionMLD.reduce((a, b) => a + b, 0) / past7DayConsumptionMLD.length;

  // Trend slope (simple linear regression coefficient via last-minus-first)
  const trendSlope =
    (past7DayConsumptionMLD[6] - past7DayConsumptionMLD[0]) / 6;

  // Temperature surge factor: each degree above 30°C adds 2.5% demand pressure
  const tempFactor = Math.max(0, (currentTempCelsius - 30) * 2.5);

  // Seasonal factor: scales 0–30% at peak summer
  const seasonFactor = seasonalIndex * 30;

  // Borewell depletion amplifier: high depletion = more tanker reliance
  const borewellFactor = borewellDepletionRatePercent * 1.2;

  // Population density pressure: normalized to 10K baseline
  const densityFactor = (populationDensityPerSqKm / 10000) * 8;

  // Trend momentum: positive slope = rising demand
  const trendFactor = Math.max(0, trendSlope * 15);

  // Raw probability (clamped 0–100)
  let rawProb = tempFactor + seasonFactor + borewellFactor + densityFactor + trendFactor;
  rawProb = Math.min(100, Math.max(0, rawProb));

  // Quantize recommendation
  let recommendation: ForecastResult['recommendation'];
  let recommendationColor: string;
  if (rawProb >= 65) {
    recommendation = 'Deploy Fleet Booster';
    recommendationColor = '#F59E0B'; // amber
  } else if (rawProb >= 40) {
    recommendation = 'Increase Monitoring';
    recommendationColor = '#0EA5E9'; // cyan
  } else {
    recommendation = 'Stable Supply';
    recommendationColor = '#10B981'; // green
  }

  return {
    ward,
    meanWeeklyDemandMLD: Math.round(meanWeeklyDemandMLD * 100) / 100,
    borewellDepletionRate: borewellDepletionRatePercent,
    predictedSurgePercent: Math.round(rawProb * 10) / 10,
    recommendation,
    recommendationColor,
  };
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function PredictiveAnalytics() {
  const forecasts = useMemo(
    () => wardForecastInputs.map(predictWardDemand),
    []
  );

  const rwh = regulatoryCompliance.rwh;
  const ww = regulatoryCompliance.wastewater;
  const bw = regulatoryCompliance.borewellRegistration;

  return (
    <div className="p-4 md:p-6 space-y-6 bg-[#F1F5F9] overflow-auto h-full">
      {/* ── Page header ─────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Brain size={20} className="text-[#0EA5E9]" />
        <h2 className="text-lg font-semibold text-[#1E293B]">Predictive Analytics</h2>
        <span className="text-xs text-[#94A3B8] ml-1">AI-driven demand forecasting & crisis telemetry</span>
      </div>

      {/* ══════════════════════════════════════════════
         CRISIS FEED SUMMARY CARDS (2026 Bengaluru)
         ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Water-Stressed Zone Tally */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
              <AlertTriangle size={18} className="text-[#EF4444]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1E293B]">Water-Stressed Zones</h3>
              <span className="text-[11px] text-[#94A3B8]">Groundwater depletion tracker</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-[#EF4444]">{waterStressedZones.totalDepletedNeighborhoods}</span>
            <span className="text-sm text-[#64748B]">critically depleted neighborhoods</span>
          </div>
          <div className="space-y-1.5 mb-3">
            {waterStressedZones.criticalPockets.slice(0, 4).map(p => (
              <div key={p.name} className="flex items-center justify-between text-[12px]">
                <span className="text-[#1E293B] font-medium">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#EF4444] font-mono">{p.borewellFailures} failures</span>
                  <span className="text-[#94A3B8]">{p.depthMeters}m depth</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-[#94A3B8] border-t border-[#E2E8F0] pt-2">
            Avg borewell depth: <b className="text-[#1E293B]">{waterStressedZones.avgBorewellDepthMeters}m</b> ·
            YoY decline: <b className="text-[#EF4444]">↓{waterStressedZones.yearOverYearDeclinePercent}%</b>
          </div>
        </motion.div>

        {/* Municipal Tanker Logistics */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center">
              <Truck size={18} className="text-[#0EA5E9]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1E293B]">Sanchari Cauvery Fleet</h3>
              <span className="text-[11px] text-[#94A3B8]">Municipal tanker logistics</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-[#0EA5E9]">{tankerLogistics.totalSanchariCauveryUnits.toLocaleString()}</span>
            <span className="text-sm text-[#64748B]">mini water delivery trucks</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: 'Active Today', value: tankerLogistics.activeToday.toLocaleString(), color: 'text-[#10B981]' },
              { label: 'Maintenance', value: String(tankerLogistics.underMaintenance), color: 'text-[#F59E0B]' },
              { label: 'Daily Distributed', value: `${tankerLogistics.dailyWaterDistributedMLD} MLD`, color: 'text-[#0EA5E9]' },
              { label: 'Coverage', value: `${tankerLogistics.coverageNeighborhoods} areas`, color: 'text-[#1E293B]' },
            ].map(s => (
              <div key={s.label} className="bg-[#F8FAFC] rounded-lg p-2 border border-[#E2E8F0]">
                <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block">{s.label}</span>
                <span className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#94A3B8] border-t border-[#E2E8F0] pt-2 leading-relaxed">
            {tankerLogistics.pipelineBypassReason}
          </p>
        </motion.div>

        {/* Regulatory Compliance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Scale size={18} className="text-[#10B981]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1E293B]">Regulatory Compliance</h3>
              <span className="text-[11px] text-[#94A3B8]">RWH mandates & fine tracking</span>
            </div>
          </div>

          {/* RWH compliance bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#64748B]">{rwh.label}</span>
              <span className="text-xs font-bold text-[#10B981]">{rwh.compliancePercent}%</span>
            </div>
            <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div className="h-full bg-[#10B981] rounded-full" style={{ width: `${rwh.compliancePercent}%` }} />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-[#94A3B8]">
              <span>{rwh.compliant.toLocaleString()} compliant</span>
              <span className="text-[#EF4444]">{rwh.nonCompliant.toLocaleString()} non-compliant</span>
            </div>
          </div>

          {/* Fine tracker */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={12} className="text-[#F59E0B]" />
              <span className="text-[11px] text-[#F59E0B] font-semibold">Active Fine Enforcement</span>
            </div>
            <div className="text-[12px] text-[#64748B] space-y-0.5">
              <div>RWH violations: <b className="text-[#1E293B]">₹{rwh.finePerViolation.toLocaleString()}</b> baseline per property</div>
              <div>Wastewater discharge: <b className="text-[#1E293B]">₹{ww.baselineFine.toLocaleString()}–₹{ww.maxFine.toLocaleString()}</b></div>
              <div>FY26 fines issued: <b className="text-[#1E293B]">{rwh.totalFinesIssuedFY26.toLocaleString()}</b></div>
            </div>
          </div>

          {/* Borewell registration */}
          <div className="text-[11px] text-[#94A3B8] border-t border-[#E2E8F0] pt-2">
            Borewell registrations: <b className="text-[#1E293B]">{bw.registeredBorewells.toLocaleString()}</b> ·
            Unregistered est.: <b className="text-[#EF4444]">{bw.unregisteredEstimate.toLocaleString()}</b> ·
            Depth violations: <b className="text-[#F59E0B]">{bw.violationsLogged.toLocaleString()}</b>
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════
         AI DEMAND FORECAST TABLE
         ══════════════════════════════════════════════ */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-[#0EA5E9]" />
            <h3 className="text-sm font-semibold text-[#1E293B]">Ward Demand Forecast</h3>
            <span className="text-[10px] font-mono text-[#0EA5E9] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
              Heuristic ML v1.0
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#94A3B8]">
            <div className="flex items-center gap-1"><Thermometer size={11} /> Temp-weighted</div>
            <div className="flex items-center gap-1"><Activity size={11} /> Trend-aware</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="px-5 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Ward</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Borewell Depletion</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Mean Weekly Demand</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">AI Surge Probability</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((f, i) => (
                <motion.tr
                  key={f.ward}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <span className="text-[13px] font-semibold text-[#1E293B]">{f.ward}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, f.borewellDepletionRate * 5)}%`,
                            backgroundColor: f.borewellDepletionRate > 12 ? '#EF4444' : f.borewellDepletionRate > 8 ? '#F59E0B' : '#10B981',
                          }}
                        />
                      </div>
                      <span className="text-[13px] font-mono text-[#1E293B]">{f.borewellDepletionRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[13px] font-mono text-[#1E293B]">{f.meanWeeklyDemandMLD} <span className="text-[#94A3B8] text-[11px]">MLD</span></span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${f.predictedSurgePercent}%`,
                            backgroundColor: f.predictedSurgePercent > 65 ? '#EF4444' : f.predictedSurgePercent > 40 ? '#F59E0B' : '#10B981',
                          }}
                        />
                      </div>
                      <span className={`text-[13px] font-bold font-mono ${
                        f.predictedSurgePercent > 65 ? 'text-[#EF4444]' : f.predictedSurgePercent > 40 ? 'text-[#F59E0B]' : 'text-[#10B981]'
                      }`}>
                        {f.predictedSurgePercent}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border"
                      style={{
                        backgroundColor: `${f.recommendationColor}12`,
                        color: f.recommendationColor,
                        borderColor: `${f.recommendationColor}30`,
                      }}
                    >
                      {f.recommendation === 'Deploy Fleet Booster' && <Truck size={11} />}
                      {f.recommendation === 'Increase Monitoring' && <Activity size={11} />}
                      {f.recommendation === 'Stable Supply' && <Shield size={11} />}
                      {f.recommendation}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Model parameters footer */}
        <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center gap-4 text-[10px] text-[#94A3B8]">
          <span><b className="text-[#64748B]">Model:</b> Heuristic Linear / Time-Series</span>
          <span><b className="text-[#64748B]">Inputs:</b> Temperature, Seasonal Index, 7-day Consumption, Borewell Rate, Pop. Density</span>
          <span><b className="text-[#64748B]">Output:</b> Surge probability 0–100% + operational recommendation</span>
        </div>
      </div>
    </div>
  );
}
