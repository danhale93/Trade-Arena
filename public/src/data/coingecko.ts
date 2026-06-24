/**
 * COINGECKO DATA - OHLCV Data Fetching & Caching
 * 
 * Fetches 5m candles for ETH/BTC
 * Caches responses to /data/cache/ to survive rate limits
 * 
 * @version 1.0.0
 * @date 2025-01-15
 */

export interface OHLCVCandle {
  timestamp: number;  // Open time (ms)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketData {
  symbol: string;
  candles: OHLCVCandle[];
  fetchedAt: number;
  timeframe: string; // '5m', '1h', '1d'
}

export interface CacheEntry {
  data: MarketData;
  expiresAt: number;
}

// CoinGecko API configuration
const COINGECKO_CONFIG = {
  BASE_URL: 'https://api.coingecko.com/api/v3',
  OHLC_ENDPOINT: '/coins/ethereum/ohlc',
  MARKET_CHART_ENDPOINT: '/coins/ethereum/market_chart',
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes cache
  MAX_DAYS_HISTORY: 90,      // Max 90 days
  RATE_LIMIT_DELAY: 1500,   // 1.5s between requests
};

// In-memory cache
const cache: Map<string, CacheEntry> = new Map();
let lastRequestTime = 0;

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get cache key for request
 */
function getCacheKey(symbol: string, days: number): string {
  return `${symbol}_${days}d`;
}

/**
 * Get from cache
 */
function getFromCache(key: string): MarketData | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Save to cache
 */
function saveToCache(key: string, data: MarketData): void {
  const entry: CacheEntry = {
    data,
    expiresAt: Date.now() + COINGECKO_CONFIG.CACHE_TTL_MS,
  };
  cache.set(key, entry);
}

/**
 * Fetch OHLC data from CoinGecko
 * 
 * @param vsCurrency -quote currency (usd, btc)
 * @param days - number of days to fetch
 * @returns OHLCV candles
 */
export async function fetchOHLCV(
  vsCurrency: string = 'usd',
  days: number = 1
): Promise<MarketData> {
  const cacheKey = getCacheKey(vsCurrency, days);
  
  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log(`[CoinGecko] Using cached data for ${vsCurrency}`);
    return cached;
  }
  
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < COINGECKO_CONFIG.RATE_LIMIT_DELAY) {
    await sleep(COINGECKO_CONFIG.RATE_LIMIT_DELAY - timeSinceLastRequest);
  }
  
  try {
    console.log(`[CoinGecko] Fetching ${days} days of OHLC data for ETH/${vsCurrency}...`);
    
    const url = `${COINGECKO_CONFIG.BASE_URL}${COINGECKO_CONFIG.MARKET_CHART_ENDPOINT}?vs_currency=${vsCurrency}&days=${days}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const json = await response.json();
    
    // Parse into OHLCV candles
    // CoinGecko returns: [timestamp, open, high, low, close] for each candle
    const candles: OHLCVCandle[] = [];
    
    if (json.prices && Array.isArray(json.prices)) {
      // Use prices array as fallback
      for (let i = 0; i < json.prices.length; i++) {
        const priceData = json.prices[i];
        const volumeData = json.total_volumes?.[i] || json.acquired_at?.[i] || [0, 0];
        
        candles.push({
          timestamp: priceData[0],
          open: priceData[1],
          high: priceData[1], // Approximation
          low: priceData[1],  // Approximation
          close: priceData[1],
          volume: volumeData[1] || 0,
        });
      }
    }
    
    const marketData: MarketData = {
      symbol: `ETH/${vsCurrency}`,
      candles,
      fetchedAt: Date.now(),
      timeframe: days <= 1 ? '5m' : 'hourly',
    };
    
    // Save to cache
    saveToCache(cacheKey, marketData);
    lastRequestTime = Date.now();
    
    console.log(`[CoinGecko] Received ${candles.length} candles`);
    
    return marketData;
  } catch (error) {
    console.error('[CoinGecko] Fetch error:', error);
    throw error;
  }
}

/**
 * Generate synthetic 5m candles from price data
 * (CoinGecko free tier has 5m granularity for 1 day only)
 * 
 * @param prices - Price array [timestamp, price][]
 * @param volumes - Volume array [timestamp, volume][]
 * @param intervalMs - Time interval in ms (default 5m)
 */
export function generateSyntheticCandles(
  prices: number[][],
  volumes: number[][],
  intervalMs: number = 5 * 60 * 1000
): OHLCVCandle[] {
  const candles: OHLCVCandle[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    candles.push({
      timestamp: prices[i][0],
      open: prices[i][1],
      high: prices[i][1],
      low: prices[i][1],
      close: prices[i][1],
      volume: volumes[i]?.[1] || 0,
    });
  }
  
  return candles;
}

/**
 * Find best regime weeks in historical data
 * 
 * @param candles - Complete candle data
 * @param targetRegime - BULL, BEAR, or CHOP
 * @param regimeDetector - Function to detect regime
 * @returns Array of week-long candle arrays
 */
export function findRegimeWeeks(
  candles: OHLCVCandle[],
  targetRegime: 'BULL' | 'BEAR' | 'CHOP',
  regimeDetector?: (prices: number[], volumes: number[], now: number) => any
): OHLCVCandle[][] {
  // Need at least 1 week of data
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const candlesPerWeek = (weekMs / (5 * 60 * 1000)); // 2016 candles per week
  
  const regimeWeeks: OHLCVCandle[][] = [];
  
  // Slide through data in weekly windows
  for (let i = 0; i < candles.length - candlesPerWeek; i += candlesPerWeek) {
    const weekCandles = candles.slice(i, i + candlesPerWeek);
    
    const prices = weekCandles.map(c => c.close);
    const volumes = weekCandles.map(c => c.volume);
    const now = weekCandles[Math.floor(weekCandles.length / 2)].timestamp;
    
    // If no detector, use prices as proxy
    let detected = targetRegime;
    if (regimeDetector) {
      const result = regimeDetector(prices, volumes, now);
      detected = result?.regime || 'CHOP';
    } else {
      // Simple return-based detection
      const startPrice = prices[0];
      const endPrice = prices[prices.length - 1];
      const returnPct = ((endPrice - startPrice) / startPrice) * 100;
      
      if (returnPct > 5) detected = 'BULL';
      else if (returnPct < -5) detected = 'BEAR';
      else detected = 'CHOP';
    }
    
    if (detected === targetRegime) {
      regimeWeeks.push(weekCandles);
    }
  }
  
  return regimeWeeks;
}

/**
 * Get historical data for backtesting
 * 
 * @param symbol - Trading pair (ETHUSD, BTCUSD)
 * @param days - Days of history (max 90)
 * @returns Market data ready for backtesting
 */
export async function getHistoricalData(
  symbol: string = 'ETHUSD',
  days: number = 90
): Promise<MarketData> {
  // Limit to max allowed by API
  const daysToFetch = Math.min(days, COINGECKO_CONFIG.MAX_DAYS_HISTORY);
  
  const vsCurrency = symbol.replace('ETH', '').toLowerCase() || 'usd';
  
  return fetchOHLCV(vsCurrency, daysToFetch);
}

/**
 * Convert candles to regime-detector format
 * 
 * @param candles - OHLCV candles
 * @returns prices and volumes arrays
 */
export function candlesToArrays(candles: OHLCVCandle[]): {
  prices: number[];
  volumes: number[];
  timestamps: number[];
} {
  return {
    prices: candles.map(c => c.close),
    volumes: candles.map(c => c.volume),
    timestamps: candles.map(c => c.timestamp),
  };
}

/**
 * Clear cache
 */
export function clearCache(): void {
  cache.clear();
  console.log('[CoinGecko] Cache cleared');
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

// Console confirmation
if (typeof window !== 'undefined') {
  console.log('%c✅ CoinGecko Data Module Loaded', 'color: #39ff14; font-weight: bold;');
  console.log(`   Cache TTL: ${COINGECKO_CONFIG.CACHE_TTL_MS / 1000}s`);
  console.log(`   Max History: ${COINGECKO_CONFIG.MAX_DAYS_HISTORY} days`);
}

// Default export
export default {
  fetchOHLCV,
  getHistoricalData,
  findRegimeWeeks,
  candlesToArrays,
  clearCache,
  getCacheStats,
  OHLCVCandle,
  MarketData,
};
