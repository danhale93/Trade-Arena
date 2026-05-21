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
      const tokenInInfo = await this.tokenDiscovery.getToken(tokenIn);
      const tokenOutInfo = await this.tokenDiscovery.getToken(tokenOut);

      if (!tokenInInfo || !tokenOutInfo) {
        throw new Error('Token not found');
      }

      // Convert amount to wei
      const amountInWei = ethers.utils.parseUnits(amountIn.toString(), tokenInInfo.decimals);

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
      // Uniswap V3
      const v3Routes = await this._getUniswapV3Route(tokenIn, tokenOut, amountIn);
      if (v3Routes) routes.push(...v3Routes);
    } catch (e) {}

    try {
      // Uniswap V2
      const v2Route = await this.swapEngine.getBestRoute(tokenIn, tokenOut, amountIn, 'UNISWAP_V2');
      if (v2Route) routes.push(v2Route);
    } catch (e) {}

    try {
      // SushiSwap
      const sushiRoute = await this.swapEngine.getBestRoute(tokenIn, tokenOut, amountIn, 'SUSHISWAP');
      if (sushiRoute) routes.push(sushiRoute);
    } catch (e) {}

    // Sort by best output
    routes.sort((a, b) => b.amountOut.sub(a.amountOut));
    return routes;
  }

  // Get Uniswap V3 route
  async _getUniswapV3Route(tokenIn, tokenOut, amountIn) {
    const fees = [500, 3000, 10000];
    const routes = [];

    for (const fee of fees) {
      try {
        const quote = await this.swapEngine.contracts.uniswapV3Quoter.callStatic.quoteExactInputSingle(
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
        }
      } catch (e) {
        // Try next fee
      }
    }

    return routes;
  }

  // Estimate price impact
  _estimatePriceImpact(amountIn, amountOut, tokenIn, tokenOut) {
    // Simplified price impact calculation
    const valueIn = parseFloat(ethers.utils.formatUnits(amountIn, tokenIn.decimals));
    const valueOut = parseFloat(ethers.utils.formatUnits(amountOut, tokenOut.decimals));
    
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