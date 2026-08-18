export type FeatureVisualizerInput = {
  latestPulseEvent?: {
    network?: string;
    route?: string;
    netProfitUsd?: string;
    timestamp?: string | Date;
  };
  latestSimulationRoute?: {
    network?: string;
    route?: string;
    netProfitUsd?: string;
    spreadBps?: number;
  };
  pulseEventCount: number;
};

export function getFeatureVisualizerMotion(prefersReducedMotion: boolean) {
  return {
    animationEnabled: !prefersReducedMotion,
    mode: prefersReducedMotion ? "STATIC" : "ANIMATED",
  } as const;
}

export function buildFeatureVisualizerModel(input: FeatureVisualizerInput) {
  const featureNetwork = (input.latestPulseEvent?.network || input.latestSimulationRoute?.network || "MULTI-CHAIN").toUpperCase();
  const featureProfit = input.latestPulseEvent?.netProfitUsd || input.latestSimulationRoute?.netProfitUsd || null;
  const featureSpread = input.latestSimulationRoute?.spreadBps;
  const featureReels = [
    { label: "CHAIN", values: [featureNetwork, featureNetwork === "MULTI-CHAIN" ? "NO DATA" : featureNetwork, "SIGNAL"] },
    { label: "SPREAD", values: [featureSpread != null ? `${featureSpread} BPS` : "NO DATA", "ROUTE", "MODEL"] },
    { label: "PROFIT", values: [featureProfit ? `+$${featureProfit}` : "NO DATA", featureProfit ? "SIMULATED" : "STANDBY", "NET"] },
  ];

  return {
    route: input.latestPulseEvent?.route || input.latestSimulationRoute?.route || "AWAITING ROUTE SIGNAL",
    network: featureNetwork,
    profit: featureProfit,
    spread: featureSpread,
    pulseLevel: Math.min(100, input.pulseEventCount * 20),
    reels: featureReels,
    timestamp: input.latestPulseEvent?.timestamp,
  };
}
