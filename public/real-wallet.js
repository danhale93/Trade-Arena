/**
 * REAL WALLET INTEGRATION - Base Mainnet
 * Handles actual on-chain balances, transaction signing, and network validation
 */

const isBrowser = typeof window !== 'undefined';
const ethers = isBrowser ? window.ethers : require('ethers');

// Base Configuration for Real Trading
const REAL_WALLET_CONFIG = {
  network: {
    id: 8453,
    chainId: '0x2105',
    name: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: 'ETH',
  },
  tokens: {
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    cbBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  },
  gas: {
    bufferMultiplier: 1.2,
    estimatedSwapGas: 150000,
    estimatedFlashLoanGas: 250000,
    estimatedArbitrageGas: 300000,
  },
  trading: {
    minBalanceETH: 0.005,
    maxSlippagePercent: 1.5,
  }
};

// State Tracking
let walletState = {
  isConnected: false,
  address: null,
  balanceETH: 0,
  balanceUSD: 0,
  networkId: null,
  isCorrectNetwork: false,
  provider: null,
  signer: null,
  transactions: []
};

if (isBrowser) {
  const savedAddr = localStorage.getItem('trade_arena_wallet_address');
  walletState.address = savedAddr;
  window.walletState = walletState;
}

/**
 * Get current wallet balance
 */
async function getWalletBalance() {
  if (!walletState.provider || !walletState.address) return null;
  try {
    const balance = await walletState.provider.getBalance(walletState.address);
    walletState.balanceETH = parseFloat(ethers.formatEther(balance));
    let ethPrice = 2500;
    if (typeof getLivePrice === 'function') {
      try {
        const livePrice = await getLivePrice('ETH');
        if (livePrice) ethPrice = livePrice;
      } catch (pErr) {}
    }
    walletState.balanceUSD = walletState.balanceETH * ethPrice;
    return { eth: walletState.balanceETH, usd: walletState.balanceUSD };
  } catch (e) {
    console.error('Failed to fetch balance:', e);
    return null;
  }
}

function calculateSlippage(betUSD, volatility = 5, method = 'ARBITRAGE') {
  const baseSlippage = 0.005;
  const volAdj = (volatility / 100) * 0.1;
  const total = Math.min(baseSlippage + volAdj, REAL_WALLET_CONFIG.trading.maxSlippagePercent / 100);
  return {
    percent: (total * 100).toFixed(3),
    usd: (betUSD * total).toFixed(4),
    method
  };
}

// Exports
if (isBrowser) {
  window.getWalletBalance = getWalletBalance;
  window.calculateSlippage = calculateSlippage;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    REAL_WALLET_CONFIG,
    getWalletBalance,
    calculateSlippage,
    walletState
  };
}
