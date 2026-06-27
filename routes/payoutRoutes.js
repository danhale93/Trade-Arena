const express = require('express');
const PayoutService = require('../services/payouts/payoutService');
const router = express.Router();

const payoutService = new PayoutService({
    oraclePrivateKey: process.env.ORACLE_PRIVATE_KEY,
    rewardTokenAddress: process.env.REWARD_TOKEN_ADDRESS,
    payoutManagerAddress: process.env.PAYOUT_MANAGER_ADDRESS,
    chainId: parseInt(process.env.CHAIN_ID || '8453')
});

router.post('/claim', async (req, res) => {
    try {
        const { userAddress, taskId, proofOfWork } = req.body;
        const authPayload = await payoutService.authorizePayout(userAddress, taskId, proofOfWork);
        res.json({ success: true, data: authPayload });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
