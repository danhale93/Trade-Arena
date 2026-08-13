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
    rpcUrl: 'https://base-mainnet.g.alchemy.com/v2/3zUWwmlHTQNjmM55sV2X0',
    chainId: '0x2105',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: 'ETH',
    addParams: {
      chainId: '0x2105',
      chainName: 'Base Mainnet',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: ['https://mainnet.base.org'],
      blockExplorerUrls: ['https://basescan.org']
    }
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

// 🛡️ UNIFIED GLOBAL STATE: Share walletState across all modules (Privy, App, Trading)
window.walletState = window.walletState || {
  isConnected: false,
  address: typeof window !== 'undefined' ? localStorage.getItem('trade_arena_wallet_address') : null,
  walletType: localStorage.getItem('trade_arena_wallet_type') || 'unknown', // 'metamask' or 'privy'
  balanceETH: 0,
  balanceUSD: 0,
  networkId: null,
  isCorrectNetwork: false,
  provider: null,
  signer: null,
  nonce: 0,
  transactions: [],
  // 🛡️ STRICT ADDRESS LOCK: Prioritize this specific address if it ever connects
  preferredAddress: '0x92CEAf1CA43deCfc443A34B915B45343BeE9c2DB'
};
const walletState = window.walletState;

/**
 * 🛡️ WALLET PRIORITY ENGINE
 * Ensures that external wallets (MetaMask) take precedence over embedded ones.
 */
function setWalletState(newState) {
    // 🛡️ STRICT OVERRIDE: If we are connected to the preferred MetaMask address, 
    // block ANY attempt to switch to the embedded Privy wallet.
    if (walletState.address?.toLowerCase() === walletState.preferredAddress?.toLowerCase() && 
        newState.walletType === 'privy') {
        console.log('[WalletPriority] STOCKED: Keeping preferred MetaMask address active.');
        return;
    }

    // If current wallet is MetaMask and we're trying to set a Privy wallet, block it
    if (walletState.walletType === 'metamask' && newState.walletType === 'privy') {
        console.log('[WalletPriority] Blocking Privy overwrite - MetaMask is currently active.');
        return;
    }
    
    Object.assign(walletState, newState);
    if (newState.address) {
        localStorage.setItem('trade_arena_wallet_address', newState.address);
        localStorage.setItem('trade_arena_wallet_type', newState.walletType || 'unknown');
    }
    
    window.dispatchEvent(new CustomEvent('walletStateChanged', { detail: walletState }));
}
window.setWalletState = setWalletState;

// ═══════════════════════════════════════════════════════════
// METAMASK EVENT LISTENERS & SETUP
// ═══════════════════════════════════════════════════════════

// Auto-reconnect and initialize on load if previously connected
if (typeof window !== 'undefined' && window.ethereum) {
  window.addEventListener('DOMContentLoaded', async () => {
    const savedAddress = localStorage.getItem('trade_arena_wallet_address');
    if (savedAddress) {
      console.log('🔄 Restoring previous wallet session for:', savedAddress);
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          setWalletState({
            address: accounts[0],
            isConnected: true,
            walletType: 'metamask',
            provider: new ethers.BrowserProvider(window.ethereum)
          });
          walletState.signer = await walletState.provider.getSigner();
          await validateNetwork(walletState.provider);
          await getWalletBalance();
          console.log('✅ MetaMask session restored successfully:', accounts[0]);
        }
      } catch (err) {
        console.warn('⚠️ Failed to restore wallet session:', err);
      }
    }
  });

  // Proactive watcher for walletState initialization (e.g. from Privy bridge)
  let lastConnectedState = false;
  setInterval(async () => {
    if (walletState.isConnected && walletState.provider && walletState.address) {
      // If we just connected, or it's been 15 seconds, fetch balance
      const now = Date.now();
      const shouldFetch = !lastConnectedState || (now - (walletState.lastFetchTime || 0) > 15000);
      
      if (shouldFetch) {
        try {
          console.log('[RealWallet] Proactive sync triggered...');
          await getWalletBalance();
          walletState.lastFetchTime = now;
          window.dispatchEvent(new CustomEvent('walletStateChanged', { detail: walletState }));
        } catch (err) {
          console.warn('[RealWallet] Background sync failed:', err.message);
        }
      }
      lastConnectedState = true;
    } else {
      lastConnectedState = false;
    }
  }, 2000);

  try {
    // Listen for account changes with proactive balance fetch
    window.ethereum.on('accountsChanged', async (accounts) => {
      try {
        console.log('👤 Account changed:', accounts);
        if (accounts.length > 0) {
          setWalletState({
            address: accounts[0],
            isConnected: true,
            walletType: 'metamask'
          });
          
          if (typeof ethers !== 'undefined' && window.ethereum) {
            walletState.provider = new ethers.BrowserProvider(window.ethereum);
            walletState.signer = await walletState.provider.getSigner();
          }
          await getWalletBalance();
        } else {
          setWalletState({
            isConnected: false,
            address: null,
            walletType: 'none',
            balanceETH: 0,
            balanceUSD: 0,
            provider: null,
            signer: null
          });
          localStorage.removeItem('trade_arena_wallet_address');
          localStorage.removeItem('trade_arena_wallet_type');
        }
      } catch (e) {
        console.warn('⚠️ Error in accountsChanged listener:', e);
      }
    });
    
    // Listen for network changes with automatic programmatic switching
    window.ethereum.on('chainChanged', async (chainId) => {
      try {
        console.log('🔗 Chain changed to:', chainId);
        const targetHex = '0x' + REAL_WALLET_CONFIG.network.id.toString(16);
        
        if (chainId !== targetHex) {
          console.log(`🔄 Wrong network detected (${chainId}). Requesting switch to Base (${targetHex})...`);
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: targetHex }],
            });
          } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
              console.log('Adding Base network to MetaMask...');
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [REAL_WALLET_CONFIG.network.addParams],
              });
            } else {
              throw switchError;
            }
          }
        } else {
          // Correct network, reload to ensure clean Ethers state
          window.location.reload();
        }
      } catch (e) {
        console.warn('⚠️ Error in chainChanged listener:', e);
        // Fallback to reload if programmatic switch fails
        window.location.reload();
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
    const balanceETH = parseFloat(ethers.formatEther(balanceWei));
    
    // Get strict real-time ETH price from CoinGecko without fallbacks
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!priceResponse.ok) {
      throw new Error(`CoinGecko API error: ${priceResponse.statusText}`);
    }
    
    const priceData = await priceResponse.json();
    if (!priceData.ethereum || !priceData.ethereum.usd) {
      throw new Error('Invalid price data received from CoinGecko API');
    }
    
    const ethPrice = priceData.ethereum.usd;
    walletState.balanceETH = balanceETH;
    walletState.balanceUSD = balanceETH * ethPrice;

    // Synchronize with global balance variable used by trading-bundle.js
    window.balance = walletState.balanceUSD;

    // 🛡️ INITIALIZATION: Set starting balance baseline on first successful sync
    if (typeof window.startBalance !== 'undefined' && (window.startBalance === 0 || window.startBalance === null)) {
        console.log('[Sync] Initializing session starting balance to:', window.balance);
        window.startBalance = window.balance;
        
        if (Array.isArray(window.equityHistory) && (window.equityHistory.length === 0 || (window.equityHistory.length === 1 && window.equityHistory[0] === 0))) {
            window.equityHistory = [window.balance];
        }
    }
    
    console.log(`✅ On-Chain Balance fetched: ${balanceETH} ETH = $${walletState.balanceUSD.toFixed(2)} (Live ETH Price: $${ethPrice})`);
    
    // Proactively update UI if element exists
    const balEl = document.getElementById('ghBalance');
    if (balEl) {
        balEl.textContent = '$' + walletState.balanceUSD.toFixed(2);
    }

    return {
      eth: balanceETH,
      usd: walletState.balanceUSD,
      ethPrice: ethPrice,
    };
  } catch (e) {
    console.error('❌ On-Chain Balance fetch error:', e);
    throw e;
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
  const gasCostWei = gasPrice * BigInt(gasEstimate);
  const gasCostETH = parseFloat(ethers.formatEther(gasCostWei));
  const gasCostUSD = gasCostETH * (walletState.balanceUSD / walletState.balanceETH || 3200);
  
  return {
    gasLimit: gasEstimate,
    gasPrice: parseFloat(ethers.formatUnits(gasPrice, 'gwei')),
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
  
  // Need bet amount + gas cost + 0.0005 ETH safety buffer (reduced from 0.001 to prevent false negatives)
  const requiredETH = (betUSD / balance.ethPrice) + gasCost.costETH + 0.0005;
  
  return {
    hasEnoughBalance: balance.eth >= requiredETH,
    balanceETH: balance.eth,
    balanceUSD: balance.usd,
    requiredETH: requiredETH,
    gasETH: gasCost.costETH,
    betETH: betUSD / balance.ethPrice,
  };
}

// ═══════════════════════════════════════════════════════════
// ON-CHAIN REAL TRANSACTION EXECUTION
// ═══════════════════════════════════════════════════════════

async function executeOnChainTrade(betUSD, method = 'ARBITRAGE', targetContractAddress = REAL_WALLET_CONFIG.tokens.WETH) {
  if (!walletState.signer || !walletState.provider) {
    throw new Error('Wallet signer or provider not initialized. Connect MetaMask first.');
  }

  const validation = await validateSufficientBalance(betUSD);
  if (!validation || !validation.hasEnoughBalance) {
    throw new Error(`Insufficient on-chain balance. Required: ${validation?.requiredETH.toFixed(4)} ETH, Available: ${validation?.balanceETH.toFixed(4)} ETH`);
  }

  const gasCost = await estimateSwapGasCost(method);
  if (!gasCost) {
    throw new Error('Failed to estimate gas cost for on-chain execution.');
  }

  // Convert bet USD to Wei ETH for transaction value
  const betETH = betUSD / validation.ethPrice;
  const valueWei = ethers.parseEther(betETH.toFixed(18));

  console.log(`🚀 Submitting real on-chain transaction on Base Mainnet (Chain ID: 8453)...`);
  console.log(`   Target Contract: ${targetContractAddress}`);
  console.log(`   Value: ${betETH.toFixed(6)} ETH ($${betUSD})`);
  console.log(`   Gas Limit: ${gasCost.gasLimit}, Max Fee Per Gas: ${gasCost.gasPrice} Gwei`);

  try {
    // Prompt MetaMask modal for real on-chain transaction signing & broadcast
    const tx = await walletState.signer.sendTransaction({
      to: targetContractAddress,
      value: valueWei,
      gasLimit: BigInt(gasCost.gasLimit),
    });

    console.log(`⏳ Transaction broadcasted! Hash: ${tx.hash}. Waiting for confirmation...`);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber} on Base Mainnet!`);

    const transactionRecord = {
      timestamp: new Date().toISOString(),
      method: method,
      betUSD: betUSD,
      betETH: betETH,
      gasCostETH: gasCost.costETH,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: 'CONFIRMED',
      network: 'Base Mainnet (8453)',
    };

    walletState.transactions.push(transactionRecord);

    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      receipt: receipt,
      transaction: transactionRecord,
    };
  } catch (txError) {
    console.error('❌ On-chain transaction failed or rejected by user in MetaMask:', txError);
    throw txError;
  }
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
    executeOnChainTrade,
    switchToBaseNetwork,
    verifyWalletReadiness,
    getTransactionHistory,
    clearTransactionHistory,
    initializeRealWalletMode,
    checkMetaMaskStatus,
    diagnoseMetaMask,
  };
}
