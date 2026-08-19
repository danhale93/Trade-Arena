/**
 * MoonPay Fiat On-Ramp Integration
 * Converts fiat → USDC on Base without user seeing blockchain complexity
 * 
 * Setup:
 * 1. Sign up at https://www.moonpay.com
 * 2. Get API keys from dashboard
 * 3. Configure webhook for deposit notifications
 */

const MOONPAY_CONFIG = {
    // MoonPay test key for development
    apiKey: 'pk_test_5rdSBYM23wRwK1L3icX9RqYdypJ6jGEC',
    // Base mainnet
    network: 'base',
    // USDC on Base
    cryptoCurrency: 'usdc',
    // USD fiat
    fiatCurrency: 'usd',
    // Default deposit amount
    defaultAmount: 50,
    // Network fee (transparent to user)
    networkFee: 1.50,
};

// MoonPay state
let moonpaySession = null;
let pendingDeposit = null;

/**
 * Initialize MoonPay
 */
function moonpayInit() {
    console.log('[MoonPay] Initializing...');
    
    // Load MoonPay SDK if available
    loadMoonPayScript();
    
    return {
        isConfigured: !!MOONPAY_CONFIG.apiKey && !MOONPAY_CONFIG.apiKey.startsWith('YOUR_'),
        defaultAmount: MOONPAY_CONFIG.defaultAmount,
        networkFee: MOONPAY_CONFIG.networkFee,
    };
}

/**
 * Load MoonPay widget script
 */
async function loadMoonPayScript() {
    return new Promise((resolve) => {
        if (window.MoonPayWidget) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.moonpay.com/widget/v2.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            console.warn('[MoonPay] Failed to load widget SDK');
            resolve();
        };
        document.head.appendChild(script);
    });
}

/**
 * Open MoonPay buy widget
 * Pre-configured for USDC on Base
 */
function moonpayBuyCrypto(walletAddress, amount) {
    console.log('[MoonPay] Opening buy widget...', { walletAddress, amount });
    
    const addr = walletAddress || getPrivyAddress();
    if (!addr) {
        console.error('[MoonPay] No wallet address');
        showToast('Please sign in first', 'error');
        return;
    }
    
    const buyAmount = amount || MOONPAY_CONFIG.defaultAmount;
    
    // If MoonPay widget SDK is available, use it
    if (window.MoonPayWidget) {
        openMoonPayWidget(addr, buyAmount);
    } else {
        // Fallback: open MoonPay directly
        openMoonPayDirect(addr, buyAmount);
    }
}

/**
 * Open MoonPay widget with SDK
 * @param {number} amount - Amount in USD
 * @param {string} currency - Crypto currency (default: 'usdc')
 */
function openMoonPayWidget(amount, currency = 'usdc') {
    const walletAddress = getPrivyAddress();
    if (!walletAddress) {
        console.error('[MoonPay] No wallet address');
        showToast('Please sign in first', 'error');
        return;
    }
    const widget = new window.MoonPayWidget({
        apiKey: MOONPAY_CONFIG.apiKey,
        currency: currency,
        network: MOONPAY_CONFIG.network,
        amount: amount,
        walletAddress: walletAddress,
        externalTransactionId: generateTransactionId(),
        // Hide blockchain complexity from user
        showWalletAddress: false,
        showNetworkSelector: false,
        redirectURL: window.location.origin,
    });
    
    widget.on('complete', (transaction) => {
        console.log('[MoonPay] Transaction complete:', transaction);
        handleDepositSuccess(transaction);
    });
    
    widget.on('failed', (error) => {
        console.error('[MoonPay] Transaction failed:', error);
        showToast('Deposit failed. Please try again.', 'error');
    });
    
    widget.show();
}

/**
 * Open MoonPay directly (fallback)
 */
function openMoonPayDirect(walletAddress, amount) {
    // Build MoonPay URL with pre-filled params
    const baseUrl = 'https://buy.moonpay.com';
    const params = new URLSearchParams({
        apiKey: MOONPAY_CONFIG.apiKey,
        currency: MOONPAY_CONFIG.cryptoCurrency,
        network: MOONPAY_CONFIG.network,
        walletAddress: walletAddress,
        amount: amount,
        externalTransactionId: generateTransactionId(),
        // Hide complexity
        showBuy: 'true',
        showCheckoutNavigation: 'false',
    });
    
    const url = `${baseUrl}?${params.toString()}`;
    
    // Open in new tab
    window.open(url, '_blank');
    
    // Show pending status
    showPendingDeposit(walletAddress, amount);
}

/**
 * Generate unique transaction ID
 */
function generateTransactionId() {
    return 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Show pending deposit UI
 */
function showPendingDeposit(walletAddress, amount) {
    pendingDeposit = {
        walletAddress,
        amount,
        timestamp: Date.now(),
        status: 'pending',
    };
    
    // Show toast
    showToast(`Deposit ${amount} USDC initiated. Wallet: ${walletAddress.slice(0, 6)}...`, 'info');
    
    // Update UI to show pending
    const statusEl = document.getElementById('loginStatus');
    if (statusEl) {
        statusEl.innerHTML = `💳 Deposit pending... <span style="font-size:9px;color:var(--dim)">Funds will arrive in 5-10 minutes</span>`;
    }
}

/**
 * Handle successful deposit (called from webhook or callback)
 */
function handleDepositSuccess(walletAddress) {
    console.log('[MoonPay] Deposit success!', { walletAddress });
    
    // Get amount from pending deposit
    const amount = pendingDeposit?.amount || MOONPAY_CONFIG.defaultAmount;
    
    // Clear pending
    pendingDeposit = null;
    
    // Show success
    showToast(`✅ ${amount} USDC deposited! Starting bots...`, 'success');
    
    // Update balance
    updateBalanceDisplay(amount);
    
    // Trigger bot deployment
    deployBotsAfterDeposit(amount);
    
    // Update status
    const statusEl = document.getElementById('loginStatus');
    if (statusEl) {
        statusEl.innerHTML = `✅ ${amount} USDC ready to trade!`;
    }
}

/**
 * Get fee breakdown for a given amount
 * @param {number} amount - Deposit amount in USD
 * @returns {Object} Fee breakdown
 */
function getFeeBreakdown(amount) {
    const moonPayFee = amount * 0.035; // 3.5% average
    const networkFee = MOONPAY_CONFIG.networkFee;
    const total = amount + moonPayFee + networkFee;
    
    return {
        baseAmount: amount,
        moonPayFee: moonPayFee,
        networkFee: networkFee,
        total: total,
        moonPayFeePercent: (moonPayFee / amount) * 100
    };
}

/**
 * Update balance display
 */
function updateBalanceDisplay(usdcAmount) {
    const balanceEl = document.getElementById('walletBalance');
    if (balanceEl) {
        balanceEl.textContent = '$' + usdcAmount.toFixed(2);
    }
    
    const ghBalance = document.getElementById('ghBalance');
    if (ghBalance) {
        ghBalance.textContent = '$' + usdcAmount.toFixed(2);
    }
}

/**
 * Deploy bots after successful deposit
 */
function deployBotsAfterDeposit(amount) {
    console.log('[MoonPay] Deploying bots with', amount, 'USDC...');
    
    // Auto-add bot with deposit amount
    if (typeof window.addBot === 'function') {
        window.addBot();
    }
    
    // Auto-start trading
    if (typeof window.globalAutoToggle === 'function') {
        window.globalAutoToggle();
    }
    
    // Navigate to bots tab
    if (typeof window.switchTab === 'function') {
        window.switchTab('bots');
    }
}

/**
 * Get network fee display
 * Transparent to user (not "gas")
 */
function getNetworkFeeDisplay() {
    return '$' + MOONPAY_CONFIG.networkFee.toFixed(2);
}

/**
 * Sell USDC (MoonPay sell widget)
 */
function moonpaySellCrypto(walletAddress, amount) {
    console.log('[MoonPay] Opening sell widget...');
    
    const addr = walletAddress || getPrivyAddress();
    if (!addr) {
        showToast('Please connect wallet first', 'error');
        return;
    }
    
    const baseUrl = 'https://sell.moonpay.com';
    const params = new URLSearchParams({
        apiKey: MOONPAY_CONFIG.apiKey,
        currency: MOONPAY_CONFIG.cryptoCurrency,
        network: MOONPAY_CONFIG.network,
        walletAddress: addr,
        amount: amount,
    });
    
    window.open(`${baseUrl}?${params.toString()}`, '_blank');
}

// Export functions
window.moonpayInit = moonpayInit;
window.moonpayBuyCrypto = moonpayBuyCrypto;
window.moonpaySellCrypto = moonpaySellCrypto;
window.getNetworkFeeDisplay = getNetworkFeeDisplay;
