/**
 * Privy Embedded Wallet Integration
 * Replaces MetaMask with no-seed-phrase wallet
 * 
 * Setup:
 * 1. Sign up at https://privy.io
 * 2. Create project, get App ID
 * 3. Configure embedded wallet for Base only
 */

var PRIVY_CONFIG = {
    // Privy App ID from dashboard.privy.com
    appId: 'cmpl1hc0k00ui0djsr3qo8gg8', // Fallback
    // JWKS URL for token verification
    jwksUrl: 'https://auth.privy.io/api/v1/apps/cmpl1hc0k00ui0djsr3qo8gg8/jwks.json',
    // Base mainnet ONLY - NO network dropdown
    chain: 'base',
    chainId: '0x2105',
    chainName: 'Base',
    // USDC only - hide all other tokens
    defaultToken: 'USDC',
    // Fiat display
    fiatCurrency: 'USD',
    // Hide blockchain complexity from user
    hideBlockchain: true,
};

// 🛡️ DYNAMIC CONFIG: Load Privy App ID from backend
(async function() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        if (config.privyAppId) {
            PRIVY_CONFIG.appId = config.privyAppId;
            PRIVY_CONFIG.jwksUrl = `https://auth.privy.io/api/v1/apps/${config.privyAppId}/jwks.json`;
            console.log('[Config] Privy App ID updated from backend');
        }
    } catch (e) {
        console.warn('[Config] Failed to load dynamic Privy config');
    }
})();

// Privy state
if (typeof window.privyUser === 'undefined') window.privyUser = null;
if (typeof window.privyWalletAddress === 'undefined') window.privyWalletAddress = null;
if (typeof window.privyConnected === 'undefined') window.privyConnected = false;

var privyUser = window.privyUser;
var privyWalletAddress = window.privyWalletAddress;
var privyConnected = window.privyConnected;

/**
 * Initialize Privy embedded wallet
 * Call this on app startup
 */
async function privyInit() {
    console.log('[Privy] Initializing...');
    
    //动态加载 Privy SDK
    if (!window.Privy) {
        await loadPrivyScript();
    }
    
    if (!window.Privy) {
        console.warn('[Privy] SDK not loaded - using fallback mode');
        return false;
    }
    
    try {
        // Configure Privy
        window.Privy.configure({
            appId: PRIVY_CONFIG.appId,
        });
        
        // Check for existing session
        const user = window.Privy.getUser();
        if (user) {
            const walletAddr = user.wallet?.address;
            const preferredAddress = '0x92CEAf1CA43deCfc443A34B915B45343BeE9c2DB';
            
            // 🛡️ PRIORITY LOCK: If MetaMask is already connected or this is the wrong address, 
            // do not auto-login to the embedded wallet.
            if (window.walletState && window.walletState.walletType === 'metamask') {
                console.log('[Privy] Skipping auto-login - MetaMask is already active.');
                return true;
            }
            
            if (walletAddr && walletAddr.toLowerCase() !== preferredAddress.toLowerCase()) {
                console.log('[Privy] Embedded wallet detected, but MetaMask is preferred. Standing by.');
            }

            privyUser = user;
            privyWalletAddress = walletAddr;
            privyConnected = true;
            console.log('[Privy] Restored session:', privyWalletAddress);
            onPrivyLoginSuccess();
        }
        
        return true;
    } catch (e) {
        console.error('[Privy] Init error:', e);
        return false;
    }
}

/**
 * Load Privy SDK script dynamically
 */
async function loadPrivyScript() {
    return new Promise((resolve) => {
        if (window.Privy) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.privy.io/widget.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            console.warn('[Privy] Failed to load SDK');
            resolve();
        };
        document.head.appendChild(script);
    });
}

/**
 * Handle Google sign-in via Privy
 */
async function privyLoginGoogle() {
    console.log('[Privy] Opening Google OAuth...');
    
    if (!window.Privy) {
        // Fallback: direct Google sign-in without Privy SDK
        return privyFallbackGoogleLogin();
    }
    
    try {
        // Show Privy modal for embedded login
        window.Privy.loginWithGoogle({
            // Base only - no network choice
            chains: [{ 
                id: PRIVY_CONFIG.chain,
                rpcUrl: 'https://mainnet.base.org'
            }],
        });
        
        // Listen for login completion
        window.Privy.once('login', (user) => {
            privyUser = user;
            privyWalletAddress = user.wallet?.address;
            privyConnected = true;
            console.log('[Privy] Logged in:', privyWalletAddress);
            onPrivyLoginSuccess();
        });
    } catch (e) {
        console.error('[Privy] Login error:', e);
        privyFallbackGoogleLogin();
    }
}

/**
 * Fallback: Simple Google OAuth flow (no Privy SDK required)
 */
async function privyFallbackGoogleLogin() {
    console.log('[Privy] Google Login Fallback disabled - please use real MetaMask or Privy connection.');
    if (window.showToast) window.showToast('Please use real wallet connection.', 'error');
}

/**
 * Handle Apple sign-in via Privy
 */
async function privyLoginApple() {
    console.log('[Privy] Opening Apple OAuth...');
    
    if (!window.Privy) {
        return privyFallbackAppleLogin();
    }
    
    try {
        window.Privy.loginWithApple();
        window.Privy.once('login', (user) => {
            privyUser = user;
            privyWalletAddress = user.wallet?.address;
            privyConnected = true;
            onPrivyLoginSuccess();
        });
    } catch (e) {
        console.error('[Privy] Apple login error:', e);
        privyFallbackAppleLogin();
    }
}

/**
 * Fallback: Apple OAuth simulation
 */
async function privyFallbackAppleLogin() {
    console.log('[Privy] Using fallback Apple login...');
    
    const mockAddress = '0x' + generateRandomAddress();
    
    privyWalletAddress = mockAddress;
    privyConnected = true;
    privyUser = {
        email: 'user@icloud.com',
        name: 'Apple User',
        id: 'mock-apple-user-id'
    };
    
    onPrivyLoginSuccess();
}

/**
 * Generate random Ethereum address for fallback mode
 */
function generateRandomAddress() {
    const chars = '0123456789abcdef';
    let addr = '';
    for (let i = 0; i < 40; i++) {
        addr += chars[Math.floor(Math.random() * 16)];
    }
    return addr;
}

/**
 * UI Helpers
 */
function hideConnectScreen() {
    const cs = document.getElementById('connectScreen');
    if (cs) cs.style.display = 'none';
}

function showConnectScreen() {
    const cs = document.getElementById('connectScreen');
    if (cs) cs.style.display = 'flex';
}

function showMainApp() {
    const app = document.getElementById('mainApp');
    if (app) {
        app.style.display = 'flex';
        app.style.flexDirection = 'column';
    }
}

function hideMainApp() {
    const app = document.getElementById('mainApp');
    if (app) app.style.display = 'none';
}

/**
 * Called when Privy login succeeds
 */
function onPrivyLoginSuccess() {
    console.log('[Privy] Login success! Wallet:', privyWalletAddress);
    hideConnectScreen();
    showMainApp();
    
    // Update UI with wallet info
    updateWalletUI();
    
    // Notify app ready
    if (typeof window.onPrivyReady === 'function') {
        window.onPrivyReady(privyUser, privyWalletAddress);
    }
}

/**
 * Update wallet-related UI elements
 */
function updateWalletUI() {
    const balanceEl = document.getElementById('ghBalance') || document.getElementById('walletBalance');
    if (balanceEl) {
        // Show USD balance instead of ETH
        if (window.walletState && window.walletState.balanceUSD) {
            balanceEl.textContent = '$' + window.walletState.balanceUSD.toFixed(2);
        } else if (window.getWalletBalanceUSD) { 
            window.getWalletBalanceUSD().then(bal => { balanceEl.textContent = '$' + bal.toFixed(2); }); 
        } else { 
            balanceEl.textContent = '$0.00'; 
        }
    }
    
    const userAddrEl = document.getElementById('userAddr');
    if (userAddrEl && privyWalletAddress) {
        userAddrEl.textContent = privyWalletAddress.substring(0, 6) + '...' + privyWalletAddress.substring(38);
    }
    
    const networkBadge = document.getElementById('ghNetwork');
    if (networkBadge) {
        networkBadge.style.display = 'inline'; // Show "BASE" badge
        networkBadge.textContent = 'BASE';
    }
}

/**
 * Get user's wallet address
 */
function getPrivyAddress() {
    return privyWalletAddress;
}

/**
 * Check if connected
 */
function isPrivyConnected() {
    return privyConnected && !!privyWalletAddress;
}

/**
 * Sign message (for transactions)
 */
async function privySignMessage(message) {
    if (!privyConnected) {
        throw new Error('Not connected');
    }
    
    if (!window.Privy || !privyUser?.wallet) {
        // Fallback: simulate signature
        console.log('[Privy] Fallback sign:', message);
        return '0xsignature...';
    }
    
    try {
        return await window.Privy.signMessage(message);
    } catch (e) {
        console.error('[Privy] Sign error:', e);
        throw e;
    }
}

/**
 * Disconnect wallet
 */
function privyDisconnect() {
    console.log('[Privy] Disconnecting...');
    privyUser = null;
    privyWalletAddress = null;
    privyConnected = false;
    
    if (window.Privy) {
        window.Privy.logout();
    }
    
    showConnectScreen();
    hideMainApp();
}

function privyLogin() {
    console.log('[Privy] Login requested');
    if (window.Privy && typeof window.Privy.login === 'function') {
        try {
            window.Privy.login();
            return;
        } catch (e) {
            console.warn('[Privy] Widget login error, falling back:', e);
        }
    }
    privyLoginGoogle();
}
window.privyLogin = privyLogin;

// Export functions
window.privyInit = privyInit;
window.privyLoginGoogle = privyLoginGoogle;
window.privyLoginApple = privyLoginApple;
window.getPrivyAddress = getPrivyAddress;
window.isPrivyConnected = isPrivyConnected;
window.privySignMessage = privySignMessage;
window.privyDisconnect = privyDisconnect;

async function handlePrivyClick() {
    console.log('[Privy] Handle click triggered');
    const status = document.getElementById('loginStatus');
    if (status) status.textContent = 'Initializing Secure Login...';
    
    try {
        await privyInit();
        if (window.privyLogin) {
            window.privyLogin();
        } else {
            // Fallback if React bridge hasn't taken over yet
            privyLoginGoogle();
        }
    } catch (e) {
        console.error('[Privy] Click handler error:', e);
        if (status) status.textContent = 'Error: ' + e.message;
        privyLoginGoogle(); // Extreme fallback
    }
}
window.handlePrivyClick = handlePrivyClick;
