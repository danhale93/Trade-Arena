"use strict";

const { applyRiskControls } = require("./arb-risk-engine.js");

const DEFAULT_SPORTS_ARB_CONFIG = {
  minNetEdge: 0.05,
  feeRate: 0.01,
  slippageRate: 0.005,
  riskBuffer: 0.005,
  maxSizeUSD: 100,
  minLiquidityUSD: 1000,
};

function decimalToProbability(decimalOdds) {
  const odds = Number(decimalOdds);
  if (!Number.isFinite(odds) || odds <= 1) return null;
  return 1 / odds;
}

function americanToProbability(americanOdds) {
  const odds = Number(americanOdds);
  if (!Number.isFinite(odds) || odds === 0) return null;
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

function oddsToProbability(odds, format = "american") {
  if (format === "decimal") return decimalToProbability(odds);
  if (format === "probability") return Number(odds);
  return americanToProbability(odds);
}

function removeVig(outcomes) {
  const implied = outcomes
    .map((outcome) => ({
      ...outcome,
      impliedProbability:
        outcome.impliedProbability ?? oddsToProbability(outcome.price, outcome.format || "american"),
    }))
    .filter((outcome) => Number.isFinite(outcome.impliedProbability) && outcome.impliedProbability > 0);

  const overround = implied.reduce((sum, outcome) => sum + outcome.impliedProbability, 0);
  if (overround <= 0) return [];

  return implied.map((outcome) => ({
    ...outcome,
    fairProbability: outcome.impliedProbability / overround,
    overround,
  }));
}

function normalizeSportsbookEvent(event, marketKey = "h2h", oddsFormat = "american") {
  const eventId = event.id || `${event.home_team || "home"}-${event.away_team || "away"}`;
  const byOutcome = new Map();

  for (const bookmaker of event.bookmakers || []) {
    const market = (bookmaker.markets || []).find((item) => item.key === marketKey);
    if (!market) continue;

    const fairOutcomes = removeVig(
      (market.outcomes || []).map((outcome) => ({
        name: outcome.name,
        price: outcome.price,
        format: oddsFormat,
        bookmaker: bookmaker.key || bookmaker.title,
      })),
    );

    for (const outcome of fairOutcomes) {
      if (!byOutcome.has(outcome.name)) byOutcome.set(outcome.name, []);
      byOutcome.get(outcome.name).push(outcome.fairProbability);
    }
  }

  const fairProbabilities = {};
  for (const [outcome, probabilities] of byOutcome.entries()) {
    fairProbabilities[outcome] =
      probabilities.reduce((sum, probability) => sum + probability, 0) / probabilities.length;
  }

  return {
    eventId,
    sportKey: event.sport_key,
    commenceTime: event.commence_time,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    fairProbabilities,
    booksUsed: event.bookmakers?.length || 0,
  };
}

function calculatePredictionMarketEdge(fairProbability, market, config = {}) {
  const cfg = { ...DEFAULT_SPORTS_ARB_CONFIG, ...config };
  const yesPrice = Number(market.yesPrice ?? market.price);
  const noPrice = Number(market.noPrice ?? 1 - yesPrice);
  const feeDrag = cfg.feeRate + cfg.slippageRate + cfg.riskBuffer;

  const yesNetEdge = fairProbability - yesPrice - feeDrag;
  const noNetEdge = 1 - fairProbability - noPrice - feeDrag;
  const side = yesNetEdge >= noNetEdge ? "YES" : "NO";
  const netEdge = side === "YES" ? yesNetEdge : noNetEdge;
  const entryPrice = side === "YES" ? yesPrice : noPrice;
  const liquidityUSD = Number(market.liquidityUSD || 0);
  const recommendedSizeUSD = Math.min(cfg.maxSizeUSD, Math.max(0, liquidityUSD / 20));
  const netProfitUSD = recommendedSizeUSD * Math.max(0, netEdge);

  return {
    side,
    entryPrice,
    fairProbability,
    grossEdge: side === "YES" ? fairProbability - yesPrice : 1 - fairProbability - noPrice,
    netEdge,
    liquidityUSD,
    recommendedSizeUSD,
    netProfitUSD,
  };
}

function findSportsPredictionEdges({
  sportsbookEvents = [],
  predictionMarkets = [],
  riskState = null,
  config = {},
  marketKey = "h2h",
  oddsFormat = "american",
  now = Date.now(),
} = {}) {
  const cfg = { ...DEFAULT_SPORTS_ARB_CONFIG, ...config };
  const normalizedEvents = sportsbookEvents.map((event) =>
    normalizeSportsbookEvent(event, marketKey, oddsFormat),
  );
  const eventById = new Map(normalizedEvents.map((event) => [event.eventId, event]));
  const opportunities = [];

  for (const market of predictionMarkets) {
    const event = eventById.get(market.eventId);
    if (!event) continue;

    const outcome = market.outcome || market.name;
    const fairProbability = event.fairProbabilities[outcome];
    if (!Number.isFinite(fairProbability)) continue;

    const edge = calculatePredictionMarketEdge(fairProbability, market, cfg);
    const opportunity = {
      id: `sports-${event.eventId}-${outcome}-${edge.side}`,
      type: "SPORTS_PREDICTION_MARKET",
      strategy: "SPORTS_ODDS_PREDICTION_MARKET",
      eventId: event.eventId,
      sportKey: event.sportKey,
      event: `${event.awayTeam || "Away"} @ ${event.homeTeam || "Home"}`,
      outcome,
      side: edge.side,
      fairProbability,
      entryPrice: edge.entryPrice,
      grossEdge: edge.grossEdge,
      netEdge: edge.netEdge,
      liquidityUSD: edge.liquidityUSD,
      recommendedSizeUSD: edge.recommendedSizeUSD,
      netProfitUSD: edge.netProfitUSD,
      executionMode: "PREFUNDED_USDC",
      dryRunOnly: true,
    };

    const risk = riskState
      ? applyRiskControls(opportunity, riskState, { minNetEdge: cfg.minNetEdge }, now)
      : { approved: opportunity.netEdge >= cfg.minNetEdge, reasons: [] };

    opportunity.risk = risk;
    opportunity.status = risk.approved ? "CANDIDATE" : "REJECTED";
    if (edge.liquidityUSD < cfg.minLiquidityUSD) {
      opportunity.status = "REJECTED";
      opportunity.risk.reasons = [...(opportunity.risk.reasons || []), "liquidity_below_minimum"];
    }

    opportunities.push(opportunity);
  }

  return opportunities.sort((a, b) => b.netEdge - a.netEdge);
}

async function fetchSportsOdds(fetchImpl, url, options = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("fetchSportsOdds requires an injected fetch implementation");
  }
  const response = await fetchImpl(url, options);
  if (!response.ok) throw new Error(`Sports odds API error: ${response.status}`);
  return response.json();
}

module.exports = {
  DEFAULT_SPORTS_ARB_CONFIG,
  decimalToProbability,
  americanToProbability,
  oddsToProbability,
  removeVig,
  normalizeSportsbookEvent,
  calculatePredictionMarketEdge,
  findSportsPredictionEdges,
  fetchSportsOdds,
};
