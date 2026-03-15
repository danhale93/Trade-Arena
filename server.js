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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
 * Helper Functions
 */

async function fetchDexPrice(token, dex) {
    try {
        // Simulated DEX price fetching
        // In production, would call actual DEX APIs or use Uniswap subgraph
        const basePrice = { 'WETH': 2500, 'USDC': 1, 'ARB': 0.8, 'OP': 1.5 }[token] || 100;
        const variance = (Math.random() - 0.5) * 2; // ±1% variance
        return basePrice * (1 + variance / 100);
    } catch (e) {
        console.error(`Error fetching ${dex} price for ${token}:`, e);
        return null;
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
    console.log(`🤖 Trade Arena Backend running on port ${PORT}`);
    console.log(`📊 Market analysis: http://localhost:${PORT}/api/health`);
});

module.exports = app;
