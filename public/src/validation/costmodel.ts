/**
 * COST MODEL - Full Trading Cost Model
 * 
 * Includes:
 * - $3 flat gas fee
 * - 0.15% slippage
 * - 0.05% spread
 * - 1.5x stress variant for worst-case
 * 
 * @version 1.0.0
 * @date 2025-01-15
 */

export interface CostModelConfig {
  gasFee: number;        // Flat gas fee in USD
  slippagePercent: number;  // Slippage % 
  spreadPercent: number;  // Spread %
  stressMultiplier: number; // Multiplier for stress testing
}

export interface TradeCosts {
  entryCost: number;    // Total cost to enter
  exitCost: number;     // Total cost to exit
  totalCost: number;   // Round-trip total
  gasFee: number;
  slippage: number;
  spread: number;
  isStressTest: boolean;
}

// Default cost model
export const DEFAULT_COST_MODEL: CostModelConfig = {
  gasFee: 3,           // $3 flat gas fee
  slippagePercent: 0.15, // 0.15% slippage
  spreadPercent: 0.05,  // 0.05% spread
  stressMultiplier: 1.0, // Normal (1.0x)
};

// Stress variant (1.5x costs)
export const STRESS_COST_MODEL: CostModelConfig = {
  gasFee: 3 * 1.5,        // $4.50
  slippagePercent: 0.15 * 1.5, // 0.225%
  spreadPercent: 0.05 * 1.5, // 0.075%
  stressMultiplier: 1.5,    // 1.5x stress
};

/**
 * Calculate costs for a trade
 * 
 * @param notional - Trade size in USD
 * @param costModel - Cost model to use
 * @returns TradeCosts breakdown
 */
export function calculateCosts(
  notional: number,
  costModel: CostModelConfig = DEFAULT_COST_MODEL
): TradeCosts {
  const { gasFee, slippagePercent, spreadPercent, stressMultiplier } = costModel;
  
  // Calculate slippage cost
  const slippage = notional * slippagePercent / 100;
  
  // Calculate spread cost (applies to both entry and exit)
  const spread = notional * spreadPercent / 100;
  
  // Gas is flat fee (paid twice - entry + exit)
  const totalGas = gasFee * 2;
  
  // Entry costs: gas + slippage + spread
  const entryCost = gasFee + slippage + spread;
  
  // Exit costs: gas + slippage + spread
  const exitCost = gasFee + slippage + spread;
  
  // Total round-trip cost
  const totalCost = entryCost + exitCost;
  
  return {
    entryCost,
    exitCost,
    totalCost,
    gasFee: totalGas,
    slippage: slippage * 2,
    spread: spread * 2,
    isStressTest: stressMultiplier > 1.0,
  };
}

/**
 * Calculate net P&L after costs
 * 
 * @param grossPnL - P&L before costs
 * @param costs - Calculated costs
 * @returns Net P&L after costs
 */
export function applyCosts(grossPnL: number, costs: TradeCosts): number {
  return grossPnL - costs.totalCost;
}

/**
 * Calculate break-even win rate
 * 
 * Given risk/reward ratio and costs, what win rate is needed?
 * 
 * @param winAmount - Amount won on winners
 * @param lossAmount - Amount lost on losers  
 * @param costsPerTrade - Total round-trip costs
 * @returns Break-even win rate
 */
export function calculateBreakEvenWinRate(
  winAmount: number,
  lossAmount: number,
  costsPerTrade: number
): number {
  // EV = Win% * WinAmt - Loss% * LossAmt - Costs
  // At break-even: Win% * WinAmt = Loss% * LossAmt + Costs
  // Win% = (Loss% * LossAmt + Costs) / WinAmt
  // Let Loss% = 1 - Win%
  // Win% = ((1 - Win%) * LossAmt + Costs) / WinAmt
  // Win% * WinAmt = LossAmt - Win% * LossAmt + Costs
  // Win% * (WinAmt + LossAmt) = LossAmt + Costs
  // Win% = (LossAmt + Costs) / (WinAmt + LossAmt)
  
  const total = winAmount + lossAmount;
  if (total === 0) return 0.5;
  
  return (lossAmount + costsPerTrade) / total;
}

/**
 * Calculate minimum edge needed
 * 
 * Minimum win probability + edge needed to be profitable
 * 
 * @param costs - Trade costs
 * @param notional - Trade size
 * @returns Minimum win probability needed
 */
export function calculateMinEdge(costs: TradeCosts, notional: number): number {
  if (notional === 0) return 0.5;
  
  // Need to cover costs with edge
  // Edge needed = costs / notional
  const edgeNeeded = costs.totalCost / notional;
  
  return edgeNeeded;
}

/**
 * Get cost model summary string
 */
export function getCostModelSummary(costModel: CostModelConfig): string {
  return `$${costModel.gasFee} gas + ${costModel.slippagePercent}% slip + ${costModel.spreadPercent}% spread${costModel.stressMultiplier > 1.0 ? ' (1.5x STRESS)' : ''}`;
}

/**
 * Log cost breakdown
 */
export function logCosts(notional: number, costs: TradeCosts): void {
  console.log('\n💰 COST BREAKDOWN:');
  console.log(`   Notional: $${notional.toFixed(2)}`);
  console.log(`   ─────────────────────────────`);
  console.log(`   Entry Costs:`);
  console.log(`     Gas:      $${costs.entryCost.toFixed(2)} ($${(costs.gasFee / 2).toFixed(2)} × 2)`);
  console.log(`     Slippage: $${(notional * 0.0015).toFixed(2)}`);
  console.log(`     Spread:  $${(notional * 0.0005).toFixed(2)}`);
  console.log(`   ─────────────────────────────`);
  console.log(`   Total Round-Trip: $${costs.totalCost.toFixed(2)}`);
  console.log(`   ${costs.isStressTest ? '⚠️  STRESS TEST (1.5x costs)' : '✅ Normal costs'}`);
}

/**
 * Create cost model from multiplier
 */
export function createCostModel(multiplier: number = 1.0): CostModelConfig {
  if (multiplier === 1.5) {
    return { ...STRESS_COST_MODEL };
  }
  return { 
    ...DEFAULT_COST_MODEL, 
    gasFee: DEFAULT_COST_MODEL.gasFee * multiplier,
    slippagePercent: DEFAULT_COST_MODEL.slippagePercent * multiplier,
    spreadPercent: DEFAULT_COST_MODEL.spreadPercent * multiplier,
    stressMultiplier: multiplier,
  };
}

// Console confirmation
if (typeof window !== 'undefined') {
  console.log('%c✅ Cost Model Loaded', 'color: #39ff14; font-weight: bold;');
  console.log(`   Default: ${getCostModelSummary(DEFAULT_COST_MODEL)}`);
  console.log(`   Stress:  ${getCostModelSummary(STRESS_COST_MODEL)}`);
}

// Default export
export default {
  DEFAULT_COST_MODEL,
  STRESS_COST_MODEL,
  calculateCosts,
  applyCosts,
  calculateBreakEvenWinRate,
  calculateMinEdge,
  getCostModelSummary,
  logCosts,
  createCostModel,
  CostModelConfig,
  TradeCosts,
};
