const axios = require('axios');
const { ethers } = require('ethers');

class PayoutService {
    constructor(config) {
        this.config = config;
        this.oracleWallet = null;

        // Fallback to PAYOUT_PRIVATE_KEY if ORACLE_PRIVATE_KEY is missing
        const key = config.oraclePrivateKey || process.env.PAYOUT_PRIVATE_KEY;

        const isHex = (str) => {
            if (typeof str !== 'string') return false;
            const clean = str.startsWith('0x') ? str.slice(2) : str;
            return clean.length === 64 && /^[0-9a-fA-F]+$/.test(clean);
        };

        if (isHex(key)) {
            try {
                this.oracleWallet = new ethers.Wallet(key.startsWith('0x') ? key : '0x' + key);
                console.log(`[Payout] Oracle initialized using ${config.oraclePrivateKey ? 'ORACLE' : 'PAYOUT'}_PRIVATE_KEY`);
            } catch (e) {
                console.warn(`[Payout] Failed to initialize wallet: ${e.message}`);
            }
        } else {
            console.log('[Payout] Running in Simulation Mode (No valid Private Key)');
        }

        this.rewardTokenAddress = config.rewardTokenAddress || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Default to USDC on Base
        this.payoutManagerAddress = config.payoutManagerAddress;
        this.chainId = config.chainId || 8453;
    }

    isConfigured() {
        return !!this.oracleWallet && !!this.payoutManagerAddress && this.payoutManagerAddress.startsWith('0x');
    }

    async generatePayoutSignature(userAddress, taskId, amount, nonce) {
        if (!this.oracleWallet) {
            return "0x_simulated_signature";
        }

        const domain = {
            name: 'PayoutManager',
            version: '1',
            chainId: this.chainId,
            verifyingContract: this.payoutManagerAddress
        };

        const types = {
            Payout: [
                { name: 'user', type: 'address' },
                { name: 'taskId', type: 'string' },
                { name: 'amount', type: 'uint256' },
                { name: 'nonce', type: 'uint256' }
            ]
        };

        const value = { user: userAddress, taskId, amount, nonce };
        return await this.oracleWallet.signTypedData(domain, types, value);
    }

    async authorizePayout(userAddress, taskId, proofOfWork) {
        if (!proofOfWork) throw new Error('Invalid proof of work');
        const amount = ethers.parseUnits("10", 6);
        const nonce = BigInt(Date.now());
        const signature = await this.generatePayoutSignature(userAddress, taskId, amount, nonce);

        return { user: userAddress, taskId, amount: amount.toString(), nonce: nonce.toString(), signature };
    }
}

module.exports = PayoutService;
