# 🚀 Trade Arena v2.0 - MCP Integration Guide

## What's New in v2.0

### ✅ MCP Server Implementation
- **Full MCP Protocol Support**: Tools, Resources, and Prompts
- **14 Trading Tools** exposed via MCP
- **5 Live Resources** for market data, portfolio, analytics
- **4 AI Prompts** for strategy analysis, risk assessment, bot optimization
- **HTTP API Bridge** for browser/frontend integration

### ✅ WebSocket Real-Time Infrastructure
- Live price streaming every 30 seconds
- Bot event broadcasting
- Subscription-based channels (prices, bots, trades)
- Auto-reconnection with exponential backoff

### ✅ MongoDB Persistence
- Bot configurations persist to database
- Trade history with analytics
- User profiles and preferences
- Graceful fallback when DB unavailable

### ✅ Advanced Analytics
- Sharpe Ratio, Sortino Ratio
- Profit Factor, Win Rate
- Max Drawdown calculation
- Volatility metrics
- Timeframe-filtered reports

---

## 📁 New Files

| File | Purpose |
|------|---------|
| `mcp-server.js` | Full MCP server with trading tools |
| `mcp-client.js` | Frontend client for MCP + WebSocket |
| `server.js` | Enhanced Express + WebSocket + MongoDB |
| `.env.example` | Updated with all v2.0 config options |
| `MCP_INTEGRATION_GUIDE.md` | This documentation |

---

## 🔧 MCP Tools Available

### Market Data
- `get_market_data` - Fetch crypto/stock prices
- `get_trending_coins` - Get trending cryptocurrencies
- `get_market_sentiment` - Fear & greed index + market direction

### Trading
- `analyze_opportunity` - Strategy-specific market analysis
- `execute_trade` - Paper or real trade execution
- `get_portfolio` - Current holdings and P&L
- `get_trade_history` - Filtered trades with analytics

### Bot Management
- `create_trading_bot` - Deploy new bot with config
- `get_bot_status` - Bot status and performance
- `update_bot` - Pause/resume/stop/update bots
- `delete_bot` - Remove a bot

### Analytics
- `run_backtest` - Strategy backtesting simulation
- `get_analytics` - Advanced metrics (Sharpe, Sortino, etc.)
- `get_circuit_breakers` - Safety system status
- `update_circuit_breakers` - Modify risk settings

---

## 📡 API Endpoints

### MCP Endpoints
```
GET  /api/mcp/status              - MCP server status
POST /api/mcp/tool/:toolName     - Execute any MCP tool
GET  /api/mcp/resource/:name     - Access MCP resources
GET  /api/mcp/events             - SSE real-time events
POST /api/mcp/agent              - Claude AI proxy
```

### Trading Endpoints
```
GET  /api/market/prices          - CoinGecko prices
GET  /api/market/coins           - Top coins list
GET  /api/market/trending        - Trending coins
GET  /api/market/fear-greed      - Fear & Greed index
```

### Alpaca Endpoints
```
GET  /api/alpaca/positions       - Current positions
GET  /api/alpaca/account         - Account details
POST /api/alpaca/order           - Place order
GET  /api/alpaca/orders          - Order history
```

### Bot & Analytics
```
POST /api/bot                    - Create bot
GET  /api/bot                    - List bots
PUT  /api/bot/:id                - Update bot
DELETE /api/bot/:id              - Delete bot
GET  /api/analytics/performance  - Performance metrics
POST /api/backtest/stocks        - Run backtest
```

### Health
```
GET  /api/health                 - Health check
GET  /api/status                 - Full service status
```

---

## 🔌 WebSocket Usage

```javascript
// Connect
const client = window.tradeArena;
client.connectWebSocket();

// Subscribe to channels
client.subscribe('prices');
client.subscribe('bots');

// Handle updates
client.onPriceUpdate = (prices) => {
  console.log('New prices:', prices);
};

client.onBotUpdate = (data) => {
  console.log('Bot event:', data);
};
```

---

## 🤖 Using MCP from Frontend

```javascript
// Analyze a trading opportunity
const analysis = await tradeArena.analyzeOpportunity('bitcoin', 'MOMENTUM');

// Create a bot
const bot = await tradeArena.createBot({
  name: 'My Bot',
  strategy: 'ARBITRAGE',
  riskLevel: 'MODERATE',
  initialCapital: 1000
});

// Execute a trade
const trade = await tradeArena.executeTrade('bitcoin', 'BUY', 100, {
  paper: true,
  strategy: 'MOMENTUM'
});

// Get portfolio
const portfolio = await tradeArena.getPortfolio();

// Run backtest
const backtest = await tradeArena.runBacktest('MOMENTUM', 'bitcoin', {
  days: 30,
  initialCapital: 10000
});

// Get analytics
const analytics = await tradeArena.getAnalytics({
  timeframe: '30d',
  metrics: ['sharpe', 'sortino', 'winrate']
});
```

---

## 🏁 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Start Server
```bash
# Standard mode
npm start

# Development mode with auto-reload
npm run dev

# MCP standalone server
npm run mcp
```

### 4. Include Frontend Client
Add to your `index.html`:
```html
<script src="mcp-client.js"></script>
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER / PWA                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  mcp-client │  │  WebSocket  │  │    UI       │    │
│  │   (tools)   │  │  (realtime) │  │  (React/Vue)│    │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘    │
└─────────┼────────────────┼─────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────┐
│                   EXPRESS SERVER                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  MCP Routes: /api/mcp/*                          │  │
│  │  • Tools:    /api/mcp/tool/:name                 │  │
│  │  • Resources: /api/mcp/resource/:name            │  │
│  │  • SSE:      /api/mcp/events                   │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Alpaca  │  │CoinGecko │  │ Anthropic│             │
│  │  Trading │  │  Prices  │  │  Claude  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐                            │
│  │ WebSocket│  │ MongoDB  │                            │
│  │  Server  │  │  (opt)   │                            │
│  └──────────┘  └──────────┘                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ALPACA_KEY` | No | Alpaca API key for real trading |
| `ALPACA_SECRET` | No | Alpaca secret key |
| `ANTHROPIC_KEY` | No | Claude AI API key |
| `MONGODB_URI` | No | MongoDB connection string |
| `PORT` | No | Server port (default: 3001) |
| `JWT_SECRET` | No | Secret for JWT tokens |

---

## 🎯 Next Steps

1. **Add MCP to AI Arena**: Connect `ai-arena.js` to MCP tools for live market data
2. **Implement Real Trading**: Wire `execute_trade` to Alpaca for live execution
3. **Add Social Features**: Bot sharing, leaderboards, copy-trading
4. **Mobile App**: Use WebSocket for push notifications
5. **Machine Learning**: Store bot performance for model training

---

## 📚 Documentation

- [MCP Specification](https://modelcontextprotocol.io/)
- [Anthropic MCP SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Alpaca API Docs](https://alpaca.markets/docs/)
- [CoinGecko API](https://www.coingecko.com/en/api)

---

**Trade Arena v2.0** — Built with ❤️ for the future of AI-powered trading.
