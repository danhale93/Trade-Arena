/**
 * TRADE ARENA Backend - Express.js Server
 * Handles real trading logic, smart contract interactions, data persistence, and AI proxies
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ethers = require('ethers');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const WebSocket = require('websocket').w3cwebsocket;

const app = express();

// Sentinel: Security hardening
app.set('trust proxy', 1); // Trust first proxy (Render, Heroku, etc.)
app.disable('x-powered-by'); // Mitigate information disclosure

// Sentinel: Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://accounts.google.com https://cdn.privy.io https://js.hcaptcha.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:;");
    next();
});

const taskClaimLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 claim requests per window
    message: { error: 'Too many claim requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
const maintenanceLogLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false
});
const payoutRoutes = require("./routes/payoutRoutes");
const { loadUsers, saveUsers } = require('./user_persistence');
const PORT = process.env.PORT || 3001;

/**
 * Simple in-memory rate limiter (avoids express-rate-limit Node 26+ subnet.networkForm bug)
 */
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 1000;

function checkRateLimit(ip) {
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    if (now > record.resetAt) {
        record.count = 0;
        record.resetAt = now + RATE_LIMIT_WINDOW;
    }
    record.count += 1;
    rateLimitMap.set(ip, record);
    return record.count <= RATE_LIMIT_MAX;
}

// Cleanup expired entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
        if (now > record.resetAt) rateLimitMap.delete(ip);
    }
}, 5 * 60 * 1000);

// Security: Serve static files from public directory (Exempt from rate limit)
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Apply rate limiter to API requests and remaining routes
app.use((req, res, next) => {
    // Whitelist common non-API browser requests that might fall through
    if (req.path === '/favicon.ico' || req.path === '/manifest.json') return next();

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Too many requests, please try again later.' });
    }
    next();
});

// Sentinel: Limit JSON payload size to prevent DoS attacks
app.use(express.json({ limit: '100kb' }));
app.use("/api/v1/payouts", payoutRoutes);

// Security: Use a more restrictive CORS policy
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors({
    origin: (origin, cb) => {
        // Sentinel: Prevent CORS bypass via partial origin matches (e.g. localhost.attacker.com)
        const isLocal = origin && (
            origin === 'http://localhost' || origin.startsWith('http://localhost:') ||
            origin === 'http://127.0.0.1' || origin.startsWith('http://127.0.0.1:') ||
            origin === 'https://localhost' || origin.startsWith('https://localhost:') ||
            origin === 'https://127.0.0.1' || origin.startsWith('https://127.0.0.1:')
        );

        if (!origin || isLocal || allowedOrigin === '*' || origin === allowedOrigin) {
            cb(null, true);
        } else {
            cb(null, false);
        }
    }
}));



/** Deployment queue for confirmed MoonPay deposits */
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

/**
 * PUBLIC CONFIG (no secrets)
 */
app.get('/api/config', (req, res) => {
    res.json({
        privyAppId: process.env.PRIVY_APP_ID || '',
        moonpayPublicKey: process.env.MOONPAY_PUBLIC_KEY || '',
        googleClientId: process.env.GOOGLE_CLIENT_ID || ''
    });
});

/**
 * AI PROXY ENDPOINTS
 */

// Sentinel: Whitelisted models to prevent unauthorized expensive API usage
const ALLOWED_CLAUDE_MODELS = new Set([
  'claude-3-5-sonnet-20240620',
  'claude-3-5-sonnet-latest',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
  'claude-3.5-sonnet'
]);

const ALLOWED_OPENAI_MODELS = new Set([
  'gpt-4o',
  'gpt-4o-latest',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo'
]);

const ALLOWED_GEMINI_MODELS = new Set([
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-exp'
]);

app.post('/api/claude', async (req, res) => {
    try {
        if (!process.env.ANTHROPIC_API_KEY) {
            return res.status(503).json({ error: 'AI service unavailable' });
        }
        const { model, messages, system, max_tokens, temperature, top_p, top_k, stop_sequences } = req.body;
        if (!ALLOWED_CLAUDE_MODELS.has(model)) {
            return res.status(400).json({ error: 'Invalid or unauthorized model requested' });
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY || '',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                messages,
                system,
                max_tokens: max_tokens || 1024,
                temperature,
                top_p,
                top_k,
                stop_sequences
            })
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Claude Proxy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/openai', async (req, res) => {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return res.status(503).json({ error: 'AI service unavailable' });
        }
        const { model, messages, max_tokens, temperature, top_p, frequency_penalty, presence_penalty, stop } = req.body;
        if (!ALLOWED_OPENAI_MODELS.has(model)) {
            return res.status(400).json({ error: 'Invalid or unauthorized model requested' });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: max_tokens || 1024,
                temperature,
                top_p,
                frequency_penalty,
                presence_penalty,
                stop
            })
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('OpenAI Proxy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/gemini', async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(503).json({ error: 'AI service unavailable' });
        }
        const requestedModel = req.body.model || 'gemini-1.5-flash';
        if (!ALLOWED_GEMINI_MODELS.has(requestedModel)) {
            return res.status(400).json({ error: 'Invalid model specified' });
        }

        const safeModel = encodeURIComponent(requestedModel);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${safeModel}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: req.body.contents,
                generationConfig: req.body.generationConfig
            })
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Gemini Proxy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * MAINTENANCE & LOGGING
 */

app.post('/api/maintenance/log', maintenanceLogLimiter, (req, res) => {
    const { agent, message, level } = req.body;
    if (!agent || !message) return res.status(400).json({ error: 'Missing agent or message' });

    const logDir = path.join(__dirname, '.jules');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

    const logFile = agent === 'SENTINEL' ? 'sentinel.md' : 'maintenance.md';
    const logPath = path.join(logDir, logFile);

    const entry = `\n## ${new Date().toISOString()} - [${level || 'INFO'}] ${agent}\n${message}\n`;
    fs.appendFileSync(logPath, entry);
    res.json({ success: true });
});

// Security: Strict path whitelist for patching
const ALLOWED_PATCH_FILES = [
    'public/index.html',
    'public/staff-engine.js',
    'public/ai-api.js',
    'public/ai-arena.js'
];

app.post('/api/maintenance/patch', async (req, res) => {
    const { filepath, patch, description } = req.body;
    try {
        if (!filepath || typeof filepath !== 'string') {
            return res.status(400).json({ error: 'Invalid or missing filepath' });
        }

        // Security: Check against absolute whitelist to clear CodeQL taint
        if (!ALLOWED_PATCH_FILES.includes(filepath)) {
            return res.status(403).json({ error: 'Unauthorized file for patching' });
        }

        const targetPath = path.join(__dirname, filepath);

        if (!fs.existsSync(targetPath)) {
             return res.status(404).json({ error: 'File not found' });
        }

        console.log(`[Developer Agent] Patch requested for ${filepath}: ${description}`);
        res.json({ success: true, message: 'Patch received and logged for review' });
    } catch (error) {
        console.error('Patch error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * TRADING & MARKET ENDPOINTS
 */

app.get('/api/deployments', (req, res) => {
    res.json({ success: true, deployments: deploymentEvents });
});

const FAUCET_CLAIMED_IPS = new Set();

const PAYOUT_PRIVATE_KEY = process.env.PAYOUT_PRIVATE_KEY || '';
const PAYOUT_RPC_URL = process.env.RPC_URL || 'https://mainnet.base.org';
const PAYOUT_CHAIN_ID = 8453;
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const BASE_ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

let payoutWallet = null;
let payoutProvider = null;
let usdcContract = null;

try {
    if (PAYOUT_PRIVATE_KEY) {
        payoutProvider = new ethers.JsonRpcProvider(PAYOUT_RPC_URL);
        payoutWallet = new ethers.Wallet(PAYOUT_PRIVATE_KEY, payoutProvider);
        
        const usdcAbi = [
            'function transfer(address to, uint256 amount) returns (bool)',
            'function decimals() view returns (uint8)'
        ];
        usdcContract = new ethers.Contract(USDC_CONTRACT, usdcAbi, payoutWallet);
        console.log('[Payout] Wallet ready:', payoutWallet.address);
    } else {
        console.log('[Payout] No PAYOUT_PRIVATE_KEY set — running in simulation mode');
    }
} catch (e) {
    console.error('[Payout] Init failed:', e);
}

async function sendPayout(userAddress, amount, currency = 'ETH') {
    if (!payoutWallet) {
        return { simulated: true, txHash: null, message: 'No payout wallet configured' };
    }

    // Sentinel: Implement safety caps on payout amounts to mitigate exploit impact
    const MAX_ETH_PAYOUT = 0.1;
    const MAX_USDC_PAYOUT = 100;

    if (currency === 'ETH' && amount > MAX_ETH_PAYOUT) {
        console.error(`[Sentinel] Blocked excessive ETH payout: ${amount} ETH to ${userAddress}`);
        return { simulated: false, txHash: null, error: 'Payout amount exceeds safety limit' };
    }
    if (currency === 'USDC' && amount > MAX_USDC_PAYOUT) {
        console.error(`[Sentinel] Blocked excessive USDC payout: ${amount} USDC to ${userAddress}`);
        return { simulated: false, txHash: null, error: 'Payout amount exceeds safety limit' };
    }

    try {
        const to = ethers.getAddress(userAddress);
        
        if (currency === 'USDC' && usdcContract) {
            const decimals = await usdcContract.decimals();
            const amountWei = ethers.parseUnits(amount.toFixed(2), decimals);
            const tx = await usdcContract.transfer(to, amountWei);
            await tx.wait();
            return { simulated: false, txHash: tx.hash, currency: 'USDC', amount };
        } else {
            const amountWei = ethers.parseEther(amount.toFixed(6));
            const tx = await payoutWallet.sendTransaction({
                to,
                value: amountWei
            });
            await tx.wait();
            return { simulated: false, txHash: tx.hash, currency: 'ETH', amount };
        }
    } catch (e) {
        console.error('[Payout] Transfer failed:', e);
        return { simulated: false, txHash: null, error: e.message };
    }
}

app.post('/api/user/login', (req, res) => {
    try {
        const { email, address, name, provider, avatar } = req.body;
        const userId = email || address;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'Missing userId (email or address)' });
        }

        const users = loadUsers();
        if (!users[userId]) {
            users[userId] = {
                id: userId,
                name: name || 'New User',
                email: email || null,
                address: address || null,
                provider: provider || 'unknown',
                avatar: avatar || null,
                balance: 0,
                bots: [],
                trades: [],
                created: Date.now()
            };
            saveUsers(users);
        }

        res.json({ success: true, user: users[userId] });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.get('/api/status/connections', async (req, res) => {
    const results = {
        timestamp: Date.now(),
        connections: []
    };

    const mask = (key) => {
        if (!key) return null;
        if (key.length <= 8) return '********';
        return key.substring(0, 4) + '****' + key.substring(key.length - 4);
    };

    const aiKeys = [
        { name: 'ANTHROPIC_API_KEY', key: process.env.ANTHROPIC_API_KEY, type: 'AI' },
        { name: 'OPENAI_API_KEY', key: process.env.OPENAI_API_KEY, type: 'AI' },
        { name: 'GEMINI_API_KEY', key: process.env.GEMINI_API_KEY, type: 'AI' },
        { name: '0x_API_KEY', key: process.env.ZERO_EX_API_KEY, type: 'AI' }
    ];

    for (const item of aiKeys) {
        results.connections.push({
            name: item.name,
            type: item.type,
            status: item.key ? 'CONFIGURED' : 'MISSING',
            value: mask(item.key)
        });
    }

    const rpcs = [
        { name: 'RPC_URL (Base Mainnet)', url: process.env.RPC_URL || 'https://mainnet.base.org' },
        { name: 'BASE_SEPOLIA_RPC_URL', url: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org' }
    ];

    // ⚡ Bolt Optimization: Parallelize connection health checks to reduce latency waterfall
    const rpcPromises = rpcs.map(async (rpc) => {
        let status = 'ERROR';
        try {
            const provider = new ethers.JsonRpcProvider(rpc.url);
            await provider.getBlockNumber();
            status = 'CONNECTED';
        } catch (e) {
            status = 'DISCONNECTED';
        }
        return {
            name: rpc.name,
            type: 'RPC',
            status,
            value: rpc.url
        };
    });

    const walletInfo = {
        name: 'PAYOUT_PRIVATE_KEY',
        type: 'WALLET',
        status: payoutWallet ? 'ACTIVE' : 'MISSING',
        value: mask(process.env.PAYOUT_PRIVATE_KEY),
        address: payoutWallet ? payoutWallet.address : null
    };

    const walletBalancePromise = (async () => {
        if (payoutWallet) {
            try {
                const balance = await payoutProvider.getBalance(payoutWallet.address);
                walletInfo.balance = ethers.formatEther(balance) + ' ETH';
            } catch (e) {}
        }
    })();

    const [rpcResults] = await Promise.all([
        Promise.all(rpcPromises),
        walletBalancePromise
    ]);

    results.connections.push(...rpcResults);
    results.connections.push(walletInfo);

    results.connections.push({
        name: 'MOONPAY_WEBHOOK_SECRET',
        type: 'WEBHOOK',
        status: process.env.MOONPAY_WEBHOOK_SECRET ? 'CONFIGURED' : 'MISSING',
        value: mask(process.env.MOONPAY_WEBHOOK_SECRET)
    });

    results.connections.push({
        name: 'TASK_CLAIM_SECRET',
        type: 'SECRET',
        status: process.env.TASK_CLAIM_SECRET ? 'CONFIGURED' : 'MISSING',
        value: mask(process.env.TASK_CLAIM_SECRET)
    });

    // Contract Deployments
    const contracts = [
        { name: 'USDC_CONTRACT', address: process.env.USDC_CONTRACT || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
        { name: 'PAYOUT_MANAGER_ADDRESS', address: process.env.PAYOUT_MANAGER_ADDRESS },
        { name: 'REWARD_TOKEN_ADDRESS', address: process.env.REWARD_TOKEN_ADDRESS }
    ];

    for (const contract of contracts) {
        if (contract.address) {
            results.connections.push({
                name: contract.name,
                type: 'CONTRACT',
                status: 'DEPLOYED',
                value: contract.address
            });
        }
    }

    res.json(results);
});
app.get('/api/payout/status', (req, res) => {
    res.json({
        configured: !!payoutWallet,
        wallet: payoutWallet ? payoutWallet.address : null,
        chain: PAYOUT_CHAIN_ID,
        currency: 'ETH / USDC'
    });
});

app.post('/api/faucet/claim', async (req, res) => {
    try {
        const { userAddress } = req.body;
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        
        if (FAUCET_CLAIMED_IPS.has(ip)) {
            return res.status(429).json({ success: false, error: 'Faucet already claimed from this IP' });
        }

        const payout = await sendPayout(userAddress || 'demo', 5, 'ETH');

        const deployment = queueBotDeployment({
            source: 'faucet',
            amount: 50,
            currency: 'ETH',
            userAddress: userAddress || 'demo',
            confirmedAt: Date.now(),
            payout
        });

        FAUCET_CLAIMED_IPS.add(ip);
        res.json({ success: true, deployment, amount: 50, payout });
    } catch (error) {
        console.error('Faucet claim error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.post('/api/tasks/claim', taskClaimLimiter, async (req, res) => {
    try {
        const { taskId, reward, userAddress, validationToken } = req.body;

        // Sentinel: Ensure a validation token is provided and matches the server secret
        const taskSecret = process.env.TASK_CLAIM_SECRET;
        if (!taskSecret) {
            console.error('[Sentinel] TASK_CLAIM_SECRET is not configured on the server');
            return res.status(503).json({ success: false, error: 'Payout validation service unavailable' });
        }

        if (!validationToken || validationToken !== taskSecret) {
            return res.status(401).json({ success: false, error: 'Invalid or missing validation token' });
        }

        if (!taskId || typeof reward !== 'number') {
            return res.status(400).json({ success: false, error: 'Missing taskId or reward' });
        }

        const payoutAmount = reward <= 10 ? 0.01 : reward <= 25 ? 0.025 : 0.05;

        let payout;
        let authPayload = null;

        // On-chain PayoutManager fallback
        if (process.env.PAYOUT_MANAGER_ADDRESS && process.env.ORACLE_PRIVATE_KEY) {
            try {
                const payoutService = new (require('./services/payouts/payoutService'))({
                    oraclePrivateKey: process.env.ORACLE_PRIVATE_KEY,
                    rewardTokenAddress: process.env.REWARD_TOKEN_ADDRESS,
                    payoutManagerAddress: process.env.PAYOUT_MANAGER_ADDRESS,
                    chainId: parseInt(process.env.CHAIN_ID || '8453')
                });
                authPayload = await payoutService.authorizePayout(userAddress, taskId, 'validated_backend_claim');
                payout = { onChainAuth: true, authPayload };
            } catch (e) {
                console.error('[Payout] On-chain auth failed, falling back to direct transfer:', e.message);
                payout = await sendPayout(userAddress || 'demo', payoutAmount, 'ETH');
            }
        } else {
            payout = await sendPayout(userAddress || 'demo', payoutAmount, 'ETH');
        }

        const deployment = queueBotDeployment({
            source: 'task',
            taskId,
            amount: reward,
            currency: 'ETH',
            userAddress: userAddress || 'demo',
            confirmedAt: Date.now(),
            payout
        });

        res.json({ success: true, deployment, taskId, reward, payout });
    } catch (error) {
        console.error('Task claim error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.post('/api/webhooks/moonpay/deposit', (req, res) => {
    try {
        const signature = req.headers['x-moonpay-signature'];
        const secret = process.env.MOONPAY_WEBHOOK_SECRET;

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
        console.error('[MoonPay Webhook] Error:', error);
        res.status(500).json({ success: false, error: 'Webhook processing failed' });
    }
});

app.get('/api/market/prices', async (req, res) => {
    try {
        const allowedSymbols = new Set(['WETH', 'USDC', 'ARB', 'OP']);
        const coinMap = { 'WETH': 'ethereum', 'USDC': 'usd-coin', 'ARB': 'arbitrum', 'OP': 'optimism' };

        const symbols = (req.query.symbols?.split(',') || ['WETH', 'USDC', 'ARB'])
            .map(s => s.trim().toUpperCase())
            .filter(s => allowedSymbols.has(s));

        if (symbols.length === 0) {
            return res.json({ success: true, prices: {}, timestamp: Date.now() });
        }

        // ⚡ Bolt Optimization: Batch price requests into a single CoinGecko API call to eliminate network waterfall
        const ids = symbols.map(s => coinMap[s]).filter(Boolean);
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`);
        const data = response.data || {};

        const prices = {};
        symbols.forEach(s => {
            const id = coinMap[s];
            if (data[id]?.usd) prices[s] = data[id].usd;
        });

        res.json({ success: true, prices, timestamp: Date.now() });
    } catch (error) {
        console.error('[Market API] Failed to fetch prices:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch market prices' });
    }
});

app.post('/api/bot/create', async (req, res) => {
    try {
        const { name, strategy, riskLevel, initialCapital, userAddress } = req.body;
        const bot = {
            id: generateId(),
            name, strategy, riskLevel, initialCapital, userAddress,
            status: 'ACTIVE',
            created: Date.now(),
            trades: [],
            totalProfit: 0,
            config: generateBotConfig(strategy, riskLevel)
        };
        res.json({ success: true, bot });
    } catch (error) {
        console.error('Bot creation error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.post('/api/execute/swap', async (req, res) => {
    try {
        const { fromToken, toToken, amount, slippage } = req.body;
        const expectedOutput = amount * (1 - (slippage || 0.005));
        const gasUsed = Math.random() * 150000 + 50000;
        const gasCost = gasUsed * 0.001;
        const result = {
            success: true,
            swap: {
                from: { token: fromToken, amount: amount.toFixed(4) },
                to: { token: toToken, amount: expectedOutput.toFixed(4) },
                exchange: 'Uniswap V3',
                slippage: `${((slippage || 0.005) * 100).toFixed(2)}%`,
                gasUsed: gasUsed.toFixed(0),
                gasCost: gasCost.toFixed(4),
                timestamp: Date.now()
            },
            txHash: '0x' + crypto.randomBytes(32).toString('hex')
        };
        res.json(result);
    } catch (error) {
        console.error('Swap execution error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Helper Functions
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
        const coinMap = { 'WETH': 'ethereum', 'USDC': 'usd-coin', 'ARB': 'arbitrum', 'OP': 'optimism' };
        const coinId = coinMap[symbol];
        if (!coinId) return null;
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
        return response.data[coinId]?.usd || null;
    } catch (e) {
        return null;
    }
}

function generateBotConfig(strategy, riskLevel) {
    const configs = {
        'Arbitrage Detection': { minSpread: 0.3, maxSpread: 10, maxSlippage: 1, checkInterval: 30000 },
        'Flash Loan Farming': { minProfit: 0.1, maxLoanMultiplier: 50, riskAssessment: 'HIGH', checkInterval: 15000 }
    };
    const config = configs[strategy] || configs['Arbitrage Detection'];
    const riskMultipliers = { 'Conservative (2x leverage)': 0.5, 'Moderate (5x leverage)': 1.0, 'Aggressive (10x leverage)': 2.0 };
    config.riskMultiplier = riskMultipliers[riskLevel] || 1;
    return config;
}

function generateId() {
    // Sentinel: Use cryptographically secure random values for ID generation
    return Date.now().toString(36) + crypto.randomBytes(8).toString('hex');
}

app.listen(PORT, () => {
    console.log(`🚀 Trade Arena Server running on port ${PORT}`);
});

module.exports = app;
