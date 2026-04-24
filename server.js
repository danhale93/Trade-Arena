/**
 * ╔════════════════════════════════════════════════════════════════════════════════╗
 * ║                    TRADE ARENA - BACKEND SERVER                                ║
 * ║  Express + WebSocket + MCP + Alpaca + Anthropic + MongoDB                      ║
 * ╚════════════════════════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('websocket');
const mongoose = require('mongoose');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const Anthropic = require('@anthropic-ai/sdk');

// Import MCP Server
const { setupExpressRoutes } = require('./mcp-server');

const app = express();
const server = http.createServer(app);

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// ════════════════════════════════════════════════════════════════════════════════
// DATABASE CONNECTION (MongoDB)
// ════════════════════════════════════════════════════════════════════════════════

let dbConnected = false;

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    console.log('[DB] MONGODB_URI not set, running without database persistence');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    dbConnected = true;
    console.log('[DB] Connected to MongoDB');
  } catch (error) {
    console.warn('[DB] MongoDB connection failed:', error.message);
    console.log('[DB] Continuing without persistence');
  }
}

// Mongoose Schemas
const BotSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  strategy: { type: String, enum: ['ARBITRAGE', 'MOMENTUM', 'VOLATILITY', 'GRID', 'HYBRID', 'BALANCED'] },
  riskLevel: { type: String, enum: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'MAX_RISK'] },
  initialCapital: Number,
  active: { type: Boolean, default: true },
  status: { type: String, default: 'ACTIVE' },
  totalPnl: { type: Number, default: 0 },
  winRate: { type: Number, default: 0 },
  tradeCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  userId: String,
});

const TradeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  symbol: String,
  side: { type: String, enum: ['BUY', 'SELL'] },
  amount: Number,
  price: Number,
  quantity: Number,
  fee: Number,
  pnl: Number,
  strategy: String,
  botId: String,
  paper: { type: Boolean, default: true },
  status: { type: String, default: 'FILLED' },
  timestamp: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  email: String,
  balance: { type: Number, default: 10000 },
  preferences: {
    riskLevel: { type: String, default: 'MODERATE' },
    defaultStrategy: { type: String, default: 'HYBRID' },
    autoTrade: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
});

const Bot = mongoose.model('Bot', BotSchema);
const Trade = mongoose.model('Trade', TradeSchema);
const User = mongoose.model('User', UserSchema);

// ════════════════════════════════════════════════════════════════════════════════
// ALPACA & ANTHROPIC CLIENTS
// ════════════════════════════════════════════════════════════════════════════════

const alpaca = process.env.ALPACA_KEY ? new Alpaca({
  keyId: process.env.ALPACA_KEY,
  secretKey: process.env.ALPACA_SECRET,
  paper: true,
  host: 'https://paper-api.alpaca.markets'
}) : null;

const anthropic = process.env.ANTHROPIC_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_KEY,
}) : null;

// ════════════════════════════════════════════════════════════════════════════════
// WEBSOCKET SERVER
// ════════════════════════════════════════════════════════════════════════════════

const WebSocketServer = WebSocket.server;
const wss = new WebSocketServer({ httpServer: server, autoAcceptConnections: false });

const clients = new Set();

function originIsAllowed(origin) {
  return true; // Configure for production
}

wss.on('request', (request) => {
  if (!originIsAllowed(request.origin)) {
    request.reject();
    console.log('[WS] Connection rejected from origin:', request.origin);
    return;
  }

  const connection = request.accept(null, request.origin);
  clients.add(connection);
  console.log('[WS] Client connected. Total:', clients.size);

  // Send welcome message
  connection.sendUTF(JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString(),
    message: 'Trade Arena WebSocket connected',
  }));

  connection.on('message', (message) => {
    if (message.type === 'utf8') {
      try {
        const data = JSON.parse(message.utf8Data);
        handleWebSocketMessage(connection, data);
      } catch (e) {
        connection.sendUTF(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      }
    }
  });

  connection.on('close', (reasonCode, description) => {
    clients.delete(connection);
    console.log('[WS] Client disconnected. Total:', clients.size);
  });
});

function handleWebSocketMessage(connection, data) {
  switch (data.type) {
    case 'subscribe':
      connection.subscriptions = connection.subscriptions || [];
      connection.subscriptions.push(data.channel);
      connection.sendUTF(JSON.stringify({ type: 'subscribed', channel: data.channel }));
      break;
    case 'unsubscribe':
      if (connection.subscriptions) {
        connection.subscriptions = connection.subscriptions.filter(s => s !== data.channel);
      }
      break;
    case 'ping':
      connection.sendUTF(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;
    default:
      connection.sendUTF(JSON.stringify({ type: 'error', message: `Unknown message type: ${data.type}` }));
  }
}

// Broadcast to all connected clients
function broadcast(data, channel = null) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.connected) {
      if (!channel || (client.subscriptions && client.subscriptions.includes(channel))) {
        client.sendUTF(message);
      }
    }
  });
}

// Periodic price broadcast
async function broadcastPrices() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&price_change_percentage=24h');
    const data = await response.json();
    broadcast({
      type: 'prices',
      timestamp: new Date().toISOString(),
      prices: data.map(c => ({
        symbol: c.symbol,
        price: c.current_price,
        change24h: c.price_change_percentage_24h,
      })),
    }, 'prices');
  } catch (e) {
    // Silently fail - prices are best-effort
  }
}

// Start price broadcasting every 30 seconds
setInterval(broadcastPrices, 30000);

// ════════════════════════════════════════════════════════════════════════════════
// MCP INTEGRATION
// ════════════════════════════════════════════════════════════════════════════════

// Mount MCP routes
setupExpressRoutes(app);

// Legacy MCP proxy endpoint (enhanced)
app.post('/api/mcp/agent', async (req, res) => {
  if (!anthropic) {
    return res.status(503).json({ error: 'Anthropic API not configured' });
  }

  try {
    const { prompt, tools, model = 'claude-3-5-sonnet-20240620', system } = req.body;
    
    const messages = [];
    if (system) {
      messages.push({ role: 'system', content: system });
    }
    messages.push({ role: 'user', content: prompt });

    const result = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      messages,
      tools: tools || undefined,
    });
    
    res.json(result);
  } catch (error) {
    console.error('[MCP Agent Error]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// ALPACA ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════════

app.get('/api/alpaca/positions', async (req, res) => {
  if (!alpaca) {
    return res.status(503).json({ error: 'Alpaca API not configured' });
  }
  try {
    const positions = await alpaca.getPositions();
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/alpaca/account', async (req, res) => {
  if (!alpaca) {
    return res.status(503).json({ error: 'Alpaca API not configured' });
  }
  try {
    const account = await alpaca.getAccount();
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/alpaca/order', async (req, res) => {
  if (!alpaca) {
    return res.status(503).json({ error: 'Alpaca API not configured' });
  }
  try {
    const { symbol, qty, side, type, time_in_force, limit_price } = req.body;
    const order = await alpaca.createOrder({
      symbol,
      qty,
      side,
      type,
      time_in_force,
      limit_price,
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/alpaca/orders', async (req, res) => {
  if (!alpaca) {
    return res.status(503).json({ error: 'Alpaca API not configured' });
  }
  try {
    const { status = 'all', limit = 50 } = req.query;
    const orders = await alpaca.getOrders({ status, limit });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// COINGECKO PROXY
// ════════════════════════════════════════════════════════════════════════════════

app.get('/api/market/prices', async (req, res) => {
  try {
    const { symbols, vs_currency = 'usd' } = req.query;
    const ids = symbols ? symbols.split(',').join(',') : 'bitcoin,ethereum';
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs_currency}&include_24hr_change=true&include_market_cap=true`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/market/coins', async (req, res) => {
  try {
    const { vs_currency = 'usd', per_page = 50, page = 1, order = 'market_cap_desc' } = req.query;
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs_currency}&order=${order}&per_page=${per_page}&page=${page}&sparkline=false&price_change_percentage=24h,7d`
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/market/trending', async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/search/trending');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/market/fear-greed', async (req, res) => {
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// BACKTEST ENDPOINT
// ════════════════════════════════════════════════════════════════════════════════

app.post('/api/backtest/stocks', async (req, res) => {
  if (!alpaca) {
    return res.status(503).json({ error: 'Alpaca API not configured' });
  }

  const { symbols, days = 30, strategies = ['MOMENTUM'] } = req.body;
  
  try {
    const results = [];
    
    for (const symbol of symbols) {
      const start = new Date(Date.now() - days * 86400000).toISOString();
      const end = new Date().toISOString();
      
      const bars = [];
      for await (const bar of alpaca.getBarsV2(symbol, { timeframe: '1Hour', start, end })) {
        bars.push({
          t: bar.Timestamp,
          o: bar.OpenPrice,
          h: bar.HighPrice,
          l: bar.LowPrice,
          c: bar.ClosePrice,
          v: bar.Volume,
        });
      }

      // Run strategy simulation
      const simulation = simulateStrategy(bars, strategies[0]);
      
      results.push({
        symbol,
        bars: bars.length,
        ...simulation,
      });
    }

    res.json({ results, summary: calculateSummary(results) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function simulateStrategy(bars, strategy) {
  let capital = 10000;
  let position = 0;
  let trades = 0;
  let wins = 0;
  const tradeLog = [];

  for (let i = 20; i < bars.length; i++) {
    const current = bars[i];
    const prev = bars[i - 1];
    const sma20 = bars.slice(i - 20, i).reduce((sum, b) => sum + b.c, 0) / 20;
    
    let signal = null;
    
    switch (strategy) {
      case 'MOMENTUM':
        if (current.c > sma20 * 1.01 && position <= 0) signal = 'BUY';
        else if (current.c < sma20 * 0.99 && position > 0) signal = 'SELL';
        break;
      case 'MEAN_REVERSION':
        if (current.c < sma20 * 0.98 && position <= 0) signal = 'BUY';
        else if (current.c > sma20 * 1.02 && position > 0) signal = 'SELL';
        break;
      default:
        if (current.c > prev.c * 1.005 && position <= 0) signal = 'BUY';
        else if (current.c < prev.c * 0.995 && position > 0) signal = 'SELL';
    }

    if (signal === 'BUY' && capital > 100) {
      const qty = Math.floor(capital * 0.2 / current.c);
      if (qty > 0) {
        position += qty;
        capital -= qty * current.c;
        trades++;
        tradeLog.push({ type: 'BUY', price: current.c, qty, time: current.t });
      }
    } else if (signal === 'SELL' && position > 0) {
      const pnl = position * (current.c - tradeLog[tradeLog.length - 1]?.price || current.c);
      capital += position * current.c;
      if (pnl > 0) wins++;
      tradeLog.push({ type: 'SELL', price: current.c, qty: position, pnl, time: current.t });
      position = 0;
      trades++;
    }
  }

  // Close any open position
  if (position > 0 && bars.length > 0) {
    const lastPrice = bars[bars.length - 1].c;
    capital += position * lastPrice;
  }

  return {
    strategy,
    initialCapital: 10000,
    finalCapital: capital.toFixed(2),
    totalReturn: (((capital - 10000) / 10000) * 100).toFixed(2),
    trades,
    wins,
    winRate: trades > 0 ? ((wins / (trades / 2)) * 100).toFixed(2) : 0,
    tradeLog: tradeLog.slice(-10),
  };
}

function calculateSummary(results) {
  const totalReturn = results.reduce((sum, r) => sum + parseFloat(r.totalReturn), 0);
  const avgReturn = results.length > 0 ? (totalReturn / results.length).toFixed(2) : 0;
  const totalTrades = results.reduce((sum, r) => sum + r.trades, 0);
  
  return {
    symbolsTested: results.length,
    avgReturn: `${avgReturn}%`,
    totalTrades,
    bestPerformer: results.length > 0 ? results.reduce((best, r) => parseFloat(r.totalReturn) > parseFloat(best.totalReturn) ? r : best, results[0]).symbol : null,
    worstPerformer: results.length > 0 ? results.reduce((worst, r) => parseFloat(r.totalReturn) < parseFloat(worst.totalReturn) ? r : worst, results[0]).symbol : null,
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// USER & BOT MANAGEMENT API
// ════════════════════════════════════════════════════════════════════════════════

app.post('/api/user', async (req, res) => {
  try {
    const { address, email } = req.body;
    let user = await User.findOne({ address });
    
    if (!user) {
      user = new User({ address, email });
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/:address', async (req, res) => {
  try {
    const user = await User.findOne({ address: req.params.address });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bot', async (req, res) => {
  try {
    const botData = req.body;
    const bot = new Bot(botData);
    await bot.save();
    
    // Broadcast bot creation
    broadcast({
      type: 'bot_created',
      bot: botData,
      timestamp: new Date().toISOString(),
    }, 'bots');
    
    res.json({ success: true, bot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bot', async (req, res) => {
  try {
    const { userId, active } = req.query;
    const query = {};
    if (userId) query.userId = userId;
    if (active !== undefined) query.active = active === 'true';
    
    const bots = await Bot.find(query);
    res.json(bots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bot/:id', async (req, res) => {
  try {
    const bot = await Bot.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    
    if (!bot) return res.status(404).json({ error: 'Bot not found' });
    res.json({ success: true, bot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bot/:id', async (req, res) => {
  try {
    await Bot.deleteOne({ id: req.params.id });
    res.json({ success: true, message: 'Bot deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// ANALYTICS API
// ════════════════════════════════════════════════════════════════════════════════

app.get('/api/analytics/performance', async (req, res) => {
  try {
    const { userId, timeframe = '30d' } = req.query;
    const query = {};
    if (userId) query.userId = userId;
    
    // Time filter
    const days = parseInt(timeframe) || 30;
    const cutoff = new Date(Date.now() - days * 86400000);
    query.timestamp = { $gte: cutoff };
    
    const trades = await Trade.find(query);
    
    const pnls = trades.map(t => t.pnl || 0);
    const wins = pnls.filter(p => p > 0);
    const losses = pnls.filter(p => p < 0);
    
    res.json({
      timeframe,
      totalTrades: trades.length,
      winRate: trades.length > 0 ? ((wins.length / trades.length) * 100).toFixed(2) : 0,
      totalPnl: pnls.reduce((a, b) => a + b, 0).toFixed(4),
      avgWin: wins.length > 0 ? (wins.reduce((a, b) => a + b, 0) / wins.length).toFixed(4) : 0,
      avgLoss: losses.length > 0 ? (losses.reduce((a, b) => a + b, 0) / losses.length).toFixed(4) : 0,
      profitFactor: losses.length > 0 && Math.abs(losses.reduce((a, b) => a + b, 0)) > 0
        ? (wins.reduce((a, b) => a + b, 0) / Math.abs(losses.reduce((a, b) => a + b, 0))).toFixed(2)
        : '∞',
      maxDrawdown: calculateMaxDrawdown(pnls).toFixed(4),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

// ════════════════════════════════════════════════════════════════════════════════
// HEALTH & STATUS
// ════════════════════════════════════════════════════════════════════════════════

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    services: {
      alpaca: !!alpaca,
      anthropic: !!anthropic,
      mongodb: dbConnected,
      websocket: clients.size,
    },
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    features: {
      mcp: true,
      websocket: true,
      alpaca: !!alpaca,
      claude: !!anthropic,
      database: dbConnected,
    },
    endpoints: {
      mcp: '/api/mcp',
      websocket: 'ws://localhost:3001',
      alpaca: '/api/alpaca',
      market: '/api/market',
      backtest: '/api/backtest',
    },
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ════════════════════════════════════════════════════════════════════════════════

app.use((err, req, res, next) => {
  console.error('[Error]', err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

// ════════════════════════════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3001;

async function start() {
  await connectDatabase();
  
  server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🚀 TRADE ARENA v2.0                       ║
║                                                              ║
║  HTTP Server:  http://localhost:${PORT}                      ║
║  WebSocket:    ws://localhost:${PORT}                        ║
║  MCP Tools:    14 available                                  ║
║  Alpaca:       ${alpaca ? '✅ Connected' : '❌ Not configured'}                          ║
║  Claude:       ${anthropic ? '✅ Connected' : '❌ Not configured'}                          ║
║  MongoDB:      ${dbConnected ? '✅ Connected' : '❌ Not configured'}                          ║
║                                                              ║
║  Endpoints:                                                  ║
║    • /api/health        - Health check                       ║
║    • /api/status        - Service status                     ║
║    • /api/mcp/status    - MCP server status                  ║
║    • /api/mcp/tool/*    - MCP tool execution                 ║
║    • /api/mcp/resource/* - MCP resources                     ║
║    • /api/market/*      - Market data (CoinGecko)            ║
║    • /api/alpaca/*      - Alpaca trading                     ║
║    • /api/backtest      - Strategy backtesting               ║
║    • /api/bot           - Bot management                     ║
║    • /api/analytics     - Performance analytics              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
}

start().catch(console.error);

module.exports = { app, server, broadcast };
