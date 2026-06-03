/**
 * REAL WALLET INTEGRATION MODULE
 * Trade Arena v4 • MetaMask Real Funds Trading
 * 
 * Handles:
 * - Gas fee estimation
 * - Real transaction simulation
 * - Balance tracking with fees
 * - Network validation
 * - Transaction history
 */

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════

const REAL_WALLET_CONFIG = {
  network: {
    id: 8453,
    name: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    chainId: '0x2105',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: 'ETH',
  },
  
  gas: {
    estimatedSwapGas: 120000, // units
    estimatedFlashLoanGas: 200000,
    estimatedArbitrageGas: 150000,
    priorityFeeMultiplier: 1.1, // Add 10% for priority
    bufferMultiplier: 1.2, // Add 20% safety margin
  },
  
  slippage: {
    conservative: 0.005, // 0.5%
    moderate: 0.01, // 1%
    aggressive: 0.02, // 2%
  },
  
  tokens: {
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    DAI: '0x50c5725949A6F0c72afAA8647BC0D4a6d7c15e50',
  },
  
  trading: {
    minBetUSD: 1,
    maxBetUSD: 500,
    maxSlippagePercent: 2,
  },
};

// ═══════════════════════════════════════════════════════════
// STATE TRACKING
// ═══════════════════════════════════════════════════════════

let walletState = {
  isConnected: false,
  address: null,
  balanceETH: 0,
  balanceUSD: 0,
  networkId: null,
  isCorrectNetwork: false,
  provider: null,
  signer: null,
  nonce: 0,
  transactions: [],
};

// ═══════════════════════════════════════════════════════════
// METAMASK EVENT LISTENERS & SETUP
// ═══════════════════════════════════════════════════════════

if (typeof window !== 'undefined' && window.ethereum) {
  try {
    // Listen for account changes
    window.ethereum.on('accountsChanged', (accounts) => {
      try {
        console.log('👤 Account changed:', accounts);
        if (accounts.length > 0) {
          walletState.address = accounts[0];
        } else {
          walletState.isConnected = false;
          walletState.address = null;
        }
      } catch (e) {
        console.warn('⚠️ Error in accountsChanged listener:', e);
      }
    });
    
    // Listen for network changes
    window.ethereum.on('chainChanged', (chainId) => {
      try {
        console.log('🔗 Chain changed to:', chainId);
        walletState.networkId = parseInt(chainId, 16);
        walletState.isCorrectNetwork = walletState.networkId === REAL_WALLET_CONFIG.network.id;
        // Don't auto-reload, let user decide
        console.log('🔄 Please refresh the page to apply network changes');
      } catch (e) {
        console.warn('⚠️ Error in chainChanged listener:', e);
      }
    });
    
    // Listen for disconnection
    window.ethereum.on('disconnect', (error) => {
      try {
        console.log('❌ Wallet disconnected:', error);
        walletState.isConnected = false;
        walletState.address = null;
        walletState.provider = null;
        walletState.signer = null;
      } catch (e) {
        console.warn('⚠️ Error in disconnect listener:', e);
      }
    });
  } catch (e) {
    console.warn('⚠️ Could not set up MetaMask event listeners:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// NETWORK VALIDATION
// ═══════════════════════════════════════════════════════════

async function validateNetwork(provider) {
  try {
    const network = await provider.getNetwork();
    walletState.networkId = network.chainId;
    walletState.isCorrectNetwork = network.chainId === REAL_WALLET_CONFIG.network.id;
    
    if (!walletState.isCorrectNetwork) {
      console.warn(`❌ Wrong network! Connected to chain ${network.chainId}, need ${REAL_WALLET_CONFIG.network.id}`);
      return false;
    }
    
    console.log(`✅ Connected to ${REAL_WALLET_CONFIG.network.name}`);
    return true;
  } catch (e) {
    console.error('Network validation error:', e);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// BALANCE & GAS ESTIMATION
// ═══════════════════════════════════════════════════════════

async function getWalletBalance() {
  if (!walletState.provider || !walletState.address) {
    console.error('Provider or address not available');
    return null;
  }
  
  try {
    const balanceWei = await walletState.provider.getBalance(walletState.address);
    const balanceETH = parseFloat(ethers.utils.formatEther(balanceWei));
    
    // Get ETH price from CoinGecko
    const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', {
      timeout: 5000
    });
    const priceData = await priceResponse.json();
    const ethPrice = priceData.ethereum?.usd || 3200;
    
    walletState.balanceETH = balanceETH;
    walletState.balanceUSD = balanceETH * ethPrice;
    
    console.log(`✅ Balance fetched: ${balanceETH} ETH = $${walletState.balanceUSD.toFixed(2)}`);
    
    return {
      eth: balanceETH,
      usd: walletState.balanceUSD,
      ethPrice: ethPrice,
    };
  } catch (e) {
    console.error('❌ Balance fetch error:', e);
    // Return fallback with 0 balance
    return {
      eth: 0,
      usd: 0,
      ethPrice: 3200,
    };
  }
}

async function estimateGasPrice() {
  if (!walletState.provider) return null;
  
  try {
    const feeData = await walletState.provider.getFeeData();
    
    return {
      gasPrice: feeData.gasPrice,
      baseFee: feeData.lastBaseFeePerGas,
      maxPriorityFee: feeData.maxPriorityFeePerGas,
      maxFee: feeData.maxFeePerGas,
    };
  } catch (e) {
    console.error('Gas price estimation error:', e);
    return null;
  }
}

async function estimateSwapGasCost(method = 'ARBITRAGE') {
  const gasEstimate = REAL_WALLET_CONFIG.gas[`estimated${method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()}Gas`] || 120000;
  const feeData = await estimateGasPrice();
  
  if (!feeData) return null;
  
  // Use EIP-1559 fee (maxFeePerGas)
  const gasPrice = feeData.maxFee || feeData.gasPrice;
  const gasCostWei = gasPrice.mul(gasEstimate);
  const gasCostETH = parseFloat(ethers.utils.formatEther(gasCostWei));
  const gasCostUSD = gasCostETH * (walletState.balanceUSD / walletState.balanceETH || 3200);
  
  return {
    gasLimit: gasEstimate,
    gasPrice: parseFloat(ethers.utils.formatUnits(gasPrice, 'gwei')),
    costETH: gasCostETH,
    costUSD: gasCostUSD,
    totalGasWei: gasCostWei,
  };
}

// ═══════════════════════════════════════════════════════════
// SLIPPAGE CALCULATION
// ═══════════════════════════════════════════════════════════

function calculateSlippage(betUSD, volatility = 5, method = 'ARBITRAGE') {
  // Base slippage on method type
  const methodSlippage = {
    'ARBITRAGE': 0.005,
    'SPOT LONG': 0.01,
    'SPOT SHORT': 0.015,
    'FLASH LOAN': 0.003,
    'NFT FLIP': 0.02,
    'YIELD FARM': 0.005,
    'PERP LONG': 0.02,
    'PERP SHORT': 0.025,
  }[method] || 0.01;
  
  // Adjust for volatility (1% volatility = +0.1% slippage)
  const volatilityAdjustment = (volatility / 100) * 0.001;
  
  // Adjust for bet size (larger bets = more slippage)
  const sizeMultiplier = Math.min(1 + (betUSD / 1000), 2); // Cap at 2x
  
  const totalSlippagePercent = (methodSlippage + volatilityAdjustment) * sizeMultiplier;
  const slippageCapped = Math.min(totalSlippagePercent, REAL_WALLET_CONFIG.trading.maxSlippagePercent / 100);
  
  const slippageUSD = betUSD * slippageCapped;
  
  return {
    percent: (slippageCapped * 100).toFixed(3),
    usd: slippageUSD.toFixed(4),
    method: method,
  };
}

// ═══════════════════════════════════════════════════════════
// TRANSACTION COST ESTIMATION
// ═══════════════════════════════════════════════════════════

async function estimateTransactionCost(betUSD, method, volatility) {
  const gasCost = await estimateSwapGasCost(method);
  const slippage = calculateSlippage(betUSD, volatility, method);
  
  if (!gasCost) return null;
  
  const totalCostUSD = gasCost.costUSD + parseFloat(slippage.usd);
  const netProfitBefore = betUSD * 0.55 * 1.8; // Assume 55% win with 1.8x multiplier
  const netProfitAfter = netProfitBefore - totalCostUSD;
  
  return {
    bet: betUSD,
    gasCost: gasCost.costUSD.toFixed(4),
    slippage: slippage.usd,
    totalCost: totalCostUSD.toFixed(4),
    method: method,
    volatility: volatility,
    breakEvenMultiplier: (1 + (totalCostUSD / betUSD)).toFixed(2),
    estimatedProfitIfWin: netProfitAfter.toFixed(4),
  };
}

// ═══════════════════════════════════════════════════════════
// BALANCE VALIDATION
// ═══════════════════════════════════════════════════════════

async function validateSufficientBalance(betUSD) {
  const balance = await getWalletBalance();
  if (!balance) return false;
  
  const gasCost = await estimateSwapGasCost();
  if (!gasCost) return false;
  
  // Need bet amount + gas cost + 10% buffer
  const requiredETH = (betUSD / (balance.ethPrice || 3200)) + gasCost.costETH + 0.001; // Extra 0.001 ETH buffer
  
  return {
    hasEnoughBalance: balance.eth >= requiredETH,
    balanceETH: balance.eth,
    balanceUSD: balance.usd,
    requiredETH: requiredETH,
    gasETH: gasCost.costETH,
    betETH: betUSD / (balance.ethPrice || 3200),
  };
}

// ═══════════════════════════════════════════════════════════
// TRANSACTION SIMULATION
// ═══════════════════════════════════════════════════════════

async function simulateRealTrade(betUSD, method, volatility, pnlMultiplier) {
  const validation = await validateSufficientBalance(betUSD);
  
  if (!validation.hasEnoughBalance) {
    return {
      success: false,
      error: `Insufficient balance. Need ${validation.requiredETH.toFixed(4)} ETH, have ${validation.balanceETH.toFixed(4)} ETH`,
      validation: validation,
    };
  }
  
  const gasCost = await estimateSwapGasCost(method);
  const slippage = calculateSlippage(betUSD, volatility, method);
  
  const totalCostUSD = gasCost.costUSD + parseFloat(slippage.usd);
  const pnl = betUSD * pnlMultiplier;
  const netPnL = pnl - totalCostUSD;
  
  const transaction = {
    timestamp: new Date().toISOString(),
    bot: null,
    betUSD: betUSD,
    method: method,
    volatility: volatility,
    gasCostUSD: gasCost.costUSD.toFixed(4),
    slippageUSD: slippage.usd,
    totalCostUSD: totalCostUSD.toFixed(4),
    grossPnL: pnl.toFixed(4),
    netPnL: netPnL.toFixed(4),
    pnlMultiplier: pnlMultiplier,
    outcome: pnlMultiplier >= 1 ? 'WIN' : 'LOSS',
    status: 'SIMULATED',
    txHash: null,
  };
  
  walletState.transactions.push(transaction);
  
  return {
    success: true,
    transaction: transaction,
    validation: validation,
  };
}

// ═══════════════════════════════════════════════════════════
// NETWORK SWITCHING
// ═══════════════════════════════════════════════════════════

async function switchToBaseNetwork() {
  if (!window.ethereum) {
    console.error('MetaMask not installed');
    return false;
  }
  
  try {
    // Try to switch to Base
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: REAL_WALLET_CONFIG.network.chainId }],
    });
    return true;
  } catch (switchError) {
    // Chain doesn't exist, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: REAL_WALLET_CONFIG.network.chainId,
              chainName: REAL_WALLET_CONFIG.network.name,
              rpcUrls: [REAL_WALLET_CONFIG.network.rpcUrl],
              blockExplorerUrls: [REAL_WALLET_CONFIG.network.explorerUrl],
              nativeCurrency: {
                name: 'Ether',
                symbol: REAL_WALLET_CONFIG.network.nativeCurrency,
                decimals: 18,
              },
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add Base network:', addError);
        return false;
      }
    } else {
      console.error('Failed to switch network:', switchError);
      return false;
    }
  }
}

// ═══════════════════════════════════════════════════════════
// WALLET CONNECTION VERIFICATION
// ═══════════════════════════════════════════════════════════

async function verifyWalletReadiness(address, provider) {
  const checks = {
    isMetaMaskInstalled: !!window.ethereum,
    isConnected: !!address,
    isCorrectNetwork: walletState.isCorrectNetwork,
    hasBalance: false,
    minimumBalanceMet: false,
  };
  
  try {
    const balance = await getWalletBalance();
    checks.hasBalance = balance && balance.eth > 0;
    checks.minimumBalanceMet = balance && balance.eth >= 0.01; // Minimum 0.01 ETH
  } catch (e) {
    console.error('Balance check failed:', e);
  }
  
  return {
    isReady: Object.values(checks).every(v => v),
    checks: checks,
    address: address,
    balanceETH: walletState.balanceETH,
    balanceUSD: walletState.balanceUSD,
  };
}

// ═══════════════════════════════════════════════════════════
// TRANSACTION HISTORY
// ═══════════════════════════════════════════════════════════

function getTransactionHistory() {
  return walletState.transactions.sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
}

function clearTransactionHistory() {
  walletState.transactions = [];
}

// ═══════════════════════════════════════════════════════════
// REAL WALLET INTEGRATION CHECK
// ═══════════════════════════════════════════════════════════

async function initializeRealWalletMode() {
  console.log('🔧 Initializing Real Wallet Integration...');
  
  const checks = {
    metamaskInstalled: !!window.ethereum,
    ethersjsLoaded: typeof ethers !== 'undefined',
    baseNetworkConfigured: REAL_WALLET_CONFIG.network.id === 8453,
    gasEstimationReady: Object.keys(REAL_WALLET_CONFIG.gas).length > 0,
    slippageConfigured: Object.keys(REAL_WALLET_CONFIG.slippage).length > 0,
  };
  
  console.log('✅ Real Wallet Integration Status:', checks);
  
  return {
    ready: Object.values(checks).every(v => v),
    details: checks,
  };
}

// ═══════════════════════════════════════════════════════════
// DIAGNOSTIC HELPER
// ═══════════════════════════════════════════════════════════

function checkMetaMaskStatus() {
  const status = {
    metamaskInstalled: !!window.ethereum,
    isMetaMask: window.ethereum?.isMetaMask || false,
    connected: walletState.isConnected,
    address: walletState.address,
    network: {
      id: walletState.networkId,
      isCorrect: walletState.isCorrectNetwork,
      expected: REAL_WALLET_CONFIG.network.id,
      name: REAL_WALLET_CONFIG.network.name,
    },
    balance: {
      eth: walletState.balanceETH,
      usd: walletState.balanceUSD,
    },
    provider: walletState.provider ? 'Connected' : 'Not connected',
  };
  
  console.table(status);
  return status;
}

// ═══════════════════════════════════════════════════════════
// ADVANCED DIAGNOSTICS
// ═══════════════════════════════════════════════════════════

function diagnoseMetaMask() {
  const diagnosis = {
    timestamp: new Date().toISOString(),
    browser: {
      userAgent: navigator.userAgent,
      isChrome: /Chrome/.test(navigator.userAgent),
      isFirefox: /Firefox/.test(navigator.userAgent),
      isSafari: /Safari/.test(navigator.userAgent),
      isEdge: /Edg/.test(navigator.userAgent),
    },
    environment: {
      windowExists: typeof window !== 'undefined',
      ethereumExists: !!window.ethereum,
      ethereumType: typeof window.ethereum,
      isMetaMask: window.ethereum?.isMetaMask,
    },
    ethereumObject: {
      hasRequest: !!window.ethereum?.request,
      hasOn: !!window.ethereum?.on,
      hasSend: !!window.ethereum?.send,
      chainId: window.ethereum?.chainId,
      selectedAddress: window.ethereum?.selectedAddress,
    },
    walletConnection: {
      isConnected: walletState.isConnected,
      address: walletState.address,
      networkId: walletState.networkId,
      isCorrectNetwork: walletState.isCorrectNetwork,
      balanceETH: walletState.balanceETH,
      balanceUSD: walletState.balanceUSD,
    },
  };
  
  console.group('🔍 METAMASK DIAGNOSIS REPORT');
  console.log('Timestamp:', diagnosis.timestamp);
  console.group('🌐 Browser Info');
  console.table(diagnosis.browser);
  console.groupEnd();
  console.group('🔗 Environment Detection');
  console.table(diagnosis.environment);
  console.groupEnd();
  console.group('🦊 Ethereum Object');
  console.table(diagnosis.ethereumObject);
  console.groupEnd();
  console.group('💼 Wallet Connection');
  console.table(diagnosis.walletConnection);
  console.groupEnd();
  console.groupEnd();
  
  return diagnosis;
}

// ═══════════════════════════════════════════════════════════
// MAKE FUNCTIONS AVAILABLE GLOBALLY IN BROWSER
// ═══════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  // Make all functions available in browser console
  window.checkMetaMaskStatus = checkMetaMaskStatus;
  window.diagnoseMetaMask = diagnoseMetaMask;
  window.getWalletBalance = getWalletBalance;
  window.switchToBaseNetwork = switchToBaseNetwork;
  window.validateNetwork = validateNetwork;
  window.verifyWalletReadiness = verifyWalletReadiness;
  window.walletState = walletState;
  window.REAL_WALLET_CONFIG = REAL_WALLET_CONFIG;
  
  console.log('✅ Real Wallet Integration loaded. Available commands:');
  console.log('  → diagnoseMetaMask()');
  console.log('  → checkMetaMaskStatus()');
  console.log('  → getWalletBalance()');
  console.log('  → walletState (view object)');
}

// ═══════════════════════════════════════════════════════════
// EXPORT FOR USE IN HTML
// ═══════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    REAL_WALLET_CONFIG,
    walletState,
    validateNetwork,
    getWalletBalance,
    estimateGasPrice,
    estimateSwapGasCost,
    calculateSlippage,
    estimateTransactionCost,
    validateSufficientBalance,
    simulateRealTrade,
    switchToBaseNetwork,
    verifyWalletReadiness,
    getTransactionHistory,
    clearTransactionHistory,
    initializeRealWalletMode,
    checkMetaMaskStatus,
    diagnoseMetaMask,
  };
}
