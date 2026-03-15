# 🏅 TRADE OLYMPICS SYSTEM
## Head-to-Head AI Model Competition

### Overview
The Trade Olympics creates a fair, bracket-based competition where each of the 12 AI models is assigned to specific trade scenarios (method/token/edge combinations) and competes head-to-head on equal footing.

**Think of it like the actual Olympics** - each "discipline" (trade scenario) has a dedicated competitor, and we track:
- 🥇 Gold Medals (1st place overall)
- 🥈 Silver Medals (2nd place)
- 🥉 Bronze Medals (3rd place)
- Overall Rankings

---

## System Architecture

### Tournament Structure

**Dimensions:**
- **8 Trade Methods**: ARBITRAGE, FLASH LOAN, SPOT LONG, SPOT SHORT, PERP LONG, PERP SHORT, NFT FLIP, YIELD FARM
- **12 Tokens**: BTC, ETH, SOL, AVAX, MATIC, LINK, UNI, AAVE, CRV, ARB, OP, BLUR
- **5 Edge Tiers**: MICRO (0.1-0.5%), SMALL (0.5-1.5%), MEDIUM (1.5-3.5%), LARGE (3.5-6.5%), MEGA (6.5-10%)

**Total Brackets: 8 × 12 × 5 = 480 unique competition brackets**

### Model Distribution

Each model is assigned approximately **40 brackets** through round-robin distribution:

```
Model 1 (gpt-5-turbo) → Brackets 1-40
Model 2 (claude-3.5-sonnet) → Brackets 41-80
Model 3 (grok-3) → Brackets 81-120
...
Model 12 (gemini-2.0) → Brackets 441-480
```

### Data Tracking

For each bracket, we track:
- **Trades**: Number of times this scenario executed
- **Wins**: Successful trades
- **Losses**: Failed trades
- **Total P&L**: Cumulative profit/loss
- **Win Rate**: Success percentage
- **Average Edge**: Median edge for this bracket
- **Average P&L**: Average profit per trade

---

## How It Works

### 1. Trade Execution Flow

```javascript
// When a bot makes a trade:
const decision = await callAI(marketData, bet, botId);

// Inside callAI → callAIModel:
// Step 1: Generate trade decision (method, token, edge)
// Step 2: Use Trade Olympics to assign the appropriate model
const olympicsAssignment = TRADE_OLYMPICS.getModelForTrade(
  decision.method,    // "ARBITRAGE"
  decision.token,     // "BTC"
  decision.edge_pct   // 1.2
);

// Step 3: Model is determined by bracket, not by bot profile!
// BOT PROFILES still exist but don't control model selection
// The TRADE METHOD/TOKEN/EDGE now controls model assignment

// Step 4: Record the result in the Olympics bracket
TRADE_OLYMPICS.recordTrade(olympicsBracket, {
  outcome: 'WIN' or 'LOSS',
  pnl: profit_or_loss,
  edge: edge_percentage
});
```

### 2. Model Assignment Logic

**For a trade with:**
- Method: ARBITRAGE
- Token: BTC
- Edge: 1.2%

**System determines:**
- Edge Tier: SMALL (0.5-1.5%)
- Bracket: "ARBITRAGE_BTC_SMALL"
- Assigned Model: claude-3.5-sonnet (or whichever model was assigned)

**Key Point**: The same trade scenario ALWAYS goes to the same model, ensuring fair comparison.

---

## Key Functions

### Basic Operations

#### Get Model for Trade
```javascript
const assignment = TRADE_OLYMPICS.getModelForTrade(
  'ARBITRAGE',  // method
  'BTC',        // token
  1.2           // edge %
);

// Returns:
{
  model: 'claude-3.5-sonnet',
  method: 'ARBITRAGE',
  token: 'BTC',
  edgeTier: 'SMALL',
  bracket: 'ARBITRAGE_BTC_SMALL',
  isOlympics: true,
  bracketInfo: { ... }
}
```

#### Record Trade Result
```javascript
TRADE_OLYMPICS.recordTrade('ARBITRAGE_BTC_SMALL', {
  outcome: 'WIN',           // or 'LOSS'
  pnl: 125.50,              // $125.50 profit
  edge: 1.2                 // 1.2% edge
});

// Updates:
// - Bracket stats (wins, losses, total P&L, win rate)
// - Model standings (overall performance)
// - Competition log (full history)
```

### Leaderboards & Analytics

#### Overall Leaderboard
```javascript
// By total P&L (default)
const rankings = TRADE_OLYMPICS.getLeaderboard('totalPnL');

// Includes: medal (🥇🥈🥉), rank, model name, provider, ELO, stats
// [
//   { rank: 1, medal: '🥇', model: 'gpt-5-turbo', totalPnL: $45,230, ... },
//   { rank: 2, medal: '🥈', model: 'claude-3.5-sonnet', totalPnL: $41,120, ... },
//   ...
// ]
```

#### By Different Metrics
```javascript
// Win rate leaderboard
TRADE_OLYMPICS.getLeaderboard('winRate')

// Number of trades
TRADE_OLYMPICS.getLeaderboard('trades')

// Average trade value
TRADE_OLYMPICS.getLeaderboard('avgTradeValue')
```

#### Top Performing Brackets
```javascript
const topBrackets = TRADE_OLYMPICS.getTopBrackets(10);

// Returns top 10 brackets by total P&L:
// [
//   { bracket: 'ARBITRAGE_BTC_SMALL', model: 'gpt-5-turbo', 
//     wins: 145, losses: 23, totalPnL: $12,450, winRate: 0.863, ... },
//   ...
// ]
```

#### Weakest Brackets (Opportunities)
```javascript
const weakBrackets = TRADE_OLYMPICS.getWeakestBrackets(10);

// Returns bottom 10 brackets by P&L
// These are areas where models are underperforming
// - May need strategy adjustment
// - Or different market conditions
```

#### Model-Specific Analysis

```javascript
// How is gpt-5-turbo doing on ARBITRAGE trades?
const stats = TRADE_OLYMPICS.getModelMethodStats('gpt-5-turbo', 'ARBITRAGE');
// { model, method, brackets, totalTrades, totalWins, totalPnL, winRate }

// How is gpt-5-turbo doing on BTC trades?
const stats = TRADE_OLYMPICS.getModelTokenStats('gpt-5-turbo', 'BTC');
// { model, token, brackets, totalTrades, totalWins, totalPnL, winRate }
```

#### Head-to-Head Comparison
```javascript
// Claude vs GPT-5
const comparison = TRADE_OLYMPICS.compareModels('claude-3.5-sonnet', 'gpt-5-turbo');

// Returns:
// {
//   model1: 'claude-3.5-sonnet',
//   model2: 'gpt-5-turbo',
//   pnlDiff: -4110,  // GPT-5 is $4110 ahead
//   winRateDiff: 0.05,  // GPT-5 has 5% higher win rate
//   tradesDiff: -230,  // Claude has 230 fewer trades
//   winner: 'gpt-5-turbo',
//   stats1: { ... },
//   stats2: { ... }
// }
```

#### Get Summary
```javascript
const summary = TRADE_OLYMPICS.getSummary();

// {
//   totalBrackets: 480,
//   totalModels: 12,
//   totalTrades: 8,450,
//   totalPnL: $1,234,560,
//   topModel: 'gpt-5-turbo',
//   topModelPnL: $245,670,
//   topModelWinRate: 0.872
// }
```

---

## UI Integration

### Display Model Assignment in Bot Cards
```javascript
// In showBotResult() or your bot display:
if (decision.isOlympicsMatch) {
  const bracket = decision.olympicsBracket;
  const model = decision.aiModel;
  
  // Show: "🏅 ARBITRAGE_BTC_SMALL • gpt-5-turbo"
  botCard.innerHTML += `
    <div style="color: gold;">
      🏅 ${bracket}<br>
      Model: ${model}
    </div>
  `;
}
```

### Create Olympics Leaderboard Panel
```html
<div id="olympics-leaderboard" class="panel">
  <h3>🏅 Trade Olympics Leaderboard</h3>
  
  <!-- Summary Stats -->
  <div class="stats">
    <div>Total Brackets: <span id="total-brackets">480</span></div>
    <div>Total Trades: <span id="total-trades">0</span></div>
    <div>Total P&L: <span id="total-pnl">$0</span></div>
  </div>
  
  <!-- Rankings Table -->
  <table id="olympics-rankings">
    <tr>
      <th>Rank</th>
      <th>Model</th>
      <th>Provider</th>
      <th>ELO</th>
      <th>P&L</th>
      <th>Win Rate</th>
      <th>Trades</th>
    </tr>
    <!-- Populated by JavaScript -->
  </table>
  
  <!-- Best Brackets Tab -->
  <div class="tabs">
    <button onclick="showTopBrackets()">Top Brackets</button>
    <button onclick="showWeakBrackets()">Weakest Brackets</button>
  </div>
</div>
```

### Update Leaderboard Periodically
```javascript
// Every 30 seconds
setInterval(() => {
  const summary = TRADE_OLYMPICS.getSummary();
  document.getElementById('total-trades').textContent = summary.totalTrades;
  document.getElementById('total-pnl').textContent = '$' + summary.totalPnL.toLocaleString();
  
  const rankings = TRADE_OLYMPICS.getLeaderboard('totalPnL');
  const table = document.getElementById('olympics-rankings');
  
  rankings.forEach(model => {
    const row = table.insertRow();
    row.innerHTML = `
      <td>${model.medal} ${model.rank}</td>
      <td>${model.model}</td>
      <td>${model.provider}</td>
      <td>${model.elo}</td>
      <td>$${model.totalPnL.toLocaleString()}</td>
      <td>${(model.overallWinRate * 100).toFixed(1)}%</td>
      <td>${model.totalTrades}</td>
    `;
  });
}, 30000);
```

---

## Tournament Rules

### 1. Fair Assignment
- Each model gets ~40 brackets
- Assignments made sequentially through round-robin
- Ensures every model touches every method/token/edge combination

### 2. Trade Recording
- Every trade in a bracket goes to that model's record
- Results accumulate over time
- Can run thousands of trades per bracket

### 3. Win Rate Calculation
```
Win Rate = Wins / Total Trades

Example:
- ARBITRAGE_BTC_SMALL (gpt-5-turbo)
- 145 wins out of 168 trades
- Win Rate: 86.3%
```

### 4. P&L Calculation
```
Total P&L = Sum of all (win * profit) + (loss * loss)

Example:
- 145 winning trades at avg $150 = $21,750
- 23 losing trades at avg -$50 = -$1,150
- Total P&L = $20,600
```

### 5. Medal Assignment
```
🥇 GOLD: Model with highest total P&L
🥈 SILVER: Model with 2nd highest total P&L
🥉 BRONZE: Model with 3rd highest total P&L
```

---

## Example Trading Scenario

### Bot Makes Trade
```
Bot #3 decides to trade ARBITRAGE on BTC with 1.2% edge
```

### Trade Olympics Activated
```
1. Trade decision: method=ARBITRAGE, token=BTC, edge=1.2%
2. System calculates: edge tier = SMALL
3. Bracket identified: ARBITRAGE_BTC_SMALL
4. Model assigned: claude-3.5-sonnet (pre-assigned to this bracket)
5. Decision executed with claude's personality adjustments
```

### Trade Result
```
Outcome: WIN
P&L: +$175
```

### Recording
```
ARBITRAGE_BTC_SMALL bracket updated:
  - Trades: 168
  - Wins: 146 (was 145)
  - Losses: 22
  - Win Rate: 86.9%
  - Total P&L: $20,775

claude-3.5-sonnet standings updated:
  - Total Trades: 6,842
  - Total Wins: 5,234
  - Total P&L: $342,105
  - Overall Win Rate: 76.5%
```

---

## Console Logging

### Olympics Match Detection
```
[Multi-AI Arena] Bot #3: Model claude-3.5-sonnet (Anthropic, ELO 1390) 🏅 ARBITRAGE_BTC_SMALL
  Decision: ARBITRAGE on BTC
  Edge: 1.2% | Win Prob: 68%
```

### Initialization
```
[Trade Olympics] Initialized with 12 models across 480 brackets

[Trade Olympics] Bracket Assignments:

  gpt-5-turbo (ELO: 1400)
    Assigned Brackets: 40
      • ARBITRAGE_BTC_MICRO
      • ARBITRAGE_BTC_SMALL
      • ARBITRAGE_BTC_MEDIUM
      ... and 37 more

  claude-3.5-sonnet (ELO: 1390)
    Assigned Brackets: 40
      • ARBITRAGE_ETH_MICRO
      • ARBITRAGE_ETH_SMALL
      ...
```

---

## Performance Insights

### What The Olympics Tells Us

**By Bracket:**
- Which trade methods are most profitable
- Which tokens are best opportunities
- Which edge tiers have highest success rates

**By Model:**
- Overall effectiveness across all scenarios
- Specialization (good at certain methods/tokens)
- Consistency

**Head-to-Head:**
- Direct comparison on identical trades
- Win rate differences
- P&L spread

### Analysis Examples

```javascript
// Is ARBITRAGE better than FLASH LOAN overall?
const arbBrackets = Object.values(TRADE_OLYMPICS.BRACKETS)
  .filter(b => b.method === 'ARBITRAGE');
const avgPnL = arbBrackets.reduce((sum, b) => sum + b.totalPnL, 0) / arbBrackets.length;

// Is gpt-5-turbo better on PERP trades than SPOT trades?
const perpStats = TRADE_OLYMPICS.getModelMethodStats('gpt-5-turbo', 'PERP LONG');
const spotStats = TRADE_OLYMPICS.getModelMethodStats('gpt-5-turbo', 'SPOT LONG');
console.log('Perp Win Rate:', perpStats.winRate);
console.log('Spot Win Rate:', spotStats.winRate);
```

---

## Files

- **trade-olympics.js**: Main system (647 lines)
- **multi-ai-arena.js**: Updated callAIModel() to use Trade Olympics
- **index.html**: Script reference added

## Next Steps

1. ✅ Trade Olympics initialized on page load
2. ✅ Models assigned to 480 brackets
3. ✅ Every trade recorded to bracket
4. 📋 Create Olympics Leaderboard UI panel
5. 📋 Add bracket detail views
6. 📋 Export Olympics data as CSV for analysis
7. 📋 Create method/token/edge heat maps

---

## Summary

The Trade Olympics creates a **scientific, fair comparison** of all 12 AI models across:
- 8 trading methods
- 12 tokens
- 5 edge tiers

Each model competes on exactly the same scenarios, allowing you to see:
- 🥇 Which model is best overall
- 📊 Which is best at specific methods
- 🎯 Which tokens are most profitable
- 💪 Which edge ranges work best
- 🏅 Real competitive rankings with medals
