/**
 * Exchange Router
 * Manages multiple exchange connections and provides unified interface with failover support
 */

const BinanceExchange = require('./binance');
const BybitExchange = require('./bybit');
const OKXExchange = require('./okx');
const KrakenExchange = require('./kraken');

class ExchangeRouter {
  constructor() {
    this.exchanges = {
      binance: new BinanceExchange(),
      bybit: new BybitExchange(),
      okx: new OKXExchange(),
      kraken: new KrakenExchange()
    };
    
    // Exchange priority order (can be configured)
    this.priority = ['binance', 'bybit', 'okx', 'kraken'];
    
    // Track exchange health status
    this.healthStatus = {};
    this.priority.forEach(exchange => {
      this.healthStatus[exchange] = {
        isHealthy: true,
        lastCheck: 0,
        failureCount: 0
      };
    });
    
    // Health check interval (5 minutes)
    this.healthCheckInterval = 5 * 60 * 1000;
    
    // Start health check timer
    this.startHealthChecks();
  }

  /**
   * Start periodic health checks for all exchanges
   */
  startHealthChecks() {
    setInterval(() => {
      this.checkAllExchangesHealth();
    }, this.healthCheckInterval);
    
    // Initial health check
    this.checkAllExchangesHealth();
  }

  /**
   * Check health of all exchanges
   */
  async checkAllExchangesHealth() {
    for (const exchangeName of this.priority) {
      await this.checkExchangeHealth(exchangeName);
    }
  }

  /**
   * Check health of a specific exchange
   * @param {string} exchangeName - Name of exchange to check
   * @returns {Promise<boolean>} Health status
   */
  async checkExchangeHealth(exchangeName) {
    const exchange = this.exchanges[exchangeName];
    if (!exchange) {
      this.healthStatus[exchangeName] = {
        isHealthy: false,
        lastCheck: Date.now(),
        failureCount: this.healthStatus[exchangeName]?.failureCount + 1 || 1
      };
      return false;
    }

    try {
      // Simple health check - fetch ticker for a major pair
      await exchange.fetchTicker('BTC/USDT');
      
      this.healthStatus[exchangeName] = {
        isHealthy: true,
        lastCheck: Date.now(),
        failureCount: 0
      };
      return true;
    } catch (error) {
      console.warn(`Health check failed for ${exchangeName}:`, error.message);
      
      this.healthStatus[exchangeName] = {
        isHealthy: false,
        lastCheck: Date.now(),
        failureCount: (this.healthStatus[exchangeName]?.failureCount || 0) + 1
      };
      return false;
    }
  }

  /**
   * Get the healthiest available exchange
   * @param {string} preferredExchange - Preferred exchange name (optional)
   * @returns {Object} Exchange instance
   */
  getHealthiestExchange(preferredExchange) {
    // If preferred exchange is specified and healthy, use it
    if (preferredExchange && 
        this.exchanges[preferredExchange] && 
        this.healthStatus[preferredExchange]?.isHealthy) {
      return this.exchanges[preferredExchange];
    }

    // Otherwise, go through priority list and return first healthy exchange
    for (const exchangeName of this.priority) {
      if (this.exchanges[exchangeName] && 
          this.healthStatus[exchangeName]?.isHealthy) {
        return this.exchanges[exchangeName];
      }
    }

    // If no exchanges are healthy, return the first one anyway (will likely fail but let caller handle)
    return this.exchanges[this.priority[0]] || null;
  }

  /**
   * Fetch ticker from the best available exchange
   * @param {string} symbol - Trading pair symbol
   * @param {string} preferredExchange - Preferred exchange name (optional)
   * @returns {Promise<Object>} Ticker data
   */
  async fetchTicker(symbol, preferredExchange) {
    let lastError = null;
    
    // Try exchanges in order of preference/health
    const exchangeOrder = [...this.priority];
    if (preferredExchange) {
      // Move preferred exchange to front if it exists
      const index = exchangeOrder.indexOf(preferredExchange);
      if (index > -1) {
        exchangeOrder.splice(index, 1);
        exchangeOrder.unshift(preferredExchange);
      }
    }

    for (const exchangeName of exchangeOrder) {
      const exchange = this.exchanges[exchangeName];
      if (!exchange) continue;

      try {
        const ticker = await exchange.fetchTicker(symbol);
        // Reset failure count on success
        this.healthStatus[exchangeName].failureCount = 0;
        this.healthStatus[exchangeName].isHealthy = true;
        return ticker;
      } catch (error) {
        console.warn(`fetchTicker failed on ${exchangeName}:`, error.message);
        lastError = error;
        
        // Update health status
        this.healthStatus[exchangeName].failureCount += 1;
        if (this.healthStatus[exchangeName].failureCount >= 3) {
          this.healthStatus[exchangeName].isHealthy = false;
        }
        
        // Continue to next exchange
        continue;
      }
    }
    
    // If all exchanges failed, throw the last error
    throw new Error(`All exchanges failed to fetch ticker for ${symbol}. Last error: ${lastError.message}`);
  }

  /**
   * Place an order on the best available exchange
   * @param {Object} order - Order details
   * @param {string} preferredExchange - Preferred exchange name (optional)
   * @returns {Promise<Object>} Order result
   */
  async placeOrder(order, preferredExchange) {
    let lastError = null;
    
    // Try exchanges in order of preference/health
    const exchangeOrder = [...this.priority];
    if (preferredExchange) {
      // Move preferred exchange to front if it exists
      const index = exchangeOrder.indexOf(preferredExchange);
      if (index > -1) {
        exchangeOrder.splice(index, 1);
        exchangeOrder.unshift(preferredExchange);
      }
    }

    for (const exchangeName of exchangeOrder) {
      const exchange = this.exchanges[exchangeName];
      if (!exchange) continue;

      try {
        const result = await exchange.placeOrder(order);
        // Reset failure count on success
        this.healthStatus[exchangeName].failureCount = 0;
        this.healthStatus[exchangeName].isHealthy = true;
        return result;
      } catch (error) {
        console.warn(`placeOrder failed on ${exchangeName}:`, error.message);
        lastError = error;
        
        // Update health status
        this.healthStatus[exchangeName].failureCount += 1;
        if (this.healthStatus[exchangeName].failureCount >= 3) {
          this.healthStatus[exchangeName].isHealthy = false;
        }
        
        // Continue to next exchange
        continue;
      }
    }
    
    // If all exchanges failed, throw the last error
    throw new Error(`All exchanges failed to place order. Last error: ${lastError.message}`);
  }

  /**
   * Fetch balance from the best available exchange
   * @param {string} preferredExchange - Preferred exchange name (optional)
   * @returns {Promise<Object>} Balance data
   */
  async fetchBalance(preferredExchange) {
    let lastError = null;
    
    // Try exchanges in order of preference/health
    const exchangeOrder = [...this.priority];
    if (preferredExchange) {
      // Move preferred exchange to front if it exists
      const index = exchangeOrder.indexOf(preferredExchange);
      if (index > -1) {
        exchangeOrder.splice(index, 1);
        exchangeOrder.unshift(preferredExchange);
      }
    }

    for (const exchangeName of exchangeOrder) {
      const exchange = this.exchanges[exchangeName];
      if (!exchange) continue;

      try {
        const balance = await exchange.fetchBalance();
        // Reset failure count on success
        this.healthStatus[exchangeName].failureCount = 0;
        this.healthStatus[exchangeName].isHealthy = true;
        return balance;
      } catch (error) {
        console.warn(`fetchBalance failed on ${exchangeName}:`, error.message);
        lastError = error;
        
        // Update health status
        this.healthStatus[exchangeName].failureCount += 1;
        if (this.healthStatus[exchangeName].failureCount >= 3) {
          this.healthStatus[exchangeName].isHealthy = false;
        }
        
        // Continue to next exchange
        continue;
      }
    }
    
    // If all exchanges failed, throw the last error
    throw new Error(`All exchanges failed to fetch balance. Last error: ${lastError.message}`);
  }

  /**
   * Fetch OHLCV data from the best available exchange
   * @param {string} symbol - Trading pair symbol
   * @param {string} timeframe - Candle timeframe
   * @param {number} limit - Number of candles
   * @param {number} since - Start timestamp
   * @param {string} preferredExchange - Preferred exchange name (optional)
   * @returns {Promise<Array>} OHLCV data
   */
  async fetchOHLCV(symbol, timeframe = '1h', limit = 100, since, preferredExchange) {
    let lastError = null;
    
    // Try exchanges in order of preference/health
    const exchangeOrder = [...this.priority];
    if (preferredExchange) {
      // Move preferred exchange to front if it exists
      const index = exchangeOrder.indexOf(preferredExchange);
      if (index > -1) {
        exchangeOrder.splice(index, 1);
        exchangeOrder.unshift(preferredExchange);
      }
    }

    for (const exchangeName of exchangeOrder) {
      const exchange = this.exchanges[exchangeName];
      if (!exchange) continue;

      try {
        const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, limit, since);
        // Reset failure count on success
        this.healthStatus[exchangeName].failureCount = 0;
        this.healthStatus[exchangeName].isHealthy = true;
        return ohlcv;
      } catch (error) {
        console.warn(`fetchOHLCV failed on ${exchangeName}:`, error.message);
        lastError = error;
        
        // Update health status
        this.healthStatus[exchangeName].failureCount += 1;
        if (this.healthStatus[exchangeName].failureCount >= 3) {
          this.healthStatus[exchangeName].isHealthy = false;
        }
        
        // Continue to next exchange
        continue;
      }
    }
    
    // If all exchanges failed, throw the last error
    throw new Error(`All exchanges failed to fetch OHLCV for ${symbol}. Last error: ${lastError.message}`);
  }

  /**
   * Get health status of all exchanges
   * @returns {Object} Health status for each exchange
   */
  getHealthStatus() {
    return { ...this.healthStatus };
  }

  /**
   * Configure exchange credentials
   * @param {Object} credentials - Exchange credentials
   */
  configureCredentials(credentials) {
    if (credentials.binance) {
      this.exchanges.binance = new BinanceExchange(credentials.binance);
    }
    if (credentials.bybit) {
      this.exchanges.bybit = new BybitExchange(credentials.bybit);
    }
    if (credentials.okx) {
      this.exchanges.okx = new OKXExchange(credentials.okx);
    }
    if (credentials.kraken) {
      this.exchanges.kraken = new KrakenExchange(credentials.kraken);
    }
  }
}

module.exports = new ExchangeRouter();