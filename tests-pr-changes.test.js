






































































































































































































































    expect(risk.recommendation).toBe('PROCEED');
  });
});

// ════════════════════════════════════════════════════════════
// Additional boundary/regression tests for PR changes
// ════════════════════════════════════════════════════════════

describe('ArbitrageAnalyzer.calculateArbitrage — additional boundary cases', () => {
  // gasPrice change (0.05 → 50) means at the old default gas was negligible;
  // at the new default gas dominates small trades. These tests reinforce that.

  test('gas cost with default gasPrice=50 dominates fees on a small $10 trade', () => {
    // gasCostUSD = (50*150000/1e9) * 2500 = 18.75, trading fees = 0.1
    const result = ArbitrageAnalyzer.calculateArbitrage(2500, 2600, 10);
    const tradingFeesOnly = 10 * 0.005 + 10 * 0.005; // 0.1 USD
    expect(parseFloat(result.totalFees)).toBeGreaterThan(tradingFeesOnly);
  });

  test('profitPercent is negative when netProfit is negative', () => {
    // Small trade, large fees with default gasPrice
    const result = ArbitrageAnalyzer.calculateArbitrage(2500, 2510, 10);
    expect(parseFloat(result.profitPercent)).toBeLessThan(0);
  });

  test('isViable is false with equal buy/sell price regardless of gasPrice', () => {
    const withNewGas = ArbitrageAnalyzer.calculateArbitrage(2000, 2000, 1000, 50);
    const withZeroGas = ArbitrageAnalyzer.calculateArbitrage(2000, 2000, 1000, 0);
    expect(withNewGas.isViable).toBe(false);
    expect(withZeroGas.isViable).toBe(false);
  });

  test('gasPrice=1 Gwei produces gas cost proportional to 1/50 of default', () => {
    const defaultGas = ArbitrageAnalyzer.calculateArbitrage(2500, 2510, 100, 50);
    const oneGwei   = ArbitrageAnalyzer.calculateArbitrage(2500, 2510, 100, 1);
    // Gas component: ratio should be ~50x
    const defaultTotal = parseFloat(defaultGas.totalFees);
    const oneTotal     = parseFloat(oneGwei.totalFees);
    // Trading fees are equal; only gas differs
    const tradingFees = 100 * 0.005 * 2; // 1.0
    const defaultGasCost = defaultTotal - tradingFees;
    const oneGasCost     = oneTotal     - tradingFees;
    expect(defaultGasCost / oneGasCost).toBeCloseTo(50, 0);
  });

  test('very high buyPrice amplifies gas cost in USD', () => {
    // gasCostUSD = (50 * 150000 / 1e9) * buyPrice
    const lowBuyPrice  = ArbitrageAnalyzer.calculateArbitrage(1000, 1010, 100);
    const highBuyPrice = ArbitrageAnalyzer.calculateArbitrage(10000, 10100, 100);
    expect(parseFloat(highBuyPrice.totalFees)).toBeGreaterThan(parseFloat(lowBuyPrice.totalFees));
  });
});

describe('SecurityHelper — isStablecoin removal: additional regression guards', () => {
  test('SecurityHelper.prototype does not have isStablecoin', () => {
    expect(Object.prototype.hasOwnProperty.call(SecurityHelper.prototype, 'isStablecoin')).toBe(false);
  });

  test('new SecurityHelper() instance does not inherit isStablecoin via prototype chain', () => {
    const helper = new SecurityHelper();
    // Walk the prototype chain explicitly
    let proto = Object.getPrototypeOf(helper);
    let found = false;
    while (proto && proto !== Object.prototype) {
      if ('isStablecoin' in proto) { found = true; break; }
      proto = Object.getPrototypeOf(proto);
    }
    expect(found).toBe(false);
  });

  test('SecurityHelper still has the MEV-related methods after isStablecoin removal', () => {
    expect(typeof SecurityHelper.analyzeMEVRisk).toBe('function');
    expect(typeof SecurityHelper.estimateSlippage).toBe('function');
    expect(typeof SecurityHelper.validateContractInteraction).toBe('function');
  });
});
