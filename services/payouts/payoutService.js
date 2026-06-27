const axios = require('axios');
const { ethers } = require('ethers');

class PayoutService {
    constructor(config) {
        this.config = config;
        this.oracleWallet = null;

        const key = config.oraclePrivateKey;

        // Robust hex check: must be a string, 64 chars (66 with 0x), and only hex digits
        const isHex = (str) => {
            if (typeof str !== 'string') return false;
            const clean = str.startsWith('0x') ? str.slice(2) : str;
            return clean.length === 64 && /^[0-9a-fA-F]+$/.test(clean);
        };

        if (isHex(key)) {
            try {
                this.oracleWallet = new ethers.Wallet(key.startsWith('0x') ? key : '0x' + key);
                console.log(`[Payout] Oracle initialized successfully`);
            } catch (e) {
                console.warn(`[Payout] Failed to initialize wallet even after hex check: ${e.message}`);
            }
        } else {
            console.log('[Payout] Running in Simulation Mode (No valid ORACLE_PRIVATE_KEY)');
        }

        this.rewardTokenAddress = config.rewardTokenAddress;
        this.payoutManagerAddress = config.payoutManagerAddress;
        this.chainId = config.chainId;
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
