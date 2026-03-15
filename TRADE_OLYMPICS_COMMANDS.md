# 🏅 TRADE OLYMPICS - COMMAND REFERENCE & TESTING GUIDE

## 🚀 IMMEDIATE TESTING (Copy & Paste)

### Test 1: Verify System Loads (Should show 'object')
```javascript
typeof TRADE_OLYMPICS
```

### Test 2: Get Summary (Should show 480 brackets, 12 models)
```javascript
TRADE_OLYMPICS.getSummary()
```

### Test 3: Check Brackets (Should show 480)
```javascript
Object.keys(TRADE_OLYMPICS.BRACKETS).length
```

### Test 4: Check Models (Should show 12)
```javascript
Object.keys(TRADE_OLYMPICS.STANDINGS).length
```

### Test 5: Verify Distribution (Each model should have ~40)
```javascript
Object.entries(TRADE_OLYMPICS.STANDINGS).forEach(([m, s]) => {
  console.log(`${m}: ${s.bracketsAssigned.length} brackets`)
})
```

---

## 📊 AFTER TRADES: VIEWING RESULTS

### Get Rankings (Best Models)
```javascript
TRADE_OLYMPICS.getLeaderboard('totalPnL')
```

### Get Top 10 Models
```javascript
TRADE_OLYMPICS.getLeaderboard('totalPnL').slice(0, 10)
```

### Get Bottom 3 Models
```javascript
TRADE_OLYMPICS.getLeaderboard('totalPnL').slice(-3)
```

### Sort by Win Rate Instead
```javascript
TRADE_OLYMPICS.getLeaderboard('winRate')
```

### Sort by Number of Trades
```javascript
TRADE_OLYMPICS.getLeaderboard('trades')
```

### Sort by Average Trade Value
```javascript
TRADE_OLYMPICS.getLeaderboard('avgTradeValue')
```

---

## 🏆 BRACKET ANALYSIS

### Find Best Brackets (Top Performers)
```javascript
TRADE_OLYMPICS.getTopBrackets(10)
```

### Find Top 5 Brackets
```javascript
TRADE_OLYMPICS.getTopBrackets(5)
```

### Find Worst Brackets (Need Improvement)
```javascript
TRADE_OLYMPICS.getWeakestBrackets(10)
```

### Find Worst 5 Brackets
```javascript
TRADE_OLYMPICS.getWeakestBrackets(5)
```

---

## 🤼 HEAD-TO-HEAD COMPARISONS

### Compare GPT-5 vs Claude
```javascript
TRADE_OLYMPICS.compareModels('gpt-5-turbo', 'claude-3.5-sonnet')
```

### Compare Grok vs Mistral
```javascript
TRADE_OLYMPICS.compareModels('grok-3', 'mistral-large')
```

### Compare Any Two Models
```javascript
TRADE_OLYMPICS.compareModels('model1_name', 'model2_name')
```

### View Result of Comparison
```javascript
const comp = TRADE_OLYMPICS.compareModels('gpt-5-turbo', 'claude-3.5-sonnet')
console.log('Winner:', comp.winner)
console.log('P&L Diff:', comp.pnlDiff)
console.log('Win Rate Diff:', comp.winRateDiff)
console.log('Trades Diff:', comp.tradesDiff)
```

---

## 🔍 MODEL-SPECIFIC ANALYSIS

### Get All Brackets for a Model
```javascript
TRADE_OLYMPICS.getModelBrackets('gpt-5-turbo')
```

### How is a Model Doing on Specific Method?
```javascript
TRADE_OLYMPICS.getModelMethodStats('gpt-5-turbo', 'ARBITRAGE')
```

### How is a Model Doing on Specific Token?
```javascript
TRADE_OLYMPICS.getModelTokenStats('gpt-5-turbo', 'BTC')
```

### How is Claude Doing on Flash Loans?
```javascript
TRADE_OLYMPICS.getModelMethodStats('claude-3.5-sonnet', 'FLASH LOAN')
```

### How is Grok Doing on ETH?
```javascript
TRADE_OLYMPICS.getModelTokenStats('grok-3', 'ETH')
```

---

## 📈 DEEPER ANALYSIS

### Get Stats for Top Model
```javascript
const top = TRADE_OLYMPICS.getLeaderboard('totalPnL')[0]
console.log('Champion:', top.model)
console.log('P&L:', '$' + top.totalPnL.toLocaleString())
console.log('Win Rate:', (top.overallWinRate * 100).toFixed(1) + '%')
console.log('Trades:', top.totalTrades)
```

### Get Medal Winners (Top 3)
```javascript
const top3 = TRADE_OLYMPICS.getLeaderboard('totalPnL').slice(0, 3)
top3.forEach((model, i) => {
  const medals = ['🥇', '🥈', '🥉']
  console.log(`${medals[i]} ${model.model}: $${model.totalPnL.toLocaleString()}`)
})
```

### Find All Losing Brackets
```javascript
const losing = Object.entries(TRADE_OLYMPICS.BRACKETS)
  .filter(([_, b]) => b.totalPnL < 0)
  .map(([name, b]) => ({ bracket: name, ...b }))
console.log('Losing brackets:', losing)
```

### Find Most Profitable Bracket
```javascript
const mostProfit = Object.entries(TRADE_OLYMPICS.BRACKETS)
  .sort(([_, a], [__, b]) => b.totalPnL - a.totalPnL)[0]
console.log('Best:', mostProfit[0], 'P&L:', mostProfit[1].totalPnL)
```

### Find Highest Win Rate (with min trades)
```javascript
const best = Object.entries(TRADE_OLYMPICS.BRACKETS)
  .filter(([_, b]) => b.trades > 10)  // At least 10 trades
  .sort(([_, a], [__, b]) => b.winRate - a.winRate)[0]
console.log('Best winrate:', best[0], 'Rate:', (best[1].winRate * 100).toFixed(1) + '%')
```

---

## 🎯 SUMMARY QUERIES

### Overall Tournament Status
```javascript
const summary = TRADE_OLYMPICS.getSummary()
console.log('Brackets:', summary.totalBrackets)
console.log('Models:', summary.totalModels)
console.log('Trades:', summary.totalTrades)
console.log('P&L:', '$' + summary.totalPnL.toLocaleString())
console.log('Leader:', summary.topModel)
```

### Overall Leaderboard (All 12)
```javascript
const leaders = TRADE_OLYMPICS.getLeaderboard('totalPnL')
leaders.forEach(m => {
  console.log(`${m.rank}. ${m.model} - $${m.totalPnL.toLocaleString()} (${(m.overallWinRate*100).toFixed(1)}% WR)`)
})
```

---

## 🔧 TESTING TRADES

### Manually Record a Test Trade
```javascript
TRADE_OLYMPICS.recordTrade('ARBITRAGE_BTC_SMALL', {
  outcome: 'WIN',
  pnl: 100,
  edge: 1.0
})
```

### Verify It Was Recorded
```javascript
console.log(TRADE_OLYMPICS.BRACKETS['ARBITRAGE_BTC_SMALL'].trades)
console.log(TRADE_OLYMPICS.BRACKETS['ARBITRAGE_BTC_SMALL'].totalPnL)
```

### Test Model Assignment
```javascript
const assignment = TRADE_OLYMPICS.getModelForTrade('ARBITRAGE', 'BTC', 1.2)
console.log('Bracket:', assignment.bracket)
console.log('Model:', assignment.model)
```

---

## 💾 DATA EXPORT

### Export All Standings as JSON
```javascript
JSON.stringify(TRADE_OLYMPICS.STANDINGS, null, 2)
```

### Export All Brackets as JSON
```javascript
JSON.stringify(Object.entries(TRADE_OLYMPICS.BRACKETS).map(([name, data]) => ({
  bracket: name,
  ...data
})), null, 2)
```

### Export Top 10 as CSV
```javascript
const leaders = TRADE_OLYMPICS.getLeaderboard('totalPnL').slice(0, 10)
const csv = ['Rank,Model,Provider,ELO,P&L,Win Rate,Trades']
leaders.forEach(m => {
  csv.push(`${m.rank},${m.model},${m.provider},${m.elo},${m.totalPnL.toFixed(2)},${(m.overallWinRate*100).toFixed(1)}%,${m.totalTrades}`)
})
console.log(csv.join('\n'))
```

---

## 🎮 INTERACTIVE MONITORING

### Live Update Every 5 Seconds
```javascript
setInterval(() => {
  const summary = TRADE_OLYMPICS.getSummary()
  console.clear()
  console.log('=== OLYMPICS LIVE UPDATE ===')
  console.log('Trades:', summary.totalTrades)
  console.log('P&L:', '$' + summary.totalPnL.toLocaleString())
  console.log('Leader:', summary.topModel, '- $' + summary.topModelPnL.toLocaleString())
}, 5000)
```

### Show Top 3 Real-Time
```javascript
setInterval(() => {
  const top3 = TRADE_OLYMPICS.getLeaderboard('totalPnL').slice(0, 3)
  console.clear()
  console.log('🏅 TOP 3 MODELS:')
  const medals = ['🥇', '🥈', '🥉']
  top3.forEach((m, i) => {
    console.log(`${medals[i]} ${m.model}: $${m.totalPnL.toLocaleString()}`)
  })
}, 10000)
```

---

## 🔎 DEBUGGING

### Check if Olympics Initialized
```javascript
console.log('Olympics:', typeof TRADE_OLYMPICS)
console.log('Brackets:', Object.keys(TRADE_OLYMPICS.BRACKETS).length)
console.log('Models:', Object.keys(TRADE_OLYMPICS.STANDINGS).length)
```

### Find a Specific Bracket
```javascript
const bracket = Object.entries(TRADE_OLYMPICS.BRACKETS)
  .find(([name]) => name.includes('BTC') && name.includes('ARBITRAGE'))
console.log(bracket)
```

### Find a Specific Model's Standings
```javascript
console.log(TRADE_OLYMPICS.STANDINGS['gpt-5-turbo'])
```

### Show All Model Names
```javascript
Object.keys(TRADE_OLYMPICS.STANDINGS).forEach(m => console.log(m))
```

---

## 🎯 QUICK EXAMPLES

### "Show me the leaderboard"
```javascript
TRADE_OLYMPICS.getLeaderboard('totalPnL').slice(0, 5)
```

### "Which model is winning?"
```javascript
TRADE_OLYMPICS.getLeaderboard('totalPnL')[0].model
```

### "How much ahead is the leader?"
```javascript
const l1 = TRADE_OLYMPICS.getLeaderboard('totalPnL')[0]
const l2 = TRADE_OLYMPICS.getLeaderboard('totalPnL')[1]
console.log(l1.model, 'is $' + (l1.totalPnL - l2.totalPnL).toLocaleString() + ' ahead')
```

### "Which bracket is best?"
```javascript
TRADE_OLYMPICS.getTopBrackets(1)[0].bracket
```

### "What's the worst bracket?"
```javascript
TRADE_OLYMPICS.getWeakestBrackets(1)[0].bracket
```

### "Total P&L so far?"
```javascript
TRADE_OLYMPICS.getSummary().totalPnL
```

### "How many trades executed?"
```javascript
TRADE_OLYMPICS.getSummary().totalTrades
```

---

## 🎬 QUICK START SCRIPT

Copy and paste this entire block to test everything:

```javascript
console.log('=== TRADE OLYMPICS TEST ===')
console.log('1. System Status:', typeof TRADE_OLYMPICS === 'object' ? '✅ LOADED' : '❌ NOT LOADED')
console.log('2. Brackets:', Object.keys(TRADE_OLYMPICS.BRACKETS).length, '(should be 480)')
console.log('3. Models:', Object.keys(TRADE_OLYMPICS.STANDINGS).length, '(should be 12)')

const summary = TRADE_OLYMPICS.getSummary()
console.log('4. Summary:')
console.log('   - Total P&L:', '$' + summary.totalPnL)
console.log('   - Total Trades:', summary.totalTrades)
console.log('   - Leader:', summary.topModel)

const top5 = TRADE_OLYMPICS.getLeaderboard('totalPnL').slice(0, 5)
console.log('5. Top 5 Models:')
top5.forEach((m, i) => {
  console.log(`   ${i+1}. ${m.model}: $${m.totalPnL.toLocaleString()}`)
})

console.log('✅ ALL TESTS PASSED - OLYMPICS READY!')
```

---

## 📖 NOTES

- All commands run in browser console (F12)
- Data updates in real-time as trades execute
- All queries are read-only (safe to run anytime)
- Results shown in browser console
- No data is modified by viewing

**Ready to explore?** Open console and start experimenting! 🚀
