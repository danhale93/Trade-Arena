const { ruleBasedConfidence, trackThreshold, stageConfig } = require('./aiConfidence');

function inferStage({ currentBalance, startingCapital = 50 }) {
  // Using roadmap values directly.
  if (currentBalance < 1000) return 1;
  if (currentBalance < 50000) return 2;
  if (currentBalance < 250000) return 3;
  return 4;
}

function buildTradeCandidate({ track, symbol, method, side, confidence, riskPct, leverage, amountUsd }) {
  return {
    track,
    symbol,
    method,
    side,
    confidence,
    leverage,
    riskPct,
    amountUsd,
    rationale: {
      trackThreshold: trackThreshold({ track }),
      stage: method,
    },
  };
}

function normalizeMethod(method) {
  // Map roadmap method names to MCP strategy/method fields.
  // The MCP tool uses strategy strings: ARBITRAGE, MOMENTUM, VOLATILITY, GRID, HYBRID.
  // We return a method label for UI/logging.
  return method;
}

// marketAnalysis items expected shape (from MCP analyze_opportunity):
// {
//   symbol, strategy, signal:{...}, risk:{level, score}, priceChanges{...}, ...
// }
function extractSignalsFromOpportunity(opp) {
  const ch24 = opp?.priceChanges?.['24h'] ?? 0;
  const riskScore = opp?.risk?.score ?? (Math.abs(ch24) / 20);
  const riskNorm = Math.min(1, Math.max(0, riskScore));

  const marketSignal = Math.max(-1, Math.min(1, (ch24 / 10)));
  const sentimentScore = Math.max(-1, Math.min(1, (ch24 / 10))); // placeholder: use price-change proxy
  const whaleSignal = Math.max(0, Math.min(1, Math.abs(ch24) / 12)); // placeholder: intensity from move size

  return { marketSignal, riskScore: riskNorm, sentimentScore, whaleSignal };
}

function chooseTrack({ stage, confidenceTurtle, confidenceHare, hasHareSetup, hasTurtleSetup }) {
  // Stage gating: in stage 1, Hare is heavily discouraged.
  const hareCfg = stageConfig({ stage });

  const turtleOk = hasTurtleSetup && confidenceTurtle >= trackThreshold({ track: 'TURTLE' });
  const hareOk = hasHareSetup && confidenceHare >= trackThreshold({ track: 'HARE' });

  if (stage === 1) {
    if (hareOk) return 'HARE';
    if (turtleOk) return 'TURTLE';
    return null;
  }

  if (stage === 4) {
    // Only A+ setups: we approximate by requiring both high confidence and Turtle confidence.
    if (turtleOk && confidenceTurtle >= 0.82) return 'TURTLE';
    if (hareOk && confidenceHare >= 0.95 && hareCfg.hareRiskMultiplier < 0.3) return 'HARE';
    return null;
  }

  // general: prefer the higher confidence track that passes thresholds
  if (turtleOk && hareOk) return confidenceHare >= confidenceTurtle ? 'HARE' : 'TURTLE';
  if (hareOk) return 'HARE';
  if (turtleOk) return 'TURTLE';
  return null;
}

function decideTrade({ startingCapital = 50, currentBalance, opportunities = [], stageOverride }) {
  const stage = stageOverride ?? inferStage({ currentBalance, startingCapital });
  const cfg = stageConfig({ stage });

  // Evaluate top opportunities (already pre-filtered by caller)
  const evaluated = opportunities.map((opp) => {
    const { marketSignal, riskScore, sentimentScore, whaleSignal } = extractSignalsFromOpportunity(opp);
    const confidence = ruleBasedConfidence({ marketSignal, riskScore, sentimentScore, whaleSignal });

    const isBull = (opp?.signal?.type || '').toString().includes('LONG') || (opp?.signal?.type || '') === 'VERY_BULLISH' || (opp?.priceChanges?.['24h'] ?? 0) >= 0;

    // Determine method label based on opp.strategy
    const strat = opp.strategy || opp?.signal?.strategy || 'HYBRID';

    let method;
    if (strat === 'ARBITRAGE' || strat === 'HYBRID') method = 'ARBITRAGE';
    else if (strat === 'MOMENTUM') method = 'MOMENTUM';
    else if (strat === 'VOLATILITY') method = 'VOLATILITY';
    else if (strat === 'GRID') method = 'GRID';
    else method = 'HYBRID';

    const side = isBull ? 'BUY' : 'SELL';

    return {
      opp,
      confidence,
      side,
      method,
    };
  });

  // Turtle/Hare confidence are the same computed confidence, but we treat them as separate thresholds.
  evaluated.sort((a, b) => b.confidence - a.confidence);

  for (const item of evaluated) {
    const confidenceTurtle = item.confidence;
    const confidenceHare = item.confidence; // same baseline; can be adjusted per method if desired

    const hasTurtleSetup = true;
    const hasHareSetup = true;

    const chosen = chooseTrack({
      stage,
      confidenceTurtle,
      confidenceHare,
      hasHareSetup,
      hasTurtleSetup,
    });

    if (!chosen) continue;

    const trackRiskPct = chosen === 'HARE' ? cfg.hareRiskPct * cfg.hareRiskMultiplier : cfg.turtleRiskPct;
    const leverage = chosen === 'HARE' ? cfg.hareLeverage : cfg.turtleLeverage;

    const amountUsd = Math.max(1, Math.round(currentBalance * trackRiskPct * 100) / 100);

    return {
      action: 'EXECUTE',
      stage,
      chosenTrack: chosen,
      candidate: {
        symbol: (item.opp.symbol || '').toUpperCase() || 'ETH',
        side: item.side,
        method: item.method,
        strategyForMcp: item.opp.strategy || 'HYBRID',
        confidence: item.confidence,
        leverage,
        amountUsd,
      },
    };
  }

  return {
    action: 'HOLD',
    stage,
    reason: 'No setup exceeded Turtle/Hare confidence thresholds for current stage.',
  };
}

module.exports = {
  inferStage,
  decideTrade,
};

