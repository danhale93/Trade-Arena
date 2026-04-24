/**
 * ╔════════════════════════════════════════════════════════════════════════════════╗
 * ║                    TRADE ARENA - MCP CLIENT                                    ║
 * ║  Frontend client for MCP Tools, WebSocket, and API integration               ║
 * ╚════════════════════════════════════════════════════════════════════════════════╝
 */

class TradeArenaClient {
  constructor() {
    this.ws = null;
    this.wsConnected = false;
    this.subscriptions = new Set();
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.apiBase = window.location.origin.includes('localhost') 
      ? 'http://localhost:3001' 
      : window.location.origin;
    this.wsUrl = this.apiBase.replace('http', 'ws');
    this.mcpStatus = null;
    this.priceCache = new Map();
    this.botCache = new Map();
    this.onPriceUpdate = null;
    this.onBotUpdate = null;
    this.onMCPStatus = null;
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // WEBSOCKET
  // ════════════════════════════════════════════════════════════════════════════════

  connectWebSocket() {
    if (this.ws?.connected) return;

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('[WS] Connected to Trade Arena');
        this.wsConnected = true;
        this.reconnectAttempts = 0;
        
        // Resubscribe to channels
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
          console.warn('[WS] Invalid message:', event.data);
        }
      };

      this.ws.onclose = () => {
        console.log('[WS] Disconnected');
        this.wsConnected = false;
        if (this.onMCPStatus) {
          this.onMCPStatus({ type: 'ws_disconnected', connected: false });
        }
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error);
      };
    } catch (e) {
      console.error('[WS] Connection failed:', e);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WS] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WS] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);
    
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
        console.log('[WS] Server acknowledged connection');
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
        // Heartbeat response
        break;
      default:
        // Call registered handlers
        const handler = this.messageHandlers.get(data.type);
        if (handler) handler(data);
    }
  }

  onMessage(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // MCP TOOL CALLS
  // ════════════════════════════════════════════════════════════════════════════════

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

  // ════════════════════════════════════════════════════════════════════════════════
  // MCP RESOURCES
  // ════════════════════════════════════════════════════════════════════════════════

  async getResource(resourceName) {
    const response = await fetch(`${this.apiBase}/api/mcp/resource/${resourceName}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Resource ${resourceName} not found`);
    }
    return response.json();
  }

  // ════════════════════════════════════════════════════════════════════════════════
  // LEGACY API WRAPPERS
  // ════════════════════════════════════════════════════════════════════════════════

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

  // ════════════════════════════════════════════════════════════════════════════════
  // UI HELPERS
  // ════════════════════════════════════════════════════════════════════════════════

  async checkMCPStatus() {
    try {
      const status = await this.getStatus();
      this.mcpStatus = status;
      if (this.onMCPStatus) {
        this.onMCPStatus({ type: 'mcp_status', status });
      }
      return status;
    } catch (e) {
      console.warn('[MCP] Status check failed:', e.message);
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

// ════════════════════════════════════════════════════════════════════════════════
// GLOBAL INSTANCE
// ════════════════════════════════════════════════════════════════════════════════

window.tradeArena = new TradeArenaClient();

// Auto-connect WebSocket on load
document.addEventListener('DOMContentLoaded', () => {
  window.tradeArena.connectWebSocket();
  window.tradeArena.checkMCPStatus();
});
