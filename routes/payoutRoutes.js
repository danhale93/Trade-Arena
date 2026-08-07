const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const PayoutService = require('../services/payouts/payoutService');
const router = express.Router();

const ALLOWED_TASK_IDS = new Set([
  'follow_twitter',
  'join_discord',
  'share_win',
  'first_trade',
  'hcaptcha_verify',
  'ai_feedback'
]);

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
        if (!userAddress || typeof userAddress !== 'string' || userAddress === 'demo' || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
            return res.status(400).json({ error: 'Valid Ethereum address required for payout claim' });
        }

        // Sentinel: Enforce strict input validation on taskId and proofOfWork to prevent DoS/Type Confusion
        if (!taskId || typeof taskId !== 'string' || !ALLOWED_TASK_IDS.has(taskId)) {
            return res.status(400).json({ error: 'Invalid or unauthorized taskId' });
        }

        // Sentinel: Ensure taskId is one of the allowed/whitelisted task IDs
        if (!ALLOWED_TASK_IDS.has(taskId)) {
            return res.status(400).json({ error: 'Invalid or unauthorized taskId requested' });
        }

        const normalizedAddress = userAddress.toLowerCase();
        const claimedKey = `${normalizedAddress}:${taskId}`;
        const claimedTasks = req.app?.locals?.CLAIMED_USER_TASKS || new Set();
        if (claimedTasks.has(claimedKey)) {
            return res.status(429).json({ error: 'Task reward already claimed for this address' });
        }

        if (!proofOfWork || typeof proofOfWork !== 'string' || proofOfWork.length > 1000) {
            return res.status(400).json({ error: 'Invalid or missing proofOfWork' });
        }

        const claimKey = `${userAddress.toLowerCase()}-${taskId.toLowerCase()}`;
        if (req.app && req.app.locals && req.app.locals.CLAIMED_USER_TASKS) {
            if (req.app.locals.CLAIMED_USER_TASKS.has(claimKey)) {
                return res.status(429).json({ error: 'Task already claimed for this address' });
            }
        }

        // Security: Validate the claim secret to prevent unauthorized signature requests
        const CLAIM_SECRET = process.env.TASK_CLAIM_SECRET;
        if (!CLAIM_SECRET) {
            return res.status(503).json({ error: 'Payout system not configured' });
        }

        // Sentinel: Use timing-safe comparison to prevent timing attacks on validation tokens
        // Compare byte length of buffers to prevent TypeError throw on multibyte characters
        const isValidToken = typeof validationToken === 'string' && (() => {
            const tokenBuf = Buffer.from(validationToken);
            const secretBuf = Buffer.from(CLAIM_SECRET);
            return tokenBuf.length === secretBuf.length && crypto.timingSafeEqual(tokenBuf, secretBuf);
        })();

        if (!isValidToken) {
            console.warn(`[Payout API] Unauthorized claim attempt for ${userAddress}`);
            return res.status(401).json({ error: 'Unauthorized claim' });
        }

        const authPayload = await payoutService.authorizePayout(userAddress, taskId, proofOfWork);

        if (req.app && req.app.locals && req.app.locals.CLAIMED_USER_TASKS) {
            req.app.locals.CLAIMED_USER_TASKS.add(claimKey);
        }

        res.json({ success: true, data: authPayload });
    } catch (error) {
        console.error('[Payout API] Error during claim:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
