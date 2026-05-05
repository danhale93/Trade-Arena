'use strict';
/**
 * Tests for contract-helpers.js
 *
 * Covers changes introduced in this PR:
 *  - SecurityHelper.isStablecoin() static + instance alias REMOVED
 *  - ArbitrageAnalyzer.calculateArbitrage() gasPrice default changed from 0.05 to 50
 */

const {
  ContractHelper,
  SecurityHelper,
  ArbitrageAnalyzer,
  FlashLoanSimulator,
} = require('./contract-helpers');

// ─────────────────────────────────────────────────────────────────────────────
// SecurityHelper – removed isStablecoin methods (regression guard)
// ─────────────────────────────────────────────────────────────────────────────
describe('SecurityHelper – isStablecoin REMOVED', () => {
  it('should NOT have a static isStablecoin method on SecurityHelper', () => {
    expect(SecurityHelper.isStablecoin).toBeUndefined();
  });

  it('should NOT have an instance isStablecoin method on SecurityHelper', () => {
    const helper = new SecurityHelper();
    expect(typeof helper.isStablecoin).not.toBe('function');
  });

  it('calling SecurityHelper.isStablecoin should throw or be undefined', () => {
    expect(() => {
      // This should throw because the method no longer exists
      if (typeof SecurityHelper.isStablecoin === 'function') {
        SecurityHelper.isStablecoin('USDC');
      } else {
        throw new TypeError('isStablecoin is not a function');
      }
    }).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ContractHelper – isStablecoin instance method still present (not removed)
// ─────────────────────────────────────────────────────────────────────────────
describe('ContractHelper – isStablecoin instance method retained', () => {
  let helper;
  beforeEach(() => {
    // ContractHelper doesn't need real provider/signer for this method
    helper = new ContractHelper(null, null);
  });

  it('should return true for USDC', () => {
    expect(helper.isStablecoin('USDC')).toBe(true);
  });

  it('should return true for USDT', () => {
    expect(helper.isStablecoin('USDT')).toBe(true);
  });

  it('should return true for DAI', () => {
    expect(helper.isStablecoin('DAI')).toBe(true);
  });

  it('should return true for USDbC', () => {
    expect(helper.isStablecoin('USDbC')).toBe(true);
  });

  it('should return true for FRAX', () => {
    expect(helper.isStablecoin('FRAX')).toBe(true);
  });

  it('should return false for ETH (non-stablecoin)', () => {
    expect(helper.isStablecoin('ETH')).toBe(false);
  });

  it('should return false for BTC (non-stablecoin)', () => {
    expect(helper.isStablecoin('BTC')).toBe(false);
  });

  it('should return false for an unknown symbol', () => {
    expect(helper.isStablecoin('UNKNOWN')).toBe(false);
  });

  it('should be case-sensitive (lowercase usdc should return false)', () => {
    // The implementation uses Array.includes() which is case-sensitive
    expect(helper.isStablecoin('usdc')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ArbitrageAnalyzer.calculateArbitrage – gasPrice default changed to 50
// ─────────────────────────────────────────────────────────────────────────────
describe('ArbitrageAnalyzer.calculateArbitrage – new gasPrice default = 50', () => {
  const BUY_PRICE = 2500;  // USD per ETH
  const SELL_PRICE = 2600;
  const AMOUNT_USD = 1000;

  it('default call (gasPrice=50) should match explicit gasPrice=50 call', () => {
    const defaultResult = ArbitrageAnalyzer.calculateArbitrage(BUY_PRICE, SELL_PRICE, AMOUNT_USD);
    const explicitResult = ArbitrageAnalyzer.calculateArbitrage(BUY_PRICE, SELL_PRICE, AMOUNT_USD, 50);
    expect(defaultResult.netProfit).toBe(explicitResult.netProfit);
    expect(defaultResult.totalFees).toBe(explicitResult.totalFees);
    expect(defaultResult.grossProfit).toBe(explicitResult.grossProfit);
    expect(defaultResult.isViable).toBe(explicitResult.isViable);
  });

  it('default gasPrice=50 should produce significantly higher total fees than old default of 0.05', () => {
    // With gasPrice=50:  gasCostUSD = (50 * 150000) / 1e9 * 2500 = $18.75
    // With gasPrice=0.05: gasCostUSD = (0.05 * 150000) / 1e9 * 2500 = $0.01875
    // The gas-cost component is ~1000× higher with the new default.
    // Total fees also include a fixed buy+sell fee of $10, so total-fee ratio is ~2.87×.
    const defaultResult = ArbitrageAnalyzer.calculateArbitrage(BUY_PRICE, SELL_PRICE, AMOUNT_USD);
    const oldDefaultResult = ArbitrageAnalyzer.calculateArbitrage(BUY_PRICE, SELL_PRICE, AMOUNT_USD, 0.05);

    const defaultFees = parseFloat(defaultResult.totalFees);
    const oldDefaultFees = parseFloat(oldDefaultResult.totalFees);

    // New default should produce higher total fees
    expect(defaultFees).toBeGreaterThan(oldDefaultFees);

    // Gas-cost-only comparison: (50 * 150000 / 1e9 * 2500) vs (0.05 * 150000 / 1e9 * 2500)
    const gasCostNew = (50 * 150000) / 1e9 * BUY_PRICE;
    const gasCostOld = (0.05 * 150000) / 1e9 * BUY_PRICE;
    expect(gasCostNew).toBeCloseTo(18.75, 2);
    expect(gasCostOld).toBeCloseTo(0.01875, 4);
    // Gas cost is ~1000× higher with new default
    expect(gasCostNew / gasCostOld).toBeCloseTo(1000, 0);
  });

  it('should correctly compute gas cost with gasPrice=50', () => {
    // gasEstimate=150000 Wei, gasPrice=50 Gwei
    // gasCost = (50 * 150000) / 1e9 = 0.0075 ETH
    // gasCostUSD = 0.0075 * buyPrice(2500) = $18.75
    const result = ArbitrageAnalyzer.calculateArbitrage(BUY_PRICE, SELL_PRICE, AMOUNT_USD, 50);
    // totalFees = buyFee(5) + sellFee(5) + gasCostUSD(18.75) = 28.75
    const expectedGasCostUSD = (50 * 150000) / 1e9 * BUY_PRICE;
    const expectedBuyFee = AMOUNT_USD * 0.005;
    const expectedSellFee = AMOUNT_USD * 0.005;
    const expectedTotalFees = expectedBuyFee + expectedSellFee + expectedGasCostUSD;
    expect(parseFloat(result.totalFees)).toBeCloseTo(expectedTotalFees, 4);
  });

  it('should return isViable=true when net profit is positive', () => {
    // Large price spread to overcome high gas costs
    const result = ArbitrageAnalyzer.calculateArbitrage(2500, 2600, 10000);
    expect(result.isViable).toBe(true);
    expect(parseFloat(result.netProfit)).toBeGreaterThan(0);
  });

  it('should return isViable=false when gas costs exceed gross profit', () => {
    // Very small price difference: buyPrice=2500, sellPrice=2501, amount=10
    // grossProfit = (1) * (10/2500) ≈ $0.004
    // gasCostUSD = (50 * 150000) / 1e9 * 2500 = $18.75 >> $0.004
    const result = ArbitrageAnalyzer.calculateArbitrage(2500, 2501, 10);
    expect(result.isViable).toBe(false);
    expect(parseFloat(result.netProfit)).toBeLessThan(0);
  });

  it('should calculate gross profit correctly', () => {
    // grossProfit = (sellPrice - buyPrice) * (amountUSD / buyPrice)
    // = (2600 - 2500) * (1000 / 2500) = 100 * 0.4 = 40
    const result = ArbitrageAnalyzer.calculateArbitrage(2500, 2600, 1000);
    expect(parseFloat(result.grossProfit)).toBeCloseTo(40.0, 4);
  });

  it('should return profitPercent as a string with 2 decimal places', () => {
    const result = ArbitrageAnalyzer.calculateArbitrage(2500, 2600, 1000);
    expect(typeof result.profitPercent).toBe('string');
    expect(result.profitPercent).toMatch(/^-?\d+\.\d{2}$/);
  });

  it('should handle equal buy and sell prices (no profit)', () => {
    const result = ArbitrageAnalyzer.calculateArbitrage(2500, 2500, 1000);
    expect(result.isViable).toBe(false);
    expect(parseFloat(result.grossProfit)).toBe(0);
    expect(parseFloat(result.netProfit)).toBeLessThan(0);
  });

  it('should handle explicit override gasPrice=0 (zero gas cost)', () => {
    const result = ArbitrageAnalyzer.calculateArbitrage(2500, 2600, 1000, 0);
    // totalFees = only buy + sell fees = 5 + 5 = 10
    // grossProfit = 40, netProfit = 30
    expect(parseFloat(result.totalFees)).toBeCloseTo(10, 4);
    expect(parseFloat(result.netProfit)).toBeCloseTo(30, 4);
    expect(result.isViable).toBe(true);
  });

  it('should handle large amounts with high gas price (viability driven by amount)', () => {
    // With a very large trade amount, the % fees stay constant but gas is fixed
    const smallResult = ArbitrageAnalyzer.calculateArbitrage(2500, 2550, 100);
    const largeResult = ArbitrageAnalyzer.calculateArbitrage(2500, 2550, 100000);
    // Large trade should be more viable due to fixed gas overhead
    expect(parseFloat(largeResult.netProfit)).toBeGreaterThan(parseFloat(smallResult.netProfit));
  });

  it('result object should have all required properties', () => {
    const result = ArbitrageAnalyzer.calculateArbitrage(2500, 2600, 1000);
    expect(result).toHaveProperty('grossProfit');
    expect(result).toHaveProperty('totalFees');
    expect(result).toHaveProperty('netProfit');
    expect(result).toHaveProperty('profitPercent');
    expect(result).toHaveProperty('isViable');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SecurityHelper – remaining static methods (unchanged, verify they still work)
// ─────────────────────────────────────────────────────────────────────────────
describe('SecurityHelper – analyzeMEVRisk (unchanged)', () => {
  it('should flag large swap amounts', () => {
    const risk = SecurityHelper.analyzeMEVRisk({ amountIn: 20, volatility: 2, liquidity: 5000000 });
    expect(risk.riskScore).toBeGreaterThan(0);
    expect(risk.warnings).toContain('Large swap amount - higher MEV risk');
  });

  it('should recommend WAIT when risk score > 50', () => {
    const risk = SecurityHelper.analyzeMEVRisk({ amountIn: 50, volatility: 8, liquidity: 50000 });
    expect(risk.recommendation).toBe('WAIT');
  });

  it('should recommend PROCEED for low-risk swaps', () => {
    const risk = SecurityHelper.analyzeMEVRisk({ amountIn: 1, volatility: 2, liquidity: 5000000 });
    expect(risk.recommendation).toBe('PROCEED');
  });

  it('riskScore should not exceed 100', () => {
    // All three risk factors maxed
    const risk = SecurityHelper.analyzeMEVRisk({ amountIn: 100, volatility: 10, liquidity: 1000 });
    expect(risk.riskScore).toBeLessThanOrEqual(100);
  });

  it('should include low-liquidity warning', () => {
    const risk = SecurityHelper.analyzeMEVRisk({ amountIn: 1, volatility: 2, liquidity: 50000 });
    expect(risk.warnings).toContain('Low liquidity pool - execution risk');
  });
});

describe('SecurityHelper – estimateSlippage (unchanged)', () => {
  it('should return a slippage value between 0.1 and 10', () => {
    const slippage = SecurityHelper.estimateSlippage(10, 1000000, 3);
    expect(slippage).toBeGreaterThanOrEqual(0.1);
    expect(slippage).toBeLessThanOrEqual(10);
  });

  it('should increase slippage with larger amounts', () => {
    const small = SecurityHelper.estimateSlippage(1, 1000000, 3);
    const large = SecurityHelper.estimateSlippage(1000, 1000000, 3);
    expect(large).toBeGreaterThan(small);
  });

  it('should increase slippage with lower liquidity', () => {
    const highLiq = SecurityHelper.estimateSlippage(10, 10000000, 3);
    const lowLiq = SecurityHelper.estimateSlippage(10, 100000, 3);
    expect(lowLiq).toBeGreaterThan(highLiq);
  });
});

describe('SecurityHelper – validateContractInteraction (unchanged)', () => {
  it('should validate a well-formed contract address', () => {
    const result = SecurityHelper.validateContractInteraction(
      '0x4200000000000000000000000000000000000006',
      'transfer',
      []
    );
    expect(result.valid).toBe(true);
  });

  it('should reject an invalid (non-hex) address', () => {
    const result = SecurityHelper.validateContractInteraction('not-an-address', 'transfer', []);
    expect(result.valid).toBe(false);
    expect(result.details.isValidAddress).toBe(false);
  });

  it('should reject a missing method name', () => {
    const result = SecurityHelper.validateContractInteraction(
      '0x4200000000000000000000000000000000000006',
      '',
      []
    );
    expect(result.valid).toBe(false);
    expect(result.details.methodExists).toBe(false);
  });

  it('should reject non-array params', () => {
    const result = SecurityHelper.validateContractInteraction(
      '0x4200000000000000000000000000000000000006',
      'transfer',
      'not-an-array'
    );
    expect(result.valid).toBe(false);
    expect(result.details.paramsValid).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ArbitrageAnalyzer.findTriangularArbitrage (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
describe('ArbitrageAnalyzer.findTriangularArbitrage', () => {
  it('should detect a triangular arbitrage opportunity', () => {
    const prices = {
      'ETH/USD': 2500,
      'USD/USDC': 1,
      'USDC/ETH': 0.000401, // product > 1
    };
    const result = ArbitrageAnalyzer.findTriangularArbitrage(prices);
    expect(result.opportunity).toBe(true);
    expect(parseFloat(result.profitPercent)).toBeGreaterThan(0);
  });

  it('should report no opportunity when product <= 1', () => {
    const prices = {
      'ETH/USD': 2500,
      'USD/USDC': 1,
      'USDC/ETH': 0.0003, // product < 1
    };
    const result = ArbitrageAnalyzer.findTriangularArbitrage(prices);
    expect(result.opportunity).toBe(false);
  });

  it('should return the path as an array of pair names', () => {
    const prices = { 'ETH/USD': 2500, 'USD/USDC': 1, 'USDC/ETH': 0.0004 };
    const result = ArbitrageAnalyzer.findTriangularArbitrage(prices);
    expect(Array.isArray(result.path)).toBe(true);
    expect(result.path).toHaveLength(3);
  });
});