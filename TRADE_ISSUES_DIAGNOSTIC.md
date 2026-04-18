# Trade Execution Diagnostic

## Potential Trade Issues to Check

Based on your "fix trades" request, here are the most common issues:

### 1. **Balance Going Negative**
- Problem: Multiple trades open at once might exceed $50 balance
- Solution: Add balance validation before trade opens
- Status: ⏳ Need to check

### 2. **Costs Exceeding Bet Amount**
- Problem: Gas + slippage + spread > actual bet
- Example: $0.50 bet with $0.60 cost = negative P&L guaranteed
- Status: ⏳ Need to verify cost calculation

### 3. **Trade Timeout Not Triggering**
- Problem: Trades stay "open" indefinitely instead of closing
- Status: ⏳ Need to check EXIT_TIMES

### 4. **Live Price Fetch Failing**
- Problem: `getLivePrice()` returns undefined, causing NaN
- Status: ⏳ Need to verify API connectivity

### 5. **Position Not Closing Properly**
- Problem: `checkExit()` doesn't run or crashes silently
- Status: ⏳ Need to check error handling

---

## Quick Diagnosis

Can you tell me which issue you're experiencing?

1. **Trades won't start** → button doesn't respond
2. **Trades start but don't finish** → stuck on "Exit in Xm Ys"
3. **Balance goes negative** → shows -$XX.XX
4. **P&L shows wrong amounts** → costs don't match calculations
5. **Crucible mode won't run** → test trades won't execute
6. **Something else** → describe it

---

## Or Let Me Check Now

I'll examine the code for these issues:

✓ Check 1: Balance initialization
✓ Check 2: Cost calculations
✓ Check 3: Trade timeout logic
✓ Check 4: API error handling
✓ Check 5: Balance validation before trade opens

