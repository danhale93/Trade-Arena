/**
 * TRADE ARENA - Standalone Bot Worker Entry Point
 * Executes autonomous bot trading on Base Mainnet.
 */

require('dotenv').config();
const autonomousWorker = require('./services/AutonomousWorker');

console.log('[Worker] Booting Trade Arena Autonomous Bot Worker...');

async function main() {
    try {
        // Safe against duplicate startup:
        // When running standalone, start the background worker loops
        await autonomousWorker.start();
        console.log('[Worker] Worker loops successfully initialized and running.');
    } catch (error) {
        console.error('[Worker] Failed to start autonomous worker:', error.message);
        process.exit(1);
    }
}

// Graceful shutdown handling
process.on('SIGINT', () => {
    console.log('[Worker] Shutting down worker...');
    autonomousWorker.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('[Worker] Received SIGTERM. Shutting down worker...');
    autonomousWorker.stop();
    process.exit(0);
});

main();
