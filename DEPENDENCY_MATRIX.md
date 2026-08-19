# Trade-Arena v5 - Dependency Matrix

| Category | Package | Version | Purpose | Can be removed? | Recommended Replacement? | Notes |
|---|---|---|---|---|---|---|
| **AI** | `@anthropic-ai/sdk` | N/A | Claude API access (via fetch) | No | OpenAI SDK | Primary decision engine via fetch in `ai-api.js`. |
| **Wallets** | `@privy-io/react-auth` | `^3.33.1` | Embedded wallet & Auth | No | Dynamic / Web3Auth | Critical for social login and embedded UX. |
| **Blockchain** | `ethers` | `^6.17.0` | Smart contract interaction | No | Viem | Essential for on-chain execution and signature verification. |
| **Blockchain** | `viem` | `^2.53.1` | Low-level EVM interaction | Yes | Ethers.js | Required by Biconomy SDK, otherwise redundant. |
| **Account Abs** | `@biconomy/account` | `^4.5.7` | Smart Accounts / Gasless | Optional | No replacement | Used for gasless transactions and account abstraction. |
| **Account Abs** | `@biconomy/abstractjs` | `^1.2.4` | AA Helper library | Optional | No replacement | Complements the Biconomy account SDK. |
| **Trading** | `ccxt` | `^4.5.61` | Exchange API connectivity | Optional | Direct API calls | Powerful but adds ~30MB to node_modules. |
| **Backend** | `express` | `^5.2.1` | Web server framework | No | Fastify | Core infrastructure for API and static serving. |
| **Backend** | `axios` | `^1.16.0` | API requests | Yes | `fetch` | Standard for server-side HTTP calls. |
| **Backend** | `dotenv` | `^17.4.2` | Env management | No | N/A | Loads configurations from `.env`. |
| **Security** | `cors` | `^2.8.5` | Cross-origin sharing | No | N/A | Protects API from unauthorized origins. |
| **Security** | `express-rate-limit` | `^8.5.2` | API Throttling | No | N/A | Protects against payout and AI spam. |
| **Frontend** | `react` | `^19.2.7` | UI Library | No | N/A | Used for the modern Privy integration header. |
| **Frontend** | `react-dom` | `^19.2.7` | React DOM | No | N/A | Required for React rendering. |
| **Build** | `esbuild` | `^0.28.1` | JS Bundler | Yes | Vite / Webpack | Extremely fast, used for `arena-react-bundle.js`. |
| **Development** | `concurrently` | `^10.0.3` | Task runner | Yes | N/A | Runs server and proxy simultaneously. |
