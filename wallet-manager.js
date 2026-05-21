/**
 * wallet-manager.js
 * Server-side wallet management for onchain trading
 * Handles private key signing, nonce management, and transaction execution
 */

const { ethers } = require('ethers');

class WalletManager {
  constructor(privateKey, rpcUrl = 'https://mainnet.base.org') {
    if (!privateKey || !privateKey.startsWith('0x')) {
      throw new Error('Valid private key required (0x...)');
    }
    
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.address = this.wallet.address;
    this.nonceMap = new Map(); // Track nonces per address
    this.pendingTxs = new Map(); // Track pending txs
    
    console.log(`💼 Wallet Manager initialized for: ${this.address}`);
  }

  // Get current balance
  async getBalance() {
    const balance = await this.provider.getBalance(this.address);
    return {
      wei: balance,
      eth: parseFloat(ethers.utils.formatEther(balance)),
      formatted: ethers.utils.formatEther(balance)
    };
  }

  // Get ETH balance in USD
  async getBalanceUSD(ethPrice = 3200) {
    const { eth } = await this.getBalance();
    return {
      eth,
      usd: eth * ethPrice
    };
  }

  // Get current nonce, with caching for pending txs
  async getNonce() {
    const pending = Array.from(this.pendingTxs.values()).filter(tx => !tx.confirmed);
    const pendingCount = pending.length;
    const currentNonce = await this.provider.getTransactionCount(this.address, 'pending');
    return currentNonce + pendingCount;
  }

  // Wait for transaction confirmation
  async waitForConfirmation(txHash, confirmations = 1, timeout = 120000) {
    return this.provider.waitForTransaction(txHash, confirmations, timeout);
  }

  // Execute a raw transaction with retry logic
  async executeTransaction(txParams, options = {}) {
    const {
      maxRetries = 3,
      priorityFee = null,
      maxFeePerGas = null,
      gasLimit = null
    } = options;

    let attempt = 0;
    let lastError;

    while (attempt < maxRetries) {
      attempt++;
      try {
        // Get gas prices if not provided
        let gasSettings = {};
        if (!maxFeePerGas) {
          const feeData = await this.provider.getFeeData();
          gasSettings = {
            maxFeePerGas: feeData.maxFeePerGas || ethers.utils.parseUnits('50', 'gwei'),
            maxPriorityFeePerGas: priorityFee || feeData.maxPriorityFeePerGas || ethers.utils.parseUnits('2', 'gwei')
          };
        } else {
          gasSettings = { maxFeePerGas, maxPriorityFeePerGas: priorityFee };
        }

        // Estimate gas if not provided
        let gas = gasLimit;
        if (!gas) {
          try {
            gas = await this.provider.estimateGas(txParams);
            gas = gas.mul(120).div(100); // Add 20% buffer
          } catch (e) {
            gas = ethers.BigNumber.from(200000); // Default for swaps
          }
        }

        const tx = {
          ...txParams,
          ...gasSettings,
          gasLimit: gas,
          nonce: await this.getNonce(),
          chainId: (await this.provider.getNetwork()).chainId
        };

        console.log(`📤 Signing transaction (attempt ${attempt})...`);
        const signedTx = await this.wallet.signTransaction(tx);
        
        console.log(`📡 Sending transaction...`);
        const response = await this.provider.sendTransaction(signedTx);
        
        // Track pending tx
        this.pendingTxs.set(response.hash, { confirmed: false, nonce: tx.nonce });
        console.log(`⏳ Transaction submitted: ${response.hash}`);
        
        // Wait for confirmation
        const receipt = await this.waitForConfirmation(response.hash);
        
        this.pendingTxs.set(response.hash, { confirmed: true, receipt });
        
        return {
          success: true,
          hash: response.hash,
          receipt: {
            status: receipt.status,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed?.toString(),
            effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
            cumulativeGasUsed: receipt.cumulativeGasUsed?.toString()
          }
        };

      } catch (error) {
        lastError = error;
        console.error(`❌ Transaction attempt ${attempt} failed:`, error.message);
        
        // Handle nonce issues
        if (error.code === 'NONCE_EXPIRED' || error.message.includes('nonce')) {
          console.log('🔄 Retrying with fresh nonce...');
          this.pendingTxs.clear(); // Clear pending txs to reset nonce tracking
        } else if (error.code === 'INSUFFICIENT_FUNDS') {
          throw new Error('Insufficient funds for gas');
        } else if (attempt >= maxRetries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }

    throw lastError;
  }

  // Check if transaction was successful
  async checkTransaction(txHash) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) return { pending: true };
      return {
        pending: false,
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString()
      };
    } catch (e) {
      return { error: e.message };
    }
  }

  // Get current gas prices
  async getGasPrices() {
    const feeData = await this.provider.getFeeData();
    return {
      gasPrice: feeData.gasPrice ? parseFloat(ethers.utils.formatUnits(feeData.gasPrice, 'gwei')) : null,
      maxFeePerGas: feeData.maxFeePerGas ? parseFloat(ethers.utils.formatUnits(feeData.maxFeePerGas, 'gwei')) : null,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? parseFloat(ethers.utils.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')) : null
    };
  }

  // Estimate gas cost in USD
  async estimateGasCostUSD(gasLimit = 200000, ethPrice = 3200) {
    const feeData = await this.provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.utils.parseUnits('50', 'gwei');
    const gasCost = gasPrice.mul(gasLimit);
    const gasCostEth = parseFloat(ethers.utils.formatEther(gasCost));
    return {
      eth: gasCostEth,
      usd: gasCostEth * ethPrice,
      gwei: parseFloat(ethers.utils.formatUnits(gasPrice, 'gwei'))
    };
  }

  // Verify wallet address matches expected
  verifyAddress(expectedAddress) {
    return this.address.toLowerCase() === expectedAddress.toLowerCase();
  }

  // Get wallet info (without private key)
  getWalletInfo() {
    return {
      address: this.address,
      isConnected: true,
      network: null // Will be populated on first call
    };
  }
}

module.exports = { WalletManager };