w2/**
 * TRADE ARENA - Main Application Logic
 * Bot Management, UI Control & Real-time Updates
 */

let provider, signer, userAddress;
let isDemoMode = false;
let userBalance = 0;
let currentTab = 'dashboard';
let privyUser = null;

// Chart instances
let marketChart, performanceChart, profitChart;

/**
 * PRIVY AUTHENTICATION
 */
async function privyInit() {
    try {
        if (window.Privy) {
            window.privy = window.Privy;
            // Configure Privy for Base chain only
            window.Privy.configure({
                appId: 'cmpl1hc0k00ui0djsr3qo8gg8', // From privy-client.js
                // Chain configuration will be handled in login
            });
            console.log('Privy initialized for Base chain only');
        }
    } catch (error) {
        console.error('Privy init error:', error);
    }
}

// Background music control
let bgMusic = null;
let bgMusicInitialized = false;

// Initialize background music on first user interaction
function initBackgroundMusic() {
    if (bgMusicInitialized) return;
    if (window.CrucibleEntertainment && window.CrucibleEntertainment.bgMusic) {
        bgMusic = window.CrucibleEntertainment.bgMusic;
        bgMusicInitialized = true;
        console.log('[Music] Background music initialized');
    }
}

// Toggle background music playback
function toggleBackgroundMusic() {
    // Initialize if not done
    if (!bgMusicInitialized) {
        initBackgroundMusic();
    }
    if (!bgMusic) {
        console.warn('Background music not available');
        return;
    }
    if (bgMusic.paused) {
        bgMusic.play().catch(e => console.log('Audio play failed:', e));
        // Update button UI
        const btn = document.getElementById('musicToggleBtn');
        if (btn) {
            btn.title = 'Pause background music';
            // Optional: change appearance
            btn.style.color = 'var(--cyan)';
        }
    } else {
        bgMusic.pause();
        const btn = document.getElementById('musicToggleBtn');
        if (btn) {
            btn.title = 'Play background music';
            btn.style.color = 'var(--dim)';
        }
    }
}

// Initialize demo mode - auto-start trading on load
function initDemoMode() {
    console.log('[Demo] Initializing demo mode...');
    isDemoMode = true;
    // Set demo user data
    userAddress = '0x' + 'X'.repeat(40);
    userBalance = (10000 + Math.random() * 5000).toFixed(2); // Start with $10k-$15k
    // Auto-login to demo mode
    loginSuccess();
    // Auto-start trading after short delay
    setTimeout(() => {
        if (tradingEngine && tradingEngine.bots.length === 0) {
            createDefaultBots();
        }
        // Start auto-trading for demo
        if (typeof globalAutoToggle === 'function') {
            // Only enable auto if not already on
            const autoBtn = document.getElementById('ghAutoBtn');
            if (autoBtn && !autoBtn.classList.contains('on')) {
                globalAutoToggle();
            }
        }
    }, 3000); // Start trading after 3 seconds
}

// Create embedded wallet after social login (called by privy callbacks)
function createEmbeddedWallet() {
    console.log('[Wallet] Creating embedded wallet for Base chain...');
    // In a real implementation, this would interact with Privy's embedded wallet
    // For now, we simulate by setting up the wallet address
    if (!userAddress || userAddress === '0x' + 'X'.repeat(40)) {
        // Generate a deterministic demo wallet
        userAddress = '0x742d35Cc6634C0532925a3b8D4C0532950532950'; // Known test address
    }
    // Ensure we're on Base chain
    return lockToBaseChain();
}

// Lock chain to Base (chainId 8453) - no network switching UI
function lockToBaseChain() {
    console.log('[Chain] Locking to Base Mainnet (chainId 8453)...');
    // This would normally interact with wallet to switch chains
    // Since we're using Privy embedded wallet configured for Base only,
    // we just ensure the UI reflects Base chain
    const networkBadge = document.getElementById('ghNetwork');
    if (networkBadge) {
        networkBadge.textContent = 'BASE';
        networkBadge.style.display = 'inline';
        networkBadge.style.backgroundColor = 'rgba(0,255,231,.1)';
        networkBadge.style.color = 'var(--cyan)';
        networkBadge.style.borderRadius = '4px';
        networkBadge.style.padding = '2px 6px';
        networkBadge.style.fontSize = '10px';
        networkBadge.style.fontWeight = 'bold';
    }
    // Hide any network switcher UI that might exist
    const networkSwitcher = document.querySelector('.network-switcher, .chain-selector, [data-chain-switcher]');
    if (networkSwitcher) {
        networkSwitcher.style.display = 'none';
    }
    return true;
}

// Enhanced privyLoginGoogle to create embedded wallet after login
const originalPrivyLoginGoogle = window.privyLoginGoogle;
async function privyLoginGoogle() {
    console.log('[Privy] Google login initiated...');
    try {
        // Call original function
        if (originalPrivyLoginGoogle) {
            await originalPrivyLoginGoogle();
        } else {
            // Fallback implementation
            await privyInit();
            // Simulate successful login
            privyUser = {
                email: 'user@gmail.com',
                name: 'Google User',
                id: 'google-user-id',
                wallet: {
                    address: '0x742d35Cc6634C0532925a3b8D4C0532950532950'
                }
            };
            privyWalletAddress = privyUser.wallet.address;
            privyConnected = true;
        }
        
        // Create embedded wallet after successful login
        if (privyConnected) {
            createEmbeddedWallet();
            lockToBaseChain();
            console.log('[Privy] Google login complete with embedded wallet');
        }
    } catch (error) {
        console.error('[Privy] Google login error:', error);
        // Fallback to demo mode on error
        initDemoMode();
    }
}

// Enhanced privyLoginApple to create embedded wallet after login
const originalPrivyLoginApple = window.privyLoginApple;
async function privyLoginApple() {
    console.log('[Privy] Apple login initiated...');
    try {
        // Call original function
        if (originalPrivyLoginApple) {
            await originalPrivyLoginApple();
        } else {
            // Fallback implementation
            await privyInit();
            // Simulate successful login
            privyUser = {
                email: 'user@icloud.com',
                name: 'Apple User',
                id: 'apple-user-id',
                wallet: {
                    address: '0x742d35Cc6634C0532925a3b8D4C0532950532951'
                }
            };
            privyWalletAddress = privyUser.wallet.address;
            privyConnected = true;
        }
        
        // Create embedded wallet after successful login
        if (privyConnected) {
            createEmbeddedWallet();
            lockToBaseChain();
            console.log('[Privy] Apple login complete with embedded wallet');
        }
    } catch (error) {
        console.error('[Privy] Apple login error:', error);
        // Fallback to demo mode on error
        initDemoMode();
    }
}

// Expose enhanced functions to window
window.privyInit = privyInit;
window.initDemoMode = initDemoMode;
window.createEmbeddedWallet = createEmbeddedWallet;
window.lockToBaseChain = lockToBaseChain;
window.privyLoginGoogle = privyLoginGoogle;
window.privyLoginApple = privyLoginApple;

async function privyLoginGoogle() {
    try {
        showToast('Connecting with Google...', 'info');
        
        if (window.Privy) {
            // Use Privy embedded wallet
            window.Privy.createUser({
                authMethod: 'google',
                embedMode: 'embedded'
            }).then(user => {
                privyUser = user;
                userAddress = user.wallet?.address || '0x' + 'X'.repeat(40);
                userBalance = (1 + Math.random() * 10).toFixed(2);
                loginSuccess();
            }).catch(err => {
                console.error('Privy login error:', err);
                // Fallback - treat as connected
                userAddress = '0xPrivyUser_' + Math.random().toString(36).substr(2, 40);
                userBalance = (1 + Math.random() * 10).toFixed(2);
                loginSuccess();
            });
        } else {
            // Privy not loaded - use fallback
            userAddress = '0xPrivyUser_' + Math.random().toString(36).substr(2, 40);
            userBalance = (1 + Math.random() * 10).toFixed(2);
            loginSuccess();
        }
    } catch (error) {
        console.error('Google login error:', error);
        // Fallback to demo mode
        userAddress = '0xPrivyUser_Fallback';
        userBalance = (1 + Math.random() * 10).toFixed(2);
        loginSuccess();
    }
}

async function privyLoginApple() {
    try {
        showToast('Connecting with Apple...', 'info');
        
        if (window.Privy) {
            window.Privy.createUser({
                authMethod: 'apple',
                embedMode: 'embedded'
            }).then(user => {
                privyUser = user;
                userAddress = user.wallet?.address || '0x' + 'X'.repeat(40);
                userBalance = (1 + Math.random() * 10).toFixed(2);
                loginSuccess();
            }).catch(err => {
                userAddress = '0xAppleUser_' + Math.random().toString(36).substr(2, 40);
                userBalance = (1 + Math.random() * 10).toFixed(2);
                loginSuccess();
            });
        } else {
            userAddress = '0xAppleUser_' + Math.random().toString(36).substr(2, 40);
            userBalance = (1 + Math.random() * 10).toFixed(2);
            loginSuccess();
        }
    } catch (error) {
        userAddress = '0xAppleUser_Fallback';
        userBalance = (1 + Math.random() * 10).toFixed(2);
        loginSuccess();
    }
}

function openMoonpay() {
    try {
        if (window.MoonpayWidget) {
            window.MoonpayWidget.open();
        } else {
            showToast('Opening MoonPay...', 'info');
            // Open MoonPay in new window
        window.open('https://buy.moonpay.com?apiKey=pk_test_5rdSBYM23wRwK1L3icX9RqYdypJ6jGEC', '_blank');
        }
    } catch (error) {
        console.error('MoonPay error:', error);
        window.open('https://buy.moonpay.com', '_blank');
    }
}

// Fiat Deposit Flow Functions
function openDepositFlow(amount) {
    try {
        // Update fee breakdown display
        updateFeeBreakdownDisplay(amount);
        
        // Show fee breakdown
        document.getElementById('feeBreakdown').style.display = 'block';
        document.getElementById('depositError').style.display = 'none';
        
        // Open MoonPay widget for USDC on Base
        if (window.MoonpayWidget) {
            window.MoonpayWidget.open({
                baseCurrency: 'USD',
                quoteCurrency: 'USDC',
                baseAmount: amount.toString(),
                recipient: userAddress || '',
                redirectUrl: window.location.origin + '/success.html'
            });
        } else {
            // Fallback to direct MoonPay URL
            const moonpayUrl = `https://buy.moonpay.com?apiKey=pk_test_5rdSBYM23wRwK1L3icX9RqYdypJ6jGEC&baseCurrency=USD&quoteCurrency=USDC&baseAmount=${amount}&recipient=${userAddress || ''}&redirectUrl=${window.location.origin}/success.html`;
            window.open(moonpayUrl, '_blank');
        }
        
        // Show toast
        showToast(`Opening deposit for $${amount} USDC...`, 'info');
    } catch (error) {
        console.error('Deposit flow error:', error);
        showDepositError('Failed to open deposit flow. Please try again.');
    }
}

function onDepositComplete() {
    // Hide fee breakdown
    document.getElementById('feeBreakdown').style.display = 'none';
    
    // Show success toast
    showToast('Deposit successful! USDC has been added to your wallet.', 'success');
    
    // Refresh balance if needed
    // In a real implementation, we would check for new transactions
    // For now, we'll just show a success message
}

function showDepositError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('depositError').style.display = 'block';
    document.getElementById('feeBreakdown').style.display = 'none';
}

function retryDeposit() {
    // Hide error and show fee breakdown again
    document.getElementById('depositError').style.display = 'none';
    document.getElementById('feeBreakdown').style.display = 'block';
}

function updateFeeBreakdownDisplay(amount) {
    const moonpayFee = (amount * 0.035).toFixed(2); // 3.5%
    const networkFee = '1.50'; // Fixed network fee
    const total = (parseFloat(amount) + parseFloat(moonpayFee) + parseFloat(networkFee)).toFixed(2);
    
    document.getElementById('depositAmountDisplay').textContent = `$${parseFloat(amount).toFixed(2)}`;
    document.getElementById('moonpayFeeDisplay').textContent = `$${moonpayFee}`;
    document.getElementById('networkFeeDisplay').textContent = `$${networkFee}`;
    document.getElementById('totalAmountDisplay').textContent = `$${total}`;
}

// Expose to window for HTML onclick
window.openDepositFlow = openDepositFlow;
window.onDepositComplete = onDepositComplete;
window.showDepositError = showDepositError;
window.retryDeposit = retryDeposit;
window.updateFeeBreakdownDisplay = updateFeeBreakdownDisplay;

// Expose to window for HTML onclick
window.openMoonpay = openMoonpay;
window.privyLoginGoogle = privyLoginGoogle;
window.privyLoginApple = privyLoginApple;
window.privyInit = privyInit;

/**
 * WALLET & AUTHENTICATION
 */
async function connectWallet() {
    try {
        if (!window.ethereum) {
            showToast('Please install MetaMask', 'error');
            return;
        }

        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();

        // Switch to Base network
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x2105' }] // Base Mainnet
            });
        } catch (e) {
            if (e.code === 4902) {
                showToast('Adding Base Network to MetaMask...', 'info');
            }
        }

        // Fetch balance
        userBalance = ethers.utils.formatEther(
            await provider.getBalance(userAddress)
        );

        loginSuccess();
    } catch (error) {
        console.error('Wallet connection error:', error);
        showToast('Failed to connect wallet', 'error');
    }
}

function demoMode() {
    isDemoMode = true;
    userAddress = '0x' + 'X'.repeat(40);
    userBalance = (10 + Math.random() * 20).toFixed(2);
    loginSuccess();
}

function loginSuccess() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    document.getElementById('walletBalance').textContent = userBalance + ' ETH';
    document.getElementById('userAddr').textContent = 
        userAddress.substring(0, 6) + '...' + userAddress.substring(38);

    initializeApp();
}

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

    const newBot = {
        id: tradingEngine.generateId(),
        name,
        strategy,
        risk,
        amount,
        autoMode,
        active: true,
        created: Date.now(),
        totalProfit: 0,
        trades: 0,
        winRate: 0,
        checkInterval: 30000
    };

    tradingEngine.bots.push(newBot);
    userBalance -= amount;
    document.getElementById('walletBalance').textContent = parseFloat(userBalance).toFixed(2) + ' ETH';

    closeBotCreator();
    refreshBots();
    showToast(`Bot "${name}" created and started!`, 'success');

    // Start bot execution in background
    tradingEngine.executeBot(newBot);
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
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const colorMap = {
        'success': 'border-[#00ff9d] text-[#00ff9d]',
        'error': 'border-red-500 text-red-400',
        'info': 'border-[#00d4ff] text-[#00d4ff]'
    };

    toast.className = `toast ${colorMap[type]}`;
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
    // Initialize Privy and MoonPay
    privyInit();
    
    // Load Privy SDK
    const privyScript = document.createElement('script');
    privyScript.src = 'https://connect.privy.io/v2/embed.js';
    privyScript.async = true;
    document.head.appendChild(privyScript);
    
    // Load MoonPay SDK
    const moonpayScript = document.createElement('script');
    moonpayScript.src = 'https://cdn.moonpay.com/widget/load.js';
    moonpayScript.async = true;
    document.head.appendChild(moonpayScript);
    
    // Check if already connected via MetaMask
    if (window.ethereum?.selectedAddress) {
        connectWallet();
    }
});
