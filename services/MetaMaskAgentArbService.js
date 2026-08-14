/**
 * MetaMask Agent Arbitrage Service for Trade-Arena
 * Implements core MetaMask Agent CLI operations with mutex locking,
 * Prometheus metrics, Discord notifications, and MEV-protected arbitrage execution on Base Mainnet.
 */

const { Mutex } = require('async-mutex');
const { exec } = require('child_process');
const { promisify } = require('util');
const { ethers } = require('ethers');
const axios = require('axios');
const prometheus = require('prom-client');

const execAsync = promisify(exec);

// Prometheus Metrics Exporter
const register = new prometheus.Registry();
prometheus.collectDefaultMetrics({ register });

const arbTradesTotal = new prometheus.Counter({
    name: 'mm_arb_trades_total',
    help: 'Total executed MetaMask agent arbitrage trades',
    labelNames: ['status', 'dex'],
    registers: [register]
});

const arbProfitUsdTotal = new prometheus.Counter({
    name: 'mm_arb_profit_usd_total',
    help: 'Cumulative net profit in USD from arbitrage trades',
    registers: [register]
});

const arbLastGasGwei = new prometheus.Gauge({
    name: 'mm_arb_last_gas_price_gwei',
    help: 'Gas price of the last executed arbitrage trade',
    registers: [register]
});

class MetaMaskAgentArbService {
    constructor() {
        this.mmLock = new Mutex();
        this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
        this.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || '';
        this.profitThresholdUsd = parseFloat(process.env.ARB_PROFIT_THRESHOLD_USD || '2.00');
        this.slippage = parseFloat(process.env.ARB_SLIPPAGE || '0.1'); // 0.1% default for MEV protection
        this.isRunning = false;
        this.intervalId = null;
        this.pollIntervalMs = parseInt(process.env.ARB_POLL_INTERVAL_MS || '10000');
    }

    /**
     * Executes a MetaMask Agent CLI command safely using mutex locking.
     */
    async executeCli(command, timeout = 30000) {
        const release = await this.mmLock.acquire();
        try {
            const { stdout, stderr } = await execAsync(`mm ${command}`, { timeout });
            if (stderr && stderr.includes('Error')) {
                throw new Error(`MetaMask CLI Error: ${stderr.trim()}`);
            }
            return stdout.trim();
        } finally {
            release();
        }
    }

    /**
     * Fetches wallet balance directly via RPC to avoid CLI polling overhead.
     */
    async getRpcBalance(walletAddress) {
        try {
            const balanceWei = await this.provider.getBalance(walletAddress);
            return ethers.formatEther(balanceWei);
        } catch (error) {
            console.error('[MetaMaskAgentArb] RPC Balance query failed:', error.message);
            return null;
        }
    }

    /**
     * Simulates or executes an arbitrage trade via MetaMask Agent CLI.
     */
    async simulateOrExecuteSwap(tokenIn, tokenOut, amount, dex = 'aerodrome', execute = false) {
        let cmd = `swap quote --in ${tokenIn} --out ${tokenOut} --amount ${amount} --slippage ${this.slippage} --dex ${dex} --network base --format json`;
        if (execute) {
            cmd += ` --yes`;
        }

        try {
            const output = await this.executeCli(cmd);
            // Parse JSON response from CLI
            const result = JSON.parse(output);
            return result;
        } catch (error) {
            console.error(`[MetaMaskAgentArb] Swap quote/execution failed (${execute ? 'EXEC' : 'SIM'}):`, error.message);
            return null;
        }
    }

    /**
     * Sends formatted rich webhook alert to Discord.
     */
    async sendDiscordAlert(title, quote, receipt, success = true) {
        if (!this.discordWebhookUrl) return;

        try {
            const embed = {
                title: success ? `🚀 Arbitrage Executed: ${title}` : `⚠️ Arbitrage Alert: ${title}`,
                color: success ? 3066993 : 15158332, // Green or Red
                fields: [
                    { name: 'DEX', value: quote.dex || 'Aerodrome', inline: true },
                    { name: 'Net Profit', value: `$${quote.netProfit || '0.00'}`, inline: true },
                    { name: 'Route', value: `${quote.inAmount || '1.0'} ${quote.in || 'WETH'} ➔ ${quote.outAmount || '0'} ${quote.out || 'USDC'}` }
                ],
                timestamp: new Date().toISOString()
            };

            if (receipt && receipt.txHash) {
                embed.fields.push({ name: 'BaseScan', value: `[View Transaction](https://basescan.org/tx/${receipt.txHash})` });
            }

            await axios.post(this.discordWebhookUrl, { embeds: [embed] });
        } catch (err) {
            console.error('[MetaMaskAgentArb] Failed to send Discord notification:', err.message);
        }
    }

    /**
     * Starts the autonomous arbitrage scanning loop.
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('[MetaMaskAgentArb] 🤖 Autonomous Arbitrage Worker started with MetaMask Agent CLI & Mutex locking.');

        this.intervalId = setInterval(async () => {
            if (process.env.TRADING_PAUSED === 'true') {
                return;
            }

            // 1. Simulate trade
            const quote = await this.simulateOrExecuteSwap('WETH', 'USDC', '1.0', 'aerodrome', false);
            if (!quote || !quote.netProfit) return;

            const netProfit = parseFloat(quote.netProfit);
            console.log(`[MetaMaskAgentArb] Simulated WETH/USDC arb: Net Profit = $${netProfit.toFixed(2)} (Threshold: $${this.profitThresholdUsd})`);

            // 2. Threshold Check
            if (netProfit >= this.profitThresholdUsd) {
                console.log(`🎯 Profit threshold met! Executing atomic swap with MEV protection...`);
                
                // 3. Execute Trade
                const receipt = await this.simulateOrExecuteSwap('WETH', 'USDC', '1.0', 'aerodrome', true);
                if (receipt && receipt.txHash) {
                    console.log(`✅ Trade successfully settled! TxHash: ${receipt.txHash}`);
                    
                    // Update Prometheus metrics
                    arbTradesTotal.inc({ status: 'success', dex: 'aerodrome' });
                    arbProfitUsdTotal.inc(netProfit);
                    if (receipt.gasPriceGwei) {
                        arbLastGasGwei.set(parseFloat(receipt.gasPriceGwei));
                    }

                    // Send Discord alert
                    await this.sendDiscordAlert('Base Mainnet Arbitrage Success', quote, receipt, true);
                } else {
                    arbTradesTotal.inc({ status: 'failed', dex: 'aerodrome' });
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
        console.log('[MetaMaskAgentArb] 🛑 Worker stopped.');
    }

    getMetricsRegistry() {
        return register;
    }
}

module.exports = new MetaMaskAgentArbService();
