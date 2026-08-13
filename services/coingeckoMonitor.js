/**
 * COINGECKO API PRODUCTION MONITORING SERVICE
 * Trade Arena v4 • Real-Time Rate Limit & Connection Health Tracker
 */

const axios = require('axios');

class CoinGeckoMonitor {
  constructor(options = {}) {
    this.endpoint = options.endpoint || 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
    this.intervalMs = options.intervalMs || 30000; // Check every 30 seconds
    this.timeoutMs = options.timeoutMs || 5000;
    this.maxRetries = options.maxRetries || 3;
    this.alertWebhookUrl = options.alertWebhookUrl || process.env.MONITOR_ALERT_WEBHOOK || null;
    
    this.status = {
      isHealthy: true,
      lastCheckTime: null,
      consecutiveFailures: 0,
      rateLimitHitCount: 0,
      averageLatencyMs: 0,
      lastStatusCode: null,
      lastError: null,
    };

    this.timer = null;
    this.dailyReportTimer = null;
    this.latencies = [];
  }

  async checkHealth() {
    const startTime = Date.now();
    try {
      const response = await axios.get(this.endpoint, {
        timeout: this.timeoutMs,
        validateStatus: (status) => status < 500, // Accept 429 to inspect rate limits
      });

      const latency = Date.now() - startTime;
      this._recordLatency(latency);

      this.status.lastCheckTime = new Date().toISOString();
      this.status.lastStatusCode = response.status;

      if (response.status === 429) {
        this.status.rateLimitHitCount++;
        this.status.consecutiveFailures++;
        this.status.isHealthy = false;
        this.status.lastError = 'HTTP 429: Too Many Requests (Rate Limit Exceeded)';
        console.warn(`⚠️ [CoinGecko Monitor] Rate limit (429) detected! Total hits: ${this.status.rateLimitHitCount}`);
        this._sendAlert('RATE_LIMIT_EXCEEDED', 'CoinGecko API returned HTTP 429 (Too Many Requests)');
        return { healthy: false, status: 429, error: 'Rate limit exceeded' };
      }

      if (response.status !== 200) {
        this.status.consecutiveFailures++;
        this.status.isHealthy = false;
        this.status.lastError = `HTTP Error: ${response.status} ${response.statusText}`;
        console.error(`❌ [CoinGecko Monitor] API Error: ${this.status.lastError}`);
        return { healthy: false, status: response.status, error: this.status.lastError };
      }

      // Success
      this.status.consecutiveFailures = 0;
      this.status.isHealthy = true;
      this.status.lastError = null;
      
      const ethPrice = response.data?.ethereum?.usd;
      console.log(`✅ [CoinGecko Monitor] Health Check Passed | Latency: ${latency}ms | ETH Price: $${ethPrice}`);
      
      return { healthy: true, status: 200, latency, ethPrice };
    } catch (err) {
      const latency = Date.now() - startTime;
      this.status.consecutiveFailures++;
      this.status.isHealthy = false;
      this.status.lastCheckTime = new Date().toISOString();
      this.status.lastError = err.message;
      this.status.lastStatusCode = err.response?.status || 0;

      if (err.response?.status === 429) {
        this.status.rateLimitHitCount++;
        console.warn(`⚠️ [CoinGecko Monitor] Rate limit (429) caught in catch block!`);
        this._sendAlert('RATE_LIMIT_EXCEEDED', 'CoinGecko API returned HTTP 429 in catch block');
      } else {
        console.error(`❌ [CoinGecko Monitor] Connection Failure: ${err.message} (Latency: ${latency}ms)`);
        if (this.status.consecutiveFailures >= 3) {
          this._sendAlert('CONSECUTIVE_FAILURES', `CoinGecko API failed ${this.status.consecutiveFailures} consecutive times: ${err.message}`);
        }
      }

      return { healthy: false, error: err.message, latency };
    }
  }

  _recordLatency(latency) {
    this.latencies.push(latency);
    if (this.latencies.length > 20) {
      this.latencies.shift();
    }
    const sum = this.latencies.reduce((a, b) => a + b, 0);
    this.status.averageLatencyMs = Math.round(sum / this.latencies.length);
  }

  async _sendAlert(type, message) {
    if (!this.alertWebhookUrl) return;
    try {
      await axios.post(this.alertWebhookUrl, {
        alertType: type,
        service: 'CoinGecko Price Feed Monitor',
        timestamp: new Date().toISOString(),
        message,
        metrics: this.getMetrics()
      }, { timeout: 3000 });
      console.log(`📤 [CoinGecko Monitor] Alert webhook sent successfully (${type})`);
    } catch (e) {
      console.warn(`⚠️ [CoinGecko Monitor] Failed to dispatch alert webhook:`, e.message);
    }
  }

  startMonitoring() {
    console.log(`🚀 Starting CoinGecko API Monitor (Interval: ${this.intervalMs / 1000}s)...`);
    // Run initial check immediately
    this.checkHealth();

    this.timer = setInterval(() => {
      this.checkHealth();
    }, this.intervalMs);

    // Schedule daily summary report (every 24 hours)
    this.dailyReportTimer = setInterval(() => {
      this.generateDailyReport();
    }, 24 * 60 * 60 * 1000).unref?.();
  }

  generateDailyReport() {
    const metrics = this.getMetrics();
    console.log('📊 ═══════════════════════════════════════════════════════');
    console.log('📊 DAILY COINGECKO API HEALTH SUMMARY REPORT');
    console.log(`📊 Timestamp: ${new Date().toISOString()}`);
    console.log(`📊 Health Status: ${metrics.isHealthy ? 'HEALTHY' : 'DEGRADED / DOWN'}`);
    console.log(`📊 Average Latency: ${metrics.averageLatencyMs}ms`);
    console.log(`📊 Total Rate Limit Hits (429): ${metrics.rateLimitHitCount}`);
    console.log(`📊 Consecutive Failures: ${metrics.consecutiveFailures}`);
    console.log(`📊 Estimated Uptime: ${metrics.uptimePercentage}%`);
    console.log('📊 ═══════════════════════════════════════════════════════');
    this._sendAlert('DAILY_SUMMARY_REPORT', 'Daily health and rate limit summary report generated.');
    return metrics;
  }

  stopMonitoring() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.dailyReportTimer) {
      clearInterval(this.dailyReportTimer);
      this.dailyReportTimer = null;
    }
    console.log('🛑 CoinGecko API Monitor stopped.');
  }

  getMetrics() {
    return {
      ...this.status,
      endpoint: this.endpoint,
      uptimePercentage: this.status.consecutiveFailures === 0 ? 100 : Math.max(0, 100 - (this.status.consecutiveFailures * 5)),
    };
  }
}

// Export singleton instance for production use
const monitor = new CoinGeckoMonitor();

if (require.main === module) {
  // If run directly from CLI
  monitor.startMonitoring();
  // Run for 2 minutes then exit in test run
  setTimeout(() => {
    console.table(monitor.getMetrics());
    monitor.stopMonitoring();
    process.exit(0);
  }, 60000);
}

module.exports = { CoinGeckoMonitor, monitor };
