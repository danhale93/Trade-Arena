/**
 * swap-engine.js
 * Multi-DEX swap execution engine for Base chain
 * Supports: Uniswap V2, Uniswap V3, SushiSwap, and more
 */

const { ethers } = require('ethers');
const axios = require('axios');

// DEX Configurations for Base
const DEX_CONFIG = {
  UNISWAP_V2: {
    name: 'Uniswap V2',
    router: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24', // Base V2 Router
    factory: '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC1',
    initCodeHash: '0xd306a548755c7e2cca4106ad10e9537593d3d0b1ca9584cde3e7c795c0ea1d5',
    fee: 0.003 // 0.3%
  },
  UNISWAP_V3: {
    name: 'Uniswap V3',
    router: '0x2626664c2603336E57B271c5C0b26F421741e481', // Base V3 Router
    quoter: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
    factory: '0x33128a8fC17869897dcE68fB6c0f9d5cB1',
    pools: {}, // Cache for pool addresses
    fees: [500, 3000, 10000] // 0.05%, 0.3%, 1%
  },
  SUSHISWAP: {
    name: 'SushiSwap',
    router: '0x6BDED42c6DA8FBf0d2bA55B2fa120C5e0c8D7891', // Base SushiSwap Router
    factory: '0x9bB2c0Aa22e2dEC8a5D2cc42bA2C5eEb84aB1c2c',
    fee: 0.003 // 0.3%
  },
  CURVE: {
    name: 'Curve',
    // Base Curve pools need to be configured
    pools: {}
  }
};

// Common ABIs
const ABIS = {
  ERC20: [
    'function balanceOf(address owner) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)'
  ],
  UNISWAP_V2_ROUTER: [
    'function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
  ],
  UNISWAP_V3_ROUTER: [
    'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
    'function exactInput(tuple(bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)',
    'function multicall(uint256 deadline, bytes[] memory data) external payable returns (bytes[] memory)'
  ],
  UNISWAP_V3_QUOTER: [
    'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
    'function quoteExactInput(bytes memory path, uint256 amountIn) external returns (uint256 amountOut)'
  ]
};

class SwapEngine {
  constructor(provider, walletManager) {
    this.provider = provider;
    this.wallet = walletManager;
    this.contracts = {};
    this.tokens = {};
    
    // Initialize DEX contracts
    this._initContracts();
  }

  _initContracts() {
    // Uniswap V2
    this.contracts.uniswapV2 = new ethers.Contract(
      DEX_CONFIG.UNISWAP_V2.router,
      ABIS.UNISWAP_V2_ROUTER,
      this.wallet.wallet
    );

    // Uniswap V3 Router
    this.contracts.uniswapV3 = new ethers.Contract(
      DEX_CONFIG.UNISWAP_V3.router,
      ABIS.UNISWAP_V3_ROUTER,
      this.wallet.wallet
    );

    // Uniswap V3 Quoter (read-only)
    this.contracts.uniswapV3Quoter = new ethers.Contract(
      DEX_CONFIG.UNISWAP_V3.quoter,
      ABIS.UNISWAP_V3_QUOTER,
      this.provider
    );

    // SushiSwap
    this.contracts.sushiSwap = new ethers.Contract(
      DEX_CONFIG.SUSHISWAP.router,
      ABIS.UNISWAP_V2_ROUTER,
      this.wallet.wallet
    );
  }

  // Get token contract
  getTokenContract(tokenAddress) {
    return new ethers.Contract(tokenAddress, ABIS.ERC20, this.provider);
  }

  // Get token info
  async getTokenInfo(tokenAddress) {
    const token = this.getTokenContract(tokenAddress);
    const [decimals, symbol, name] = await Promise.all([
      token.decimals(),
      token.symbol(),
      token.name()
    ]);
    return { address: tokenAddress, decimals, symbol, name };
  }

  // Get token balance
  async getTokenBalance(tokenAddress, address = this.wallet.address) {
    const token = this.getTokenContract(tokenAddress);
    const balance = await token.balanceOf(address);
    const decimals = await token.decimals();
    return {
      raw: balance,
      formatted: parseFloat(ethers.utils.formatUnits(balance, decimals)),
      decimals
    };
  }

  // Get allowance
  async getAllowance(tokenAddress, spender) {
    const token = this.getTokenContract(tokenAddress);
    const allowance = await token.allowance(this.wallet.address, spender);
    return allowance;
  }

  // Check and approve token if needed
  async ensureApproval(tokenAddress, spender, amount) {
    const currentAllowance = await this.getAllowance(tokenAddress, spender);
    
    // Check if already approved with sufficient amount
    if (currentAllowance.gte(amount)) {
      return { approved: true, tx: null };
    }

    console.log(`🔓 Approving ${spender} to spend tokens...`);
    const token = new ethers.Contract(tokenAddress, ABIS.ERC20, this.wallet.wallet);

    // Approve max uint256
    const tx = await this.walletManager.executeTransaction({
      to: tokenAddress,
      data: token.interface.encodeFunctionData('approve', [
        spender,
        ethers.constants.MaxUint256
      ])
    });

    return { approved: false, tx };
  }

  // Get best route across DEXes
  async getBestRoute(tokenIn, tokenOut, amountIn, dexFilter = null) {
    const dexes = dexFilter 
      ? [DEX_CONFIG[dexFilter]] 
      : [DEX_CONFIG.UNISWAP_V2, DEX_CONFIG.UNISWAP_V3, DEX_CONFIG.SUSHISWAP];

    const results = [];

    for (const dex of dexes) {
      try {
        let quote;
        let path = [tokenIn, tokenOut];

        if (dex.name === 'Uniswap V3') {
          // Try all fee tiers
          for (const fee of dex.fees) {
            try {
              quote = await this.contracts.uniswapV3Quoter.callStatic.quoteExactInputSingle(
                tokenIn,
                tokenOut,
                fee,
                amountIn,
                0 // sqrtPriceLimitX96
              );
              
              if (quote && quote.gt(0)) {
                results.push({
                  dex: dex.name,
                  dexKey: 'UNISWAP_V3',
                  amountOut: quote,
                  path,
                  fee,
                  gasEstimate: 150000
                });
                break;
              }
            } catch (e) {
              // Try next fee tier
            }
          }
        } else {
          // Uniswap V2 / SushiSwap
          const contract = dex.name === 'SushiSwap' 
            ? this.contracts.sushiSwap 
            : this.contracts.uniswapV2;
          
          quote = await contract.getAmountsOut(amountIn, path);
          
          if (quote && quote.length > 1 && quote[1].gt(0)) {
            results.push({
              dex: dex.name,
              dexKey: dex === DEX_CONFIG.UNISWAP_V2 ? 'UNISWAP_V2' : 'SUSHISWAP',
              amountOut: quote[1],
              path,
              gasEstimate: dex.name === 'SushiSwap' ? 140000 : 130000
            });
          }
        }
      } catch (e) {
        console.log(`⚠️ ${dex.name} quote failed: ${e.message}`);
      }
    }

    if (results.length === 0) {
      return null;
    }

    // Sort by best output
    results.sort((a, b) => b.amountOut.sub(a.amountOut));
    return results[0];
  }

  // Build swap transaction
  async buildSwap(params) {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      minAmountOut,
      dex = 'UNISWAP_V3',
      recipient = this.wallet.address,
      deadlineMinutes = 20
    } = params;

    const deadline = Math.floor(Date.now() / 1000) + (deadlineMinutes * 60);
    const amountInStr = ethers.utils.parseUnits(amountIn.toString(), 18); // Assuming 18 decimals
    
    const dexConfig = DEX_CONFIG[dex];
    if (!dexConfig) throw new Error(`Unknown DEX: ${dex}`);

    let txData;

    if (dex === 'UNISWAP_V3') {
      const path = ethers.utils.solidityPack(
        ['address', 'uint24', 'address'],
        [tokenIn, params.fee || 3000, tokenOut]
      );

      txData = this.contracts.uniswapV3.interface.encodeFunctionData('exactInput', [{
        path: path,
        recipient: recipient,
        deadline: deadline,
        amountIn: amountInStr,
        amountOutMinimum: ethers.utils.parseUnits(minAmountOut.toString(), 18)
      }]);

      txData = {
        to: dexConfig.router,
        data: this.contracts.uniswapV3.interface.encodeFunctionData('exactInput', [
          ethers.utils.defaultAbiCoder.encode(
            ['tuple(bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)'],
            [path, recipient, deadline, amountInStr, ethers.utils.parseUnits(minAmountOut.toString(), 18)]
          )
        ]),
        value: 0
      };
    } else {
      // Uniswap V2 / SushiSwap
      let contract;
      if (dex === 'SUSHISWAP') {
        contract = this.contracts.sushiSwap;
      } else {
        contract = this.contracts[dex.toLowerCase()] || this.contracts.uniswapV2;
      }
      
      // Get token decimals for correct conversion
      const tokenInInfo = await this.getTokenInfo(tokenIn);
      const tokenOutInfo = await this.getTokenInfo(tokenOut);
      const amountInWei = ethers.utils.parseUnits(amountIn.toString(), tokenInInfo.decimals);
      // Round minAmountOut to token decimals to avoid parseFixed underflow
      const minOutRounded = parseFloat(minAmountOut.toFixed(tokenOutInfo.decimals));
      const minOutWei = ethers.utils.parseUnits(minOutRounded.toString(), tokenOutInfo.decimals);
      
      txData = {
        to: dexConfig.router,
        data: contract.interface.encodeFunctionData('swapExactTokensForTokens', [
          amountInWei,
          minOutWei,
          [tokenIn, tokenOut],
          recipient,
          deadline
        ]),
        value: 0
      };
    }

    return txData;
  }

  // Execute a swap
  async executeSwap(params) {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      minAmountOut,
      dex = 'UNISWAP_V3',
      slippage = 0.5 // 0.5% slippage default
    } = params;

    console.log(`🔄 Preparing ${dex} swap: ${amountIn} ${tokenIn} -> ${tokenOut}`);

    try {
      // 1. Get token info and check balance
      const tokenInInfo = await this.getTokenInfo(tokenIn);
      const amountInWei = ethers.utils.parseUnits(amountIn.toString(), tokenInInfo.decimals);
      
      const balance = await this.getTokenBalance(tokenIn);
      if (balance.formatted < amountIn) {
        throw new Error(`Insufficient balance. Have: ${balance.formatted}, Need: ${amountIn}`);
      }

      // 2. Get quote and calculate minAmountOut
      const route = await this.getBestRoute(tokenIn, tokenOut, amountInWei, dex);
      if (!route) {
        throw new Error('No route found for this swap');
      }

      const tokenOutInfo = await this.getTokenInfo(tokenOut);
      const expectedOut = parseFloat(ethers.utils.formatUnits(route.amountOut, tokenOutInfo.decimals));
      // Round to token decimals to avoid overflow errors
      const minOut = parseFloat(expectedOut.toFixed(tokenOutInfo.decimals)) * (1 - slippage / 100);

      console.log(`📊 Route: ${route.dex}, Expected out: ${expectedOut.toFixed(6)} ${tokenOutInfo.symbol}`);

      // 3. Ensure approval
      const dexConfig = DEX_CONFIG[dex];
      const approval = await this.ensureApproval(tokenIn, dexConfig.router, amountInWei);
      if (!approval.approved && approval.tx) {
        console.log('⏳ Waiting for approval confirmation...');
        await approval.tx;
      }

      // 4. Build transaction
      const txData = await this.buildSwap({
        tokenIn,
        tokenOut,
        amountIn,
        minAmountOut: minOut,
        dex,
        fee: route.fee
      });

      // 5. Execute swap
      const result = await this.wallet.executeTransaction(txData, {
        gasLimit: ethers.BigNumber.from(route.gasEstimate)
      });

      return {
        success: true,
        hash: result.hash,
        dex: route.dex,
        amountIn,
        amountOut: expectedOut.toFixed(6),
        minAmountOut: minOut.toFixed(6),
        tx: result.receipt
      };

    } catch (error) {
      console.error(`❌ Swap failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get all available pools for a pair
  async getPoolsForPair(tokenA, tokenB) {
    const pools = [];

    for (const [dexKey, dex] of Object.entries(DEX_CONFIG)) {
      if (dexKey === 'CURVE') continue; // Curve needs special handling

      try {
        if (dexKey === 'UNISWAP_V3') {
          for (const fee of dex.fees) {
            pools.push({
              dex: dex.name,
              dexKey,
              fee,
              tokenA,
              tokenB
            });
          }
        } else {
          pools.push({
            dex: dex.name,
            dexKey,
            fee: dex.fee * 10000, // Convert to bps
            tokenA,
            tokenB
          });
        }
      } catch (e) {
        // Skip this DEX
      }
    }

    return pools;
  }
}

module.exports = { SwapEngine, DEX_CONFIG };