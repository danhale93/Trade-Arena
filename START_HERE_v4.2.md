# ⚡ QUICK START - v4.2 PRODUCTION BUILD

## 🎯 START THE APP

1. **Open the app:**
   ```
   Open: Trade-Arena/index.html in browser
   ```

2. **Wait for startup:**
   ```
   Console shows: "✓ TRADE ARENA v4.2 READY"
   Look for green checkmarks ✓
   ```

3. **Check system status:**
   ```javascript
   // In browser console:
   TradeArenaApp.getSystemStatus()
   
   // Should show:
   // { master: "ON", balance: 10000, online: true, version: "v4.2" }
   ```

---

## 🎮 CONTROL THE MASTER SWITCH

### Method 1: Keyboard Shortcut
```
Press: Ctrl + Space
→ Toggle all 6 bots ON/OFF instantly
```

### Method 2: Click Button
```
Click: "MASTER" button (top-right of screen)
→ See immediate visual feedback
→ All bots turn ON or OFF
```

### Method 3: Programmatic Control
```javascript
// In browser console:

// Toggle master
TradeArenaApp.toggleMaster();

// Turn all bots ON
TradeArenaApp.enableAllBots();

// Turn all bots OFF
TradeArenaApp.disableAllBots();
```

---

## 💰 REAL-TIME BALANCE UPDATES

### What You'll See
- **Main balance display** (top-left header)
  - Shows: `$10,234.56` (realised + unrealised)
  - Updates every 500ms
  - Color changes:
    - 🟢 Green: +5% gain (very profitable)
    - 🔵 Cyan: +1-5% gain
    - 🟡 Gold: -1 to +1% (neutral)
    - 🟠 Amber: -5 to -1% (warning)
    - 🔴 Red: -5%+ loss

- **P&L Display** (next to balance)
  - Shows: `+$234.56 (live)` when positions open
  - Shows: `+$234.56 today` when no positions
  - Green for gains, red for losses

- **Visual Effects**
  - Glow pulse when P&L changes
  - Smooth color transitions
  - "(live)" indicator shows unrealised gains/losses

---

## 📊 LIVE TICKER TRACKING

### What Each Ticker Shows
```
📈🟢 ETH +$42.50      ← Long position, profitable
📉🔴 SOL -$12.30      ← Short position, losing
🟡 No position        ← Waiting for trade

Idle bot displays (rotating):
  📡 READY
  💰 TRADING
  ⚡ ACTIVE
  📊 RUNNING
```

### How It Works
- Each bot shows its **open position's live P&L**
- Updates automatically every 500ms
- Shows token symbol + current unrealised profit/loss
- Color indicates if winning (green) or losing (red)
- Falls back to status frames when no position

---

## 💹 REAL MARKET PRICES & FEES

### Automatic Price Updates
- Fetches **real CoinGecko prices** every 30 seconds
- Used to calculate live P&L on open positions
- Applies realistic trading fees:

### Fee Structure (Realistic)
```
SPOT LONG:    $0.25 gas + 0.08% spread + 0.1% slippage
SPOT SHORT:   $0.35 gas + 0.10% spread + 0.15% slippage
PERP LONG:    $0.40 gas + 0.12% spread + 0.2% slippage + funding
PERP SHORT:   $0.40 gas + 0.12% spread + 0.2% slippage + funding
YIELD FARM:   $0.50 gas + 0.06% spread + 0.08% slippage
```

### Calculate Trade Costs
```javascript
// In console:
TradeArenaApp.calculateTradeCosts('PERP LONG', 1000, 2);

// Returns costs for a 1000 USD perp trade with 2x leverage:
// {
//   gas: 0.40,
//   spread: 1.20,
//   slippage: 4.00,
//   funding: 0.10,
//   total: 5.70,
//   percentage: "0.570"
// }
```

### Get Live Prices
```javascript
// Get current price for token
TradeArenaApp.getCurrentPrice('ETH');  // Returns: 2500.00
TradeArenaApp.getCurrentPrice('BTC');  // Returns: 42000.00
TradeArenaApp.getCurrentPrice('SOL');  // Returns: 135.50
```

---

## 📈 BALANCE & P&L TRACKING

### Available Methods
```javascript
// Get current balance
TradeArenaApp.getBalance();           // Returns: 10234.56

// Get total P&L
TradeArenaApp.getPnL();               // Returns: 234.56

// Get balance history (last 5 minutes)
TradeArenaApp.getBalanceHistory(5);   // Returns: [{timestamp, balance, unrealised}, ...]

// Get trend
TradeArenaApp.getBalanceTrend();      // Returns: "up" | "down" | "stable"

// Get full system status
TradeArenaApp.getSystemStatus();      // Returns: {master, balance, online, version}
```

---

## 🔧 TROUBLESHOOTING

### Master Switch Not Responding?
```javascript
// Check status
TradeArenaApp.getSystemStatus()

// If "master": "OFF", toggle it:
TradeArenaApp.toggleMaster()

// Check console for errors (F12)
// Should see: "[MasterSwitch] ✓ ONLINE - Status: ON"
```

### Balance Not Updating?
```javascript
// Force refresh
document.location.reload();

// Check if game is loaded
console.log(typeof balance);  // Should be "number"
console.log(typeof bots);     // Should be "object"

// Check balance updater
console.log(TradeArenaApp.getBalance());
```

### Ticker Not Showing?
```javascript
// Tickers only appear when bots have open positions
// If bots are idle, ticker rotates through status frames

// Check if positions exist
console.log(openPositions);  // Should show array

// Manually force balance update
TradeArenaApp.getMasterSwitch();
```

### Prices Not Updating?
```javascript
// Prices cached for 30 seconds to avoid rate limiting
// They update automatically, or manually:

TradeArenaApp.getCurrentPrice('ETH');  // Triggers price fetch if old

// Check if online
console.log(navigator.onLine);  // Should be "true"
```

---

## 📱 KEYBOARD SHORTCUTS

```
Ctrl + Space    →    Toggle Master Switch ON/OFF
F12             →    Open Developer Console
Ctrl+Shift+K    →    Open Console (Chrome)
```

---

## 🎯 TYPICAL WORKFLOW

### 1. Launch App
```
Open index.html → Wait for startup → See green checkmarks
```

### 2. Check Status
```javascript
TradeArenaApp.getSystemStatus()
// {master: "ON", balance: 10000, online: true, version: "v4.2"}
```

### 3. Start Trading
```
Press: Ctrl+Space (or click MASTER button)
→ All 6 bots turn ON
→ Balance starts updating (500ms refresh)
→ Tickers show live P&L
→ See real market prices from CoinGecko
```

### 4. Monitor Trades
```
Watch:
- Balance color change (green = profit, red = loss)
- Ticker P&L update in real-time
- P&L display with unrealised gains
- Fee calculations applied
```

### 5. Stop Trading
```
Press: Ctrl+Space (or click MASTER button)
→ All ots turn OFF instantly
→ No more trades executed
→ Final P&L displayed
```

---

## 💾 STATE PERSISTENCE

### Auto-Saved
- Master switch state (ON/OFF)
- Game balance
- Total P&L
- Saves every 30 seconds automatically

### Access Saved Data
```javascript
// View saved state
localStorage.getItem('ta_game_state');

// View master switch preference
localStorage.getItem('ta_master_enabled');
```

---

## 📊 SYSTEM COMPONENTS

| Component | Status | Update Rate | Purpose |
|-----------|--------|------------|---------|
| Master Switch | ✓ ACTIVE | 500ms sync | Control all bots |
| Balance Updater | ✓ ACTIVE | 500ms | Real-time balance |
| Ticker Tracker | ✓ ACTIVE | 500ms | Per-bot live P&L |
| Real Market Pricing | ✓ ACTIVE | 30s cache | CoinGecko prices |
| Auto Recovery | ✓ ACTIVE | Continuous | Connection backup |

---

## 🚀 YOU'RE READY!

Your Trade Arena is now:
- ✅ Master switch fixed and responsive
- ✅ Balance updating in real-time (500ms)
- ✅ Ticker tracking live P&L per bot
- ✅ Using real market prices and fees
- ✅ Ready to trade!

**Press `Ctrl+Space` to start! 🎯**

---

**Build:** Trade Arena v4.2  
**Status:** ✅ PRODUCTION READY  
**Last Updated:** Latest Fixes Applied  
