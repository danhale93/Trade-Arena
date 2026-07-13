/**
 * AI API Integration for Trade Arena v4
 */

// ── Secure Storage Decoder ──
const _cfg_d = (s) => { try { return s ? atob(s) : ''; } catch(e) { return s; } };

const AI_CONFIG = {
  apiKey: _cfg_d(localStorage.getItem('ta_api_key')) || null,
  openAiKey: _cfg_d(localStorage.getItem('ta_openai_key')) || null,
  geminiKey: _cfg_d(localStorage.getItem('ta_gemini_key')) || null,
  model: 'claude-3-5-sonnet-20240620',
  maxTokens: 400,
  endpoint: '/api/claude',
};

function reinitAIConfig() {
    AI_CONFIG.apiKey = _cfg_d(localStorage.getItem('ta_api_key')) || null;
    AI_CONFIG.openAiKey = _cfg_d(localStorage.getItem('ta_openai_key')) || null;
    AI_CONFIG.geminiKey = _cfg_d(localStorage.getItem('ta_gemini_key')) || null;
    console.log('[AI] Config re-initialized');
}

async function callAI(marketData, bet, botId) {
  let summary = 'No live data available.';
  if (marketData && marketData.length) {
    summary = marketData.slice(0, 8).map(c => {
      const vol = c.total_volume ? (c.total_volume / 1e6).toFixed(0) : '0';
      const change = (c.price_change_percentage_24h || 0).toFixed(1);
      return `${c.symbol.toUpperCase()}: $${c.current_price?.toFixed(2) || '?'} | 24h: ${change}% | Vol: $${vol}M`;
    }).join('\n');
  }

  const prompt = \`You are a professional DeFi trading AI bot #\${botId}. Analyze market and recommend ONE optimal trade.
DATA:
\${summary}
BET: $\${bet}
Respond ONLY with JSON:
{
  "token": "SYMBOL",
  "token_emoji": "emoji",
  "method": "FLASH LOAN|ARBITRAGE|SPOT LONG|SPOT SHORT",
  "method_emoji": "emoji",
  "size_label": "SAFE|DEGEN",
  "edge_pct": 2.5,
  "win_probability": 0.6,
  "reasoning": "reason",
  "strategy_detail": "detail",
  "outcome": "WIN|LOSS",
  "pnl_multiplier": 1.2
}\`;

  try {
    if (!AI_CONFIG.apiKey) return fallbackDecision(bet);

    const response = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_CONFIG.apiKey,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) return fallbackDecision(bet);

    const data = await response.json();
    const content = data.content?.[0]?.text || '{}';
    const cleanedJson = content.replace(/\`\`\`json\\n?/g, '').replace(/\`\`\`\\n?/g, '').trim();
    return JSON.parse(cleanedJson);
  } catch (error) {
    return fallbackDecision(bet);
  }
}

function fallbackDecision(bet) {
  const isWin = Math.random() > 0.4;
  return {
    token: 'ETH',
    token_emoji: '💎',
    method: 'ARBITRAGE',
    method_emoji: '🔄',
    size_label: 'SAFE',
    edge_pct: 2.0,
    win_probability: 0.6,
    reasoning: 'Fallback logic.',
    strategy_detail: 'Simulated trade.',
    outcome: isWin ? 'WIN' : 'LOSS',
    pnl_multiplier: isWin ? 0.8 : -0.5
  };
}

window.callAI = callAI;
window.reinitAIConfig = reinitAIConfig;
window.setApiKey = (key) => {
  const _cfg_e = (s) => { try { return s ? btoa(s) : ''; } catch(e) { return s; } };
  localStorage.setItem('ta_api_key', _cfg_e(key));
  reinitAIConfig();
};
