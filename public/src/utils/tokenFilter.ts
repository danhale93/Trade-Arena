/**
 * TOKEN FILTER - Stablecoin Blocklist
 * FIX for USDT momentum long signal bug
 * 
 * @version 1.0.0
 * @date 2025-01-15
 */

// Blocklist of stablecoins - NEVER trade these as directional targets
export const STABLECOIN_BLOCKLIST = [
  'USDT',   // Tether
  'USDC',   // USD Coin
  'DAI',    // MakerDAO
  'BUSD',   // Binance USD
  'FDUSD',  // First Digital USD
  'TUSD',   // TrueUSD
  'FRAX',   // Frax Protocol
  'USDP',   // Pax Dollar
  'GUSD',   // Gemini Dollar
  'MIM',    // Magic Internet Money (Abracadabra)
  'USTC',   // TerraClassicUSD
];

// Stablecoins can ONLY be quote currencies, never directional targets
export const STABLECOIN_QUOTE_OK = [
  'USDT',
  'USDC',
  'DAI',
  'BUSD',
  'FDUSD',
  'TUSD',
  'FRAX',
  'USDP',
  'GUSD',
];

/**
 * Check if a token symbol is a stablecoin
 * @param symbol - Token symbol to check
 * @returns true if stablecoin (should be blocked as trade target)
 */
export function isStablecoin(symbol: string): boolean {
  if (!symbol) return false;
  const upperSymbol = symbol.toUpperCase().trim();
  return STABLECOIN_BLOCKLIST.includes(upperSymbol);
}

/**
 * Check if a token can be used as a quote currency
 * @param symbol - Token symbol to check
 * @returns true if can be used as quote
 */
export function isStablecoinQuoteOk(symbol: string): boolean {
  if (!symbol) return false;
  const upperSymbol = symbol.toUpperCase().trim();
  return STABLECOIN_QUOTE_OK.includes(upperSymbol);
}

/**
 * Get filter decision for a trade proposal
 * @param symbol - Proposed trade token
 * @returns FilterResult with vote and reasoning
 */
export function filterToken(symbol: string): {
  vote: 'SKIP' | 'PROCEED';
  conviction: number;
  reasoning: string;
  isBlocked: boolean;
} {
  if (isStablecoin(symbol)) {
    return {
      vote: 'SKIP',
      conviction: 0,
      reasoning: `Stablecoin ${symbol} blocked - not a tradeable asset`,
      isBlocked: true,
    };
  }
  
  return {
    vote: 'PROCEED',
    conviction: 1.0,
    reasoning: `${symbol} is not a stablecoin - filter passed`,
    isBlocked: false,
  };
}

/**
 * Validate entire trade pair (base/quote)
 * @param baseToken - The base/tradeable token
 * @param quoteToken - The quote currency
 * @returns Validation result
 */
export function validateTradePair(
  baseToken: string, 
  quoteToken: string
): {
  valid: boolean;
  reason: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Check base token is NOT a stablecoin
  if (isStablecoin(baseToken)) {
    return {
      valid: false,
      reason: `Base token ${baseToken} is a stablecoin - cannot trade`,
      warnings: [],
    };
  }
  
  // Warn if quote is not a common stablecoin (but allow it)
  if (!isStablecoinQuoteOk(quoteToken) && quoteToken !== 'BTC' && quoteToken !== 'ETH') {
    warnings.push(`Quote currency ${quoteToken} is not a common stablecoin`);
  }
  
  return {
    valid: true,
    reason: 'Trade pair validated',
    warnings,
  };
}

/**
 * Get blocklist as array (for logging/display)
 */
export function getBlocklist(): string[] {
  return [...STABLECOIN_BLOCKLIST];
}

// Console confirmation
if (typeof window !== 'undefined') {
  console.log('%c✅ Token Filter Loaded - Stablecoin Blocklist Active', 'color: #39ff14; font-weight: bold;');
  console.log(`   Blocked: ${STABLECOIN_BLOCKLIST.join(', ')}`);
}

export default {
  isStablecoin,
  isStablecoinQuoteOk,
  filterToken,
  validateTradePair,
  getBlocklist,
  STABLECOIN_BLOCKLIST,
};
