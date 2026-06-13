/**
 * Simple Moving Average Crossover Strategy
 * A basic trend-following strategy that generates buy signals when short MA crosses above long MA
 * and sell signals when short MA crosses below long MA
 */

const info = {
  name: 'SMA Crossover',
  description: 'Simple Moving Average Crossover strategy - BUY when short MA > long MA, SELL when short MA < long MA',
  version: '1.0.0',
  author: 'Trade Arena Team',
  parameters: {
    shortPeriod: { type: 'number', default: 10, min: 1, max: 50 },
    longPeriod: { type: 'number', default: 30, min: 5, max: 100 }
  }
};

/**
 * Calculate Simple Moving Average
 * @param {Array} data - Array of candle objects with close prices
 * @param {number} period - MA period
 * @returns {number} SMA value
 */
function calculateSMA(data, period) {
  if (!data || data.length < period) return null;
  
  const closes = data.slice(-period).map(candle => candle.close);
  const sum = closes.reduce((acc, price) => acc + price, 0);
  return sum / period;
}

/**
 * Execute the strategy
 * @param {Array} marketData - Historical market data (candles)
 * @param {Object} params - Strategy parameters
 * @returns {Object} Trading signal
 */
async function execute(marketData, params = {}) {
  // Set default parameters
  const shortPeriod = params.shortPeriod || info.parameters.shortPeriod.default;
  const longPeriod = params.longPeriod || info.parameters.longPeriod.default;
  
  // Validate parameters
  if (shortPeriod >= longPeriod) {
    throw new Error('Short period must be less than long period');
  }
  
  // Need enough data for both MAs
  if (!marketData || marketData.length < longPeriod) {
    return {
      signal: 'HOLD',
      confidence: 0,
      size: 0,
      reason: 'Insufficient data for calculation'
    };
  }
  
  // Calculate moving averages
  const smaShort = calculateSMA(marketData, shortPeriod);
  const smaLong = calculateSMA(marketData, longPeriod);
  
  if (smaShort === null || smaLong === null) {
    return {
      signal: 'HOLD',
      confidence: 0,
      size: 0,
      reason: 'Unable to calculate moving averages'
    };
  }
  
  // Generate signal based on crossover
  let signal = 'HOLD';
  let confidence = 0.5;
  let size = 0.1;
  
  const maDifference = smaShort - smaLong;
  const maRatio = Math.abs(maDifference) / ((smaShort + smaLong) / 2);
  
  // Calculate confidence based on separation of MAs (higher separation = higher confidence)
  // Max confidence when separation is 5% or more
  confidence = Math.min(0.9, 0.5 + Math.min(maRatio * 10, 0.4));
  
  // Position size based on confidence
  size = 0.1 + (confidence - 0.5) * 0.2; // 0.1 to 0.2 range
  
  if (smaShort > smaLong) {
    signal = 'BUY';
  } else if (smaShort < smaLong) {
    signal = 'SELL';
  }
  
  return {
    signal,
    confidence: Number(confidence.toFixed(3)),
    size: Number(size.toFixed(3)),
    reason: `SMA(${shortPeriod}): ${smaShort.toFixed(4)}, SMA(${longPeriod}): ${smaLong.toFixed(4)}`,
    metadata: {
      smaShort,
      smaLong,
      shortPeriod,
      longPeriod
    }
  };
}

// Export strategy
module.exports = {
  info,
  execute
};