# Action Logging System - Testing Guide

## Quick Start

### 1. Access the Application
Open your browser and navigate to:
```
http://localhost:8000
```

### 2. Enable Developer Tools
Press `F12` to open the browser developer console. This is where you'll see all the color-coded log entries.

### 3. Open Settings
Click the ⚙️ button in the bottom-right corner to access the settings panel.

## Test Each Logging Category

### Test 1: Login Logging

**Test Login with Demo Mode:**
1. Click "👤 LOGIN DEMO" button
2. Expected logs in console:
   - `✅ SUCCESS | LOGIN` - "DEMO PLAYER logged in via DEMO"
   - Should display in GREEN color

**Test Google Login:**
1. Configure `GOOGLE_CLIENT_ID` in the code
2. Click "🔵 GOOGLE LOGIN" button
3. Expected logs:
   - `✅ SUCCESS | LOGIN` - "[User Name] logged in via GOOGLE"
   - Or `❌ ERROR | LOGIN` if credentials fail

### Test 2: Bot Management Logging

**Test Add Bot:**
1. After logging in, click "➕ ADD BOT"
2. Expected logs:
   - `ℹ️ INFO | BOT` - "Bot #[ID] added with profile: [profile]"
   - Should display in CYAN color

**Test Remove Bot:**
1. Click the "🗑️ REMOVE" button on a bot card
2. Expected logs:
   - `ℹ️ INFO | BOT` - "Bot #[ID] removed"

**Test Auto Toggle:**
1. Click "AUTO" button on a bot card
2. Expected logs when enabling:
   - `ℹ️ INFO | BOT` - "Bot #[ID] auto enabled"
3. Expected logs when disabling:
   - `ℹ️ INFO | BOT` - "Bot #[ID] auto disabled"

### Test 3: Trading Logging

**Test Single Trade:**
1. Click "🎰 SPIN" button on a bot
2. Expected logs in sequence:
   - `ℹ️ INFO | TRADING` - "Bot #[ID] trade started" (with method, token, bet)
   - `✅ SUCCESS | TRADING` - "API POST anthropic/messages: OK" (AI decision)
   - `✅ SUCCESS | TRADING` - "Trade completed" (with P&L result)

### Test 4: Market Data Logging

**During any trade:**
1. Watch for API call logs:
   - `✅ SUCCESS | TRADING` - "API GET coingecko/markets: OK"
   - Shows market data fetch was successful

### Test 5: HFT/Batch Trading Logging

**Enable HFT Mode:**
1. Add at least 2 bots
2. Click "🚀 HFT START" button
3. Expected logs:
   - `✅ SUCCESS | HFT` - "HFT started with [N] bots"
   - All bots' auto modes should enable

**Disable HFT Mode:**
1. Click "⏹️ HFT STOP" button (if visible)
2. Expected logs:
   - `ℹ️ INFO | HFT` - "HFT stopped"

### Test 6: Settings Logging

**Save Settings:**
1. Open Settings (⚙️)
2. Adjust sliders for cooldowns or loss trigger
3. Click "✅ SAVE"
4. Expected logs:
   - `✅ SUCCESS | SETTINGS` - "Settings saved" with details

## View Logging UI

### Access Action Logs Panel
1. Open Settings (⚙️ button)
2. Scroll down to "🔍 ACTION LOGS" section
3. Available buttons:
   - **📋 VIEW LOGS** - Shows last 50 logs
   - **💾 EXPORT JSON** - Downloads complete log history
   - **📊 EXPORT CSV** - Downloads for Excel/spreadsheet analysis
   - **📈 LOG SUMMARY** - Shows summary statistics in console

## Examine Logs in Console

### View All Logs Programmatically
In browser console, type:
```javascript
actionLogger.logs  // View entire log array
actionLogger.getSummary()  // Get statistics
actionLogger.getRecentLogs(10)  // Last 10 logs
actionLogger.getLogsByCategory('TRADING')  // Filter by category
actionLogger.getLogsByLevel('ERROR')  // Filter by level
```

### Export from Console
```javascript
// Export as JSON string
JSON.stringify(actionLogger.logs, null, 2)

// Copy to clipboard
copy(JSON.stringify(actionLogger.logs, null, 2))
```

## Test Log Content

Each log should contain:
```javascript
{
  timestamp: "2024-03-14T23:45:00.123Z",
  category: "TRADING",  // Action type
  message: "Trade completed",  // Human-readable message
  details: {           // Optional context
    token: "ETH",
    pnl: 150.50,
    isWin: true,
    method: "ARBITRAGE"
  },
  level: "SUCCESS",    // DEBUG, INFO, SUCCESS, WARNING, ERROR, CRITICAL
  botCount: 3,         // Current state snapshot
  balance: 1050.50,
  totalPnl: 250.50,
  sessionId: "sess_abc123"
}
```

## Expected Console Output Format

### Success Log
```
✅ SUCCESS | TRADING | (timestamp) 
Trade completed
{token: "ETH", pnl: 150.50, isWin: true}
```

### Error Log
```
❌ ERROR | TRADING | (timestamp)
spinBot error for bot 1
{error: "Network timeout"}
```

### Info Log
```
ℹ️ INFO | BOT | (timestamp)
Bot #1 added with profile: AGGRO
{}
```

## Log Levels Guide

| Level | Color | Use Case | Example |
|-------|-------|----------|---------|
| **DEBUG** | Gray | Detailed diagnostic info | Internal state changes |
| **INFO** | Cyan | Normal operational events | Bot added, trade started |
| **SUCCESS** | Green | Completed successfully | Trade won, API success |
| **WARNING** | Gold | Potential issues | High loss streak |
| **ERROR** | Red | Recoverable errors | API timeout, bot error |
| **CRITICAL** | Bright Red | System-breaking issues | Fatal errors |

## Test Scenarios

### Scenario 1: Complete Session
1. Login (DEMO)
2. Add 3 bots with different profiles
3. Spin one bot twice
4. Toggle auto mode on one bot
5. Enable HFT mode
6. Let it run for 10 seconds
7. Disable HFT mode
8. View logs - should see ~20+ entries

### Scenario 2: Error Handling
1. Login
2. Add a bot
3. Manually close browser console network tab (simulate offline)
4. Click spin
5. Wait for error logs
6. Expected: API error logs in red

### Scenario 3: Export and Analysis
1. Complete Scenario 1
2. Open Settings
3. Click "💾 EXPORT JSON"
4. Open file in text editor
5. Verify all logs are included with proper timestamps
6. Click "📊 EXPORT CSV"
7. Open in Excel/Google Sheets
8. Filter and sort by category/level

## Troubleshooting

### Logs Not Appearing in Console
- Check: F12 console is open
- Check: Not filtering logs by type in console
- Try: Refresh page and retry
- Try: `actionLogger.logs.length` - should show count

### Export Not Working
- Check: Browser allows downloads
- Check: No pop-up blocker
- Try: Use Firefox if Chrome blocks
- Try: Export from console: `copy(JSON.stringify(actionLogger.logs))`

### Some Actions Not Logging
- Check: Bot is not in spinning state
- Check: API keys configured (ANTHROPIC_API_KEY)
- Check: actionLogger object defined (search for "const actionLogger")

## Performance Testing

### Check Overhead
In console:
```javascript
// Time 100 logs
console.time('logging');
for(let i = 0; i < 100; i++) {
  actionLogger.log('TEST', 'Test log', {}, 'INFO');
}
console.timeEnd('logging');
// Should show <50ms for 100 logs
```

### Monitor Memory
In console:
```javascript
// Check log array size
actionLogger.logs.length  // Should be < 1000
// Rough memory: each log ~500 bytes, 1000 logs = ~500KB
```

## Success Criteria

✅ All actions logged with timestamps
✅ Log levels properly color-coded in console
✅ Category badges visible and accurate
✅ Details objects contain relevant context
✅ Session ID consistent throughout session
✅ Logs export to JSON and CSV without errors
✅ Summary shows correct counts
✅ No console errors from logging functions
✅ <5ms overhead per log operation
✅ No memory leaks or unbounded growth

## Next Steps

After verifying all tests pass:
1. Review exported logs for accuracy
2. Check console for any unexpected errors
3. Verify all bot features still work normally
4. Test with multiple simultaneous bots
5. Test edge cases (rapid clicking, network issues)
6. Monitor performance during extended sessions

---

**Session ID Format:** `sess_[timestamp]_[random]`
**Max Logs Stored:** 1000 entries (rolling buffer)
**Export Formats:** JSON (structured), CSV (tabular)
