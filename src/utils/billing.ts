import type { ParcelFeature } from '@/types';

export const AREA_RATE_YEN_PER_SQM = 2.0;
export const BASE_VOLUME_PER_SQM = 0.26; // m^3 per square meter
export const BASE_VOLUME_FACTOR = 1.2;
export const OVERAGE_RATE_YEN_PER_M3 = 15;

export type FarmerBilling = {
  assessedAreaSqm: number;
  baseFeeYen: number;
  baseVolumeM3: number;
  overageVolumeM3: number;
  overageFeeYen: number;
  totalYen: number;
};

export function calculateFarmerBilling(
  parcels: ParcelFeature[],
  waterUsageByFarmer: Map<string, number>
): Map<string, FarmerBilling> {
  const billing = new Map<string, FarmerBilling>();

  const areaByFarmer = new Map<string, number>();
  parcels.forEach((parcel) => {
    if (!parcel.farmerId) {
      return;
    }
    const current = areaByFarmer.get(parcel.farmerId) ?? 0;
    areaByFarmer.set(parcel.farmerId, current + (parcel.assessedAreaSqm ?? 0));
  });

  areaByFarmer.forEach((area, farmerId) => {
    const baseFee = area * AREA_RATE_YEN_PER_SQM;
    const baseVolume = area * BASE_VOLUME_PER_SQM * BASE_VOLUME_FACTOR;
    const usage = waterUsageByFarmer.get(farmerId) ?? 0;
    const overageVolume = Math.max(usage - baseVolume, 0);
    const overageFee = overageVolume * OVERAGE_RATE_YEN_PER_M3;
    billing.set(farmerId, {
      assessedAreaSqm: area,
      baseFeeYen: baseFee,
      baseVolumeM3: baseVolume,
      overageVolumeM3: overageVolume,
      overageFeeYen: overageFee,
      totalYen: baseFee + overageFee
    });
  });

  // Ensure farmers with usage but no area still have entry
  waterUsageByFarmer.forEach((usage, farmerId) => {
    if (billing.has(farmerId)) {
      return;
    }
    const overageVolume = usage; // base volume is 0
    const overageFee = overageVolume * OVERAGE_RATE_YEN_PER_M3;
    billing.set(farmerId, {
      assessedAreaSqm: 0,
      baseFeeYen: 0,
      baseVolumeM3: 0,
      overageVolumeM3: overageVolume,
      overageFeeYen: overageFee,
      totalYen: overageFee
    });
  });

  return billing;
}
