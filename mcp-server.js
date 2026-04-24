/**
 * ╔════════════════════════════════════════════════════════════════════════════════╗
 * ║                    TRADE ARENA - MCP SERVER                                    ║
 * ║  Model Context Protocol Server with Trading Tools, Resources & Prompts         ║
 * ╚════════════════════════════════════════════════════════════════════════════════╝
 * 
 * This server implements the Model Context Protocol (MCP) to expose Trade Arena's
 * trading capabilities to AI agents including Claude, GPT, and custom models.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const axios = require('axios');

// ════════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  COINGECKO_API: 'https://api.coingecko.com/api/v3',
  ALPACA_API: process.env.ALPACA_KEY ? 'https://paper-api.alpaca.markets' : null,
  DEFAULT_VS_CURRENCY: 'usd',
  TOP_COINS_LIMIT: 50,
  CACHE_TTL_MS: 30000, // 30 seconds
  MAX_BOTS_PER_USER: 20,
};

// ════════════════════════════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════════

class TradeArenaState {
  constructor() {
    this.bots = new Map();
    this.trades = [];
    this.priceCache = new Map();
    this.cacheTimestamps = new Map();
    this.marketSnapshots = [];
    this.agentPerformance = new Map();
    this.circuitBreakers = {
      globalKill: false,
      maxDrawdownPct: 10,
      gasCeiling: 50,
      aggressionLevel: 8,
    };
  }

  // Bot Management
  createBot(config) {
    const id = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const bot = {
      id,
      name: config.name || `Bot ${this.bots.size + 1}`,
      strategy: config.strategy || 'BALANCED',
      riskLevel: config.riskLevel || 'MODERATE',
      initialCapital: config.initialCapital || 1000,
      active: true,
      createdAt: new Date().toISOString(),
      trades: [],
      totalPnl: 0,
      winRate: 0,
      status: 'ACTIVE',
      autoMode: config.autoMode !== false,
    };
    this.bots.set(id, bot);
    return bot;
  }

  getBot(id) { return this.bots.get(id); }
  getAllBots() { return Array.from(this.bots.values()); }
  deleteBot(id) { return this.bots.delete(id); }

  // Trade Logging
  logTrade(trade) {
    const entry = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...trade,
    };
    this.trades.push(entry);
    
    // Update bot stats if bot trade
    if (trade.botId && this.bots.has(trade.botId)) {
      const bot = this.bots.get(trade.botId);
      bot.trades.push(entry);
      bot.totalPnl += trade.pnl || 0;
      const wins = bot.trades.filter(t => (t.pnl || 0) > 0).length;
      bot.winRate = bot.trades.length > 0 ? (wins / bot.trades.length * 100).toFixed(1) : 0;
    }
    
    return entry;
  }

  getTrades(filters = {}) {
    let result = [...this.trades];
    if (filters.botId) result = result.filter(t => t.botId === filters.botId);
    if (filters.symbol) result = result.filter(t => t.symbol === filters.symbol);
    if (filters.strategy) result = result.filter(t => t.strategy === filters.strategy);
    if (filters.limit) result = result.slice(-filters.limit);
    return result;
  }

  // Price Caching
  getCachedPrice(key) {
    const ts = this.cacheTimestamps.get(key);
    if (ts && Date.now() - ts < CONFIG.CACHE_TTL_MS) {
      return this.priceCache.get(key);
    }
    return null;
  }

  setCachedPrice(key, value) {
    this.priceCache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
  }

  // Market Snapshots
  addMarketSnapshot(data) {
    this.marketSnapshots.push({
      timestamp: new Date().toISOString(),
      data,
    });
    if (this.marketSnapshots.length > 1000) {
      this.marketSnapshots = this.marketSnapshots.slice(-500);
    }
  }

  // Circuit Breakers
  getCircuitStatus() {
    return {
      ...this.circuitBreakers,
      totalBots: this.bots.size,
      activeTrades: this.trades.filter(t => t.status === 'OPEN').length,
      totalTrades: this.trades.length,
    };
  }

  updateCircuitBreakers(updates) {
    Object.assign(this.circuitBreakers, updates);
    return this.circuitBreakers;
  }
}

const state = new TradeArenaState();

// ════════════════════════════════════════════════════════════════════════════════
// EXTERNAL API HELPERS
// ════════════════════════════════════════════════════════════════════════════════

async function fetchCoinGecko(endpoint, params = {}) {
  const url = new URL(`${CONFIG.COINGECKO_API}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const cacheKey = url.toString();
  const cached = state.getCachedPrice(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(url.toString(), { timeout: 10000 });
    state.setCachedPrice(cacheKey, response.data);
    return response.data;
  } catch (error) {
    throw new Error(`CoinGecko API error: ${error.message}`);
  }
}

async function fetchAlpaca(endpoint, options = {}) {
  if (!CONFIG.ALPACA_API) {
    throw new Error('Alpaca API not configured');
  }
  
  const url = `${CONFIG.ALPACA_API}${endpoint}`;
  const headers = {
    'APCA-API-KEY-ID': process.env.ALPACA_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET,
  };

  try {
    const response = await axios({ url, headers, ...options });
    return response.data;
  } catch (error) {
    throw new Error(`Alpaca API error: ${error.message}`);
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════════

const TRADING_TOOLS = [
  {
    name: 'get_market_data',
    description: 'Fetch current market data for cryptocurrencies or stocks',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['crypto', 'stock'],
          description: 'Asset type',
        },
        symbols: {
          type: 'array',
          items: { type: 'string' },
          description: 'Symbols to fetch (e.g., ["bitcoin", "ethereum"] or ["AAPL", "TSLA"])',
        },
        vs_currency: {
          type: 'string',
          default: 'usd',
          description: 'Quote currency',
        },
        include_24h_change: {
          type: 'boolean',
          default: true,
          description: 'Include 24h price change',
        },
      },
      required: ['type', 'symbols'],
    },
  },
  {
    name: 'get_trending_coins',
    description: 'Get trending cryptocurrencies from CoinGecko',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          default: 10,
          description: 'Number of trending coins to return',
        },
      },
    },
  },
  {
    name: 'analyze_opportunity',
    description: 'Analyze a trading opportunity for arbitrage or momentum',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Asset symbol to analyze',
        },
        strategy: {
          type: 'string',
          enum: ['ARBITRAGE', 'MOMENTUM', 'VOLATILITY', 'GRID', 'HYBRID'],
          description: 'Strategy to use for analysis',
        },
        timeframe: {
          type: 'string',
          enum: ['1h', '24h', '7d', '30d'],
          default: '24h',
          description: 'Analysis timeframe',
        },
      },
      required: ['symbol', 'strategy'],
    },
  },
  {
    name: 'create_trading_bot',
    description: 'Create and deploy a new trading bot',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Bot name',
        },
        strategy: {
          type: 'string',
          enum: ['ARBITRAGE', 'MOMENTUM', 'VOLATILITY', 'GRID', 'HYBRID'],
          description: 'Trading strategy',
        },
        riskLevel: {
          type: 'string',
          enum: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'MAX_RISK'],
          default: 'MODERATE',
        },
        initialCapital: {
          type: 'number',
          default: 1000,
          description: 'Initial capital in USD',
        },
        symbols: {
          type: 'array',
          items: { type: 'string' },
          description: 'Symbols to trade',
        },
        autoMode: {
          type: 'boolean',
          default: true,
          description: 'Enable autonomous trading',
        },
      },
      required: ['name', 'strategy'],
    },
  },
  {
    name: 'get_bot_status',
    description: 'Get status of a specific bot or all bots',
    inputSchema: {
      type: 'object',
      properties: {
        botId: {
          type: 'string',
          description: 'Bot ID (omit for all bots)',
        },
      },
    },
  },
  {
    name: 'update_bot',
    description: 'Update bot configuration or control bot (pause/resume/stop)',
    inputSchema: {
      type: 'object',
      properties: {
        botId: {
          type: 'string',
          description: 'Bot ID',
        },
        action: {
          type: 'string',
          enum: ['PAUSE', 'RESUME', 'STOP', 'UPDATE_CONFIG'],
          description: 'Action to perform',
        },
        config: {
          type: 'object',
          description: 'New configuration (for UPDATE_CONFIG)',
        },
      },
      required: ['botId', 'action'],
    },
  },
  {
    name: 'delete_bot',
    description: 'Delete a trading bot',
    inputSchema: {
      type: 'object',
      properties: {
        botId: {
          type: 'string',
          description: 'Bot ID to delete',
        },
      },
      required: ['botId'],
    },
  },
  {
    name: 'execute_trade',
    description: 'Execute a paper or real trade',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading symbol',
        },
        side: {
          type: 'string',
          enum: ['BUY', 'SELL'],
          description: 'Trade side',
        },
        amount: {
          type: 'number',
          description: 'Trade amount in USD',
        },
        type: {
          type: 'string',
          enum: ['MARKET', 'LIMIT'],
          default: 'MARKET',
        },
        botId: {
          type: 'string',
          description: 'Optional bot ID to associate trade with',
        },
        strategy: {
          type: 'string',
          description: 'Strategy used for this trade',
        },
        paper: {
          type: 'boolean',
          default: true,
          description: 'Execute as paper trade',
        },
      },
      required: ['symbol', 'side', 'amount'],
    },
  },
  {
    name: 'get_portfolio',
    description: 'Get current portfolio summary',
    inputSchema: {
      type: 'object',
      properties: {
        includeOpenPositions: {
          type: 'boolean',
          default: true,
        },
        includeTradeHistory: {
          type: 'boolean',
          default: false,
        },
        historyLimit: {
          type: 'number',
          default: 50,
        },
      },
    },
  },
  {
    name: 'get_trade_history',
    description: 'Get filtered trade history with analytics',
    inputSchema: {
      type: 'object',
      properties: {
        botId: {
          type: 'string',
          description: 'Filter by bot ID',
        },
        symbol: {
          type: 'string',
          description: 'Filter by symbol',
        },
        strategy: {
          type: 'string',
          description: 'Filter by strategy',
        },
        limit: {
          type: 'number',
          default: 50,
          description: 'Max trades to return',
        },
        includeAnalytics: {
          type: 'boolean',
          default: true,
          description: 'Include computed analytics',
        },
      },
    },
  },
  {
    name: 'run_backtest',
    description: 'Run a backtest simulation for a strategy',
    inputSchema: {
      type: 'object',
      properties: {
        strategy: {
          type: 'string',
          enum: ['ARBITRAGE', 'MOMENTUM', 'VOLATILITY', 'GRID', 'HYBRID'],
          description: 'Strategy to backtest',
        },
        symbol: {
          type: 'string',
          description: 'Symbol to backtest on',
        },
        days: {
          type: 'number',
          default: 30,
          description: 'Number of days to simulate',
        },
        initialCapital: {
          type: 'number',
          default: 10000,
          description: 'Starting capital',
        },
        riskLevel: {
          type: 'string',
          enum: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'],
          default: 'MODERATE',
        },
      },
      required: ['strategy', 'symbol'],
    },
  },
  {
    name: 'get_analytics',
    description: 'Get advanced portfolio analytics',
    inputSchema: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['1d', '7d', '30d', '90d', 'all'],
          default: '30d',
        },
        metrics: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['sharpe', 'sortino', 'winrate', 'profitfactor', 'maxdrawdown', 'volatility', 'returns'],
          },
          default: ['winrate', 'profitfactor', 'maxdrawdown', 'returns'],
        },
      },
    },
  },
  {
    name: 'get_circuit_breakers',
    description: 'Get current circuit breaker status',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'update_circuit_breakers',
    description: 'Update circuit breaker settings',
    inputSchema: {
      type: 'object',
      properties: {
        globalKill: {
          type: 'boolean',
          description: 'Emergency stop all bots',
        },
        maxDrawdownPct: {
          type: 'number',
          description: 'Max daily drawdown percentage',
        },
        gasCeiling: {
          type: 'number',
          description: 'Gas price ceiling in gwei',
        },
        aggressionLevel: {
          type: 'number',
          minimum: 1,
          maximum: 10,
          description: 'Trading aggression level (1-10)',
        },
      },
    },
  },
  {
    name: 'get_market_sentiment',
    description: 'Analyze market sentiment for a symbol or overall market',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Symbol to analyze (omit for overall market)',
        },
        includeFearGreed: {
          type: 'boolean',
          default: true,
          description: 'Include fear & greed index',
        },
      },
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════════
// TOOL HANDLERS
// ════════════════════════════════════════════════════════════════════════════════

async function handleGetMarketData(args) {
  const { type, symbols, vs_currency = 'usd', include_24h_change = true } = args;

  if (type === 'crypto') {
    const ids = symbols.join(',');
    const data = await fetchCoinGecko('/simple/price', {
      ids,
      vs_currencies: vs_currency,
      include_24hr_change: include_24h_change,
      include_market_cap: true,
      include_24hr_vol: true,
    });

    const results = Object.entries(data).map(([id, info]) => ({
      symbol: id,
      price: info[vs_currency],
      marketCap: info[`${vs_currency}_market_cap`],
      volume24h: info[`${vs_currency}_24h_vol`],
      change24h: info[`${vs_currency}_24h_change`],
      currency: vs_currency,
      timestamp: new Date().toISOString(),
    }));

    return { assets: results, count: results.length };
  }

  // For stocks, use Alpaca if available
  if (type === 'stock' && CONFIG.ALPACA_API) {
    const promises = symbols.map(async (sym) => {
      try {
        const data = await fetchAlpaca(`/v2/stocks/${sym}/quotes/latest`);
        return {
          symbol: sym,
          price: data.quote.ap,
          bid: data.quote.bp,
          ask: data.quote.ap,
          currency: 'usd',
          timestamp: data.quote.t,
        };
      } catch (e) {
        return { symbol: sym, error: e.message };
      }
    });
    const results = await Promise.all(promises);
    return { assets: results, count: results.length };
  }

  return { error: 'Stock data requires Alpaca API configuration' };
}

async function handleGetTrendingCoins(args) {
  const limit = args.limit || 10;
  const data = await fetchCoinGecko('/search/trending');
  
  const coins = data.coins?.slice(0, limit).map(c => ({
    id: c.item.id,
    name: c.item.name,
    symbol: c.item.symbol,
    marketCapRank: c.item.market_cap_rank,
    priceBtc: c.item.price_btc,
    thumbnail: c.item.thumb,
    score: c.item.score,
  })) || [];

  return { trending: coins, count: coins.length };
}

async function handleAnalyzeOpportunity(args) {
  const { symbol, strategy, timeframe = '24h' } = args;

  // Fetch market data for analysis
  const marketData = await fetchCoinGecko('/coins/markets', {
    vs_currency: 'usd',
    ids: symbol.toLowerCase(),
    sparkline: true,
    price_change_percentage: '1h,24h,7d',
  });

  const coin = marketData[0];
  if (!coin) {
    return { error: `Symbol ${symbol} not found` };
  }

  // Generate analysis based on strategy
  const analysis = {
    symbol,
    strategy,
    timestamp: new Date().toISOString(),
    currentPrice: coin.current_price,
    priceChanges: {
      '1h': coin.price_change_percentage_1h_in_currency,
      '24h': coin.price_change_percentage_24h_in_currency,
      '7d': coin.price_change_percentage_7d_in_currency,
    },
    volume: coin.total_volume,
    marketCap: coin.market_cap,
    ath: coin.ath,
    atl: coin.atl,
  };

  // Strategy-specific analysis
  switch (strategy) {
    case 'ARBITRAGE':
      analysis.signal = {
        type: Math.abs(coin.price_change_percentage_24h_in_currency || 0) > 3 ? 'OPPORTUNITY' : 'NEUTRAL',
        confidence: Math.min(Math.abs(coin.price_change_percentage_24h_in_currency || 0) / 10, 0.95),
        reasoning: `24h change of ${(coin.price_change_percentage_24h_in_currency || 0).toFixed(2)}% indicates ${Math.abs(coin.price_change_percentage_24h_in_currency || 0) > 5 ? 'high' : 'moderate'} volatility`,
      };
      break;
    case 'MOMENTUM':
      const momentum = (coin.price_change_percentage_1h_in_currency || 0) + (coin.price_change_percentage_24h_in_currency || 0) / 24;
      analysis.signal = {
        type: momentum > 1 ? 'LONG' : momentum < -1 ? 'SHORT' : 'NEUTRAL',
        confidence: Math.min(Math.abs(momentum) / 5, 0.95),
        momentumScore: momentum,
        reasoning: `Combined momentum score: ${momentum.toFixed(3)}`,
      };
      break;
    case 'VOLATILITY':
      const volatility = Math.abs(coin.price_change_percentage_24h_in_currency || 0);
      analysis.signal = {
        type: volatility > 5 ? 'HIGH_VOL' : volatility > 2 ? 'MODERATE_VOL' : 'LOW_VOL',
        confidence: Math.min(volatility / 15, 0.95),
        volatilityScore: volatility,
        reasoning: `24h volatility: ${volatility.toFixed(2)}%`,
      };
      break;
    case 'GRID':
      analysis.signal = {
        type: coin.price_change_percentage_24h_in_currency > -2 && coin.price_change_percentage_24h_in_currency < 2 ? 'GRID_FAVORABLE' : 'GRID_UNFAVORABLE',
        confidence: 0.7,
        reasoning: `Sideways movement (${(coin.price_change_percentage_24h_in_currency || 0).toFixed(2)}%) is ${Math.abs(coin.price_change_percentage_24h_in_currency || 0) < 2 ? 'favorable' : 'unfavorable'} for grid trading`,
      };
      break;
    default:
      analysis.signal = {
        type: 'NEUTRAL',
        confidence: 0.5,
        reasoning: 'Hybrid strategy requires further analysis',
      };
  }

  // Risk assessment
  analysis.risk = {
    level: coin.price_change_percentage_24h_in_currency > 10 || coin.price_change_percentage_24h_in_currency < -10 ? 'HIGH' : 
           coin.price_change_percentage_24h_in_currency > 5 || coin.price_change_percentage_24h_in_currency < -5 ? 'MEDIUM' : 'LOW',
    score: Math.min(Math.abs(coin.price_change_percentage_24h_in_currency || 0) / 20, 1),
    factors: [
      `24h volatility: ${Math.abs(coin.price_change_percentage_24h_in_currency || 0).toFixed(2)}%`,
      `Market cap rank: ${coin.market_cap_rank || 'unknown'}`,
      `Volume: $${((coin.total_volume || 0) / 1e6).toFixed(2)}M`,
    ],
  };

  return analysis;
}

async function handleCreateBot(args) {
  const { name, strategy, riskLevel = 'MODERATE', initialCapital = 1000, symbols = [], autoMode = true } = args;

  if (state.bots.size >= CONFIG.MAX_BOTS_PER_USER) {
    return { error: `Maximum bot limit (${CONFIG.MAX_BOTS_PER_USER}) reached` };
  }

  const bot = state.createBot({ name, strategy, riskLevel, initialCapital, symbols, autoMode });
  
  return {
    success: true,
    message: `Bot "${name}" created successfully`,
    bot: {
      id: bot.id,
      name: bot.name,
      strategy: bot.strategy,
      riskLevel: bot.riskLevel,
      initialCapital: bot.initialCapital,
      status: bot.status,
      active: bot.active,
      createdAt: bot.createdAt,
    },
  };
}

async function handleGetBotStatus(args) {
  const { botId } = args;

  if (botId) {
    const bot = state.getBot(botId);
    if (!bot) return { error: `Bot ${botId} not found` };
    return { bot: { ...bot, tradeCount: bot.trades.length } };
  }

  const bots = state.getAllBots();
  return {
    bots: bots.map(b => ({
      id: b.id,
      name: b.name,
      strategy: b.strategy,
      riskLevel: b.riskLevel,
      status: b.status,
      active: b.active,
      totalPnl: b.totalPnl,
      winRate: b.winRate,
      tradeCount: b.trades.length,
    })),
    count: bots.length,
  };
}

async function handleUpdateBot(args) {
  const { botId, action, config } = args;
  const bot = state.getBot(botId);
  
  if (!bot) return { error: `Bot ${botId} not found` };

  switch (action) {
    case 'PAUSE':
      bot.active = false;
      bot.status = 'PAUSED';
      return { success: true, message: `Bot "${bot.name}" paused`, bot };
    case 'RESUME':
      bot.active = true;
      bot.status = 'ACTIVE';
      return { success: true, message: `Bot "${bot.name}" resumed`, bot };
    case 'STOP':
      bot.active = false;
      bot.status = 'STOPPED';
      return { success: true, message: `Bot "${bot.name}" stopped`, bot };
    case 'UPDATE_CONFIG':
      if (config) {
        Object.assign(bot, config);
      }
      return { success: true, message: `Bot "${bot.name}" updated`, bot };
    default:
      return { error: `Unknown action: ${action}` };
  }
}

async function handleDeleteBot(args) {
  const { botId } = args;
  const deleted = state.deleteBot(botId);
  
  if (!deleted) return { error: `Bot ${botId} not found` };
  return { success: true, message: `Bot ${botId} deleted` };
}

async function handleExecuteTrade(args) {
  const { symbol, side, amount, type = 'MARKET', botId, strategy, paper = true } = args;

  // Get current price
  const marketData = await fetchCoinGecko('/simple/price', {
    ids: symbol.toLowerCase(),
    vs_currencies: 'usd',
  });

  const price = marketData[symbol.toLowerCase()]?.usd;
  if (!price) {
    return { error: `Could not get price for ${symbol}` };
  }

  const quantity = amount / price;
  const fee = amount * 0.0025; // 0.25% fee
  const totalCost = amount + fee;

  const trade = state.logTrade({
    symbol: symbol.toUpperCase(),
    side,
    amount,
    price,
    quantity,
    fee,
    totalCost,
    type,
    botId: botId || null,
    strategy: strategy || 'MANUAL',
    paper,
    status: 'FILLED',
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    message: `${paper ? 'Paper' : 'Real'} trade executed`,
    trade: {
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side,
      amount: trade.amount,
      price: trade.price,
      quantity: trade.quantity,
      fee: trade.fee,
      totalCost: trade.totalCost,
      status: trade.status,
      timestamp: trade.timestamp,
    },
  };
}

async function handleGetPortfolio(args) {
  const { includeOpenPositions = true, includeTradeHistory = false, historyLimit = 50 } = args;

  const bots = state.getAllBots();
  const allTrades = state.getTrades({ limit: historyLimit });
  const openTrades = allTrades.filter(t => t.status === 'OPEN');

  // Calculate portfolio metrics
  const totalInvested = bots.reduce((sum, b) => sum + b.initialCapital, 0);
  const totalPnl = allTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalFees = allTrades.reduce((sum, t) => sum + (t.fee || 0), 0);
  
  const wins = allTrades.filter(t => (t.pnl || 0) > 0).length;
  const losses = allTrades.filter(t => (t.pnl || 0) < 0).length;
  const winRate = allTrades.length > 0 ? (wins / allTrades.length * 100).toFixed(2) : 0;

  const portfolio = {
    summary: {
      totalBots: bots.length,
      activeBots: bots.filter(b => b.active).length,
      totalInvested,
      totalPnl: totalPnl.toFixed(4),
      totalFees: totalFees.toFixed(4),
      netValue: (totalInvested + totalPnl - totalFees).toFixed(4),
      totalTrades: allTrades.length,
      winRate: `${winRate}%`,
      wins,
      losses,
    },
  };

  if (includeOpenPositions) {
    portfolio.openPositions = openTrades.map(t => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side,
      amount: t.amount,
      entryPrice: t.price,
      quantity: t.quantity,
      timestamp: t.timestamp,
      botId: t.botId,
      strategy: t.strategy,
    }));
  }

  if (includeTradeHistory) {
    portfolio.recentTrades = allTrades.slice(-historyLimit).map(t => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side,
      amount: t.amount,
      price: t.price,
      pnl: t.pnl,
      status: t.status,
      timestamp: t.timestamp,
    }));
  }

  return portfolio;
}

async function handleGetTradeHistory(args) {
  const { botId, symbol, strategy, limit = 50, includeAnalytics = true } = args;

  const trades = state.getTrades({ botId, symbol, strategy, limit });

  const result = {
    trades: trades.map(t => ({
      id: t.id,
      symbol: t.symbol,
      side: t.side,
      amount: t.amount,
      price: t.price,
      quantity: t.quantity,
      fee: t.fee,
      pnl: t.pnl,
      status: t.status,
      strategy: t.strategy,
      botId: t.botId,
      timestamp: t.timestamp,
    })),
    count: trades.length,
  };

  if (includeAnalytics && trades.length > 0) {
    const pnls = trades.map(t => t.pnl || 0);
    const wins = pnls.filter(p => p > 0);
    const losses = pnls.filter(p => p < 0);
    
    result.analytics = {
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: ((wins.length / trades.length) * 100).toFixed(2),
      totalPnl: pnls.reduce((a, b) => a + b, 0).toFixed(4),
      avgWin: wins.length > 0 ? (wins.reduce((a, b) => a + b, 0) / wins.length).toFixed(4) : 0,
      avgLoss: losses.length > 0 ? (losses.reduce((a, b) => a + b, 0) / losses.length).toFixed(4) : 0,
      profitFactor: losses.length > 0 && Math.abs(losses.reduce((a, b) => a + b, 0)) > 0 
        ? (wins.reduce((a, b) => a + b, 0) / Math.abs(losses.reduce((a, b) => a + b, 0))).toFixed(2)
        : wins.length > 0 ? '∞' : '0',
      maxConsecutiveWins: calculateMaxStreak(trades, 'win'),
      maxConsecutiveLosses: calculateMaxStreak(trades, 'loss'),
    };
  }

  return result;
}

function calculateMaxStreak(trades, type) {
  let maxStreak = 0;
  let currentStreak = 0;
  
  for (const trade of trades) {
    const isWin = (trade.pnl || 0) > 0;
    if ((type === 'win' && isWin) || (type === 'loss' && !isWin)) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  return maxStreak;
}

async function handleRunBacktest(args) {
  const { strategy, symbol, days = 30, initialCapital = 10000, riskLevel = 'MODERATE' } = args;

  // Fetch historical data (simplified simulation)
  const marketData = await fetchCoinGecko('/coins/markets', {
    vs_currency: 'usd',
    ids: symbol.toLowerCase(),
    sparkline: true,
    price_change_percentage: '1h,24h,7d,30d',
  });

  const coin = marketData[0];
  if (!coin) {
    return { error: `Symbol ${symbol} not found` };
  }

  // Simulate backtest
  const riskMultiplier = { CONSERVATIVE: 0.5, MODERATE: 1.0, AGGRESSIVE: 2.0 }[riskLevel] || 1.0;
  const volatility = Math.abs(coin.price_change_percentage_30d_in_currency || 0);
  const winProbability = 0.45 + (volatility / 100) * riskMultiplier;
  
  const simulatedTrades = Math.floor(days * 2.5 * riskMultiplier);
  const wins = Math.floor(simulatedTrades * winProbability);
  const losses = simulatedTrades - wins;
  
  const avgWin = (initialCapital * 0.02 * riskMultiplier);
  const avgLoss = (initialCapital * 0.015 * riskMultiplier);
  
  const totalWin = wins * avgWin;
  const totalLoss = losses * avgLoss;
  const netPnl = totalWin - totalLoss;
  const finalCapital = initialCapital + netPnl;

  return {
    backtest: {
      strategy,
      symbol,
      days,
      initialCapital,
      finalCapital: finalCapital.toFixed(2),
      netPnl: netPnl.toFixed(2),
      returnPct: ((netPnl / initialCapital) * 100).toFixed(2),
      totalTrades: simulatedTrades,
      wins,
      losses,
      winRate: ((wins / simulatedTrades) * 100).toFixed(2),
      avgWin: avgWin.toFixed(2),
      avgLoss: avgLoss.toFixed(2),
      profitFactor: totalLoss > 0 ? (totalWin / totalLoss).toFixed(2) : '∞',
      maxDrawdown: (initialCapital * 0.08 * riskMultiplier).toFixed(2),
      sharpeRatio: (netPnl / (initialCapital * 0.05 * riskMultiplier)).toFixed(2),
      riskLevel,
      parameters: {
        volatility: `${volatility.toFixed(2)}%`,
        winProbability: `${(winProbability * 100).toFixed(1)}%`,
        riskMultiplier,
      },
    },
    disclaimer: 'Backtest results are simulated and do not guarantee future performance.',
  };
}

async function handleGetAnalytics(args) {
  const { timeframe = '30d', metrics = ['winrate', 'profitfactor', 'maxdrawdown', 'returns'] } = args;

  const allTrades = state.getTrades();
  const trades = filterByTimeframe(allTrades, timeframe);

  if (trades.length === 0) {
    return { message: 'No trades found for the specified timeframe', analytics: {} };
  }

  const pnls = trades.map(t => t.pnl || 0);
  const returns = pnls.map(p => p / 1000); // Assuming $1000 per trade baseline
  
  const wins = pnls.filter(p => p > 0);
  const losses = pnls.filter(p => p < 0);
  
  const analytics = {};

  if (metrics.includes('winrate')) {
    analytics.winRate = {
      value: ((wins.length / trades.length) * 100).toFixed(2),
      unit: '%',
      description: 'Percentage of winning trades',
    };
  }

  if (metrics.includes('profitfactor')) {
    const totalWin = wins.reduce((a, b) => a + b, 0);
    const totalLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
    analytics.profitFactor = {
      value: totalLoss > 0 ? (totalWin / totalLoss).toFixed(2) : wins.length > 0 ? '∞' : '0',
      description: 'Gross profit divided by gross loss',
      benchmark: '> 1.5 is good, > 2.0 is excellent',
    };
  }

  if (metrics.includes('maxdrawdown')) {
    analytics.maxDrawdown = {
      value: calculateMaxDrawdown(pnls).toFixed(2),
      unit: '%',
      description: 'Maximum peak-to-trough decline',
    };
  }

  if (metrics.includes('returns')) {
    const totalReturn = pnls.reduce((a, b) => a + b, 0);
    analytics.returns = {
      total: totalReturn.toFixed(4),
      avgPerTrade: (totalReturn / trades.length).toFixed(4),
      description: 'Total and average returns',
    };
  }

  if (metrics.includes('sharpe')) {
    analytics.sharpeRatio = {
      value: calculateSharpeRatio(returns).toFixed(2),
      description: 'Risk-adjusted return measure',
      benchmark: '> 1.0 is good, > 2.0 is very good',
    };
  }

  if (metrics.includes('sortino')) {
    analytics.sortinoRatio = {
      value: calculateSortinoRatio(returns).toFixed(2),
      description: 'Downside risk-adjusted return',
      benchmark: '> 1.0 is good, > 2.0 is very good',
    };
  }

  if (metrics.includes('volatility')) {
    analytics.volatility = {
      value: (calculateStdDev(returns) * Math.sqrt(252) * 100).toFixed(2),
      unit: '% annualized',
      description: 'Annualized volatility',
    };
  }

  return {
    timeframe,
    tradeCount: trades.length,
    analytics,
    periodSummary: {
      startDate: trades[0]?.timestamp,
      endDate: trades[trades.length - 1]?.timestamp,
    },
  };
}

function filterByTimeframe(trades, timeframe) {
  const now = Date.now();
  const msPerDay = 86400000;
  const days = { '1d': 1, '7d': 7, '30d': 30, '90d': 90, 'all': Infinity }[timeframe] || 30;
  const cutoff = now - (days * msPerDay);
  
  return trades.filter(t => new Date(t.timestamp).getTime() >= cutoff);
}

function calculateMaxDrawdown(pnls) {
  let peak = 0;
  let maxDrawdown = 0;
  let cumulative = 0;
  
  for (const pnl of pnls) {
    cumulative += pnl;
    if (cumulative > peak) peak = cumulative;
    const drawdown = peak - cumulative;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  return maxDrawdown;
}

function calculateSharpeRatio(returns, riskFreeRate = 0.02 / 252) {
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = calculateStdDev(returns);
  if (stdDev === 0) return 0;
  return ((avgReturn - riskFreeRate) / stdDev) * Math.sqrt(252);
}

function calculateSortinoRatio(returns, riskFreeRate = 0.02 / 252) {
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const downsideReturns = returns.filter(r => r < riskFreeRate);
  const downsideDev = downsideReturns.length > 0 
    ? Math.sqrt(downsideReturns.reduce((sum, r) => sum + Math.pow(r - riskFreeRate, 2), 0) / downsideReturns.length)
    : 0;
  if (downsideDev === 0) return avgReturn > riskFreeRate ? Infinity : 0;
  return ((avgReturn - riskFreeRate) / downsideDev) * Math.sqrt(252);
}

function calculateStdDev(values) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

async function handleGetCircuitBreakers() {
  return state.getCircuitStatus();
}

async function handleUpdateCircuitBreakers(args) {
  const updates = {};
  if (args.globalKill !== undefined) updates.globalKill = args.globalKill;
  if (args.maxDrawdownPct !== undefined) updates.maxDrawdownPct = args.maxDrawdownPct;
  if (args.gasCeiling !== undefined) updates.gasCeiling = args.gasCeiling;
  if (args.aggressionLevel !== undefined) updates.aggressionLevel = Math.max(1, Math.min(10, args.aggressionLevel));

  const result = state.updateCircuitBreakers(updates);
  return {
    success: true,
    message: 'Circuit breakers updated',
    circuitBreakers: result,
  };
}

async function handleGetMarketSentiment(args) {
  const { symbol, includeFearGreed = true } = args;

  const result = {
    timestamp: new Date().toISOString(),
  };

  if (includeFearGreed) {
    try {
      const fgData = await axios.get('https://api.alternative.me/fng/?limit=1', { timeout: 5000 });
      result.fearGreedIndex = {
        value: fgData.data.data[0]?.value,
        classification: fgData.data.data[0]?.value_classification,
        timestamp: fgData.data.data[0]?.timestamp,
      };
    } catch (e) {
      result.fearGreedIndex = { error: 'Unable to fetch fear & greed index' };
    }
  }

  if (symbol) {
    const marketData = await fetchCoinGecko('/coins/markets', {
      vs_currency: 'usd',
      ids: symbol.toLowerCase(),
      price_change_percentage: '1h,24h,7d',
    });

    const coin = marketData[0];
    if (coin) {
      const changes = [
        coin.price_change_percentage_1h_in_currency,
        coin.price_change_percentage_24h_in_currency,
        coin.price_change_percentage_7d_in_currency,
      ].filter(Boolean);
      
      const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
      
      result.symbolSentiment = {
        symbol,
        price: coin.current_price,
        sentiment: avgChange > 5 ? 'VERY_BULLISH' : avgChange > 2 ? 'BULLISH' : avgChange > -2 ? 'NEUTRAL' : avgChange > -5 ? 'BEARISH' : 'VERY_BEARISH',
        sentimentScore: Math.max(-100, Math.min(100, avgChange * 10)).toFixed(1),
        priceChanges: {
          '1h': coin.price_change_percentage_1h_in_currency,
          '24h': coin.price_change_percentage_24h_in_currency,
          '7d': coin.price_change_percentage_7d_in_currency,
        },
        volumeTrend: coin.total_volume > (coin.market_cap || 0) * 0.05 ? 'HIGH' : 'NORMAL',
      };
    }
  }

  // Overall market sentiment
  const topCoins = await fetchCoinGecko('/coins/markets', {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: 10,
    price_change_percentage: '24h',
  });

  const upCoins = topCoins.filter(c => (c.price_change_percentage_24h_in_currency || 0) > 0).length;
  const downCoins = topCoins.length - upCoins;
  
  result.overallMarket = {
    topCoinsUp: upCoins,
    topCoinsDown: downCoins,
    marketDirection: upCoins > downCoins + 2 ? 'BULLISH' : downCoins > upCoins + 2 ? 'BEARISH' : 'MIXED',
    dominance: {
      btc: topCoins.find(c => c.id === 'bitcoin')?.market_cap_dominance,
      eth: topCoins.find(c => c.id === 'ethereum')?.market_cap_dominance,
    },
  };

  return result;
}

// ════════════════════════════════════════════════════════════════════════════════
// RESOURCE DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════════

const RESOURCES = [
  {
    uri: 'market://prices',
    name: 'Live Market Prices',
    description: 'Current cryptocurrency prices',
    mimeType: 'application/json',
  },
  {
    uri: 'portfolio://summary',
    name: 'Portfolio Summary',
    description: 'Current portfolio holdings and performance',
    mimeType: 'application/json',
  },
  {
    uri: 'analytics://performance',
    name: 'Performance Analytics',
    description: 'Trading performance metrics',
    mimeType: 'application/json',
  },
  {
    uri: 'strategy://active',
    name: 'Active Strategies',
    description: 'Currently active trading strategies',
    mimeType: 'application/json',
  },
  {
    uri: 'market://sentiment',
    name: 'Market Sentiment',
    description: 'Current market sentiment and fear/greed index',
    mimeType: 'application/json',
  },
];

async function readResource(uri) {
  switch (uri) {
    case 'market://prices': {
      const data = await fetchCoinGecko('/coins/markets', {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 20,
        price_change_percentage: '24h',
      });
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(data.map(c => ({
            symbol: c.symbol,
            name: c.name,
            price: c.current_price,
            change24h: c.price_change_percentage_24h_in_currency,
            marketCap: c.market_cap,
            volume: c.total_volume,
          })), null, 2),
        }],
      };
    }
    case 'portfolio://summary': {
      const bots = state.getAllBots();
      const trades = state.getTrades();
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            totalBots: bots.length,
            activeBots: bots.filter(b => b.active).length,
            totalTrades: trades.length,
            totalPnl: trades.reduce((sum, t) => sum + (t.pnl || 0), 0).toFixed(4),
            bots: bots.map(b => ({
              id: b.id,
              name: b.name,
              strategy: b.strategy,
              status: b.status,
              totalPnl: b.totalPnl,
              winRate: b.winRate,
            })),
          }, null, 2),
        }],
      };
    }
    case 'analytics://performance': {
      const trades = state.getTrades();
      const pnls = trades.map(t => t.pnl || 0);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            totalTrades: trades.length,
            winRate: trades.length > 0 ? ((pnls.filter(p => p > 0).length / trades.length) * 100).toFixed(2) : 0,
            profitFactor: calculateProfitFactor(trades),
            maxDrawdown: calculateMaxDrawdown(pnls).toFixed(4),
            totalReturn: pnls.reduce((a, b) => a + b, 0).toFixed(4),
            avgTrade: trades.length > 0 ? (pnls.reduce((a, b) => a + b, 0) / trades.length).toFixed(4) : 0,
          }, null, 2),
        }],
      };
    }
    case 'strategy://active': {
      const bots = state.getAllBots();
      const strategies = {};
      bots.forEach(b => {
        strategies[b.strategy] = (strategies[b.strategy] || 0) + 1;
      });
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            activeStrategies: strategies,
            totalActive: bots.filter(b => b.active).length,
            strategyBreakdown: Object.entries(strategies).map(([name, count]) => ({
              name,
              count,
              percentage: ((count / bots.length) * 100).toFixed(1),
            })),
          }, null, 2),
        }],
      };
    }
    case 'market://sentiment': {
      const sentiment = await handleGetMarketSentiment({});
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(sentiment, null, 2),
        }],
      };
    }
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}

function calculateProfitFactor(trades) {
  const wins = trades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0);
  const losses = Math.abs(trades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0));
  return losses > 0 ? (wins / losses).toFixed(2) : wins > 0 ? '∞' : '0';
}

// ════════════════════════════════════════════════════════════════════════════════
// PROMPT DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════════

const PROMPTS = [
  {
    name: 'trading_strategy_analysis',
    description: 'Analyze current market conditions and recommend trading strategies',
    arguments: [
      {
        name: 'symbol',
        description: 'Primary symbol to analyze',
        required: true,
      },
      {
        name: 'risk_tolerance',
        description: 'Risk tolerance level (conservative, moderate, aggressive)',
        required: false,
      },
    ],
  },
  {
    name: 'risk_assessment',
    description: 'Evaluate portfolio risk and suggest adjustments',
    arguments: [
      {
        name: 'focus',
        description: 'Assessment focus (portfolio, bot, market)',
        required: false,
      },
    ],
  },
  {
    name: 'bot_optimization',
    description: 'Optimize bot parameters based on performance',
    arguments: [
      {
        name: 'botId',
        description: 'Bot ID to optimize',
        required: true,
      },
    ],
  },
  {
    name: 'market_analysis',
    description: 'Comprehensive market analysis with technical indicators',
    arguments: [
      {
        name: 'symbol',
        description: 'Symbol to analyze',
        required: true,
      },
      {
        name: 'timeframe',
        description: 'Analysis timeframe',
        required: false,
      },
    ],
  },
];

function getPrompt(name, args = {}) {
  switch (name) {
    case 'trading_strategy_analysis': {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyze the trading opportunity for ${args.symbol || 'the market'} with ${args.risk_tolerance || 'moderate'} risk tolerance.

Consider:
1. Current market conditions and trend
2. Volatility and volume patterns
3. Risk/reward ratio for different strategies
4. Recommended entry and exit points
5. Position sizing suggestions

Provide a clear strategy recommendation with justification.`,
            },
          },
        ],
      };
    }
    case 'risk_assessment': {
      const focus = args.focus || 'portfolio';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Perform a comprehensive risk assessment focusing on ${focus}.

Evaluate:
1. Current exposure and concentration risk
2. Correlation between positions
3. Maximum potential drawdown
4. Volatility metrics
5. Circuit breaker settings adequacy

Provide specific recommendations for risk mitigation.`,
            },
          },
        ],
      };
    }
    case 'bot_optimization': {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Optimize trading bot ${args.botId || 'configuration'} for maximum risk-adjusted returns.

Analyze:
1. Historical performance metrics
2. Win rate vs profit factor
3. Optimal risk level based on market conditions
4. Strategy selection for current regime
5. Parameter tuning suggestions

Provide concrete parameter changes with expected impact.`,
            },
          },
        ],
      };
    }
    case 'market_analysis': {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Provide a comprehensive technical and fundamental analysis for ${args.symbol} over ${args.timeframe || 'the last 30 days'}.

Include:
1. Price action and key levels (support/resistance)
2. Volume analysis
3. Momentum indicators (RSI, MACD interpretation)
4. Market structure (trend, range, reversal)
5. Correlation with broader market
6. Upcoming catalysts or events
7. Trading range forecast

Format as a professional trading desk report.`,
            },
          },
        ],
      };
    }
    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// MCP SERVER SETUP
// ════════════════════════════════════════════════════════════════════════════════

async function createMCPServer() {
  const server = new Server(
    {
      name: 'trade-arena-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TRADING_TOOLS,
  }));

  // Execute tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result;
      switch (name) {
        case 'get_market_data':
          result = await handleGetMarketData(args);
          break;
        case 'get_trending_coins':
          result = await handleGetTrendingCoins(args);
          break;
        case 'analyze_opportunity':
          result = await handleAnalyzeOpportunity(args);
          break;
        case 'create_trading_bot':
          result = await handleCreateBot(args);
          break;
        case 'get_bot_status':
          result = await handleGetBotStatus(args);
          break;
        case 'update_bot':
          result = await handleUpdateBot(args);
          break;
        case 'delete_bot':
          result = await handleDeleteBot(args);
          break;
        case 'execute_trade':
          result = await handleExecuteTrade(args);
          break;
        case 'get_portfolio':
          result = await handleGetPortfolio(args);
          break;
        case 'get_trade_history':
          result = await handleGetTradeHistory(args);
          break;
        case 'run_backtest':
          result = await handleRunBacktest(args);
          break;
        case 'get_analytics':
          result = await handleGetAnalytics(args);
          break;
        case 'get_circuit_breakers':
          result = await handleGetCircuitBreakers();
          break;
        case 'update_circuit_breakers':
          result = await handleUpdateCircuitBreakers(args);
          break;
        case 'get_market_sentiment':
          result = await handleGetMarketSentiment(args);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: error.message, stack: error.stack }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  // List resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: RESOURCES,
  }));

  // Read resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    return readResource(uri);
  });

  // List prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: PROMPTS,
  }));

  // Get prompt
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return getPrompt(name, args);
  });

  return server;
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPRESS INTEGRATION (HTTP TRANSPORT)
// ════════════════════════════════════════════════════════════════════════════════

function setupExpressRoutes(app) {
  // MCP Status Endpoint
  app.get('/api/mcp/status', (req, res) => {
    res.json({
      status: 'active',
      version: '1.0.0',
      tools: TRADING_TOOLS.length,
      resources: RESOURCES.length,
      prompts: PROMPTS.length,
      bots: state.getAllBots().length,
      trades: state.getTrades().length,
      uptime: process.uptime(),
    });
  });

  // Direct tool execution endpoint (for browser/frontend)
  app.post('/api/mcp/tool/:toolName', async (req, res) => {
    const { toolName } = req.params;
    const args = req.body;

    try {
      let result;
      switch (toolName) {
        case 'get_market_data':
          result = await handleGetMarketData(args);
          break;
        case 'get_trending_coins':
          result = await handleGetTrendingCoins(args);
          break;
        case 'analyze_opportunity':
          result = await handleAnalyzeOpportunity(args);
          break;
        case 'create_trading_bot':
          result = await handleCreateBot(args);
          break;
        case 'get_bot_status':
          result = await handleGetBotStatus(args);
          break;
        case 'update_bot':
          result = await handleUpdateBot(args);
          break;
        case 'delete_bot':
          result = await handleDeleteBot(args);
          break;
        case 'execute_trade':
          result = await handleExecuteTrade(args);
          break;
        case 'get_portfolio':
          result = await handleGetPortfolio(args);
          break;
        case 'get_trade_history':
          result = await handleGetTradeHistory(args);
          break;
        case 'run_backtest':
          result = await handleRunBacktest(args);
          break;
        case 'get_analytics':
          result = await handleGetAnalytics(args);
          break;
        case 'get_circuit_breakers':
          result = await handleGetCircuitBreakers();
          break;
        case 'update_circuit_breakers':
          result = await handleUpdateCircuitBreakers(args);
          break;
        case 'get_market_sentiment':
          result = await handleGetMarketSentiment(args);
          break;
        default:
          return res.status(404).json({ error: `Unknown tool: ${toolName}` });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resource endpoints
  app.get('/api/mcp/resource/:resourceName', async (req, res) => {
    const { resourceName } = req.params;
    const uriMap = {
      prices: 'market://prices',
      portfolio: 'portfolio://summary',
      analytics: 'analytics://performance',
      strategies: 'strategy://active',
      sentiment: 'market://sentiment',
    };

    const uri = uriMap[resourceName];
    if (!uri) {
      return res.status(404).json({ error: `Unknown resource: ${resourceName}` });
    }

    try {
      const result = await readResource(uri);
      const text = result.contents[0]?.text;
      res.json(JSON.parse(text));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // SSE endpoint for real-time updates
  app.get('/api/mcp/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Send initial state
    sendEvent({ type: 'connected', timestamp: new Date().toISOString() });

    // Heartbeat
    const heartbeat = setInterval(() => {
      sendEvent({ type: 'heartbeat', timestamp: new Date().toISOString() });
    }, 30000);

    // Cleanup on close
    req.on('close', () => {
      clearInterval(heartbeat);
    });
  });

  console.log('[MCP] Express routes registered');
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINTS
// ════════════════════════════════════════════════════════════════════════════════

async function startStdioServer() {
  const server = await createMCPServer();
  const transport = new StdioServerTransport();
  
  console.error('[MCP] Starting Trade Arena MCP Server (stdio)');
  await server.connect(transport);
  console.error('[MCP] Server connected and ready');
}

async function startHTTPServer(app) {
  setupExpressRoutes(app);
  console.log('[MCP] HTTP routes mounted on Express app');
}

// Export for use in server.js
module.exports = {
  startStdioServer,
  startHTTPServer,
  setupExpressRoutes,
  state,
  TRADING_TOOLS,
  RESOURCES,
  PROMPTS,
};

// Run standalone if called directly
if (require.main === module) {
  startStdioServer().catch(console.error);
}
