# Production Monitoring & Rate Limit Operations Guide: Trade Arena

**Author:** **Manus AI**  
**Target Service:** CoinGecko API Price Feed (`services/coingeckoMonitor.js`)  
**Associated Endpoint:** `/api/health/coingecko` (`routes/apiHealth.js`)  

---

## Executive Summary

To guarantee uninterrupted trading operations on the Base Mainnet, the Trade Arena platform incorporates an automated production monitoring service (`CoinGeckoMonitor`). This service continuously tracks API latency, HTTP response codes, and rate limit exceptions (`HTTP 429: Too Many Requests`), ensuring high availability and proactive health visibility across production deployments.

---

## Architecture & Monitoring Metrics

The monitoring service operates as a background daemon polling the CoinGecko simple price endpoint at configurable intervals (default: 30 seconds). The tracked metrics are summarized below:

| Metric Parameter | Description | Operational Threshold |
| :--- | :--- | :--- |
| `isHealthy` | Boolean indicator reflecting current API accessibility. | Must be `true` for active trading. |
| `averageLatencyMs` | Rolling average response time across the last 20 health checks. | Optimal: `< 500ms`, Warning: `> 2000ms`. |
| `rateLimitHitCount` | Cumulative count of `HTTP 429` rate limit responses encountered. | Must be `0` in steady state. |
| `consecutiveFailures` | Number of sequential failed health checks. | Trigger alert if `>= 3`. |
| `uptimePercentage` | Calculated availability percentage based on recent check success. | Target: `100%`. |

---

## Integration & API Endpoints

### 1. Programmatic Service Control
```javascript
const { monitor } = require('./services/coingeckoMonitor');

// Start automated monitoring
monitor.startMonitoring();

// Retrieve real-time health metrics
const metrics = monitor.getMetrics();
console.log(metrics);

// Stop monitoring
monitor.stopMonitoring();
```

### 2. HTTP Health Check Endpoints
- **GET `/api/health/coingecko`**: Returns current JSON metrics including health status, rate limit hits, and average latency.
- **GET `/api/health/check-now`**: Forces an immediate on-demand health check against the CoinGecko API and returns the fresh result.

---

## Operational Incident Response (Rate Limits & Outages)

1. **HTTP 429 (Rate Limit Exceeded):**  
   - **Cause:** Exceeding CoinGecko public API rate limits (typically ~30 requests/minute).  
   - **Resolution:** The monitor logs a warning and increments `rateLimitHitCount`. In production environments experiencing high traffic, upgrade to CoinGecko Pro API or introduce an internal price caching layer (Redis/Memcached) with a 15-second TTL.
2. **Network Timeouts (`ETIMEDOUT`):**  
   - **Cause:** DNS resolution failure or network latency exceeding the 5-second timeout threshold.  
   - **Resolution:** The monitor increments `consecutiveFailures`. If consecutive failures exceed 3, trading execution guards pause automated operations until connection recovery is confirmed.

---

## References

[1] CoinGecko API, "Rate Limits and Best Practices," [CoinGecko API Documentation](https://www.coingecko.com/en/api/documentation).  
[2] Express.js Guide, "Routing and Middleware Architecture," [Expressjs.com](https://expressjs.com).
