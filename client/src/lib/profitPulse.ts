export const HIGH_PROFIT_MULTIPLIER = 2;

export type ProfitPulseCandidate = {
  id: number;
  netProfitUsd: string;
  profitable: number;
};

export function shouldTriggerProfitPulse(
  previousId: number | null,
  latest: ProfitPulseCandidate | undefined,
  thresholdUsd: number,
) {
  if (!latest || previousId === null || latest.id === previousId) return false;
  const profit = Number(latest.netProfitUsd);
  const threshold = Number(thresholdUsd);
  return latest.profitable === 1
    && Number.isFinite(profit)
    && Number.isFinite(threshold)
    && profit >= Math.max(0, threshold) * HIGH_PROFIT_MULTIPLIER;
}

export function getProfitPulseMotion(prefersReducedMotion: boolean) {
  return {
    animationName: prefersReducedMotion ? "none" : "trade-arena-profitability-pulse",
    durationMs: 2600,
  } as const;
}
