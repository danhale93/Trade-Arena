'use strict';
/**
 * Tests for mcp-server.js – new file added in this PR
 *
 * Focuses on the TradeArenaState class (accessed via the exported `state`
 * singleton) since it contains all the in-memory business logic and is the
 * only safely testable portion of the module (the MCP / Express wiring
 * requires live transport / HTTP connections).
 */

// ── Mock external dependencies not present in the test environment ──────────

jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: class MockServer {
    setRequestHandler() {}
    async connect() {}
  },
}), { virtual: true });

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: class MockStdioTransport {},
}), { virtual: true });

jest.mock('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolRequestSchema: 'CallToolRequestSchema',
  ListToolsRequestSchema: 'ListToolsRequestSchema',
  ListResourcesRequestSchema: 'ListResourcesRequestSchema',
  ReadResourceRequestSchema: 'ReadResourceRequestSchema',
  ListPromptsRequestSchema: 'ListPromptsRequestSchema',
  GetPromptRequestSchema: 'GetPromptRequestSchema',
}), { virtual: true });

jest.mock('axios', () => ({
  get: jest.fn(),
  default: jest.fn(),
}));

// mcp-server.js is guarded: `if (require.main === module) { startStdioServer() }`
// so it is safe to require without side-effects.
const mcpServer = require('./mcp-server');
const { state, TRADING_TOOLS, RESOURCES, PROMPTS } = mcpServer;

// Reset the shared state singleton before each test so tests are isolated
beforeEach(() => {
  state.bots.clear();
  state.trades = [];
  state.priceCache.clear();
  state.cacheTimestamps.clear();
  state.marketSnapshots = [];
  state.agentPerformance.clear();
  state.circuitBreakers = {
    globalKill: false,
    maxDrawdownPct: 10,
    gasCeiling: 50,
    aggressionLevel: 8,
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// Module exports shape
// ─────────────────────────────────────────────────────────────────────────────
describe('mcp-server module exports', () => {
  it('should export a state object', () => {
    expect(state).toBeDefined();
    expect(typeof state).toBe('object');
  });

  it('should export TRADING_TOOLS as a non-empty array', () => {
    expect(Array.isArray(TRADING_TOOLS)).toBe(true);
    expect(TRADING_TOOLS.length).toBeGreaterThan(0);
  });

  it('should export RESOURCES as a non-empty array', () => {
    expect(Array.isArray(RESOURCES)).toBe(true);
    expect(RESOURCES.length).toBeGreaterThan(0);
  });

  it('should export PROMPTS as a non-empty array', () => {
    expect(Array.isArray(PROMPTS)).toBe(true);
    expect(PROMPTS.length).toBeGreaterThan(0);
  });

  it('TRADING_TOOLS should contain a get_market_data tool', () => {
    const tool = TRADING_TOOLS.find(t => t.name === 'get_market_data');
    expect(tool).toBeDefined();
  });

  it('TRADING_TOOLS should contain a create_trading_bot tool', () => {
    const tool = TRADING_TOOLS.find(t => t.name === 'create_trading_bot');
    expect(tool).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TradeArenaState – Bot Management
// ─────────────────────────────────────────────────────────────────────────────
describe('TradeArenaState – createBot', () => {
  it('should create a bot with a unique id', () => {
    const bot = state.createBot({ name: 'Test Bot' });
    expect(bot.id).toBeDefined();
    expect(typeof bot.id).toBe('string');
    expect(bot.id).toMatch(/^bot_/);
  });

  it('should use provided name', () => {
    const bot = state.createBot({ name: 'MyBot' });
    expect(bot.name).toBe('MyBot');
  });

  it('should default name when not provided', () => {
    const bot = state.createBot({});
    expect(typeof bot.name).toBe('string');
    expect(bot.name.length).toBeGreaterThan(0);
  });

  it('should default strategy to BALANCED', () => {
    const bot = state.createBot({});
    expect(bot.strategy).toBe('BALANCED');
  });

  it('should use provided strategy', () => {
    const bot = state.createBot({ strategy: 'MOMENTUM' });
    expect(bot.strategy).toBe('MOMENTUM');
  });

  it('should default riskLevel to MODERATE', () => {
    const bot = state.createBot({});
    expect(bot.riskLevel).toBe('MODERATE');
  });

  it('should default initialCapital to 1000', () => {
    const bot = state.createBot({});
    expect(bot.initialCapital).toBe(1000);
  });

  it('should set active=true and status=ACTIVE', () => {
    const bot = state.createBot({});
    expect(bot.active).toBe(true);
    expect(bot.status).toBe('ACTIVE');
  });

  it('should default autoMode to true', () => {
    const bot = state.createBot({});
    expect(bot.autoMode).toBe(true);
  });

  it('should set autoMode=false when specified', () => {
    const bot = state.createBot({ autoMode: false });
    expect(bot.autoMode).toBe(false);
  });

  it('should initialise trades=[], totalPnl=0, winRate=0', () => {
    const bot = state.createBot({});
    expect(bot.trades).toEqual([]);
    expect(bot.totalPnl).toBe(0);
    expect(bot.winRate).toBe(0);
  });

  it('should store the bot so it can be retrieved', () => {
    const bot = state.createBot({ name: 'Stored Bot' });
    expect(state.getBot(bot.id)).toBe(bot);
  });

  it('should generate unique IDs for multiple bots', () => {
    const ids = new Set();
    for (let i = 0; i < 10; i++) {
      ids.add(state.createBot({}).id);
    }
    expect(ids.size).toBe(10);
  });
});

describe('TradeArenaState – getBot / getAllBots / deleteBot', () => {
  it('getBot should return undefined for unknown id', () => {
    expect(state.getBot('nonexistent')).toBeUndefined();
  });

  it('getAllBots should return empty array when no bots', () => {
    expect(state.getAllBots()).toEqual([]);
  });

  it('getAllBots should return all created bots', () => {
    state.createBot({ name: 'A' });
    state.createBot({ name: 'B' });
    expect(state.getAllBots()).toHaveLength(2);
  });

  it('deleteBot should remove the bot', () => {
    const bot = state.createBot({});
    expect(state.deleteBot(bot.id)).toBe(true);
    expect(state.getBot(bot.id)).toBeUndefined();
  });

  it('deleteBot should return false for unknown id', () => {
    expect(state.deleteBot('ghost')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TradeArenaState – Trade Logging
// ─────────────────────────────────────────────────────────────────────────────
describe('TradeArenaState – logTrade', () => {
  it('should add a trade entry to the trades array', () => {
    state.logTrade({ symbol: 'BTC', side: 'BUY', pnl: 10 });
    expect(state.trades).toHaveLength(1);
  });

  it('should assign a unique id to each trade', () => {
    const t1 = state.logTrade({ symbol: 'BTC', pnl: 5 });
    const t2 = state.logTrade({ symbol: 'ETH', pnl: 3 });
    expect(t1.id).not.toBe(t2.id);
    expect(t1.id).toMatch(/^trade_/);
  });

  it('should include a timestamp in each trade entry', () => {
    const trade = state.logTrade({ symbol: 'SOL', pnl: 1 });
    expect(trade.timestamp).toBeDefined();
    // Should be a valid ISO string
    expect(new Date(trade.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('should spread original trade properties onto the entry', () => {
    const trade = state.logTrade({ symbol: 'ETH', side: 'SELL', strategy: 'MOMENTUM', pnl: -5 });
    expect(trade.symbol).toBe('ETH');
    expect(trade.side).toBe('SELL');
    expect(trade.strategy).toBe('MOMENTUM');
    expect(trade.pnl).toBe(-5);
  });

  it('should update bot totalPnl when botId matches a known bot', () => {
    const bot = state.createBot({ name: 'PnL Bot' });
    state.logTrade({ botId: bot.id, pnl: 20 });
    expect(state.getBot(bot.id).totalPnl).toBe(20);
    state.logTrade({ botId: bot.id, pnl: 10 });
    expect(state.getBot(bot.id).totalPnl).toBe(30);
  });

  it('should update bot winRate based on profitable trades', () => {
    const bot = state.createBot({});
    state.logTrade({ botId: bot.id, pnl: 10 });  // win
    state.logTrade({ botId: bot.id, pnl: -5 });  // loss
    // 1 win out of 2 trades = 50%
    expect(parseFloat(state.getBot(bot.id).winRate)).toBe(50.0);
  });

  it('winRate should be 100 when all trades are profitable', () => {
    const bot = state.createBot({});
    state.logTrade({ botId: bot.id, pnl: 10 });
    state.logTrade({ botId: bot.id, pnl: 5 });
    expect(parseFloat(state.getBot(bot.id).winRate)).toBe(100.0);
  });

  it('winRate should be 0 when all trades are losses', () => {
    const bot = state.createBot({});
    state.logTrade({ botId: bot.id, pnl: -10 });
    state.logTrade({ botId: bot.id, pnl: -5 });
    expect(parseFloat(state.getBot(bot.id).winRate)).toBe(0.0);
  });

  it('should not update bot when botId does not exist in bots map', () => {
    // Should not throw
    expect(() => {
      state.logTrade({ botId: 'ghost_bot', pnl: 100 });
    }).not.toThrow();
    expect(state.trades).toHaveLength(1);
  });

  it('should handle undefined pnl as 0 for bot totalPnl', () => {
    const bot = state.createBot({});
    state.logTrade({ botId: bot.id }); // no pnl
    expect(state.getBot(bot.id).totalPnl).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TradeArenaState – getTrades filtering
// ─────────────────────────────────────────────────────────────────────────────
describe('TradeArenaState – getTrades', () => {
  beforeEach(() => {
    state.logTrade({ botId: 'bot1', symbol: 'BTC', strategy: 'MOMENTUM', pnl: 10 });
    state.logTrade({ botId: 'bot1', symbol: 'ETH', strategy: 'ARBITRAGE', pnl: -5 });
    state.logTrade({ botId: 'bot2', symbol: 'BTC', strategy: 'MOMENTUM', pnl: 7 });
    state.logTrade({ botId: 'bot2', symbol: 'SOL', strategy: 'GRID', pnl: 3 });
  });

  it('should return all trades when no filters', () => {
    expect(state.getTrades()).toHaveLength(4);
  });

  it('should filter by botId', () => {
    const trades = state.getTrades({ botId: 'bot1' });
    expect(trades).toHaveLength(2);
    trades.forEach(t => expect(t.botId).toBe('bot1'));
  });

  it('should filter by symbol', () => {
    const trades = state.getTrades({ symbol: 'BTC' });
    expect(trades).toHaveLength(2);
    trades.forEach(t => expect(t.symbol).toBe('BTC'));
  });

  it('should filter by strategy', () => {
    const trades = state.getTrades({ strategy: 'MOMENTUM' });
    expect(trades).toHaveLength(2);
    trades.forEach(t => expect(t.strategy).toBe('MOMENTUM'));
  });

  it('should limit results to last N trades', () => {
    const trades = state.getTrades({ limit: 2 });
    expect(trades).toHaveLength(2);
    // Last 2 trades should be the most recently added
    expect(trades[1].symbol).toBe('SOL');
  });

  it('should return empty array when filter matches nothing', () => {
    expect(state.getTrades({ botId: 'nonexistent' })).toEqual([]);
  });

  it('should combine filters (botId + symbol)', () => {
    const trades = state.getTrades({ botId: 'bot1', symbol: 'BTC' });
    expect(trades).toHaveLength(1);
    expect(trades[0].symbol).toBe('BTC');
    expect(trades[0].botId).toBe('bot1');
  });

  it('should not mutate the internal trades array', () => {
    const result = state.getTrades();
    result.push({ fake: true });
    expect(state.trades).toHaveLength(4); // unchanged
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TradeArenaState – Price Caching
// ─────────────────────────────────────────────────────────────────────────────
describe('TradeArenaState – price caching', () => {
  it('getCachedPrice should return null for a key never set', () => {
    expect(state.getCachedPrice('BTC_usd')).toBeNull();
  });

  it('getCachedPrice should return cached value immediately after setCachedPrice', () => {
    state.setCachedPrice('ETH_usd', { price: 2500 });
    expect(state.getCachedPrice('ETH_usd')).toEqual({ price: 2500 });
  });

  it('getCachedPrice should return null after TTL expires', () => {
    const realNow = Date.now;
    // Set a price
    state.setCachedPrice('SOL_usd', { price: 150 });

    // Advance mock time beyond the 30-second TTL (30001 ms)
    const futureTime = Date.now() + 30001;
    jest.spyOn(Date, 'now').mockReturnValue(futureTime);

    try {
      expect(state.getCachedPrice('SOL_usd')).toBeNull();
    } finally {
      Date.now = realNow;
      jest.restoreAllMocks();
    }
  });

  it('getCachedPrice should return the value when within TTL', () => {
    state.setCachedPrice('MATIC_usd', { price: 0.8 });
    // Within TTL (only 1 second later)
    const slightlyLater = Date.now() + 1000;
    jest.spyOn(Date, 'now').mockReturnValue(slightlyLater);
    try {
      expect(state.getCachedPrice('MATIC_usd')).toEqual({ price: 0.8 });
    } finally {
      jest.restoreAllMocks();
    }
  });

  it('setCachedPrice should overwrite an existing entry', () => {
    state.setCachedPrice('BTC_usd', { price: 40000 });
    state.setCachedPrice('BTC_usd', { price: 42000 });
    expect(state.getCachedPrice('BTC_usd')).toEqual({ price: 42000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TradeArenaState – Market Snapshots
// ─────────────────────────────────────────────────────────────────────────────
describe('TradeArenaState – addMarketSnapshot', () => {
  it('should add a snapshot with timestamp and data', () => {
    state.addMarketSnapshot({ prices: [1, 2, 3] });
    expect(state.marketSnapshots).toHaveLength(1);
    expect(state.marketSnapshots[0].data).toEqual({ prices: [1, 2, 3] });
    expect(state.marketSnapshots[0].timestamp).toBeDefined();
  });

  it('should trim to 500 snapshots when exceeding 1000', () => {
    // Fill to 1000
    for (let i = 0; i < 1000; i++) {
      state.marketSnapshots.push({ i, timestamp: new Date().toISOString(), data: {} });
    }
    expect(state.marketSnapshots).toHaveLength(1000);

    // Adding one more triggers the trim
    state.addMarketSnapshot({ trigger: true });
    expect(state.marketSnapshots).toHaveLength(500);
  });

  it('should retain the most recent snapshots after trimming', () => {
    // Push 1000 entries with sequential values
    for (let i = 0; i < 1000; i++) {
      state.marketSnapshots.push({ value: i, timestamp: new Date().toISOString(), data: { v: i } });
    }
    state.addMarketSnapshot({ value: 1000 });
    // After trim: last 500 of original 1000, then the new one → 500 entries total
    // The last entry should be the newest
    const last = state.marketSnapshots[state.marketSnapshots.length - 1];
    expect(last.data).toEqual({ value: 1000 });
  });

  it('should not trim when snapshot count is below 1000', () => {
    for (let i = 0; i < 50; i++) {
      state.addMarketSnapshot({ i });
    }
    expect(state.marketSnapshots).toHaveLength(50);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TradeArenaState – Circuit Breakers
// ─────────────────────────────────────────────────────────────────────────────
describe('TradeArenaState – circuit breakers', () => {
  it('getCircuitStatus should include default circuit breaker values', () => {
    const status = state.getCircuitStatus();
    expect(status.globalKill).toBe(false);
    expect(status.maxDrawdownPct).toBe(10);
    expect(status.gasCeiling).toBe(50);
    expect(status.aggressionLevel).toBe(8);
  });

  it('getCircuitStatus should include totalBots count', () => {
    state.createBot({});
    state.createBot({});
    const status = state.getCircuitStatus();
    expect(status.totalBots).toBe(2);
  });

  it('getCircuitStatus should count activeTrades (status=OPEN)', () => {
    state.logTrade({ symbol: 'BTC', status: 'OPEN', pnl: 0 });
    state.logTrade({ symbol: 'ETH', status: 'CLOSED', pnl: 5 });
    const status = state.getCircuitStatus();
    expect(status.activeTrades).toBe(1);
  });

  it('getCircuitStatus should include totalTrades', () => {
    state.logTrade({ symbol: 'BTC', pnl: 1 });
    state.logTrade({ symbol: 'ETH', pnl: 2 });
    const status = state.getCircuitStatus();
    expect(status.totalTrades).toBe(2);
  });

  it('updateCircuitBreakers should update individual fields', () => {
    state.updateCircuitBreakers({ globalKill: true, maxDrawdownPct: 20 });
    expect(state.circuitBreakers.globalKill).toBe(true);
    expect(state.circuitBreakers.maxDrawdownPct).toBe(20);
    // Other fields unchanged
    expect(state.circuitBreakers.gasCeiling).toBe(50);
  });

  it('updateCircuitBreakers should return updated circuit breakers', () => {
    const result = state.updateCircuitBreakers({ aggressionLevel: 5 });
    expect(result.aggressionLevel).toBe(5);
  });

  it('getCircuitStatus should reflect updates from updateCircuitBreakers', () => {
    state.updateCircuitBreakers({ globalKill: true });
    const status = state.getCircuitStatus();
    expect(status.globalKill).toBe(true);
  });
});
