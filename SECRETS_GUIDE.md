# Secret Keys Management Guide

To run **Trade Arena v4.2** in live Mainnet mode with full AI and on-chain capabilities, you must configure the following keys.

## 1. AI Model APIs (Decision Engines)
| Service | Purpose | Link to Generate |
|---------|---------|------------------|
| **Anthropic** | Claude 3.5 Sonnet | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **OpenAI** | GPT-4o / GPT-4o-mini | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Google Gemini** | Gemini 1.5 Pro/Flash | [aistudio.google.com](https://aistudio.google.com/app/apikey) |

## 2. Blockchain Infrastructure (Base Mainnet)
| Key | Purpose | Recommendation |
|-----|---------|----------------|
| `RPC_URL` | Mainnet Connection | [Alchemy](https://dashboard.alchemy.com/) or [QuickNode](https://dashboard.quicknode.com/) |
| `PAYOUT_PRIVATE_KEY` | Sending Payouts | Export from a fresh MetaMask account (Dedicated wallet) |
| `ORACLE_PRIVATE_KEY` | Signing Authorizations | Export from a fresh MetaMask account (Dedicated wallet) |

> ⚠️ **SECURITY WARNING**: Never use your primary personal wallet's private key. Create fresh, dedicated wallets for Payout and Oracle roles.

## 3. Application Services
| Service | Purpose | Link to Generate |
|---------|---------|------------------|
| **Privy** | Auth & Embedded Wallets | [dashboard.privy.io](https://dashboard.privy.io/) |
| **MoonPay** | Fiat Onboarding | [dashboard.moonpay.com](https://dashboard.moonpay.com/) |
| **Google Cloud** | Social OAuth Login | [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) |

## 4. Environment Setup
1. **Local**: Create a `.env` file in the root directory.
2. **Production (Render)**: Navigate to **Dashboard -> Environment** and add the keys there.
3. **Verification**: Once added, use the **SETTINGS -> API & ENV** tab in the Trade Arena header to verify connectivity.
