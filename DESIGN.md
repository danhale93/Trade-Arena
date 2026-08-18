# Trade Arena Agent Console Design System

## Product intent

Trade Arena is an operator console for a **managed MetaMask Agent Wallet** that scans Base, Arbitrum, and Optimism for arbitrage opportunities. The interface must help an operator understand wallet state, edge quality, gas-aware thresholds, risk controls, and execution status without obscuring the distinction between **simulation** and **on-chain execution**.

## Design principles

1. **Capital safety is visually primary.** Execution mode, scanner state, wallet identity, and risk limits remain visible in the first viewport.
2. **Simulation and execution are never conflated.** Simulation uses cyan/blue accents; execution-capable state requires an amber warning and explicit confirmation.
3. **Network comparison is native.** Base, Arbitrum, and Optimism appear as peer cards with consistent metrics and a shared filter.
4. **Edge logic is inspectable.** Each opportunity exposes gross edge, gas cost, slippage budget, dynamic threshold, and projected net profit.
5. **Progressive disclosure reduces cognitive load.** KPIs stay compact; route details, policy rules, and transaction evidence live in expandable panels.
6. **Accessibility is part of the visual system.** Controls need visible focus states, accessible names, text status labels, and non-color indicators.

## Visual language

| Token | Value | Use |
| --- | --- | --- |
| `--canvas` | `#070A12` | Main background. |
| `--surface` | `#0E1422` | Cards and panels. |
| `--surface-raised` | `#151D2D` | Menus, drawers, and expanded details. |
| `--line` | `#25334B` | Borders and separators. |
| `--cyan` | `#55E6FF` | Simulation, telemetry, and focus state. |
| `--green` | `#59E391` | Healthy, profitable, or connected state. |
| `--amber` | `#FFBE5C` | Warning, elevated gas, or execution confirmation. |
| `--red` | `#FF6B7A` | Failed trade, pause, or critical risk state. |
| `--violet` | `#A78BFA` | Advanced edge logic and model-derived insights. |
| `--text` | `#F6F8FC` | Primary text. |
| `--muted` | `#8A98AD` | Secondary text and metadata. |

Use **Space Grotesk** for headings and labels and **JetBrains Mono** for addresses, hashes, prices, gas values, thresholds, and timestamps. Keep labels concise and pair uppercase technical labels with readable descriptions.

## Screen inventory

| Screen | Purpose | Primary components |
| --- | --- | --- |
| **Agent Overview** | First-viewport operational summary. | Managed-wallet identity card, execution-mode badge, scanner control, three-network cards, edge chart, recent events. |
| **Opportunity Inspector** | Explain why a route is or is not actionable. | Route graph, gross edge, gas/L1 fee, slippage budget, dynamic threshold, projected net profit, policy checks, quote timestamp. |
| **Risk & Policy** | Review capital controls. | Daily outflow cap, max trade, max slippage, allowed DEXs, gas ceiling, pause switch, policy audit trail. |
| **Execution Evidence** | Verify completed or rejected actions. | Transaction list, status filters, explorer links, quote-vs-realized comparison, failure reason, network filter. |
| **Agent Settings** | Manage non-secret runtime preferences. | Network toggles, poll interval, profit threshold, simulation/execution mode, notification preferences. Secrets remain server-side. |

## Agent Overview layout

Use a 12-column desktop grid and a single-column mobile layout. The top bar contains “TRADE ARENA / AGENT CONSOLE”, a network filter, a clear `SIMULATION ONLY` or `EXECUTION ARMED` badge, and a large **Pause scanner** control.

The first row contains four summary cards: managed wallet, scanner status, dynamic profit threshold, and session P&L. The second row contains three equal network cards for Base, Arbitrum, and Optimism. Each card shows chain health, last scan, gas, best projected net profit, venue, and a small sparkline. The third row contains an edge chart and event feed.

## Interaction rules

- **Pause scanner** is a reversible, low-risk action available from the overview.
- **Resume scanner** shows the current execution mode before resuming.
- **Execute** is not a primary dashboard CTA. It appears only inside Opportunity Inspector after a fresh quote and policy checks pass.
- If execution is disabled, show `SIMULATION ONLY` and explain that `AGENT_EXECUTION_ENABLED=true` is required server-side.
- Never render CLI tokens, private keys, or raw secrets.
- Copy-to-clipboard actions confirm success with text, not only color.

## Data contract

The console consumes `GET /api/agent/status` for managed-agent state and `/metrics` or a backend adapter for telemetry. The status payload includes `walletMode`, `executionEnabled`, `scannerEnabled`, `running`, `networks`, `profitThresholdUsd`, `slippagePercent`, `pollIntervalMs`, `lastScanAt`, `lastTradeAt`, `lastError`, and success/failed trade counts.

## Required labels

Use these exact labels in the interface:

- `MANAGED AGENT WALLET`
- `SIMULATION ONLY`
- `EXECUTION ARMED`
- `SCANNER PAUSED`
- `NET PROFIT AFTER FEES`
- `DYNAMIC PROFIT THRESHOLD`
- `L1 + L2 GAS ESTIMATE`
- `POLICY CHECKS PASSED`
- `NO SECRETS ARE DISPLAYED IN THIS CONSOLE`

## Acceptance criteria

The first exported Stitch screen succeeds when an operator can identify the active managed wallet, see whether execution is armed, compare all three networks, inspect the gas-aware threshold, pause the scanner, and open an opportunity without guessing whether values are simulated or realized.

## References

[1] Google, “Introducing ‘vibe design’ with Stitch,” 18 March 2026: https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/
[2] Stitch product page: https://stitch.withgoogle.com/
[3] Trade-Arena repository: https://github.com/danhale93/Trade-Arena
[4] MetaMask Agent Trading Operations skill: `/home/ubuntu/skills/metamask-agent-trading-ops/SKILL.md`
