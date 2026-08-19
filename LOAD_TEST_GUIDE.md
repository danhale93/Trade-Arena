# HFT Notification Load Test Guide

This guide explains how to verify the **HFT Alert Aggregation** and **Local Logging Fallback** by simulating a burst of 100 trades per second.

---

## 1. How the Test Works

The `scripts/load-test-notifications.js` script bypasses the actual on-chain execution and price discovery logic. Instead, it directly invokes the `sendAlerts` method of the `MetaMaskAgentArbService` at a high frequency.

This allows you to stress-test:
1.  **Aggregation**: Does the bot correctly bundle hundreds of alerts into a single "Bulk Report"?
2.  **Stability**: Does the server handle high-speed local file writes to `logs/trades.log` without crashing?
3.  **Rate Limiting**: Does the bot avoid triggering Discord/Telegram 429 errors?

---

## 2. Running the Test

Ensure your `.env` is configured with your Discord/Telegram credentials if you want to see the bulk reports.

```bash
# 1. Install dependencies if you haven't already
npm install

# 2. Run the load test
node scripts/load-test-notifications.js
```

---

## 3. What to Look For

### A. Discord/Telegram
Instead of receiving 500 individual messages (which would likely get your bot banned), you should receive a single **"📦 Bulk Arbitrage Report"** once the aggregation window (default 60s) closes.

*   **Title**: `Bulk Arbitrage Report (500 trades)`
*   **Description**: `Processed 500 opportunities in the last minute.`
*   **Metrics**: Total Net Profit and Success/Failure ratio for the burst.

### B. Local Logs
Check the `logs/trades.log` file. Even though the alerts were aggregated, the local log must contain **every single trade** as an individual JSON line.

```bash
# Count the number of lines in the log
wc -l logs/trades.log
```
The count should increase by exactly the number of trades sent in the test.

### C. Terminal Output
The script will print a progress bar (`.`) and a final summary showing the actual trades per second achieved.

---

## 4. Adjusting Intensity

You can modify the constants at the top of `scripts/load-test-notifications.js` to test even higher loads:
```javascript
const TRADES_PER_SECOND = 200; // Increase for extreme stress testing
const TEST_DURATION_SECONDS = 10;
```

---

## References

[1] MetaMask Agent Trading Operations Skill Documentation (`/home/ubuntu/skills/metamask-agent-trading-ops/SKILL.md`).
