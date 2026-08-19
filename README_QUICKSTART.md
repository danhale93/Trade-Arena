# 🚀 QUICK START GUIDE - Trade Arena Rebuild

## 30-Second Setup

1. **Open the app**
   ```
   Open: c:\Users\admi\OneDrive\Documents\GitHub\Trade-Arena\index.html
   Browser: Any modern browser (Chrome, Firefox, Safari, Edge)
   ```

2. **Choose a login method**
   - 🎮 **DEMO MODE** (recommended for testing) - Click and go
   - 🦊 **MetaMask** - Connect your wallet
   - 🔵 **Google** - Sign in with Google

3. **You're live!**
   - See balance in top-right: `$10,000.00`
   - See master switch: `MASTER ✓ ON` (green)
   - See trade ledger at bottom: `0 trades`

---

## 5-Minute Test Drive

### Step 1: Add a Bot
Click **+ ADD BOT** button → Bot #1 appears

### Step 2: Set Your Bet
Click **$10** in bot controls → ready to trade

### Step 3: Spin the Reels
Click **🎰 SPIN** → reels spin → AI agents vote → position opens or HOLD

**What you see:**
- 5 agent cards show votes: LONG/SHORT/HOLD
- Consensus bar fills up (needs 2/4 agents to agree)
- Result card shows WIN/LOSS or HOLD
- Balance updates if trade closed

### Step 4: Enable Auto Trading
Click **AUTO** → Button changes to **⏸ STOP** (blue highlight)

Bot now:
- Spins every 2–4 seconds automatically
- Opens positions as agents agree
- Closes positions after hold time (5–30 min)
- Updates balance in real-time

### Step 5: Control All Bots Together
Click **MASTER ✓ ON** toggle → All bots stop

Notice:
- All **AUTO** buttons change to **AUTO** (off)
- All bots pause mid-cycle
- Switch shows **✗ OFF** (red)

Click again → All bots resume

---

## 20-Minute Deep Dive

### Master Switch Features
```
MASTER ✗ OFF  →  All bots disabled globally
                  Useful when you want to pause everything
                  Saves keyboard shortcut: Ctrl+Space

MASTER ✓ ON   →  All bots enabled
                  Each bot respects its own AUTO setting
                  Syncs with emergency stop button
```

### Real-Time Balance Updates
The balance in the header (`$10,000.00`) updates **every 1 second**:

```
🟢 Green   (+5%+)    → Strong gain
🔵 Cyan    (+1 to +5%)  → Small gain
🟡 Gold    (-1 to +1%)  → Neutral
🟠 Amber   (-5 to -1%)  → Small loss
🔴 Red     (-5%-)   → Large loss
```

Open positions show as `(live)`:
```
Before:  +$0.00 today
Active:  +$50.25 today (live)  ← unrealised gains
Closed:  +$150.50 today        ← realised gains
```

### Quant Report (After 10+ Trades)
Auto-opens after 10 closed trades:

- **Win Rate**: % profitable
- **Profit Factor**: Wins / Losses ratio
- **Max Drawdown**: Biggest dip
- **Equity Curve**: Account balance over time
- **Baselines**: Beat random/momentum to prove edge

### Learning Model (After 5 Trades)
Watch agent weights evolve in **SELF-LEARNING MODEL** panel:

```
Example after 20 trades:
🔥 Momentum:  1.23  (↑ rising - doing well)
🌀 Volatility: 0.82 (↓ falling - struggling)  
🏛️ Politician: 1.0  (— stable)
📊 Sentiment:  1.15 (↑ rising)
🛡️ Risk:      0.95 (↓ slight drop)
```

Weights auto-adjust based on accuracy.

---

## Master Switch Keyboard Shortcut

Press **Ctrl+Space** anywhere on the page to toggle master switch instantly.

Useful for:
- Quick stop if something goes wrong
- Pausing during high gas
- Resuming after checking market

---

## Emergency Stop (Red Button)

Located in **CIRCUIT BREAKERS** panel:

```
🔴 EMERGENCY STOP ALL BOTS
   Disables everything immediately
   Clears all timers
   Master switch turns red
   
🟢 RESET — RESUME TRADING
   Re-enables trading
   Syncs with master switch
```

Use when:
- Gas spikes unexpectedly
- Market crashes
- You want manual control

---

## Testing the Features

### Test 1: Master Switch
1. Click **AUTO** on a bot → spinning begins
2. Click **MASTER ✗ OFF** → bot stops immediately
3. Click **MASTER ✓ ON** → bot resumes
4. **Result**: ✅ Master switch controls all bots

### Test 2: Real-Time Balance
1. Keep bot spinning (AUTO on)
2. Watch balance update every second
3. Notice position open/close reflected instantly
4. **Result**: ✅ Balance updates live

### Test 3: Persistence
1. Enable bots and let them trade
2. **Refresh page** (F5)
3. Master switch state should restore
4. **Result**: ✅ State persists

### Test 4: Color Coding
1. Look for a winning trade
2. Balance goes green
3. Trade closes, balance returns to normal color
4. **Result**: ✅ Colors reflect P&L status

---

## Configuration (Optional)

### Gas Ceiling
Default: 50 gwei
- Bots pause if gas exceeds this
- Adjust slider to your risk tolerance

### Daily Drawdown
Default: -10% of starting balance
- Bots stop if daily loss exceeds this
- Prevents account blowup

### Consensus Threshold
Default: 2 out of 4 agents
- 1 = aggressive (any agent triggers)
- 4 = conservative (all must agree)
- Auto-adapts every 20 trades

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Master switch not responding | Refresh page, check console (F12) |
| Balance not updating | Wait 1-2 sec, should update every 1 sec |
| Bots not spinning | Check if emergency stop active (red button) |
| Auto mode not working | Ensure master switch is ON |
| Trades stuck as "open" | Refresh page or wait for exit time |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Ctrl+Space** | Toggle master switch |
| **F5** | Refresh page (saves persist) |
| **F12** | Open dev console (debug errors) |

---

## File Locations

```
📁 Trade-Arena/
├── 📄 index.html           ← Main app (open this!)
├── 📄 app-rebuild.js       ← Master switch logic
├── 📄 README_REBUILD.md    ← Full documentation
└── 📄 README_QUICKSTART.md ← This file
```

---

## Next Steps

1. **Get familiar** with SPIN and AUTO controls (5 min)
2. **Run 20 trades** to unlock Quant Report (10 min)
3. **Watch agent weights** evolve in Learning Model (5 min)
4. **Enable circuits** (gas ceiling, drawdown limits) (5 min)
5. **Explore baselines** - beat momentum = real edge (10 min)

---

## Support

- **Need full docs?** → Read `README_REBUILD.md`
- **Have questions?** → Check console (F12) for error messages
- **Want to customize?** → Edit CSS colors in `index.html` under `:root {}`

---

**Status**: ✅ Ready to Trade  
**Build**: v4.0 (Master Switch + Real-Time Balance)  
**Created**: April 17, 2026

Happy trading! 🚀
