# Stitch Handoff: Trade Arena Agent Console

## Objective

Create a responsive operator dashboard for a **managed MetaMask Agent Wallet** scanning Base, Arbitrum, and Optimism for arbitrage. The interface must make capital safety, execution mode, network health, and gas-aware edge logic unmistakable.

## Screen 1 — Agent Overview

Build a dark, high-contrast trading operations console with restrained cyan, green, amber, red, and violet accents. The top bar should show `TRADE ARENA / AGENT CONSOLE`, a network filter with All, Base, Arbitrum, and Optimism, a `SIMULATION ONLY` badge, and a prominent `PAUSE SCANNER` control.

The main content should contain four KPI cards: `MANAGED AGENT WALLET` with a truncated address and copy control; `SCANNER STATUS` with Running or Paused; `DYNAMIC PROFIT THRESHOLD` with the current dollar threshold; and `SESSION P&L` with realized and simulated values separated. Below those cards, show equal Base, Arbitrum, and Optimism network cards. Each card should include network health, last scan, gas in Gwei, best projected net profit, venue, and a small sparkline.

Use a large panel titled `EDGE MONITOR` with an overlaid line chart for simulated net profit and dynamic threshold. Add a right-side `EVENT STREAM` showing quote, policy, and transaction events. The footer must state `NO SECRETS ARE DISPLAYED IN THIS CONSOLE`.

## Screen 2 — Opportunity Inspector

Create a detail view with a route summary, edge breakdown, and decision rail. Show route, chain, DEX, quote age, gross edge, slippage budget, `L1 + L2 GAS ESTIMATE`, `NET PROFIT AFTER FEES`, and `DYNAMIC PROFIT THRESHOLD`. The decision rail must show `POLICY CHECKS PASSED`, `SIMULATE AGAIN`, and a guarded execution action based on current execution mode.

## Screen 3 — Risk & Policy

Create cards for daily outflow cap, max trade size, max slippage, gas ceiling, contract allowlist, and global pause. Use amber warnings for settings that could enable live execution. Do not request or render secrets.

## Screen 4 — Execution Evidence

Create a transaction evidence table with network, timestamp, route, expected profit, realized profit, gas spent, status, and explorer link. Add filters for Base, Arbitrum, Optimism, Success, Failed, and Simulation.

## Screen 5 — Agent Settings

Create non-secret controls for enabled networks, poll interval, base profit target, dynamic gas multiplier, notifications, and simulation/execution mode. Helper text must state that live execution is server-controlled and requires explicit environment configuration.

## Visual system

Use Space Grotesk for headings and JetBrains Mono for technical values. Use dense, legible cards rather than decorative trading-terminal clutter. Keep visible focus states, keyboard navigation, semantic labels, responsive behavior, and non-color status indicators.

Required labels: `MANAGED AGENT WALLET`, `SIMULATION ONLY`, `EXECUTION ARMED`, `SCANNER PAUSED`, `NET PROFIT AFTER FEES`, `DYNAMIC PROFIT THRESHOLD`, `L1 + L2 GAS ESTIMATE`, `POLICY CHECKS PASSED`, and `NO SECRETS ARE DISPLAYED IN THIS CONSOLE`.

## Implementation contract

Map the visual layer to these existing Trade-Arena endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/agent/status` | Read managed-agent state, networks, thresholds, timestamps, and trade counts. |
| `POST /api/agent/pause` | Pause quote polling and execution decisions. |
| `POST /api/agent/resume` | Resume quote polling; execution remains server-controlled. |
| `GET /metrics` | Source Prometheus telemetry through a backend adapter or dashboard integration. |

Keep the first screen simulation-safe. Do not add browser-side private keys, CLI tokens, or autonomous trade triggers. Export responsive HTML/CSS/JS and merge the generated visual layer into `public/agent-console.html` or the existing React entrypoint.

## Suggested Stitch workflow

1. Import `/home/ubuntu/Trade-Arena/DESIGN.md` as the design-system context.
2. Generate the Agent Overview screen first.
3. Connect it to Opportunity Inspector, Risk & Policy, Execution Evidence, and Agent Settings.
4. Export the visual layer and merge it into Trade-Arena while preserving the API contract above.
5. Keep the current `public/index.html` experience available as a fallback until the new console passes wallet-state, pause/resume, and simulation-mode checks.

## References

[1] Google, “Introducing ‘vibe design’ with Stitch,” 18 March 2026: https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/
[2] Stitch product page: https://stitch.withgoogle.com/
[3] Trade-Arena repository: https://github.com/danhale93/Trade-Arena
[4] MetaMask Agent Trading Operations skill: `/home/ubuntu/skills/metamask-agent-trading-ops/SKILL.md`
