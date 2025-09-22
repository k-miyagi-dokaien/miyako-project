import type { FaucetFeature } from '@/types';

export function calculateFarmerWaterUsage(faucets: FaucetFeature[]): Map<string, number> {
  const usage = new Map<string, number>();

  faucets.forEach((faucet) => {
    const total = faucet.annualWaterUsageM3;
    if (!Number.isFinite(total) || total <= 0) {
      return;
    }
    faucet.farmerShares.forEach((share) => {
      const amount = total * share.share;
      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }
      usage.set(share.farmerId, (usage.get(share.farmerId) ?? 0) + amount);
    });
  });

  return usage;
}
