/**
 * REAL BLOCKCHAIN EXECUTION
 * Handles actual MetaMask transaction signing and on-chain execution on Base Mainnet (8453) with Ethers v6
 */

async function executeRealSwap(betUSD, tokenIn, tokenOut, method) {
  if (!window.ethereum) {
    return { success: false, error: 'MetaMask or Web3 wallet not detected' };
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    console.log('🔄 Executing real swap on Base network as:', address);
    
    // Step 1: Get swap quote from 0x API or Uniswap
    const quote = await get0xSwapQuote(betUSD, tokenIn, tokenOut);
    if (!quote || !quote.data) {
      return { success: false, error: 'Failed to get swap quote from 0x API' };
    }

    // Step 2: Request MetaMask signature & send transaction
    console.log('💰 Requesting MetaMask signature...');
    
    const txValue = quote.value ? BigInt(quote.value) : 0n;
    const gasLimitEst = quote.gas ? BigInt(quote.gas) * 120n / 100n : 150000n;
    const gasPriceEst = quote.gasPrice ? BigInt(quote.gasPrice) : 1000000000n;

    const txRequest = {
      to: quote.to,
      from: address,
      data: quote.data,
      value: txValue,
      gasLimit: gasLimitEst,
      gasPrice: gasPriceEst,
    };

    const sentTx = await signer.sendTransaction(txRequest);
    console.log('✅ Transaction sent! Hash:', sentTx.hash);

    // Step 3: Wait for confirmation & receipt
    const receipt = await provider.waitForTransaction(sentTx.hash, 1);
    console.log('✅ Transaction confirmed on block:', receipt.blockNumber);

    if (receipt.status === 0) {
      return {
        success: false,
        error: 'Transaction reverted on-chain',
        txHash: sentTx.hash,
        status: 'REVERTED'
      };
    }

    const gasUsed = receipt.gasUsed;
    const effectiveGasPrice = receipt.gasPrice || gasPriceEst;
    const transactionFeeWei = gasUsed * effectiveGasPrice;
    const transactionFeeETH = ethers.formatEther(transactionFeeWei);

    const receiptData = {
      success: true,
      txHash: sentTx.hash,
      blockNumber: receipt.blockNumber,
      from: address,
      to: quote.to,
      gasUsed: gasUsed.toString(),
      gasCost: transactionFeeETH,
      explorerUrl: `https://basescan.org/tx/${sentTx.hash}`,
      timestamp: new Date().toISOString(),
      status: 'CONFIRMED'
    };

    console.log('📄 Trade Receipt Generated:', receiptData);
    return receiptData;

  } catch (error) {
    console.error('❌ Swap failed:', error.message);
    if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
      return { success: false, error: 'Transaction rejected in MetaMask' };
    }
    return { success: false, error: error.message };
  }
}

async function get0xSwapQuote(betUSD, tokenIn, tokenOut) {
  try {
    // Determine the sell amount in the correct token's decimals
    let sellAmount;
    const isSellEth = tokenIn.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' || tokenIn.toLowerCase() === 'eth';
    
    if (isSellEth) {
      const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const priceData = await priceResponse.json();
      const ethPrice = priceData.ethereum?.usd || 3200;
      sellAmount = ethers.parseEther((betUSD / ethPrice).toFixed(18));
    } else {
      // Assume USDC (6 decimals) if not ETH
      sellAmount = ethers.parseUnits(betUSD.toString(), 6);
    }

    const apiUrl = new URL('https://api.0x.org/swap/v1/quote');
    apiUrl.searchParams.append('chainId', '8453');
    apiUrl.searchParams.append('sellToken', isSellEth ? 'ETH' : tokenIn);
    apiUrl.searchParams.append('buyToken', tokenOut.toLowerCase() === 'eth' ? 'ETH' : tokenOut);
    apiUrl.searchParams.append('sellAmount', sellAmount.toString());
    apiUrl.searchParams.append('slippagePercentage', '0.01'); // 1% slippage for safety

    const response = await fetch(apiUrl.toString());
    if (!response.ok) {
      throw new Error(`0x API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Quote fetch failed:', error);
    return null;
  }
}

async function trackTransactionStatus(txHash) {
  if (!window.ethereum) return null;
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) return { status: 'PENDING' };
    return {
      status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      explorerUrl: `https://basescan.org/tx/${txHash}`
    };
  } catch (e) {
    return { status: 'ERROR', error: e.message };
  }
}

if (typeof window !== 'undefined') {
  window.executeRealSwap = executeRealSwap;
  window.get0xSwapQuote = get0xSwapQuote;
  window.trackTransactionStatus = trackTransactionStatus;
  console.log('✅ Updated Blockchain Execution module loaded (Ethers v6)');
}
