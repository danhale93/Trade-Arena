# 🏅 Trade Olympics - Quick Reference Card

## One-Minute Overview

**What:** Each AI model competes on specific trade scenarios (method + token + edge)
**Why:** Fair, head-to-head comparison of all 12 models
**How:** 480 brackets, 8 methods, 12 tokens, 5 edge tiers

---

## Essential Commands

### View Rankings
```javascript
// Best models by P&L
TRADE_OLYMPICS.getLeaderboard('totalPnL')

// Best models by win rate
TRADE_OLYMPICS.getLeaderboard('winRate')

// Most active models
TRADE_OLYMPICS.getLeaderboard('trades')
```

### View Brackets
```javascript
// Top 10 performing brackets
TRADE_OLYMPICS.getTopBrackets(10)

// Bottom 10 performing brackets
TRADE_OLYMPICS.getWeakestBrackets(10)

// All 480 brackets
Object.entries(TRADE_OLYMPICS.BRACKETS).map(([name, data]) => ({
  bracket: name,
  model: data.assignedModel,
  pnl: data.totalPnL
}))
```

### Compare Models
```javascript
// Head-to-head: GPT-5 vs Claude
TRADE_OLYMPICS.compareModels('gpt-5-turbo', 'claude-3.5-sonnet')

// Result: { winner: 'gpt-5-turbo', pnlDiff: 4550, ... }
```

### Analyze Models
```javascript
// How is gpt-5-turbo doing on ARBITRAGE?
TRADE_OLYMPICS.getModelMethodStats('gpt-5-turbo', 'ARBITRAGE')

// How is gpt-5-turbo doing on BTC?
TRADE_OLYMPICS.getModelTokenStats('gpt-5-turbo', 'BTC')

// All brackets for gpt-5-turbo
TRADE_OLYMPICS.getModelBrackets('gpt-5-turbo')
```

### Get Summary
```javascript
// Overall statistics
TRADE_OLYMPICS.getSummary()
// { totalBrackets, totalModels, totalTrades, totalPnL, topModel, ... }
```

---

## Tournament Structure

| Dimension | Count | Values |
|-----------|-------|--------|
| **Methods** | 8 | ARBITRAGE, FLASH LOAN, SPOT LONG, SPOT SHORT, PERP LONG, PERP SHORT, NFT FLIP, YIELD FARM |
| **Tokens** | 12 | BTC, ETH, SOL, AVAX, MATIC, LINK, UNI, AAVE, CRV, ARB, OP, BLUR |
| **Edge Tiers** | 5 | MICRO (0.1-0.5%), SMALL (0.5-1.5%), MEDIUM (1.5-3.5%), LARGE (3.5-6.5%), MEGA (6.5-10%) |
| **TOTAL BRACKETS** | **480** | Each with assigned model |

---

## Models (in order of ELO)

| Rank | Model | Provider | ELO | Brackets |
|------|-------|----------|-----|----------|
| 1 | gpt-5-turbo | OpenAI | 1400 | ~40 |
| 2 | claude-3.5-sonnet | Anthropic | 1390 | ~40 |
| 3 | grok-3 | xAI | 1380 | ~40 |
| 4 | gpt-4o | OpenAI | 1280 | ~40 |
| 5 | copilot-pro | Microsoft | 1260 | ~40 |
| 6 | claude-3-opus | Anthropic | 1250 | ~40 |
| 7 | llama-3-70b | Meta | 1180 | ~40 |
| 8 | mistral-large | Mistral | 1170 | ~40 |
| 9 | claude-3-sonnet | Anthropic | 1150 | ~40 |
| 10 | neural-shadow | DeepSeek | 1100 | ~40 |
| 11 | qwen-72b | Alibaba | 1090 | ~40 |
| 12 | gemini-2.0 | Google | 1080 | ~40 |

---

## How Trades Flow

```
1. Bot executes trade (e.g., ARBITRAGE on BTC, 1.2% edge)
   ↓
2. callAI() → callAIModel()
   ↓
3. TRADE_OLYMPICS.getModelForTrade('ARBITRAGE', 'BTC', 1.2)
   ↓
4. System finds bracket: ARBITRAGE_BTC_SMALL
   ↓
5. Returns assigned model: claude-3.5-sonnet
   ↓
6. Trade executes with Claude's personality
   ↓
7. Result recorded to bracket: TRADE_OLYMPICS.recordTrade()
   ↓
8. Stats updated: bracket P&L, wins, losses, win rate
   ↓
9. Model standings updated automatically
   ↓
10. Leaderboard changes reflect new data 🏅
```

---

## Bracket Naming Convention

Format: `METHOD_TOKEN_EDGETIER`

Examples:
- `ARBITRAGE_BTC_SMALL` → Arbitrage trades on Bitcoin, 0.5-1.5% edge
- `FLASH_LOAN_ETH_MEGA` → Flash loan trades on Ethereum, 6.5-10% edge
- `PERP_LONG_SOL_MEDIUM` → Perpetual long trades on Solana, 1.5-3.5% edge
- `YIELD_FARM_AAVE_MICRO` → Yield farming on AAVE, 0.1-0.5% edge

---

## Console Tips

```javascript
// Check if loaded
typeof TRADE_OLYMPICS  // 'object' = ready

// Quick status
TRADE_OLYMPICS.getSummary()

// Find any bracket
Object.keys(TRADE_OLYMPICS.BRACKETS).find(b => b.includes('BTC'))

// Model consistency check
Object.entries(TRADE_OLYMPICS.STANDINGS).map(([m, s]) => ({
  model: m,
  brackets: s.bracketsAssigned.length
}))

// Export all data
JSON.stringify(TRADE_OLYMPICS.STANDINGS, null, 2)
```

---

## What Changes vs What Stays

### Changes
✅ Model assignment per bracket (not per bot)
✅ Trades recorded to brackets (not just bots)
✅ Fair head-to-head comparison possible

### Stays the Same
✅ Bot profiles (SCALPER, TREND, etc.)
✅ Advanced bot engine
✅ Trading execution
✅ Result logging
✅ All existing features

---

## Most Useful Queries

### "Which model is winning?"
```javascript
TRADE_OLYMPICS.getLeaderboard('totalPnL')[0]
```

### "What's the best trade scenario?"
```javascript
TRADE_OLYMPICS.getTopBrackets(1)[0]
```

### "Where are models struggling?"
```javascript
TRADE_OLYMPICS.getWeakestBrackets(5)
```

### "How many trades so far?"
```javascript
TRADE_OLYMPICS.getSummary().totalTrades
```

### "Total profit/loss?"
```javascript
TRADE_OLYMPICS.getSummary().totalPnL
```

### "Is GPT-5 better than Claude overall?"
```javascript
const comp = TRADE_OLYMPICS.compareModels('gpt-5-turbo', 'claude-3.5-sonnet')
comp.winner  // which model
comp.pnlDiff  // how much ahead
```

### "How many brackets assigned to each model?"
```javascript
Object.entries(TRADE_OLYMPICS.STANDINGS).forEach(([m, s]) => 
  console.log(`${m}: ${s.bracketsAssigned.length}`)
)
```

---

## Key Metrics Explained

| Metric | Meaning | Formula |
|--------|---------|---------|
| **Win Rate** | Percentage of winning trades | Wins / Total Trades |
| **Total P&L** | Cumulative profit/loss | Sum of all trades |
| **Avg P&L** | Average per trade | Total P&L / Trades |
| **Edge %** | Potential profit opportunity | Set by trading strategy |
| **Trades** | Number of executions | Count of bracket uses |

---

## File Locations

| File | Location | Purpose |
|------|----------|---------|
| Main System | `trade-olympics.js` | Core Olympics logic |
| Integration | `multi-ai-arena.js` | callAIModel function |
| Page Reference | `index.html` | Script inclusion |
| Full Guide | `TRADE_OLYMPICS_GUIDE.md` | Complete documentation |
| UI Panel | `TRADE_OLYMPICS_UI_IMPLEMENTATION.md` | HTML/JS for display |

---

## Getting Started

1. **Open browser console** (F12)
2. **Check if loaded**: `typeof TRADE_OLYMPICS`
3. **View rankings**: `TRADE_OLYMPICS.getLeaderboard('totalPnL')`
4. **Add bots** and start trading
5. **Refresh console** and check rankings again
6. **Watch competition** develop in real-time

---

## Performance Metrics

After 1,000 trades:
- 12 models ranked
- 480 brackets populated
- ~83 trades per bracket average
- All data automatically tracked

After 10,000 trades:
- High statistical confidence
- Clear model strengths/weaknesses
- Reliable method/token/edge recommendations
- Head-to-head comparisons very reliable

---

## Real Output Example

```
TRADE_OLYMPICS.getLeaderboard('totalPnL')

[
  {
    rank: 1,
    medal: '🥇',
    model: 'gpt-5-turbo',
    provider: 'OpenAI',
    elo: 1400,
    totalPnL: 45230.75,
    overallWinRate: 0.872,
    totalTrades: 6842,
    bracketsAssigned: [...]
  },
  {
    rank: 2,
    medal: '🥈',
    model: 'claude-3.5-sonnet',
    provider: 'Anthropic',
    elo: 1390,
    totalPnL: 41120.50,
    overallWinRate: 0.851,
    totalTrades: 6795,
    bracketsAssigned: [...]
  },
  ...
]
```

---

## Interpretation Guide

### Win Rate
- `> 80%` = Excellent
- `70-80%` = Good
- `60-70%` = Fair
- `< 60%` = Needs improvement

### Total P&L
- `+$50K` = Strong performer
- `+$20K` = Good performer
- `+$0-5K` = Okay performer
- `Negative` = Underperforming

### Model Consistency
- Same model ranking high across multiple metrics = Consistent
- Ranking high on profit but low on win rate = High-risk style
- Ranking high on win rate but low on profit = Conservative style

---

## Summer 2026 Olympics 🏅

The AI Trading Olympics is now in session!

Follow the medal count, watch models compete, and discover which AI is truly the best trader.

May the best model win! 🥇
