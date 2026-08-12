/**
 * AUTONOMOUS BOT WORKER (Backend)
 * Trade Arena • Evaluates bot strategies, processes signals, manages risk, and coordinates executions.
 */

const { ethers } = require('ethers');
const strategyLoader = require('../strategies/loader');
const onchainEngine = require('./OnchainExecutionEngine');
const positionManager = require('./PositionManager');
const { loadUsers, saveUsers } = require('../user_persistence');

class AutonomousWorker {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.checkIntervalMs = 15000; // Check market data every 15 seconds

        // Target token addresses on Base Mainnet
        this.WETH = '0x4200000000000000000000000000000000000006';
        this.USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

        // Deterministic Risk Limits (.env overrides available)
        this.riskLimits = {
            maxTradeUsd: parseFloat(process.env.MAX_TRADE_USD || '500'),
            maxPositionUsd: parseFloat(process.env.MAX_POSITION_USD || '1000'),
            maxDailyLossUsd: parseFloat(process.env.MAX_DAILY_LOSS_USD || '100'),
            maxSlippageBps: parseInt(process.env.MAX_SLIPPAGE_BPS || '100'), // 1%
            maxOpenPositions: parseInt(process.env.MAX_OPEN_POSITIONS || '5')
        };

        // Sliding-window daily spend tracking
        this.dailySpendUsd = 0;
        this.dailySpendResetTimestamp = Date.now() + 24 * 60 * 60 * 1000;
    }

    /**
     * Starts the autonomous worker.
     */
    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('[AutonomousWorker] 🚀 Persistent background worker started.');

        // Ensure all strategies are loaded
        await strategyLoader.loadAllStrategies();

        this.intervalId = setInterval(() => this.tick(), this.checkIntervalMs).unref();
    }

    /**
     * Stops the autonomous worker.
     */
    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('[AutonomousWorker] 🛑 Background worker stopped.');
    }

    /**
     * Resets the daily spend tracker if 24 hours have passed.
     */
    checkDailySpendReset() {
        if (Date.now() >= this.dailySpendResetTimestamp) {
            console.log('[AutonomousWorker] Resetting daily spend tracker.');
            this.dailySpendUsd = 0;
            this.dailySpendResetTimestamp = Date.now() + 24 * 60 * 60 * 1000;
        }
    }

    /**
     * Unified tick cycle for the background bot execution.
     */
    async tick() {
        try {
            this.checkDailySpendReset();

            // 1. Emergency Pause Guard
            if (process.env.TRADING_PAUSED === 'true') {
                console.log('[AutonomousWorker] ⚠️ Trading is globally paused via TRADING_PAUSED=true. Skipping cycle.');
                return;
            }

            // 2. Fetch Fresh Market Prices for analysis and monitoring
            const prices = await this.getMarketPrices();
            if (!prices || Object.keys(prices).length === 0) {
                console.warn('[AutonomousWorker] Failed to fetch market prices. Skipping cycle.');
                return;
            }

            // Update position unrealised P&Ls with fresh market prices
            positionManager.updateUnrealisedPnL(prices);

            // 3. Position Monitoring (TP/SL Exits)
            await this.monitorOpenPositions(prices);

            // 4. Bot Execution Cycles
            const users = loadUsers();
            for (const userId of Object.keys(users)) {
                const user = users[userId];
                if (!user.bots || user.bots.length === 0) continue;

                for (const bot of user.bots) {
                    if (bot.status !== 'ACTIVE') continue;

                    // Ensure bot is scheduled to evaluate
                    const now = Date.now();
                    const lastTradeTime = bot.lastTradeTime || 0;
                    const cooldown = 30000; // 15-30s cooldown between evaluations per bot
                    if (now - lastTradeTime < cooldown) continue;

                    await this.evaluateBotStrategy(user, bot, prices);
                }
            }

        } catch (error) {
            console.error('[AutonomousWorker] Error in tick cycle:', error.message);
        }
    }

    /**
     * Evaluates a strategy for a given active bot instance.
     */
    async evaluateBotStrategy(user, bot, prices) {
        try {
            console.log(`[AutonomousWorker] Evaluating Bot #${bot.id} (${bot.name}) using Strategy: ${bot.strategy}`);

            // Format market data for strategy evaluation
            const marketData = {
                prices,
                token: bot.token || 'WETH',
                timestamp: Date.now()
            };

            const strategyId = bot.strategyId || 'rsi-strategy'; // default core strategy ID
            const result = await strategyLoader.executeStrategy(strategyId, marketData, bot.config || {});

            if (result.signal === 'BUY' && result.confidence > 0.6) {
                await this.triggerTradeExecution(user, bot, 'BUY', prices);
            } else if (result.signal === 'SELL' && result.confidence > 0.6) {
                await this.triggerTradeExecution(user, bot, 'SELL', prices);
            }

        } catch (error) {
            console.error(`[AutonomousWorker] Bot #${bot.id} strategy execution failed:`, error.message);
        }
    }

    /**
     * Triggers trade entry/execution for a bot signal.
     */
    async triggerTradeExecution(user, bot, action, prices) {
        const openPositions = positionManager.getOpenPositions();
        if (openPositions.length >= this.riskLimits.maxOpenPositions) {
            console.warn(`[AutonomousWorker] Max open positions limit reached (${this.riskLimits.maxOpenPositions}). Aborting swap.`);
            return;
        }

        const isLong = action === 'BUY';
        const fromToken = isLong ? this.USDC : this.WETH;
        const toToken = isLong ? this.WETH : this.USDC;

        const tradeSizeUsd = Math.min(bot.initialCapital || 10, this.riskLimits.maxTradeUsd);

        // Daily Spend Guard check
        if (this.dailySpendUsd + tradeSizeUsd > this.riskLimits.maxDailyLossUsd) {
            console.warn('[AutonomousWorker] Daily risk spending ceiling reached. Aborting swap.');
            return;
        }

        try {
            const tradeRequest = {
                botId: bot.id,
                fromToken,
                toToken,
                amount: tradeSizeUsd,
                slippageBps: this.riskLimits.maxSlippageBps
            };

            // Execute actual on-chain transaction
            const execResult = await onchainEngine.executeTrade(tradeRequest);

            if (execResult.success) {
                this.dailySpendUsd += tradeSizeUsd;
                bot.lastTradeTime = Date.now();

                // Build and save position representation
                const quantity = tradeSizeUsd / prices[isLong ? 'WETH' : 'USDC'];
                positionManager.createPosition({
                    botId: bot.id,
                    strategyId: bot.strategyId,
                    token: isLong ? 'WETH' : 'USDC',
                    quantity,
                    entryPrice: prices[isLong ? 'WETH' : 'USDC'],
                    entryTxHash: execResult.txHash,
                    entryGas: execResult.gasCostETH,
                    stopLoss: prices[isLong ? 'WETH' : 'USDC'] * 0.95, // 5% stop loss
                    takeProfit: prices[isLong ? 'WETH' : 'USDC'] * 1.05 // 5% take profit
                });

                // Update users record
                const users = loadUsers();
                if (users[user.id]) {
                    users[user.id].trades.push({
                        id: execResult.txHash || 'mock-tx-' + Date.now(),
                        botId: bot.id,
                        strategy: bot.strategy,
                        action,
                        txHash: execResult.txHash,
                        amount: tradeSizeUsd,
                        timestamp: Date.now()
                    });
                    saveUsers(users);
                }

                console.log(`[AutonomousWorker] Bot #${bot.id} trade swap successfully executed.`);
            }

        } catch (error) {
            console.error(`[AutonomousWorker] Trade failed for Bot #${bot.id}:`, error.message);
        }
    }

    /**
     * Monitors open positions and executes exits on Stop Loss or Take Profit.
     */
    async monitorOpenPositions(prices) {
        const openPositions = positionManager.getOpenPositions();
        if (openPositions.length === 0) return;

        for (const pos of openPositions) {
            const currentPrice = prices[pos.token];
            if (!currentPrice) continue;

            let triggerExit = false;
            let exitReason = '';

            // Check Take Profit
            if (pos.takeProfit && currentPrice >= pos.takeProfit) {
                triggerExit = true;
                exitReason = 'Take Profit Triggered';
            }
            // Check Stop Loss
            else if (pos.stopLoss && currentPrice <= pos.stopLoss) {
                triggerExit = true;
                exitReason = 'Stop Loss Triggered';
            }

            if (triggerExit) {
                console.log(`[AutonomousWorker] Closing Position ${pos.positionId} (${exitReason}) at price: ${currentPrice}`);

                const fromToken = pos.token === 'WETH' ? this.WETH : this.USDC;
                const toToken = pos.token === 'WETH' ? this.USDC : this.WETH;
                const sizeUsd = pos.quantity * currentPrice;

                try {
                    const execResult = await onchainEngine.executeTrade({
                        botId: pos.botId,
                        fromToken,
                        toToken,
                        amount: sizeUsd,
                        slippageBps: this.riskLimits.maxSlippageBps
                    });

                    if (execResult.success) {
                        const realisedPnL = (currentPrice - pos.entryPrice) * pos.quantity;
                        positionManager.closePosition(pos.positionId, {
                            exitPrice: currentPrice,
                            exitTxHash: execResult.txHash,
                            exitGas: execResult.gasCostETH,
                            realisedPnL
                        });
                        console.log(`[AutonomousWorker] Position ${pos.positionId} closed with P&L: $${realisedPnL} USD`);
                    }
                } catch (e) {
                    console.error(`[AutonomousWorker] Position exit trade failed:`, e.message);
                }
            }
        }
    }

    /**
     * Fetches current market prices from CoinGecko or on-chain.
     */
    async getMarketPrices() {
        try {
            const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin&vs_currencies=usd');
            const data = await r.json();
            return {
                'WETH': data['ethereum']?.usd || 3200,
                'USDC': data['usd-coin']?.usd || 1
            };
        } catch (e) {
            console.warn('[AutonomousWorker] Failed to query online CoinGecko feed, using default fallback prices');
            return {
                'WETH': 3200,
                'USDC': 1
            };
        }
    }
}

module.exports = new AutonomousWorker();
