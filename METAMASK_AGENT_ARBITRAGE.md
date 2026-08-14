# MetaMask Agent Arbitrage Integration for Trade-Arena

This document outlines the integration of the **MetaMask Agent Trading Operations** skill into the **Trade-Arena** repository [1]. 

---

## 1. Architecture Overview

The integration bridges Trade-Arena's backend server with the **MetaMask Agent CLI**, adding production-grade reliability features:
*   **Mutex Locking (`async-mutex`)**: Serializes all CLI calls to prevent session corruption and `ECONNRESET` errors [1].
*   **MEV Protection**: Configures swaps with tight slippage tolerance (`0.1%`) and supports private RPC routing on Base Mainnet [1].
*   **Prometheus Metrics Exporter**: Exposes real-time trade counters, cumulative profit, and gas gauges at `/metrics`.
*   **Discord Webhook Alerts**: Sends rich embeds with direct BaseScan transaction links upon successful execution.

---

## 2. File Structure

*   `services/MetaMaskAgentArbService.js`: Core service managing the autonomous polling loop, mutex locks, CLI invocation, Prometheus metrics, and Discord notifications.
*   `public/server.js`: Updated Express backend serving the Prometheus `/metrics` endpoint and initializing the autonomous worker on startup.

---

## 3. Configuration & Environment Variables

Add the following variables to your `.env` file in Trade-Arena:

```env
# Base Mainnet RPC
BASE_RPC_URL=https://mainnet.base.org

# MetaMask Agent CLI Token
MM_CLI_TOKEN=mm_cli_live_secret_token_abcdef123456

# Arbitrage Bot Settings
ARB_PROFIT_THRESHOLD_USD=2.00
ARB_SLIPPAGE=0.1
ARB_POLL_INTERVAL_MS=10000

# Discord Notifications (Optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN

# Emergency Circuit Breaker
TRADING_PAUSED=false
```

---

## 4. Prometheus & Grafana Setup

1.  Start the Trade-Arena backend: `node public/server.js`
2.  Scrape metrics from: `http://localhost:3001/metrics`
3.  Configure Prometheus to point to target `localhost:3001` with a `5s` scrape interval.

---

## References

[1] MetaMask Agent Trading Operations Skill Documentation (`/home/ubuntu/skills/metamask-agent-trading-ops/SKILL.md`).
