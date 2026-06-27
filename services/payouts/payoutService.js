const axios = require('axios');
const { ethers } = require('ethers');

class PayoutService {
    constructor(config) {
        this.config = config;
        this.oracleWallet = null;

        if (config.oraclePrivateKey && config.oraclePrivateKey !== '0x...' && config.oraclePrivateKey.startsWith('0x')) {
            try {
                this.oracleWallet = new ethers.Wallet(config.oraclePrivateKey);
                console.log(`[Payout] Oracle ready: ${this.oracleWallet.address}`);
            } catch (e) {
                console.warn(`[Payout] Invalid ORACLE_PRIVATE_KEY provided`);
            }
        } else {
            console.log('[Payout] Running without ORACLE_PRIVATE_KEY (Simulation Mode)');
        }

        this.rewardTokenAddress = config.rewardTokenAddress;
        this.payoutManagerAddress = config.payoutManagerAddress;
        this.chainId = config.chainId;
    }

    isConfigured() {
        return !!this.oracleWallet && !!this.payoutManagerAddress;
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
        const nonce = Date.now();
        const signature = await this.generatePayoutSignature(userAddress, taskId, amount, nonce);

        return { user: userAddress, taskId, amount: amount.toString(), nonce: nonce.toString(), signature };
    }
}

module.exports = PayoutService;
