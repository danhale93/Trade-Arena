/**
 * TOKEN MANAGER (Backend)
 * Trade Arena • Manages whitelisted Base Mainnet trading assets and pool fees.
 */

class TokenManager {
    constructor() {
        // Base Mainnet Canonical Whitelisted Tokens
        this.whitelist = {
            'USDC': {
                address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                decimals: 6,
                symbol: 'USDC',
                name: 'USD Coin'
            },
            'WETH': {
                address: '0x4200000000000000000000000000000000000006',
                decimals: 18,
                symbol: 'WETH',
                name: 'Wrapped Ethereum'
            },
            'WBTC': {
                address: '0x03C6b3903b65151371B9541b59367468160BCE62', // Canonical Base WBTC
                decimals: 8,
                symbol: 'WBTC',
                name: 'Wrapped Bitcoin'
            }
        };

        // Configuration-driven whitelisted pairs and Uniswap V3 fee tiers (3000 = 0.3%, 500 = 0.05%)
        this.pairs = {
            'WETH/USDC': {
                tokenIn: 'USDC',
                tokenOut: 'WETH',
                fee: 3000
            },
            'WBTC/WETH': {
                tokenIn: 'WETH',
                tokenOut: 'WBTC',
                fee: 3000
            }
        };
    }

    /**
     * Checks if a token symbol or address is in the whitelist.
     */
    isTokenWhitelisted(symbolOrAddress) {
        if (!symbolOrAddress) return false;

        const clean = symbolOrAddress.trim().toUpperCase();
        if (this.whitelist[clean]) return true;

        const addrLower = symbolOrAddress.trim().toLowerCase();
        return Object.values(this.whitelist).some(t => t.address.toLowerCase() === addrLower);
    }

    /**
     * Resolves token symbol or address to its whitelisted metadata.
     */
    resolveToken(symbolOrAddress) {
        if (!symbolOrAddress) return null;

        const clean = symbolOrAddress.trim().toUpperCase();
        if (this.whitelist[clean]) return this.whitelist[clean];

        const addrLower = symbolOrAddress.trim().toLowerCase();
        return Object.values(this.whitelist).find(t => t.address.toLowerCase() === addrLower) || null;
    }

    /**
     * Gets verified fee tier for a given pair.
     */
    getPairFee(tokenA, tokenB) {
        const symbolA = this.resolveToken(tokenA)?.symbol;
        const symbolB = this.resolveToken(tokenB)?.symbol;

        if (!symbolA || !symbolB) return null;

        const key1 = `${symbolA}/${symbolB}`;
        const key2 = `${symbolB}/${symbolA}`;

        if (this.pairs[key1]) return this.pairs[key1].fee;
        if (this.pairs[key2]) return this.pairs[key2].fee;

        return 3000; // default to standard 0.3% pool tier
    }
}

module.exports = new TokenManager();
