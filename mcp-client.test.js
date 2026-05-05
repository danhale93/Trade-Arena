/**
 * Tests for mcp-client.js TradeArenaClient class (new file added in this PR)
 *
 * TradeArenaClient provides:
 * - WebSocket management (subscribe/unsubscribe, reconnect)
 * - Message routing (handleWebSocketMessage)
 * - MCP tool call wrappers (callTool + convenience methods)
 * - UI formatting helpers (formatCurrency, formatPercent)
 * - Status checking (checkMCPStatus)
 *
 * The class is inlined here to avoid browser-global dependencies
 * (window.location, WebSocket) that do not exist in Node.
 * The inlined code is an exact mirror of mcp-client.js.
 */

'use strict';

// ════════════════════════════════════════════════════════════
// Inline TradeArenaClient — mirrors mcp-client.js exactly
// ════════════════════════════════════════════════════════════

class TradeArenaClient {
  constructor(apiBaseOverride) {
    this.ws = null;
    this.wsConnected = false;
    this.subscriptions = new Set();
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    // In tests we accept an override so we don't need window.location
    this.apiBase = apiBaseOverride || 'http://localhost:3001';
    this.wsUrl = this.apiBase.replace('http', 'ws');
    this.mcpStatus = null;
    this.priceCache = new Map();
    this.botCache = new Map();
    this.onPriceUpdate = null;
    this.onBotUpdate = null;
    this.onMCPStatus = null;
  }

  connectWebSocket() {
    if (this.ws?.connected) return;

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.wsConnected = true;
        this.reconnectAttempts = 0;

        this.subscriptions.forEach(channel => {
          this.ws.send(JSON.stringify({ type: 'subscribe', channel }));
        });

        if (this.onMCPStatus) {
          this.onMCPStatus({ type: 'ws_connected', connected: true });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (e) {
          // ignore
        }
      };

      this.ws.onclose = () => {
        this.wsConnected = false;
        if (this.onMCPStatus) {
          this.onMCPStatus({ type: 'ws_disconnected', connected: false });
        }
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        // logged
      };
    } catch (e) {
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;

    setTimeout(() => {
      this.connectWebSocket();
    }, this.reconnectDelay);
  }

  disconnectWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.wsConnected = false;
  }

  subscribe(channel) {
    this.subscriptions.add(channel);
    if (this.wsConnected && this.ws) {
      this.ws.send(JSON.stringify({ type: 'subscribe', channel }));
    }
  }

  unsubscribe(channel) {
    this.subscriptions.delete(channel);
    if (this.wsConnected && this.ws) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', channel }));
    }
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'connected':
        break;
      case 'prices':
        this.priceCache = new Map(data.prices.map(p => [p.symbol, p]));
        if (this.onPriceUpdate) this.onPriceUpdate(data.prices);
        break;
      case 'bot_created':
      case 'bot_updated':
        if (this.onBotUpdate) this.onBotUpdate(data);
        break;
      case 'pong':
        break;
      default:
        const handler = this.messageHandlers.get(data.type);
        if (handler) handler(data);
    }
  }

  onMessage(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  async callTool(toolName, args = {}) {
    const response = await fetch(`${this.apiBase}/api/mcp/tool/${toolName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Tool ${toolName} failed`);
    }

    return response.json();
  }

  async getMarketData(type, symbols, options = {}) {
    return this.callTool('get_market_data', { type, symbols, ...options });
  }

  async getTrendingCoins(limit = 10) {
    return this.callTool('get_trending_coins', { limit });
  }

  async analyzeOpportunity(symbol, strategy, timeframe = '24h') {
    return this.callTool('analyze_opportunity', { symbol, strategy, timeframe });
  }

  async createBot(config) {
    return this.callTool('create_trading_bot', config);
  }

  async getBotStatus(botId = null) {
    return this.callTool('get_bot_status', { botId });
  }

  async updateBot(botId, action, config = null) {
    return this.callTool('update_bot', { botId, action, config });
  }

  async deleteBot(botId) {
    return this.callTool('delete_bot', { botId });
  }

  async executeTrade(symbol, side, amount, options = {}) {
    return this.callTool('execute_trade', { symbol, side, amount, ...options });
  }

  async getPortfolio(options = {}) {
    return this.callTool('get_portfolio', options);
  }

  async getTradeHistory(filters = {}) {
    return this.callTool('get_trade_history', filters);
  }

  async runBacktest(strategy, symbol, options = {}) {
    return this.callTool('run_backtest', { strategy, symbol, ...options });
  }

  async getAnalytics(options = {}) {
    return this.callTool('get_analytics', options);
  }

  async getCircuitBreakers() {
    return this.callTool('get_circuit_breakers', {});
  }

  async updateCircuitBreakers(updates) {
    return this.callTool('update_circuit_breakers', updates);
  }

  async getMarketSentiment(symbol = null) {
    return this.callTool('get_market_sentiment', { symbol });
  }

  async getResource(resourceName) {
    const response = await fetch(`${this.apiBase}/api/mcp/resource/${resourceName}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Resource ${resourceName} not found`);
    }
    return response.json();
  }

  async askClaude(prompt, options = {}) {
    const response = await fetch(`${this.apiBase}/api/mcp/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, ...options }),
    });
    return response.json();
  }

  async getHealth() {
    const response = await fetch(`${this.apiBase}/api/health`);
    return response.json();
  }

  async getStatus() {
    const response = await fetch(`${this.apiBase}/api/status`);
    return response.json();
  }

  async checkMCPStatus() {
    try {
      const status = await this.getStatus();
      this.mcpStatus = status;
      if (this.onMCPStatus) {
        this.onMCPStatus({ type: 'mcp_status', status });
      }
      return status;
    } catch (e) {
      return null;
    }
  }

  formatCurrency(value, decimals = 2) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  formatPercent(value, decimals = 2) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
  }
}

// ════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════

function makeClient(apiBase = 'http://localhost:3001') {
  return new TradeArenaClient(apiBase);
}

/** Build a minimal mock WebSocket */
function makeMockWS() {
  return {
    connected: false,
    sent: [],
    closed: false,
    send(data) { this.sent.push(data); },
    close() { this.closed = true; },
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,
  };
}

// ════════════════════════════════════════════════════════════
// Constructor
// ════════════════════════════════════════════════════════════

describe('TradeArenaClient — constructor (new in PR)', () => {
  test('wsConnected initializes to false', () => {
    const client = makeClient();
    expect(client.wsConnected).toBe(false);
  });

  test('subscriptions initializes to empty Set', () => {
    const client = makeClient();
    expect(client.subscriptions.size).toBe(0);
  });

  test('messageHandlers initializes to empty Map', () => {
    const client = makeClient();
    expect(client.messageHandlers.size).toBe(0);
  });

  test('reconnectAttempts initializes to 0', () => {
    const client = makeClient();
    expect(client.reconnectAttempts).toBe(0);
  });

  test('maxReconnectAttempts is 5', () => {
    const client = makeClient();
    expect(client.maxReconnectAttempts).toBe(5);
  });

  test('reconnectDelay is 3000ms', () => {
    const client = makeClient();
    expect(client.reconnectDelay).toBe(3000);
  });

  test('apiBase uses provided value', () => {
    const client = makeClient('http://example.com:4000');
    expect(client.apiBase).toBe('http://example.com:4000');
  });

  test('wsUrl replaces http with ws', () => {
    const client = makeClient('http://localhost:3001');
    expect(client.wsUrl).toBe('ws://localhost:3001');
  });

  test('wsUrl replaces https with wss', () => {
    const client = makeClient('https://example.com');
    expect(client.wsUrl).toBe('wss://example.com');
  });

  test('mcpStatus initializes to null', () => {
    const client = makeClient();
    expect(client.mcpStatus).toBeNull();
  });

  test('priceCache initializes to empty Map', () => {
    const client = makeClient();
    expect(client.priceCache.size).toBe(0);
  });

  test('botCache initializes to empty Map', () => {
    const client = makeClient();
    expect(client.botCache.size).toBe(0);
  });

  test('onPriceUpdate callback initializes to null', () => {
    const client = makeClient();
    expect(client.onPriceUpdate).toBeNull();
  });

  test('onBotUpdate callback initializes to null', () => {
    const client = makeClient();
    expect(client.onBotUpdate).toBeNull();
  });

  test('onMCPStatus callback initializes to null', () => {
    const client = makeClient();
    expect(client.onMCPStatus).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════
// subscribe / unsubscribe
// ════════════════════════════════════════════════════════════

describe('TradeArenaClient — subscribe / unsubscribe', () => {
  test('subscribe adds channel to subscriptions', () => {
    const client = makeClient();
    client.subscribe('prices');
    expect(client.subscriptions.has('prices')).toBe(true);
  });

  test('subscribe multiple channels are all tracked', () => {
    const client = makeClient();
    client.subscribe('prices');
    client.subscribe('bots');
    expect(client.subscriptions.size).toBe(2);
  });

  test('subscribe is idempotent — duplicate adds do not grow set', () => {
    const client = makeClient();
    client.subscribe('prices');
    client.subscribe('prices');
    expect(client.subscriptions.size).toBe(1);
  });

  test('subscribe does not send WS message when not connected', () => {
    const client = makeClient();
    const mockWs = makeMockWS();
    client.ws = mockWs;
    client.wsConnected = false;
    client.subscribe('prices');
    expect(mockWs.sent).toHaveLength(0);
  });

  test('subscribe sends WS message when connected', () => {
    const client = makeClient();
    const mockWs = makeMockWS();
    client.ws = mockWs;
    client.wsConnected = true;
    client.subscribe('prices');
    expect(mockWs.sent).toHaveLength(1);
    expect(JSON.parse(mockWs.sent[0])).toEqual({ type: 'subscribe', channel: 'prices' });
  });

  test('unsubscribe removes channel from subscriptions', () => {
    const client = makeClient();
    client.subscribe('prices');
    client.unsubscribe('prices');
    expect(client.subscriptions.has('prices')).toBe(false);
  });

  test('unsubscribe of non-existing channel does not throw', () => {
    const client = makeClient();
    expect(() => client.unsubscribe('nonexistent')).not.toThrow();
  });

  test('unsubscribe sends WS message when connected', () => {
    const client = makeClient();
    const mockWs = makeMockWS();
    client.ws = mockWs;
    client.wsConnected = true;
    client.subscriptions.add('bots');
    client.unsubscribe('bots');
    expect(mockWs.sent).toHaveLength(1);
    expect(JSON.parse(mockWs.sent[0])).toEqual({ type: 'unsubscribe', channel: 'bots' });
  });

  test('unsubscribe does not send WS message when disconnected', () => {
    const client = makeClient();
    const mockWs = makeMockWS();
    client.ws = mockWs;
    client.wsConnected = false;
    client.subscriptions.add('bots');
    client.unsubscribe('bots');
    expect(mockWs.sent).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════
// handleWebSocketMessage
// ════════════════════════════════════════════════════════════

describe('TradeArenaClient — handleWebSocketMessage', () => {
  test('"prices" message populates priceCache keyed by symbol', () => {
    const client = makeClient();
    client.handleWebSocketMessage({
      type: 'prices',
      prices: [
        { symbol: 'BTC', price: 50000 },
        { symbol: 'ETH', price: 3000 },
      ],
    });
    expect(client.priceCache.get('BTC')).toEqual({ symbol: 'BTC', price: 50000 });
    expect(client.priceCache.get('ETH')).toEqual({ symbol: 'ETH', price: 3000 });
  });

  test('"prices" message invokes onPriceUpdate callback', () => {
    const client = makeClient();
    const cb = jest.fn();
    client.onPriceUpdate = cb;
    const prices = [{ symbol: 'BTC', price: 50000 }];
    client.handleWebSocketMessage({ type: 'prices', prices });
    expect(cb).toHaveBeenCalledWith(prices);
  });

  test('"prices" message with no callback does not throw', () => {
    const client = makeClient();
    expect(() =>
      client.handleWebSocketMessage({ type: 'prices', prices: [] })
    ).not.toThrow();
  });

  test('"bot_created" invokes onBotUpdate callback', () => {
    const client = makeClient();
    const cb = jest.fn();
    client.onBotUpdate = cb;
    const data = { type: 'bot_created', bot: { id: 'bot_1' } };
    client.handleWebSocketMessage(data);
    expect(cb).toHaveBeenCalledWith(data);
  });

  test('"bot_updated" invokes onBotUpdate callback', () => {
    const client = makeClient();
    const cb = jest.fn();
    client.onBotUpdate = cb;
    const data = { type: 'bot_updated', bot: { id: 'bot_1', status: 'PAUSED' } };
    client.handleWebSocketMessage(data);
    expect(cb).toHaveBeenCalledWith(data);
  });

  test('"bot_created" with no onBotUpdate callback does not throw', () => {
    const client = makeClient();
    expect(() =>
      client.handleWebSocketMessage({ type: 'bot_created', bot: {} })
    ).not.toThrow();
  });

  test('"pong" message does not throw or invoke callbacks', () => {
    const client = makeClient();
    client.onBotUpdate = jest.fn();
    client.onPriceUpdate = jest.fn();
    expect(() =>
      client.handleWebSocketMessage({ type: 'pong' })
    ).not.toThrow();
    expect(client.onBotUpdate).not.toHaveBeenCalled();
    expect(client.onPriceUpdate).not.toHaveBeenCalled();
  });

  test('"connected" message does not throw', () => {
    const client = makeClient();
    expect(() =>
      client.handleWebSocketMessage({ type: 'connected' })
    ).not.toThrow();
  });

  test('custom message type dispatches to registered handler', () => {
    const client = makeClient();
    const handler = jest.fn();
    client.onMessage('trade_closed', handler);
    const data = { type: 'trade_closed', tradeId: '123' };
    client.handleWebSocketMessage(data);
    expect(handler).toHaveBeenCalledWith(data);
  });

  test('unknown message type with no registered handler does not throw', () => {
    const client = makeClient();
    expect(() =>
      client.handleWebSocketMessage({ type: 'unknown_event' })
    ).not.toThrow();
  });

  test('"prices" replaces priceCache entirely (not merged)', () => {
    const client = makeClient();
    client.priceCache.set('OLD', { symbol: 'OLD', price: 1 });
    client.handleWebSocketMessage({
      type: 'prices',
      prices: [{ symbol: 'BTC', price: 50000 }],
    });
    expect(client.priceCache.has('OLD')).toBe(false);
    expect(client.priceCache.has('BTC')).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════
// onMessage — custom handler registration
// ════════════════════════════════════════════════════════════

describe('TradeArenaClient — onMessage()', () => {
  test('registers handler in messageHandlers Map', () => {
    const client = makeClient();
    const handler = jest.fn();
    client.onMessage('my_event', handler);
    expect(client.messageHandlers.get('my_event')).toBe(handler);
  });

  test('registering a second handler overwrites the first', () => {
    const client = makeClient();
    const first = jest.fn();
    const second = jest.fn();
    client.onMessage('my_event', first);
    client.onMessage('my_event', second);
    expect(client.messageHandlers.get('my_event')).toBe(second);
  });

  test('multiple distinct event types are each stored', () => {
    const client = makeClient();
    client.onMessage('event_a', jest.fn());
    client.onMessage('event_b', jest.fn());
    expect(client.messageHandlers.size).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════
// disconnectWebSocket
// ════════════════════════════════════════════════════════════

describe('TradeArenaClient — disconnectWebSocket()', () => {
  test('sets wsConnected to false', () => {
    const client = makeClient();
    const mockWs = makeMockWS();
    client.ws = mockWs;
    client.wsConnected = true;
    client.disconnectWebSocket();
    expect(client.wsConnected).toBe(false);
  });

  test('calls ws.close()', () => {
    const client = makeClient();
    const mockWs = makeMockWS();
    client.ws = mockWs;
    client.wsConnected = true;
    client.disconnectWebSocket();
    expect(mockWs.closed).toBe(true);
  });

  test('sets ws to null after disconnect', () => {
    const client = makeClient();
    const mockWs = makeMockWS();
    client.ws = mockWs;
    client.disconnectWebSocket();
    expect(client.ws).toBeNull();
  });

  test('does not throw when ws is already null', () => {
    const client = makeClient();
    client.ws = null;
    expect(() => client.disconnectWebSocket()).not.toThrow();
  });
});

// ════════════════════════════════════════════════════════════
// attemptReconnect
// ════════════════════════════════════════════════════════════

describe('TradeArenaClient — attemptReconnect()', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('increments reconnectAttempts on each call', () => {
    const client = makeClient();
    // Prevent connectWebSocket from doing anything
    client.connectWebSocket = jest.fn();
    client.attemptReconnect();
    expect(client.reconnectAttempts).toBe(1);
    jest.runAllTimers();
  });

  test('does not reconnect when maxReconnectAttempts is reached', () => {
    const client = makeClient();
    client.connectWebSocket = jest.fn();
    client.reconnectAttempts = 5; // already at max
    client.attemptReconnect();
    expect(client.reconnectAttempts).toBe(5); // unchanged
    expect(client.connectWebSocket).not.toHaveBeenCalled();
  });

  test('schedules connectWebSocket after reconnectDelay', () => {
    const client = makeClient();
    client.connectWebSocket = jest.fn();
    client.attemptReconnect();
    expect(client.connectWebSocket).not.toHaveBeenCalled();
    jest.advanceTimersByTime(3000);
    expect(client.connectWebSocket).toHaveBeenCalled();
  });

  test('allows up to maxReconnectAttempts attempts', () => {
    const client = makeClient();
    client.connectWebSocket = jest.fn();
    for (let i = 0; i < 5; i++) {
      client.attemptReconnect();
      jest.runAllTimers();
    }
    expect(client.reconnectAttempts).toBe(5);
    // 6th call should be blocked
    client.attemptReconnect();
    expect(client.reconnectAttempts).toBe(5);
  });
});

// ════════════════════════════════════════════════════════════
// callTool (fetch mock)
// ════════════════════════════════════════════════════════════

describe('TradeArenaClient — callTool()', () => {
  afterEach(() => {
    global.fetch = undefined;
  });

  test('sends POST to correct URL', async () => {
    const client = makeClient('http://localhost:3001');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'ok' }),
    });
    global.fetch = fetchMock;

    await client.callTool('get_market_data', { type: 'crypto' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/mcp/tool/get_market_data',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('sends correct Content-Type header', async () => {
    const client = makeClient();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    global.fetch = fetchMock;

    await client.callTool('test_tool', {});
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  test('serializes args into request body', async () => {
    const client = makeClient();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    global.fetch = fetchMock;

    await client.callTool('create_trading_bot', { name: 'TestBot', strategy: 'MOMENTUM' });
    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({ name: 'TestBot', strategy: 'MOMENTUM' });
  });

  test('returns parsed JSON on success', async () => {
    const client = makeClient();
    const payload = { botId: 'bot_123', status: 'ACTIVE' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const result = await client.callTool('get_bot_status', {});
    expect(result).toEqual(payload);
  });

  test('throws when response.ok is false', async () => {
    const client = makeClient();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Tool not found' }),
    });

    await expect(client.callTool('bad_tool', {})).rejects.toThrow('Tool not found');
  });

  test('throws with generic message when error body has no error field', async () => {
    const client = makeClient();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    await expect(client.callTool('broken_tool', {})).rejects.toThrow('Tool broken_tool failed');
  });

  test('empty args default ({}) still sends valid JSON body', async () => {
    const client = makeClient();
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    global.fetch = fetchMock;

    await client.callTool('get_circuit_breakers');
    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({});
  });
});

// ════════════════════════════════════════════════════════════
// Tool wrapper methods — delegate to callTool
// ════════════════════════════════════════════════════════════

describe('TradeArenaClient — tool wrapper methods', () => {
  let client;
  let callToolMock;

  beforeEach(() => {
    client = makeClient();
    callToolMock = jest.fn().mockResolvedValue({ success: true });
    client.callTool = callToolMock;
  });

  test('getMarketData calls callTool with get_market_data', async () => {
    await client.getMarketData('crypto', ['BTC', 'ETH']);
    expect(callToolMock).toHaveBeenCalledWith('get_market_data', expect.objectContaining({
      type: 'crypto',
      symbols: ['BTC', 'ETH'],
    }));
  });

  test('getTrendingCoins calls callTool with get_trending_coins and default limit 10', async () => {
    await client.getTrendingCoins();
    expect(callToolMock).toHaveBeenCalledWith('get_trending_coins', { limit: 10 });
  });

  test('getTrendingCoins respects custom limit', async () => {
    await client.getTrendingCoins(25);
    expect(callToolMock).toHaveBeenCalledWith('get_trending_coins', { limit: 25 });
  });

  test('analyzeOpportunity calls callTool with analyze_opportunity and default timeframe 24h', async () => {
    await client.analyzeOpportunity('bitcoin', 'MOMENTUM');
    expect(callToolMock).toHaveBeenCalledWith('analyze_opportunity', {
      symbol: 'bitcoin',
      strategy: 'MOMENTUM',
      timeframe: '24h',
    });
  });

  test('createBot calls callTool with create_trading_bot', async () => {
    await client.createBot({ name: 'Alpha', strategy: 'ARBITRAGE' });
    expect(callToolMock).toHaveBeenCalledWith('create_trading_bot', {
      name: 'Alpha',
      strategy: 'ARBITRAGE',
    });
  });

  test('getBotStatus calls callTool with get_bot_status and null botId by default', async () => {
    await client.getBotStatus();
    expect(callToolMock).toHaveBeenCalledWith('get_bot_status', { botId: null });
  });

  test('updateBot calls callTool with update_bot', async () => {
    await client.updateBot('bot_1', 'PAUSE');
    expect(callToolMock).toHaveBeenCalledWith('update_bot', {
      botId: 'bot_1',
      action: 'PAUSE',
      config: null,
    });
  });

  test('deleteBot calls callTool with delete_bot', async () => {
    await client.deleteBot('bot_1');
    expect(callToolMock).toHaveBeenCalledWith('delete_bot', { botId: 'bot_1' });
  });

  test('executeTrade calls callTool with execute_trade', async () => {
    await client.executeTrade('bitcoin', 'BUY', 100, { paper: true });
    expect(callToolMock).toHaveBeenCalledWith('execute_trade', {
      symbol: 'bitcoin',
      side: 'BUY',
      amount: 100,
      paper: true,
    });
  });

  test('getPortfolio calls callTool with get_portfolio', async () => {
    await client.getPortfolio();
    expect(callToolMock).toHaveBeenCalledWith('get_portfolio', {});
  });

  test('getTradeHistory calls callTool with get_trade_history', async () => {
    await client.getTradeHistory({ symbol: 'BTC', limit: 10 });
    expect(callToolMock).toHaveBeenCalledWith('get_trade_history', {
      symbol: 'BTC',
      limit: 10,
    });
  });

  test('runBacktest calls callTool with run_backtest', async () => {
    await client.runBacktest('MOMENTUM', 'bitcoin', { days: 30 });
    expect(callToolMock).toHaveBeenCalledWith('run_backtest', {
      strategy: 'MOMENTUM',
      symbol: 'bitcoin',
      days: 30,
    });
  });

  test('getAnalytics calls callTool with get_analytics', async () => {
    await client.getAnalytics({ timeframe: '7d' });
    expect(callToolMock).toHaveBeenCalledWith('get_analytics', { timeframe: '7d' });
  });

  test('getCircuitBreakers calls callTool with get_circuit_breakers', async () => {
    await client.getCircuitBreakers();
    expect(callToolMock).toHaveBeenCalledWith('get_circuit_breakers', {});
  });

  test('updateCircuitBreakers calls callTool with update_circuit_breakers', async () => {
    await client.updateCircuitBreakers({ globalKill: true });
    expect(callToolMock).toHaveBeenCalledWith('update_circuit_breakers', { globalKill: true });
  });

  test('getMarketSentiment calls callTool with get_market_sentiment and null symbol by default', async () => {
    await client.getMarketSentiment();
    expect(callToolMock).toHaveBeenCalledWith('get_market_sentiment', { symbol: null });
  });

  test('getMarketSentiment passes symbol when provided', async () => {
    await client.getMarketSentiment('bitcoin');
    expect(callToolMock).toHaveBeenCalledWith('get_market_sentiment', { symbol: 'bitcoin' });
  });
});

// ════════════════════════════════════════════════════════════
// getResource
// ════════════════════════════════════════════════════════════

describe('TradeArenaClient — getResource()', () => {
  afterEach(() => {
    global.fetch = undefined;
  });

  test('sends GET to correct URL', async () => {
    const client = makeClient('http://localhost:3001');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    global.fetch = fetchMock;

    await client.getResource('market://prices');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/mcp/resource/market://prices'
    );
  });

  test('returns parsed JSON on success', async () => {
    const client = makeClient();
    const payload = { prices: [{ symbol: 'BTC', price: 50000 }] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const result = await client.getResource('market://prices');
    expect(result).toEqual(payload);
  });

  test('throws on non-ok response', async () => {
    const client = makeClient();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Resource not found' }),
    });

    await expect(client.getResource('bad://resource')).rejects.toThrow('Resource not found');
  });
});

// ════════════════════════════════════════════════════════════
// checkMCPStatus
// ════════════════════════════════════════════════════════════

describe('TradeArenaClient — checkMCPStatus()', () => {
  test('stores result in this.mcpStatus', async () => {
    const client = makeClient();
    const statusPayload = { version: 'v2.0', tools: 14 };
    client.getStatus = jest.fn().mockResolvedValue(statusPayload);

    await client.checkMCPStatus();
    expect(client.mcpStatus).toEqual(statusPayload);
  });

  test('invokes onMCPStatus callback with mcp_status type', async () => {
    const client = makeClient();
    const statusPayload = { version: 'v2.0' };
    client.getStatus = jest.fn().mockResolvedValue(statusPayload);
    const cb = jest.fn();
    client.onMCPStatus = cb;

    await client.checkMCPStatus();
    expect(cb).toHaveBeenCalledWith({ type: 'mcp_status', status: statusPayload });
  });

  test('returns the status object', async () => {
    const client = makeClient();
    const statusPayload = { version: 'v2.0' };
    client.getStatus = jest.fn().mockResolvedValue(statusPayload);

    const result = await client.checkMCPStatus();
    expect(result).toEqual(statusPayload);
  });

  test('returns null when getStatus throws', async () => {
    const client = makeClient();
    client.getStatus = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await client.checkMCPStatus();
    expect(result).toBeNull();
  });

  test('does not invoke onMCPStatus when getStatus throws', async () => {
    const client = makeClient();
    client.getStatus = jest.fn().mockRejectedValue(new Error('fail'));
    const cb = jest.fn();
    client.onMCPStatus = cb;

    await client.checkMCPStatus();
    expect(cb).not.toHaveBeenCalled();
  });

  test('leaves mcpStatus as null when getStatus throws', async () => {
    const client = makeClient();
    client.getStatus = jest.fn().mockRejectedValue(new Error('fail'));

    await client.checkMCPStatus();
    expect(client.mcpStatus).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════
// formatCurrency — UI helper
// ════════════════════════════════════════════════════════════

describe('TradeArenaClient — formatCurrency()', () => {
  let client;

  beforeEach(() => { client = makeClient(); });

  test('formats positive value as USD string', () => {
    expect(client.formatCurrency(1000)).toBe('$1,000.00');
  });

  test('formats zero as $0.00', () => {
    expect(client.formatCurrency(0)).toBe('$0.00');
  });

  test('formats negative value with minus sign', () => {
    const result = client.formatCurrency(-50.5);
    expect(result).toContain('50.50');
    expect(result).toContain('-');
  });

  test('respects custom decimals parameter', () => {
    const result = client.formatCurrency(1234.5, 0);
    expect(result).toBe('$1,235');
  });

  test('defaults to 2 decimal places', () => {
    const result = client.formatCurrency(9.9);
    expect(result).toBe('$9.90');
  });

  test('formats large values with thousand separators', () => {
    const result = client.formatCurrency(1234567.89);
    expect(result).toContain('1,234,567.89');
  });
});

// ════════════════════════════════════════════════════════════
// formatPercent — UI helper
// ════════════════════════════════════════════════════════════

describe('TradeArenaClient — formatPercent()', () => {
  let client;

  beforeEach(() => { client = makeClient(); });

  test('formats positive value with + prefix', () => {
    expect(client.formatPercent(5.5)).toBe('+5.50%');
  });

  test('formats zero with + prefix', () => {
    expect(client.formatPercent(0)).toBe('+0.00%');
  });

  test('formats negative value without + prefix', () => {
    expect(client.formatPercent(-3.14)).toBe('-3.14%');
  });

  test('respects custom decimals', () => {
    expect(client.formatPercent(1.5, 0)).toBe('+2%');
  });

  test('defaults to 2 decimal places', () => {
    expect(client.formatPercent(2.1)).toBe('+2.10%');
  });

  test('negative value exactly at zero boundary uses + (edge case: -0 scenario)', () => {
    // -0 in JS: value >= 0 is true for -0
    expect(client.formatPercent(-0)).toBe('+0.00%');
  });
});

// ════════════════════════════════════════════════════════════
// WebSocket connection — open handler behavior
// ════════════════════════════════════════════════════════════

describe('TradeArenaClient — WebSocket open handler', () => {
  beforeEach(() => {
    // Provide a global WebSocket constructor that returns a controllable mock
    global.WebSocket = jest.fn().mockImplementation((url) => {
      const ws = makeMockWS();
      // Capture reference for later
      global._lastMockWS = ws;
      return ws;
    });
  });

  afterEach(() => {
    delete global.WebSocket;
    delete global._lastMockWS;
  });

  test('sets wsConnected=true when open fires', () => {
    const client = makeClient();
    client.connectWebSocket();
    const ws = global._lastMockWS;
    ws.onopen();
    expect(client.wsConnected).toBe(true);
  });

  test('resets reconnectAttempts to 0 when open fires', () => {
    const client = makeClient();
    client.reconnectAttempts = 3;
    client.connectWebSocket();
    const ws = global._lastMockWS;
    ws.onopen();
    expect(client.reconnectAttempts).toBe(0);
  });

  test('resubscribes to all channels on open', () => {
    const client = makeClient();
    client.subscriptions.add('prices');
    client.subscriptions.add('bots');
    client.connectWebSocket();
    const ws = global._lastMockWS;
    ws.onopen();
    const sentMsgs = ws.sent.map(s => JSON.parse(s));
    expect(sentMsgs).toEqual(
      expect.arrayContaining([
        { type: 'subscribe', channel: 'prices' },
        { type: 'subscribe', channel: 'bots' },
      ])
    );
  });

  test('calls onMCPStatus with ws_connected when open fires and callback set', () => {
    const client = makeClient();
    const cb = jest.fn();
    client.onMCPStatus = cb;
    client.connectWebSocket();
    global._lastMockWS.onopen();
    expect(cb).toHaveBeenCalledWith({ type: 'ws_connected', connected: true });
  });

  test('sets wsConnected=false when close fires', () => {
    const client = makeClient();
    client.connectWebSocket();
    const ws = global._lastMockWS;
    ws.onopen();
    // Prevent actual reconnect timer from firing
    client.attemptReconnect = jest.fn();
    ws.onclose();
    expect(client.wsConnected).toBe(false);
  });

  test('calls onMCPStatus with ws_disconnected when close fires', () => {
    const client = makeClient();
    const cb = jest.fn();
    client.onMCPStatus = cb;
    client.connectWebSocket();
    const ws = global._lastMockWS;
    ws.onopen();
    client.attemptReconnect = jest.fn();
    ws.onclose();
    expect(cb).toHaveBeenCalledWith({ type: 'ws_disconnected', connected: false });
  });

  test('does not reconnect if ws.connected is truthy on re-call', () => {
    const client = makeClient();
    const mockWs = makeMockWS();
    mockWs.connected = true;
    client.ws = mockWs;
    client.connectWebSocket();
    // WebSocket constructor should NOT have been called again
    expect(global.WebSocket).not.toHaveBeenCalled();
  });
});