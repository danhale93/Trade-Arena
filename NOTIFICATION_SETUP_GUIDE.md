# Real-Time Arbitrage Notifications Setup

Monitor your **MetaMask Agent Wallet** trades in real-time across **Discord** and **Telegram**. This guide explains how to configure webhooks and bot tokens to receive instant alerts for every successful execution.

---

## 1. Discord Webhook Setup (Recommended)

Discord webhooks are the easiest way to receive rich, color-coded alerts with embedded links.

1.  **Create a Webhook**:
    *   Open Discord and go to your Server Settings.
    *   Navigate to **Integrations** > **Webhooks**.
    *   Click **New Webhook**, name it "Arb Bot", and choose a channel.
    *   Click **Copy Webhook URL**.
2.  **Configure `.env`**:
    ```env
    DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
    ```

---

## 2. Telegram Bot Setup

Telegram is ideal for receiving mobile alerts and provides a clean, text-based log of your trades.

1.  **Create a Bot**:
    *   Message [@BotFather](https://t.me/botfather) on Telegram.
    *   Use `/newbot`, follow the prompts, and **Copy the API Token**.
2.  **Get your Chat ID**:
    *   Message [@userinfobot](https://t.me/userinfobot) to find your unique numeric Chat ID.
3.  **Configure `.env`**:
    ```env
    TELEGRAM_BOT_TOKEN=123456789:ABCDefGhIJKlmNoPQRstUVwxYz
    TELEGRAM_CHAT_ID=987654321
    ```

---

## 3. Testing Your Notifications

I've provided a simple testing script to verify your credentials without needing a real trade simulation.

```bash
# Set your environment variables first
export DISCORD_WEBHOOK_URL="..."
export TELEGRAM_BOT_TOKEN="..."
export TELEGRAM_CHAT_ID="..."

# Run the test script
node scripts/test-notifications.js
```

---

## 4. Notification Design

| Event | Discord Appearance | Telegram Appearance |
| :--- | :--- | :--- |
| **Success** | Green Embed + BaseScan Link | 🚀 Bold Header + Explorer Link |
| **Simulation** | Blue Embed | 📊 Simulation Tag |
| **Failure** | Red Embed + Error Message | ⚠️ Alert Header + Reason |

---

## 5. Advanced: Alert Aggregation

In high-frequency mode (HFT), you may receive dozens of alerts per minute. To avoid rate limits:
*   **Discord**: Ensure you are not sending more than 5 messages per second.
*   **Telegram**: Limit to 30 messages per second.
*   **Strategy**: If your bot is executing rapidly, consider updating the `MetaMaskAgentArbService.js` to aggregate trades into a "10-minute summary" instead of individual alerts.

---

## References

[1] Discord Webhook Documentation: https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks
[2] Telegram Bot API: https://core.telegram.org/bots/api
