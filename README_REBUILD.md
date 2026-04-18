# Trade Arena - Rebuild Complete

## 🎮 Quick Start

Open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge). No build process needed.

### Features Activated

#### ✨ Master On/Off Switch
- **Location**: Fixed in top-right corner of the app
- **Status**: Shows green (✓ ON) when all bots are trading, red (✗ OFF) when stopped
- **Controls**:
  - Click the toggle button to enable/disable all bots at once
  - Keyboard shortcut: `Ctrl + Space` to toggle master switch
  - Syncs automatically with emergency stop (🔴 EMERGENCY STOP ALL BOTS button)

#### 📊 Real-Time Balance Updates
- **Update Frequency**: Every 1 second
- **Display**: Top-right of the header showing current balance
- **Color Coding**:
  - 🟢 **Green**: +5% or higher gain
  - 🔵 **Cyan**: +1% to +5% gain  
  - 🟡 **Gold**: -1% to +1% neutral
  - 🟠 **Amber**: -5% to -1% loss
  - 🔴 **Red**: -5% or worse loss

#### 📈 Live P&L Tracking
- Shows unrealised P&L from open positions in real-time
- Updates header P&L display every second
- "(live)" indicator shows when there are open positions
- Glow effect on balance when positions change significantly

#### 🔄 Persistent State
- Master switch preference saved to browser storage
- Game state auto-saves every 30 seconds
- Automatic recovery if page disconnects

#### 🛡️ Auto-Recovery System
- Detects when you go offline/online
- Syncs bot state after reconnection
- Recovers game state from localStorage if needed

---

## 📋 How to Use

### Login
Choose one of three options:
1. **Google Sign-In** - Requires Google Client ID setup
2. **MetaMask Wallet** - Connects to your Web3 wallet
3. **Demo Mode** - No setup needed, instant entry (recommended for testing)

### Control All Bots at Once
Click the **MASTER** toggle in the top-right to turn all bots on/off together. This affects:
- All bot AUTO buttons
- All timers and pending spins
- Respects the 3-trade cooldown system

### Monitor Real-Time Changes
Watch the **Balance** in the header update every second as positions open and close. The color changes dynamically to show your P&L status.

### View Detailed Analytics
- **Quant Report** - Win rate, profit factor, max drawdown, and equity curve
- **Self-Learning Model** - See how agent weights evolve over time
- **Agent Audit** - Monitor individual agent performance
- **Circuit Breakers** - Set gas limits, drawdown stops, and risk controls

---

## 🎯 Bot Mechanics

### Spinning
1. Set your bet amount ($1–$100)
2. Click **SPIN** to run the 5-agent ensemble
3. Agents vote: LONG, SHORT, or HOLD
4. If consensus threshold met, position opens
5. Position auto-closes after strategy hold-time (5–30 min)

### Auto Mode
1. Click **AUTO** to enable continuous spinning
2. Bots spin every 2–4 seconds when enabled
3. Master switch controls all bots globally
4. Use **STOP** button to disable a single bot

### Cooldown System
- **3 consecutive losses** → 15-min cooldown (choppy market)
- **3 more losses after resume** → 60-min cooldown
- **Another streak** → 24-hr manual reset required
- Hold to override early (3-second hold)

---

## 🧬 Self-Learning Model

### How It Works
- **Every 5 closed trades**: Agent weights update based on accuracy
- **Every 20 trades**: Consensus threshold auto-adjusts based on win rate
- **Every 10 trades**: Automatic audit checks individual agent performance
- State persists in browser storage; no setup required

### Agent Performance
Watch the weight cards in the **SELF-LEARNING MODEL** panel:
- 🔥 **Momentum** - Trades directional moves
- 🌀 **Volatility** - Classifies market regime
- 🏛️ **Politician** - Congressional insider filings signal
- 📊 **Sentiment** - Crowd momentum
- 🛡️ **Risk** - Vetoes dangerous trades

Higher weight = agent voting with more confidence.

### Agent Audit
Agents go "on notice" if win rate drops below threshold:
- **On Notice**: Weight capped, improvement plan injected into prompt
- **Suspended** (after full probation): Vote nearly muted
- **Reinstated**: Partial weight restoration on recovery

---

## 🔬 Quant Report (Stats)

### Statistical Ladder
- Shows progress to significance milestones (20, 50, 100, 200, 300 trades)
- Confidence grows as sample size increases

### Core Metrics
- **Win Rate** - % of profitable trades
- **Profit Factor** - Gross wins / gross losses
- **Expectancy** - Average P&L per trade
- **Max Drawdown** - Worst peak-to-trough loss

### Baselines
Compares Claude AI strategy against shadow strategies:
- 🎲 **Random** - Coin flip direction
- 📈 **Always Long** - Buy and hold
- 🌊 **Momentum** - 15min price move direction

Beat the momentum baseline = real skill, not just luck.

### Equity Curve
Visual line chart of account balance over time. Green line = profitable, red = losing streak.

---

## ⚙️ Circuit Breakers

### Gas Hard Ceiling
- Default: 50 gwei
- Bots pause when live gas exceeds this
- Drag the slider to test different gas scenarios

### Daily Drawdown Kill
- Default: -10% of starting balance
- All bots stop if daily loss exceeds this threshold
- Prevents catastrophic blowups

### Aggression Level (1–10)
- 1 = Ultra cautious (fewest trades)
- 10 = Full degen (maximum trades)
- Affects how agents rate entry opportunities

### Consensus Threshold (1–4 agents)
- Minimum agents that must agree to open a trade
- Auto-adapts every 20 trades based on win rate
- 2 = moderate (default), 3 = cautious, 4 = unanimous

---

## 🔴 Emergency Stop

Click **🔴 EMERGENCY STOP ALL BOTS** to:
- Disable all bots instantly
- Clear auto-timers
- Freeze trading (master switch turns red)
- Click **🟢 RESET — RESUME TRADING** to re-enable

---

## 🎮 Crucible Mode

High-intensity paper trading challenge:
- Bots can only use fast strategies (SPOT LONG, SPOT SHORT)
- No slow yield farm or perpetuals
- Track progress toward 100 consecutive trades
- Visual progress bar in Quant Report

Toggle with **ON/OFF** button in Quant Report.

---

## 💾 Persistence & Storage

### What's Saved
- Master switch state (on/off preference)
- Agent weights and learning history
- Audit logs and agent statuses
- Game state snapshot (balance, P&L, trades)

### Where It's Stored
- Browser `localStorage` (no server needed)
- Survives page refresh and browser restart
- Clears if you clear browser data

### Reset Learning
In **SELF-LEARNING MODEL**, click **RESET WEIGHTS** to:
- Restore all agent weights to 1.0
- Clear all audit and probation records
- Start fresh learning cycle
- Cannot be undone without page refresh

---

## 🔗 Integrations

### Databricks Genie (Optional)
Configure in **CIRCUIT BREAKERS** panel:
- **Workspace URL**: Your Databricks workspace
- **Space ID**: Genie space from Databricks UI
- **Personal Access Token**: From Databricks Settings

When configured, Genie queries your warehouse for historical patterns before each trade.

### Politician Filing Data
Automatically fetches from House Stock Watcher S3 (public data, no auth needed):
- Real STOCK Act filings from Congress
- Maps to crypto tickers
- Agents use as bullish/bearish signal

---

## 📊 Exporting Data

### CSV Export
Click **📤 EXPORT CSV** in Quant Report to download:
- All closed trades
- Entry/exit prices, hold time
- P&L and costs
- Agent votes and reasoning

### JSON Export
Click **📋 EXPORT JSON** to save:
- Full trade history
- Learning model state
- Baseline comparisons
- Ready for backtesting

---

## 🐛 Troubleshooting

### Master Switch Not Working
- Ensure JavaScript is enabled
- Check browser console (F12) for errors
- Try clicking a bot's AUTO button manually first

### Balance Not Updating
- Wait 1–2 seconds for next update cycle
- Check that `ghBalance` element exists in HTML
- Refresh page if stuck

### Bots Not Spinning
- Check if global emergency stop (🔴) is active
- Verify gas ceiling not exceeded
- Check daily drawdown hasn't triggered
- Try clicking SPIN manually first

### No Claude AI Responses
- API key not set (uses rule-based fallback)
- API circuit breaker active (60s cooldown after 3 failures)
- Check browser console for `401` or network errors
- Provide API key in the setup note on login screen

---

## 📚 Code Structure

- **index.html** - Complete game UI, rules, and core trading logic
- **app-rebuild.js** - Master switch, balance updater, auto-recovery modules

### Key Global Functions (from index.html)
```javascript
// Master control
toggleAuto(botId)              // Toggle single bot
globalKill()                   // Emergency stop all
resetKill()                    // Resume from emergency stop

// Balance & state
updateGlobalBalance()          // Manual balance refresh
updateLiveBalance()            // Called per open position update

// Learning & audit
runAudit(totalTrades, manual)  // Trigger audit cycle
learnFromTrade(position)       // Update weights post-trade
resetLearning()                // Clear all learned state

// Trading
spinBot(botId)                 // Manual spin
scheduleAuto(bot)              // Queue next auto-spin
```

### Key Functions from app-rebuild.js
```javascript
window.TradeArenaApp.toggleMaster()    // Toggle master switch
window.TradeArenaApp.enableAllBots()   // Enable all
window.TradeArenaApp.disableAllBots()  // Disable all
window.TradeArenaApp.getBalanceHistory(minutes) // Get balance trend
```

---

## 🎨 Theming

All colors use CSS variables defined in `:root`:
- `--gold`: Primary highlight (#ffd700)
- `--green`: Profit/bullish (#39ff14)
- `--hot`: Loss/bearish (#ff2d78)
- `--cyan`: Info (#00ffe7)
- `--amber`: Warning (#ffb300)
- `--purple`: Learning/audit (#bf5fff)

Modify `:root` colors in `<style>` to customize the look.

---

## 🚀 Next Steps

1. **Open index.html** in browser
2. **Click Demo Mode** to start trading
3. **Add a bot** with **+ ADD BOT**
4. **Click SPIN** to test a single trade
5. **Click AUTO** on a bot to enable continuous trading
6. **Watch the balance update** in real-time
7. **Toggle MASTER** switch to see all bots respond
8. **Run 20+ trades** to unlock Quant Report insights
9. **Check the Self-Learning Model** to see agent weight evolution

---

## 📝 License

Trade Arena - AI Trading Floor Simulator  
Built with ❤️ for crypto traders and ML enthusiasts.

---

**Version**: 4.0 (Rebuilt with Master Switch & Real-Time Balance)  
**Last Updated**: April 17, 2026
