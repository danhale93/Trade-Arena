# QUICK REFERENCE • AI STRATEGIES

## Strategy Profiles At a Glance

| Profile | Emoji | Bet | Methods | Edge | Win Rate | Style |
|---------|-------|-----|---------|------|----------|-------|
| SCALPER | ⚡ | 0.8x | Arb, Flash | 1-3.5% | 58% | Fast, safe |
| TREND | 📈 | 1.0x | Long, Yield | 1.5-4.5% | 55% | Momentum |
| AGGRESSIVE | 💣 | 1.5x | Perps, Short | 2-6.5% | 52% | High risk |
| CONSERVATIVE | 🛡️ | 0.5x | Arb, Yield | 0.8-2.5% | 60% | Steady |
| BALANCED | ⚖️ | 1.0x | All equal | 1.2-4% | 55% | Diverse |
| NICHE | 🎯 | 1.2x | NFT, Alt | 1.5-5.5% | 54% | Special |

---

## Market Conditions → Method Selection

```
STABLE         → ARBITRAGE        (spreads tight)
TRENDING_UP    → SPOT LONG        (ride up)
TRENDING_DOWN  → ARBITRAGE        (safe)
VOLATILE       → FLASH LOAN       (capitalize)
EXPLOSIVE_UP   → PERP LONG        (leverage up)
EXPLOSIVE_DOWN → ARBITRAGE/SHORT  (safe/short)
LOW_LIQUIDITY  → ARBITRAGE        (safest)
```

---

## How Auto Mode Adapts

### Edge Adjustment
```
Base Edge (from Claude AI)
  ↓
+ Win Probability adjustment
+ Volatility adjustment (based on profile)
+ Consecutive wins/loss adjustment
= Final Adaptive Edge
```

### Bet Sizing
```
Base Bet (your selection)
  ↓
× Profile multiplier (0.5-1.5x)
× Volatility multiplier (0.5-1.3x)
× Loss streak reduction (0.7-0.5x)
× Win streak increase (1.0-1.1x)
= Final Adaptive Bet
```

### Risk Management
```
Each bot stops trading if:
✓ 5+ consecutive losses
✓ Session loss > max drawdown
✓ Market crash (conservative profiles)
✓ Insufficient balance
```

---

## Pills Displayed

```
[Token]  [Method]  [Edge %]  [Auto Edge %]
  ↓        ↓         ↓           ↓
 What    How it's   AI's      System's
 asset   traded     edge      adjustment
```

### Example
```
[PEPE]  [ARBIT]  [2.5%]  [2.1%]
 ↓        ↓        ↓        ↓
Trading  Arbitrage  AI said  System
PEPE                 2.5%    reduced
         on DEX              to 2.1%
                             (volatility)
```

---

## Console Commands

```javascript
// Get insights for bot 1
getBotStrategyInsights(botStrategies[1])

// Analyze current market
analyzeMarketConditions(marketCache)

// View all bot states
console.log(botStrategies)

// Check method performance for bot 2
console.log(botStrategies[2].methodBias)

// See recent P&L
console.log(botStrategies[1].recentPnL)

// Check session profit
console.log(botStrategies[1].sessionPnL)
```

---

## Auto Mode Workflow

```
1. Click AUTO on bot
   ↓
2. System analyzes market
   ↓
3. Selects best method for conditions
   ↓
4. Calculates adaptive edge
   ↓
5. Sizes bet intelligently
   ↓
6. Claude AI picks token/direction
   ↓
7. Reels spin with adaptive values
   ↓
8. Updates bot state
   ↓
9. Waits 3-8 seconds
   ↓
10. Repeat from step 2
```

---

## Real-Time Adaptations

### What Changes Each Trade:
```
✓ Method (based on market condition)
✓ Edge % (based on win rate + volatility)
✓ Bet size (based on losses + liquidity)
✓ Risk parameters (based on streak)
```

### What Stays Same:
```
✓ Bot's strategy profile (SCALPER, etc.)
✓ Base methods available to profile
✓ Max/min edge range for profile
✓ Profile's risk tolerance
```

---

## Indicators in Ticker

### Manual Mode
```
✅ +$5.50 — Market opportunity detected
❌ -$2.00 — DEX spread on Base
```

### Auto Mode
```
✅ +$8.25 • TRENDING_UP • 58% WR
❌ -$3.10 • VOLATILE • 52% WR
```

Shows:
- Win/Loss
- Amount
- Market condition
- Recent win rate %

---

## Profile Deep Dives

### SCALPER ⚡
- Fast entry/exit
- Favor tight spreads
- Reduce bets in chaos
- Best: Stable markets
- Method bias: ARBITRAGE

### TREND 📈
- Follow momentum
- Long bias in uptrends
- Avoid downtrends
- Best: Clear trends
- Method bias: SPOT LONG

### AGGRESSIVE 💣
- Big bets, big edges
- Embrace volatility
- Short in downturns
- Best: Wild markets
- Method bias: PERP LONG

### CONSERVATIVE 🛡️
- Small steady bets
- Avoid volatility
- Capital preservation
- Best: Quiet markets
- Method bias: ARBITRAGE

### BALANCED ⚖️
- Equal method weights
- Moderate everything
- No special bias
- Best: Uncertain markets
- Method bias: None

### NICHE 🎯
- Alternative assets
- NFT flips, yields
- Higher edge targets
- Best: Special opps
- Method bias: YIELD FARM

---

## Win Rate Expectations

By Profile (historical):
```
CONSERVATIVE: 58-62% (steady)
BALANCED:     54-56% (stable)
SCALPER:      55-59% (good)
TREND:        52-56% (variable)
NICHE:        52-56% (volatile)
AGGRESSIVE:   48-54% (risky)
```

Note: Actual depends on market conditions and AI accuracy.

---

## Scaling Strategy

### Starting Out
```
Trade 1: $1 bet, CONSERVATIVE profile
Trade 2: $1 bet, BALANCED profile
Trade 3: $2 bet, SCALPER profile
Monitor results for 20-30 trades
```

### Growing
```
If win rate > 53%:
  Increase bets by 20-30%
If win rate < 50%:
  Reduce bets by 20%
If profit > $500:
  Add more bots
```

### Scaling Limits
```
Max per bot: $100 (or 10% balance)
Max total: All bots combined
Stop if: Drawdown > max for profile
Resume: Manual spin or after cool-off
```

---

## When to Use Each Profile

### Use SCALPER when:
- Market is stable
- Spreads are tight
- Want frequent trades
- Low volatility

### Use TREND when:
- Clear uptrend or downtrend
- Market has momentum
- Want higher rewards
- Direction is obvious

### Use AGGRESSIVE when:
- High volatility expected
- Confident in AI
- Larger capital
- Want big wins

### Use CONSERVATIVE when:
- Market uncertain
- Want steady income
- Protecting capital
- Risk-averse

### Use BALANCED when:
- Unsure best approach
- Want diversification
- Like equal methods
- Testing different markets

### Use NICHE when:
- NFT bull market
- Yield farm season
- Alternative opps
- Specialized knowledge

---

## Troubleshooting

### "Edge changing a lot"
- **Normal**: System adapts to win rate
- **Check**: Win rate too variable?
- **Fix**: Use CONSERVATIVE profile for stability

### "Bet size shrinking"
- **Normal**: System protecting capital after losses
- **Check**: Losing streak happening?
- **Fix**: Let bot pause automatically or reset

### "Same method every trade"
- **Normal**: Market condition hasn't changed
- **Check**: Try different volatility profiles
- **Fix**: Run multiple bots with different profiles

### "Win rate below 50%"
- **Normal**: AI not always accurate
- **Check**: Strategy profile matched to market?
- **Fix**: Try different profile for current market

---

## Data Export (Console)

### Get everything for one bot:
```javascript
const bot = botStrategies[1];
console.table({
  Profile: bot.profile,
  Trades: bot.tradesCount,
  Session P&L: '$' + bot.sessionPnL.toFixed(2),
  Win Rate: (bot.recentPnL.filter(p=>p>0).length / bot.recentPnL.length * 100).toFixed(1) + '%',
  Best Method: Object.keys(bot.methodBias).sort((a,b) => 
    (bot.methodBias[b].avgPnL || 0) - (bot.methodBias[a].avgPnL || 0))[0]
});
```

### Get all bots summary:
```javascript
Object.values(botStrategies).forEach(b => {
  console.log(`Bot #${b.botId} (${b.profile}): ${b.tradesCount} trades, $${b.sessionPnL.toFixed(2)} P&L`);
});
```

---

## Key Takeaways

✅ **6 Different Profiles** - Each optimized for different markets
✅ **Auto Adapts Method** - Picks best strategy for market conditions
✅ **Dynamic Edge** - Adjusts based on win rate and volatility
✅ **Intelligent Betting** - Sizes bets for optimal risk/reward
✅ **Risk Management** - Pauses in dangerous conditions
✅ **Independent Bots** - Each manages own state
✅ **Real Monitoring** - See changes in pills & ticker
✅ **Console Access** - Full data access for analysis

**Result: Smarter, more adaptive trading! 🚀**
