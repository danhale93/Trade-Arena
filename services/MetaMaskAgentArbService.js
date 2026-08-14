/**
 * Multi-Chain MetaMask Agent Arbitrage Service for Trade-Arena
 * Supports Base, Arbitrum, and Optimism with mutex locking,
 * network-labeled Prometheus metrics, Discord alerts, and MEV-protected arbitrage execution.
 */

const { Mutex } = require('async-mutex');
const { exec } = require('child_process');
const { promisify } = require('util');
const { ethers } = require('ethers');
const axios = require('axios');
const prometheus = require('prom-client');
const fs = require('fs');
const path = require('path');
const { PerformanceObserver } = require('perf_hooks');

const execAsync = promisify(exec);

// Prometheus Metrics Exporter
const register = new prometheus.Registry();
prometheus.collectDefaultMetrics({ register });

const arbTradesTotal = new prometheus.Counter({
    name: 'mm_arb_trades_total',
    help: 'Total executed MetaMask agent arbitrage trades across chains',
    labelNames: ['status', 'dex', 'network'],
    registers: [register]
});

const arbProfitUsdTotal = new prometheus.Counter({
    name: 'mm_arb_profit_usd_total',
    help: 'Cumulative net profit in USD from arbitrage trades',
    labelNames: ['network'],
    registers: [register]
});

const arbLastGasGwei = new prometheus.Gauge({
    name: 'mm_arb_last_gas_price_gwei',
    help: 'Gas price of the last executed arbitrage trade',
    labelNames: ['network'],
    registers: [register]
});

// V8 & GC Metrics
const gcDuration = new prometheus.Histogram({
    name: 'mm_arb_gc_duration_seconds',
    help: 'Garbage collection duration in seconds',
    labelNames: ['kind'],
    buckets: [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1],
    registers: [register]
});

const v8HeapStats = new prometheus.Gauge({
    name: 'mm_arb_v8_heap_stats_bytes',
    help: 'V8 heap statistics in bytes',
    labelNames: ['stat'],
    registers: [register]
});

// Observe GC events via perf_hooks
const obs = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    for (const entry of entries) {
        if (entry.entryType === 'gc') {
            const kind = entry.kind === 1 ? 'minor' : 'major';
            gcDuration.observe({ kind }, entry.duration / 1000);
        }
    }
});
obs.observe({ entryTypes: ['gc'] });

// Periodically update V8 heap stats
const v8 = require('v8');
setInterval(() => {
    const stats = v8.getHeapStatistics();
    v8HeapStats.set({ stat: 'total_heap_size' }, stats.total_heap_size);
    v8HeapStats.set({ stat: 'used_heap_size' }, stats.used_heap_size);
    v8HeapStats.set({ stat: 'heap_size_limit' }, stats.heap_size_limit);
    v8HeapStats.set({ stat: 'total_available_size' }, stats.total_available_size);
    v8HeapStats.set({ stat: 'malloced_memory' }, stats.malloced_memory);
    v8HeapStats.set({ stat: 'peak_malloced_memory' }, stats.peak_malloced_memory);
}, 5000).unref();

class MetaMaskAgentArbService {
    constructor() {
        this.mmLock = new Mutex();
        
        // Multi-chain RPC providers
        this.providers = {
            base: new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
            arbitrum: new ethers.JsonRpcProvider(process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc'),
            optimism: new ethers.JsonRpcProvider(process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io')
        };

        // Supported networks and their default DEX routers for arbitrage
        this.networksConfig = {
            base: { 
                chainId: '8453', 
                tokenIn: 'WETH', 
                tokenOut: 'USDC', 
                profitThresholdUsd: parseFloat(process.env.BASE_PROFIT_THRESHOLD_USD || process.env.ARB_PROFIT_THRESHOLD_USD || '0.01'),
                slippage: parseFloat(process.env.BASE_SLIPPAGE || process.env.ARB_SLIPPAGE || '0.1')
            },
            arbitrum: { 
                chainId: '42161', 
                tokenIn: 'WETH', 
                tokenOut: 'USDC', 
                profitThresholdUsd: parseFloat(process.env.ARBITRUM_PROFIT_THRESHOLD_USD || process.env.ARB_PROFIT_THRESHOLD_USD || '0.05'),
                slippage: parseFloat(process.env.ARBITRUM_SLIPPAGE || process.env.ARB_SLIPPAGE || '0.15')
            },
            optimism: { 
                chainId: '10', 
                tokenIn: 'WETH', 
                tokenOut: 'USDC', 
                profitThresholdUsd: parseFloat(process.env.OPTIMISM_PROFIT_THRESHOLD_USD || process.env.ARB_PROFIT_THRESHOLD_USD || '0.05'),
                slippage: parseFloat(process.env.OPTIMISM_SLIPPAGE || process.env.ARB_SLIPPAGE || '0.15')
            }
        };

        this.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || '';
        this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '';
        this.telegramChatId = process.env.TELEGRAM_CHAT_ID || '';
        this.walletAddress = process.env.MANAGED_WALLET_ADDRESS || null;
        this.profitThresholdUsd = parseFloat(process.env.ARB_PROFIT_THRESHOLD_USD || '2.00');
        this.slippage = parseFloat(process.env.ARB_SLIPPAGE || '0.1'); // 0.1% default for MEV protection
        this.executionEnabled = process.env.AGENT_EXECUTION_ENABLED === 'true';
        this.scannerEnabled = process.env.AGENT_SCANNER_ENABLED === 'true';
        this.isRunning = false;
        this.intervalId = null;
        this.lastScanAt = null;
        this.lastTradeAt = null;
        this.lastError = null;
        this.pollIntervalMs = parseInt(process.env.ARB_POLL_INTERVAL_MS || '10000');
        this.tradeCount = { success: 0, failed: 0 };
        this.logPath = path.join(__dirname, '../logs/trades.log');
        this.balances = { base: '0.00', arbitrum: '0.00', optimism: '0.00' };
        
        // HFT Aggregation State
        this.alertQueue = [];
        this.lastAlertSentAt = 0;
        this.aggregationWindowMs = 60000; // 1 minute aggregation for HFT
    }

    /**
     * Retries an async function with exponential backoff.
     */
    async retryWithBackoff(fn, retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (err) {
                if (i === retries - 1) throw err;
                const backoff = delay * Math.pow(2, i);
                await new Promise(r => setTimeout(r, backoff));
            }
        }
    }

    /**
     * Logs trade details locally as a fallback.
     */
    logLocal(network, title, quote, receipt) {
        const entry = {
            timestamp: new Date().toISOString(),
            network,
            title,
            quote,
            txHash: receipt?.txHash || 'N/A'
        };
        fs.appendFileSync(this.logPath, JSON.stringify(entry) + '\n');
    }

    /**
     * Executes a MetaMask Agent CLI command safely using mutex locking.
     */
    async executeCli(command, timeout = 30000) {
        const mmPath = process.env.MM_PATH || 'mm';
        const release = await this.mmLock.acquire();
        try {
            const { stdout, stderr } = await execAsync(`${mmPath} ${command}`, { timeout });
            if (stderr && stderr.includes('Error')) {
                throw new Error(`MetaMask CLI Error: ${stderr.trim()}`);
            }
            return stdout.trim();
        } finally {
            release();
        }
    }

    /**
     * Fetches wallet balance directly via RPC for a given network.
     */
    async getRpcBalance(network, walletAddress) {
        try {
            const provider = this.providers[network];
            if (!provider) throw new Error(`Unknown network: ${network}`);
            const balanceWei = await provider.getBalance(walletAddress);
            return ethers.formatEther(balanceWei);
        } catch (error) {
            console.error(`[MetaMaskAgentArb] RPC Balance query failed on ${network}:`, error.message);
            return null;
        }
    }

    /**
     * Simulates or executes an arbitrage trade via MetaMask Agent CLI on a specific network.
     */
    async simulateOrExecuteSwap(network, tokenIn, tokenOut, amount, dex, execute = false) {
        const config = this.networksConfig[network];
        let cmd = `swap quote --from ${tokenIn} --to ${tokenOut} --amount ${amount} --slippage ${config.slippage} --from-chain-id ${config.chainId} --format json`;
        if (execute) {
            cmd += ` --yes`;
        }

        try {
            const output = await this.executeCli(cmd);
            const result = JSON.parse(output);
            return result;
        } catch (error) {
            console.error(`[MetaMaskAgentArb] Swap quote/execution failed on ${network} (${execute ? 'EXEC' : 'SIM'}):`, error.message);
            return null;
        }
    }

    /**
     * Sends unified alerts to Discord and Telegram.
     */
    async sendAlerts(network, title, quote, receipt, success = true) {
        // Always log locally as the primary source of truth
        this.logLocal(network, title, quote, receipt);

        const explorerUrl = {
            base: 'https://basescan.org/tx/',
            arbitrum: 'https://arbiscan.io/tx/',
            optimism: 'https://optimistic.etherscan.io/tx/'
        }[network] || 'https://basescan.org/tx/';

        const now = Date.now();
        this.alertQueue.push({ network, title, quote, receipt, success, explorerUrl });

        // HFT Aggregation: If we are in a burst, wait to aggregate
        if (now - this.lastAlertSentAt < this.aggregationWindowMs) {
            console.log(`[MetaMaskAgentArb] High-frequency burst detected. Queuing alert (${this.alertQueue.length} pending).`);
            return;
        }

        await this.flushAlertQueue();
    }

    async flushAlertQueue() {
        if (this.alertQueue.length === 0) return;
        
        const alerts = [...this.alertQueue];
        this.alertQueue = [];
        this.lastAlertSentAt = Date.now();

        const isBulk = alerts.length > 1;
        const mainAlert = alerts[0];
        
        // 1. Discord Webhook
        if (this.discordWebhookUrl) {
            try {
                let payload;
                if (!isBulk) {
                    payload = {
                        embeds: [{
                            title: mainAlert.success ? `🚀 [${mainAlert.network.toUpperCase()}] Arbitrage Executed` : `⚠️ [${mainAlert.network.toUpperCase()}] Arbitrage Alert: ${mainAlert.title}`,
                            color: mainAlert.success ? 3066993 : 15158332,
                            fields: [
                                { name: 'Network', value: mainAlert.network.toUpperCase(), inline: true },
                                { name: 'DEX', value: mainAlert.quote.dex || 'Unknown', inline: true },
                                { name: 'Net Profit', value: `$${mainAlert.quote.netProfit || '0.00'}`, inline: true },
                                { name: 'Route', value: `${mainAlert.quote.inAmount || '1.0'} ${mainAlert.quote.in || 'WETH'} ➔ ${mainAlert.quote.outAmount || '0'} ${mainAlert.quote.out || 'USDC'}` }
                            ],
                            timestamp: new Date().toISOString()
                        }]
                    };
                    if (mainAlert.receipt && mainAlert.receipt.txHash) {
                        payload.embeds[0].fields.push({ name: 'Explorer', value: `[View Transaction](${mainAlert.explorerUrl}${mainAlert.receipt.txHash})` });
                    }
                } else {
                    const totalProfit = alerts.reduce((sum, a) => sum + parseFloat(a.quote.netProfit || 0), 0);
                    payload = {
                        embeds: [{
                            title: `📦 Bulk Arbitrage Report (${alerts.length} trades)`,
                            color: 3447003,
                            description: `Processed ${alerts.length} opportunities in the last minute.`,
                            fields: [
                                { name: 'Total Net Profit', value: `$${totalProfit.toFixed(2)}`, inline: true },
                                { name: 'Success/Failed', value: `${alerts.filter(a => a.success).length}/${alerts.filter(a => !a.success).length}`, inline: true }
                            ],
                            timestamp: new Date().toISOString()
                        }]
                    };
                }

                await this.retryWithBackoff(() => axios.post(this.discordWebhookUrl, payload));
            } catch (err) {
                console.error('[MetaMaskAgentArb] Discord Alert Failed after retries:', err.message);
            }
        }

        // 2. Telegram Bot
        if (this.telegramBotToken && this.telegramChatId) {
            try {
                let message;
                if (!isBulk) {
                    const statusEmoji = mainAlert.success ? '🚀' : '⚠️';
                    message = `${statusEmoji} *[${mainAlert.network.toUpperCase()}] Arbitrage ${mainAlert.success ? 'Executed' : 'Alert'}*\n\n`;
                    message += `*DEX:* ${mainAlert.quote.dex || 'Unknown'}\n`;
                    message += `*Net Profit:* $${mainAlert.quote.netProfit || '0.00'}\n`;
                    message += `*Route:* ${mainAlert.quote.inAmount || '1.0'} ${mainAlert.quote.in || 'WETH'} ➔ ${mainAlert.quote.outAmount || '0'} ${mainAlert.quote.out || 'USDC'}\n`;
                    if (mainAlert.receipt && mainAlert.receipt.txHash) {
                        message += `\n[View on Explorer](${mainAlert.explorerUrl}${mainAlert.receipt.txHash})`;
                    }
                } else {
                    const totalProfit = alerts.reduce((sum, a) => sum + parseFloat(a.quote.netProfit || 0), 0);
                    message = `📦 *Bulk Arbitrage Report*\n\n`;
                    message += `*Trades:* ${alerts.length}\n`;
                    message += `*Total Profit:* $${totalProfit.toFixed(2)}\n`;
                    message += `*Success Rate:* ${((alerts.filter(a => a.success).length / alerts.length) * 100).toFixed(0)}%`;
                }

                const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
                await this.retryWithBackoff(() => axios.post(url, {
                    chat_id: this.telegramChatId,
                    text: message,
                    parse_mode: 'Markdown'
                }));
            } catch (err) {
                console.error('[MetaMaskAgentArb] Telegram Alert Failed after retries:', err.message);
            }
        }
    }

    /**
     * Starts the multi-chain autonomous arbitrage scanning loop.
     */
    start() {
        if (this.isRunning) return;
        if (!this.scannerEnabled) {
            console.log('[MetaMaskAgentArb] ⏸️ Scanner is disabled by default. Set AGENT_SCANNER_ENABLED=true to enable quote polling.');
            return;
        }
        this.isRunning = true;
        console.log(`[MetaMaskAgentArb] 🤖 Multi-Chain worker started in ${this.executionEnabled ? 'EXECUTION' : 'SIMULATION-ONLY'} mode across Base, Arbitrum, and Optimism.`);

        this.intervalId = setInterval(async () => {
            if (process.env.TRADING_PAUSED === 'true') {
                return;
            }

            // Update wallet balances across chains
            await this.updateBalances();

            // Iterate over all configured networks
            for (const [network, config] of Object.entries(this.networksConfig)) {
                try {
                    this.lastScanAt = new Date().toISOString();
                    // 1. Simulate trade on current network
                    const quote = await this.simulateOrExecuteSwap(network, config.tokenIn, config.tokenOut, '1.0', config.dex, false);
                    if (!quote || !quote.netProfit) continue;

                    const netProfit = parseFloat(quote.netProfit);
                    const threshold = config.profitThresholdUsd;
                    console.log(`[MetaMaskAgentArb] [${network.toUpperCase()}] Simulated ${config.tokenIn}/${config.tokenOut}: Net Profit = $${netProfit.toFixed(2)} (Threshold: $${threshold})`);

                    // 2. Threshold Check
                    if (netProfit >= threshold) {
                        console.log(`🎯 [${network.toUpperCase()}] Profit threshold met! Executing atomic swap with MEV protection...`);
                        
                        // 3. Execute Trade only when explicitly enabled. Otherwise record a dry-run decision.
                        if (!this.executionEnabled) {
                            console.log(`[MetaMaskAgentArb] [${network.toUpperCase()}] Simulation-only mode: execution skipped.`);
                            await this.sendAlerts(network, 'Arbitrage Opportunity (Simulation Only)', quote, null, true);
                            continue;
                        }
                        const receipt = await this.simulateOrExecuteSwap(network, config.tokenIn, config.tokenOut, '1.0', config.dex, true);
                        if (receipt && receipt.txHash) {
                            console.log(`✅ [${network.toUpperCase()}] Trade successfully settled! TxHash: ${receipt.txHash}`);
                            this.lastTradeAt = new Date().toISOString();
                            this.tradeCount.success += 1;
                            
                            // Update Prometheus metrics with network label
                            arbTradesTotal.inc({ status: 'success', dex: config.dex, network });
                            arbProfitUsdTotal.inc({ network }, netProfit);
                            if (receipt.gasPriceGwei) {
                                arbLastGasGwei.set({ network }, parseFloat(receipt.gasPriceGwei));
                            }

                            // Send Unified Alerts
                            await this.sendAlerts(network, 'Multi-Chain Arbitrage Success', quote, receipt, true);
                        } else {
                            this.tradeCount.failed += 1;
                            this.lastError = `Trade execution failed on ${network}`;
                            arbTradesTotal.inc({ status: 'failed', dex: config.dex, network });
                        }
                    }
                } catch (netErr) {
                    this.lastError = netErr.message;
                    console.error(`[MetaMaskAgentArb] Error scanning network ${network}:`, netErr.message);
                }
            }
        }, this.pollIntervalMs).unref();
    }

    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('[MetaMaskAgentArb] 🛑 Multi-chain worker stopped.');
    }

    pause() {
        this.stop();
        this.scannerEnabled = false;
    }

    resume() {
        this.scannerEnabled = true;
        this.start();
    }

    async updateBalances() {
        if (!this.walletAddress) return;
        for (const network of Object.keys(this.providers)) {
            const bal = await this.getRpcBalance(network, this.walletAddress);
            if (bal !== null) {
                this.balances[network] = parseFloat(bal).toFixed(4);
            }
        }
    }

    getStatus() {
        return {
            walletMode: 'managed-agent',
            walletAddress: this.walletAddress,
            balances: this.balances,
            executionEnabled: this.executionEnabled,
            scannerEnabled: this.scannerEnabled,
            running: this.isRunning,
            networks: Object.keys(this.networksConfig),
            networkConfigs: this.networksConfig,
            profitThresholdUsd: this.profitThresholdUsd,
            slippagePercent: this.slippage,
            pollIntervalMs: this.pollIntervalMs,
            lastScanAt: this.lastScanAt,
            lastTradeAt: this.lastTradeAt,
            lastError: this.lastError,
            tradeCount: { ...this.tradeCount }
        };
    }

    getMetricsRegistry() {
        return register;
    }
}

module.exports = new MetaMaskAgentArbService();
