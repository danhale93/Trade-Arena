# Multi-Chain MetaMask Agent Arbitrage Integration for Trade-Arena

This document outlines the multi-chain integration of the **MetaMask Agent Trading Operations** skill across **Base Mainnet**, **Arbitrum One**, and **Optimism** within the **Trade-Arena** repository [1]. 

---

## 1. Architecture Overview

The multi-chain integration bridges Trade-Arena's backend server with the **MetaMask Agent CLI**, expanding autonomous operations across multiple Layer 2 networks:
*   **Multi-Chain Scanning**: Concurrently monitors Base (Aerodrome), Arbitrum (Uniswap V3), and Optimism (Velodrome) for arbitrage spreads.
*   **Mutex Locking (`async-mutex`)**: Serializes all CLI calls across networks to prevent session corruption and `ECONNRESET` errors [1].
*   **MEV Protection**: Configures swaps with tight slippage tolerance (`0.1%`) and private RPC routing on all supported chains [1].
*   **Prometheus Metrics Exporter**: Exposes network-labeled trade counters (`mm_arb_trades_total`), cumulative profit, and gas gauges at `/metrics`.
*   **Discord Webhook Alerts**: Sends rich embeds with direct block explorer links (BaseScan, Arbiscan, Optimistic Etherscan) upon successful execution.

---

## 2. File Structure

*   `services/MetaMaskAgentArbService.js`: Core multi-chain service managing the autonomous polling loop, mutex locks, CLI invocation, network-labeled Prometheus metrics, and Discord notifications.
*   `public/server.js`: Express backend serving the Prometheus `/metrics` endpoint and initializing the multi-chain worker on startup.

---

## 3. Configuration & Environment Variables

Add the following variables to your `.env` file in Trade-Arena:

```env
# Multi-Chain RPC URLs
BASE_RPC_URL=https://mainnet.base.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC_URL=https://mainnet.optimism.io

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
4.  In Grafana, use label filters like `{network="base"}`, `{network="arbitrum"}`, or `{network="optimism"}` to segment performance across chains.

---

## References

[1] MetaMask Agent Trading Operations Skill Documentation (`/home/ubuntu/skills/metamask-agent-trading-ops/SKILL.md`).
