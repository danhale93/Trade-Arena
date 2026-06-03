/**
 * AI STRATEGIES MODULE
 * Intelligent bot strategy adaptation for auto-mode trading
 * Adjusts method, edge, and parameters based on market signals & volatility
 */

// ════════════════════════════════════════════════════════════════════════════════
// STRATEGY ENGINE
// ════════════════════════════════════════════════════════════════════════════════

const AI_STRATEGIES = {
  // Market condition detection
  marketAnalysis: {
    volatilityThresholds: {
      LOW: 0.5,      // < 2% 24h change
      MEDIUM: 2.0,   // 2-5% change
      HIGH: 5.0,     // 5-10% change
      EXTREME: 10.0, // > 10% change
    },
    volumeThresholds: {
      LOW: 100e6,    // < $100M daily vol
      MEDIUM: 500e6, // $100M-500M
      HIGH: 1000e6,  // $500M-1B
      EXTREME: 5000e6, // > $5B
    }
  },
  
  // Bot strategy profiles
  profiles: {
    // SCALPER: Fast, low-hold, minimal risk
    SCALPER: {
      methods: ['ARBITRAGE', 'FLASH LOAN'],
      methodWeights: [0.7, 0.3],
      baseBetMultiplier: 0.8,
      edgeRange: [1.0, 3.5],
      maxDrawdown: 200, // Stop after $200 loss
      winProbabilityTarget: 0.58,
      volatilityAdaptation: 'FAVOR_TIGHT_SPREADS'
    },
    
    // TREND: Follow market momentum
    TREND: {
      methods: ['SPOT LONG', 'PERP LONG', 'YIELD FARM'],
      methodWeights: [0.5, 0.3, 0.2],
      baseBetMultiplier: 1.0,
      edgeRange: [1.5, 4.5],
      maxDrawdown: 300,
      winProbabilityTarget: 0.55,
      volatilityAdaptation: 'FOLLOW_MOMENTUM'
    },
    
    // AGGRESSIVE: High bet, high reward
    AGGRESSIVE: {
      methods: ['PERP LONG', 'SPOT SHORT', 'PERP SHORT'],
      methodWeights: [0.4, 0.3, 0.3],
      baseBetMultiplier: 1.5,
      edgeRange: [2.0, 6.5],
      maxDrawdown: 500,
      winProbabilityTarget: 0.52,
      volatilityAdaptation: 'EMBRACE_VOLATILITY'
    },
    
    // CONSERVATIVE: Low risk, steady
    CONSERVATIVE: {
      methods: ['ARBITRAGE', 'YIELD FARM'],
      methodWeights: [0.6, 0.4],
      baseBetMultiplier: 0.5,
      edgeRange: [0.8, 2.5],
      maxDrawdown: 100,
      winProbabilityTarget: 0.60,
      volatilityAdaptation: 'REDUCE_IN_VOLATILITY'
    },
    
    // BALANCED: Mix everything
    BALANCED: {
      methods: ['ARBITRAGE', 'SPOT LONG', 'YIELD FARM', 'FLASH LOAN'],
      methodWeights: [0.25, 0.25, 0.25, 0.25],
      baseBetMultiplier: 1.0,
      edgeRange: [1.2, 4.0],
      maxDrawdown: 250,
      winProbabilityTarget: 0.55,
      volatilityAdaptation: 'BALANCED'
    },

    // NICHE: NFT & alternative strategies
    NICHE: {
      methods: ['NFT FLIP', 'YIELD FARM', 'SPOT LONG'],
      methodWeights: [0.3, 0.4, 0.3],
      baseBetMultiplier: 1.2,
      edgeRange: [1.5, 5.5],
      maxDrawdown: 350,
      winProbabilityTarget: 0.54,
      volatilityAdaptation: 'HUNT_ILLIQUID'
    }
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// BOT STRATEGY STATE
// ════════════════════════════════════════════════════════════════════════════════

function initBotStrategy(botId, profile = 'BALANCED') {
  return {
    botId,
    profile,
    tradesCount: 0,
    consecutiveLosses: 0,
    consecutiveWins: 0,
    recentPnL: [],
    sessionPnL: 0,
    lastVolatility: 0,
    lastVolume: 0,
    adaptiveEdgeAdjustment: 1.0, // 0.7-1.3
    adaptiveBetAdjustment: 1.0,  // 0.5-1.5
    riskMultiplier: 1.0,
    methodBias: {}, // Track method performance
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// MARKET ANALYSIS
// ════════════════════════════════════════════════════════════════════════════════

function analyzeMarketConditions(marketData) {
  if (!marketData || !Array.isArray(marketData) || marketData.length === 0) {
    return {
      volatility: 3.0,
      volume: 500e6,
      direction: 'NEUTRAL',
      momentum: 0,
      condition: 'UNKNOWN'
    };
  }

  // Calculate average volatility from top 8 coins
  const volatilities = marketData.slice(0, 8).map(c => Math.abs(c.price_change_percentage_24h || 0));
  const avgVolatility = volatilities.reduce((a, b) => a + b, 0) / volatilities.length;
  
  // Calculate volume average
  const volumes = marketData.slice(0, 8).map(c => c.total_volume || 0);
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  
  // Determine market direction
  const positiveCount = marketData.slice(0, 8).filter(c => (c.price_change_percentage_24h || 0) > 0).length;
  const direction = positiveCount > 4 ? 'BULLISH' : positiveCount < 4 ? 'BEARISH' : 'NEUTRAL';
  
  // Momentum: sum of 24h changes
  const momentum = marketData.slice(0, 8).reduce((sum, c) => sum + (c.price_change_percentage_24h || 0), 0) / 8;
  
  // Determine condition
  let condition = 'NEUTRAL';
  if (avgVolatility < 2.0 && avgVolume > 500e6) condition = 'STABLE';
  else if (avgVolatility > 5.0 && direction === 'BULLISH') condition = 'EXPLOSIVE_UP';
  else if (avgVolatility > 5.0 && direction === 'BEARISH') condition = 'EXPLOSIVE_DOWN';
  else if (avgVolatility > 5.0) condition = 'VOLATILE';
  else if (avgVolume < 200e6) condition = 'LOW_LIQUIDITY';
  else if (direction === 'BULLISH') condition = 'TRENDING_UP';
  else if (direction === 'BEARISH') condition = 'TRENDING_DOWN';

  return {
    volatility: avgVolatility,
    volume: avgVolume,
    direction,
    momentum,
    condition
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// ADAPTIVE STRATEGY SELECTION
// ════════════════════════════════════════════════════════════════════════════════

function selectAdaptiveMethod(strategy, marketConditions, botState) {
  const profile = AI_STRATEGIES.profiles[strategy.profile] || AI_STRATEGIES.profiles.BALANCED;
  const methods = profile.methods;
  const weights = profile.methodWeights;
  
  // Adjust selection based on market condition
  let methodSelection = methods[Math.floor(Math.random() * methods.length)];
  
  switch (marketConditions.condition) {
    case 'STABLE':
      // Favor arbitrage in stable markets
      methodSelection = methods.includes('ARBITRAGE') ? 'ARBITRAGE' : methods[0];
      break;
      
    case 'EXPLOSIVE_UP':
      // Favor long positions in up markets
      if (methods.includes('PERP LONG')) methodSelection = 'PERP LONG';
      else if (methods.includes('SPOT LONG')) methodSelection = 'SPOT LONG';
      break;
      
    case 'EXPLOSIVE_DOWN':
      // Avoid trades or go short
      if (methods.includes('PERP SHORT')) methodSelection = 'PERP SHORT';
      else if (methods.includes('SPOT SHORT')) methodSelection = 'SPOT SHORT';
      else methodSelection = 'ARBITRAGE'; // Safe fallback
      break;
      
    case 'VOLATILE':
      // Favor flash loans and tight spreads in volatility
      if (methods.includes('FLASH LOAN')) methodSelection = 'FLASH LOAN';
      else if (methods.includes('ARBITRAGE')) methodSelection = 'ARBITRAGE';
      break;
      
    case 'TRENDING_UP':
      // Follow the uptrend
      if (methods.includes('SPOT LONG')) methodSelection = 'SPOT LONG';
      else if (methods.includes('PERP LONG')) methodSelection = 'PERP LONG';
      break;
      
    case 'TRENDING_DOWN':
      // Avoid momentum or go short
      methodSelection = 'ARBITRAGE';
      break;
      
    case 'LOW_LIQUIDITY':
      // Avoid all risky methods
      methodSelection = 'ARBITRAGE';
      break;
  }
  
  return methodSelection;
}

// ════════════════════════════════════════════════════════════════════════════════
// EDGE ADJUSTMENT (AI-driven edge calculation)
// ════════════════════════════════════════════════════════════════════════════════

function calculateAdaptiveEdge(strategy, marketConditions, botState, baseEdge, winProbability) {
  const profile = AI_STRATEGIES.profiles[strategy.profile] || AI_STRATEGIES.profiles.BALANCED;
  const [minEdge, maxEdge] = profile.edgeRange;
  
  // Base edge from AI
  let edge = baseEdge || 2.5;
  edge = Math.max(minEdge, Math.min(maxEdge, edge));
  
  // Adjust for consecutive losses (reduce risk)
  if (botState.consecutiveLosses >= 2) {
    edge *= 0.8; // Reduce edge after 2 losses
  }
  if (botState.consecutiveLosses >= 4) {
    edge *= 0.6; // More conservative after 4 losses
  }
  
  // Adjust for consecutive wins (increase aggression)
  if (botState.consecutiveWins >= 3) {
    edge *= 1.15; // Slight increase
  }
  
  // Adjust for volatility
  if (marketConditions.volatility > 5.0) {
    if (profile.volatilityAdaptation === 'REDUCE_IN_VOLATILITY') {
      edge *= 0.75; // Conservative profile reduces in volatility
    } else if (profile.volatilityAdaptation === 'EMBRACE_VOLATILITY') {
      edge *= 1.2; // Aggressive profile increases in volatility
    }
  }
  
  // Adjust for win probability
  const probAdjustment = (winProbability - 0.5) * 2; // Range: -1 to 1
  edge *= (1 + probAdjustment * 0.5);
  
  return Math.max(minEdge, Math.min(maxEdge, edge));
}

// ════════════════════════════════════════════════════════════════════════════════
// BET SIZING ADJUSTMENT
// ════════════════════════════════════════════════════════════════════════════════

function calculateAdaptiveBetSize(strategy, marketConditions, botState, baseBet, availableBalance) {
  const profile = AI_STRATEGIES.profiles[strategy.profile] || AI_STRATEGIES.profiles.BALANCED;
  
  let bet = baseBet || 10;
  const maxBet = Math.min(availableBalance * 0.1, 500); // Never bet more than 10% balance or $500
  bet = Math.min(bet, maxBet);
  
  // Reduce bet after losses
  if (botState.consecutiveLosses >= 2) {
    bet *= 0.7; // 30% reduction after 2 consecutive losses
  }
  if (botState.consecutiveLosses >= 4) {
    bet *= 0.5; // Half size after 4 losses
  }
  
  // Increase slightly after wins
  if (botState.consecutiveWins >= 2) {
    bet *= 1.1; // 10% increase after 2 wins
  }
  
  // Adjust for volatility
  if (marketConditions.volatility > 5.0) {
    if (profile.volatilityAdaptation === 'REDUCE_IN_VOLATILITY') {
      bet *= 0.6; // Conservative: reduce in volatility
    } else if (profile.volatilityAdaptation === 'EMBRACE_VOLATILITY') {
      bet *= 1.3; // Aggressive: increase in volatility
    } else {
      bet *= 0.85; // Balanced: modest reduction
    }
  }
  
  // Adjust for volume
  if (marketConditions.volume < 200e6) {
    bet *= 0.5; // Low liquidity = lower bets
  }
  
  // Apply adaptive adjustment from botState
  bet *= botState.adaptiveBetAdjustment;
  
  // Minimum bet
  bet = Math.max(1, Math.round(bet * 100) / 100);
  
  return Math.min(bet, maxBet);
}

// ════════════════════════════════════════════════════════════════════════════════
// UPDATE BOT STATE AFTER TRADE
// ════════════════════════════════════════════════════════════════════════════════

function updateBotStateAfterTrade(strategy, decision, actualPnL, bet) {
  strategy.tradesCount++;
  
  const isWin = actualPnL > 0;
  
  if (isWin) {
    strategy.consecutiveWins++;
    strategy.consecutiveLosses = 0;
    strategy.riskMultiplier = Math.min(1.3, strategy.riskMultiplier + 0.05);
  } else {
    strategy.consecutiveLosses++;
    strategy.consecutiveWins = 0;
    strategy.riskMultiplier = Math.max(0.5, strategy.riskMultiplier - 0.1);
  }
  
  // Track recent P&L (last 20 trades)
  strategy.recentPnL.push(actualPnL);
  if (strategy.recentPnL.length > 20) {
    strategy.recentPnL.shift();
  }
  
  strategy.sessionPnL += actualPnL;
  
  // Update method bias
  if (!strategy.methodBias[decision.method]) {
    strategy.methodBias[decision.method] = { wins: 0, losses: 0, avgPnL: 0 };
  }
  const methodStat = strategy.methodBias[decision.method];
  if (isWin) {
    methodStat.wins++;
  } else {
    methodStat.losses++;
  }
  methodStat.avgPnL = (methodStat.avgPnL * (methodStat.wins + methodStat.losses - 1) + actualPnL) / (methodStat.wins + methodStat.losses);
  
  // Adjust edge multiplier based on win rate
  const recentWinRate = strategy.recentPnL.filter(p => p > 0).length / strategy.recentPnL.length;
  if (recentWinRate > 0.58) {
    strategy.adaptiveEdgeAdjustment = Math.min(1.3, strategy.adaptiveEdgeAdjustment + 0.02);
  } else if (recentWinRate < 0.48) {
    strategy.adaptiveEdgeAdjustment = Math.max(0.7, strategy.adaptiveEdgeAdjustment - 0.02);
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// CHECK IF BOT SHOULD STOP (Risk management)
// ════════════════════════════════════════════════════════════════════════════════

function shouldBotPauseTrading(strategy, marketConditions) {
  const profile = AI_STRATEGIES.profiles[strategy.profile] || AI_STRATEGIES.profiles.BALANCED;
  
  // Stop after max drawdown reached
  if (strategy.sessionPnL < -profile.maxDrawdown) {
    return { shouldPause: true, reason: 'Max drawdown reached' };
  }
  
  // Stop after 5+ consecutive losses
  if (strategy.consecutiveLosses >= 5) {
    return { shouldPause: true, reason: '5+ consecutive losses' };
  }
  
  // Stop in extreme conditions for conservative profiles
  if (marketConditions.condition === 'EXPLOSIVE_DOWN' && profile.profile === 'CONSERVATIVE') {
    return { shouldPause: true, reason: 'Market crash - conservative mode pausing' };
  }
  
  return { shouldPause: false, reason: '' };
}

// ════════════════════════════════════════════════════════════════════════════════
// GET BOT STATUS & INSIGHTS
// ════════════════════════════════════════════════════════════════════════════════

function getBotStrategyInsights(strategy) {
  const recentWinRate = strategy.recentPnL.length === 0 
    ? 0 
    : (strategy.recentPnL.filter(p => p > 0).length / strategy.recentPnL.length * 100).toFixed(1);
  
  const avgRecentPnL = strategy.recentPnL.length === 0
    ? 0
    : (strategy.recentPnL.reduce((a, b) => a + b, 0) / strategy.recentPnL.length).toFixed(2);
  
  const bestMethod = Object.entries(strategy.methodBias).sort((a, b) => 
    (b[1].avgPnL || 0) - (a[1].avgPnL || 0)
  )[0];
  
  return {
    totalTrades: strategy.tradesCount,
    sessionPnL: strategy.sessionPnL.toFixed(2),
    recentWinRate: recentWinRate + '%',
    avgRecentPnL: '$' + avgRecentPnL,
    consecutiveWins: strategy.consecutiveWins,
    consecutiveLosses: strategy.consecutiveLosses,
    riskMultiplier: strategy.riskMultiplier.toFixed(2),
    bestPerformingMethod: bestMethod ? bestMethod[0] : 'N/A',
    profile: strategy.profile,
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// AUTO-MODE ENHANCEMENT: Intelligent trade recommendation
// ════════════════════════════════════════════════════════════════════════════════

async function getIntelligentAutoTradeRecommendation(marketData, bet, botState, strategy) {
  // Analyze market
  const marketConditions = analyzeMarketConditions(marketData);
  
  // Get AI decision (existing callAI function)
  let aiDecision = await callAI(marketData, bet, botState.botId);
  
  // Enhance with adaptive strategy
  const adaptiveMethod = selectAdaptiveMethod(strategy, marketConditions, botState);
  const adaptiveEdge = calculateAdaptiveEdge(strategy, marketConditions, botState, aiDecision.edge_pct, aiDecision.win_probability);
  const adaptiveBet = calculateAdaptiveBetSize(strategy, marketConditions, botState, bet, 10000); // Assuming $10k available
  
  // Check if should pause
  const pauseCheck = shouldBotPauseTrading(strategy, marketConditions);
  
  return {
    ...aiDecision,
    // Enhanced adaptive values
    adaptiveMethod,
    adaptiveEdge,
    adaptiveBet,
    marketCondition: marketConditions.condition,
    marketVolatility: marketConditions.volatility.toFixed(2),
    shouldPause: pauseCheck.shouldPause,
    pauseReason: pauseCheck.reason,
    // Insights
    strategyProfile: strategy.profile,
    recentWinRate: (strategy.recentPnL.filter(p => p > 0).length / Math.max(1, strategy.recentPnL.length) * 100).toFixed(1),
  };
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AI_STRATEGIES,
    initBotStrategy,
    analyzeMarketConditions,
    selectAdaptiveMethod,
    calculateAdaptiveEdge,
    calculateAdaptiveBetSize,
    updateBotStateAfterTrade,
    shouldBotPauseTrading,
    getBotStrategyInsights,
    getIntelligentAutoTradeRecommendation,
  };
}
