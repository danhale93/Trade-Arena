/**
 * Relative Strength Index (RSI) Strategy
 * A momentum oscillator strategy that generates buy signals when RSI is oversold (< 30) 
 * and sell signals when RSI is overbought (> 70)
 */

const info = {
  name: 'RSI Strategy',
  description: 'Relative Strength Index strategy - BUY when RSI < 30 (oversold), SELL when RSI > 70 (overbought)',
  version: '1.0.0',
  author: 'Trade Arena Team',
  parameters: {
    rsiPeriod: { type: 'number', default: 14, min: 2, max: 50 },
    oversold: { type: 'number', default: 30, min: 1, max: 50 },
    overbought: { type: 'number', default: 70, min: 50, max: 99 }
  }
};

/**
 * Calculate Relative Strength Index
 * @param {Array} data - Array of candle objects with close prices
 * @param {number} period - RSI period
 * @returns {number} RSI value (0-100)
 */
function calculateRSI(data, period) {
  if (!data || data.length < period + 1) return null;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i].close - data[i-1].close;
    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Execute the strategy
 * @param {Array} marketData - Historical market data (candles)
 * @param {Object} params - Strategy parameters
 * @returns {Object} Trading signal
 */
async function execute(marketData, params = {}) {
  // Set default parameters
  const rsiPeriod = params.rsiPeriod || info.parameters.rsiPeriod.default;
  const oversold = params.oversold || info.parameters.oversold.default;
  const overbought = params.overbought || info.parameters.overbought.default;
  
  // Validate parameters
  if (oversold >= overbought) {
    throw new Error('Oversold threshold must be less than overbought threshold');
  }
  
  // Need enough data for RSI calculation
  if (!marketData || marketData.length < rsiPeriod + 1) {
    return {
      signal: 'HOLD',
      confidence: 0,
      size: 0,
      reason: 'Insufficient data for RSI calculation'
    };
  }
  
  // Calculate RSI
  const rsi = calculateRSI(marketData, rsiPeriod);
  
  if (rsi === null) {
    return {
      signal: 'HOLD',
      confidence: 0,
      size: 0,
      reason: 'Unable to calculate RSI'
    };
  }
  
  // Generate signal based on RSI levels
  let signal = 'HOLD';
  let confidence = 0.5;
  let size = 0.1;
  
  if (rsi < oversold) {
    signal = 'BUY';
    // Confidence increases as RSI goes further below oversold threshold
    const distance = (oversold - rsi) / oversold;
    confidence = Math.min(0.9, 0.6 + distance * 0.3);
    size = 0.1 + (confidence - 0.5) * 0.2;
  } else if (rsi > overbought) {
    signal = 'SELL';
    // Confidence increases as RSI goes further above overbought threshold
    const distance = (rsi - overbought) / (100 - overbought);
    confidence = Math.min(0.9, 0.6 + distance * 0.3);
    size = 0.1 + (confidence - 0.5) * 0.2;
  }
  
  return {
    signal,
    confidence: Number(confidence.toFixed(3)),
    size: Number(size.toFixed(3)),
    reason: `RSI(${rsiPeriod}): ${rsi.toFixed(2)} [Oversold: ${oversold}, Overbought: ${overbought}]`,
    metadata: {
      rsi,
      rsiPeriod,
      oversold,
      overbought
    }
  };
}

// Export strategy
module.exports = {
  info,
  execute
};