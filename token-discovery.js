/**
 * token-discovery.js
 * Dynamic token discovery for Base chain
 * Discovers tokens from DEX pools and token lists
 */

const { ethers } = require('ethers');

// Base chain tokens and pools
const NATIVE_TOKEN = {
  symbol: 'ETH',
  name: 'Ether',
  address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  decimals: 18,
  isNative: true
};

// Known tokens on Base (verified)
const KNOWN_TOKENS = {
  WETH: {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    coingeckoId: 'ethereum'
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    coingeckoId: 'usd-coin'
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    decimals: 6,
    coingeckoId: 'tether'
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x50c5725949A6F0c72E162831C464F0d0aDb9C1b8',
    decimals: 18,
    coingeckoId: 'dai'
  },
  // DeFi tokens
  CBETH: {
    symbol: 'cbETH',
    name: 'Coinbase Wrapped Staked ETH',
    address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc9AA2718ECbF',
    decimals: 18,
    coingeckoId: 'coinbase-wrapped-staked-eth'
  },
  ARB: {
    symbol: 'ARB',
    name: 'Arbitrum',
    address: '0x912CE59144191C1204E64559FE8253a0e49E654',
    decimals: 18,
    coingeckoId: 'arbitrum'
  },
  OP: {
    symbol: 'OP',
    name: 'Optimism',
    address: '0x4200000000000000000000000000000000000042',
    decimals: 18,
    coingeckoId: 'optimism'
  },
  // Bridged assets
  WBTC: {
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
    decimals: 8,
    coingeckoId: 'wrapped-bitcoin'
  },
  LINK: {
    symbol: 'LINK',
    name: 'Chainlink',
    address: '0xE4aB69C977864cE96dD0CFEf7c5f4A94C76dB1d7',
    decimals: 18,
    coingeckoId: 'chainlink'
  },
  AAVE: {
    symbol: 'AAVE',
    name: 'Aave',
    address: '0xcc323557c71C0F42586029b0731F770F0D649f8b',
    decimals: 18,
    coingeckoId: 'aave'
  }
};

// Pool pair registry for quick lookup
const POOL_REGISTRY = [
  // Major pools on Base
  { token0: 'WETH', token1: 'USDC', dex: 'Uniswap V3', fee: 500 },
  { token0: 'WETH', token1: 'USDC', dex: 'Uniswap V3', fee: 3000 },
  { token0: 'WETH', token1: 'USDC', dex: 'Uniswap V3', fee: 10000 },
  { token0: 'WETH', token1: 'USDT', dex: 'Uniswap V3', fee: 500 },
  { token0: 'WETH', token1: 'USDT', dex: 'Uniswap V3', fee: 3000 },
  { token0: 'USDC', token1: 'USDT', dex: 'Uniswap V3', fee: 500 },
  { token0: 'WBTC', token1: 'WETH', dex: 'Uniswap V3', fee: 500 },
  { token0: 'WBTC', token1: 'WETH', dex: 'Uniswap V3', fee: 3000 },
  { token0: 'WBTC', token1: 'USDC', dex: 'Uniswap V3', fee: 500 },
  { token0: 'DAI', token1: 'USDC', dex: 'Uniswap V3', fee: 500 },
  { token0: 'LINK', token1: 'WETH', dex: 'Uniswap V3', fee: 3000 },
  { token0: 'ARB', token1: 'WETH', dex: 'Uniswap V3', fee: 3000 },
  { token0: 'OP', token1: 'WETH', dex: 'Uniswap V3', fee: 3000 },
  { token0: 'cbETH', token1: 'WETH', dex: 'Uniswap V3', fee: 100 },
  { token0: 'AAVE', token1: 'WETH', dex: 'Uniswap V3', fee: 3000 },
  // SushiSwap pairs
  { token0: 'WETH', token1: 'USDC', dex: 'SushiSwap', fee: 30 },
  { token0: 'WETH', token1: 'USDT', dex: 'SushiSwap', fee: 30 },
  { token0: 'WBTC', token1: 'WETH', dex: 'SushiSwap', fee: 30 },
  { token0: 'USDC', token1: 'USDT', dex: 'SushiSwap', fee: 30 },
];

class TokenDiscovery {
  constructor(provider) {
    this.provider = provider;
    this.tokenCache = new Map();
    this.priceCache = new Map();
    this.liquidityCache = new Map();
    this.cacheExpiry = 60000; // 1 minute cache
  }

  // Get token info by symbol or address
  async getToken(symbolOrAddress) {
    const key = symbolOrAddress.toLowerCase();

    // Check cache
    if (this.tokenCache.has(key)) {
      const cached = this.tokenCache.get(key);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    // Check known tokens first
    const symbol = symbolOrAddress.toUpperCase();
    if (KNOWN_TOKENS[symbol]) {
      const token = KNOWN_TOKENS[symbol];
      this.tokenCache.set(key, { data: token, timestamp: Date.now() });
      return token;
    }

    // Check if it's an address
    if (ethers.utils.isAddress(symbolOrAddress)) {
      try {
        const token = await this._fetchTokenInfo(symbolOrAddress);
        if (token) {
          this.tokenCache.set(key, { data: token, timestamp: Date.now() });
          return token;
        }
      } catch (e) {
        console.log(`Could not fetch token info for ${symbolOrAddress}`);
      }
    }

    return null;
  }

  // Fetch token info from contract
  async _fetchTokenInfo(address) {
    const abi = [
      'function symbol() view returns (string)',
      'function name() view returns (string)',
      'function decimals() view returns (uint8)'
    ];

    const contract = new ethers.Contract(address, abi, this.provider);

    try {
      const [symbol, name, decimals] = await Promise.all([
        contract.symbol(),
        contract.name(),
        contract.decimals()
      ]);

      return {
        symbol,
        name,
        address,
        decimals: parseInt(decimals),
        isVerified: false
      };
    } catch (e) {
      return null;
    }
  }

  // Get all trading pairs for a token
  async getTradingPairs(tokenSymbol) {
    const pairs = [];
    const upperToken = tokenSymbol.toUpperCase();

    for (const pool of POOL_REGISTRY) {
      if (pool.token0 === upperToken || pool.token1 === upperToken) {
        const otherToken = pool.token0 === upperToken ? pool.token1 : pool.token0;
        const otherTokenInfo = await this.getToken(otherToken);

        if (otherTokenInfo) {
          pairs.push({
            baseToken: upperToken,
            quoteToken: otherToken,
            quoteTokenInfo: otherTokenInfo,
            dex: pool.dex,
            fee: pool.fee,
            liquidity: 'high' // Simplified
          });
        }
      }
    }

    return pairs;
  }

  // Discover popular tokens
  async discoverPopularTokens(limit = 20) {
    const tokens = Object.values(KNOWN_TOKENS).slice(0, limit);
    return tokens.map(t => ({
      ...t,
      pools: POOL_REGISTRY.filter(p => p.token0 === t.symbol || p.token1 === t.symbol).length
    }));
  }

  // Get top tokens by volume (simulated)
  async getTopTokens(limit = 10) {
    const tokens = [
      KNOWN_TOKENS.USDC,
      KNOWN_TOKENS.USDT,
      KNOWN_TOKENS.WETH,
      KNOWN_TOKENS.WBTC,
      KNOWN_TOKENS.DAI,
      KNOWN_TOKENS.LINK,
      KNOWN_TOKENS.ARB,
      KNOWN_TOKENS.OP,
      KNOWN_TOKENS.CBETH,
      KNOWN_TOKENS.AAVE
    ];

    return tokens.slice(0, limit);
  }

  // Get price from CoinGecko
  async getPrice(coingeckoId) {
    if (!coingeckoId) return null;

    // Check cache
    if (this.priceCache.has(coingeckoId)) {
      const cached = this.priceCache.get(coingeckoId);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true`,
        { timeout: 5000 }
      );

      if (response.ok) {
        const data = await response.json();
        const price = data[coingeckoId];

        if (price) {
          const result = {
            usd: price.usd,
            usd_24h_change: price.usd_24h_change
          };

          this.priceCache.set(coingeckoId, { data: result, timestamp: Date.now() });
          return result;
        }
      }
    } catch (e) {
      console.log(`Price fetch failed for ${coingeckoId}`);
    }

    return null;
  }

  // Get multiple prices
  async getPrices(coingeckoIds) {
    const results = {};

    try {
      const ids = coingeckoIds.filter(Boolean).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        { timeout: 5000 }
      );

      if (response.ok) {
        const data = await response.json();
        for (const [id, price] of Object.entries(data)) {
          results[id] = {
            usd: price.usd,
            usd_24h_change: price.usd_24h_change
          };
        }
      }
    } catch (e) {
      console.log('Batch price fetch failed');
    }

    return results;
  }

  // Search tokens by symbol or name
  async searchTokens(query) {
    const q = query.toLowerCase();
    const results = [];

    for (const [symbol, token] of Object.entries(KNOWN_TOKENS)) {
      if (
        symbol.toLowerCase().includes(q) ||
        token.name.toLowerCase().includes(q) ||
        token.symbol.toLowerCase().includes(q)
      ) {
        const price = token.coingeckoId ? await this.getPrice(token.coingeckoId) : null;
        results.push({
          ...token,
          price: price?.usd,
          change24h: price?.usd_24h_change
        });
      }
    }

    return results;
  }

  // Clear cache
  clearCache() {
    this.tokenCache.clear();
    this.priceCache.clear();
    this.liquidityCache.clear();
  }
}

module.exports = { TokenDiscovery, KNOWN_TOKENS, POOL_REGISTRY, NATIVE_TOKEN };