/**
 * REGIME CLASSIFIER - Transparent Market Regime Detection
 * 
 * Classifies market as BULL | BEAR | CHOP using transparent rules:
 * - RSI(14) - Relative Strength Index
 * - ATR-like volatility from 5m candles
 * - 4h return, 24h return
 * 
 * @version 1.0.0
 * @date 2025-01-15
 */

export type RegimeType = 'BULL' | 'BEAR' | 'CHOP';

export interface RegimeInput {
  prices: number[];      // Recent prices (5m candles)
  volumes: number[];      // Volumes
  now: number;          // Current timestamp (ms)
  timestamp: number;   // Candle timestamp
}

export interface RegimeOutput {
  regime: RegimeType;
  classification: RegimeDetails;
  confidence: number;
}

export interface RegimeDetails {
  // Inputs (all printed for auditability)
  return4h: number;       // 4-hour return %
  return24h: number;       // 24-hour return %
  rsi14: number;           // RSI(14)
  atrPercent: number;       // ATR as % of price
  volumeAvg: number;       // Average volume
  volumeCurrent: number;   // Current volume
  volatility: number;    // Volatility metric
  
  // Thresholds used
  bull4hThreshold: number;
  bull24hThreshold: number;
  bear4hThreshold: number;
  bear24hThreshold: number;
  
  // Debug info
  ruleApplied: string;
  timestamp: number;
}

// Threshold constants
const REGIME_THRESHOLDS = {
  BULL: {
    return4h: +1.5,    // > +1.5% in 4h
    return24h: +2.0,   // > +2% in 24h
  },
  BEAR: {
    return4h: -1.5,     // < -1.5% in 4h
    return24h: -2.0,     // < -2% in 24h
  },
  CHOP: {
    // Everything else is CHOP
  },
};

/**
 * Calculate RSI(14) - Relative Strength Index
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50; // Neutral if not enough data
  }
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial averages
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  if (avgGain === 0) return 0;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.max(0, Math.min(100, rsi));
}

/**
 * Calculate ATR-like volatility from prices
 * ATR = Average True Range as % of price
 * ⚡ Bolt Optimization: Uses single-pass O(1) space loop on last 14 periods to completely eliminate array allocation and slice/reduce overhead.
 */
function calculateATRPercent(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const start = Math.max(1, prices.length - 14);
  const count = prices.length - start;
  
  let trSum = 0;
  for (let i = start; i < prices.length; i++) {
    trSum += Math.abs(prices[i] - prices[i - 1]);
  }
  
  const avgTR = trSum / count;
  const currentPrice = prices[prices.length - 1];
  
  return (avgTR / currentPrice) * 100;
}

/**
 * Calculate return over time period
 */
function calculateReturn(prices: number[], periods: number): number {
  if (prices.length < periods + 1) return 0;
  
  const startPrice = prices[prices.length - periods - 1];
  const endPrice = prices[prices.length - 1];
  
  if (startPrice === 0) return 0;
  
  return ((endPrice - startPrice) / startPrice) * 100;
}

/**
 * Calculate average volume
 * ⚡ Bolt Optimization: Uses single-pass O(1) space loop on last 24 periods to avoid intermediate array slicing/reduce allocations.
 */
function calculateVolumeAvg(volumes: number[]): number {
  if (volumes.length === 0) return 0;
  
  const start = Math.max(0, volumes.length - 24);
  const count = volumes.length - start;

  let sum = 0;
  for (let i = start; i < volumes.length; i++) {
    sum += volumes[i];
  }
  return sum / count;
}

/**
 * Calculate volatility metric (std deviation of returns)
 * ⚡ Bolt Optimization: Completely eliminates O(N) array allocation for returns, slice(-20), .map(), and double-reduces.
 * Runs in exactly O(1) auxiliary space with single-pass and manual accumulation loops.
 */
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const start = Math.max(1, prices.length - 20);
  const count = prices.length - start;

  let sum = 0;
  for (let i = start; i < prices.length; i++) {
    sum += (prices[i] - prices[i - 1]) / prices[i - 1];
  }
  const mean = sum / count;
  
  let sumSquaredDiffs = 0;
  for (let i = start; i < prices.length; i++) {
    const ret = (prices[i] - prices[i - 1]) / prices[i - 1];
    sumSquaredDiffs += (ret - mean) * (ret - mean);
  }
  const variance = sumSquaredDiffs / count;
  
  return Math.sqrt(variance) * 100;
}

/**
 * Detect market regime from prices and volumes
 * 
 * Transparent rules (no ML):
 * - BULL: 4h return > +1.5% AND 24h return > +2% AND vol not extreme
 * - BEAR: 4h return < -1.5% AND 24h return < -2%
 * - CHOP: otherwise
 */
export function detectRegime(
  prices: number[], 
  volumes: number[], 
  now: number
): RegimeOutput {
  // Need at least 288 5m candles (24h) for full calculation
  const minCandles = 288;
  
  if (prices.length < minCandles) {
    // Not enough data - return CHOP as default
    return {
      regime: 'CHOP',
      classification: {
        return4h: 0,
        return24h: 0,
        rsi14: 50,
        atrPercent: 0,
        volumeAvg: 0,
        volumeCurrent: 0,
        volatility: 0,
        bull4hThreshold: REGIME_THRESHOLDS.BULL.return4h,
        bull24hThreshold: REGIME_THRESHOLDS.BULL.return24h,
        bear4hThreshold: REGIME_THRESHOLDS.BEAR.return4h,
        bear24hThreshold: REGIME_THRESHOLDS.BEAR.return24h,
        ruleApplied: 'INSUFFICIENT_DATA',
        timestamp: now,
      },
      confidence: 0.5,
    };
  }
  
  // Calculate all inputs
  // 4h = 48 5m candles, 24h = 288 5m candles
  const return4h = calculateReturn(prices, 48);
  const return24h = calculateReturn(prices, 288);
  const rsi14 = calculateRSI(prices, 14);
  const atrPercent = calculateATRPercent(prices);
  const volumeAvg = calculateVolumeAvg(volumes);
  const volumeCurrent = volumes[volumes.length - 1];
  const volatility = calculateVolatility(prices);
  
  // Check for extreme volatility (ATR > 5% is extreme)
  const isExtremeVol = atrPercent > 5;
  
  // Apply transparent rules
  let regime: RegimeType;
  let ruleApplied: string;
  let confidence: number;
  
  // BULL: positive returns + not extreme volatility
  if (return4h > REGIME_THRESHOLDS.BULL.return4h && 
      return24h > REGIME_THRESHOLDS.BULL.return24h &&
      !isExtremeVol) {
    regime = 'BULL';
    ruleApplied = `4h return ${return4h.toFixed(2)}% > +1.5% AND 24h return ${return24h.toFixed(2)}% > +2% AND ATR ${atrPercent.toFixed(2)}% not extreme`;
    confidence = Math.min(0.9, 0.5 + (Math.abs(return4h) / 10) + (Math.abs(return24h) / 10));
  }
  // BEAR: negative returns
  else if (return4h < REGIME_THRESHOLDS.BEAR.return4h && 
           return24h < REGIME_THRESHOLDS.BEAR.return24h) {
    regime = 'BEAR';
    ruleApplied = `4h return ${return4h.toFixed(2)}% < -1.5% AND 24h return ${return24h.toFixed(2)}% < -2%`;
    confidence = Math.min(0.9, 0.5 + (Math.abs(return4h) / 10) + (Math.abs(return24h) / 10));
  }
  // Everything else is CHOP
  else {
    regime = 'CHOP';
    ruleApplied = `Conditions not met for BULL or BEAR - classifying as CHOP`;
    confidence = 0.6;
  }
  
  // Build details object (print ALL inputs for auditability)
  const classification: RegimeDetails = {
    return4h,
    return24h,
    rsi14,
    atrPercent,
    volumeAvg,
    volumeCurrent,
    volatility,
    bull4hThreshold: REGIME_THRESHOLDS.BULL.return4h,
    bull24hThreshold: REGIME_THRESHOLDS.BULL.return24h,
    bear4hThreshold: REGIME_THRESHOLDS.BEAR.return4h,
    bear24hThreshold: REGIME_THRESHOLDS.BEAR.return24h,
    ruleApplied,
    timestamp: now,
  };
  
  return {
    regime,
    classification,
    confidence,
  };
}

/**
 * Get regime emoji
 */
export function getRegimeEmoji(regime: RegimeType): string {
  switch (regime) {
    case 'BULL': return '🐂';
    case 'BEAR': return '🐻';
    case 'CHOP': return '〰️';
  }
}

/**
 * Get regime color
 */
export function getRegimeColor(regime: RegimeType): string {
  switch (regime) {
    case 'BULL': return '#39ff14';
    case 'BEAR': return '#ff2d78';
    case 'CHOP': return '#ffd700';
  }
}

/**
 * Log regime classification (for audit)
 */
export function logRegime(output: RegimeOutput): void {
  const d = output.classification;
  console.log('\n📊 REGIME CLASSIFICATION AUDIT:');
  console.log(`   Regime: ${getRegimeEmoji(output.regime)} ${output.regime}`);
  console.log(`   Confidence: ${(output.confidence * 100).toFixed(1)}%`);
  console.log(`   ────────────────────────────────────────`);
  console.log(`   Inputs:`);
  console.log(`     4h Return:    ${d.return4h.toFixed(2)}%`);
  console.log(`     24h Return:   ${d.return24h.toFixed(2)}%`);
  console.log(`     RSI(14):       ${d.rsi14.toFixed(1)}`);
  console.log(`     ATR:          ${d.atrPercent.toFixed(2)}%`);
  console.log(`     Volatility:   ${d.volatility.toFixed(2)}%`);
  console.log(`   ────────────────────────────────────────`);
  console.log(`   Thresholds:`);
  console.log(`     BULL: 4h > +1.5% AND 24h > +2%`);
  console.log(`     BEAR: 4h < -1.5% AND 24h < -2%`);
  console.log(`   ────────────────────────────────────────`);
  console.log(`   Rule Applied: ${d.ruleApplied}`);
  console.log(`   Timestamp: ${new Date(d.timestamp).toISOString()}`);
}

// Default export
export default {
  detectRegime,
  getRegimeEmoji,
  getRegimeColor,
  logRegime,
  RegimeType,
  RegimeOutput,
  RegimeDetails,
};
