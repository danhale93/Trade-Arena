# AI STRATEGIES & MULTI-BOT SYSTEM

**Trade Arena v4 • Enhanced Auto-Trading with Intelligent Adaptations**

---

## ✨ NEW FEATURES

### 1. **More Bots Available**
- **Before**: 6 maximum bots
- **Now**: 12 maximum bots
- **Why**: Run more strategies simultaneously, diversify approaches

### 2. **AI Strategy Profiles**
Each bot automatically assigns a unique strategy profile that adapts in real-time:

| Profile | Style | Bet Size | Methods | Best For |
|---------|-------|----------|---------|----------|
| **SCALPER** | Fast trades, tight spreads | 0.8x | Flash Loans, Arbitrage | High-frequency, low-risk |
| **TREND** | Follow momentum | 1.0x | Spot Long, Perps, Yield | Market uptrends |
| **AGGRESSIVE** | High risk/reward | 1.5x | Perp Long/Short | Volatile markets |
| **CONSERVATIVE** | Steady growth | 0.5x | Arbitrage, Yield Farm | Risk-averse, steady income |
| **BALANCED** | Mix everything | 1.0x | All methods (equal weight) | Diversified approach |
| **NICHE** | Alternative strategies | 1.2x | NFTs, Yield, Spot | Specialized markets |

### 3. **Dynamic Method Selection**
In **AUTO** mode, the system intelligently adjusts trading methods based on market conditions:

```
Market Condition    → Selected Method
─────────────────────────────────────
STABLE              → ARBITRAGE (tight spreads)
EXPLOSIVE_UP        → PERP LONG (ride the wave)
EXPLOSIVE_DOWN      → PERP SHORT or ARBITRAGE (safe)
VOLATILE            → FLASH LOAN (capitalize on spreads)
TRENDING_UP         → SPOT LONG (follow momentum)
TRENDING_DOWN       → ARBITRAGE (avoid downtrend)
LOW_LIQUIDITY       → ARBITRAGE (safest)
```

### 4. **Adaptive Edge Calculation**
Edge % adjusts automatically based on:

- **Win/Loss Streak**: Reduce after losses, increase after wins
- **Volatility**: Conservative profiles reduce edge in high volatility
- **Win Probability**: Higher probability = higher edge
- **Recent Win Rate**: Track last 20 trades, adapt accordingly

**Example**: Bot with 60% win rate in low-volatility market might get:
```
Base edge: 2.5%
After 2 wins: 2.5% × 1.15 = 2.88%
High volatility: 2.88% × 0.85 = 2.45% (reduced)
Final: 2.45% → 3.2% (probability adjustment)
```

### 5. **Intelligent Bet Sizing**
Bet amounts adjust based on:

- **Consecutive Losses**: Reduce to 30-50% of normal after losing streaks
- **Consecutive Wins**: Increase to 110% after winning streaks
- **Volatility**: Conservative profiles bet 60% less in volatile conditions
- **Liquidity**: Bet 50% less in low-liquidity environments
- **Account Risk**: Never bet > 10% of balance

**Example**: $10 bet adjustments:
```
Normal: $10
After 2 losses: $10 × 0.7 = $7
In high volatility: $7 × 0.85 = $5.95
In low liquidity: $5.95 × 0.5 = $3 (final)
```

### 6. **Real-Time Risk Management**
Each bot monitors and adjusts for:

- **Max Drawdown**: Stop trading if session loss exceeds limit
- **Consecutive Losses**: Pause after 5+ consecutive losses
- **Market Crashes**: Conservative mode pauses in explosive downtrends
- **Method Performance**: Track which methods work best for each bot

---

## 🎯 HOW AUTO MODE WORKS NOW

### Step 1: Market Analysis
```javascript
// Analyze market conditions
volatility = average of top 8 coins 24h change
volume = average daily volume
condition = STABLE, EXPLOSIVE_UP, VOLATILE, etc.
```

### Step 2: Strategy Selection
```javascript
// Choose best method for this market condition
method = selectAdaptiveMethod(strategy, marketConditions)
// e.g., VOLATILE market → FLASH LOAN
```

### Step 3: Edge Calculation
```javascript
// Calculate optimal edge percentage
edge = calculateAdaptiveEdge(
  strategy,
  marketConditions,
  botState,
  baseEdge,
  winProbability
)
// Adjusts based on wins/losses/volatility
```

### Step 4: Bet Sizing
```javascript
// Calculate safe bet amount
bet = calculateAdaptiveBetSize(
  strategy,
  marketConditions,
  botState,
  baseBet,
  availableBalance
)
// Reduces after losses, increases after wins
```

### Step 5: Execute Trade
```javascript
// Use adaptive values
actualBet = decision.adaptiveBet    // Intelligent sizing
actualEdge = decision.adaptiveEdge  // Adjusted edge
method = decision.adaptiveMethod    // Market-aware method
```

### Step 6: Update State
```javascript
// Track performance for next trade
updateBotStateAfterTrade(strategy, decision, pnl, bet)
// Updates: consecutiveWins/Losses, recent P&L, method bias
```

---

## 📊 STRATEGY STATE TRACKING

Each bot tracks:

```javascript
{
  botId: 1,
  profile: "SCALPER",
  tradesCount: 42,
  consecutiveWins: 2,
  consecutiveLosses: 0,
  recentPnL: [+10, -5, +8, ...],  // Last 20 trades
  sessionPnL: +125.50,
  riskMultiplier: 1.08,
  adaptiveEdgeAdjustment: 1.12,
  adaptiveBetAdjustment: 0.95,
  methodBias: {
    "ARBITRAGE": { wins: 25, losses: 10, avgPnL: 8.5 },
    "FLASH LOAN": { wins: 5, losses: 2, avgPnL: 12.1 }
  }
}
```

---

## 🤖 EXAMPLE: SCALPER BOT IN ACTION

**Scenario**: Market going volatile, Bitcoin up 3%, Ethereum up 2%

### Step 1: Market Analysis
```
Volatility: 2.8% (MEDIUM)
Volume: 800M (HIGH)
Direction: BULLISH
Condition: TRENDING_UP
```

### Step 2: Profile-Based Selection
```
SCALPER Profile methods: ARBITRAGE, FLASH LOAN
Optimal for TRENDING_UP: ARBITRAGE preferred
Selected: ARBITRAGE ✓
```

### Step 3: Edge Calculation
```
Base edge from Claude AI: 2.0%
Recent win rate (last 20): 58%
Volatility adjustment: ×1.0 (medium volatility, neutral)
Consecutive wins: 0 (no adjustment)
Final edge: 2.0% × (1 + (0.58-0.5)×0.5) = 2.08% ✓
```

### Step 4: Bet Sizing
```
Base bet: $10
SCALPER multiplier: 0.8 (conservative)
Base: $10 × 0.8 = $8
Recent win rate: 58% (no adjustment)
Volatility adjustment: ×1.0 (medium, no change)
Final bet: $8 ✓
```

### Step 5: Spin
```
Claude suggests: PEPE spot long, 1.7x multiplier
AI Strategy adjusts to: ARBITRAGE (market-aware)
Edge shown: 2.08%
Bet shown: $8
Win probability: 57%
```

### Step 6: Result (Win!)
```
Gross P&L: $8 × 1.7x = +$13.60
Gas + Slippage: -$0.15
Net P&L: +$13.45

Update bot state:
✓ consecutiveWins = 1
✓ recentPnL = [..., +13.45]
✓ riskMultiplier = 1.08 (slight increase)
✓ ARBITRAGE win counted
```

---

## 🎮 USING THE NEW SYSTEM

### Adding Bots
```
1. Click "+ ADD BOT" button (up to 12 times)
2. Each bot gets random profile (SCALPER, TREND, etc.)
3. Profile shows under bot name
4. Each has independent strategy state
```

### Running Auto Mode (Smart)
```
1. Select bet amount ($1-$100)
2. Click "AUTO" button
3. System will:
   ✓ Analyze market every trade
   ✓ Adjust method based on conditions
   ✓ Calculate optimal edge
   ✓ Size bets intelligently
   ✓ Track win rate and method performance
   ✓ Reduce size after losses
4. Watch pills update in real-time
   - Token (what it's trading)
   - Method (ARBIT, FLASH, SPOT, etc.)
   - Edge % (original AI edge)
   - Auto Edge % (adaptive adjustment)
```

### Monitoring Performance
```
Pills show:
• Token: What's being traded
• Method: What strategy is used
• Edge %: AI's estimated edge
• Auto Edge %: Real adjusted edge

Ticker shows:
• Win/Loss result
• Amount made/lost
• Market condition (if auto)
• Recent win rate % (if auto)

P&L badge: Running total for this bot
```

### Console Commands (F12)
```javascript
// Get bot strategy insights
getBotStrategyInsights(botStrategies[1])
// Returns: trades, P&L, win rate, best method, etc.

// Get market analysis
analyzeMarketConditions(marketCache)
// Returns: volatility, volume, direction, condition

// See all bot states
console.log(botStrategies)

// Check recent P&L for bot 3
console.log(botStrategies[3].recentPnL)

// See method performance
console.log(botStrategies[1].methodBias)
```

---

## 📈 STRATEGY PROFILES EXPLAINED

### SCALPER (Fast, Safe)
```
Profile: Quick trades, tight spreads
Methods: ARBITRAGE (70%), FLASH LOAN (30%)
Edge: 1.0-3.5%
Bet: 0.8× base
Risk: Low

Best when:
• Stable market conditions
• Tight bid-ask spreads
• High trading frequency preferred

Example session:
10 trades × $8 avg bet × 55% win rate = +$44 profit
```

### TREND (Follow Momentum)
```
Profile: Ride the market momentum
Methods: SPOT LONG (50%), PERP LONG (30%), YIELD (20%)
Edge: 1.5-4.5%
Bet: 1.0× base
Risk: Medium

Best when:
• Clear uptrends or downtrends
• Market moving consistently
• Want higher rewards

Example session:
5 trades × $10 bet × 55% win rate = +$22.50 profit
```

### AGGRESSIVE (High Risk/Reward)
```
Profile: Big bets, big edge
Methods: PERP LONG (40%), SPOT SHORT (30%), PERP SHORT (30%)
Edge: 2.0-6.5%
Bet: 1.5× base
Risk: High

Best when:
• High volatility environment
• Confident in AI predictions
• Larger account to absorb losses

Example session:
5 trades × $15 bet × 52% win rate = +$30 profit
(But also higher losses possible)
```

### CONSERVATIVE (Steady, Safe)
```
Profile: Low volatility, steady income
Methods: ARBITRAGE (60%), YIELD FARM (40%)
Edge: 0.8-2.5%
Bet: 0.5× base
Risk: Very Low

Best when:
• Want consistent small wins
• Market is uncertain
• Protecting capital is priority

Example session:
20 trades × $5 avg bet × 60% win rate = +$30 profit
(Steady, predictable)
```

### BALANCED (Diversified)
```
Profile: Mix of all strategies
Methods: Equal weight all methods
Edge: 1.2-4.0%
Bet: 1.0× base
Risk: Low-Medium

Best when:
• Want exposure to all markets
• Unsure which strategy works best
• Prefer balanced approach

Example session:
15 trades × $10 avg bet × 55% win rate = +$41 profit
(Balanced risk/reward)
```

### NICHE (Alternative Markets)
```
Profile: NFT flips, yield farming, alternative
Methods: NFT FLIP (30%), YIELD (40%), SPOT (30%)
Edge: 1.5-5.5%
Bet: 1.2× base
Risk: Medium-High

Best when:
• Interest in NFT markets
• Yield farming opportunities
• Alternative assets preferred

Example session:
8 trades × $12 avg bet × 54% win rate = +$20 profit
```

---

## 🔍 WHAT CHANGES IN AUTO MODE

### Edge Display
```
Before AUTO:
  Edge: 2.5% (just Claude's estimate)

After AUTO:
  Edge: 2.5% (Claude estimate)
  Auto Edge: 2.08% (Adaptive adjustment)
  
Why: Shows how strategy adapts to:
  • Your recent win rate
  • Market volatility
  • Consecutive wins/losses
```

### Method Selection
```
Before AUTO:
  Method: Whatever Claude picks (random)

After AUTO:
  Method: Market-aware selection
  • FLASH LOAN in volatile markets
  • ARBITRAGE in stable markets
  • PERP in trending markets
  • etc.
```

### Bet Sizing
```
Before AUTO:
  Bet: $10 (fixed)

After AUTO:
  Bet: Intelligent sizing
  • $8 after 1 loss
  • $6 after 2 losses
  • $10 after 2 wins
  • Adjusts with volatility
```

### Pause/Resume
```
System automatically pauses trading if:
• 5+ consecutive losses (high-risk mode)
• Session loss > max drawdown
• Market crash detected (conservative profiles)

Manual restart: Click "SPIN" to resume
```

---

## 📊 EXAMPLE PORTFOLIO (6 BOTS)

```
Bot 1 (SCALPER):  +$125.50  |  58% WR  |  42 trades
Bot 2 (TREND):    +$89.25   |  56% WR  |  28 trades
Bot 3 (AGGRESSIVE): -$45.30 |  51% WR  |  19 trades
Bot 4 (CONSERVATIVE): +$156.75 | 62% WR | 75 trades
Bot 5 (BALANCED): +$102.00  |  55% WR  |  32 trades
Bot 6 (NICHE):    +$78.50   |  54% WR  |  22 trades
────────────────────────────────────────────────
TOTAL:            +$506.70  |  55% WR  | 218 trades
```

Even with AGGRESSIVE bot losing, portfolio stays profitable due to diversification.

---

## 🎯 BEST PRACTICES

### 1. **Diversify Profiles**
```
DON'T: Create 6 SCALPER bots
DO:    Mix SCALPER, CONSERVATIVE, TREND, AGGRESSIVE
```

### 2. **Start Small in Auto**
```
First bot: $1 bet in AUTO
Second/third: $5-10 bets
Monitor results
Then scale up
```

### 3. **Monitor Strategy Adaptation**
```
In AUTO mode, watch:
• Pills changing method (market adaptation)
• Auto Edge % moving (volatility adjustment)
• Consecutive wins/losses (sizing changes)
• Recent win rate % (strategy effectiveness)
```

### 4. **Let Bots Run Independently**
```
Each bot manages own:
✓ Strategy selection
✓ Edge calculation
✓ Bet sizing
✓ Risk management
✓ Method performance tracking

You just:
• Set initial bet size
• Click AUTO
• Monitor overall portfolio
```

### 5. **Review Performance**
```
Check in browser console:
getBotStrategyInsights(botStrategies[1])

Look for:
• Consistent win rate > 50%
• Best performing methods
• Efficient risk management
• Reasonable edge adjustments
```

---

## ⚙️ TECHNICAL DETAILS

### Market Analysis Algorithm
```javascript
// Fetch top 8 coins, analyze:
volatility = avg(absolute(24h_change))
volume = avg(daily_volume)
momentum = avg(24h_change)

// Classify market
if (volatility < 2% && volume > 500M) → STABLE
if (volatility > 5% && change > 0) → EXPLOSIVE_UP
if (volatility > 5% && change < 0) → EXPLOSIVE_DOWN
... etc
```

### Edge Adjustment Formula
```javascript
edge = baseEdge
edge *= (1 + (winProbability - 0.5) * 0.5)
edge *= volatilityMultiplier (0.6-1.2 based on profile)
edge *= consecutiveWinMultiplier (0.8-1.15)
edge = clamp(minEdge, maxEdge)
```

### Bet Sizing Formula
```javascript
bet = baseBet
bet *= profileMultiplier (0.5-1.5)
bet *= volatilityMultiplier (0.5-1.3)
bet *= consecutiveLossMultiplier (0.7-0.5)
bet *= consecutiveWinMultiplier (1.0-1.1)
bet = max(1, min(bet, maxBet))
```

---

## 🚀 GETTING STARTED

1. **Create Multiple Bots**
   ```
   Click "+ ADD BOT" 6-12 times
   Each gets random profile
   ```

2. **Set Conservative Bets**
   ```
   Bot 1: $1
   Bot 2: $1
   Bot 3: $2
   Bot 4: $1
   Bot 5: $2
   Bot 6: $3
   ```

3. **Enable AUTO on Each**
   ```
   Click AUTO on each bot
   System adapts method, edge, bet
   ```

4. **Monitor & Scale**
   ```
   Run 20-30 trades per bot
   Check win rates
   If > 53%, increase bet size
   ```

5. **Review Insights**
   ```
   getBotStrategyInsights(botStrategies[1])
   See which methods work best
   Adjust strategy if needed
   ```

---

## 📞 SUPPORT

For detailed function documentation, see:
- `ai-strategies.js` - Source code with comments
- Browser console - Test with getSample code
- README_v4.md - General features

All functions exported for testing:
```javascript
// Available in console:
analyzeMarketConditions()
selectAdaptiveMethod()
calculateAdaptiveEdge()
calculateAdaptiveBetSize()
updateBotStateAfterTrade()
getBotStrategyInsights()
```

---

## ✅ SUMMARY

Your bots now:
✅ Intelligently adapt methods to market conditions
✅ Calculate edge dynamically based on performance
✅ Size bets based on risk and volatility
✅ Track recent win rates and method performance
✅ Pause trading automatically when risks are high
✅ Run up to 12 bots with different strategies
✅ Operate independently with zero manual intervention

**Result**: More profitable, adaptive, intelligent trading system! 🚀
