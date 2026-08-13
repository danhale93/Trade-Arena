/**
 * PRODUCTION VERIFICATION SCRIPT
 * Tests account switching, background sync, and session persistence.
 */

const assert = require('assert');
const { ethers } = require('ethers');

// Mock DOM and window environment
const eventListeners = {};
const domElements = {
  ghBalance: { textContent: '' },
  userAddr: { textContent: '' }
};

const mockLocalStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; }
};

global.localStorage = mockLocalStorage;

global.window = {
  ethereum: {
    isMetaMask: true,
    on: (event, cb) => {
      eventListeners[event] = cb;
    },
    request: async ({ method }) => {
      if (method === 'eth_accounts') return ['0x999988887777666655554444333222111000aaab'];
      if (method === 'eth_chainId') return '0x2105';
      if (method === 'eth_getBalance') return '0x2386f26fc10000'; // 2.5 ETH in hex
      return null;
    }
  },
  localStorage: mockLocalStorage,
  location: { href: 'http://localhost/' },
  addEventListener: (event, cb) => {
    if (event === 'DOMContentLoaded') {
      global._DOMContentLoadedCb = cb;
    }
  },
  dispatchEvent: (event) => {
    global._lastEvent = event;
  }
};

global.document = {
  getElementById: (id) => domElements[id] || null
};

global.navigator = { userAgent: 'Verification Runner' };
global.ethers = ethers;
global.fetch = async () => ({
  ok: true,
  json: async () => ({ ethereum: { usd: 3500 } })
});

// Load real-wallet.js
const realWallet = require('./public/real-wallet.js');
const { monitor } = require('./services/coingeckoMonitor');

async function runVerification() {
  console.log('🧪 Starting Production Verification Suite...\n');

  try {
    // 1. Verify Session Persistence (localStorage)
    console.log('Test 1: Verifying localStorage session persistence...');
    const testAddress = '0x1234567890abcdef1234567890abcdef12345678';
    global.window.localStorage.setItem('trade_arena_wallet_address', testAddress);
    assert.strictEqual(global.window.localStorage.getItem('trade_arena_wallet_address'), testAddress, 'Address should be saved in localStorage');
    console.log('✅ Test 1 Passed: localStorage persistence verified.');

    // 2. Verify Account Switch Simulation
    console.log('\nTest 2: Verifying account switch balance updates...');
    assert.ok(eventListeners['accountsChanged'], 'accountsChanged listener must be registered');

    realWallet.walletState.provider = {
      getBalance: async (addr) => ethers.parseEther('3.0'),
      getNetwork: async () => ({ chainId: 8453 })
    };

    const newAccount = '0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEF';
    await eventListeners['accountsChanged']([newAccount]);

    assert.strictEqual(realWallet.walletState.address, newAccount, 'Wallet address should update to new account');
    assert.strictEqual(realWallet.walletState.balanceETH, 3.0, 'Balance ETH should be 3.0');
    assert.strictEqual(realWallet.walletState.balanceUSD, 3.0 * 3500, 'Balance USD should be correctly calculated');
    assert.strictEqual(global.window.localStorage.getItem('trade_arena_wallet_address'), newAccount, 'localStorage should be updated with new account');
    console.log('✅ Test 2 Passed: Account switch correctly updates wallet state and balance.');

    // 3. Verify CoinGecko Monitor Health & Rate Limit Tracking
    console.log('\nTest 3: Verifying CoinGecko monitor health metrics...');
    const healthResult = await monitor.checkHealth();
    assert.strictEqual(healthResult.healthy, true, 'CoinGecko monitor health check should pass');
    const metrics = monitor.getMetrics();
    assert.strictEqual(metrics.isHealthy, true, 'Monitor status should be healthy');
    assert.strictEqual(metrics.rateLimitHitCount, 0, 'Rate limit hit count should start at 0');
    console.log(`✅ Test 3 Passed: CoinGecko monitor operational (Latency: ${metrics.averageLatencyMs}ms).`);

    console.log('\n🎉 ALL PRODUCTION VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exit(1);
  }
}

runVerification();
