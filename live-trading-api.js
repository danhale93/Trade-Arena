/**
 * live-trading-api.js
 * High-level API for live onchain trading
 * Combines wallet manager, swap engine, and token discovery
 */

const { WalletManager } = require('./wallet-manager');
const { SwapEngine } = require('./swap-engine');
const { TokenDiscovery } = require('./token-discovery');

class LiveTradingAPI {
  constructor(config = {}) {
    const {
      privateKey,
      rpcUrl = 'https://mainnet.base.org',
      slippageTolerance = 0.5, // 0.5%
      gasBuffer = 1.2, // 20% gas buffer
      maxGasPrice = 200 // max 200 gwei
    } = config;

    if (!privateKey) {
      throw new Error('Private key required for live trading');
    }

    this.slippageTolerance = slippageTolerance;
    this.gasBuffer = gasBuffer;
    this.maxGasPrice = maxGasPrice;

    // Initialize components
    this.walletManager = new WalletManager(privateKey, rpcUrl);
    this.provider = this.walletManager.provider;
    this.swapEngine = new SwapEngine(this.provider, this.walletManager);
    this.tokenDiscovery = new TokenDiscovery(this.provider);

    // State
    this.activeOrders = new Map();
    this.tradeHistory = [];
  }

  // Get wallet info
  async getWalletInfo() {
    const balance = await this.walletManager.getBalance();
    const gasPrices = await this.walletManager.getGasPrices();

    return {
      address: this.walletManager.address,
      balanceETH: balance.eth,
      balanceWei: balance.wei.toString(),
      network: 'Base Mainnet',
      gasPrices,
      slippageTolerance: this.slippageTolerance
    };
  }

  // Get all token balances
  async getAllBalances() {
    const balances = {
      ETH: await this.walletManager.getBalance()
    };

    const tokens = await this.tokenDiscovery.discoverPopularTokens();

    for (const token of tokens) {
      try {
        const balance = await this.swapEngine.getTokenBalance(token.address);
        if (balance.formatted > 0) {
          const price = await this.tokenDiscovery.getPrice(token.coingeckoId);
          balances[token.symbol] = {
            ...balance,
            price: price?.usd,
            valueUSD: price?.usd ? balance.formatted * price.usd : null
          };
        }
      } catch (e) {
        // Skip failed balances
      }
    }

    return balances;
  }

  // Get quote for a swap
  async getQuote(params) {
    const { tokenIn, tokenOut, amountIn } = params;

    try {
      // Get token info
      let tokenInInfo = await this.tokenDiscovery.getToken(tokenIn);
      let tokenOutInfo = await this.tokenDiscovery.getToken(tokenOut);

      // Handle native ETH (convert to WETH address for trading)
      if (tokenIn?.toUpperCase() === 'ETH' || tokenIn?.toLowerCase() === 'eth') {
        tokenInInfo = { ...KNOWN_TOKENS.WETH, isNative: true };
      }
      if (tokenOut?.toUpperCase() === 'ETH' || tokenOut?.toLowerCase() === 'eth') {
        tokenOutInfo = { ...KNOWN_TOKENS.WETH };
      }

      if (!tokenInInfo || !tokenOutInfo) {
        throw new Error('Token not found');
      }

      // Convert amount to wei (handle both string and number)
      const amountNum = typeof amountIn === 'string' ? parseFloat(amountIn) : amountIn;
      const amountInWei = ethers.utils.parseEther(amountNum.toString());

      // Get best route from all DEXes
      const routes = await this._getAllRoutes(tokenInInfo.address, tokenOutInfo.address, amountInWei);

      if (routes.length === 0) {
        return { success: false, error: 'No routes found' };
      }

      // Get gas estimate
      const gasCost = await this.walletManager.estimateGasCostUSD();

      // Get prices
      const priceIn = await this.tokenDiscovery.getPrice(tokenInInfo.coingeckoId);
      const priceOut = await this.tokenDiscovery.getPrice(tokenOutInfo.coingeckoId);

      return {
        success: true,
        tokenIn: tokenInInfo,
        tokenOut: tokenOutInfo,
        amountIn,
        amountInWei: amountInWei.toString(),
        routes: routes.map(r => ({
          dex: r.dex,
          amountOut: parseFloat(ethers.utils.formatUnits(r.amountOut, tokenOutInfo.decimals)),
          priceImpact: this._estimatePriceImpact(amountIn, r.amountOut, tokenInInfo, tokenOutInfo),
          gasEstimate: r.gasEstimate
        })),
        gasCost,
        prices: {
          tokenIn: priceIn?.usd,
          tokenOut: priceOut?.usd
        },
        timestamp: Date.now()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get routes from all DEXes
  async _getAllRoutes(tokenIn, tokenOut, amountIn) {
    const routes = [];

    try {
      // Uniswap V2 (most reliable for basic swaps)
      const v2Route = await this._getUniswapV2Route(tokenIn, tokenOut, amountIn);
      if (v2Route) routes.push(v2Route);
    } catch (e) {
      console.log('V2 route error:', e.message.substring(0, 100));
    }

    try {
      // SushiSwap
      const sushiRoute = await this._getSushiSwapRoute(tokenIn, tokenOut, amountIn);
      if (sushiRoute) routes.push(sushiRoute);
    } catch (e) {
      console.log('SushiSwap route error:', e.message.substring(0, 100));
    }

    try {
      // Uniswap V3 (try all fee tiers)
      const v3Routes = await this._getUniswapV3Route(tokenIn, tokenOut, amountIn);
      if (v3Routes && v3Routes.length > 0) routes.push(...v3Routes);
    } catch (e) {
      console.log('V3 route error:', e.message.substring(0, 100));
    }

    // Sort by best output
    if (routes.length > 0) {
      routes.sort((a, b) => b.amountOut.sub(a.amountOut));
    }
    return routes;
  }

  // Get Uniswap V2 route
  async _getUniswapV2Route(tokenIn, tokenOut, amountIn) {
    const ROUTER = '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24';
    const abi = ['function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)'];
    const router = new ethers.Contract(ROUTER, abi, this.provider);

    const path = [tokenIn, tokenOut];
    const amounts = await router.getAmountsOut(amountIn, path);

    if (amounts && amounts.length > 1 && amounts[1].gt(0)) {
      return {
        dex: 'Uniswap V2',
        dexKey: 'UNISWAP_V2',
        amountOut: amounts[1],
        path,
        gasEstimate: 130000
      };
    }
    return null;
  }

  // Get SushiSwap route
  async _getSushiSwapRoute(tokenIn, tokenOut, amountIn) {
    const ROUTER = '0x6BDED42c6DA8FBf0d2bA55B2fa120C5e0c8D7891';
    const abi = ['function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)'];
    const router = new ethers.Contract(ROUTER, abi, this.provider);

    const path = [tokenIn, tokenOut];
    const amounts = await router.getAmountsOut(amountIn, path);

    if (amounts && amounts.length > 1 && amounts[1].gt(0)) {
      return {
        dex: 'SushiSwap',
        dexKey: 'SUSHISWAP',
        amountOut: amounts[1],
        path,
        gasEstimate: 140000
      };
    }
    return null;
  }

  // Get Uniswap V3 route
  async _getUniswapV3Route(tokenIn, tokenOut, amountIn) {
    const QUOTER = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a';
    const fees = [500, 3000, 10000];
    const routes = [];

    // Use simpler ABI
    const abi = ['function quoteExactInputSingle(address, address, uint24, uint256, uint160) external returns (uint256)'];
    const quoter = new ethers.Contract(QUOTER, abi, this.provider);

    for (const fee of fees) {
      try {
        const quote = await quoter.callStatic.quoteExactInputSingle(
          tokenIn,
          tokenOut,
          fee,
          amountIn,
          0
        );

        if (quote && quote.gt(0)) {
          routes.push({
            dex: 'Uniswap V3',
            dexKey: 'UNISWAP_V3',
            amountOut: quote,
            fee,
            gasEstimate: 150000
          });
          break; // Take the first successful quote
        }
      } catch (e) {
        // Try next fee
      }
    }

    return routes;
  }

  // Estimate price impact
  _estimatePriceImpact(amountIn, amountOut, tokenIn, tokenOut) {
    // Handle both string/number amountIn and BigNumber amountOut
    const valueIn = typeof amountIn === 'string' || typeof amountIn === 'number'
      ? parseFloat(amountIn.toString())
      : parseFloat(ethers.utils.formatUnits(amountIn, tokenIn.decimals || 18));

    const valueOut = ethers.utils.formatUnits(amountOut, tokenOut.decimals || 6);

    // Assume 1:1 pricing for stablecoins, real pricing for others
    let expectedRate = 1;
    if (tokenIn.coingeckoId && tokenOut.coingeckoId) {
      // Real pricing would go here
    }

    const expectedOut = valueIn * expectedRate;
    const impact = expectedOut > 0 ? ((expectedOut - valueOut) / expectedOut) * 100 : 0;
    return Math.max(0, impact);
  }

  // Execute a swap
  async executeSwap(params) {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      selectedDex = null,
      customSlippage = null
    } = params;

    const slippage = customSlippage || this.slippageTolerance;

    // Generate order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Get quote first
      const quote = await this.getQuote({ tokenIn, tokenOut, amountIn });
      if (!quote.success) {
        return { success: false, error: quote.error, orderId };
      }

      // Select best route or specified route
      let route;
      if (selectedDex) {
        route = quote.routes.find(r => r.dex === selectedDex);
        if (!route) {
          return { success: false, error: `DEX ${selectedDex} not available for this pair`, orderId };
        }
      } else {
        route = quote.routes[0];
      }

      // Execute swap
      const result = await this.swapEngine.executeSwap({
        tokenIn: quote.tokenIn.address,
        tokenOut: quote.tokenOut.address,
        amountIn,
        minAmountOut: route.amountOut * (1 - slippage / 100),
        dex: route.dexKey || route.dex.toUpperCase().replace(' ', '_'),
        slippage
      });

      // Record trade
      const trade = {
        orderId,
        ...result,
        tokenIn: quote.tokenIn.symbol,
        tokenOut: quote.tokenOut.symbol,
        amountIn,
        amountOut: result.success ? result.amountOut : null,
        dex: route.dex,
        slippage,
        timestamp: Date.now()
      };

      this.tradeHistory.push(trade);
      this.activeOrders.delete(orderId);

      return {
        success: result.success,
        orderId,
        ...trade
      };

    } catch (error) {
      this.activeOrders.delete(orderId);
      return {
        success: false,
        orderId,
        error: error.message
      };
    }
  }

  // Execute swap with exact output (for limit orders)
  async executeSwapExactOutput(params) {
    const { tokenIn, tokenOut, amountOut, maxAmountIn } = params;

    // Get quote for max input
    const quote = await this.getQuote({ tokenIn, tokenOut, amountIn: maxAmountIn });
    if (!quote.success || quote.routes.length === 0) {
      return { success: false, error: 'Cannot execute this trade' };
    }

    // Use best route
    const route = quote.routes[0];

    if (route.amountOut < amountOut) {
      return { success: false, error: `Insufficient liquidity. Max output: ${route.amountOut}` };
    }

    // Execute
    return this.executeSwap({
      tokenIn,
      tokenOut,
      amountIn: maxAmountIn,
      customSlippage: 1 // 1% slippage for exact output
    });
  }

  // Get trade history
  getTradeHistory(limit = 50) {
    return this.tradeHistory.slice(-limit);
  }

  // Wrap ETH to WETH
  async wrapETH(amountETH) {
    try {
      const WETH = '0x4200000000000000000000000000000000000006';
      const amountWei = ethers.utils.parseEther(amountETH.toString());

      const tx = await this.walletManager.executeTransaction({
        to: WETH,
        data: '0xd0e30db0', // deposit()
        value: amountWei
      });

      return {
        success: true,
        action: 'wrap',
        amountETH,
        amountWei: amountWei.toString(),
        hash: tx.hash,
        message: `Wrapped ${amountETH} ETH to WETH`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Unwrap WETH to ETH
  async unwrapWETH(amountETH) {
    try {
      const WETH = '0x4200000000000000000000000000000000000006';
      const amountWei = ethers.utils.parseEther(amountETH.toString());

      const tx = await this.walletManager.executeTransaction({
        to: WETH,
        data: '0x2e1a7d4d' + ethers.utils.defaultAbiCoder.encode(['uint256'], [amountWei]).slice(2)
      });

      return {
        success: true,
        action: 'unwrap',
        amountETH,
        amountWei: amountWei.toString(),
        hash: tx.hash,
        message: `Unwrapped ${amountETH} WETH to ETH`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Check order status
  async checkOrder(orderId) {
    // Check if still pending
    if (this.activeOrders.has(orderId)) {
      return { status: 'pending', orderId };
    }

    // Check history
    const trade = this.tradeHistory.find(t => t.orderId === orderId);
    if (trade) {
      return {
        status: trade.success ? 'completed' : 'failed',
        orderId,
        ...trade
      };
    }

    return { status: 'not_found', orderId };
  }

  // Cancel pending order (if applicable)
  cancelOrder(orderId) {
    if (this.activeOrders.has(orderId)) {
      this.activeOrders.delete(orderId);
      return { success: true, orderId, message: 'Order cancelled' };
    }
    return { success: false, orderId, message: 'Order not found or already executed' };
  }
}

// Import ethers for utils
const ethers = require('ethers');

module.exports = { LiveTradingAPI };