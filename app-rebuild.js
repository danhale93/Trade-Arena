/**
 * TRADE ARENA v4.2 - PRODUCTION BUILD
 * Master Switch (FIXED), Real-Time Balance, Ticker Tracking, Market Pricing
 * 
 * ✓ Master ON/OFF switch controls all 6 bots simultaneously
 * ✓ Real-time balance updates every 500ms (responsive)
 * ✓ Live ticker display for each bot's position
 * ✓ Real CoinGecko prices with dynamic fee calculations
 * ✓ Unrealised P&L on balance display
 * ✓ Persistent state across reloads
 * ✓ Auto-recovery on disconnect/reconnect
 */

// MasterSwitch removed — global AUTO is now in the header (globalAutoToggle)

if (false) { class MasterSwitch {
  constructor() {
    this.isEnabled = localStorage.getItem('ta_master_enabled') !== 'false';
    this.lastToggleTime = 0;
    this.debounceMs = 50; // Ultra-responsive
    this.updateInterval = null;
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      setTimeout(() => this.setup(), 100);
    }
  }

  setup() {
    this.createUI();
    this.attachListeners();
    this.syncWithBots();
    // Sync every 500ms for instant responsiveness
    this.updateInterval = setInterval(() => this.syncWithBots(), 500);
    console.log('[MasterSwitch] ✓ ONLINE - Status: ' + (this.isEnabled ? 'ON' : 'OFF'));
  }

  createUI() {
    const existing = document.getElementById('masterSwitchContainer');
    if (existing) return;

    const container = document.createElement('div');
    container.id = 'masterSwitchContainer';
    container.style.cssText = `
      position: fixed;
      top: 70px;
      right: 12px;
      z-index: 9500;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: linear-gradient(135deg, var(--panel), rgba(22,15,30,0.8));
      border: 2px solid var(--border);
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.6);
      font-family: 'Bungee', display;
      transition: all 0.2s ease;
    `;

    const label = document.createElement('div');
    label.textContent = 'MASTER';
    label.style.cssText = `
      font-size: 11px;
      letter-spacing: 1px;
      color: var(--dim);
      text-transform: uppercase;
    `;

    const toggle = document.createElement('button');
    toggle.id = 'masterToggle';
    toggle.style.cssText = `
      width: 56px;
      height: 28px;
      border: 2px solid var(--border);
      border-radius: 14px;
      background: ${this.isEnabled ? 'linear-gradient(90deg, #39ff14, #2a9d0b)' : 'rgba(100,100,100,0.3)'};
      cursor: pointer;
      position: relative;
      transition: all 0.15s ease;
      padding: 0;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: ${this.isEnabled ? 'flex-end' : 'flex-start'};
      padding-right: ${this.isEnabled ? '4px' : '0'};
      padding-left: ${this.isEnabled ? '0' : '4px'};
      box-shadow: ${this.isEnabled ? '0 0 12px rgba(57,255,20,0.4)' : 'none'};
    `;

    const dot = document.createElement('div');
    dot.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: ${this.isEnabled ? 'var(--green)' : 'var(--dim)'};
      transition: all 0.15s ease;
      flex-shrink: 0;
    `;

    toggle.appendChild(dot);

    const status = document.createElement('div');
    status.id = 'masterStatus';
    status.style.cssText = `
      font-size: 10px;
      color: ${this.isEnabled ? 'var(--green)' : 'var(--hot)'};
      min-width: 60px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
    `;
    status.textContent = this.isEnabled ? '✓ ON' : '✗ OFF';

    container.appendChild(label);
    container.appendChild(toggle);
    container.appendChild(status);

    const headerEl = document.querySelector('.global-header');
    if (headerEl && headerEl.parentNode) {
      headerEl.parentNode.insertBefore(container, headerEl.nextSibling);
    } else {
      document.body.appendChild(container);
    }
  }

  attachListeners() {
    const toggle = document.getElementById('masterToggle');
    if (!toggle) return;

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });

    // Keyboard shortcut: Ctrl+Space
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  toggle() {
    const now = Date.now();
    if (now - this.lastToggleTime < this.debounceMs) return;
    this.lastToggleTime = now;

    this.isEnabled = !this.isEnabled;
    localStorage.setItem('ta_master_enabled', this.isEnabled ? 'true' : 'false');

    if (this.isEnabled) {
      this.enableAllBots();
    } else {
      this.disableAllBots();
    }

    this.updateUI();
    console.log('[MasterSwitch] Toggled → ' + (this.isEnabled ? 'ON' : 'OFF'));
  }

  enableAllBots() {
    if (typeof globalKilled !== 'undefined' && globalKilled && typeof resetKill === 'function') {
      resetKill();
    }

    if (typeof bots === 'undefined' || !Array.isArray(bots)) return;

    bots.forEach((bot) => {
      if (!bot.spinning && !bot.cooling) {
        bot.auto = true;
        
        const btn = document.getElementById(`mauto-${bot.id}`);
        const card = document.getElementById(`bot-${bot.id}`);
        
        if (btn) {
          btn.textContent = '⏸ STOP';
          btn.classList.add('on');
        }
        if (card) card.classList.add('auto-on');
        
        if (typeof scheduleAuto === 'function') {
          scheduleAuto(bot);
        }
      }
    });
  }

  disableAllBots() {
    if (typeof bots === 'undefined' || !Array.isArray(bots)) return;

    bots.forEach((bot) => {
      bot.auto = false;
      if (bot.autoTimer) clearTimeout(bot.autoTimer);
      
      const btn = document.getElementById(`mauto-${bot.id}`);
      const card = document.getElementById(`bot-${bot.id}`);
      
      if (btn) {
        btn.textContent = 'AUTO';
        btn.classList.remove('on');
      }
      if (card) card.classList.remove('auto-on');
    });
  }

  syncWithBots() {
    if (typeof bots === 'undefined' || !Array.isArray(bots)) return;

    bots.forEach((bot) => {
      const shouldBeAuto = this.isEnabled && !bot.cooling && !bot.spinning;
      
      if (bot.auto !== shouldBeAuto) {
        bot.auto = shouldBeAuto;
        
        const btn = document.getElementById(`mauto-${bot.id}`);
        if (btn) {
          btn.textContent = shouldBeAuto ? '⏸ STOP' : 'AUTO';
          btn.classList.toggle('on', shouldBeAuto);
        }
        
        if (shouldBeAuto && typeof scheduleAuto === 'function') {
          scheduleAuto(bot);
        } else if (!shouldBeAuto && bot.autoTimer) {
          clearTimeout(bot.autoTimer);
        }
      }
    });
  }

  updateUI() {
    const toggle = document.getElementById('masterToggle');
    const status = document.getElementById('masterStatus');

    if (toggle) {
      toggle.style.background = this.isEnabled
        ? 'linear-gradient(90deg, #39ff14, #2a9d0b)'
        : 'rgba(100,100,100,0.3)';
      toggle.style.justifyContent = this.isEnabled ? 'flex-end' : 'flex-start';
      toggle.style.boxShadow = this.isEnabled ? '0 0 12px rgba(57,255,20,0.4)' : 'none';

      const dot = toggle.querySelector('div');
      if (dot) {
        dot.style.background = this.isEnabled ? 'var(--green)' : 'var(--dim)';
      }
    }

    if (status) {
      status.textContent = this.isEnabled ? '✓ ON' : '✗ OFF';
      status.style.color = this.isEnabled ? 'var(--green)' : 'var(--hot)';
    }
  }
}

} } // end dead MasterSwitch class

// ══════════════════════════════════════════════════════
// REAL-TIME BALANCE UPDATER (500MS)
// ══════════════════════════════════════════════════════

class BalanceUpdater {
  constructor() {
    this.updateInterval = 500; // REAL-TIME - every 500ms
    this.lastDisplayBalance = 0;
    this.balanceHistory = [];
    this.maxHistory = 120;
    this.init();
  }

  init() {
    this.startMonitoring();
    console.log('[BalanceUpdater] ✓ ONLINE - Real-time updates (500ms)');
  }

  startMonitoring() {
    setInterval(() => {
      try {
        this.updateBalance();
        this.updateTickerDisplay();
      } catch (e) {
        console.warn('[BalanceUpdater] Error:', e);
      }
    }, this.updateInterval);
  }

  updateBalance() {
    const balEl = document.getElementById('ghBalance');
    if (!balEl) return;

    // Calculate unrealised P&L from open positions
    let unrealisedPnl = 0;
    if (typeof openPositions !== 'undefined' && Array.isArray(openPositions)) {
      unrealisedPnl = openPositions.reduce((sum, p) => sum + (p.livePnl || 0), 0);
    }

    // Get realised balance
    const realisedBalance = typeof balance !== 'undefined' ? balance : 10000;
    const startingBalance = typeof startBalance !== 'undefined' ? startBalance : 10000;
    const displayBalance = realisedBalance + unrealisedPnl;

    // Store history
    this.balanceHistory.push({
      timestamp: Date.now(),
      balance: displayBalance,
      realised: realisedBalance,
      unrealised: unrealisedPnl,
    });

    if (this.balanceHistory.length > this.maxHistory) {
      this.balanceHistory.shift();
    }

    // Determine color based on profit/loss
    const color = this.getBalanceColor(displayBalance, startingBalance);

    // Update balance display with smooth transition
    balEl.style.transition = 'color 0.2s ease, text-shadow 0.2s ease';
    balEl.style.color = color;
    balEl.textContent = '$' + displayBalance.toFixed(2);

    // Add glow effect when unrealised P&L exists
    if (unrealisedPnl !== 0) {
      balEl.style.textShadow = unrealisedPnl > 0
        ? '0 0 10px rgba(57,255,20,0.5)'
        : '0 0 10px rgba(255,45,120,0.5)';
    } else {
      balEl.style.textShadow = 'none';
    }

    this.lastDisplayBalance = displayBalance;

    // Update P&L display
    const pnlEl = document.getElementById('ghPnl');
    if (pnlEl) {
      const totalPnlValue = typeof totalPnl !== 'undefined' ? totalPnl : 0;
      const displayPnL = totalPnlValue + unrealisedPnl;
      pnlEl.textContent = (displayPnL >= 0 ? '+' : '') + '$' + displayPnL.toFixed(2) + (unrealisedPnl !== 0 ? ' (live)' : ' today');
      pnlEl.className = 'gh-pnl ' + (displayPnL >= 0 ? 'pnl-pos' : 'pnl-neg');
      pnlEl.style.color = displayPnL >= 0 ? 'var(--green)' : 'var(--hot)';
      pnlEl.style.transition = 'color 0.2s ease';
    }
  }

  updateTickerDisplay() {
    // Update ticker text for each bot's open position
    if (typeof bots === 'undefined' || !Array.isArray(bots)) return;

    bots.forEach((bot) => {
      const tickEl = document.getElementById('mtick-' + bot.id);
      if (!tickEl) return;

      // Find open position for this bot
      const openPos = typeof openPositions !== 'undefined'
        ? openPositions.find(p => p.botId === bot.id)
        : null;

      if (openPos && openPos.livePnl !== undefined) {
        const pnl = openPos.livePnl;
        const direction = openPos.direction === 'long' ? '📈' : '📉';
        const color = pnl > 0 ? '🟢' : pnl < 0 ? '🔴' : '🟡';
        
        tickEl.textContent = `${direction}${color} ${openPos.token} ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`;
        tickEl.style.color = pnl > 0 ? 'var(--green)' : pnl < 0 ? 'var(--hot)' : 'var(--gold)';
        tickEl.style.transition = 'color 0.2s ease';
      } else {
        // Rotating display
        const frames = ['📡 READY', '💰 TRADING', '⚡ ACTIVE', '📊 RUNNING'];
        const idx = Math.floor(Date.now() / 1500) % frames.length;
        tickEl.textContent = frames[idx];
        tickEl.style.color = 'var(--cyan)';
      }
    });
  }

  getBalanceColor(currentBalance, startingBalance) {
    if (startingBalance === 0) return 'var(--gold)';

    const changePercent = ((currentBalance - startingBalance) / startingBalance) * 100;

    if (changePercent >= 10) return '#00ff41'; // Bright green for big wins
    if (changePercent >= 5) return 'var(--green)';
    if (changePercent >= 2) return 'var(--cyan)';
    if (changePercent >= -2) return 'var(--gold)';
    if (changePercent >= -5) return 'var(--amber)';
    return 'var(--hot)'; // Red for losses
  }

  getBalanceHistory(minutes = 5) {
    const cutoff = Date.now() - minutes * 60000;
    return this.balanceHistory.filter((h) => h.timestamp >= cutoff);
  }

  getBalanceTrend() {
    if (this.balanceHistory.length < 2) return 'stable';
    const recent = this.balanceHistory.slice(-5);
    const avg = recent.reduce((s, h) => s + h.balance, 0) / recent.length;
    const latest = recent[recent.length - 1].balance;

    if (latest > avg * 1.01) return 'up';
    if (latest < avg * 0.99) return 'down';
    return 'stable';
  }
}

// ══════════════════════════════════════════════════════
// AUTO-RECOVERY & CONNECTION MANAGEMENT
// ══════════════════════════════════════════════════════

class AutoRecovery {
  constructor() {
    this.isOnline = navigator.onLine;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 3000;
    this.init();
  }

  init() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    setInterval(() => this.checkHealth(), 10000);
    console.log('[AutoRecovery] ✓ ONLINE - Monitoring connection');
  }

  handleOnline() {
    this.isOnline = true;
    this.reconnectAttempts = 0;
    console.log('[AutoRecovery] ✓ Reconnected - Syncing state');
    this.syncState();
  }

  handleOffline() {
    this.isOnline = false;
    console.log('[AutoRecovery] ⚠ Connection lost - Waiting for reconnect');
  }

  checkHealth() {
    if (!this.isOnline) return;

    // Check if critical globals are intact
    const required = ['balance', 'bots', 'openPositions', 'closedTrades'];
    const missing = required.filter((g) => typeof window[g] === 'undefined');

    if (missing.length > 0) {
      console.warn('[AutoRecovery] Missing globals:', missing);
      this.attemptRecovery();
    }
  }

  attemptRecovery() {
    try {
      const stored = localStorage.getItem('ta_game_state');
      if (stored) {
        const state = JSON.parse(stored);
        Object.assign(window, state);
        console.log('[AutoRecovery] ✓ State restored from localStorage');
      }
    } catch (e) {
      console.warn('[AutoRecovery] Recovery failed:', e);
    }
  }

  syncState() {
    if (typeof balanceUpdater !== 'undefined') {
      balanceUpdater.updateBalance();
    }
  }
}

// ══════════════════════════════════════════════════════
// REAL MARKET PRICING & LIVE PRICE TRACKING
// ══════════════════════════════════════════════════════

class RealMarketPricing {
  constructor() {
    this.priceCache = {};
    this.cacheAge = 30000; // 30 seconds
    this.lastFetchTime = 0;
    this.init();
  }

  init() {
    // Update prices every 30 seconds
    setInterval(() => this.updateLivePrices(), 30000);
    // Initial price fetch
    this.updateLivePrices();
  }

  async updateLivePrices() {
    if (Date.now() - this.lastFetchTime < this.cacheAge) return;

    try {
      const tokens = ['ethereum', 'bitcoin', 'solana', 'dogecoin', 'pepe', 'dogwifcoin', 'bonk', 'floki', 'arbitrum', 'matic-network'];
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokens.join(',')}&vs_currencies=usd`
      );
      
      if (response.ok) {
        const data = await response.json();
        this.priceCache = data;
        this.lastFetchTime = Date.now();
        
        // Update live P&L for all open positions
        this.updateOpenPositions();
      }
    } catch (e) {
      console.warn('[RealMarketPricing] Fetch failed:', e);
    }
  }

  updateOpenPositions() {
    if (typeof openPositions === 'undefined' || !Array.isArray(openPositions)) return;

    openPositions.forEach((pos) => {
      const price = this.getPrice(pos.token);
      if (price) {
        const priceDelta = (price - pos.entryPrice) / pos.entryPrice;
        const direction = pos.direction === 'long' ? 1 : -1;
        
        // Calculate unrealised P&L
        const unrealisedPnl = pos.bet * priceDelta * direction - (pos.costs?.total || 0);
        pos.livePnl = unrealisedPnl;
        pos.currentPrice = price;
      }
    });
  }

  getPrice(token) {
    const tokenMap = {
      'ETH': 'ethereum',
      'BTC': 'bitcoin',
      'SOL': 'solana',
      'DOGE': 'dogecoin',
      'PEPE': 'pepe',
      'WIF': 'dogwifcoin',
      'BONK': 'bonk',
      'FLOKI': 'floki',
      'ARB': 'arbitrum',
      'MATIC': 'matic-network'
    };

    const id = tokenMap[token] || token.toLowerCase();
    const price = this.priceCache[id]?.usd;
    return price || null;
  }

  calculateTradeCosts(method, volumeUsd, leverage = 1) {
    // Real trading costs
    const feeStructure = {
      'SPOT LONG': { gas: 0.25, spread: 0.0008, slippage: 0.001 },
      'SPOT SHORT': { gas: 0.35, spread: 0.0010, slippage: 0.0015 },
      'YIELD FARM': { gas: 0.50, spread: 0.0006, slippage: 0.0008 },
      'PERP LONG': { gas: 0.40, spread: 0.0012, slippage: 0.002, funding: 0.0001 },
      'PERP SHORT': { gas: 0.40, spread: 0.0012, slippage: 0.002, funding: 0.0001 },
      'HOLD': { gas: 0, spread: 0, slippage: 0 }
    };

    const f = feeStructure[method] || feeStructure['SPOT LONG'];
    const gasCost = f.gas;
    const spreadCost = volumeUsd * f.spread;
    const slippageCost = volumeUsd * f.slippage * leverage;
    const fundingCost = (f.funding || 0) * volumeUsd;
    const totalCost = gasCost + spreadCost + slippageCost + fundingCost;

    return {
      gas: gasCost,
      spread: spreadCost,
      slippage: slippageCost,
      funding: fundingCost,
      total: totalCost,
      percentage: (totalCost / volumeUsd * 100).toFixed(3)
    };
  }
}

// ══════════════════════════════════════════════════════
// GLOBAL INITIALIZATION & STARTUP
// ══════════════════════════════════════════════════════

let balanceUpdater = null;
let autoRecovery = null;
let realMarketPricing = null;

function initAppRebuildV42() {
  // Wait for DOM and game state
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initAppRebuildV42, 300);
    });
    return;
  }

  // Check if main game elements exist
  const mainApp = document.getElementById('mainApp');
  if (!mainApp) {
    setTimeout(initAppRebuildV42, 500);
    return;
  }

  // Check if globals are loaded
  if (typeof balance === 'undefined' || typeof bots === 'undefined') {
    setTimeout(initAppRebuildV42, 500);
    return;
  }

  console.log('%c🚀 TRADE ARENA v4.2 INITIALIZING...', 'color: #39ff14; font-weight: bold; font-size: 14px;');

  // Initialize all subsystems
  balanceUpdater = new BalanceUpdater();
  autoRecovery = new AutoRecovery();
  realMarketPricing = new RealMarketPricing();

  // Auto-save game state every 30 seconds
  setInterval(() => {
    try {
      const gameState = {
        balance: typeof balance !== 'undefined' ? balance : 10000,
        totalPnl: typeof totalPnl !== 'undefined' ? totalPnl : 0,
      };
      localStorage.setItem('ta_game_state', JSON.stringify(gameState));
    } catch (e) {
      console.warn('[AppRebuild] Save failed:', e);
    }
  }, 30000);

  console.log('%c✓ TRADE ARENA v4.2 READY', 'color: #39ff14; font-weight: bold; font-size: 14px;');

  console.log('%c→ Real-time balance (500ms)', 'color: #00ffff;');
  console.log('%c→ Live ticker tracking', 'color: #00ffff;');
  console.log('%c→ Real market prices (CoinGecko)', 'color: #00ffff;');
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAppRebuildV42);
} else {
  setTimeout(initAppRebuildV42, 500);
}

// ══════════════════════════════════════════════════════
// PUBLIC API - EXTERNAL CONTROL
// ══════════════════════════════════════════════════════

window.TradeArenaApp = {
  // Global auto control (replaces master switch)
  toggleMaster: () => { if (typeof globalAutoToggle === 'function') globalAutoToggle(); },
  enableAllBots: () => { if (!_ghAutoOn && typeof globalAutoToggle === 'function') globalAutoToggle(); },
  disableAllBots: () => { if (_ghAutoOn && typeof globalAutoToggle === 'function') globalAutoToggle(); },

  // Balance info
  getBalance: () => typeof balance !== 'undefined' ? balance : 0,
  getPnL: () => typeof totalPnl !== 'undefined' ? totalPnl : 0,
  getBalanceHistory: (minutes) => balanceUpdater ? balanceUpdater.getBalanceHistory(minutes) : [],
  getBalanceTrend: () => balanceUpdater ? balanceUpdater.getBalanceTrend() : 'unknown',

  // Price info
  getCurrentPrice: (token) => realMarketPricing ? realMarketPricing.getPrice(token) : null,
  calculateTradeCosts: (method, amount, leverage) => {
    return realMarketPricing ? realMarketPricing.calculateTradeCosts(method, amount, leverage) : null;
  },

  // System info
  getAutoRecovery: () => autoRecovery,
  getSystemStatus: () => {
    return {
      master: typeof _ghAutoOn !== 'undefined' ? (_ghAutoOn ? 'ON' : 'OFF') : 'INIT',
      balance: typeof balance !== 'undefined' ? balance : 'LOADING',
      online: autoRecovery ? autoRecovery.isOnline : false,
      version: 'v4.2'
    };
  }
};
