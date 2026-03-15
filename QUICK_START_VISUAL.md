# QUICK START • VISUAL GUIDE

## 🚀 30-Second Setup

```
1. Open: index.html
   ↓
2. Click: "DEMO" or "🦊 METAMASK"
   ↓
3. Click: "+ ADD BOT" (3-4 times)
   ↓
4. Select: $1-10 bet for each bot
   ↓
5. Click: "AUTO"
   ↓
6. DONE! System trades automatically
```

---

## 📱 What You'll See

### Bot Card (Live Example)

```
┌─────────────────────────────────────┐
│ BOT #1                       SCALPER │
├─────────────────────────────────────┤
│ +$45.25 | WATCHING SPREADS…  58% WR │
├─────────────────────────────────────┤
│      [SPINNING REEL ANIMATION]      │
├─────────────────────────────────────┤
│ [PEPE]  [ARBIT]  [2.5%]  [2.1%]    │
│ Token   Method   Edge    Auto Edge  │
├─────────────────────────────────────┤
│ $1  $5  ✓$10  $25  $50  $100        │
│ [🎰 SPIN]     [⏸ STOP]             │
└─────────────────────────────────────┘

Key Points:
• SCALPER = Strategy profile
• 58% WR = Recent win rate!
• [ARBIT] = Method (changes with market!)
• [2.1%] = Auto Edge (system's adaptation!)
• [⏸ STOP] = Running in AUTO mode
```

---

## 🎯 Understanding the Adaptations

### Pills Explanation

```
[PEPE]        [ARBIT]       [2.5%]       [2.1%]
  │             │             │            │
  │             │             │            └─→ AUTO EDGE
  │             │             │               (System's
  │             │             │                adaptive
  │             │             │                adjustment)
  │             │             │
  │             │             └─→ EDGE
  │             │                (Claude AI's
  │             │                 estimate)
  │             │
  │             └─→ METHOD
  │                (Changes with market!)
  │                STABLE → ARBITRAGE
  │                VOLATILE → FLASH LOAN
  │                TRENDING → SPOT LONG
  │
  └─→ TOKEN
     (What it's trading)
```

### Ticker Explanation

```
Manual Mode:
  ✅ +$8.50 — Market opportunity detected.
  ❌ -$2.10 — DEX spread on Base.

Auto Mode (SMART!):
  ✅ +$12.50 • TRENDING_UP • 58% WR
     ↑ Win    ↑ Market      ↑ Recent
       Amount  Condition     Win Rate
```

---

## 🎮 Real-Time Watching

### What Happens Every Trade

```
Second 1:
  Market analyzing...
  
Second 2:
  Method selected: (depends on market)
  Edge calculated: 2.5% → 2.1% (adapted!)
  Bet sized: $10 → $8 (risk-adjusted)
  
Second 3-4:
  Reels spinning...
  
Second 5:
  Result displayed
  Pills light up
  P&L updated
  Ticker shows: Win/Loss + Market + WR%
  
Second 6-8:
  Wait before next trade
  
Second 9:
  Repeat!
```

---

## 💡 Key Things to Notice

### ✅ Method Changes
```
You might see:
  Trade 1: [ARBIT] (stable market)
  Trade 2: [FLASH] (volatile market)
  Trade 3: [SPOT]  (trending market)
  
This is CORRECT!
System adapting to market conditions.
```

### ✅ Edge Adjusts
```
You might see:
  Trade 1: [2.5%] → [2.5%] (no change)
  Trade 2: [2.0%] → [2.1%] (higher, after win)
  Trade 3: [3.0%] → [2.5%] (lower, after loss)
  
This is CORRECT!
System managing risk.
```

### ✅ Bets Vary
```
You might see:
  Trade 1: $10 bet
  Trade 2: $8 bet (after loss)
  Trade 3: $6 bet (after 2nd loss)
  Trade 4: $7 bet (after recovery)
  
This is CORRECT!
System protecting capital.
```

---

## 📊 Reading the Stats

### Global Header (Top of App)
```
┌───────────────────────────────────┐
│ 👤 Demo User          $12,450.00  │
│ 🎯 DEMO MODE          +$2,450.00  │
│          + ADD BOT (button)        │
└───────────────────────────────────┘

Shows:
• Your name (or wallet address)
• Current balance (updating live)
• Total P&L for the session
```

### Per-Bot Stats
```
In console (F12), type:
  getBotStrategyInsights(botStrategies[1])
  
Shows:
  ✓ Total trades
  ✓ Session P&L
  ✓ Recent win rate
  ✓ Consecutive wins/losses
  ✓ Best performing method
  ✓ Current profile
```

---

## 🔍 Console Monitoring

### Easiest Commands

```javascript
// See all bot states at once
console.log(botStrategies)

// Get summary for each bot
Object.values(botStrategies).forEach(b => {
  console.log(`Bot ${b.botId}: ${b.tradesCount} trades, $${b.sessionPnL.toFixed(2)} P&L`);
});

// See market conditions right now
analyzeMarketConditions(marketCache)

// Check specific bot insights
getBotStrategyInsights(botStrategies[1])
```

### What It Shows

```
Market Analysis:
  volatility: 2.8 (2.8% average change)
  volume: 850000000 ($850M daily vol)
  direction: BULLISH (more up than down)
  momentum: +1.2 (average 24h change)
  condition: TRENDING_UP ← This determines method!

Bot Insights:
  totalTrades: 42
  sessionPnL: $125.50
  recentWinRate: 58% (last 20 trades)
  consecutiveWins: 2
  consecutiveLosses: 0
  bestPerformingMethod: ARBITRAGE
```

---

## 🎯 Performance Check

### After 20 Trades
```
What to look for:
  ✓ Win rate showing (should be visible)
  ✓ Method changing with market
  ✓ Auto Edge adjusting
  ✓ P&L accumulating
  ✓ No errors in console
```

### After 50 Trades
```
What to check:
  ✓ Win rate stable (target >53%)
  ✓ Methods working (best one obvious?)
  ✓ Edge adaptations reasonable
  ✓ Portfolio positive or breakeven
  ✓ Which bots performing best?
```

### After 100+ Trades
```
What to analyze:
  ✓ Overall win rate
  ✓ Best bot (which profile?)
  ✓ Best method (which works most?)
  ✓ ROI (P&L / starting balance)
  ✓ Daily trend (going up?)
```

---

## ⚠️ Common Sights

### Normal Things You'll See

```
Pills changing: ✅ NORMAL
  → Market conditions changed
  → System adapting method

Edge dropping: ✅ NORMAL
  → Recent loss streak
  → System reducing risk

Bets getting smaller: ✅ NORMAL
  → Losses happened
  → Protecting capital

Pausing: ✅ NORMAL
  → 5+ consecutive losses
  → Max drawdown hit
  → System protecting you

Win rate fluctuating: ✅ NORMAL
  → Building history
  → Stabilizes after 50+ trades
```

### Warning Signs

```
Win rate staying <50% after 100 trades:
  → AI might not fit this market
  → Consider changing profiles
  → Reduce bet sizes

Methods never changing:
  → Could be stable market (fine!)
  → Or could be bug (check console)
  → Usually fine to continue

Constant small losses:
  → Slippage too high
  → Bet sizes too big
  → Try smaller bets first

Not updating:
  → Check market data loaded (marketCache)
  → Refresh page
  → Check console for errors
```

---

## 🎯 Strategy Profile Quick Guide

### SCALPER (⚡ Fast)
```
Use when: Stable markets, tight spreads
Methods: Arbitrage, Flash Loans
Bets: 0.8x base (conservative)
Expected: Frequent small wins
```

### TREND (📈 Momentum)
```
Use when: Clear trends (up or down)
Methods: Spot Long, Perps, Yield
Bets: 1.0x base (normal)
Expected: Bigger wins, follow momentum
```

### AGGRESSIVE (💣 Risky)
```
Use when: High volatility expected
Methods: Perp Long/Short, Complex
Bets: 1.5x base (large)
Expected: Big wins but risky
```

### CONSERVATIVE (🛡️ Safe)
```
Use when: Unsure, want steady gains
Methods: Arbitrage, Yield Farm
Bets: 0.5x base (small)
Expected: Consistent small wins
```

### BALANCED (⚖️ Mixed)
```
Use when: Want diversification
Methods: Equal weight all methods
Bets: 1.0x base (normal)
Expected: Balanced profit
```

### NICHE (🎯 Alternative)
```
Use when: NFT bull market or yields
Methods: NFTs, Yields, Spot
Bets: 1.2x base (slightly larger)
Expected: Special opportunities
```

---

## 📈 Example Session

### First 30 Minutes
```
Added 4 bots (2 SCALPER, 1 TREND, 1 CONSERVATIVE)
Set bets: $1, $1, $2, $1
Clicked AUTO on all

Results after 20 trades per bot:
  Bot 1 (SCALPER):  +$8.50  WR: 55%
  Bot 2 (SCALPER):  +$12.20 WR: 60%
  Bot 3 (TREND):    -$2.00  WR: 50%
  Bot 4 (CONS):     +$5.75  WR: 58%
  ─────────────────────────────────
  Total:            +$24.45
  
Status: Positive! Continue...
```

### After 2 Hours
```
Each bot ran ~100 trades
Portfolio P&L: +$125.30

Analysis:
  Bot 1 (SCALPER): 58% WR, Best: ARBITRAGE
  Bot 2 (SCALPER): 56% WR, Best: FLASH LOAN
  Bot 3 (TREND):   54% WR, Best: SPOT LONG
  Bot 4 (CONS):    61% WR, Best: ARBITRAGE
  
Best performer: Bot 4 (CONSERVATIVE)
Worst performer: Bot 3 (TREND) - but still profitable!

Decision: Keep running, market seems favorable
```

---

## 🎉 Success Indicators

### You'll Know It's Working When:

```
✅ Pills change method (auto-adapting)
✅ Auto Edge % different from Edge % (system optimizing)
✅ Ticker shows market conditions (data flowing)
✅ Win rates displaying (>50% is good!)
✅ P&L accumulating (staying positive)
✅ No console errors (smooth operation)
✅ Bots running continuously (auto-trading working)
✅ Different profiles, different results (diversity works!)
```

### Quick Checklist

```
Open index.html?              ☐
Click DEMO or METAMASK?       ☐
Added 3+ bots?                ☐
Selected bets?                ☐
Clicked AUTO?                 ☐
Seeing pills update?          ☐
Seeing ticker update?         ☐
Winning or breakeven?         ☐
No errors in console?         ☐

If all checked ✅: YOU'RE GOOD!
```

---

## 📞 Help Quick Links

```
For setup → GETTING_STARTED.md
For reference → STRATEGIES_QUICK_REF.md
For detailed → AI_STRATEGIES_GUIDE.md
For all files → FILE_REFERENCE.md
```

---

## 🚀 You're Ready!

```
Time to get started: 2 MINUTES
Time to first profit: IMMEDIATE (if lucky!)
Time to stable strategy: 1-2 HOURS
Time to optimize: ONGOING
```

**Open index.html and start trading NOW!** 🎉

---

**Pro Tips:**
- Start with $1 bets
- Add multiple bots (diversify)
- Let AUTO mode run (don't interfere)
- Check console every 30 minutes
- Be patient (>50 trades = good sample)
- Enjoy watching it profit! 🚀
