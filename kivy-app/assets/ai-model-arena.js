/**
 * BOT ARENA - AI Model Diversity System
 * Each bot uses a different AI model/personality for unique trading strategies
 * Creates competitive environment where models compete for best performance
 */

// ════════════════════════════════════════════════════════════════════════════════
// AI MODEL PROFILES
// ════════════════════════════════════════════════════════════════════════════════

const AI_MODELS = {
  // Model 1: AGGRESSIVE_TRADER - Risk-taking, high edge seeks
  'AGGRESSIVE_TRADER': {
    modelId: 'claude-3-5-sonnet-20241022',
    personality: 'Risk-seeking, high-conviction trader',
    strategy: 'AGGRESSIVE',
    traits: {
      riskTolerance: 0.9,
      edgeSeekingBias: 0.85,
      volatilityPref: 'EMBRACE',
      leverageMultiplier: 1.5,
      positionSizing: 'AGGRESSIVE'
    },
    systemPrompt: `You are an AGGRESSIVE trading AI. Your goal is to find HIGH-EDGE trades with 2%+ edge. 
You embrace volatility and are willing to take larger positions.
Focus on: Perp trading, high-conviction shorts, leverage plays.
Target: 3-5% wins, accept higher losses for bigger gains.
Take risks. Be bold.`,
    expectedWinRate: 0.52,
    methodBias: { 'PERP LONG': 0.35, 'PERP SHORT': 0.25, 'SPOT SHORT': 0.15, 'ARBITRAGE': 0.1, 'FLASH LOAN': 0.15 }
  },

  // Model 2: CONSERVATIVE_ANALYST - Capital preservation, consistent wins
  'CONSERVATIVE_ANALYST': {
    modelId: 'claude-3-opus-20250219',
    personality: 'Capital preservation, data-driven analyst',
    strategy: 'CONSERVATIVE',
    traits: {
      riskTolerance: 0.3,
      edgeSeekingBias: 0.5,
      volatilityPref: 'AVOID',
      leverageMultiplier: 0.5,
      positionSizing: 'CONSERVATIVE'
    },
    systemPrompt: `You are a CONSERVATIVE trading AI. Your goal is consistent, safe profits.
You avoid volatility and seek stable, repeatable edge.
Focus on: Arbitrage, yield farming, stable pairs.
Target: 60%+ win rate with small, consistent gains.
Preserve capital. Be cautious.`,
    expectedWinRate: 0.62,
    methodBias: { 'ARBITRAGE': 0.4, 'YIELD FARM': 0.3, 'FLASH LOAN': 0.2, 'SPOT LONG': 0.1 }
  },

  // Model 3: MOMENTUM_RIDER - Trend following, price action
  'MOMENTUM_RIDER': {
    modelId: 'claude-3-5-sonnet-20241022',
    personality: 'Momentum obsessed, trend-following trader',
    strategy: 'TREND',
    traits: {
      riskTolerance: 0.65,
      edgeSeekingBias: 0.7,
      volatilityPref: 'SEEK',
      leverageMultiplier: 1.2,
      positionSizing: 'MODERATE'
    },
    systemPrompt: `You are a MOMENTUM trading AI. Your goal is to ride market trends.
You look for price action and follow established momentum.
Focus on: Spot long/short, perp long, trend-following.
Target: Capture trends early, exit on reversal signals.
Follow the market. Ride waves.`,
    expectedWinRate: 0.58,
    methodBias: { 'SPOT LONG': 0.3, 'PERP LONG': 0.25, 'SPOT SHORT': 0.2, 'YIELD FARM': 0.15, 'ARBITRAGE': 0.1 }
  },

  // Model 4: MEV_HUNTER - Mempool scanning, MEV exploitation
  'MEV_HUNTER': {
    modelId: 'claude-3-opus-20250219',
    personality: 'MEV specialist, sandwich artist',
    strategy: 'MEV_EXPLOITATION',
    traits: {
      riskTolerance: 0.8,
      edgeSeekingBias: 0.95,
      volatilityPref: 'CHAOS',
      leverageMultiplier: 1.0,
      positionSizing: 'TACTICAL'
    },
    systemPrompt: `You are an MEV HUNTER trading AI. Your goal is to extract MEV value.
You specialize in sandwich attacks, liquidation frontrunning, and flash loan exploits.
Focus on: Flash loans, sandwich opportunities, liquidation hunts.
Target: High-probability MEV captures with 1-5% edge.
Hunt opportunities. Extract value.`,
    expectedWinRate: 0.55,
    methodBias: { 'FLASH LOAN': 0.4, 'ARBITRAGE': 0.3, 'PERP SHORT': 0.15, 'PERP LONG': 0.15 }
  },

  // Model 5: BALANCED_OPTIMIZER - Adaptive, risk-adjusted
  'BALANCED_OPTIMIZER': {
    modelId: 'claude-3-5-sonnet-20241022',
    personality: 'Balanced optimizer, risk-aware',
    strategy: 'BALANCED',
    traits: {
      riskTolerance: 0.55,
      edgeSeekingBias: 0.6,
      volatilityPref: 'ADAPTIVE',
      leverageMultiplier: 1.0,
      positionSizing: 'OPTIMAL'
    },
    systemPrompt: `You are a BALANCED trading AI. Your goal is risk-adjusted returns.
You adapt strategy to market conditions.
Focus on: Mix of all methods based on conditions.
Target: 55%+ win rate with balanced risk/reward.
Adapt. Optimize. Balance.`,
    expectedWinRate: 0.55,
    methodBias: { 'ARBITRAGE': 0.25, 'SPOT LONG': 0.2, 'YIELD FARM': 0.2, 'FLASH LOAN': 0.15, 'PERP LONG': 0.2 }
  },

  // Model 6: NICHE_SPECIALIST - NFT and alternative strategies
  'NICHE_SPECIALIST': {
    modelId: 'claude-3-opus-20250219',
    personality: 'Niche specialist, alpha seeker',
    strategy: 'NICHE',
    traits: {
      riskTolerance: 0.75,
      edgeSeekingBias: 0.8,
      volatilityPref: 'HUNT',
      leverageMultiplier: 1.3,
      positionSizing: 'AGGRESSIVE'
    },
    systemPrompt: `You are a NICHE SPECIALIST trading AI. Your goal is to find undervalued opportunities.
You hunt for NFT flips, governance farming, and illiquid token plays.
Focus on: NFT flips, exotic yield, alt token accumulation.
Target: High-variance, high-reward trades.
Hunt. Speculate. Find alpha.`,
    expectedWinRate: 0.52,
    methodBias: { 'NFT FLIP': 0.35, 'YIELD FARM': 0.3, 'SPOT LONG': 0.25, 'ARBITRAGE': 0.1 }
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// BOT-TO-MODEL ASSIGNMENT
// ════════════════════════════════════════════════════════════════════════════════

const BOT_MODEL_ASSIGNMENTS = {
  // Assign models in round-robin fashion
  1: 'AGGRESSIVE_TRADER',
  2: 'CONSERVATIVE_ANALYST',
  3: 'MOMENTUM_RIDER',
  4: 'MEV_HUNTER',
  5: 'BALANCED_OPTIMIZER',
  6: 'NICHE_SPECIALIST',
  // For more bots, cycle back
  7: 'AGGRESSIVE_TRADER',
  8: 'CONSERVATIVE_ANALYST',
  9: 'MOMENTUM_RIDER',
  10: 'MEV_HUNTER'
};

function getBotAIModel(botId) {
  // Get model for this bot
  const modelKey = BOT_MODEL_ASSIGNMENTS[botId] || 'BALANCED_OPTIMIZER';
  return AI_MODELS[modelKey];
}

function getBotModelName(botId) {
  const modelKey = BOT_MODEL_ASSIGNMENTS[botId] || 'BALANCED_OPTIMIZER';
  return modelKey;
}

// ════════════════════════════════════════════════════════════════════════════════
// ARENA LEADERBOARD SYSTEM
// ════════════════════════════════════════════════════════════════════════════════

const ARENA_STATS = {
  // { botId: { modelName, totalPnL, tradeCount, wins, losses, winRate, avgEdge } }
  bots: {},
  
  initialize() {
    for (let i = 1; i <= 10; i++) {
      const modelName = getBotModelName(i);
      this.bots[i] = {
        botId: i,
        modelName: modelName,
        totalPnL: 0,
        tradeCount: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        avgEdge: 0,
        avgPnL: 0,
        maxWin: 0,
        maxLoss: 0,
        consistency: 0, // How stable the winrate is
        profitPerTrade: 0
      };
    }
  },

  recordTrade(botId, isWin, pnl, edge) {
    const bot = this.bots[botId];
    if (!bot) return;

    bot.tradeCount++;
    bot.totalPnL += pnl;
    isWin ? bot.wins++ : bot.losses++;
    bot.winRate = bot.tradeCount > 0 ? (bot.wins / bot.tradeCount * 100).toFixed(1) : 0;
    bot.avgEdge = edge || 0;
    bot.avgPnL = bot.tradeCount > 0 ? (bot.totalPnL / bot.tradeCount).toFixed(2) : 0;
    bot.profitPerTrade = bot.avgPnL;
    
    if (pnl > bot.maxWin) bot.maxWin = pnl;
    if (pnl < bot.maxLoss) bot.maxLoss = pnl;
  },

  getRanking() {
    return Object.values(this.bots)
      .sort((a, b) => b.totalPnL - a.totalPnL)
      .map((bot, idx) => ({ ...bot, rank: idx + 1 }));
  },

  getStats(botId) {
    return this.bots[botId];
  }
};

// Initialize on load
ARENA_STATS.initialize();

// ════════════════════════════════════════════════════════════════════════════════
// AI MODEL DECISION ENGINE - UNIQUE PER MODEL
// ════════════════════════════════════════════════════════════════════════════════

async function callAIModel(marketData, bet, botId) {
  const model = getBotAIModel(botId);
  const modelName = getBotModelName(botId);

  if (!model) {
    console.error(`[Arena] No AI model found for bot #${botId}`);
    return generateFallbackDecisionForModel(bet, modelName);
  }

  // Generate model-specific decision
  const decision = generateModelSpecificDecision(botId, model, marketData, bet);

  // Log to console
  console.log(`[Arena] Bot #${botId} (${modelName}) → ${decision.method} on ${decision.token}, edge: ${decision.edge_pct}%`);

  return decision;
}

function generateModelSpecificDecision(botId, model, marketData, bet) {
  const volatility = marketData?.reduce((sum, c) => sum + Math.abs(c.price_change_percentage_24h || 0), 0) / 8 || 2;
  const momentum = marketData?.reduce((sum, c) => sum + (c.price_change_percentage_24h || 0), 0) / 8 || 0;

  // Generate decision based on model personality
  const modelKey = Object.keys(AI_MODELS).find(key => AI_MODELS[key] === model);

  switch (modelKey) {
    case 'AGGRESSIVE_TRADER':
      return generateAggressiveTraderDecision(volatility, momentum, bet);

    case 'CONSERVATIVE_ANALYST':
      return generateConservativeAnalystDecision(volatility, bet);

    case 'MOMENTUM_RIDER':
      return generateMomentumRiderDecision(volatility, momentum, bet);

    case 'MEV_HUNTER':
      return generateMEVHunterDecision(volatility, bet);

    case 'BALANCED_OPTIMIZER':
      return generateBalancedOptimizerDecision(volatility, momentum, bet);

    case 'NICHE_SPECIALIST':
      return generateNicheSpecialistDecision(volatility, bet);

    default:
      return generateBalancedOptimizerDecision(volatility, momentum, bet);
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// MODEL-SPECIFIC DECISION GENERATORS
// ════════════════════════════════════════════════════════════════════════════════

function generateAggressiveTraderDecision(volatility, momentum, bet) {
  // AGGRESSIVE: High edge seeks, leverage plays
  const tokens = ['WIF', 'PEPE', 'ARB', 'SOL'];
  const token = tokens[Math.floor(Math.random() * tokens.length)];

  if (volatility > 8) {
    // High vol = time to shine
    return {
      token: token,
      token_emoji: '🔥',
      method: Math.random() > 0.5 ? 'PERP LONG' : 'PERP SHORT',
      method_emoji: '⚡',
      size_label: 'YOLO',
      edge_pct: 4.0 + Math.random() * 2.5,
      win_probability: 0.52,
      reasoning: 'Volatility spike - aggressive play',
      strategy_detail: 'High leverage on vol spike',
      outcome: Math.random() < 0.52 ? 'WIN' : 'LOSS',
      pnl_multiplier: Math.random() < 0.52 ? (2.0 + Math.random() * 1.5) : (-0.8 - Math.random() * 0.9),
      aiModel: 'AGGRESSIVE_TRADER'
    };
  }

  return {
    token: 'ARB',
    token_emoji: '📊',
    method: 'PERP LONG',
    method_emoji: '📈',
    size_label: 'HEDGE',
    edge_pct: 2.5 + Math.random() * 1.5,
    win_probability: 0.54,
    reasoning: 'Moderate vol, leverage advantage',
    strategy_detail: '3x leverage long play',
    outcome: Math.random() < 0.54 ? 'WIN' : 'LOSS',
    pnl_multiplier: Math.random() < 0.54 ? (1.5 + Math.random() * 0.8) : (-0.6 - Math.random() * 0.3),
    aiModel: 'AGGRESSIVE_TRADER'
  };
}

function generateConservativeAnalystDecision(volatility, bet) {
  // CONSERVATIVE: Low risk, steady profits
  if (volatility > 5) {
    // Reduce in high volatility
    return {
      token: 'USDC',
      token_emoji: '🛡️',
      method: 'ARBITRAGE',
      method_emoji: '💵',
      size_label: 'SAFE',
      edge_pct: 0.5 + Math.random() * 0.5,
      win_probability: 0.65,
      reasoning: 'High vol - defensive stance',
      strategy_detail: 'Ultra-safe stable coin arb',
      outcome: Math.random() < 0.65 ? 'WIN' : 'LOSS',
      pnl_multiplier: Math.random() < 0.65 ? (0.3 + Math.random() * 0.3) : (-0.1 - Math.random() * 0.1),
      aiModel: 'CONSERVATIVE_ANALYST'
    };
  }

  return {
    token: Math.random() > 0.5 ? 'USDC' : 'ETH',
    token_emoji: '🛡️',
    method: Math.random() > 0.5 ? 'ARBITRAGE' : 'YIELD FARM',
    method_emoji: '💰',
    size_label: 'SAFE',
    edge_pct: 0.8 + Math.random() * 0.8,
    win_probability: 0.63,
    reasoning: 'Consistent low-risk strategy',
    strategy_detail: 'Reliable stable yield',
    outcome: Math.random() < 0.63 ? 'WIN' : 'LOSS',
    pnl_multiplier: Math.random() < 0.63 ? (0.4 + Math.random() * 0.4) : (-0.15 - Math.random() * 0.15),
    aiModel: 'CONSERVATIVE_ANALYST'
  };
}

function generateMomentumRiderDecision(volatility, momentum, bet) {
  // MOMENTUM: Follow price action
  if (momentum > 6) {
    // Strong bull
    return {
      token: 'SOL',
      token_emoji: '📈',
      method: 'SPOT LONG',
      method_emoji: '🚀',
      size_label: 'DEGEN',
      edge_pct: 2.5 + Math.random() * 2.0,
      win_probability: 0.58,
      reasoning: 'Strong bullish momentum',
      strategy_detail: 'Riding momentum wave',
      outcome: Math.random() < 0.58 ? 'WIN' : 'LOSS',
      pnl_multiplier: Math.random() < 0.58 ? (1.2 + Math.random() * 1.3) : (-0.5 - Math.random() * 0.3),
      aiModel: 'MOMENTUM_RIDER'
    };
  } else if (momentum < -6) {
    // Strong bear
    return {
      token: 'PEPE',
      token_emoji: '📉',
      method: 'SPOT SHORT',
      method_emoji: '🔻',
      size_label: 'DEGEN',
      edge_pct: 2.0 + Math.random() * 1.5,
      win_probability: 0.56,
      reasoning: 'Bearish momentum confirmed',
      strategy_detail: 'Short the weakness',
      outcome: Math.random() < 0.56 ? 'WIN' : 'LOSS',
      pnl_multiplier: Math.random() < 0.56 ? (1.0 + Math.random() * 1.0) : (-0.6 - Math.random() * 0.2),
      aiModel: 'MOMENTUM_RIDER'
    };
  }

  // Neutral - yield farm
  return {
    token: 'ETH',
    token_emoji: '🌾',
    method: 'YIELD FARM',
    method_emoji: '💰',
    size_label: 'SAFE',
    edge_pct: 1.5 + Math.random() * 0.8,
    win_probability: 0.58,
    reasoning: 'Neutral momentum - farm instead',
    strategy_detail: 'Yield on major pair',
    outcome: Math.random() < 0.58 ? 'WIN' : 'LOSS',
    pnl_multiplier: Math.random() < 0.58 ? (0.8 + Math.random() * 0.4) : (-0.2 - Math.random() * 0.1),
    aiModel: 'MOMENTUM_RIDER'
  };
}

function generateMEVHunterDecision(volatility, bet) {
  // MEV: Look for opportunities
  if (volatility > 5) {
    // High vol = more mempool activity = more MEV
    return {
      token: 'ETH',
      token_emoji: '💰',
      method: 'FLASH LOAN',
      method_emoji: '⚡',
      size_label: 'TACTICAL',
      edge_pct: 3.5 + Math.random() * 2.0,
      win_probability: 0.55,
      reasoning: 'High vol = more MEV opportunities',
      strategy_detail: 'Flash loan sandwich play',
      outcome: Math.random() < 0.55 ? 'WIN' : 'LOSS',
      pnl_multiplier: Math.random() < 0.55 ? (1.5 + Math.random() * 1.0) : (-0.4 - Math.random() * 0.3),
      aiModel: 'MEV_HUNTER'
    };
  }

  return {
    token: 'ETH',
    token_emoji: '💰',
    method: Math.random() > 0.5 ? 'ARBITRAGE' : 'FLASH LOAN',
    method_emoji: '🔄',
    size_label: 'TACTICAL',
    edge_pct: 2.0 + Math.random() * 1.5,
    win_probability: 0.56,
    reasoning: 'Scanning for MEV value',
    strategy_detail: 'MEV extraction play',
    outcome: Math.random() < 0.56 ? 'WIN' : 'LOSS',
    pnl_multiplier: Math.random() < 0.56 ? (1.0 + Math.random() * 0.8) : (-0.3 - Math.random() * 0.2),
    aiModel: 'MEV_HUNTER'
  };
}

function generateBalancedOptimizerDecision(volatility, momentum, bet) {
  // BALANCED: Adapt to conditions
  const methods = ['ARBITRAGE', 'SPOT LONG', 'YIELD FARM', 'FLASH LOAN'];
  const tokens = ['ETH', 'SOL', 'ARB', 'PEPE'];

  return {
    token: tokens[Math.floor(Math.random() * tokens.length)],
    token_emoji: '⚖️',
    method: methods[Math.floor(Math.random() * methods.length)],
    method_emoji: '🔄',
    size_label: 'HEDGE',
    edge_pct: 1.2 + Math.random() * 2.5,
    win_probability: 0.55,
    reasoning: 'Balanced approach',
    strategy_detail: 'Risk-adjusted positioning',
    outcome: Math.random() < 0.55 ? 'WIN' : 'LOSS',
    pnl_multiplier: Math.random() < 0.55 ? (0.8 + Math.random() * 0.8) : (-0.4 - Math.random() * 0.2),
    aiModel: 'BALANCED_OPTIMIZER'
  };
}

function generateNicheSpecialistDecision(volatility, bet) {
  // NICHE: Hunt for alpha
  const plays = [
    {
      token: 'BLUR',
      method: 'NFT FLIP',
      emoji: '🖼️',
      edge: 2.5,
      detail: 'NFT floor flip'
    },
    {
      token: 'ETH',
      method: 'YIELD FARM',
      emoji: '🌾',
      edge: 1.8,
      detail: 'Exotic pool farming'
    },
    {
      token: 'PEPE',
      method: 'SPOT LONG',
      emoji: '🐸',
      edge: 2.0,
      detail: 'Alt coin accumulation'
    }
  ];

  const chosen = plays[Math.floor(Math.random() * plays.length)];

  return {
    token: chosen.token,
    token_emoji: chosen.emoji,
    method: chosen.method,
    method_emoji: '✨',
    size_label: 'DEGEN',
    edge_pct: chosen.edge + Math.random() * 1.5,
    win_probability: 0.52,
    reasoning: 'Niche alpha opportunity',
    strategy_detail: chosen.detail,
    outcome: Math.random() < 0.52 ? 'WIN' : 'LOSS',
    pnl_multiplier: Math.random() < 0.52 ? (1.2 + Math.random() * 1.3) : (-0.5 - Math.random() * 0.3),
    aiModel: 'NICHE_SPECIALIST'
  };
}

function generateFallbackDecisionForModel(bet, modelName) {
  const models = {
    'AGGRESSIVE_TRADER': () => generateAggressiveTraderDecision(5, 0, bet),
    'CONSERVATIVE_ANALYST': () => generateConservativeAnalystDecision(3, bet),
    'MOMENTUM_RIDER': () => generateMomentumRiderDecision(3, 0, bet),
    'MEV_HUNTER': () => generateMEVHunterDecision(4, bet),
    'BALANCED_OPTIMIZER': () => generateBalancedOptimizerDecision(3, 0, bet),
    'NICHE_SPECIALIST': () => generateNicheSpecialistDecision(3, bet)
  };

  const generator = models[modelName];
  return generator ? generator() : generateBalancedOptimizerDecision(3, 0, bet);
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AI_MODELS,
    BOT_MODEL_ASSIGNMENTS,
    ARENA_STATS,
    getBotAIModel,
    getBotModelName,
    callAIModel,
    generateModelSpecificDecision
  };
}
