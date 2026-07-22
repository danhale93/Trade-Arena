const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const PayoutService = require('../services/payouts/payoutService');
const router = express.Router();

// Rate limiter: 5 requests per 15 minutes per IP
const payoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "Too many payout requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false
});

const payoutService = new PayoutService({
    oraclePrivateKey: process.env.ORACLE_PRIVATE_KEY,
    rewardTokenAddress: process.env.REWARD_TOKEN_ADDRESS,
    payoutManagerAddress: process.env.PAYOUT_MANAGER_ADDRESS,
    chainId: parseInt(process.env.CHAIN_ID || '8453')
});

router.post('/claim', payoutLimiter, async (req, res) => {
    try {
        const { userAddress, taskId, proofOfWork, validationToken } = req.body;

        // Early Validation: Ensure a valid Ethereum address is provided and reject 'demo'
        if (!userAddress || userAddress === 'demo' || !/0x[a-fA-F0-9]{40}/.test(userAddress)) {
            return res.status(400).json({ error: 'Valid Ethereum address required for payout claim' });
        }

        // Sentinel: Enforce strict input validation on taskId and proofOfWork to prevent DoS/Type Confusion
        if (!taskId || typeof taskId !== 'string' || taskId.length > 100) {
            return res.status(400).json({ error: 'Invalid or missing taskId' });
        }

        if (!proofOfWork || typeof proofOfWork !== 'string' || proofOfWork.length > 1000) {
            return res.status(400).json({ error: 'Invalid or missing proofOfWork' });
        }

        // Security: Validate the claim secret to prevent unauthorized signature requests
        const CLAIM_SECRET = process.env.TASK_CLAIM_SECRET;
        if (!CLAIM_SECRET) {
            return res.status(503).json({ error: 'Payout system not configured' });
        }

        // Sentinel: Use timing-safe comparison to prevent timing attacks on validation tokens
        const isValidToken = typeof validationToken === 'string' &&
                           validationToken.length === CLAIM_SECRET.length &&
                           crypto.timingSafeEqual(Buffer.from(validationToken), Buffer.from(CLAIM_SECRET));

        if (!isValidToken) {
            console.warn(`[Payout API] Unauthorized claim attempt for ${userAddress}`);
            return res.status(401).json({ error: 'Unauthorized claim' });
        }

        const authPayload = await payoutService.authorizePayout(userAddress, taskId, proofOfWork);
        res.json({ success: true, data: authPayload });
    } catch (error) {
        console.error('[Payout API] Error during claim:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
