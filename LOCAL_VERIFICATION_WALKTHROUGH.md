# Local Verification Walkthrough: HFT Performance Subsystems

This guide walks you through verifying the integration and performance of the newly added HFT subsystems in your local development environment.

---

## Step 1: Verify Optimized Startup & V8 Tuning

Start the bot using the high-performance profile to ensure the V8 flags are correctly applied.

```bash
# Start with the HFT profile (optimized for low-latency GC)
npm run start:hft
```

**Verification Check:**
*   Check the terminal for the log: `🤖 Multi-Chain worker started in SIMULATION-ONLY mode...`
*   Run `ps aux | grep node` to verify the flags like `--max-semi-space-size=256` are present in the process command.

---

## Step 2: Verify Prometheus Metrics & V8 Monitoring

Ensure the bot is exporting both arbitrage and runtime health metrics.

1.  Open your browser to `http://localhost:3001/metrics`.
2.  **Search for Arbitrage Metrics**: Look for `mm_arb_trades_total` and `mm_arb_profit_usd_total`.
3.  **Search for V8/GC Metrics**: Look for `nodejs_v8_heap_stats_bytes` and `nodejs_gc_duration_seconds`.

**Verification Check:**
*   You should see raw metric data updating in real-time as the scanner runs.

---

## Step 3: Verify Notification Reliability

Test the unified Discord/Telegram alert system and the local logging fallback.

1.  **Configure `.env`**: Ensure `DISCORD_WEBHOOK_URL` or `TELEGRAM_BOT_TOKEN` are set.
2.  **Run Test Script**:
    ```bash
    node scripts/test-notifications.js
    ```
3.  **Check Local Logs**:
    ```bash
    tail -f logs/trades.log
    ```

**Verification Check:**
*   You should receive a "🔔 Notification Test" message on your chosen platform.
*   A new JSON entry should appear in `logs/trades.log`.

---

## Step 4: Verify HFT Load & Alert Aggregation

Test how the bot handles a burst of 100 trades per second.

```bash
node scripts/load-test-notifications.js
```

**Verification Check:**
*   **Terminal**: You should see the progress bar (`.`) move rapidly.
*   **Notifications**: Instead of 500 individual alerts, you should receive a single **"📦 Bulk Arbitrage Report"** after 60 seconds.
*   **Logs**: `wc -l logs/trades.log` should show an increase of exactly 500 lines.

---

## Step 5: Verify Memory & GC Stability

Profile the memory footprint to ensure no leaks occur during sustained load.

```bash
# Run with manual GC exposure
node --expose-gc scripts/profile-memory-hft.js
```

**Verification Check:**
*   Observe the "Heap Used" snapshots. The memory should remain stable and return to near-baseline after the "🧹 Triggering Manual GC" step at the end.

---

## Step 6: Verify Performance Auditing (Clinic.js)

Generate deep performance reports to identify event loop bottlenecks.

```bash
chmod +x scripts/run-performance-audit.sh
./scripts/run-performance-audit.sh
```

**Verification Check:**
*   Check the `reports/performance/` directory for `doctor.html`, `bubbleprof.html`, and `heapprofiler.html`. Open these in your browser to view the interactive analysis.

---

## Summary of Verification Commands

| Component | Command |
| :--- | :--- |
| **Startup** | `npm run start:hft` |
| **Metrics** | `curl http://localhost:3001/metrics` |
| **Alerts** | `node scripts/test-notifications.js` |
| **HFT Load** | `node scripts/load-test-notifications.js` |
| **Profiling** | `node --expose-gc scripts/profile-memory-hft.js` |
| **Audit** | `./scripts/run-performance-audit.sh` |

---

## References

[1] Trade-Arena HFT Architecture Map (Jules API Session: `14498877036612253574`)
[2] V8 Tuning Guide (`V8_TUNING_GUIDE.md`)
[3] Notification Reliability Guide (`NOTIFICATION_RELIABILITY.md`)
