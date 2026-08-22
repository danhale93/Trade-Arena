/**
 * HFT MEMORY PROFILER
 * Monitors Node.js heap usage and GC events during a sustained 100 TPS load test.
 * Run with: node --expose-gc scripts/profile-memory-hft.js
 */

const mmArbService = require('../services/MetaMaskAgentArbService.cjs');
const v8 = require('v8');
require('dotenv').config();

// Configuration
const TRADES_PER_SECOND = 100;
const TEST_DURATION_MINUTES = 2; // Sustained test to see memory growth
const TOTAL_TRADES = TRADES_PER_SECOND * 60 * TEST_DURATION_MINUTES;

function logMemoryUsage() {
    const memory = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    
    console.log(`\n--- MEMORY SNAPSHOT ---`);
    console.log(`RSS: ${(memory.rss / 1024 / 1024).toFixed(2)} MB (Total process memory)`);
    console.log(`Heap Used: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`External: ${(memory.external / 1024 / 1024).toFixed(2)} MB (Buffers/C++ objects)`);
    console.log(`GC Pauses: ${heapStats.total_available_size < (heapStats.heap_size_limit * 0.1) ? '🚨 HIGH PRESSURE' : '✅ Healthy'}`);
}

async function simulateTrade(id) {
    const network = ['base', 'arbitrum', 'optimism'][id % 3];
    const quote = {
        dex: 'profile_test_dex',
        netProfit: "1.50",
        inAmount: '1.0',
        in: 'WETH',
        outAmount: '2600',
        out: 'USDC'
    };
    const receipt = { txHash: `0x_profile_${id}` };
    
    // Test the notification pipeline which is the most allocation-heavy part
    await mmArbService.sendAlerts(network, 'Memory Profile Trade', quote, receipt, true);
}

async function runSustainedLoad() {
    console.log(`🚀 STARTING SUSTAINED MEMORY PROFILE: ${TRADES_PER_SECOND} TPS for ${TEST_DURATION_MINUTES} mins`);
    
    const startTime = Date.now();
    let tradesSent = 0;
    
    // Log memory every 5 seconds
    const memLogger = setInterval(logMemoryUsage, 5000);

    return new Promise((resolve) => {
        const interval = setInterval(async () => {
            if (tradesSent >= TOTAL_TRADES) {
                clearInterval(interval);
                clearInterval(memLogger);
                resolve();
                return;
            }

            for (let i = 0; i < 10; i++) {
                if (tradesSent < TOTAL_TRADES) {
                    simulateTrade(tradesSent++);
                }
            }
        }, 100);
    });
}

async function main() {
    // 1. Baseline
    console.log("📊 Capturing Baseline...");
    if (global.gc) global.gc(); // Force GC if flag is present
    logMemoryUsage();

    // 2. Load
    await runSustainedLoad();

    // 3. Post-Load Recovery
    console.log("\n🏁 Load Complete. Waiting for recovery...");
    setTimeout(() => {
        console.log("📊 Post-Load Memory (Before Manual GC):");
        logMemoryUsage();
        
        if (global.gc) {
            console.log("\n🧹 Triggering Manual GC...");
            global.gc();
            logMemoryUsage();
        }
        
        console.log("\n💡 ANALYSIS: If 'Heap Used' didn't return near baseline after GC, check for leaks in the alertQueue.");
    }, 10000);
}

main().catch(err => console.error(err));
