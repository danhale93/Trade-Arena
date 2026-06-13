/**
 * Binance Exchange Integration
 * Provides unified interface for Binance exchange operations
 */

const ccxt = require('ccxt');

class BinanceExchange {
  constructor(options = {}) {
    this.exchange = new ccxt.binance({
      apiKey: options.apiKey || '',
      secret: options.secret || '',
      enableRateLimit: true,
      options: {
        defaultType: 'spot' // spot, future, margin
      }
    });
  }

  /**
   * Fetch ticker for a symbol
   * @param {string} symbol - Trading pair symbol (e.g., 'ETH/USDC')
   * @returns {Promise<Object>} Ticker data
   */
  async fetchTicker(symbol) {
    try {
      const ticker = await this.exchange.fetchTicker(symbol);
      return {
        symbol: ticker.symbol,
        bid: ticker.bid,
        ask: ticker.ask,
        last: ticker.last,
        baseVolume: ticker.baseVolume,
        quoteVolume: ticker.quoteVolume,
        timestamp: ticker.timestamp,
        datetime: ticker.datetime
      };
    } catch (error) {
      throw new Error(`Binance fetchTicker error: ${error.message}`);
    }
  }

  /**
   * Place an order
   * @param {Object} order - Order details
   * @param {string} order.symbol - Trading pair
   * @param {string} order.type - Order type (market, limit)
   * @param {string} order.side - Order side (buy, sell)
   * @param {number} order.amount - Order amount
   * @param {number} order.price - Order price (for limit orders)
   * @returns {Promise<Object>} Order result
   */
  async placeOrder(order) {
    try {
      const params = {};
      if (order.price && order.type === 'limit') {
        params.price = order.price;
      }
      
      const result = await this.exchange.createOrder(
        order.symbol,
        order.type,
        order.side,
        order.amount,
        order.price || undefined,
        params
      );
      
      return {
        id: result.id,
        symbol: result.symbol,
        type: result.type,
        side: result.side,
        amount: result.amount,
        price: result.price,
        status: result.status,
        timestamp: result.timestamp,
        datetime: result.datetime
      };
    } catch (error) {
      throw new Error(`Binance placeOrder error: ${error.message}`);
    }
  }

  /**
   * Fetch balance for account
   * @returns {Promise<Object>} Balance data
   */
  async fetchBalance() {
    try {
      const balance = await this.exchange.fetchBalance();
      return {
        total: balance.total,
        free: balance.free,
        used: balance.used,
        timestamp: balance.timestamp,
        datetime: balance.datetime
      };
    } catch (error) {
      throw new Error(`Binance fetchBalance error: ${error.message}`);
    }
  }

  /**
   * Fetch OHLCV candles
   * @param {string} symbol - Trading pair symbol
   * @param {string} timeframe - Candle timeframe (1m, 5m, 1h, etc.)
   * @param {number} limit - Number of candles to fetch
   * @param {number} since - Timestamp in ms for start time
   * @returns {Promise<Array>} OHLCV data
   */
  async fetchOHLCV(symbol, timeframe = '1h', limit = 100, since) {
    try {
      const ohlcv = await this.exchange.fetchOHLCV(symbol, timeframe, since, limit);
      return ohlcv.map(candle => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));
    } catch (error) {
      throw new Error(`Binance fetchOHLCV error: ${error.message}`);
    }
  }
}

module.exports = BinanceExchange;