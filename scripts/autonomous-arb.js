/**
 * Trade-Arena: Standalone Autonomous Arbitrage Worker
 * Optimized for pure CLI execution via MetaMask Agent Wallet
 */

import mmArbService from '../services/MetaMaskAgentArbService.js';
import 'dotenv/config';

async function main() {
    console.log('🚀 Initializing Autonomous Arbitrage Worker...');
    console.log('--------------------------------------------');
    
    // 1. Verify Environment
    if (!process.env.MANAGED_WALLET_ADDRESS) {
        console.error('❌ Error: MANAGED_WALLET_ADDRESS not set in .env');
        process.exit(1);
    }

    console.log(`📍 Managed Wallet: ${process.env.MANAGED_WALLET_ADDRESS}`);
    console.log(`⚙️ Mode: ${process.env.AGENT_EXECUTION_ENABLED === 'true' ? 'LIVE EXECUTION' : 'SIMULATION ONLY'}`);
    console.log(`🌐 Chains: Base, Arbitrum, Optimism`);
    console.log('--------------------------------------------');

    // 2. Start the service
    mmArbService.start();

    // 3. Keep process alive
    process.on('SIGINT', () => {
        console.log('\n🛑 Gracefully shutting down...');
        mmArbService.stop();
        process.exit(0);
    });

    console.log('✅ Worker is now running. Monitoring for opportunities...');
}

main().catch(err => {
    console.error('💥 Fatal Error:', err);
    process.exit(1);
});
