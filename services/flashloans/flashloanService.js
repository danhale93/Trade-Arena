const { ethers } = require('ethers');
const axios = require('axios');

class FlashloanService {
    constructor(config) {
        this.config = config;
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl || process.env.RPC_URL || 'https://mainnet.base.org');
        this.wallet = null;

        // Fallback to PAYOUT_PRIVATE_KEY if BOT_OPERATOR_PRIVATE_KEY is missing
        const key = config.privateKey || process.env.PAYOUT_PRIVATE_KEY;

        const isHex = (str) => {
            if (typeof str !== 'string') return false;
            const clean = str.startsWith('0x') ? str.slice(2) : str;
            return clean.length === 64 && /^[0-9a-fA-F]+$/.test(clean);
        };

        if (isHex(key)) {
            try {
                this.wallet = new ethers.Wallet(key.startsWith('0x') ? key : '0x' + key, this.provider);
                console.log(`[Flashloan] Bot Operator initialized using ${config.privateKey ? 'BOT_OPERATOR' : 'PAYOUT'}_PRIVATE_KEY`);
            } catch (e) {
                console.warn(`[Flashloan] Failed to initialize wallet: ${e.message}`);
            }
        } else {
            console.log('[Flashloan] Running in Simulation Mode (No valid Private Key)');
        }

        this.arbitrageContractAddress = config.arbitrageContractAddress;
    }

    isConfigured() {
        return !!this.wallet && !!this.arbitrageContractAddress && this.arbitrageContractAddress.startsWith('0x');
    }

    async checkGasBalance(threshold = "0.05") {
        if (!this.wallet) return true;
        try {
            const balance = await this.provider.getBalance(this.wallet.address);
            const ethBalance = ethers.formatEther(balance);
            if (parseFloat(ethBalance) < parseFloat(threshold)) {
                throw new Error(`Insufficient gas balance: ${ethBalance}`);
            }
        } catch (e) {
            console.error(`[Flashloan] Gas check failed: ${e.message}`);
            return false;
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
        if (!this.wallet) return { status: false, error: "Simulation mode active" };

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
