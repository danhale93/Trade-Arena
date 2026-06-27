const express = require('express');
const rateLimit = require('express-rate-limit');
const PayoutService = require('../services/payouts/payoutService');
const router = express.Router();

// Rate limiter: 5 requests per 15 minutes per IP
const payoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "Too many payout requests. Please try again later." }
});

const payoutService = new PayoutService({
    oraclePrivateKey: process.env.ORACLE_PRIVATE_KEY,
    rewardTokenAddress: process.env.REWARD_TOKEN_ADDRESS,
    payoutManagerAddress: process.env.PAYOUT_MANAGER_ADDRESS,
    chainId: parseInt(process.env.CHAIN_ID || '8453')
});

router.post('/claim', payoutLimiter, async (req, res) => {
    try {
        const { userAddress, taskId, proofOfWork } = req.body;
        const authPayload = await payoutService.authorizePayout(userAddress, taskId, proofOfWork);
        res.json({ success: true, data: authPayload });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
