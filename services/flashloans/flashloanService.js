const { ethers } = require('ethers');
const axios = require('axios');

class FlashloanService {
    constructor(config) {
        this.config = config;
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.wallet = null;

        if (config.privateKey && config.privateKey !== '0x...' && config.privateKey.startsWith('0x')) {
            try {
                this.wallet = new ethers.Wallet(config.privateKey, this.provider);
                console.log(`[Flashloan] Bot Operator ready: ${this.wallet.address}`);
            } catch (e) {
                console.warn(`[Flashloan] Invalid BOT_OPERATOR_PRIVATE_KEY provided`);
            }
        }

        this.arbitrageContractAddress = config.arbitrageContractAddress;
    }

    isConfigured() {
        return !!this.wallet && !!this.arbitrageContractAddress;
    }

    async checkGasBalance(threshold = "0.05") {
        if (!this.wallet) return true;
        const balance = await this.provider.getBalance(this.wallet.address);
        const ethBalance = ethers.formatEther(balance);
        if (parseFloat(ethBalance) < parseFloat(threshold)) {
            throw new Error(`Insufficient gas balance: ${ethBalance}`);
        }
        return true;
    }

    encodeArbitrageActions(actions) {
        return ethers.AbiCoder.defaultAbiCoder().encode(
            ["tuple(address target, bytes callData)[]"],
            [actions]
        );
    }

    async simulateTransaction(token, amount, params) {
        if (!this.wallet) return { success: true, simulated: true };

        const simulationPayload = {
            network_id: this.config.chainId.toString(),
            from: this.wallet.address,
            to: this.arbitrageContractAddress,
            input: this.encodeRequestFlashLoan(token, amount, params),
            save: true
        };

        const response = await axios.post(
            `https://api.tenderly.co/api/v1/account/${this.config.tenderlyUser}/project/${this.config.tenderlyProject}/simulate`,
            simulationPayload,
            { headers: { 'X-Access-Key': this.config.tenderlyKey } }
        );

        return response.data.transaction;
    }

    encodeRequestFlashLoan(token, amount, params) {
        const iface = new ethers.Interface(["function requestFlashLoan(address,uint256,bytes)"]);
        return iface.encodeFunctionData("requestFlashLoan", [token, amount, params]);
    }
}

module.exports = FlashloanService;
