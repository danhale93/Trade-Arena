/**
 * HFT NOTIFICATION LOAD TEST
 * Simulates high-frequency trade events to verify aggregation and fallback logic.
 */

import mmArbService from '../services/MetaMaskAgentArbService.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TRADES_PER_SECOND = 100;
const TEST_DURATION_SECONDS = 5;
const TOTAL_TRADES = TRADES_PER_SECOND * TEST_DURATION_SECONDS;

async function simulateTrade(id) {
    const network = ['base', 'arbitrum', 'optimism'][id % 3];
    const quote = {
        dex: 'load_test_dex',
        netProfit: (Math.random() * 5).toFixed(2),
        inAmount: '1.0',
        in: 'WETH',
        outAmount: '2600',
        out: 'USDC'
    };
    const receipt = {
        txHash: `0x_load_test_${id}_${Date.now()}`
    };

    // Trigger the notification system
    await mmArbService.sendAlerts(network, 'HFT Load Test Trade', quote, receipt, true);
}

async function runLoadTest() {
    console.log(`🚀 STARTING LOAD TEST: ${TRADES_PER_SECOND} trades/sec for ${TEST_DURATION_SECONDS}s`);
    console.log(`📦 Total intended trades: ${TOTAL_TRADES}`);
    console.log(`⏱️ Aggregation Window: ${mmArbService.aggregationWindowMs / 1000}s`);

    const startTime = Date.now();
    let tradesSent = 0;

    const interval = setInterval(async () => {
        for (let i = 0; i < 10; i++) { // Send in small batches to maintain frequency
            if (tradesSent >= TOTAL_TRADES) {
                clearInterval(interval);
                const duration = (Date.now() - startTime) / 1000;
                console.log(`\n🏁 LOAD TEST COMPLETE`);
                console.log(`✅ Sent ${tradesSent} trades in ${duration.toFixed(2)}s`);
                console.log(`📊 Check your Discord/Telegram for a "Bulk Arbitrage Report"`);
                console.log(`📄 Check logs/trades.log for ${tradesSent} individual JSON entries`);
                return;
            }
            simulateTrade(tradesSent++);
        }
        
        // Progress indicator
        if (tradesSent % 100 === 0) {
            process.stdout.write('.');
        }
    }, 100); // Run every 100ms
}

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

runLoadTest().catch(err => console.error('❌ Load Test Failed:', err));
