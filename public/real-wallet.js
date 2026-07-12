/**
 * REAL WALLET INTEGRATION
 * Trade Arena v4 • Base Mainnet
 */

const REAL_WALLET_NETWORKS = {
  8453: {
    id: 8453,
    name: 'Base Mainnet',
    chainId: '0x2105',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: 'ETH',
  },
  84532: {
    id: 84532,
    name: 'Base Sepolia',
    chainId: '0x14a34',
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    nativeCurrency: 'ETH',
  }
};

const REAL_WALLET_CONFIG = {
  network: REAL_WALLET_NETWORKS[8453],
  gas: {
    limit: 250000,
    priceMultiplier: 1.1,
  },
  slippage: {
    default: 0.005,
    max: 0.05,
  }
};

let walletState = {
  isConnected: false,
  address: null,
  networkId: null,
  isCorrectNetwork: false,
  balanceETH: 0,
  balanceUSD: 0,
  provider: null,
  transactions: [],
};

async function getWalletBalance() {
  const isBrowser = typeof window !== 'undefined';
  const addr = isBrowser ? (window.privyWalletAddress || (window.ethereum && walletState.address)) : walletState.address;
  if (!addr) return null;
  
  try {
    const ethersLib = isBrowser ? window.ethers : require('ethers');
    const provider = isBrowser ? new ethersLib.providers.Web3Provider(window.ethereum) : new ethersLib.JsonRpcProvider(REAL_WALLET_CONFIG.network.rpcUrl);
    const balance = await provider.getBalance(addr);
    const eth = parseFloat(ethersLib.utils ? ethersLib.utils.formatEther(balance) : ethersLib.formatEther(balance));
    
    let ethPrice = 2500;
    if (isBrowser && typeof getLivePrice === 'function') {
        const lp = await getLivePrice('ETH');
        if (lp) ethPrice = lp;
    }
    
    walletState.balanceETH = eth;
    walletState.balanceUSD = eth * ethPrice;
    
    return { eth, usd: eth * ethPrice };
  } catch (e) {
    console.error('Failed to get balance:', e);
    return null;
  }
}

async function validateNetwork() {
  if (typeof window === 'undefined' || !window.ethereum) return false;
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    walletState.networkId = parseInt(chainId, 16);
    walletState.isCorrectNetwork = (walletState.networkId === 8453 || walletState.networkId === 84532);
    return walletState.isCorrectNetwork;
  } catch (e) {
    return false;
  }
}

function calculateSlippage(amountIn, volatility, method = 'MARKET') {
    const baseSlippage = (amountIn / 100000) * 100; // Assume 100k liquidity for simple calc
    const volatilityAdjustment = Math.sqrt(volatility) * 0.1;
    const percent = Math.min(2, Math.max(0.1, baseSlippage + volatilityAdjustment));
    return {
        percent: percent.toFixed(2),
        method: method,
        amountIn: amountIn
    };
}

async function simulateRealTrade(botId, token, amountUSD, method) {
    if (typeof window !== 'undefined' && window.executeOnChainTrade) {
        return await window.executeOnChainTrade({ botId, token, amountUSD, method });
    }
    return { success: true, txHash: '0x' + Math.random().toString(16).slice(2) };
}

async function switchToBaseNetwork(targetChainId = 8453) {
  if (typeof window === 'undefined' || !window.ethereum) return false;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: REAL_WALLET_NETWORKS[targetChainId].chainId }],
    });
    return true;
  } catch (switchError) {
    return false;
  }
}

if (typeof window !== 'undefined') {
    window.getWalletBalance = getWalletBalance;
    window.validateNetwork = validateNetwork;
    window.switchToBaseNetwork = switchToBaseNetwork;
    window.walletState = walletState;
    window.calculateSlippage = calculateSlippage;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    REAL_WALLET_CONFIG,
    walletState,
    getWalletBalance,
    validateNetwork,
    simulateRealTrade,
    calculateSlippage,
    switchToBaseNetwork
  };
}
