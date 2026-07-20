const axios = require('axios');
const { ethers } = require('ethers');

class PayoutService {
    constructor(config) {
        this.config = config;
        this.oracleWallet = null;
        try {
            if (config.oraclePrivateKey) {
                this.oracleWallet = new ethers.Wallet(config.oraclePrivateKey);
                console.log(`[PayoutService] Oracle wallet initialized: ${this.oracleWallet.address}`);
            } else {
                console.warn('[PayoutService] No oraclePrivateKey provided. Signature generation will be disabled.');
            }
        } catch (error) {
            console.error('[PayoutService] Failed to initialize oracle wallet:', error.message);
        }
        this.rewardTokenAddress = config.rewardTokenAddress;
        this.payoutManagerAddress = config.payoutManagerAddress;
        this.chainId = config.chainId;
    }

    async generatePayoutSignature(userAddress, taskId, amount, nonce) {
        if (!this.oracleWallet) {
            throw new Error('Oracle wallet not configured');
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
        // Sentinel: Validate inputs to prevent signing malicious or malformed data
        if (!userAddress || !ethers.isAddress(userAddress)) {
            throw new Error('Invalid user address');
        }
        if (!taskId || typeof taskId !== 'string' || taskId.length > 100) {
            throw new Error('Invalid taskId');
        }
        if (!proofOfWork || typeof proofOfWork !== 'string' || proofOfWork.length > 1000) {
            throw new Error('Invalid proof of work');
        }

        const amount = ethers.parseUnits("10", 6);
        const nonce = Date.now();
        const signature = await this.generatePayoutSignature(userAddress, taskId, amount, nonce);

        return { user: userAddress, taskId, amount: amount.toString(), nonce: nonce.toString(), signature };
    }
}

module.exports = PayoutService;
