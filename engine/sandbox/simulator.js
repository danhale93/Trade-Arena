/**
 * Strategy Sandbox Simulator
 * Runs micro-simulations of trading strategies for testing and validation
 */

const { ethers } = require('ethers');
const axios = require('axios');

/**
 * Simulates a trading strategy over a specified number of trades
 * @param {string} strategyCode - JavaScript function code for the strategy
 * @param {string} marketPair - Trading pair (e.g., 'ETH/USDC')
 * @param {string} timeframe - Candle timeframe (e.g., '1h', '4h', '1d')
 * @param {number} tradeCount - Number of trades to simulate (default 10)
 * @returns {Object} Simulation results including win rate, P&L, drawdown, etc.
 */
async function simulateStrategy(strategyCode, marketPair, timeframe, tradeCount = 10) {
  try {
    // Validate inputs
    if (!strategyCode || typeof strategyCode !== 'string') {
      throw new Error('Invalid strategy code provided');
    }
    
    if (!marketPair || typeof marketPair !== 'string') {
      throw new Error('Invalid market pair provided');
    }
    
    if (!timeframe || typeof timeframe !== 'string') {
      throw new Error('Invalid timeframe provided');
    }
    
    if (typeof tradeCount !== 'number' || tradeCount <= 0 || tradeCount > 100) {
      throw new Error('Trade count must be a number between 1 and 100');
    }

    // Fetch historical market data for simulation
    const marketData = await fetchMarketData(marketPair, timeframe, tradeCount * 5); // Get extra data for indicators
    
    if (!marketData || marketData.length < tradeCount) {
      throw new Error('Insufficient market data for simulation');
    }

    // Create strategy function from code
    let strategyFn;
    try {
      // Wrap the strategy code in a function that receives market data and returns trade decision
      const strategyFunction = new Function('marketData', 'index', `
        ${strategyCode}
        return { action, confidence, size };
      `);
      strategyFn = strategyFunction;
    } catch (error) {
      throw new Error(`Invalid strategy code: ${error.message}`);
    }

    // Run simulation
    const trades = [];
    const startingEquity = (typeof window !== 'undefined' && window.balance) ? window.balance : 0;
    let equity = startingEquity; // Starting equity in USD
    let peakEquity = equity;
    let maxDrawdown = 0;
    
    for (let i = 0; i < tradeCount && i < marketData.length - 1; i++) {
      const currentData = marketData.slice(0, i + 1); // Provide historical data up to current point
      const currentPrice = marketData[i].close;
      const nextPrice = marketData[i + 1].open; // Simulate entering at next open
      
      try {
        // Get strategy decision
        const decision = strategyFn(currentData, i);
        
        // Validate decision
        if (!decision || typeof decision !== 'object') {
          throw new Error('Strategy must return an object with action, confidence, and size');
        }
        
        const { action, confidence, size } = decision;
        
        // Skip if no action or invalid confidence
        if (!action || (action !== 'BUY' && action !== 'SELL') || 
            typeof confidence !== 'number' || confidence < 0 || confidence > 1 ||
            typeof size !== 'number' || size <= 0 || size > 1) {
          continue;
        }
        
        // Calculate trade outcome
        const priceChange = (nextPrice - currentPrice) / currentPrice;
        let pnlPercent = 0;
        
        if (action === 'BUY') {
          pnlPercent = priceChange;
        } else if (action === 'SELL') {
          pnlPercent = -priceChange; // Inverse for short
        }
        
        // Apply confidence and position sizing
        const tradePnl = equity * (pnlPercent * size * confidence);
        equity += tradePnl;
        
        // Update drawdown
        if (equity > peakEquity) {
          peakEquity = equity;
        }
        const currentDrawdown = (peakEquity - equity) / peakEquity;
        if (currentDrawdown > maxDrawdown) {
          maxDrawdown = currentDrawdown;
        }
        
        // Record trade
        trades.push({
          timestamp: marketData[i].timestamp,
          action,
          confidence: Number(confidence.toFixed(2)),
          size: Number(size.toFixed(2)),
          entryPrice: Number(currentPrice.toFixed(4)),
          exitPrice: Number(nextPrice.toFixed(4)),
          pnl: Number(tradePnl.toFixed(2)),
          pnlPercent: Number((pnlPercent * 100).toFixed(2)),
          equity: Number(equity.toFixed(2))
        });
      } catch (strategyError) {
        // Continue simulation even if strategy fails on a particular candle
        console.warn(`Strategy error at index ${i}:`, strategyError.message);
        continue;
      }
    }

    // Calculate performance metrics
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl <= 0);
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
    
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const avgWin = winningTrades.length > 0 ? 
      winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? 
      losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length : 0;
    
    const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;
    const volatility = calculateVolatility(trades);
    
    return {
      success: true,
      metrics: {
        winRate: Number(winRate.toFixed(2)),
        totalPnl: Number(totalPnl.toFixed(2)),
        returnPercent: Number(((equity - startingEquity) / startingEquity * 100).toFixed(2)),
        maxDrawdown: Number((maxDrawdown * 100).toFixed(2)),
        profitFactor: Number(profitFactor.toFixed(2)),
        volatility: Number(volatility.toFixed(2)),
        sharpeRatio: calculateSharpeRatio(trades),
        totalTrades: trades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        avgWin: Number(avgWin.toFixed(2)),
        avgLoss: Number(avgLoss.toFixed(2))
      },
      trades: trades,
      equityCurve: trades.map(t => t.equity)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Unknown error during simulation'
    };
  }
}

/**
 * Fetches market data for simulation
 * @param {string} marketPair - Trading pair (e.g., 'ETH/USDC')
 * @param {string} timeframe - Candle timeframe
 * @param {number} limit - Number of candles to fetch
 * @returns {Array} Market data array
 */
async function fetchMarketData(marketPair, timeframe, limit = 50) {
  try {
    // Convert pair format for API
    const [base, quote] = marketPair.split('/');
    const symbol = `${base.toLowerCase()}${quote.toLowerCase()}`;
    
    // Map timeframe to CoinGecko interval
    const intervalMap = {
      '1m': '1',
      '5m': '5',
      '15m': '15',
      '30m': '30',
      '1h': '60',
      '4h': '240',
      '1d': '1D'
    };
    
    const interval = intervalMap[timeframe] || '60'; // Default to 1h
    
    // Fetch from CoinGecko
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${base.toLowerCase()}/ohlc`,
      {
        params: {
          vs_currency: quote.toLowerCase(),
          days: Math.min(limit / (interval === '1D' ? 1 : 24 / parseInt(interval)), 90)
        }
      }
    );
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid market data received');
    }
    
    // Convert OHLC data to our format
    return response.data.slice(-limit).map(candle => ({
      timestamp: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4]
    }));
  } catch (error) {
    // Fallback to mock data if API fails
    return generateMockMarketData(marketPair, timeframe, limit);
  }
}

/**
 * Generates mock market data for simulation when API is unavailable
 * @param {string} marketPair - Trading pair
 * @param {string} timeframe - Candle timeframe
 * @param {number} limit - Number of candles to generate
 * @returns {Array} Mock market data
 */
function generateMockMarketData(marketPair, timeframe, limit) {
  const [base] = marketPair.split('/');
  const basePrice = base === 'ETH' ? 2500 : base === 'BTC' ? 45000 : 100;
  
  const data = [];
  let price = basePrice;
  const now = Date.now();
  
  // Timeframe to milliseconds mapping
  const tfMs = {
    '1m': 60000,
    '5m': 300000,
    '15m': 900000,
    '30m': 1800000,
    '1h': 3600000,
    '4h': 14400000,
    '1d': 86400000
  };
  
  const step = tfMs[timeframe] || 3600000; // Default 1h
  
  for (let i = 0; i < limit; i++) {
    const timestamp = now - ((limit - i - 1) * step);
    const volatility = 0.02; // 2% volatility
    const change = (Math.random() - 0.5) * volatility * 2;
    price = price * (1 + change);
    
    const high = price * (1 + Math.random() * 0.01);
    const low = price * (1 - Math.random() * 0.01);
    const open = price * (1 + (Math.random() - 0.5) * 0.005);
    const close = price * (1 + (Math.random() - 0.5) * 0.005);
    
    data.push({
      timestamp,
      open: Number(open.toFixed(4)),
      high: Number(high.toFixed(4)),
      low: Number(low.toFixed(4)),
      close: Number(close.toFixed(4))
    });
    
    price = close; // Use close as base for next candle
  }
  
  return data;
}

/**
 * Calculates volatility from trade results
 * @param {Array} trades - Array of trade objects
 * @returns {number} Volatility percentage
 */
function calculateVolatility(trades) {
  if (trades.length < 2) return 0;
  const startingEquity = (typeof window !== 'undefined' && window.balance) ? window.balance : 0;
  const returns = trades.map(t => t.pnl / startingEquity); // Normalize by starting equity
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * 100 * Math.sqrt(252); // Annualized
}

/**
 * Calculates Sharpe ratio from trade results
 * @param {Array} trades - Array of trade objects
 * @returns {number} Sharpe ratio
 */
function calculateSharpeRatio(trades) {
  if (trades.length < 2) return 0;
  const startingEquity = (typeof window !== 'undefined' && window.balance) ? window.balance : 0;
  const returns = trades.map(t => t.pnl / startingEquity); // Normalize by starting equity
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  if (mean === 0) return 0;
  
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  
  // Assuming risk-free rate of 0% for simplicity
  return (mean / stdDev) * Math.sqrt(252); // Annualized
}

module.exports = {
  simulateStrategy
};