const express = require('express');
const rateLimit = require('express-rate-limit');
const FlashloanService = require('../services/flashloans/flashloanService');
const { ethers } = require('ethers');
const router = express.Router();

const flashloanLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 2,
    message: { error: "Flashloan requests are rate-limited." }
});

const flashloanService = new FlashloanService({
    rpcUrl: process.env.RPC_URL,
    privateKey: process.env.BOT_OPERATOR_PRIVATE_KEY,
    arbitrageContractAddress: process.env.FLASHLOAN_ARBITRAGE_ADDRESS,
    chainId: parseInt(process.env.CHAIN_ID || '8453'),
    tenderlyUser: process.env.TENDERLY_USER,
    tenderlyProject: process.env.TENDERLY_PROJECT,
    tenderlyKey: process.env.TENDERLY_KEY
});

router.post('/execute', flashloanLimiter, async (req, res) => {
    try {
        const { token, amount, actions } = req.body;
        if (!token || !amount || !actions) return res.status(400).json({ error: "Missing parameters" });

        if (!flashloanService.isConfigured()) {
            return res.status(503).json({ success: false, message: "Service unconfigured" });
        }

        const params = flashloanService.encodeArbitrageActions(actions);
        const simulation = await flashloanService.simulateTransaction(token, amount, params);

        res.json({ success: true, simulation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/status', async (req, res) => {
    try {
        const configured = flashloanService.isConfigured();
        let balance = "0";
        if (configured && flashloanService.wallet) {
            const b = await flashloanService.provider.getBalance(flashloanService.wallet.address);
            balance = ethers.formatEther(b);
        }
        res.json({
            configured,
            operator: flashloanService.wallet ? flashloanService.wallet.address : null,
            nativeBalance: balance,
            contract: process.env.FLASHLOAN_ARBITRAGE_ADDRESS || null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
