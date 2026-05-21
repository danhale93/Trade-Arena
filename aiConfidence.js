// AI confidence scoring + thresholds for Turtle/Hare gating.
// Roadmap mapping:
// - Track A (“Turtle”): AI threshold 0.65+
//   risk: 5% of balance per trade (base), leverage: 10x
// - Track B (“Hare”): AI threshold 0.90+
//   risk: 50% of balance per trade (base), leverage: 50x
//
// This file provides a deterministic confidence score if no Claude key is configured.

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

// Inputs expected (normalized):
// - marketSignal in [-1..1]
// - riskScore in [0..1] (higher means riskier)
// - sentimentScore in [-1..1]
// - whaleSignal in [0..1]
function ruleBasedConfidence({ marketSignal = 0, riskScore = 0.5, sentimentScore = 0, whaleSignal = 0 }) {
  // Favor bullish + whale presence; penalize risk.
  const base = 0.62;
  const marketTerm = 0.25 * clamp((marketSignal + 1) / 2, 0, 1);
  const sentimentTerm = 0.2 * clamp((sentimentScore + 1) / 2, 0, 1);
  const whaleTerm = 0.18 * clamp(whaleSignal, 0, 1);
  const riskPenalty = 0.35 * clamp(riskScore, 0, 1);

  return clamp(base + marketTerm + sentimentTerm + whaleTerm - riskPenalty, 0, 0.99);
}

function trackThreshold({ track }) {
  return track === 'HARE' ? 0.9 : 0.65;
}

function stageConfig({ stage }) {
  // Stage 1: Launchpad ($50 -> $1,000)
  // Stage 2: Acceleration ($1,000 -> $50,000)
  // Stage 3: Institutional Tier ($50,000 -> $250,000)
  // Stage 4: Final Sprint ($250,000 -> $1,000,000)

  if (stage === 3) {
    return { hareRiskMultiplier: 0.35, hareLeverage: 3, hareRiskPct: 0.02, turtleRiskPct: 0.02, turtleLeverage: 3 };
  }
  if (stage === 4) {
    return { hareRiskMultiplier: 0.15, hareLeverage: 2, hareRiskPct: 0.01, turtleRiskPct: 0.01, turtleLeverage: 2 };
  }

  if (stage === 2) {
    return { hareRiskMultiplier: 0.85, hareLeverage: 50, hareRiskPct: 0.5, turtleRiskPct: 0.05, turtleLeverage: 10 };
  }

  // stage 1 default
  return { hareRiskMultiplier: 0.35, hareLeverage: 50, hareRiskPct: 0.5, turtleRiskPct: 0.05, turtleLeverage: 10 };
}

module.exports = {
  ruleBasedConfidence,
  trackThreshold,
  stageConfig,
};

