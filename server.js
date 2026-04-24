/**
 * Trade Arena Backend - Alpaca + Claude + Backtest
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

const alpaca = new Alpaca({
  keyId: process.env.ALPACA_KEY,
  secretKey: process.env.ALPACA_SECRET,
  paper: true, // Default to paper trading
  host: 'https://paper-api.alpaca.markets'
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_KEY,
});

// MCP Server proxy endpoint
app.post('/api/mcp/agent', async (req, res) => {
  try {
    const { prompt, tools } = req.body;
    const result = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      tools: tools,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alpaca portfolio/positions
app.get('/api/alpaca/positions', async (req, res) => {
  try {
    const positions = await alpaca.getPositions({ status: 'active' });
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alpaca orders
app.post('/api/alpaca/order', async (req, res) => {
  try {
    const { symbol, qty, side, type, time_in_force } = req.body;
    const order = await alpaca.createOrder({
      symbol,
      qty,
      side,
      type,
      time_in_force,
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Backtest endpoint
app.post('/api/backtest/stocks', async (req, res) => {
  const { symbols, days, strategies } = req.body;
  // Implement backtest logic using alpaca historical data
  try {
    const bars = [];
    for (const symbol of symbols) {
      const response = await alpaca.getBarsV2(symbol, {
        timeframe: '1Min',
        start: new Date(Date.now() - days * 86400000).toISOString(),
        end: new Date().toISOString(),
      });
      bars.push(...response.bars.map(bar => ({
        t: bar.timestamp,
        o: bar.open,
        h: bar.high,
        l: bar.low,
        c: bar.close,
        v: bar.volume,
      })));
    }
    // Run crucible backtest simulation
    const results = simulateCrucibleBacktest(bars, strategies);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CoinGecko proxy (existing)

    const response = await fetch(`https://api.coingecko
