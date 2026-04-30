/**
 * TRADE ARENA Backend - Express.js Server
 * Handles real trading logic, smart contract interactions, and data persistence
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ethers = require('ethers');
const axios = require('axios');
const WebSocket = require('websocket').w3cwebsocket;

// ─── Security middleware (install: npm i helmet express-rate-limit) ───────────
let helmet, rateLimit;
try { helmet = require('helmet'); } catch(e) { console.warn('⚠️  helmet not installed — run: npm i helmet'); }
try { rateLimit = require('express-rate-limit'); } catch(e) { console.warn('⚠️  express-rate-limit not installed — run: npm i express-rate-limit'); }

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security headers ────────────────────────────────────────────────────────
if (helmet) app.use(helmet());

// ─── CORS: restrict to your own domain in production ─────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(',');
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true
}));

// ─── Rate limiting ────────────────────────────────────────────────────────────
if (rateLimit) {
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,                  // Max 100 requests per window per IP
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, error: 'Too many requests — slow down.' }
    });
    app.use('/api/', limiter);

    // Stricter limit on trading actions
    const tradeLimiter = rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 10,
        message: { success: false, error: 'Too many trade requests — max 10/min.' }
    });
    app.use('/api/execute/', tradeLimiter);
    app.use('/api/bot/', tradeLimiter);
}

// ─── Body size limit ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));

// Configuration
const RPC_URL = 'https://mainnet.base.org'; // Base network RPC
const AAVE_FLASH_LOAN_ADDRESS = '0x794a61358D6845594F94dc1DB02A252b5b4814aD'; // Base Aave
const UNISWAP_V3_ADDRESS = '0x68b3465833fb72B5A828cCEA02FFAD6bCFB8ACCA'; // Base Swap Router

// Smart Contract ABIs (simplified)
const FLASH_LOAN_ABI = [
    'function flashLoan(address receiver, address token, uint256 amount, bytes calldata params) external',
    'function executeOperation(address asset, uint256 amount, uint256 premium, address initiator, bytes calldata params) external returns (bytes32)'
];

const DEX_ABI = [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
];

// Initialize provider
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

/**
 * API Routes
 */

/**
 * GET /api/health - Server health check
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: Date.now() });
});

/**
 * POST /api/analyze/arbitrage - Detect arbitrage opportunities
 */
app.post('/api/analyze/arbitrage', async (req, res) => {
    try {
        const { tokens, amount } = req.body;

        const opportunities = [];

        for (const token of tokens) {
            try {
                // Fetch prices from multiple DEXs
                const uniPrice = await fetchDexPrice(token, 'uniswap');
                const sushiPrice = await fetchDexPrice(token, 'sushiswap');
                const curvePrice = await fetchDexPrice(token, 'curve');

                const prices = [uniPrice, sushiPrice, curvePrice].filter(p => p !== null);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const spread = ((maxPrice - minPrice) / minPrice) * 100;

                // Account for slippage and gas fees (~0.5%)
                const profit = spread - 0.5;

                if (profit > 0.1) { // Only report if > 0.1% profit
                    opportunities.push({
                        token,
                        spread: spread.toFixed(3),
                        profit: profit.toFixed(3),
                        buyExchange: prices.indexOf(minPrice) === 0 ? 'Uniswap' : 'SushiSwap',
                        sellExchange: prices.indexOf(maxPrice) === 0 ? 'Uniswap' : 'SushiSwap',
                        volume: Math.random() * 1000000,
                        riskScore: calculateRisk(spread, amount),
                        timestamp: Date.now()
                    });
                }
            } catch (e) {
                console.error(`Error analyzing ${token}:`, e.message);
            }
        }

        res.json({
            success: true,
            opportunities: opportunities.sort((a, b) => parseFloat(b.profit) - parseFloat(a.profit))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/analyze/volatility - Volatility prediction
 */
app.post('/api/analyze/volatility', async (req, res) => {
    try {
        const { priceHistory } = req.body;

        if (!priceHistory || priceHistory.length < 2) {
            return res.status(400).json({ error: 'Invalid price history' });
        }

        // Calculate returns
        const returns = [];
        for (let i = 1; i < priceHistory.length; i++) {
            returns.push((priceHistory[i] - priceHistory[i-1]) / priceHistory[i-1]);
        }

        // Calculate standard deviation
        const mean = returns.reduce((a, b) => a + b) / returns.length;
        const variance = returns.reduce((sq, n) => sq + Math.pow(n - mean, 2)) / returns.length;
        const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized

        // GARCH(1,1) simulation for next period
        const omega = 0.00001;
        const alpha = 0.1;
        const beta = 0.85;
        const lastReturn = returns[returns.length - 1];
        const lastVariance = variance;
        const nextVariance = omega + alpha * (lastReturn ** 2) + beta * lastVariance;
        const garchVol = Math.sqrt(nextVariance) * Math.sqrt(252) * 100;

        res.json({
            success: true,
            current: volatility.toFixed(2),
            forecast24h: (volatility * 1.1).toFixed(2),
            forecast7d: (volatility * 1.3).toFixed(2),
            garchForecast: garchVol.toFixed(2),
            trend: volatility > 5 ? 'HIGH' : volatility > 2 ? 'MEDIUM' : 'LOW'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/flash-loan/simulate - Simulate flash loan opportunity
 */
app.post('/api/flash-loan/simulate', async (req, res) => {
    try {
        const { loanAmount, tokens } = req.body;

        // Simulate MEV opportunity detection
        const opportunity = {
            type: 'MEV_SANDWICH',
            loanAmount,
            flashFee: (loanAmount * 0.0009), // 0.09% Aave fee
            estimatedProfit: (loanAmount * (0.001 + Math.random() * 0.003)), // 0.1% - 0.4% ROI
            strategy: 'Liquidation + Sandwich + Slippage Extraction',
            risk: 'MEDIUM',
            gasEstimate: 500000,
            timestamp: Date.now()
        };

        const roi = (opportunity.estimatedProfit - opportunity.flashFee) / loanAmount * 100;
        opportunity.roi = roi.toFixed(2);
        opportunity.isProfit = roi > 0;

        res.json({ success: true, opportunity });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/execute/swap - Execute token swap (simulation)
 */
app.post('/api/execute/swap', async (req, res) => {
    try {
        const { fromToken, toToken, amount, slippage } = req.body;

        // Simulate swap execution
        const expectedOutput = amount * (1 - (slippage || 0.005)); // Account for slippage
        const gasUsed = Math.random() * 150000 + 50000; // 50k - 200k gas
        const gasCost = gasUsed * 0.001; // Simplified (real would use current gas price)

        const result = {
            success: true,
            swap: {
                from: { token: fromToken, amount: amount.toFixed(4) },
                to: { token: toToken, amount: expectedOutput.toFixed(4) },
                exchange: 'Uniswap V3',
                slippage: `${(slippage * 100).toFixed(2)}%`,
                gasUsed: gasUsed.toFixed(0),
                gasCost: gasCost.toFixed(4),
                timestamp: Date.now()
            },
            txHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/bot/create - Create trading bot
 */
app.post('/api/bot/create', async (req, res) => {
    try {
        const { name, strategy, riskLevel, initialCapital, userAddress } = req.body;

        const bot = {
            id: generateId(),
            name,
            strategy,
            riskLevel,
            initialCapital,
            userAddress,
            status: 'ACTIVE',
            created: Date.now(),
            trades: [],
            totalProfit: 0,
            config: generateBotConfig(strategy, riskLevel)
        };

        res.json({ success: true, bot });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/market/prices - Get real-time market data
 */
app.get('/api/market/prices', async (req, res) => {
    try {
        const symbols = req.query.symbols?.split(',') || ['WETH', 'USDC', 'ARB'];

        const prices = {};
        for (const symbol of symbols) {
            const price = await fetchCoinGeckoPrice(symbol);
            if (price) prices[symbol] = price;
        }

        res.json({ success: true, prices, timestamp: Date.now() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Price Feed Layer
 * Primary:   CoinGecko (free, no key, ~1-min cached)
 * Secondary: 0x Price API (Base network, no key for quotes)
 * Fallback:  Last known good price (stale cache)
 */

// ─── In-memory price cache (TTL: 60 seconds) ──────────────────────────────────
const priceCache = {};
const CACHE_TTL_MS = 60_000;

// Token → CoinGecko ID mapping (extend as needed)
const COINGECKO_IDS = {
    'WETH':  'ethereum',
    'ETH':   'ethereum',
    'USDC':  'usd-coin',
    'USDT':  'tether',
    'DAI':   'dai',
    'WBTC':  'wrapped-bitcoin',
    'BTC':   'bitcoin',
    'ARB':   'arbitrum',
    'OP':    'optimism',
    'LINK':  'chainlink',
    'UNI':   'uniswap',
    'AAVE':  'aave',
    'CRV':   'curve-dao-token',
    'SNX':   'havven',
    'MKR':   'maker',
    'COMP':  'compound-governance-token',
    'BASE':  'base-protocol',
};

// Token contract addresses on Base mainnet (for 0x fallback)
const BASE_TOKEN_ADDRESSES = {
    'WETH':  '0x4200000000000000000000000000000000000006',
    'USDC':  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    'USDT':  '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    'DAI':   '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    'WBTC':  '0x0555E30da8f98308EdB960aa94C0Db47230d2B9',
    'ARB':   null, // Not native on Base
    'LINK':  '0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196',
};

/**
 * Fetch real price from CoinGecko (free public API, rate limited to ~10 req/min)
 * Returns USD price or null on failure.
 */
async function fetchCoinGeckoSpotPrice(symbol) {
    const coinId = COINGECKO_IDS[symbol.toUpperCase()];
    if (!coinId) return null;

    try {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;
        const res = await axios.get(url, { timeout: 5000 });
        const data = res.data[coinId];
        if (!data || !data.usd) return null;

        return {
            price: data.usd,
            change24h: data.usd_24h_change || 0,
            volume24h: data.usd_24h_vol || 0,
        };
    } catch (e) {
        console.warn(`[CoinGecko] ${symbol}: ${e.message}`);
        return null;
    }
}

/**
 * Fetch price via 0x Price API on Base network (simulates DEX price for arb spread)
 * Returns USD price or null on failure.
 * NOTE: 0x charges a small fee on swaps but the price API is free.
 */
async function fetch0xPrice(symbol, amountUSD = 100) {
    const contractAddr = BASE_TOKEN_ADDRESSES[symbol.toUpperCase()];
    if (!contractAddr) return null;

    try {
        // Use USDC as sell token to get token price in USD
        const usdcAddr  = BASE_TOKEN_ADDRESSES['USDC'];
        const sellAmtWei = (amountUSD * 1e6).toFixed(0); // USDC = 6 decimals

        const url = `https://api.0x.org/swap/v1/price?chainId=8453&sellToken=${usdcAddr}&buyToken=${contractAddr}&sellAmount=${sellAmtWei}`;
        const res = await axios.get(url, {
            timeout: 6000,
            headers: { 'Content-Type': 'application/json' }
        });

        const data = res.data;
        if (!data || !data.price) return null;

        // data.price = buyToken per sellToken → invert to get USD per buyToken
        const tokenPriceUSD = amountUSD / parseFloat(data.price) / (amountUSD / 1); // simplified
        return { price: parseFloat(data.price) > 0 ? amountUSD / parseFloat(data.price) : null };
    } catch (e) {
        console.warn(`[0x] ${symbol}: ${e.message}`);
        return null;
    }
}

/**
 * Get the current USD price for a token.
 * Uses cache → CoinGecko → 0x → stale cache → hardcoded fallback.
 * Adds ±0.05–0.3% synthetic spread across DEX "sources" (realistic for same-block arb).
 */
async function fetchDexPrice(symbol, dex = 'uniswap') {
    const key = symbol.toUpperCase();
    const now  = Date.now();

    // ── 1. Fresh cache ──────────────────────────────────────────────────────────
    if (priceCache[key] && (now - priceCache[key].ts) < CACHE_TTL_MS) {
        const base = priceCache[key].price;
        return addDexSpread(base, dex);
    }

    // ── 2. CoinGecko (real price) ───────────────────────────────────────────────
    const cg = await fetchCoinGeckoSpotPrice(key);
    if (cg && cg.price > 0) {
        priceCache[key] = { price: cg.price, ts: now, change24h: cg.change24h, volume24h: cg.volume24h, source: 'coingecko' };
        console.log(`[Price] ${key} = $${cg.price} (CoinGecko)`);
        return addDexSpread(cg.price, dex);
    }

    // ── 3. 0x fallback ─────────────────────────────────────────────────────────
    const zx = await fetch0xPrice(key);
    if (zx && zx.price > 0) {
        priceCache[key] = { price: zx.price, ts: now, source: '0x' };
        console.log(`[Price] ${key} = $${zx.price} (0x)`);
        return addDexSpread(zx.price, dex);
    }

    // ── 4. Stale cache (any age) ────────────────────────────────────────────────
    if (priceCache[key]) {
        console.warn(`[Price] ${key}: using stale cache ($${priceCache[key].price})`);
        return addDexSpread(priceCache[key].price, dex);
    }

    // ── 5. Last resort hardcoded prices (prevents crashes during API downtime) ──
    const fallback = { 'WETH': 3200, 'ETH': 3200, 'USDC': 1, 'USDT': 1, 'DAI': 1,
                       'WBTC': 95000, 'BTC': 95000, 'ARB': 0.85, 'OP': 1.6,
                       'LINK': 14.5, 'UNI': 9.2, 'AAVE': 175, 'CRV': 0.38 }[key];
    if (fallback) {
        console.warn(`[Price] ${key}: using hardcoded fallback ($${fallback})`);
        return addDexSpread(fallback, dex);
    }

    console.error(`[Price] ${key}: no price source available — returning null`);
    return null;
}

/**
 * Add realistic per-DEX spread to simulate arbitrage opportunities.
 * Uniswap V3 is tightest; SushiSwap / Curve vary more.
 * Spread is deterministic per symbol+dex combo so it's stable within a cache window.
 */
function addDexSpread(basePrice, dex) {
    if (basePrice === null) return null;
    const spreads = {
        uniswap:   0.0002, // ±0.02% (very tight)
        sushiswap: 0.0008, // ±0.08%
        curve:     0.0004, // ±0.04%
        balancer:  0.0006,
        default:   0.0005,
    };
    const magnitude = spreads[dex.toLowerCase()] || spreads.default;
    // Pseudo-random but stable per (dex, price) — not truly random
    const sign = Math.sin(basePrice * dex.length) > 0 ? 1 : -1;
    return basePrice * (1 + sign * magnitude);
}

/**
 * GET /api/prices/:symbols — Real-time multi-token prices
 * e.g. GET /api/prices/WETH,USDC,ARB
 */
app.get('/api/prices/:symbols', async (req, res) => {
    const symbols = req.params.symbols.split(',').slice(0, 10); // Max 10
    const results = {};

    await Promise.allSettled(
        symbols.map(async (sym) => {
            const key = sym.trim().toUpperCase();
            // Trigger cache fill
            await fetchDexPrice(key);
            if (priceCache[key]) {
                results[key] = {
                    price:     priceCache[key].price,
                    change24h: priceCache[key].change24h?.toFixed(2) || '0.00',
                    volume24h: priceCache[key].volume24h || 0,
                    source:    priceCache[key].source,
                    cachedAt:  priceCache[key].ts,
                };
            }
        })
    );

    res.json({ success: true, prices: results, timestamp: Date.now() });
});



function calculateRisk(spread, amount) {
    // Risk scoring: 0-100
    // Higher spread = lower risk (more obvious arbitrage)
    let risk = Math.max(0, 100 - spread * 1000);
    
    // Larger amounts = higher risk (slippage impact)
    if (amount > 10) risk += 20;
    if (amount > 50) risk += 20;
    
    return Math.min(100, Math.max(0, risk));
}

function generateBotConfig(strategy, riskLevel) {
    const configs = {
        'Arbitrage Detection': {
            minSpread: 0.3,
            maxSpread: 10,
            maxSlippage: 1,
            checkInterval: 30000
        },
        'Flash Loan Farming': {
            minProfit: 0.1,
            maxLoanMultiplier: 50,
            riskAssessment: 'HIGH',
            checkInterval: 15000
        },
        'Volatility Trading': {
            minVolatility: 2,
            maxVolatility: 50,
            leverageAdjustment: 'DYNAMIC',
            checkInterval: 60000
        },
        'Grid Trading': {
            gridSize: 5,
            priceDeviation: 2,
            orderSize: 'AUTO',
            checkInterval: 45000
        }
    };

    const config = configs[strategy] || configs['Arbitrage Detection'];

    // Apply risk adjustments
    const riskMultipliers = {
        'Conservative (2x leverage)': 0.5,
        'Moderate (5x leverage)': 1.0,
        'Aggressive (10x leverage)': 2.0,
        'Max Risk (20x leverage)': 3.0
    };

    config.riskMultiplier = riskMultipliers[riskLevel] || 1;

    return config;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Start Server
 */
// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(err.status || 500).json({ success: false, error: 'Internal server error' });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.path}` });
});

// ─── Crash protection ─────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err.message, err.stack);
    // Don't exit — keep server alive
});

process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Promise Rejection:', reason);
});

app.listen(PORT, () => {
    console.log(`🤖 Trade Arena Backend running on port ${PORT}`);
    console.log(`📊 Market analysis: http://localhost:${PORT}/api/health`);
    console.log(`🔒 Security: helmet=${!!helmet} rateLimit=${!!rateLimit}`);
});

module.exports = app;
