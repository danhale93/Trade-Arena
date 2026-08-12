/**
 * REAL BLOCKCHAIN EXECUTION
 * Handles actual MetaMask transaction signing and on-chain execution
 */

// ═══════════════════════════════════════════════════════════
// UNISWAP V3 SWAP EXECUTION
// ═══════════════════════════════════════════════════════════

async function executeRealSwap(betUSD, tokenIn, tokenOut, method) {
  if (!walletState.signer) {
    console.error('❌ No signer available. Connect MetaMask first!');
    return { success: false, error: 'No signer available' };
  }

  try {
    console.log('🔄 Executing real swap on Base network...');
    
    // Step 1: Get swap quote from 0x API
    const quote = await get0xSwapQuote(betUSD, tokenIn, tokenOut);
    if (!quote || !quote.data) {
      return { success: false, error: 'Failed to get swap quote' };
    }

    // Step 2: Show MetaMask confirmation modal
    console.log('💰 Requesting MetaMask signature...');
    
    // Step 3: Send transaction via MetaMask
    const tx = {
      to: quote.to,
      from: walletState.address,
      data: quote.data,
      value: quote.value || '0',
      gas: ethers.BigNumber.from(quote.gas || 150000).mul(120).div(100), // Add 20% buffer
      gasPrice: ethers.BigNumber.from(quote.gasPrice || 1000000000),
    };

    // Step 4: Sign and send via signer
    const sentTx = await walletState.signer.sendTransaction(tx);
    console.log('✅ Transaction sent! Hash:', sentTx.hash);

    // Step 5: Wait for confirmation
    const receipt = await sentTx.wait(1); // Wait for 1 confirmation
    console.log('✅ Transaction confirmed on block:', receipt.blockNumber);

    if (receipt.status === 0) {
      console.error('❌ Transaction reverted on-chain.');
      return {
        success: false,
        error: 'Transaction reverted on-chain',
        txHash: sentTx.hash,
        status: 'REVERTED'
      };
    }

    return {
      success: true,
      txHash: sentTx.hash,
      blockNumber: receipt.blockNumber,
      timestamp: new Date().toISOString(),
      status: 'CONFIRMED',
      gasCost: ethers.utils.formatEther(
        ethers.BigNumber.from(receipt.gasUsed).mul(tx.gasPrice)
      ),
    };

  } catch (error) {
    console.error('❌ Swap failed:', error.message);
    
    // User rejected in MetaMask
    if (error.code === 4001) {
      return { success: false, error: 'Transaction rejected in MetaMask' };
    }
    
    // Insufficient gas
    if (error.message.includes('insufficient')) {
      return { success: false, error: 'Insufficient balance or gas' };
    }

    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════
// 0x SWAP QUOTE API
// ═══════════════════════════════════════════════════════════

async function get0xSwapQuote(betUSD, tokenIn, tokenOut) {
  try {
    // Get current token prices
    const priceData = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin&vs_currencies=usd'
    ).then(r => r.json());

    const ethPrice = priceData.ethereum?.usd || 3200;
    
    // Convert USD to Wei
    const tokenInAmount = ethers.utils.parseEther((betUSD / ethPrice).toString());

    // Get swap quote from 0x
    const apiUrl = new URL('https://api.0x.org/swap/v1/quote');
    apiUrl.searchParams.append('chainId', '8453'); // Base network
    apiUrl.searchParams.append('sellToken', tokenIn);
    apiUrl.searchParams.append('buyToken', tokenOut);
    apiUrl.searchParams.append('sellAmount', tokenInAmount.toString());
    apiUrl.searchParams.append('slippagePercentage', '0.5');

    console.log('📊 Fetching 0x quote...');
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`0x API error: ${response.statusText}`);
    }

    const quoteData = await response.json();
    console.log('✅ Quote received:', quoteData);

    return quoteData;

  } catch (error) {
    console.error('❌ Quote fetch failed:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// TRANSACTION HISTORY TRACKING
// ═══════════════════════════════════════════════════════════

async function trackTransactionStatus(txHash) {
  if (!walletState.provider) return null;

  try {
    // Poll for transaction receipt
    let receipt = null;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals

    while (!receipt && attempts < maxAttempts) {
      receipt = await walletState.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        console.log(`⏳ Waiting for confirmation... (${attempts + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      }

      attempts++;
    }

    if (!receipt) {
      return { status: 'PENDING', message: 'Transaction still pending after 5 minutes' };
    }

    // Transaction confirmed
    return {
      status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      transactionFee: ethers.utils.formatEther(
        receipt.gasUsed.mul(receipt.effectiveGasPrice || 1000000000)
      ),
    };

  } catch (error) {
    console.error('❌ Transaction tracking failed:', error);
    return { status: 'ERROR', error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════
// UPDATE WALLET BALANCE AFTER TRANSACTION
// ═══════════════════════════════════════════════════════════

async function refreshBalanceAfterTrade() {
  console.log('🔄 Refreshing wallet balance...');
  
  const balance = await getWalletBalance();
  if (!balance) {
    console.error('❌ Failed to refresh balance');
    return false;
  }

  console.log(`✅ New balance: ${balance.eth} ETH ($${balance.usd.toFixed(2)})`);
  
  // Update UI
  if (window.updateBalance) {
    window.updateBalance(balance);
  }

  return true;
}

// ═══════════════════════════════════════════════════════════
// VERIFY TRANSACTION ON BLOCKCHAIN
// ═══════════════════════════════════════════════════════════

async function verifyTransactionOnChain(txHash) {
  if (!walletState.provider) {
    console.error('Provider not available');
    return false;
  }

  try {
    const tx = await walletState.provider.getTransaction(txHash);
    const receipt = await walletState.provider.getTransactionReceipt(txHash);

    if (!receipt) {
      console.warn('⏳ Transaction pending or not found');
      return null; // Still pending
    }

    const verified = {
      confirmed: receipt.status === 1,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      from: receipt.from,
      to: receipt.to,
      value: ethers.utils.formatEther(tx.value),
      timestamp: new Date().toISOString(),
      explorerUrl: `https://basescan.org/tx/${txHash}`,
    };

    console.log('✅ Transaction verified on-chain:', verified);
    return verified;

  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// EXPORT FOR USE IN HTML
// ═══════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
  window.executeRealSwap = executeRealSwap;
  window.get0xSwapQuote = get0xSwapQuote;
  window.trackTransactionStatus = trackTransactionStatus;
  window.refreshBalanceAfterTrade = refreshBalanceAfterTrade;
  window.verifyTransactionOnChain = verifyTransactionOnChain;

  console.log('✅ Blockchain Execution module loaded');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    executeRealSwap,
    get0xSwapQuote,
    trackTransactionStatus,
    refreshBalanceAfterTrade,
    verifyTransactionOnChain,
  };
}
