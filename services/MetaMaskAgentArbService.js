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
            base: { dex: 'aerodrome', tokenIn: 'WETH', tokenOut: 'USDC' },
            arbitrum: { dex: 'uniswap_v3', tokenIn: 'WETH', tokenOut: 'USDC' },
            optimism: { dex: 'velodrome', tokenIn: 'WETH', tokenOut: 'USDC' }
        };

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
        let cmd = `swap quote --in ${tokenIn} --out ${tokenOut} --amount ${amount} --slippage ${this.slippage} --dex ${dex} --network ${network} --format json`;
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
     * Sends formatted rich webhook alert to Discord with network details.
     */
    async sendDiscordAlert(network, title, quote, receipt, success = true) {
        if (!this.discordWebhookUrl) return;

        try {
            const embed = {
                title: success ? `🚀 [${network.toUpperCase()}] Arbitrage Executed` : `⚠️ [${network.toUpperCase()}] Arbitrage Alert: ${title}`,
                color: success ? 3066993 : 15158332, // Green or Red
                fields: [
                    { name: 'Network', value: network.toUpperCase(), inline: true },
                    { name: 'DEX', value: quote.dex || 'Unknown', inline: true },
                    { name: 'Net Profit', value: `$${quote.netProfit || '0.00'}`, inline: true },
                    { name: 'Route', value: `${quote.inAmount || '1.0'} ${quote.in || 'WETH'} ➔ ${quote.outAmount || '0'} ${quote.out || 'USDC'}` }
                ],
                timestamp: new Date().toISOString()
            };

            const explorerUrl = {
                base: 'https://basescan.org/tx/',
                arbitrum: 'https://arbiscan.io/tx/',
                optimism: 'https://optimistic.etherscan.io/tx/'
            }[network] || 'https://basescan.org/tx/';

            if (receipt && receipt.txHash) {
                embed.fields.push({ name: 'Explorer', value: `[View Transaction](${explorerUrl}${receipt.txHash})` });
            }

            await axios.post(this.discordWebhookUrl, { embeds: [embed] });
        } catch (err) {
            console.error('[MetaMaskAgentArb] Failed to send Discord notification:', err.message);
        }
    }

    /**
     * Starts the multi-chain autonomous arbitrage scanning loop.
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('[MetaMaskAgentArb] 🤖 Multi-Chain Autonomous Arbitrage Worker started across Base, Arbitrum, and Optimism.');

        this.intervalId = setInterval(async () => {
            if (process.env.TRADING_PAUSED === 'true') {
                return;
            }

            // Iterate over all configured networks
            for (const [network, config] of Object.entries(this.networksConfig)) {
                try {
                    // 1. Simulate trade on current network
                    const quote = await this.simulateOrExecuteSwap(network, config.tokenIn, config.tokenOut, '1.0', config.dex, false);
                    if (!quote || !quote.netProfit) continue;

                    const netProfit = parseFloat(quote.netProfit);
                    console.log(`[MetaMaskAgentArb] [${network.toUpperCase()}] Simulated ${config.tokenIn}/${config.tokenOut}: Net Profit = $${netProfit.toFixed(2)} (Threshold: $${this.profitThresholdUsd})`);

                    // 2. Threshold Check
                    if (netProfit >= this.profitThresholdUsd) {
                        console.log(`🎯 [${network.toUpperCase()}] Profit threshold met! Executing atomic swap with MEV protection...`);
                        
                        // 3. Execute Trade
                        const receipt = await this.simulateOrExecuteSwap(network, config.tokenIn, config.tokenOut, '1.0', config.dex, true);
                        if (receipt && receipt.txHash) {
                            console.log(`✅ [${network.toUpperCase()}] Trade successfully settled! TxHash: ${receipt.txHash}`);
                            
                            // Update Prometheus metrics with network label
                            arbTradesTotal.inc({ status: 'success', dex: config.dex, network });
                            arbProfitUsdTotal.inc({ network }, netProfit);
                            if (receipt.gasPriceGwei) {
                                arbLastGasGwei.set({ network }, parseFloat(receipt.gasPriceGwei));
                            }

                            // Send Discord alert
                            await this.sendDiscordAlert(network, 'Multi-Chain Arbitrage Success', quote, receipt, true);
                        } else {
                            arbTradesTotal.inc({ status: 'failed', dex: config.dex, network });
                        }
                    }
                } catch (netErr) {
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

    getMetricsRegistry() {
        return register;
    }
}

module.exports = new MetaMaskAgentArbService();
