/**
 * API HEALTH & COINGECKO MONITORING ROUTE
 * Trade Arena v4 • Express Router for Production Monitoring
 */

const express = require('express');
const router = express.Router();
const { monitor } = require('../services/coingeckoMonitor');

// GET /api/health/coingecko - Returns real-time monitor metrics
router.get('/coingecko', (async (req, res) => {
  try {
    const metrics = monitor.getMetrics();
    res.json({
      success: true,
      service: 'CoinGecko Price Feed Monitor',
      timestamp: new Date().toISOString(),
      metrics: metrics,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}));

// GET /api/health/check-now - Force immediate health check
router.get('/check-now', (async (req, res) => {
  try {
    const result = await monitor.checkHealth();
    res.json({
      success: true,
      result: result,
      metrics: monitor.getMetrics(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}));

module.exports = router;
