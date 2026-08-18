# Notification Reliability & HFT Aggregation

To ensure that you never miss a trade event—even during high-frequency trading (HFT) bursts or API outages—the **MetaMask Agent Arbitrage Service** includes built-in fallback and reliability mechanisms.

---

## 1. Local Logging Fallback (Primary Source of Truth)

Every trade simulation or execution is **always** logged locally to a JSON-formatted log file before any network-based alerts are attempted.

*   **Log Location**: `logs/trades.log`
*   **Format**: JSON per line (easy to parse with `jq` or external tools).
*   **Safety**: This file remains available even if Discord, Telegram, and your internet connection are all down.

---

## 2. HFT Alert Aggregation

Sending a notification for every single trade during high-frequency bursts can trigger API rate limits and create "alert fatigue." The bot now includes an **Aggregation Window** (default: 60 seconds).

| Trading Frequency | Behavior |
| :--- | :--- |
| **Low Frequency** | Instant individual alerts for every trade. |
| **High Frequency** | Alerts are queued and sent as a **Bulk Report** once per minute. |

**Bulk Report Contents**:
*   Total number of trades processed.
*   Aggregate Net Profit for the window.
*   Success/Failure ratio.

---

## 3. API Retry Mechanism

If the Discord or Telegram API returns an error (e.g., 5xx server error or 429 rate limit), the bot will automatically retry the request using **Exponential Backoff**:
*   **Attempt 1**: Immediate
*   **Attempt 2**: 2 seconds later
*   **Attempt 3**: 4 seconds later
*   **Attempt 4**: 8 seconds later

If all retries fail, the error is logged to the server console, but the trade remains safely recorded in the `logs/trades.log` file.

---

## 4. Configuration

You can adjust the aggregation window in `services/MetaMaskAgentArbService.js`:
```javascript
this.aggregationWindowMs = 60000; // Change to 30000 for 30-second reports
```

---

## Summary of Reliability Layers

1.  **Layer 1 (Local)**: `logs/trades.log` (Instant, offline-first).
2.  **Layer 2 (Network)**: Discord/Telegram (Retried with backoff).
3.  **Layer 3 (UX)**: Aggregation (Prevents spam and rate-limiting).

---

## References

[1] Discord Rate Limit Documentation: https://discord.com/developers/docs/topics/rate-limits
[2] Telegram Bot API Rate Limits: https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this
