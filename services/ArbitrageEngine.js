/**
 * ARBITRAGE ENGINE (Backend)
 * Trade Arena • Autonomous cross-token arbitrage on Base Mainnet using MetaMask Agent Wallet
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { ethers } = require('ethers');
const tokenManager = require('./TokenManager');
const flashloanService = require('./flashloanExecutionService');

const mmPath = process.env.MM_PATH || 'mm';

class ArbitrageEngine {
    constructor() {
        this.isRunning = false;
        this.scanInterval = 15000; // 15 seconds
        this.minProfitUsd = 0.50; // Minimum profit to trigger trade
        this.tradeSizeUsd = 10;   // Default trade size in USDC
    }

    async runMM(cmd) {
        try {
            const fullCmd = `${mmPath} ${cmd} --json`;

            const { stdout } = await execPromise(fullCmd, { 
                env: { ...process.env },
                timeout: 15000 // 15s timeout
            });
            return JSON.parse(stdout);
        } catch (e) {
            try {
                return JSON.parse(e.stdout);
            } catch (parseErr) {
                console.error(`[ArbitrageEngine] mm ${cmd} failed:`, e.message);
                return null;
            }
        }
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('[ArbitrageEngine] Starting autonomous arbitrage scanner...');
        this.scanLoop();
    }

    stop() {
        this.isRunning = false;
    }

    async scanLoop() {
        while (this.isRunning) {
            try {
                if (this.isAgentReady) {
                    console.log('[ArbitrageEngine] Starting scan cycle...');
                    await this.findOpportunities();
                    console.log('[ArbitrageEngine] Scan cycle complete.');
                } else {
                    console.log('[ArbitrageEngine] Waiting for agent session to initialize...');
                }
            } catch (e) {
                console.error('[ArbitrageEngine] Scan error:', e.message);
            }
            await new Promise(r => setTimeout(r, this.scanInterval));
        }
    }

    async findOpportunities() {
        console.log('[ArbitrageEngine] Scanning for opportunities on Base...');
        
        // 1. Get prices for whitelisted tokens
        const assetIds = Object.values(tokenManager.whitelist)
            .map(t => `eip155:8453/erc20:${t.address.toLowerCase()}`)
            .concat(['eip155:8453/slip44:60']) // Add ETH
            .join(',');

        const priceResult = await this.runMM(`price spot --asset-ids "${assetIds}"`);
        if (!priceResult || !priceResult.ok) return;

        // 2. Simple Arbitrage Logic: Check if swapping A -> B -> A results in profit
        const tokens = ['ETH', 'USDC', 'cbBTC', 'SOL'];
        
        for (const tokenA of tokens) {
            for (const tokenB of tokens) {
                if (tokenA === tokenB) continue;

                // Check A -> B
                const quote = await this.runMM(`swap quote --from ${tokenA} --to ${tokenB} --amount 0.001 --from-chain-id 8453`);
                if (quote && quote.ok) {
                    const priceImpact = parseFloat(quote.data.quote.priceData.priceImpact);
                    const profitUsd = parseFloat(quote.data.quote.priceData.totalToAmountUsd) - parseFloat(quote.data.quote.priceData.totalFromAmountUsd);
                    
                    if (profitUsd > this.minProfitUsd && priceImpact > -1) {
                        console.log(`[ArbitrageEngine] FOUND OPPORTUNITY: ${tokenA} -> ${tokenB} | Profit: $${profitUsd.toFixed(2)}`);
                        
                        // Construct opportunity object for flashloan service
                        const opportunity = {
                            chainId: 8453,
                            assetIn: tokenManager.resolveToken(tokenA)?.address,
                            assetOut: tokenManager.resolveToken(tokenB)?.address,
                            flashAmount: ethers.parseUnits('0.01', tokenManager.resolveToken(tokenA)?.decimals || 18).toString(),
                            dexRoute: [tokenManager.resolveToken(tokenA)?.address, tokenManager.resolveToken(tokenB)?.address],
                            expectedProfitUsd: profitUsd,
                            estimatedGasUsd: 1.5, // Estimated gas for Base
                        };

                        const auditLog = (event, data) => {
                            console.log(`[Audit] ${event}:`, JSON.stringify(data));
                        };

                        try {
                            const result = await flashloanService.tryExecuteArbitrage(opportunity, { auditLog });
                            if (result.executed) {
                                console.log(`[ArbitrageEngine] Flashloan executed: ${result.result.data.transaction.hash}`);
                            }
                        } catch (err) {
                            console.error(`[ArbitrageEngine] Flashloan execution failed: ${err.message}`);
                        }
                    }
                }
            }
        }
    }

    async executeArbitrage(from, to, amount) {
        console.log(`[ArbitrageEngine] EXECUTING ARBITRAGE: ${from} -> ${to} (${amount})`);
        const result = await this.runMM(`swap quote --from ${from} --to ${to} --amount ${amount} --from-chain-id 8453 --yes`);
        if (result && result.ok) {
            console.log(`[ArbitrageEngine] SUCCESS: Tx Hash ${result.data.transaction.hash}`);
        } else {
            console.error('[ArbitrageEngine] EXECUTION FAILED');
        }
    }
}

module.exports = new ArbitrageEngine();
