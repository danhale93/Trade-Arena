# TRADE ARENA — AI Trading Floor

## Quick Start

```bash
npm install
node server.js
```

Open `http://localhost:3001` in your browser.

## Architecture

| File | Purpose |
|------|---------|
| `server.js` | Express backend — REST API, onchain interactions, agent edit endpoints |
| `index.html` | Frontend SPA — bot control panel, trading UI, music player |
| `trading-engine.js` | Bot spin logic, strategy selection, trade execution |
| `app.js` | Bootstrap helper — sets globals used by index.html |
| `contract-helpers.js` | Smart contract utilities, token configs, protocol ABIs |
| `multi-ai-arena.js` | Multi-LLM arena system — assigns models to bots by profile |
| `advanced-bot-engine.js` | Fallback bot decision logic when no API key available |
| `music-player.js` | Ambient music player with playlist management |
| `agent-code-edit-runner.js` | Server-side code editing workflow — plan/apply/audit |

## API Endpoints

### Market Data
- `GET /api/health` — Server health check
- `GET /api/market/prices?symbols=WETH,USDC` — Token prices
- `GET /api/market/dex-prices?pair=WETH-USDC` — DEX price feeds
- `GET /api/trade/quote?from=WETH&to=USDC&amount=1` — Swap quote

### Trading
- `POST /api/execute/swap` — Execute token swap
- `POST /api/exit/execute` — Exit position
- `POST /api/flash-loan/analyze` — Flash loan analysis
- `POST /api/analyze/arbitrage` — Arbitrage detection

### Wallet
- `GET /api/wallet/balance?address=0x...` — Wallet balance
- `GET /api/tokens/balances?address=0x...` — All token balances
- `POST /api/wrap` — Wrap/unwrap ETH

### Agent Code Editing
- `POST /api/agent/edit/plan` — Preview a code change diff
- `POST /api/agent/edit/apply` — Apply a planned diff
- `GET /api/agent/edit/audit/:id` — Get audit record

See `AGENT_CODE_EDITING_GUIDE.md` for details.

## Bot Profiles

| Profile | Style | Preferred AI Model |
|---------|-------|-------------------|
| SCALPER | Rapid short-term trades | grok-3 |
| TREND | Follows momentum | gpt-5-turbo |
| AGGRESSIVE | High-risk high-reward | grok-3 |
| CONSERVATIVE | Low-risk steady | claude-3-opus |
| BALANCED | Mixed strategy | claude-3.5-sonnet |
| NICHE | Alternative assets | neural-shadow |

## Documentation

- `README.md` — This file
- `AGENT_CODE_EDITING_GUIDE.md` — In-app agent editing workflow
- `MULTI_AI_INTEGRATION_COMPLETE.md` — Multi-AI arena system docs
- `BOT_CONFIGURATION.md` — Bot configuration reference
- `TRADE_ISSUES_DIAGNOSTIC.md` — Diagnostic guide for trade issues
- `DOCUMENTATION_INDEX.md` — Full documentation index
- `TODO.md` — Active development tasks