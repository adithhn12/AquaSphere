/**
 * BWSSB Sanchari Cauvery — Official Tanker Rate Engine
 *
 * Base prices (official 2026 rate card):
 *   4,000 L  →  ₹ 660
 *   5,000 L  →  ₹ 700
 *   6,000 L  →  ₹ 740
 *  12,000 L  →  ₹1,290
 *
 * Distance surcharge:
 *   First 2 km included in base price.
 *   Beyond 2 km → ₹70 per additional km (rounded up).
 */

export type TankerCapacity = 4000 | 5000 | 6000 | 12000;

export interface PricingBreakdown {
  capacityLitres: TankerCapacity;
  basePrice: number;
  distanceKm: number;
  surchargeableKm: number;
  distanceSurcharge: number;
  totalAmount: number;
}

const BASE_PRICES: Record<TankerCapacity, number> = {
  4000: 660,
  5000: 700,
  6000: 740,
  12000: 1290,
};

const FREE_RADIUS_KM = 2;
const PER_KM_SURCHARGE = 70;

/**
 * Calculate total bill for a Sanchari Cauvery tanker delivery.
 *
 * @param capacityLitres  One of: 4000, 5000, 6000, 12000
 * @param distanceKm      Routing distance from pumping station to citizen address
 * @returns               Full pricing breakdown
 */
export function calculateTankerBill(
  capacityLitres: TankerCapacity,
  distanceKm: number
): PricingBreakdown {
  const basePrice = BASE_PRICES[capacityLitres];

  // Only charge for km beyond the 2 km free radius
  const surchargeableKm = Math.max(0, Math.ceil(distanceKm) - FREE_RADIUS_KM);
  const distanceSurcharge = surchargeableKm * PER_KM_SURCHARGE;
  const totalAmount = basePrice + distanceSurcharge;

  return {
    capacityLitres,
    basePrice,
    distanceKm: Math.round(distanceKm * 10) / 10,
    surchargeableKm,
    distanceSurcharge,
    totalAmount,
  };
}

/** All available capacity options for dropdowns */
export const CAPACITY_OPTIONS: { value: TankerCapacity; label: string; basePrice: number }[] = [
  { value: 4000,  label: '4,000 L',  basePrice: 660 },
  { value: 5000,  label: '5,000 L',  basePrice: 700 },
  { value: 6000,  label: '6,000 L',  basePrice: 740 },
  { value: 12000, label: '12,000 L', basePrice: 1290 },
];
