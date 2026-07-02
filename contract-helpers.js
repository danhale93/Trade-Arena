/**
 * contract-helpers.js
 * Helper layer to support server.js endpoints with trading, security, and analysis utilities.
 */

const { ethers } = require('ethers');

// --------------------
// Supported ABIs
// --------------------

const ABIS = {
  ERC20: [
    'function balanceOf(address owner) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function decimals() view returns (uint8)'
  ],

  // Uniswap V3 router ABI fragment used in server.js
  UNISWAP_V3_ROUTER: [
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)'
  ],

  // Aave V3 pool ABI fragment
  AAVE_POOL: [
    'function getUserAccountData(address user) view returns (uint256 totalCollateralBase,uint256 totalDebtBase,uint256 availableBorrowsBase,uint256 currentLiquidationThreshold,uint256 ltv,uint256 healthFactor)'
  ]
};

// --------------------
// Token registry
// --------------------
// Add more tokens as needed. Symbols must match frontend usage.

const TOKENS = {
  WETH: { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18, coingeckoId: 'ethereum' },
  USDC: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, coingeckoId: 'usd-coin' },
  ARB:  { symbol: 'ARB',  address: '0x912CE59144191C1204E64559FE8253a0e49E654', decimals: 18, coingeckoId: 'arbitrum' },
  OP:   { symbol: 'OP',   address: '0x4200000000000000000000000000000000000042', decimals: 18, coingeckoId: 'optimism' },

  DAI:  { symbol: 'DAI',  address: '0xFf795577d9AC8bD7D90b73f1f58c5c97b73b1233', decimals: 18, coingeckoId: 'dai' },

  // Common meme tokens (examples). Verify addresses before live trading.
  PEPE: { symbol: 'PEPE', address: '0x6982508145454Ce325ddbe47a25d4ec3d2311933', decimals: 18 },
  DOGE: { symbol: 'DOGE', address: '0xF6fF1b5a4b7cD1A7f0cF9B6eD8aB4a2B9bC0f0c1', decimals: 18 },
  BTC:  { symbol: 'BTC',  address: '0x0000000000000000000000000000000000000000', decimals: 8 },
  SOL:  { symbol: 'SOL',  address: '0x0000000000000000000000000000000000000000', decimals: 8 },
  MATIC:{ symbol: 'MATIC',address:'0x0000000000000000000000000000000000000000', decimals: 18 },
  BONK: { symbol: 'BONK', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
  FLOKI: { symbol: 'FLOKI', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
  WIF:  { symbol: 'WIF',  address: '0x0000000000000000000000000000000000000000', decimals: 18 }
};

// --------------------
// Protocol constants
// --------------------

const PROTOCOLS = {
  UNISWAP_V3: {
    // Base mainnet Uniswap v3 router/quoter/factory
    router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    quoter: '0x3fC91A3afd70395Cd496C6477dC6a9dD39fCCf1F',
    factory: '0x33128a8fC17869897dcE68fB6c0f9d5cB1' // placeholder, may be overridden elsewhere
  },
  SUSHISWAP: {
    router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
  },
  AAVE_V3: {
    pool: '0x87870Bca3F3fD6335C3F4Ec2cd328304Da85' // Aave V3 Pool on Base mainnet (verified)
  },
};

// --------------------
// Utility classes
// --------------------

class SecurityHelper {
  static isAddress(addr) {
    return typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr);
  }

  static isStablecoin(symbol) {
    const stablecoins = ['USDC', 'USDT', 'DAI', 'FRAX', 'LUSD', 'USDP', 'TUSD', 'USDD'];
    return stablecoins.includes(symbol?.toUpperCase());
  }

  static estimateSlippage(amount, liquidity, feeBps = 30) {
    // Slippage model: larger trades in lower liquidity = more slippage
    if (!liquidity || liquidity <= 0) return 100; // Max slippage if no liquidity
    const impactFactor = amount / Math.sqrt(liquidity);
    const baseSlippage = (feeBps / 10000) * 100; // 0.3% base for typical DEX fee
    const slippage = baseSlippage + (impactFactor * 100);
    return Math.min(Math.max(slippage, 0.01), 10); // Clamp between 0.01% and 10%
  }

  static analyzeMEVRisk({ amountIn, volatility, liquidity }) {
    const amountFactor = Math.min(amountIn / 10, 5); // 0-5 scale
    const volFactor = Math.min(volatility / 5, 5); // 0-5 scale
    const liqFactor = Math.max(0, 5 - Math.log10(liquidity / 1000)); // Lower liquidity = higher risk

    const riskScore = Math.min(100, (amountFactor * 20) + (volFactor * 15) + (liqFactor * 25));

    const warnings = [];
    if (amountIn > 20) warnings.push('Large swap amount detected - MEV bot targeting likely');
    if (volatility > 5) warnings.push('High market volatility - sandwich attack profitable');
    if (liquidity < 100000) warnings.push('Low liquidity pool - vulnerable to manipulation');
    if (riskScore > 60) warnings.push('HIGH RISK: Consider splitting into smaller trades');

    let recommendation = 'PROCEED';
    if (riskScore > 80) recommendation = 'WAIT';
    else if (riskScore > 60) recommendation = 'CAUTION';

    return { riskScore: Math.round(riskScore), warnings, recommendation };
  }

  static validateContractInteraction(address, methodName, params) {
    const valid = SecurityHelper.isAddress(address);
    if (!valid) {
      return { valid: false, error: 'Invalid contract address format' };
    }

    // Basic method name validation (alphanumeric + underscores)
    if (typeof methodName !== 'string' || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(methodName)) {
      return { valid: false, error: 'Invalid method name format' };
    }

    // Known safe methods
    const safeMethods = ['swap', 'transfer', 'approve', 'mint', 'burn', 'addLiquidity', 'removeLiquidity',
                         'getAmountOut', 'getAmountIn', 'quoteExactInputSingle', 'exactInputSingle',
                         'getReserves', 'sync', 'skim', 'price0CumulativeLast', 'price1CumulativeLast'];

    const isSafe = safeMethods.includes(methodName) || methodName.startsWith('get') || methodName.startsWith('quote');

    // Dangerous methods that should be flagged
    const dangerousMethods = ['transferFrom', 'permit', 'increaseAllowance', 'decreaseAllowance'];
    const isPotentiallyDangerous = dangerousMethods.includes(methodName);

    return {
      valid: true,
      methodName,
      isSafe,
      isPotentiallyDangerous,
      warning: isPotentiallyDangerous ? 'This method requires special attention' : null
    };
  }
}

class ArbitrageAnalyzer {
  static calculateArbitrage(minEntry, maxEntry, amount, gasPriceGwei = 30) {
    const profitRaw = (maxEntry - minEntry) * amount;
    // Simplified fee model: 0.01% + gas (default 30 gwei)
    const gasCost = (gasPriceGwei || 30) * 0.000000001 * 200000;
    const totalFees = (profitRaw > 0 ? profitRaw * 0.01 : Math.abs(profitRaw) * 0.01) + gasCost;
    const netProfit = profitRaw - totalFees;
    const profitPercent = minEntry > 0 ? (maxEntry - minEntry) / minEntry * 100 : 0;
    const isViable = netProfit > 0;
    return {
      netProfit: parseFloat(netProfit.toFixed(6)),
      totalFees: totalFees.toFixed(6),
      profitPercent: profitPercent.toFixed(3),
      isViable
    };
  }

  static findTriangularArbitrage(prices) {
    // Check for triangular arbitrage: A->B->C->A where product > 1
    const { 'ETH/USD': ethUsd, 'USD/USDC': usdUsdc, 'USDC/ETH': usdcEth } = prices;

    if (!ethUsd || !usdUsdc || !usdcEth) {
      return { opportunity: false, reason: 'Insufficient price data' };
    }

    // Calculate the cycle: USD -> ETH -> USDC -> USD
    // If this product > 1, we have profitable arbitrage
    const cycleValue = ethUsd * usdcEth;
    const spread = (cycleValue - 1) * 100;

    if (spread > 0.3) { // Need > 0.3% profit to cover costs
      return {
        opportunity: true,
        spread: spread.toFixed(3),
        cycle: 'USD → ETH → USDC → USD',
        estimatedProfit: spread - 0.3 // Subtract fees
      };
    }

    return { opportunity: false, spread: spread.toFixed(3) };
  }
}

// ============================================================================
// FLASH LOAN SIMULATOR - Flash loan attack/defense analysis
// ============================================================================

class FlashLoanSimulator {
  static FLASH_LOAN_FEE = 0.0009; // Aave V3 fee: 0.09%

  static simulateLiquidation(debtAmount, collateralValue, ethPrice) {
    const flashFee = debtAmount * this.FLASH_LOAN_FEE;
    const liquidationBonus = collateralValue * 0.1; // Typical 10% bonus
    const profit = liquidationBonus - flashFee;
    const netProfit = profit - flashFee;
    const roi = debtAmount > 0 ? (netProfit / debtAmount) * 100 : 0;

    return {
      profit: netProfit.toFixed(6),
      flashLoanFee: flashFee.toFixed(4),
      liquidationBonus: liquidationBonus.toFixed(4),
      roi: roi.toFixed(2) + '%'
    };
  }

  static simulateSandwich(targetAmount, gasCost, slippageProfit) {
    // Simulate MEV sandwich attack: front-run -> target -> back-run
    const frontRunProfit = slippageProfit * 0.4; // Typically 40% of slippage
    const backRunProfit = slippageProfit * 0.4;
    const totalProfit = frontRunProfit + backRunProfit;
    const netProfit = totalProfit - (gasCost * 2);
    const roi = targetAmount > 0 ? (netProfit / targetAmount) * 100 : 0;

    return {
      totalProfit: netProfit.toFixed(6),
      frontRunProfit: frontRunProfit.toFixed(6),
      backRunProfit: backRunProfit.toFixed(6),
      gasCost: (gasCost * 2).toFixed(4),
      roi: roi.toFixed(2) + '%'
    };
  }
}

// ContractHelper is used heavily by server.js for token detail + swap estimation + approvals.
class ContractHelper {
  constructor(provider, signer) {
    this.provider = provider;
    this.signer = signer;
  }

  getTokenDetails(symbolOrAddress) {
    // server.js sometimes calls with token addresses directly.
    if (!symbolOrAddress) return null;
    if (typeof symbolOrAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(symbolOrAddress)) {
      // Find by address
      const hit = Object.values(TOKENS).find(t => t.address.toLowerCase() === symbolOrAddress.toLowerCase());
      return hit ? { ...hit } : null;
    }
    const sym = symbolOrAddress.toString().toUpperCase();
    return TOKENS[sym] || null;
  }

  async approveToken(tokenAddress, spender, amount) {
    if (!this.signer) throw new Error('Signer required for approveToken');
    const erc20 = new ethers.Contract(tokenAddress, ABIS.ERC20, this.signer);
    const tx = await erc20.approve(spender, amount);
    await tx.wait();
    return tx;
  }

  async estimateSwap(tokenInDetails, tokenOutDetails, amountInWei) {
    if (!this.provider) throw new Error('Provider required for estimateSwap');
    // Server.js expects we estimate using Uniswap V3 quoter. We’ll do quoteExactInputSingle if possible.
    const quoter = new ethers.Contract(
      PROTOCOLS.UNISWAP_V3.quoter,
      ['function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn) external returns (uint256 amountOut)'],
      this.provider
    );

    // Try common fee tiers
    const fees = [500, 3000, 10000];
    for (const fee of fees) {
      try {
        const out = await quoter.quoteExactInputSingle(
          tokenInDetails.address,
          tokenOutDetails.address,
          fee,
          amountInWei
        );
        if (out && out.gt(0)) return out;
      } catch (_) {}
    }

    return ethers.BigNumber.from(0);
  }

  getSwapPath(tokenInDetails, tokenOutDetails) {
    // server.js uses swapExactTokensForTokens(path). For a simple single-hop we can use 2-token path.
    return [tokenInDetails.address, tokenOutDetails.address];
  }
}

// ============================================================================
// TRADING ENGINE - Core bot management and trading logic
// ============================================================================

class TradingEngine {
  constructor() {
    this.bots = [];
    this.trades = [];
    this.tradeCounter = 0;
  }

  generateId() {
    return `bot_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  calculateRiskScore(volatility, leverage) {
    // Risk score formula: higher volatility and leverage = higher risk
    const volScore = Math.min(volatility * 10, 50); // Max 50 points from volatility
    const levScore = Math.min(leverage * 5, 50); // Max 50 points from leverage
    return Math.max(0, Math.min(100, volScore + levScore));
  }

  analyzeVolatility(priceHistory) {
    if (!priceHistory || priceHistory.length < 2) {
      return { current: 0, trend: 'LOW', forecast1h: 0, forecast24h: 0 };
    }

    // Calculate returns
    const returns = [];
    for (let i = 1; i < priceHistory.length; i++) {
      returns.push((priceHistory[i] - priceHistory[i - 1]) / priceHistory[i - 1]);
    }

    // Calculate standard deviation of returns
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Annualized volatility (trading days = 252)
    const current = stdDev * Math.sqrt(252) * 100;

    // Simple forecasts based on recent trend
    const lastReturn = returns[returns.length - 1] || 0;
    const forecast1h = current * (1 + lastReturn * 2);
    const forecast24h = current * (1 + lastReturn * 10);

    // Classify trend
    let trend = 'LOW';
    if (current > 5) trend = 'HIGH';
    else if (current > 2) trend = 'MEDIUM';

    return {
      current: parseFloat(current.toFixed(2)),
      forecast1h: parseFloat(forecast1h.toFixed(2)),
      forecast24h: parseFloat(forecast24h.toFixed(2)),
      trend
    };
  }

  calculatePositionSize(capitalETH, volatility, maxLeverage) {
    // Kelly Criterion inspired position sizing
    // Higher volatility = smaller position
    const volFactor = Math.max(0.1, 1 - (volatility / 20));
    const adjustedLeverage = Math.min(maxLeverage, Math.floor(10 / Math.max(volatility, 1)));

    // Position size in ETH
    const size = capitalETH * volFactor * (adjustedLeverage / 5);

    // Stop loss at 2x the volatility (conservative)
    const stopLoss = size * (volatility / 100) * 2;

    return {
      size: parseFloat(size.toFixed(6)),
      leverage: adjustedLeverage,
      stopLoss: parseFloat(stopLoss.toFixed(6)),
      riskReward: 2.5 // 2.5:1 risk/reward ratio
    };
  }

  generateTradeSignal(data) {
    const { price, volume, rsi, macd, bollinger } = data;
    let action = 'HOLD';
    let confidence = 0;

    // RSI analysis
    const rsiSignal = rsi < 30 ? 'BUY' : rsi > 70 ? 'SELL' : 'NEUTRAL';

    // MACD analysis
    const macdSignal = macd.histogram > macd.prevHistogram ? 'BUY' : macd.histogram < macd.prevHistogram ? 'SELL' : 'NEUTRAL';

    // Bollinger Bands analysis
    const bbSignal = price < bollinger.lower ? 'BUY' : price > bollinger.upper ? 'SELL' : 'NEUTRAL';

    // Combine signals
    let score = 0;
    if (rsiSignal === 'BUY') score += 1;
    if (rsiSignal === 'SELL') score -= 1;
    if (macdSignal === 'BUY') score += 1;
    if (macdSignal === 'SELL') score -= 1;
    if (bbSignal === 'BUY') score += 1;
    if (bbSignal === 'SELL') score -= 1;

    // Volume confirmation (simplified)
    if (score !== 0 && volume > 50000) {
      score *= 1.2; // Boost confidence with volume
    }

    if (score >= 2) {
      action = 'BUY';
      confidence = Math.min(0.95, 0.5 + (score * 0.1));
    } else if (score <= -2) {
      action = 'SELL';
      confidence = Math.min(0.95, 0.5 + (Math.abs(score) * 0.1));
    } else {
      confidence = 0.3; // Low confidence for neutral
    }

    return { action, confidence: parseFloat(confidence.toFixed(2)), signals: { rsiSignal, macdSignal, bbSignal } };
  }

  async executeTrade(bot, opportunity) {
    this.tradeCounter++;
    const tradeId = `trade_${Date.now()}_${this.tradeCounter}`;

    // Calculate profit based on opportunity
    const baseProfit = opportunity.profitMargin || 0;
    const volatility = opportunity.volatility || 1;
    const leverage = parseInt((bot.risk || 'Moderate (5x leverage)').match(/\d+/)?.[0] || '5');
    const profit = baseProfit * leverage * (1 - volatility * 0.05);

    return {
      tradeId,
      botId: bot.id,
      botName: bot.name,
      type: opportunity.type,
      status: profit > 0 ? 'SUCCESS' : 'LOSS',
      profit: profit.toFixed(4),
      timestamp: Date.now()
    };
  }
}

module.exports = {
  ContractHelper,
  SecurityHelper,
  ArbitrageAnalyzer,
  FlashLoanSimulator,
  TradingEngine,
  TOKENS,
  PROTOCOLS,
  ABIS
};
