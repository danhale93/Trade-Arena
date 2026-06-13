#!/usr/bin/env node

/**
 * TRADE ARENA - Unit & Integration Tests
 * Run with: npm test
 */

const { TradingEngine } = require("./trading-engine.js");
const {
  SecurityHelper,
  ArbitrageAnalyzer,
  FlashLoanSimulator,
} = require("./contract-helpers.js");
const {
  CrucibleTest,
  runCrucibleTest,
  calculateRSI,
  calculateATR,
  calculateSMA,
  classifyRegime,
  validateAllRegimes,
} = require("./crucible-test.js");

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
