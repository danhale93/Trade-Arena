const axios = require('axios');
const { ethers } = require('ethers');

class PayoutService {
    constructor(config) {
        this.config = config;
        this.oracleWallet = new ethers.Wallet(config.oraclePrivateKey);
        this.rewardTokenAddress = config.rewardTokenAddress;
        this.payoutManagerAddress = config.payoutManagerAddress;
        this.chainId = config.chainId;
    }

    async generatePayoutSignature(userAddress, taskId, amount, nonce) {
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
