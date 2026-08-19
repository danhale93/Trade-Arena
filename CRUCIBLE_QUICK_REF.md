# CRUCIBLE TEST - QUICK REFERENCE

## 🚀 Commands

```javascript
// RUN TESTS
runCrucibleTest()              // 10 trades, 2s apart (default)
runCrucibleTest(20)            // 20 trades, 2s apart
runCrucibleTest(50, 1500)      // 50 trades, 1.5s apart

// STOP ACTIVE TEST
stopCrucibleTest()

// EXPORT RESULTS
exportCrucibleJSON()           // Machine-readable JSON file
exportCrucibleCSV()            // Spreadsheet CSV file

// ADVANCED
console.log(CrucibleTest.trades)        // View all trades
console.log(CrucibleTest.sessionId)     // View session ID
CrucibleTest.generateReport()           // Print detailed report
```

---

## 📊 Key Outputs

### Console Output
```
🔬 CRUCIBLE TEST INITIALIZED
🚀 CRUCIBLE TEST STARTED

[TRADE 1/10]
  ARBITRAGE · BTC
  Entry: $42,156.23 → Exit: $42,315.89
✅ WIN +$159.66 (1.60%)
  Balance: $10,000 → $10,159.66
  Edge: 0.38% | Confidence: 75% | P(Win): 62%

[TRADE 2/10]
... (more trades)

🔬 CRUCIBLE TEST REPORT
📊 SESSION METADATA
💰 ACCOUNT RESULTS
📈 TRADE STATISTICS
🎯 EDGE ANALYSIS
✅ VERIFICATION STATUS
```

### CSV Export Columns
```
Trade# | Timestamp | Method | Token | Entry | Exit | Win? | P&L | Balance
1      | 18:09:45  | ARBIT  | BTC   | 42156 | 42315| YES  | 159 | 10159
2      | 18:09:47  | SPOT   | ETH   | 2245  | 2198 | NO   | -47 | 10112
```

### JSON Export Structure
```json
{
  "sessionId": "crucible-1694729402155",
  "timestamp": "2024-03-15T18:09:56Z",
  "config": { ... },
  "duration": "32.4s",
  "wins": 12,
  "losses": 8,
  "winRate": "60%",
  "totalPnl": 486.32,
  "finalBalance": 10486.32,
  "returnPercent": "4.86%",
  "trades": [ ... ]
}
```

---

## ✅ Success Criteria

| Metric | Min | Target | Max |
|--------|-----|--------|-----|
| **Win Rate** | 40% | 55% | 80% |
| **Trade Completion** | 100% | 100% | 100% |
| **Profit Factor** | 1.0 | 1.8 | ∞ |
| **Return %** | -10% | +5% | +50% |

---

## 🔬 Test Scenarios

### Quick Test (5 min)
```javascript
runCrucibleTest(10, 1000)  // ~11 seconds
```

### Standard Test (15 min)
```javascript
runCrucibleTest(30, 1500)  // ~47 seconds
```

### Deep Test (1 hour)
```javascript
runCrucibleTest(100, 1000)  // ~100 seconds
```

---

## 📋 Verification Workflow

1. **Initial Test**
   ```javascript
   runCrucibleTest(20, 1500)
   ```
   Verify: All trades complete, win rate 40-60%, P&L positive

2. **Export Results**
   ```javascript
   exportCrucibleJSON()
   exportCrucibleCSV()
   ```

3. **Run Confirmation Test**
   ```javascript
   runCrucibleTest(30, 1500)
   ```
   Verify: Similar results to first test

4. **Review Report**
   - Check console for detailed statistics
   - Verify all P&L calculations
   - Confirm edge metrics reasonable

5. **Deploy**
   - If win rate > 50%, profit factor > 1.5
   - Ready for live trading!

---

## 🎯 Console Shortcuts

Save these in your browser console for quick access:

```javascript
// Create aliases
const test = runCrucibleTest
const stop = stopCrucibleTest
const exportJ = exportCrucibleJSON
const exportC = exportCrucibleCSV
const getTrades = () => CrucibleTest.trades
const getSession = () => CrucibleTest.sessionId

// Now use:
test(20, 1500)      // Start test
exportJ()           // Export
getTrades()         // View all trades
```

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Test won't start | `CrucibleTest.init(); runCrucibleTest()` |
| Wrong balance | Check each trade's P&L with `CrucibleTest.trades[n].pnl` |
| Export failed | Try other format, check browser console |
| Low win rate | This is normal! Win rate varies. Run multiple tests. |
| High win rate | Unlikely but possible due to randomness. Rerun to confirm. |

---

## 📈 What Each Metric Means

**Win Rate**
- What: % of profitable trades
- Good: 50%+ (you profit more often than not)
- Example: 60% = 6 out of 10 trades win

**Profit Factor**
- What: Total wins ÷ Total losses
- Good: 1.5+ (wins 1.5× larger than losses)
- Example: 2.0 = wins are 2× bigger than losses

**Total P&L**
- What: Sum of all wins and losses
- Good: Positive (more money at end)
- Example: +$486 = gained $486 over session

**Average Win/Loss**
- What: Mean profit/loss per trade
- Good: Avg Win > Avg Loss by 2:1
- Example: +$89 wins, -$45 losses = good

**Edge %**
- What: Expected profitable advantage
- Good: 1-5% (realistic for trading)
- High edge = stronger setup

---

## 💡 Tips for Testing

✅ **DO:**
- Run multiple tests to confirm consistency
- Export results for documentation
- Note any unusual patterns
- Review P&L calculations carefully
- Use results to improve trading logic

❌ **DON'T:**
- Expect 100% win rate (unrealistic)
- Worry about 40% win rate (still profitable)
- Rely on single test (randomness exists)
- Modify tests mid-run
- Ignore console errors

---

## 📞 Quick Links

- **Full Guide:** CRUCIBLE_TEST_GUIDE.md
- **Validation Checklist:** VALIDATION_CHECKLIST.md
- **Trading Logic:** ai-arena.js
- **Test Code:** crucible-test.js

---

**Status: ✅ READY TO TEST**

Open your browser console and run: `runCrucibleTest(10)`

Your trading logic will be verified in ~13 seconds!
