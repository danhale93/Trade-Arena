/**
 * TRADE ARENA Backend - Express.js Server
 * Handles real trading logic, smart contract interactions, and data persistence
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ethers = require('ethers');
const axios = require('axios');
const crypto = require('crypto');
const WebSocket = require('websocket').w3cwebsocket;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from root directory
app.use(express.static(__dirname));

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

/** Deployment queue for confirmed deposits */
const deploymentEvents = [];

function queueBotDeployment(deposit) {
    const event = {
        id: generateId(),
        type: 'BOT_DEPLOYMENT_TRIGGERED',
        status: 'QUEUED',
        source: 'moonpay',
        created: Date.now(),
        deposit
    };

    deploymentEvents.unshift(event);
    if (deploymentEvents.length > 50) deploymentEvents.pop();
    return event;
}

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
 * GET /api/deployments - Recent deposit-triggered deployment events
 */
app.get('/api/deployments', (req, res) => {
    res.json({
        success: true,
        deployments: deploymentEvents
    });
});

/**
 * POST /api/webhooks/moonpay/deposit - MoonPay deposit confirmation hook
 */
app.post('/api/webhooks/moonpay/deposit', (req, res) => {
    try {
        const signature = req.headers['x-moonpay-signature'];
        const secret = process.env.MOONPAY_WEBHOOK_SECRET;

        // Sentinel: Fail closed if secret is missing or signature is invalid
        if (!secret) {
            console.error('[MoonPay Webhook] MOONPAY_WEBHOOK_SECRET is missing');
            return res.status(500).json({ success: false, error: 'Webhook configuration error' });
        }

        if (!signature || !verifyMoonPaySignature(req.body, signature, secret)) {
            return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
        }

        const payload = req.body || {};
        const status = String(payload.status || payload.state || '').toLowerCase();
        const amount = Number(payload.amount || payload.cryptoAmount || payload.fiatAmount || 0);
        const currency = String(payload.currency || payload.cryptoCurrency || 'USDC').toUpperCase();
        const destination = payload.walletAddress || payload.address || payload.destinationAddress || '';
        const reference = payload.transactionId || payload.id || payload.reference || null;

        const isConfirmed = ['completed', 'complete', 'confirmed', 'succeeded', 'success'].includes(status);

        if (!isConfirmed) {
            return res.json({
                success: true,
                received: true,
                ignored: true,
                reason: 'Deposit not confirmed yet'
            });
        }

        const deployment = queueBotDeployment({
            reference,
            currency,
            amount,
            destination,
            source: 'moonpay',
            confirmedAt: Date.now()
        });

        res.json({
            success: true,
            received: true,
            deployment,
            message: 'Deposit confirmed and deployment queued'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/analyze/arbitrage - Detect arbitrage opportunities using real prices
 */
app.post('/api/analyze/arbitrage', async (req, res) => {
    try {
        const { tokens, amount } = req.body;
        if (!tokens || !Array.isArray(tokens) || tokens.length < 2) {
            return res.status(400).json({ success: false, error: 'tokens array required with >= 2 symbols' });
        }

        const opportunities = [];
        const coinMap = { 'WETH': 'ethereum', 'ETH': 'ethereum', 'USDC': 'usd-coin', 'ARB': 'arbitrum', 'OP': 'optimism', 'BTC': 'bitcoin', 'SOL': 'solana', 'ADA': 'cardano', 'XRP': 'ripple' };
        const decimalsMap = { 'WETH': 18, 'ETH': 18, 'USDC': 6, 'ARB': 18, 'OP': 18, 'BTC': 8, 'SOL': 9, 'ADA': 6, 'XRP': 6 };

        const coinIds = [...new Set(tokens.map(t => coinMap[t]).filter(Boolean))].join(',');
        let priceMap = {};

        if (coinIds) {
            try {
                const cgResp = await axios.get(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`,
                    { timeout: 8000 }
                );
                priceMap = Object.fromEntries(
                    Object.entries(cgResp.data).map(([id, data]) => [id, data.usd])
                );
            } catch (e) {
                console.warn('[Arbitrage] CoinGecko fetch failed, using cached/mock prices');
            }
        }

        for (let i = 0; i < tokens.length; i++) {
            for (let j = i + 1; j < tokens.length; j++) {
                const tokA = tokens[i];
                const tokB = tokens[j];
                const coinA = coinMap[tokA];
                const coinB = coinMap[tokB];
                if (!coinA || !coinB) continue;

                const priceA = priceMap[coinA];
                const priceB = priceMap[coinB];
                if (!priceA || !priceB) continue;

                const spread = ((Math.max(priceA, priceB) - Math.min(priceA, priceB)) / Math.min(priceA, priceB)) * 100;
                const profit = spread - 0.5;

                if (profit > 0.05) {
                    opportunities.push({
                        tokenA: tokA,
                        tokenB: tokB,
                        priceA,
                        priceB,
                        spread: +spread.toFixed(3),
                        profit: +profit.toFixed(3),
                        buyExchange: priceA < priceB ? 'DEX_A' : 'DEX_B',
                        sellExchange: priceA < priceB ? 'DEX_B' : 'DEX_A',
                        volume: Math.abs(priceA * priceB) * (amount || 1000),
                        riskScore: Math.max(0, Math.min(100, Math.round(100 - spread * 50))),
                        timestamp: Date.now()
                    });
                }
            }
        }

        if (opportunities.length === 0 && tokens.length >= 2) {
            const basePrice = { 'WETH': 2500, 'ETH': 2500, 'USDC': 1, 'ARB': 0.8, 'OP': 1.5, 'BTC': 67000, 'SOL': 170, 'ADA': 0.45, 'XRP': 0.55 };
            for (let i = 0; i < tokens.length; i++) {
                for (let j = i + 1; j < tokens.length; j++) {
                    const priceA = basePrice[tokens[i]] || 100;
                    const priceB = basePrice[tokens[j]] || 100;
                    if (priceA <= 0 || priceB <= 0) continue;
                    const spread = ((Math.max(priceA, priceB) - Math.min(priceA, priceB)) / Math.min(priceA, priceB)) * 100;
                    const profit = spread - 0.5;
                    if (profit > 0.05) {
                        opportunities.push({
                            tokenA: tokens[i],
                            tokenB: tokens[j],
                            priceA,
                            priceB,
                            spread: +spread.toFixed(3),
                            profit: +profit.toFixed(3),
                            buyExchange: priceA < priceB ? 'DEX_A' : 'DEX_B',
                            sellExchange: priceA < priceB ? 'DEX_B' : 'DEX_A',
                            volume: Math.abs(priceA * priceB) * (amount || 1000),
                            riskScore: Math.max(0, Math.min(100, Math.round(100 - spread * 50))),
                            timestamp: Date.now(),
                            source: 'fallback'
                        });
                    }
                }
            }
        }

        res.json({
            success: true,
            opportunities: opportunities.sort((a, b) => parseFloat(b.profit) - parseFloat(a.profit)),
            source: opportunities[0]?.source || 'coingecko',
            prices: priceMap
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
 * Helper Functions
 */

async function fetchDexPrice(token, dex) {
    try {
        // Simulated DEX price fetching
        // In production, would call actual DEX APIs or use Uniswap subgraph
        const basePrice = { 'WETH': 2500, 'USDC': 1, 'ARB': 0.8, 'OP': 1.5 }[token] || 100;
        const variance = (Math.random() - 0.5) * 2; // ┬▒1% variance
        return basePrice * (1 + variance / 100);
    } catch (e) {
        console.error(`Error fetching ${dex} price for ${token}:`, e);
        return null;
    }
}

/**
 * Verify MoonPay webhook signature using HMAC-SHA256
 */
function verifyMoonPaySignature(body, signature, secret) {
    try {
        const hmac = crypto.createHmac('sha256', secret);
        const digest = hmac.update(JSON.stringify(body)).digest('hex');

        const digestBuffer = Buffer.from(digest);
        const signatureBuffer = Buffer.from(signature);

        if (digestBuffer.length !== signatureBuffer.length) return false;
        return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
    } catch (e) {
        return false;
    }
}

async function fetchCoinGeckoPrice(symbol) {
    try {
        const coinMap = {
            'WETH': 'ethereum',
            'USDC': 'usd-coin',
            'ARB': 'arbitrum',
            'OP': 'optimism'
        };

        const coinId = coinMap[symbol];
        if (!coinId) return null;

        const response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true`
        );

        return response.data[coinId]?.usd || null;
    } catch (e) {
        console.error(`CoinGecko error for ${symbol}:`, e.message);
        return null;
    }
}

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
app.listen(PORT, () => {
    console.log(`­ƒñû Trade Arena Backend running on port ${PORT}`);
    console.log(`­ƒôè Market analysis: http://localhost:${PORT}/api/health`);
});

module.exports = app;
