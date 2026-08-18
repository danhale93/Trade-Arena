export type TokenIdentity = {
  symbol: string;
  name: string;
  logoUrl: string;
};

const TOKEN_IDENTITIES: Record<string, TokenIdentity> = {
  WETH: { symbol: "WETH", name: "Wrapped Ether", logoUrl: "https://assets.coingecko.com/coins/images/2518/small/weth.png" },
  USDC: { symbol: "USDC", name: "USD Coin", logoUrl: "https://assets.coingecko.com/coins/images/6319/small/usdc.png" },
  AERO: { symbol: "AERO", name: "Aerodrome", logoUrl: "https://assets.coingecko.com/coins/images/33000/small/aerodrome.png" },
  SUSHI: { symbol: "SUSHI", name: "SushiSwap", logoUrl: "https://assets.coingecko.com/coins/images/12271/small/sushi.png" },
  ETH: { symbol: "ETH", name: "Ethereum", logoUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
  ARB: { symbol: "ARB", name: "Arbitrum", logoUrl: "https://assets.coingecko.com/coins/images/16547/small/arbitrum_logo.png" },
  OP: { symbol: "OP", name: "Optimism", logoUrl: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png" },
};

export function getTokenIdentity(symbol: string): TokenIdentity {
  const upper = (symbol || "").trim().toUpperCase();
  if (TOKEN_IDENTITIES[upper]) {
    return TOKEN_IDENTITIES[upper];
  }
  for (const [key, identity] of Object.entries(TOKEN_IDENTITIES)) {
    if (upper.includes(key)) {
      return identity;
    }
  }
  return {
    symbol: upper || "TOKEN",
    name: upper || "Digital Asset",
    logoUrl: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
  };
}

export type FeatureVisualizerInput = {
  latestPulseEvent?: {
    network?: string;
    route?: string;
    tokenPair?: string;
    netProfitUsd?: string;
    timestamp?: string | Date;
  };
  latestSimulationRoute?: {
    network?: string;
    route?: string;
    tokenIn?: string;
    tokenOut?: string;
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
  const hasData = Boolean(input.latestPulseEvent || input.latestSimulationRoute || input.pulseEventCount > 0);
  const featureNetwork = (input.latestPulseEvent?.network || input.latestSimulationRoute?.network || "MULTI-CHAIN").toUpperCase();
  const featureProfit = input.latestPulseEvent?.netProfitUsd || input.latestSimulationRoute?.netProfitUsd || null;
  const featureSpread = input.latestSimulationRoute?.spreadBps;
  const routeString = input.latestPulseEvent?.route || input.latestSimulationRoute?.route || input.latestPulseEvent?.tokenPair || (hasData ? "WETH → USDC / ROUTE SCAN" : "AWAITING ROUTE SIGNAL");
  
  const tokensMatch = routeString.match(/([A-Z0-9]{2,6})/g) || ["WETH", "USDC"];
  const tokenInSymbol = tokensMatch[0] || "WETH";
  const tokenOutSymbol = tokensMatch[1] || "USDC";

  const tokenInIdentity = getTokenIdentity(tokenInSymbol);
  const tokenOutIdentity = getTokenIdentity(tokenOutSymbol);

  const featureReels = [
    { label: "NETWORK", values: [featureNetwork, featureNetwork === "MULTI-CHAIN" ? "READY" : featureNetwork, "SECURE"] },
    { label: "TOKEN PAIR", values: [`${tokenInSymbol} / ${tokenOutSymbol}`, tokenInSymbol, tokenOutSymbol] },
    { label: "SPREAD", values: [featureSpread != null ? `${featureSpread} BPS` : (hasData ? "LIVE BPS" : "NO DATA"), "OPTIMAL", "ROUTE"] },
    { label: "PROFIT", values: [featureProfit ? `+$${featureProfit}` : (hasData ? "SCANNING" : "STANDBY"), hasData ? "SIMULATED" : "STANDBY", "NET"] },
  ];

  return {
    route: routeString,
    network: featureNetwork,
    profit: featureProfit,
    spread: featureSpread,
    tokenIn: tokenInIdentity,
    tokenOut: tokenOutIdentity,
    pulseLevel: Math.min(100, (input.pulseEventCount || 0) * 20),
    reels: featureReels,
    timestamp: input.latestPulseEvent?.timestamp,
  };
}
