/**
 * Tests for PR changes in contract-helpers.js
 *
 * Covers:
 * - ArbitrageAnalyzer.calculateArbitrage: default gasPrice changed from 0.05 to 50
 * - SecurityHelper.isStablecoin (static + instance) removed in this PR
 */

'use strict';

const {
  SecurityHelper,
  ArbitrageAnalyzer,
  FlashLoanSimulator,
  PROTOCOLS,
} = require('./contract-helpers');

// ════════════════════════════════════════════════════════════
// ArbitrageAnalyzer.calculateArbitrage — gasPrice default changed
// ════════════════════════════════════════════════════════════

describe('ArbitrageAnalyzer.calculateArbitrage — PR change: gasPrice default now 50 (was 0.05)', () => {
  const BUY_PRICE = 2500;
  const SELL_PRICE = 2525;
  const AMOUNT_USD = 100;

  test('uses 50 Gwei as default gasPrice (not 0.05)', () => {
    // With gasPrice=50 Gwei, gasEstimate=150000:
    // gasCost = (50 * 150000) / 1e9 = 0.0075 ETH
    // gasCostUSD = 0.0075 * 2500 = 18.75 USD
    // With gasPrice=0.05 Gwei (old): gasCostUSD = (0.05*150000/1e9)*2500 = 0.01875 USD
    const resultDefault = ArbitrageAnalyzer.calculateArbitrage(BUY_PRICE, SELL_PRICE, AMOUNT_USD);
    const resultExplicit50 = ArbitrageAnalyzer.calculateArbitrage(BUY_PRICE, SELL_PRICE, AMOUNT_USD, 50);

    expect(resultDefault.netProfit).toBe(resultExplicit50.netProfit);
    expect(resultDefault.totalFees).toBe(resultExplicit50.totalFees);
    expect(resultDefault.isViable).toBe(resultExplicit50.isViable);
  });

  test('default gasPrice=50 produces much higher gas costs than gasPrice=0.05 (old default)', () => {
    const resultNewDefault = ArbitrageAnalyzer.calculateArbitrage(BUY_PRICE, SELL_PRICE, AMOUNT_USD);
    const resultOldDefault = ArbitrageAnalyzer.calculateArbitrage(BUY_PRICE, SELL_PRICE, AMOUNT_USD, 0.05);

    // New default incurs much higher fees (1000x the gas cost)
    expect(parseFloat(resultNewDefault.totalFees)).toBeGreaterThan(
      parseFloat(resultOldDefault.totalFees)
    );
  });

  test('returns correct structure with required fields', () => {
    const result = ArbitrageAnalyzer.calculateArbitrage(BUY_PRICE, SELL_PRICE, AMOUNT_USD);

    expect(result).toHaveProperty('grossProfit');
    expect(result).toHaveProperty('totalFees');
    expect(result).toHaveProperty('netProfit');
    expect(result).toHaveProperty('profitPercent');
    expect(result).toHaveProperty('isViable');
  });

  test('calculates correct gas cost with default gasPrice=50', () => {
    // gasCost = (50 * 150000) / 1e9 = 0.0075 ETH
    // gasCostUSD = 0.0075 * buyPrice
    const gasCostUSD = (50 * 150000) / 1e9 * BUY_PRICE; // 18.75
    const buyFee = AMOUNT_USD * 0.005;  // 0.5
    const sellFee = AMOUNT_USD * 0.005; // 0.5
    const expectedTotalFees = buyFee + sellFee + gasCostUSD;

    const result = ArbitrageAnalyzer.calculateArbitrage(BUY_PRICE, SELL_PRICE, AMOUNT_USD);
    expect(parseFloat(result.totalFees)).toBeCloseTo(expectedTotalFees, 4);
  });

  test('isViable is false when price spread does not cover fees at default gasPrice=50', () => {
    // Small spread (0.1%) should not be viable with high gas fees
    const result = ArbitrageAnalyzer.calculateArbitrage(2500, 2502.5, 100);
    // grossProfit = (2502.5 - 2500) * (100/2500) = 0.1
    // fees = 0.5 + 0.5 + 18.75 = 19.75
    // netProfit = 0.1 - 19.75 = negative
    expect(result.isViable).toBe(false);
    expect(parseFloat(result.netProfit)).toBeLessThan(0);
  });

  test('isViable is true for large enough price spread that covers fees', () => {
    // Need gross profit > ~19.75 fees
    // grossProfit = (sellPrice - buyPrice) * (amount/buyPrice)
    // With amount=10000 and spread of $50: grossProfit = 50 * (10000/2500) = 200
    // fees = 50 + 50 + 18.75 = 118.75  => net = 81.25 > 0
    const result = ArbitrageAnalyzer.calculateArbitrage(2500, 2550, 10000);
    expect(result.isViable).toBe(true);
    expect(parseFloat(result.netProfit)).toBeGreaterThan(0);
  });

  test('explicit gasPrice=0 zeroes out gas cost component', () => {
    const result = ArbitrageAnalyzer.calculateArbitrage(2500, 2510, 100, 0);
    // gasCostUSD = 0, only trading fees apply
    const buyFee = 100 * 0.005;
    const sellFee = 100 * 0.005;
    expect(parseFloat(result.totalFees)).toBeCloseTo(buyFee + sellFee, 4);
  });

  test('grossProfit calculation is correct regardless of gasPrice', () => {
    const result = ArbitrageAnalyzer.calculateArbitrage(2500, 2510, 100, 0);
    // grossProfit = (2510 - 2500) * (100 / 2500) = 10 * 0.04 = 0.4
    expect(parseFloat(result.grossProfit)).toBeCloseTo(0.4, 4);
  });

  test('profitPercent is positive when trade is viable', () => {
    const result = ArbitrageAnalyzer.calculateArbitrage(2500, 2550, 10000, 0);
    expect(parseFloat(result.profitPercent)).toBeGreaterThan(0);
  });

  test('netProfit equals grossProfit minus totalFees', () => {
    const result = ArbitrageAnalyzer.calculateArbitrage(2500, 2550, 100);
    const computed = parseFloat(result.grossProfit) - parseFloat(result.totalFees);
    expect(parseFloat(result.netProfit)).toBeCloseTo(computed, 4);
  });

  test('equal buy/sell prices yields zero or negative grossProfit', () => {
    const result = ArbitrageAnalyzer.calculateArbitrage(2500, 2500, 100);
    expect(parseFloat(result.grossProfit)).toBeCloseTo(0, 4);
    expect(result.isViable).toBe(false);
  });

  test('larger amount increases fees and gross profit proportionally', () => {
    const small = ArbitrageAnalyzer.calculateArbitrage(2500, 2510, 100);
    const large = ArbitrageAnalyzer.calculateArbitrage(2500, 2510, 1000);
    expect(parseFloat(large.grossProfit)).toBeGreaterThan(parseFloat(small.grossProfit));
    // Trading fees scale with amount; gas cost does not scale
    expect(parseFloat(large.totalFees)).toBeGreaterThan(parseFloat(small.totalFees));
  });

  // Boundary case: negative spread (sellPrice < buyPrice)
  test('negative spread yields negative grossProfit and isViable=false', () => {
    const result = ArbitrageAnalyzer.calculateArbitrage(2510, 2500, 100);
    expect(parseFloat(result.grossProfit)).toBeLessThan(0);
    expect(result.isViable).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════
// SecurityHelper — isStablecoin methods removed in this PR
// ════════════════════════════════════════════════════════════

describe('SecurityHelper — isStablecoin removed in PR (regression guard)', () => {
  test('SecurityHelper.isStablecoin static method no longer exists', () => {
    expect(SecurityHelper.isStablecoin).toBeUndefined();
  });

  test('SecurityHelper instance isStablecoin method no longer exists', () => {
    const helper = new SecurityHelper();
    expect(helper.isStablecoin).toBeUndefined();
  });

  test('SecurityHelper class still exists and is functional', () => {
    expect(typeof SecurityHelper).toBe('function');
  });

  test('SecurityHelper.analyzeMEVRisk static method still exists', () => {
    expect(typeof SecurityHelper.analyzeMEVRisk).toBe('function');
  });

  test('SecurityHelper.estimateSlippage static method still exists', () => {
    expect(typeof SecurityHelper.estimateSlippage).toBe('function');
  });

  test('SecurityHelper.validateContractInteraction static method still exists', () => {
    expect(typeof SecurityHelper.validateContractInteraction).toBe('function');
  });
});

// ════════════════════════════════════════════════════════════
// ArbitrageAnalyzer.findTriangularArbitrage — unchanged, sanity check
// ════════════════════════════════════════════════════════════

describe('ArbitrageAnalyzer.findTriangularArbitrage', () => {
  test('detects profitable triangular arbitrage when product > 1', () => {
    const prices = {
      'ETH/USD': 2500,
      'USD/USDC': 1,
      'USDC/ETH': 0.000401, // > 1/2500 = 0.0004
    };
    const result = ArbitrageAnalyzer.findTriangularArbitrage(prices);
    expect(result.opportunity).toBe(true);
    expect(parseFloat(result.profitPercent)).toBeGreaterThan(0);
  });

  test('no opportunity when product <= 1', () => {
    const prices = {
      'ETH/USD': 2500,
      'USD/USDC': 1,
      'USDC/ETH': 0.0003999, // < 1/2500
    };
    const result = ArbitrageAnalyzer.findTriangularArbitrage(prices);
    expect(result.opportunity).toBe(false);
  });

  test('returns path containing all keys', () => {
    const prices = { 'A/B': 2, 'B/C': 3, 'C/A': 0.2 };
    const result = ArbitrageAnalyzer.findTriangularArbitrage(prices);
    expect(result.path).toEqual(['A/B', 'B/C', 'C/A']);
  });
});

// ════════════════════════════════════════════════════════════
// SecurityHelper.analyzeMEVRisk — unchanged, sanity check
// ════════════════════════════════════════════════════════════

describe('SecurityHelper.analyzeMEVRisk', () => {
  test('returns riskScore > 0 for large swaps', () => {
    const risk = SecurityHelper.analyzeMEVRisk({
      amountIn: 20,
      volatility: 3,
      liquidity: 500000,
    });
    expect(risk.riskScore).toBeGreaterThan(0);
  });

  test('recommends WAIT for high-risk trades', () => {
    const risk = SecurityHelper.analyzeMEVRisk({
      amountIn: 50,
      volatility: 8,
      liquidity: 50000,
    });
    expect(risk.recommendation).toBe('WAIT');
  });

  test('recommends PROCEED for low-risk trades', () => {
    const risk = SecurityHelper.analyzeMEVRisk({
      amountIn: 1,
      volatility: 2,
      liquidity: 5000000,
    });
    expect(risk.recommendation).toBe('PROCEED');
  });
});
