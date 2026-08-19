# Trade-Arena v5 - Master Architecture Audit

## Overall Architecture
Trade-Arena is a multi-layered trading platform that combines AI decision-making with on-chain execution on the Base network.

- **Frontend**: A hybrid architecture using a vanilla JS dashboard (Acoustic Core) and a React/Privy integration for wallet management and authentication. The UI is highly responsive, with 500ms telemetry updates and spatial audio feedback.
- **Backend**: Node.js/Express server (`server.js`) providing API endpoints for market data, user persistence (`users.json`), and cryptographic payout authorization.
- **Trading Engine**:
    - `TradingEngine`: Fleet management and trade lifecycle tracking.
    - `CrucibleRealTrading`: Strategy execution using technical indicators (RSI, SMA) and real-time prices.
    - `ExecutionEngine`: On-chain execution layer utilizing DEX aggregators (0x/1inch) and secure transaction signing via Privy.
- **AI Engine**: A "Model Arena" (`multi-ai-arena.js`) that maintains ELO ratings for different AI models (Claude, GPT, Gemini) and assigns them to trading tasks based on bot personality profiles.
- **Wallet Integration**: Primarily uses Privy for non-custodial embedded wallets, enabling social/email logins while abstracting blockchain complexity. Legacy MetaMask/Coinbase Wallet support remains via `real-wallet.js`.
- **Blockchain Integration**: Optimized for the Base network (Chain ID 8453). Integrated with Uniswap V3 for swaps and Aave V3 for flash loans.
- **Bounty/Task System**: Internal Task Center (`task-center.js`) for earning starting capital and external Marketplace (`marketplaces.js`) for autonomous agent earnings.

## Folder Structure
- `public/`: Static assets, JS bundles, and legacy frontend logic.
    - `src/`: Modern React source (TypeScript) for the Auth/Wallet header.
    - `kivy-app/`: Mobile app wrapper using Kivy/WebView.
- `contracts/`: Solidity contracts for rewards and flash loans (Foundry).
- `routes/`: Express API route definitions.
- `services/`: Backend business logic (payouts, flash loans).
- `strategies/`: Modular trading strategies (RSI, SMA).
- `engine/`: Simulation and core trading logic.
- `exchanges/`: Connectivity logic for various DEXes/CEXes.

## Entry Points
- **Backend**: `server.js` (Express server)
- **Frontend (Main)**: `public/index.html`
- **Frontend (React)**: `public/src/main.tsx` (Bundled to `arena-react-bundle.js`)
- **Mobile**: `public/kivy-app/main.py`

## Data Flow
1. **Market Data**: `RealMarketPricing` (`app-rebuild.js`) fetches CoinGecko prices -> Cached globally -> Used by all bots.
2. **AI Decisions**: Bot triggers `callAIModel` (`multi-ai-arena.js`) -> Selected model analyzed market data -> Returns structured JSON signal.
3. **Trade Execution**: `ExecutionEngine` (`execution-engine.js`) gets quote from 0x -> `Privy` prompts user for signature -> Transaction broadcasted to Base.
4. **State Persistence**: All user data (bots, balance, history) is POSTed to `/api/user/login` and saved in `users.json` on the server.

## Trading Flow
`Bot.spin()` -> `Crucible.checkSignals()` -> `MultiAI.callAIModel()` -> `Decision` -> `ExecutionEngine.getSwapQuote()` -> `Privy.signTransaction()` -> `On-chain Tx` -> `Transaction Tracking` -> `PnL Update`.

## AI Flow
1. **Selection**: `MODEL_SELECTION` strategies (round-robin, ELO-weighted, or profile-optimal) pick the best AI model for the task.
2. **Context**: Prompt includes top 8 market movers and bot's specific risk constraints.
3. **Refinement**: `Trade Olympics` bracket system tracks model performance, adjusting future assignments based on historical PnL.
4. **Safety**: Decisions are sanitized (`ai-api.js`) to ensure valid symbols, methods, and probability/outcome alignment.

## Wallet Flow
1. **Onboarding**: User logs in with Google/Apple -> Privy creates an embedded wallet on Base Mainnet.
2. **Interaction**: Application calls `privySignMessage` or `privySendTransaction`.
3. **Confirmation**: Privy modal appears for user approval -> Transaction signed and sent via the provider.

## Smart Contract Flow
- **PayoutManager**: Users claim rewards by submitting an Oracle-signed payload. Contract verifies the signature and transfers tokens.
- **FlashloanArbitrage**: Executed via `requestFlashLoan`. Contract receives loan, performs encoded DEX swaps, and repays loan with premium.

## API Inventory
| API | Purpose | Location | Env Var | Required? | Implemented? |
|---|---|---|---|---|---|
| CoinGecko | Real-time Pricing | `server.js`, `app-rebuild.js` | N/A | Yes | ✅ |
| Anthropic | AI Decisions (Claude) | `ai-api.js`, `proxy.js` | `ANTHROPIC_API_KEY` | Yes | ✅ |
| OpenAI | AI Decisions (GPT) | `proxy.js` | `OPENAI_API_KEY` | Optional | ✅ |
| Gemini | AI Decisions/Voice | `proxy.js` | `GEMINI_API_KEY` | Optional | ✅ |
| Privy | Embedded Wallet/Auth | `privy-client.js` | `PRIVY_APP_ID` | Yes | ✅ |
| 0x API | DEX Quotes/Aggregator | `execution-engine.js` | N/A | Yes | ✅ |
| Biconomy | Account Abstraction | `biconomyNexus.js` | N/A | Optional | ✅ |

## Environment Variables
| Variable | Purpose | Status |
|---|---|---|
| `PORT` | Server port | Defaults to 3001 |
| `ANTHROPIC_API_KEY` | Primary AI decision engine | **MISSING** |
| `PRIVY_APP_ID` | Privy configuration | Found in code |
| `RPC_URL` | Base network RPC | Found in code |
| `ORACLE_PRIVATE_KEY` | Signing reward claims | **MISSING** |
| `PAYOUT_MANAGER_ADDRESS` | Deployed contract address | **MISSING** |
| `TASK_CLAIM_SECRET` | Backend-only validation secret | **MISSING** |

## Missing Configuration
- **Production Secrets**: Critical keys for AI and Payouts are missing from `.env`.
- **Contract Deployments**: `PAYOUT_MANAGER_ADDRESS` and `REWARD_TOKEN_ADDRESS` must be populated after deployment.
- **0x API Key**: `EXECUTION_CONFIG.zeroExApiKey` in `execution-engine.js` is empty.

## TODOs
- [TODO] Replace placeholders with Google OAuth credentials in `management-bundle.js` and `privy-client.js`.
- [TODO] Implement real-time currency conversion API in `app-rebuild.js`.
- [TODO] Complete the Biconomy Nexus integration for full gasless trades.

## Dead Code
- `MasterSwitch` class in `trading-bundle.js` is explicitly commented out or disabled via `if (false)`.
- `temp_script_*.js` and `test_v2.js` are historical artifacts.
- Multiple duplicate logic blocks in `crucible-real-trading.js` (duplicated `executeLiveTrade` function).

## Security Risks
- **Insecure Fallback**: Payout system reverts to simulation/demo mode if keys are missing, which could be exploited if not carefully managed in production.
- **XSS Vulnerabilities**: `innerHTML` is used extensively in `index.html` and `task-center.js`. While `escapeHTML` is used in some places, a comprehensive audit of all sinks is needed.
- **Local Persistence**: `users.json` is a single file on disk. Concurrent writes during high traffic could lead to data corruption.

## Performance Risks
- **Bundle Bloat**: `arena-react-bundle.js` (5.4MB) contains the entire Privy and Ethers libraries. Needs optimization for mobile performance.
- **Network Waterfalls**: Some dashboard updates still trigger multiple sequential API calls; these should be batched (as was done for prices).

## Technical Debt
- **Critical**: Missing production secrets in environment configuration.
- **High**: Logic duplication between `app-rebuild.js` and `trading-bundle.js`.
- **Medium**: Inconsistent error handling between "Simulated" and "Real" modes.
- **Low**: Mixed use of CommonJS (`require`) and ESM (`import`) in the project.
