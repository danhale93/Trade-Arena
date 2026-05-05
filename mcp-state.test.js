/**
 * Tests for mcp-server.js TradeArenaState class (new file added in this PR)
 *
 * TradeArenaState is the core in-memory state manager for the MCP server.
 * Since @modelcontextprotocol/sdk is not installed in this environment,
 * the class is re-defined here exactly as it appears in mcp-server.js to
 * allow isolated unit testing without the heavy SDK dependency.
 */

'use strict';

// ════════════════════════════════════════════════════════════
// Inline TradeArenaState (mirrors mcp-server.js exactly)
// ════════════════════════════════════════════════════════════

const CONFIG_CACHE_TTL_MS = 30000; // 30 seconds, matches mcp-server.js CONFIG.CACHE_TTL_MS

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

  logTrade(trade) {
    const entry = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...trade,
    };
    this.trades.push(entry);

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

  getCachedPrice(key) {
    const ts = this.cacheTimestamps.get(key);
    if (ts && Date.now() - ts < CONFIG_CACHE_TTL_MS) {
      return this.priceCache.get(key);
    }
    return null;
  }

  setCachedPrice(key, value) {
    this.priceCache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());
  }

  addMarketSnapshot(data) {
    this.marketSnapshots.push({
      timestamp: new Date().toISOString(),
      data,
    });
    if (this.marketSnapshots.length > 1000) {
      this.marketSnapshots = this.marketSnapshots.slice(-500);
    }
  }

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

// ════════════════════════════════════════════════════════════
// Bot Management Tests
// ════════════════════════════════════════════════════════════

describe('TradeArenaState — Bot Management', () => {
  let state;

  beforeEach(() => {
    state = new TradeArenaState();
  });

  test('constructor initialises with empty bots Map', () => {
    expect(state.bots.size).toBe(0);
  });

  test('createBot returns bot with generated id', () => {
    const bot = state.createBot({ name: 'Alpha' });
    expect(bot.id).toMatch(/^bot_\d+_[a-z0-9]+$/);
  });

  test('createBot uses provided name', () => {
    const bot = state.createBot({ name: 'MyBot' });
    expect(bot.name).toBe('MyBot');
  });

  test('createBot uses default name based on bot count when name omitted', () => {
    const bot = state.createBot({});
    expect(bot.name).toBe('Bot 1');
  });

  test('createBot second bot without name gets incremented default name', () => {
    state.createBot({ name: 'First' });
    const second = state.createBot({});
    expect(second.name).toBe('Bot 2');
  });

  test('createBot uses provided strategy', () => {
    const bot = state.createBot({ strategy: 'MOMENTUM' });
    expect(bot.strategy).toBe('MOMENTUM');
  });

  test('createBot defaults strategy to BALANCED', () => {
    const bot = state.createBot({});
    expect(bot.strategy).toBe('BALANCED');
  });

  test('createBot uses provided riskLevel', () => {
    const bot = state.createBot({ riskLevel: 'AGGRESSIVE' });
    expect(bot.riskLevel).toBe('AGGRESSIVE');
  });

  test('createBot defaults riskLevel to MODERATE', () => {
    const bot = state.createBot({});
    expect(bot.riskLevel).toBe('MODERATE');
  });

  test('createBot uses provided initialCapital', () => {
    const bot = state.createBot({ initialCapital: 5000 });
    expect(bot.initialCapital).toBe(5000);
  });

  test('createBot defaults initialCapital to 1000', () => {
    const bot = state.createBot({});
    expect(bot.initialCapital).toBe(1000);
  });

  test('createBot sets active=true', () => {
    const bot = state.createBot({});
    expect(bot.active).toBe(true);
  });

  test('createBot sets status=ACTIVE', () => {
    const bot = state.createBot({});
    expect(bot.status).toBe('ACTIVE');
  });

  test('createBot sets autoMode=true by default', () => {
    const bot = state.createBot({});
    expect(bot.autoMode).toBe(true);
  });

  test('createBot respects autoMode=false', () => {
    const bot = state.createBot({ autoMode: false });
    expect(bot.autoMode).toBe(false);
  });

  test('createBot initialises empty trades array', () => {
    const bot = state.createBot({});
    expect(bot.trades).toEqual([]);
  });

  test('createBot initialises totalPnl=0 and winRate=0', () => {
    const bot = state.createBot({});
    expect(bot.totalPnl).toBe(0);
    expect(bot.winRate).toBe(0);
  });

  test('createBot stores bot in bots Map', () => {
    const bot = state.createBot({ name: 'Stored' });
    expect(state.bots.has(bot.id)).toBe(true);
  });

  test('createBot generates unique IDs for multiple bots', () => {
    const ids = new Set();
    for (let i = 0; i < 10; i++) {
      ids.add(state.createBot({}).id);
    }
    expect(ids.size).toBe(10);
  });

  test('getBot returns the created bot', () => {
    const bot = state.createBot({ name: 'Retrieved' });
    expect(state.getBot(bot.id)).toBe(bot);
  });

  test('getBot returns undefined for nonexistent id', () => {
    expect(state.getBot('nonexistent_id')).toBeUndefined();
  });

  test('getAllBots returns array of all bots', () => {
    state.createBot({ name: 'A' });
    state.createBot({ name: 'B' });
    state.createBot({ name: 'C' });
    expect(state.getAllBots()).toHaveLength(3);
  });

  test('getAllBots returns empty array when no bots', () => {
    expect(state.getAllBots()).toEqual([]);
  });

  test('deleteBot removes bot and returns true', () => {
    const bot = state.createBot({});
    const result = state.deleteBot(bot.id);
    expect(result).toBe(true);
    expect(state.getBot(bot.id)).toBeUndefined();
  });

  test('deleteBot returns false for nonexistent id', () => {
    expect(state.deleteBot('does_not_exist')).toBe(false);
  });

  test('deleteBot decrements bots.size', () => {
    const bot = state.createBot({});
    state.deleteBot(bot.id);
    expect(state.bots.size).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════
// Trade Logging Tests
// ════════════════════════════════════════════════════════════

describe('TradeArenaState — Trade Logging', () => {
  let state;

  beforeEach(() => {
    state = new TradeArenaState();
  });

  test('logTrade returns entry with generated id and timestamp', () => {
    const entry = state.logTrade({ symbol: 'BTC', pnl: 10 });
    expect(entry.id).toMatch(/^trade_\d+_[a-z0-9]+$/);
    expect(entry.timestamp).toBeDefined();
  });

  test('logTrade merges trade data into entry', () => {
    const entry = state.logTrade({ symbol: 'ETH', pnl: 5, strategy: 'MOMENTUM' });
    expect(entry.symbol).toBe('ETH');
    expect(entry.pnl).toBe(5);
    expect(entry.strategy).toBe('MOMENTUM');
  });

  test('logTrade appends to trades array', () => {
    state.logTrade({ symbol: 'BTC' });
    state.logTrade({ symbol: 'ETH' });
    expect(state.trades).toHaveLength(2);
  });

  test('logTrade does not update bot stats when botId is absent', () => {
    const bot = state.createBot({ name: 'TestBot' });
    state.logTrade({ symbol: 'BTC', pnl: 50 }); // no botId
    expect(state.getBot(bot.id).totalPnl).toBe(0);
  });

  test('logTrade updates bot totalPnl when botId matches', () => {
    const bot = state.createBot({});
    state.logTrade({ botId: bot.id, pnl: 25 });
    expect(state.getBot(bot.id).totalPnl).toBe(25);
  });

  test('logTrade accumulates bot totalPnl across multiple trades', () => {
    const bot = state.createBot({});
    state.logTrade({ botId: bot.id, pnl: 10 });
    state.logTrade({ botId: bot.id, pnl: -5 });
    state.logTrade({ botId: bot.id, pnl: 20 });
    expect(state.getBot(bot.id).totalPnl).toBe(25);
  });

  test('logTrade calculates bot winRate correctly', () => {
    const bot = state.createBot({});
    state.logTrade({ botId: bot.id, pnl: 10 });  // win
    state.logTrade({ botId: bot.id, pnl: -5 });  // loss
    state.logTrade({ botId: bot.id, pnl: 20 });  // win
    // 2 wins out of 3 = 66.7%
    expect(parseFloat(state.getBot(bot.id).winRate)).toBeCloseTo(66.7, 1);
  });

  test('logTrade treats pnl=0 as not a win for winRate', () => {
    const bot = state.createBot({});
    state.logTrade({ botId: bot.id, pnl: 0 });   // not a win
    state.logTrade({ botId: bot.id, pnl: 10 });  // win
    // 1 win out of 2 = 50%
    expect(parseFloat(state.getBot(bot.id).winRate)).toBeCloseTo(50.0, 1);
  });

  test('logTrade handles missing pnl field (treats as 0)', () => {
    const bot = state.createBot({});
    state.logTrade({ botId: bot.id }); // no pnl field
    expect(state.getBot(bot.id).totalPnl).toBe(0);
  });

  test('logTrade does not crash when botId does not exist in bots map', () => {
    expect(() => {
      state.logTrade({ botId: 'nonexistent', pnl: 100 });
    }).not.toThrow();
  });

  test('getTrades returns all trades by default', () => {
    state.logTrade({ symbol: 'BTC' });
    state.logTrade({ symbol: 'ETH' });
    expect(state.getTrades()).toHaveLength(2);
  });

  test('getTrades filters by botId', () => {
    const bot1 = state.createBot({});
    const bot2 = state.createBot({});
    state.logTrade({ botId: bot1.id });
    state.logTrade({ botId: bot2.id });
    state.logTrade({ botId: bot1.id });
    expect(state.getTrades({ botId: bot1.id })).toHaveLength(2);
  });

  test('getTrades filters by symbol', () => {
    state.logTrade({ symbol: 'BTC' });
    state.logTrade({ symbol: 'ETH' });
    state.logTrade({ symbol: 'BTC' });
    expect(state.getTrades({ symbol: 'BTC' })).toHaveLength(2);
  });

  test('getTrades filters by strategy', () => {
    state.logTrade({ strategy: 'MOMENTUM' });
    state.logTrade({ strategy: 'ARBITRAGE' });
    expect(state.getTrades({ strategy: 'MOMENTUM' })).toHaveLength(1);
  });

  test('getTrades respects limit (returns last N)', () => {
    for (let i = 0; i < 10; i++) state.logTrade({ symbol: 'BTC', idx: i });
    const limited = state.getTrades({ limit: 3 });
    expect(limited).toHaveLength(3);
    // Should be the last 3
    expect(limited[2].idx).toBe(9);
  });

  test('getTrades with no filters returns copy (not mutation of internal array)', () => {
    state.logTrade({ symbol: 'BTC' });
    const result = state.getTrades();
    result.push({ fake: true });
    expect(state.trades).toHaveLength(1);
  });
});

// ════════════════════════════════════════════════════════════
// Price Caching Tests
// ════════════════════════════════════════════════════════════

describe('TradeArenaState — Price Caching', () => {
  let state;

  beforeEach(() => {
    state = new TradeArenaState();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('getCachedPrice returns null for unknown key', () => {
    expect(state.getCachedPrice('bitcoin')).toBeNull();
  });

  test('setCachedPrice then getCachedPrice returns stored value', () => {
    state.setCachedPrice('bitcoin', { price: 50000 });
    expect(state.getCachedPrice('bitcoin')).toEqual({ price: 50000 });
  });

  test('getCachedPrice returns null after TTL expires', () => {
    state.setCachedPrice('bitcoin', { price: 50000 });
    // Advance time past TTL (30001ms)
    jest.advanceTimersByTime(CONFIG_CACHE_TTL_MS + 1);
    expect(state.getCachedPrice('bitcoin')).toBeNull();
  });

  test('getCachedPrice still returns value just before TTL expiry', () => {
    state.setCachedPrice('bitcoin', { price: 50000 });
    jest.advanceTimersByTime(CONFIG_CACHE_TTL_MS - 1);
    expect(state.getCachedPrice('bitcoin')).toEqual({ price: 50000 });
  });

  test('setCachedPrice overwrites existing value', () => {
    state.setCachedPrice('bitcoin', { price: 50000 });
    state.setCachedPrice('bitcoin', { price: 60000 });
    expect(state.getCachedPrice('bitcoin')).toEqual({ price: 60000 });
  });

  test('setCachedPrice stores multiple keys independently', () => {
    state.setCachedPrice('bitcoin', { price: 50000 });
    state.setCachedPrice('ethereum', { price: 3000 });
    expect(state.getCachedPrice('bitcoin')).toEqual({ price: 50000 });
    expect(state.getCachedPrice('ethereum')).toEqual({ price: 3000 });
  });
});

// ════════════════════════════════════════════════════════════
// Market Snapshots Tests
// ════════════════════════════════════════════════════════════

describe('TradeArenaState — Market Snapshots', () => {
  let state;

  beforeEach(() => {
    state = new TradeArenaState();
  });

  test('addMarketSnapshot appends a snapshot with timestamp', () => {
    state.addMarketSnapshot({ price: 2500 });
    expect(state.marketSnapshots).toHaveLength(1);
    expect(state.marketSnapshots[0].data).toEqual({ price: 2500 });
    expect(state.marketSnapshots[0].timestamp).toBeDefined();
  });

  test('addMarketSnapshot keeps last 500 when exceeding 1000', () => {
    for (let i = 0; i < 1001; i++) {
      state.addMarketSnapshot({ i });
    }
    expect(state.marketSnapshots).toHaveLength(500);
  });

  test('addMarketSnapshot preserves the last entries when trimmed', () => {
    for (let i = 0; i < 1001; i++) {
      state.addMarketSnapshot({ value: i });
    }
    // After trimming, the last snapshot should be the 1001st added (value=1000)
    expect(state.marketSnapshots[state.marketSnapshots.length - 1].data.value).toBe(1000);
  });
});

// ════════════════════════════════════════════════════════════
// Circuit Breakers Tests
// ════════════════════════════════════════════════════════════

describe('TradeArenaState — Circuit Breakers', () => {
  let state;

  beforeEach(() => {
    state = new TradeArenaState();
  });

  test('constructor sets default circuit breaker values', () => {
    expect(state.circuitBreakers.globalKill).toBe(false);
    expect(state.circuitBreakers.maxDrawdownPct).toBe(10);
    expect(state.circuitBreakers.gasCeiling).toBe(50);
    expect(state.circuitBreakers.aggressionLevel).toBe(8);
  });

  test('getCircuitStatus includes circuitBreakers fields', () => {
    const status = state.getCircuitStatus();
    expect(status.globalKill).toBe(false);
    expect(status.maxDrawdownPct).toBe(10);
    expect(status.gasCeiling).toBe(50);
    expect(status.aggressionLevel).toBe(8);
  });

  test('getCircuitStatus includes totalBots count', () => {
    state.createBot({});
    state.createBot({});
    expect(state.getCircuitStatus().totalBots).toBe(2);
  });

  test('getCircuitStatus includes totalTrades count', () => {
    state.logTrade({ symbol: 'BTC' });
    state.logTrade({ symbol: 'ETH' });
    expect(state.getCircuitStatus().totalTrades).toBe(2);
  });

  test('getCircuitStatus counts activeTrades with status=OPEN', () => {
    state.logTrade({ symbol: 'BTC', status: 'OPEN' });
    state.logTrade({ symbol: 'ETH', status: 'FILLED' });
    state.logTrade({ symbol: 'SOL', status: 'OPEN' });
    expect(state.getCircuitStatus().activeTrades).toBe(2);
  });

  test('updateCircuitBreakers updates specified fields', () => {
    state.updateCircuitBreakers({ globalKill: true, maxDrawdownPct: 20 });
    expect(state.circuitBreakers.globalKill).toBe(true);
    expect(state.circuitBreakers.maxDrawdownPct).toBe(20);
  });

  test('updateCircuitBreakers does not reset unspecified fields', () => {
    state.updateCircuitBreakers({ globalKill: true });
    expect(state.circuitBreakers.gasCeiling).toBe(50);
    expect(state.circuitBreakers.aggressionLevel).toBe(8);
  });

  test('updateCircuitBreakers returns updated circuitBreakers object', () => {
    const result = state.updateCircuitBreakers({ gasCeiling: 100 });
    expect(result.gasCeiling).toBe(100);
  });
});

// ════════════════════════════════════════════════════════════
// Integration: bot + trade interaction
// ════════════════════════════════════════════════════════════

describe('TradeArenaState — Bot + Trade integration', () => {
  let state;

  beforeEach(() => {
    state = new TradeArenaState();
  });

  test('bot trades array is updated when logTrade references that bot', () => {
    const bot = state.createBot({ name: 'TradeBot' });
    state.logTrade({ botId: bot.id, symbol: 'BTC', pnl: 50 });
    expect(bot.trades).toHaveLength(1);
    expect(bot.trades[0].symbol).toBe('BTC');
  });

  test('bot winRate is 100% after single winning trade', () => {
    const bot = state.createBot({});
    state.logTrade({ botId: bot.id, pnl: 1 });
    expect(bot.winRate).toBe('100.0');
  });

  test('bot winRate is 0% after single losing trade', () => {
    const bot = state.createBot({});
    state.logTrade({ botId: bot.id, pnl: -1 });
    expect(bot.winRate).toBe('0.0');
  });

  test('deleting a bot does not affect trade log', () => {
    const bot = state.createBot({});
    state.logTrade({ botId: bot.id, pnl: 10 });
    state.deleteBot(bot.id);
    expect(state.trades).toHaveLength(1);
  });
});