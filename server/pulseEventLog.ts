import { isHighProfitSimulation } from "./simulationHistory";

export type PulseEventCandidate = {
  network: string;
  route: string;
  netProfitUsd: string;
  profitable: boolean;
  thresholdUsd: number;
  source: string;
};

export function buildPulseEvent(candidate: PulseEventCandidate) {
  if (!isHighProfitSimulation(candidate, candidate.thresholdUsd)) return null;
  return {
    network: candidate.network,
    route: candidate.route,
    netProfitUsd: candidate.netProfitUsd,
    thresholdUsd: candidate.thresholdUsd.toFixed(4),
    source: candidate.source,
  };
}

export function sortPulseEventsByNewest<T extends { timestamp: Date | string }>(events: T[]) {
  return [...events].sort((left, right) => {
    return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
  });
}
