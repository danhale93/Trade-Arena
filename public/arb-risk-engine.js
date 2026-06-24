"use strict";

/**
 * Unified arbitrage risk engine.
 *
 * This module is intentionally execution-agnostic. It never sends orders; it only
 * sizes, rejects, and adapts opportunities based on observed performance.
 */

const DEFAULT_RISK_CONFIG = {
  baseRiskMultiplier: 1,
  minNetEdge: 0.03,
  minNetProfitUSD: 5,
  maxTradeSizeUSD: 250,
  maxLiquidityShare: 0.05,
  minLiquidityMultiple: 20,
  maxDailyLossUSD: 100,
  cooldownAfterConsecutiveLosses: 2,
  cooldownMs: 15 * 60 * 1000,
  slippageMissTolerance: 1.25,
};

function createRiskState(config = {}) {
  return {
    config: { ...DEFAULT_RISK_CONFIG, ...config },
    strategies: {},
    dailyPnL: 0,
    totalPnL: 0,
    adjustments: [],
  };
}

function getStrategyState(riskState, strategy) {
  if (!riskState.strategies[strategy]) {
    riskState.strategies[strategy] = {
      trades: 0,
      wins: 0,
      losses: 0,
      totalPnL: 0,
      consecutiveLosses: 0,
      riskMultiplier: riskState.config.baseRiskMultiplier,
      minEdgeBump: 0,
      slippageBuffer: 1,
      cooldownUntil: 0,
      lastAdjustment: null,
    };
  }

  return riskState.strategies[strategy];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function recordOpportunityResult(riskState, result = {}, now = Date.now()) {
  const strategy = result.strategy || result.type || "UNKNOWN";
  const state = getStrategyState(riskState, strategy);
  const netPnl = Number(result.netPnlUSD ?? result.netPnl ?? result.pnl ?? 0);
  const isWin = netPnl > 0 || result.outcome === "WIN";

  state.trades += 1;
  state.totalPnL += netPnl;
  riskState.totalPnL += netPnl;
  riskState.dailyPnL += netPnl;

  if (isWin) {
    state.wins += 1;
    state.consecutiveLosses = 0;
    state.riskMultiplier = clamp(state.riskMultiplier * 1.01, 0.35, 1.1);
    state.minEdgeBump = clamp(state.minEdgeBump * 0.95, 0, 0.05);
  } else {
    state.losses += 1;
    state.consecutiveLosses += 1;
    state.riskMultiplier = clamp(
      state.riskMultiplier * (state.consecutiveLosses >= 2 ? 0.88 : 0.95),
      0.35,
      1.1,
    );
    state.minEdgeBump = clamp(state.minEdgeBump + 0.005, 0, 0.05);
  }

  const estimatedSlippage = Number(result.estimatedSlippageUSD || 0);
  const actualSlippage = Number(result.actualSlippageUSD || 0);
  if (estimatedSlippage > 0 && actualSlippage > estimatedSlippage * riskState.config.slippageMissTolerance) {
    state.slippageBuffer = clamp(state.slippageBuffer * 1.25, 1, 3);
    state.riskMultiplier = clamp(state.riskMultiplier * 0.9, 0.35, 1.1);
  }

  if (state.consecutiveLosses >= riskState.config.cooldownAfterConsecutiveLosses) {
    state.cooldownUntil = now + riskState.config.cooldownMs;
  }

  const adjustment = {
    timestamp: new Date(now).toISOString(),
    strategy,
    netPnl,
    outcome: isWin ? "WIN" : "LOSS",
    consecutiveLosses: state.consecutiveLosses,
    riskMultiplier: state.riskMultiplier,
    minEdgeBump: state.minEdgeBump,
    slippageBuffer: state.slippageBuffer,
    cooldownUntil: state.cooldownUntil,
  };

  state.lastAdjustment = adjustment;
  riskState.adjustments.push(adjustment);
  if (riskState.adjustments.length > 250) riskState.adjustments.shift();

  return adjustment;
}

function getRiskAdjustment(riskState, strategy, now = Date.now()) {
  const state = getStrategyState(riskState, strategy);
  const reasons = [];

  if (state.cooldownUntil > now) reasons.push("strategy_cooldown");
  if (riskState.dailyPnL <= -Math.abs(riskState.config.maxDailyLossUSD)) reasons.push("daily_loss_limit");

  return {
    strategy,
    riskMultiplier: state.riskMultiplier,
    minEdgeBump: state.minEdgeBump,
    slippageBuffer: state.slippageBuffer,
    isCoolingDown: state.cooldownUntil > now,
    cooldownUntil: state.cooldownUntil,
    blocked: reasons.length > 0,
    reasons,
  };
}

function applyRiskControls(opportunity, riskState, options = {}, now = Date.now()) {
  const config = { ...riskState.config, ...options };
  const strategy = opportunity.strategy || opportunity.type || "UNKNOWN";
  const adjustment = getRiskAdjustment(riskState, strategy, now);
  const reasons = [...adjustment.reasons];

  const netEdge = Number(opportunity.netEdge ?? opportunity.edge ?? 0);
  const netProfitUSD = Number(opportunity.netProfitUSD ?? opportunity.expectedProfitUSD ?? 0);
  const liquidityUSD = Number(opportunity.liquidityUSD || 0);
  const requestedSizeUSD = Number(opportunity.recommendedSizeUSD || opportunity.sizeUSD || config.maxTradeSizeUSD);
  const minNetEdge = config.minNetEdge + adjustment.minEdgeBump;

  if (netEdge < minNetEdge) reasons.push("edge_below_threshold");
  if (netProfitUSD < config.minNetProfitUSD) reasons.push("profit_below_threshold");
  if (liquidityUSD > 0 && requestedSizeUSD > liquidityUSD / config.minLiquidityMultiple) {
    reasons.push("insufficient_liquidity_depth");
  }

  const liquidityCap = liquidityUSD > 0 ? liquidityUSD * config.maxLiquidityShare : config.maxTradeSizeUSD;
  const adjustedSizeUSD = clamp(
    requestedSizeUSD * adjustment.riskMultiplier,
    0,
    Math.min(config.maxTradeSizeUSD, liquidityCap),
  );

  if (adjustedSizeUSD <= 0) reasons.push("size_zero_after_risk_controls");

  return {
    approved: reasons.length === 0,
    strategy,
    adjustedSizeUSD,
    minNetEdge,
    riskMultiplier: adjustment.riskMultiplier,
    slippageBuffer: adjustment.slippageBuffer,
    reasons,
  };
}

module.exports = {
  DEFAULT_RISK_CONFIG,
  createRiskState,
  getStrategyState,
  recordOpportunityResult,
  getRiskAdjustment,
  applyRiskControls,
};
