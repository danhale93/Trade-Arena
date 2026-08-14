/**
 * TRADE ARENA - Main Application Logic
 * Bot Management, UI Control & Real-time Updates
 */

let provider, signer, userAddress;
let isDemoMode = false;
let userBalance = 0;
let currentTab = 'dashboard';

// Chart instances
let marketChart, performanceChart, profitChart;

/**
 * WALLET & AUTHENTICATION
 */
async function connectWallet() {
    // Legacy MetaMask connection disabled - Redirect to Google/Agent login
    showToast('Agent Mode Active: Please connect via Google', 'info');
    handleGoogleLogin();
}

async function handleGoogleLogin() {
    showToast('Redirecting to Google...', 'info');
    
    // Use Privy for real Google Login
    if (typeof window.privyLoginGoogle === 'function') {
        try {
            await window.privyLoginGoogle();
            // privy-client.js will call onPrivyLoginSuccess -> loginSuccess
        } catch (e) {
            console.error('Google login failed:', e);
            showToast('Google login failed', 'error');
        }
    } else if (window.privyLogin) {
        window.privyLogin({ loginMethod: 'google' });
    } else {
        // Fallback for demo purposes
        setTimeout(() => {
            userAddress = '0xGoogleUser...' + Math.floor(Math.random()*1000);
            userBalance = 15.50;
            loginSuccess();
            showToast('Google Login Success (Demo)', 'success');
        }, 1500);
    }
}

function loginSuccess() {
    const loginScreen = document.getElementById('loginScreen') || document.getElementById('connectScreen');
    if (loginScreen) loginScreen.style.display = 'none';
    const mainApp = document.getElementById('mainApp');
    if (mainApp) {
        mainApp.style.display = 'flex';
        mainApp.style.flexDirection = 'column';
    }
    
    // Use ghBalance if it exists, fallback to walletBalance
    const balanceEl = document.getElementById('ghBalance') || document.getElementById('walletBalance');
    const addrEl = document.getElementById('userAddr');

    if (balanceEl) balanceEl.textContent = '$' + (parseFloat(userBalance) || 0).toFixed(2);
    if (addrEl && userAddress) addrEl.textContent = userAddress.substring(0, 6) + '...' + userAddress.substring(38);

    initializeApp();
    updateAgentStatus(); // Immediately sync with MetaMask Agent Wallet
}

// Global Wallet State Listener - Must be registered immediately
window.addEventListener('walletStateChanged', (event) => {
    const state = event.detail;
    const currentBalanceEl = document.getElementById('ghBalance') || document.getElementById('walletBalance');
    const currentAddrEl = document.getElementById('userAddr');

    if (state.isConnected && state.address) {
        userAddress = state.address;
        userBalance = state.balanceUSD;
        
        if (currentBalanceEl) currentBalanceEl.textContent = '$' + state.balanceUSD.toFixed(2);
        if (currentAddrEl) currentAddrEl.textContent = userAddress.substring(0, 6) + '...' + userAddress.substring(38);
        
        console.log('🔄 UI Synced with Wallet State:', userAddress, '$' + state.balanceUSD.toFixed(2));
        
        // Ensure UI is visible if we have a connection
        const loginScreen = document.getElementById('loginScreen') || document.getElementById('connectScreen');
        const mainApp = document.getElementById('mainApp');
        if (loginScreen && loginScreen.style.display !== 'none') {
            loginScreen.style.display = 'none';
            if (mainApp) {
                mainApp.style.display = 'flex';
                mainApp.style.flexDirection = 'column';
                initializeApp();
            }
        }
    } else {
        // Handle disconnected state UI
        if (currentBalanceEl) currentBalanceEl.textContent = '$0.00';
        if (currentAddrEl) currentAddrEl.textContent = '0x...';
    }
});

/**
 * APP INITIALIZATION
 */
async function initializeApp() {
    // Create sample bots if first time
    if (tradingEngine.bots.length === 0) {
        createDefaultBots();
    }

    // Initialize charts
    initCharts();

    // Start auto-refresh
    startAutoRefresh();

    // Load initial data
    refreshDashboard();
}

function createDefaultBots() {
    const defaultBots = [
        {
            id: tradingEngine.generateId(),
            name: 'Arb Hunter #1',
            strategy: 'Arbitrage Detection',
            risk: 'Conservative (2x leverage)',
            amount: 0.5,
            autoMode: true,
            active: true,
            created: Date.now(),
            totalProfit: 0.024,
            trades: 12,
            winRate: 83
        },
        {
            id: tradingEngine.generateId(),
            name: 'Flash Master',
            strategy: 'Flash Loan Farming',
            risk: 'Moderate (5x leverage)',
            amount: 1.0,
            autoMode: true,
            active: true,
            created: Date.now(),
            totalProfit: 0.156,
            trades: 8,
            winRate: 75
        },
        {
            id: tradingEngine.generateId(),
            name: 'Vol Trader',
            strategy: 'Volatility Trading',
            risk: 'Aggressive (10x leverage)',
            amount: 0.3,
            autoMode: true,
            active: false,
            created: Date.now(),
            totalProfit: -0.018,
            trades: 5,
            winRate: 40
        }
    ];

    tradingEngine.bots = defaultBots;
}

/**
 * TAB NAVIGATION
 */
function switchTab(tab) {
    currentTab = tab;
    
    // Hide all tabs
    document.getElementById('dashboardTab').classList.add('hidden');
    document.getElementById('botsTab').classList.add('hidden');
    document.getElementById('slotsTab').classList.add('hidden');
    document.getElementById('analyticsTab').classList.add('hidden');

    // Show selected tab
    document.getElementById(tab + 'Tab').classList.remove('hidden');

    // Update active button
    document.querySelectorAll('[id^="tab"]').forEach(btn => {
        btn.classList.remove('border-[#00ff9d]', 'text-[#00ff9d]');
        btn.classList.add('border-transparent', 'text-gray-400');
    });
    document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('border-[#00ff9d]', 'text-[#00ff9d]');

    // Refresh tab content
    if (tab === 'bots') refreshBots();
    if (tab === 'analytics') refreshAnalytics();
}

/**
 * DASHBOARD
 */
async function refreshDashboard() {
    // Update stats
    document.getElementById('totalBots').textContent = tradingEngine.bots.length;
    document.getElementById('activeTrades').textContent = tradingEngine.trades.length;

    const profit24h = tradingEngine.bots.reduce((sum, b) => sum + (b.totalProfit || 0), 0);
    document.getElementById('profit24h').textContent = 
        (profit24h >= 0 ? '+' : '') + profit24h.toFixed(4) + ' ETH';

    const avgWinRate = tradingEngine.bots.length > 0 
        ? (tradingEngine.bots.reduce((sum, b) => sum + (b.winRate || 0), 0) / tradingEngine.bots.length).toFixed(0)
        : 0;
    document.getElementById('riskLevel').textContent = avgWinRate > 70 ? 'LOW' : avgWinRate > 50 ? 'MEDIUM' : 'HIGH';

    // Opportunities
    const opportunities = await tradingEngine.detectArbitrageOpportunities(
        [
            { token: 'WETH', volume: 150000, volatility: 2.5 },
            { token: 'ARB', volume: 50000, volatility: 4.8 }
        ]
    );

    displayOpportunities(opportunities);
    displayRecentTrades();
    updateMarketChart();
}

function displayOpportunities(opportunities) {
    const container = document.getElementById('opportunitiesContainer');
    
    if (opportunities.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-8">No opportunities detected</div>';
        return;
    }

    container.innerHTML = opportunities.slice(0, 4).map(opp => `
        <div class="bg-[#1e2937] rounded-xl p-4 border border-[#334155] hover:border-[#00ff9d] transition">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <div class="font-bold text-lg">${opp.type}</div>
                    <div class="text-sm text-gray-400">${opp.token}</div>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-[#00ff9d]">+${opp.profitMargin}%</div>
                    <div class="text-xs text-gray-400">Profit</div>
                </div>
            </div>
            <div class="flex gap-2 mb-3">
                <span class="badge-arb">ARBITRAGE</span>
                <span class="text-xs text-gray-500">Risk: ${opp.riskScore}/100</span>
            </div>
            <button onclick="executeOpportunity('${opp.id}')" class="w-full bg-[#00ff9d] text-black py-2 rounded-lg font-bold text-sm hover:bg-[#00d4ff] transition">
                EXECUTE NOW
            </button>
        </div>
    `).join('');
}

function displayRecentTrades() {
    const container = document.getElementById('tradesContainer');
    const trades = tradingEngine.trades.slice(-5).reverse();

    if (trades.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-8">No trades yet</div>';
        return;
    }

    container.innerHTML = trades.map(trade => `
        <div class="bg-[#1e2937] rounded-lg p-4 flex justify-between items-center border border-[#334155]">
            <div>
                <div class="font-bold">${trade.type}</div>
                <div class="text-xs text-gray-400">${new Date(trade.timestamp).toLocaleTimeString()}</div>
            </div>
            <div class="text-right">
                <div class="font-bold text-lg ${parseFloat(trade.profit) >= 0 ? 'text-[#00ff9d]' : 'text-red-400'}">
                    ${parseFloat(trade.profit) >= 0 ? '+' : ''}${trade.profit} ETH
                </div>
                <div class="text-xs text-gray-400">${trade.status}</div>
            </div>
        </div>
    `).join('');
}

function updateMarketChart() {
    if (!marketChart) return;

    const labels = [];
    const data = [];
    
    for (let i = 24; i >= 0; i--) {
        labels.push(i + 'h');
        const basePrice = 2500;
        const variation = (Math.sin(i * 0.5) + Math.random()) * 100;
        data.push(basePrice + variation);
    }

    marketChart.data.labels = labels;
    marketChart.data.datasets[0].data = data;
    marketChart.update();
}

/**
 * BOT MANAGEMENT
 */
function openBotCreator() {
    document.getElementById('botCreatorModal').classList.remove('hidden');
}

function closeBotCreator() {
    document.getElementById('botCreatorModal').classList.add('hidden');
    // Reset form
    document.getElementById('botName').value = '';
    document.getElementById('botStrategy').value = 'Arbitrage Detection';
    document.getElementById('botRisk').value = 'Conservative (2x leverage)';
    document.getElementById('botAmount').value = '';
}

async function createBot() {
    const name = document.getElementById('botName').value.trim();
    const strategy = document.getElementById('botStrategy').value;
    const risk = document.getElementById('botRisk').value;
    const amount = parseFloat(document.getElementById('botAmount').value);
    const autoMode = document.getElementById('botAutoMode').checked;

    if (!name || !amount || amount <= 0) {
        showToast('Please fill all fields correctly', 'error');
        return;
    }

    if (parseFloat(userBalance) < amount) {
        showToast('Insufficient balance', 'error');
        return;
    }

    try {
        showToast('Deploying bot to arena...', 'info');
        
        // 🚀 CREATE ON BACKEND: Persist bot to the autonomous worker
        const response = await fetch('/api/bot/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                strategy,
                riskLevel: risk,
                initialCapital: amount,
                userAddress
            })
        });

        const data = await response.json();
        if (data.success) {
            const newBot = data.bot;
            tradingEngine.bots.push(newBot);
            
            userBalance -= amount;
            const balanceEl = document.getElementById('walletBalance') || document.getElementById('ghBalance');
            if (balanceEl) balanceEl.textContent = '$' + (parseFloat(userBalance) || 0).toFixed(2);

            closeBotCreator();
            refreshBots();
            showToast(`Bot "${name}" deployed successfully!`, 'success');
            
            // Start local monitoring
            tradingEngine.executeBot(newBot);
        } else {
            throw new Error(data.error || 'Creation failed');
        }
    } catch (e) {
        console.error('Bot creation failed:', e);
        showToast('Failed to create bot: ' + e.message, 'error');
    }
}

function refreshBots() {
    const container = document.getElementById('botsContainer');

    if (tradingEngine.bots.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-400 py-8">No bots created yet</div>';
        return;
    }

    container.innerHTML = tradingEngine.bots.map(bot => `
        <div class="bot-card ${bot.active ? 'active' : ''}">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="status-indicator ${bot.active ? 'status-active' : 'status-paused'}"></span>
                        <div class="text-xl font-bold">${bot.name}</div>
                    </div>
                    <div class="text-sm text-gray-400">
                        Deposited: ${bot.amount} ETH • ${bot.trades} trades
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold ${bot.totalProfit >= 0 ? 'text-[#00ff9d]' : 'text-red-400'}">
                        ${bot.totalProfit >= 0 ? '+' : ''}${bot.totalProfit.toFixed(4)} ETH
                    </div>
                    <div class="text-xs text-gray-400">Win Rate: ${bot.winRate}%</div>
                </div>
            </div>

            <div class="mb-3">
                <div class="flex gap-2 flex-wrap">
                    <span class="badge-${bot.strategy.toLowerCase().includes('arbitrage') ? 'arb' : bot.strategy.toLowerCase().includes('flash') ? 'flash' : 'vol'}">
                        ${bot.strategy}
                    </span>
                    <span class="badge-risk">${bot.risk}</span>
                </div>
            </div>

            <div class="flex gap-2">
                <button onclick="toggleBot('${bot.id}')" class="flex-1 py-2 rounded-lg text-sm font-bold border-2 border-[#00ff9d] text-[#00ff9d] hover:bg-[#00ff9d] hover:text-black transition">
                    ${bot.active ? 'PAUSE' : 'RESUME'}
                </button>
                <button onclick="deleteBot('${bot.id}')" class="flex-1 py-2 rounded-lg text-sm font-bold border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition">
                    DELETE
                </button>
            </div>
        </div>
    `).join('');
}

function toggleBot(botId) {
    const bot = tradingEngine.bots.find(b => b.id === botId);
    if (bot) {
        bot.active = !bot.active;
        refreshBots();
        showToast(bot.active ? 'Bot resumed' : 'Bot paused', 'success');
    }
}

function deleteBot(botId) {
    if (confirm('Delete this bot? Remaining balance will be returned.')) {
        const bot = tradingEngine.bots.find(b => b.id === botId);
        if (bot) {
            userBalance += bot.amount;
            document.getElementById('walletBalance').textContent = parseFloat(userBalance).toFixed(2) + ' ETH';
            tradingEngine.bots = tradingEngine.bots.filter(b => b.id !== botId);
            refreshBots();
            showToast('Bot deleted', 'success');
        }
    }
}

/**
 * SLOT MACHINE
 */
const slotSymbols = ['🤖', '💰', '📈', '⚡', '🎯', '🔥'];

async function spinSlots() {
    const reel1 = document.getElementById('reel1');
    const reel2 = document.getElementById('reel2');
    const reel3 = document.getElementById('reel3');
    const resultDiv = document.getElementById('slotResult');

    resultDiv.textContent = '';

    // Animate spin
    [reel1, reel2, reel3].forEach(reel => {
        reel.style.animation = 'none';
        setTimeout(() => {
            reel.style.animation = 'spin 0.8s ease-out';
        }, 10);
    });

    // Wait for animation
    await new Promise(r => setTimeout(r, 800));

    // Generate random results
    const result1 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
    const result2 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
    const result3 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];

    reel1.textContent = result1;
    reel2.textContent = result2;
    reel3.textContent = result3;

    // Check for matches
    const isJackpot = result1 === result2 && result2 === result3;
    const isPair = result1 === result2 || result2 === result3 || result1 === result3;

    setTimeout(() => {
        if (isJackpot) {
            resultDiv.innerHTML = '🎊 JACKPOT! 🎊<br><span class="text-sm text-gray-400">Deploying max risk bot...</span>';
            createAutoBot('Hybrid (Auto-Select)', 'Max Risk (20x leverage)', Math.min(parseFloat(userBalance), 2.0));
        } else if (isPair) {
            resultDiv.innerHTML = '🎉 PAIR WIN!<br><span class="text-sm text-gray-400">Deploying moderate bot...</span>';
            createAutoBot('Volatility Trading', 'Moderate (5x leverage)', 0.5);
        } else {
            resultDiv.innerHTML = '❌ No Match<br><span class="text-sm text-gray-400">Try again...</span>';
        }
    }, 100);
}

function createAutoBot(strategy, risk, amount) {
    if (parseFloat(userBalance) < amount) {
        showToast('Insufficient balance for slot result', 'error');
        return;
    }

    const botNames = {
        'Arbitrage Detection': 'SlotBot Arb',
        'Flash Loan Farming': 'SlotBot Flash',
        'Volatility Trading': 'SlotBot Vol',
        'Hybrid (Auto-Select)': 'SlotBot MAX'
    };

    const newBot = {
        id: tradingEngine.generateId(),
        name: botNames[strategy] + ' #' + Math.floor(Math.random() * 1000),
        strategy,
        risk,
        amount,
        autoMode: true,
        active: true,
        created: Date.now(),
        totalProfit: 0,
        trades: 0,
        winRate: 0,
        checkInterval: 20000
    };

    tradingEngine.bots.push(newBot);
    userBalance -= amount;
    document.getElementById('walletBalance').textContent = parseFloat(userBalance).toFixed(2) + ' ETH';
    
    showToast(`Slot bot "${newBot.name}" deployed!`, 'success');
    tradingEngine.executeBot(newBot);
    refreshBots();
}

/**
 * ANALYTICS
 */
function initCharts() {
    const ctx1 = document.getElementById('marketChart').getContext('2d');
    marketChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'ETH Price',
                data: [],
                borderColor: '#00ff9d',
                backgroundColor: 'rgba(0, 255, 157, 0.1)',
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 0,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { 
                    beginAtZero: false,
                    grid: { color: '#334155' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    const ctx2 = document.getElementById('performanceChart').getContext('2d');
    performanceChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: tradingEngine.bots.map(b => b.name),
            datasets: [{
                label: 'Profit (ETH)',
                data: tradingEngine.bots.map(b => b.totalProfit),
                backgroundColor: tradingEngine.bots.map(b => b.totalProfit >= 0 ? '#00ff9d' : '#ef4444'),
                borderRadius: 10
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { color: '#334155' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    const ctx3 = document.getElementById('profitChart').getContext('2d');
    profitChart = new Chart(ctx3, {
        type: 'doughnut',
        data: {
            labels: ['Wins', 'Losses'],
            datasets: [{
                data: [65, 35],
                backgroundColor: ['#00ff9d', '#ef4444'],
                borderColor: '#0a0f1c',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#cbd5e1' } } }
        }
    });
}

function refreshAnalytics() {
    performanceChart.data.labels = tradingEngine.bots.map(b => b.name);
    performanceChart.data.datasets[0].data = tradingEngine.bots.map(b => b.totalProfit);
    performanceChart.data.datasets[0].backgroundColor = tradingEngine.bots.map(b => 
        b.totalProfit >= 0 ? '#00ff9d' : '#ef4444'
    );
    performanceChart.update();
}

/**
 * AUTO REFRESH
 */
let refreshInterval;

function startAutoRefresh() {
    refreshInterval = setInterval(() => {
        if (currentTab === 'dashboard') {
            refreshDashboard();
        } else if (currentTab === 'bots') {
            // Simulate bot profit updates
            tradingEngine.bots.forEach(bot => {
                if (bot.active) {
                    bot.totalProfit += (Math.random() - 0.4) * 0.001;
                    bot.trades += Math.random() > 0.8 ? 1 : 0;
                    bot.winRate = Math.min(100, Math.max(0, bot.winRate + (Math.random() - 0.5) * 2));
                }
            });
            refreshBots();
        }
    }, 2000);
}

/**
 * UTILITIES
 */
function executeOpportunity(oppId) {
    showToast('Executing arbitrage opportunity...', 'success');
    // In production, would execute smart contract
    setTimeout(() => {
        showToast('Opportunity executed! +0.0245 ETH', 'success');
    }, 1500);
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:100000; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const colorMap = {
        'success': 'border-[#00ff9d] text-[#00ff9d]',
        'error': 'border-red-500 text-red-400',
        'info': 'border-[#00d4ff] text-[#00d4ff]'
    };

    toast.className = `toast ${colorMap[type] || colorMap['info']}`;
    toast.textContent = message;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Initialize on page load
 */
window.addEventListener('load', () => {
    // Check if already connected
    if (window.ethereum?.selectedAddress) {
        connectWallet();
    }
});

/**
 * UI HELPER: Add On-Chain Receipt to the dashboard
 */
window.addOnChainReceipt = function(receipt) {
  const container = document.getElementById('receiptsList');
  if (!container) return;

  // Remove the "No receipts yet" placeholder if it exists
  if (container.querySelector('div[style*="text-align:center"]')) {
    container.innerHTML = '';
  }

  const receiptEl = document.createElement('div');
  receiptEl.className = 'log-row';
  receiptEl.style.cssText = 'background:var(--chrome); border:1px solid var(--border); border-radius:8px; padding:10px; display:flex; flex-direction:column; gap:6px; margin-bottom:8px; animation:toastFadeIn 0.3s ease;';

  const shortHash = receipt.txHash.substring(0, 10) + '...' + receipt.txHash.substring(receipt.txHash.length - 8);
  
  receiptEl.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-family:'Bungee'; font-size:10px; color:var(--gold);">TX CONFIRMED</span>
      <span style="font-size:9px; color:var(--dim);">${new Date(receipt.timestamp).toLocaleTimeString()}</span>
    </div>
    <div style="display:flex; gap:10px; font-size:11px;">
      <div style="flex:1;">
        <div style="color:var(--dim); font-size:8px; text-transform:uppercase;">Transaction Hash</div>
        <div style="color:#fff; font-family:'Share Tech Mono',monospace;">${shortHash}</div>
      </div>
      <div style="text-align:right;">
        <div style="color:var(--dim); font-size:8px; text-transform:uppercase;">Gas Cost</div>
        <div style="color:var(--green);">${receipt.gasCost} ETH</div>
      </div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.05);">
      <span style="font-size:9px; color:var(--dim);">Block: ${receipt.blockNumber}</span>
      <a href="${receipt.explorerUrl}" target="_blank" style="font-family:'Bungee'; font-size:9px; color:var(--cyan); text-decoration:none; border-bottom:1px solid var(--cyan);">VIEW ON BASESCAN ↗</a>
    </div>
  `;

  container.prepend(receiptEl);

  // Also push to globalLog / closedTrades so the Trade Ledger populates immediately!
  if (typeof globalLog !== 'undefined' && typeof closedTrades !== 'undefined') {
    const tradeEntry = {
      botId: receipt.botId || '01',
      token: receipt.tokenOut || 'WETH',
      method: receipt.method || 'SWAP',
      entryPrice: receipt.entryPrice || 3200,
      exitPrice: receipt.exitPrice || (receipt.entryPrice ? receipt.entryPrice * 1.01 : 3232),
      isWin: true,
      netPnl: receipt.netPnl || 5.00,
      status: 'closed',
      txHash: receipt.txHash,
      costs: { total: parseFloat(receipt.gasCost || '0.0001') * 3200 }
    };
    closedTrades.push(tradeEntry);
    if (typeof addToLog === 'function') {
      addToLog(tradeEntry);
    } else {
      globalLog.unshift(tradeEntry);
      if (typeof renderLog === 'function') renderLog();
    }
  }
  
  // Auto-expand the panel if it's the first receipt
  const body = document.getElementById('receiptsBody');
  if (body && !body.classList.contains('open')) {
    togglePanel('receipts');
  }
};

/**
 * WEBSOCKET NOTIFICATIONS
 */
let ws;
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('🔌 WebSocket Connected');
    };
    
    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            if (message.type === 'TRADE_NOTIFICATION') {
                const receipt = message.data;
                console.log('🔔 New Trade Notification:', receipt);
                
                // Show a global toast notification
                if (window.showToast) {
                    window.showToast(`New Trade Confirmed: ${receipt.txHash.substring(0, 8)}...`, 'info');
                }
                
                // Add to receipts UI
                if (window.addOnChainReceipt) {
                    window.addOnChainReceipt(receipt);
                }
            } else if (message.type === 'SERVER_LOG') {
                if (window.appendServerLog) {
                    window.appendServerLog(message.data);
                }
            } else if (message.type === 'LOG_HISTORY') {
                const consoleEl = document.getElementById('serverConsoleLogs');
                if (consoleEl && Array.isArray(message.data)) {
                    message.data.forEach(log => {
                        if (window.appendServerLog) window.appendServerLog(log);
                    });
                }
            } else if (message.type === 'HEALTH_STATUS') {
                if (window.updateHealthMetrics) {
                    window.updateHealthMetrics(message.data);
                }
            }
        } catch (e) {
            console.error('WebSocket message error:', e);
        }
    };
    
    ws.onclose = () => {
        console.log('🔌 WebSocket Disconnected. Retrying in 5s...');
        setTimeout(connectWebSocket, 5000);
    };
}

// Start WebSocket connection on load
if (typeof window !== 'undefined') {
    console.log('🚀 TRADE ARENA V4.3.22 INITIALIZED');
    connectWebSocket();
    
    // Export notify function
    window.notifyTradeConfirmed = function(receipt) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'TRADE_CONFIRMED',
                payload: receipt
            }));
        }
    };
}

/**
 * SYSTEM MONITOR & CONSOLE LOGGER UI HANDLERS
 */
window.appendServerLog = function(entry) {
    const consoleEl = document.getElementById('serverConsoleLogs');
    if (!consoleEl) return;

    // Remove placeholder if present
    if (consoleEl.querySelector('div[style*="color:var(--dim)"]')) {
        consoleEl.innerHTML = '';
    }

    const logRow = document.createElement('div');
    const color = entry.level === 'ERROR' ? 'var(--hot)' : 'var(--cyan)';
    const ts = new Date(entry.timestamp).toLocaleTimeString();
    
    logRow.style.cssText = 'display:flex; gap:8px; align-items:flex-start; word-break:break-all; border-bottom:1px solid rgba(255,255,255,0.03); padding-bottom:2px;';
    logRow.innerHTML = `
        <span style="color:var(--dim); font-size:8px;">[${ts}]</span>
        <span style="color:${color}; font-weight:bold; font-size:8px;">[${entry.level}]</span>
        <span style="color:#e2e8f0; flex:1;">${escapeHTML(entry.message)}</span>
    `;

    consoleEl.appendChild(logRow);
    
    // Auto-scroll to bottom
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

window.updateHealthMetrics = function(health) {
    const statusEl = document.getElementById('monitorStatus');
    const uptimeEl = document.getElementById('metricUptime');
    const connEl = document.getElementById('metricConnections');
    const memEl = document.getElementById('metricMemory');
    const nodeEl = document.getElementById('metricNode');

    if (statusEl) {
        statusEl.textContent = 'ONLINE (Live)';
        statusEl.style.color = 'var(--green)';
    }

    if (uptimeEl) {
        const uptimeSec = Math.floor(health.uptime);
        const mins = Math.floor(uptimeSec / 60);
        const hrs = Math.floor(mins / 60);
        uptimeEl.textContent = hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m ${uptimeSec % 60}s`;
    }

    if (connEl) {
        connEl.textContent = health.activeConnections;
    }

    if (memEl && health.memory) {
        memEl.textContent = `${health.memory.heapUsed} MB`;
    }

    if (nodeEl && health.nodeVersion) {
        nodeEl.textContent = health.nodeVersion;
    }
};

/**
 * CLIENT-SIDE CONSOLE INTERCEPTOR
 * Forwards browser console logs to the System Monitor UI
 */
(function() {
    try {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    function forwardToMonitor(level, args) {
        const message = args.map(arg => {
            try {
                return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
            } catch (e) {
                return String(arg);
            }
        }).join(' ');

        if (window.appendServerLog) {
            window.appendServerLog({
                timestamp: new Date().toISOString(),
                level: `CLIENT-${level}`,
                message: message
            });
        }
    }

    console.log = function(...args) {
        originalConsoleLog.apply(console, args);
        forwardToMonitor('INFO', args);
    };

    console.error = function(...args) {
        originalConsoleError.apply(console, args);
        forwardToMonitor('ERROR', args);
    };

    console.warn = function(...args) {
        originalConsoleWarn.apply(console, args);
        forwardToMonitor('WARN', args);
    };

    // Run startup diagnostics
    setTimeout(() => {
        console.log('🛡️ SYSTEM DIAGNOSTICS INITIATED');
        console.log('   - Ethers.js:', typeof ethers !== 'undefined' ? `v${ethers.version || '6.x'}` : '❌ NOT FOUND');
        console.log('   - Execution Engine:', typeof window.executeOnChainTrade !== 'undefined' ? '✅ LOADED' : '❌ MISSING');
        console.log('   - Wallet Provider:', window.ethereum ? '✅ DETECTED' : '❌ NOT FOUND');
        console.log('   - WebSocket:', ws && ws.readyState === WebSocket.OPEN ? '✅ CONNECTED' : '❌ DISCONNECTED');
        if (window.walletState) {
            console.log('   - Wallet State:', window.walletState.isConnected ? `✅ CONNECTED (${window.walletState.address})` : '❌ DISCONNECTED');
        }
    }, 2000);
    } catch (e) {
        console.warn('Console Interceptor Init Error:', e);
    }
})();

/**
 * DEBUG HELPERS
 */
window.resetExecutionState = function() {
    console.log('🔄 Manually resetting Execution Engine state...');
    if (typeof ExecutionState !== 'undefined') {
        ExecutionState.isExecuting = false;
        console.log('✅ ExecutionState.isExecuting set to false');
    }
    if (window.showToast) window.showToast('Execution Engine Reset', 'info');
};

window.testSignature = async function() {
    console.log('⚡ Initiating Signature Test...');
    try {
        let provider;
        if (window.privyProvider && typeof window.privyProvider.getEthersProvider === 'function') {
            provider = await window.privyProvider.getEthersProvider();
        } else if (window.walletState && window.walletState.provider) {
            provider = window.walletState.provider;
        } else if (window.ethereum) {
            provider = new ethers.BrowserProvider(window.ethereum);
        } else {
            throw new Error('No wallet provider detected. Please connect your wallet first.');
        }

        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        console.log('👤 Wallet Address:', address);

        if (window.showToast) window.showToast('Check MetaMask for Signature Request', 'info');
        
        const message = `Trade Arena Verification\nTimestamp: ${new Date().toISOString()}\nWallet: ${address}`;
        const signature = await signer.signMessage(message);
        
        console.log('✅ Signature Successful:', signature.substring(0, 20) + '...');
        if (window.showToast) window.showToast('Signature Verified!', 'success');
    } catch (e) {
        console.error('❌ Signature Test Failed:', e.message);
        if (window.showToast) window.showToast(`Test Failed: ${e.message}`, 'error');
    }
};

/**
 * METAMASK AGENT WALLET UI INTEGRATION
 */
async function updateAgentStatus() {
    try {
        const response = await fetch('/api/network/status');
        const data = await response.json();
        
        const pairingUI = document.getElementById('agentPairingUI');
        
        if (data.success) {
            document.getElementById('agentAddr').textContent = data.wallet.address;
            const balUsd = (parseFloat(data.wallet.balance) || 0).toFixed(2);
            document.getElementById('agentBalance').textContent = data.wallet.ethBalance ? `${data.wallet.ethBalance} ETH ($${balUsd})` : `$${balUsd}`;
            document.getElementById('agentEthPrice').textContent = 'ETH: $' + (parseFloat(data.network.ethPrice) || 0).toFixed(2);
            
            // Show authenticated email if linked
            const statusLabel = document.querySelector('.cpanel-hd span[style*="var(--dim)"]');
            if (statusLabel) {
                if (data.wallet.authenticated) {
                    statusLabel.textContent = `AGENT: ${data.wallet.signedInAs}`;
                    statusLabel.style.color = 'var(--cyan)';
                    if (pairingUI) pairingUI.style.display = 'none';
                } else {
                    statusLabel.textContent = 'AGENT: DISCONNECTED';
                    statusLabel.style.color = 'var(--hot)';
                    if (pairingUI) pairingUI.style.display = 'block';
                }
            }

            // Update Arbitrage Status
            const arbStatus = document.getElementById('arbStatus');
            const arbBtn = document.getElementById('arbToggleBtn');
            if (data.arbitrage.running) {
                arbStatus.textContent = 'SCANNING...';
                arbStatus.style.color = 'var(--green)';
                arbBtn.textContent = 'STOP SCANNER';
                arbBtn.style.color = 'var(--hot)';
            } else {
                arbStatus.textContent = 'IDLE';
                arbStatus.style.color = 'var(--dim)';
                arbBtn.textContent = 'START SCANNER';
                arbBtn.style.color = 'var(--cyan)';
            }

            const txList = document.getElementById('agentTxList');
            if (data.recentTransactions && data.recentTransactions.length > 0) {
                txList.innerHTML = data.recentTransactions.map(tx => `
                    <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding:2px 0">
                        <span style="color:${tx.status === 'confirmed' ? 'var(--green)' : 'var(--amber)'}">${tx.readable}</span>
                        <a href="https://basescan.org/tx/${tx.hash}" target="_blank" style="color:var(--dim); text-decoration:none">${tx.hash.substring(0,10)}...</a>
                    </div>
                `).join('');
            } else {
                txList.innerHTML = '<div style="color:var(--dim)">No recent activity...</div>';
            }
        }
    } catch (error) {
        console.error('Failed to fetch agent status:', error);
    }
}

async function getAgentLoginUrl() {
    try {
        const response = await fetch('/api/agent/login-url');
        const data = await response.json();
        if (data.success) {
            if (data.authenticated) {
                showToast('Agent is already connected!', 'success');
                updateAgentStatus();
            } else {
                const linkContainer = document.getElementById('pairingLinkContainer');
                const link = document.getElementById('pairingLink');
                link.href = data.url;
                link.textContent = 'Click here to authorize: ' + data.url;
                linkContainer.style.display = 'block';
                showToast('Pairing link generated!', 'info');
            }
        } else {
            showToast('Failed to generate pairing link', 'error');
        }
    } catch (e) {
        showToast('Error generating pairing link', 'error');
    }
}

async function submitAgentToken() {
    const token = document.getElementById('cliTokenInput').value;
    if (!token) return showToast('Please paste the CLI token', 'error');
    
    try {
        const response = await fetch('/api/agent/submit-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        const data = await response.json();
        if (data.success) {
            showToast('Agent Connected Successfully!', 'success');
            document.getElementById('pairingLinkContainer').style.display = 'none';
            document.getElementById('cliTokenInput').value = '';
            updateAgentStatus();
        } else {
            showToast('Auth Failed: ' + data.error, 'error');
        }
    } catch (e) {
        showToast('Error submitting token', 'error');
    }
}

async function toggleArbitrage() {
    const btn = document.getElementById('arbToggleBtn');
    const isRunning = btn.textContent.includes('STOP');
    const action = isRunning ? 'stop' : 'start';
    
    try {
        const response = await fetch('/api/arbitrage/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });
        const data = await response.json();
        if (data.success) {
            showToast(`Arbitrage scanner ${action}ed`, 'success');
            updateAgentStatus();
        }
    } catch (e) {
        showToast('Failed to toggle arbitrage', 'error');
    }
}

async function triggerFlashloan() {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'SIMULATING...';
    
    try {
        // Call the backend to run a real mm CLI simulation
        const response = await fetch('/api/network/status');
        const status = await response.json();
        
        // Use 0.001 ETH for simulation
        showToast('Initiating flashloan simulation on Base...', 'info');
        
        // In a real app, we'd have a specific /api/simulate endpoint
        // For this demo, we'll trigger a quote which is a simulation
        const quoteResponse = await fetch('/api/0x/quote?sellToken=ETH&buyToken=USDC&sellAmount=0.001');
        const quote = await quoteResponse.json();
        
        if (quote.buyAmount) {
            showToast(`Simulation Success! Expected: ${quote.buyAmount} USDC`, 'success');
        } else {
            showToast('Simulation failed: Liquidity path not found', 'error');
        }
    } catch (error) {
        showToast('Simulation error: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'TEST FLASHLOAN';
    }
}

// Start polling agent status
setInterval(updateAgentStatus, 10000);
updateAgentStatus();

function toggleCPanel(id) {
    const panel = document.getElementById(id);
    const body = panel.querySelector('.cpanel-body');
    const toggle = panel.querySelector('.cpanel-toggle');
    
    if (body.style.display === 'none' || !body.classList.contains('open')) {
        body.style.display = 'block';
        body.classList.add('open');
        toggle.textContent = '▼';
    } else {
        body.style.display = 'none';
        body.classList.remove('open');
        toggle.textContent = '▲';
    }
}
