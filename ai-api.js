/**
 * AI API Integration for Trade Arena v4
 * Handles Claude API calls for trading decisions
 * 
 * Setup: Add your Anthropic API key to .env as ANTHROPIC_API_KEY
 */

const AI_CONFIG = {
  apiKey: process.env.ANTHROPIC_API_KEY || null,
  model: 'claude-sonnet-4-20250514',
  maxTokens: 400,
  endpoint: 'https://api.anthropic.com/v1/messages',
};

/**
 * Get trading decision from Claude AI
 * @param {Array} marketData - Live market data from CoinGecko
 * @param {Number} bet - Bet amount in USD
 * @param {Number} botId - Bot instance ID
 * @returns {Promise<Object>} - Trading decision object
 */
async function callAI(marketData, bet, botId) {
  // Build market summary
  let summary = 'No live data available.';
  if (marketData && marketData.length) {
    summary = marketData
      .slice(0, 8)
      .map(c => {
        const vol = c.total_volume ? (c.total_volume / 1e6).toFixed(0) : '0';
        const change = (c.price_change_percentage_24h || 0).toFixed(1);
        return `${c.symbol.toUpperCase()}: $${c.current_price?.toFixed(2) || '?'} | 24h: ${change}% | Vol: $${vol}M`;
      })
      .join('\n');
  }

  // Claude prompt for trading decision
  const prompt = `You are a professional DeFi trading AI bot #${botId}. Analyze current market conditions and recommend ONE optimal trade.

LIVE MARKET DATA (Top 8 by 24h change):
${summary}

BET AMOUNT: $${bet}

Your task: Choose the SINGLE best trade opportunity based on:
- Market volatility and momentum
- Current price action and volume
- Risk/reward balance for the bet size
- Available DeFi opportunities

Respond ONLY with this exact JSON structure (no markdown, no code blocks):
{
  "token": "SYMBOL",
  "token_emoji": "emoji",
  "method": "FLASH LOAN|ARBITRAGE|SPOT LONG|SPOT SHORT|NFT FLIP|YIELD FARM|PERP LONG|PERP SHORT",
  "method_emoji": "emoji",
  "size_label": "SNIPER|DEGEN|SAFE|YOLO|HEDGE|SURF",
  "edge_pct": 0.5,
  "win_probability": 0.55,
  "reasoning": "Brief 70 char max reason",
  "strategy_detail": "Max 90 char trade description",
  "outcome": "WIN|LOSS",
  "pnl_multiplier": 1.5
}

IMPORTANT:
- edge_pct: Estimated profit edge (0.5-8.5%)
- win_probability: Chance of winning this trade (0.35-0.75)
- outcome: WIN if probability > 50%, else LOSS
- pnl_multiplier: P&L multiple on bet (-0.9 to 3.5)
  * WIN: 0.5x to 3.5x of bet amount
  * LOSS: -0.2x to -0.9x of bet amount`;

  try {
    if (!AI_CONFIG.apiKey) {
      console.warn('⚠️ No API key found. Using fallback decision.');
      return fallbackDecision(bet);
    }

    const response = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_CONFIG.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('API Error:', error);
      return fallbackDecision(bet);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '{}';
    
    // Clean JSON response (remove markdown code blocks if present)
    const cleanedJson = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedJson);

    return sanitizeDecision(parsed, bet);
  } catch (error) {
    console.error('AI Call Error:', error);
    return fallbackDecision(bet);
  }
}

/**
 * Validate and sanitize AI decision
 * @param {Object} parsed - Parsed JSON from Claude
 * @param {Number} bet - Bet amount
 * @returns {Object} - Validated decision
 */
function sanitizeDecision(parsed, bet) {
  const methods = [
    'FLASH LOAN',
    'ARBITRAGE',
    'SPOT LONG',
    'SPOT SHORT',
    'NFT FLIP',
    'YIELD FARM',
    'PERP LONG',
    'PERP SHORT',
  ];
  const sizeLabels = ['SNIPER', 'DEGEN', 'SAFE', 'YOLO', 'HEDGE', 'SURF'];

  return {
    token: parsed.token || 'ETH',
    token_emoji: parsed.token_emoji || '💎',
    method: methods.includes(parsed.method) ? parsed.method : 'ARBITRAGE',
    method_emoji: parsed.method_emoji || '🔄',
    size_label: sizeLabels.includes(parsed.size_label) ? parsed.size_label : 'SAFE',
    edge_pct: Math.max(0.5, Math.min(8.5, parseFloat(parsed.edge_pct) || 2.0)),
    win_probability: Math.max(0.35, Math.min(0.75, parseFloat(parsed.win_probability) || 0.55)),
    reasoning: (parsed.reasoning || 'Market opportunity detected.').slice(0, 70),
    strategy_detail: (parsed.strategy_detail || 'Direct spot trade.').slice(0, 90),
    outcome: (parsed.outcome || 'WIN').toUpperCase() === 'WIN' ? 'WIN' : 'LOSS',
    pnl_multiplier: Math.max(-0.9, Math.min(3.5, parseFloat(parsed.pnl_multiplier) || 0.8)),
  };
}

/**
 * Fallback decision when API is unavailable
 * @param {Number} bet - Bet amount
 * @returns {Object} - Random but realistic decision
 */
function fallbackDecision(bet) {
  const tokens = ['ETH', 'PEPE', 'WIF', 'SOL', 'ARB', 'DOGE', 'BONK', 'FLOKI'];
  const methods = [
    'ARBITRAGE',
    'FLASH LOAN',
    'SPOT LONG',
    'PERP LONG',
    'YIELD FARM',
    'NFT FLIP',
  ];
  const sizes = ['SNIPER', 'DEGEN', 'SAFE', 'YOLO', 'HEDGE', 'SURF'];
  const emojiMap = {
    PEPE: '🐸',
    DOGE: '🐕',
    ETH: '💎',
    SOL: '⚡',
    ARB: '🚀',
    BONK: '💀',
    FLOKI: '🦊',
    WIF: '🔥',
  };
  const methodEmojiMap = {
    ARBITRAGE: '🔄',
    'FLASH LOAN': '⚡',
    'SPOT LONG': '📈',
    'SPOT SHORT': '📉',
    'NFT FLIP': '💎',
    'YIELD FARM': '🌾',
    'PERP LONG': '🎯',
    'PERP SHORT': '💣',
  };

  const token = tokens[Math.floor(Math.random() * tokens.length)];
  const method = methods[Math.floor(Math.random() * methods.length)];
  const size = sizes[Math.floor(Math.random() * sizes.length)];
  const winProb = 0.45 + Math.random() * 0.3; // 0.45 - 0.75
  const isWin = Math.random() < winProb;

  return {
    token,
    token_emoji: emojiMap[token] || '🔥',
    method,
    method_emoji: methodEmojiMap[method] || '🔄',
    size_label: size,
    edge_pct: 1.5 + Math.random() * 5,
    win_probability: winProb,
    reasoning: `${method} opportunity on ${token}.`,
    strategy_detail: `Trading ${token} via ${method} strategy.`,
    outcome: isWin ? 'WIN' : 'LOSS',
    pnl_multiplier: isWin
      ? 0.5 + Math.random() * 3 // 0.5x to 3.5x
      : -0.9 + Math.random() * 0.7, // -0.9x to -0.2x
  };
}

/**
 * Validate API key setup
 * @returns {Boolean} - True if API key is configured
 */
function isApiKeyConfigured() {
  return AI_CONFIG.apiKey && !AI_CONFIG.apiKey.includes('YOUR_');
}

/**
 * Set API key at runtime
 * @param {String} key - Anthropic API key
 */
function setApiKey(key) {
  AI_CONFIG.apiKey = key;
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    callAI,
    sanitizeDecision,
    fallbackDecision,
    isApiKeyConfigured,
    setApiKey,
  };
}
