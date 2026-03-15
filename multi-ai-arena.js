/**
 * MULTI-AI MODEL ARENA SYSTEM
 * Competitive Trading with Multiple LLM Providers
 * Integrates: Claude, GPT-5, Grok, Copilot, LLaMA, Mistral
 * Uses LM Arena ELO ratings for model quality ranking
 */

// ════════════════════════════════════════════════════════════════════════════════
// LM ARENA MODEL REGISTRY
// Based on real LM Arena ELO ratings (March 2026)
// ════════════════════════════════════════════════════════════════════════════════

const LM_ARENA_MODELS = {
  // Tier 1: Best-in-class models (ELO > 1300)
  TIER_1: {
    'gpt-5-turbo': {
      provider: 'OpenAI',
      elo: 1400,
      category: 'frontier',
      personality: 'PRECISION',
      characteristics: 'Logical, detailed analysis, risk-aware',
      strengths: ['Risk Assessment', 'Complex Analysis', 'Edge Calculation'],
      weaknesses: ['Conservative', 'Slower Decisions'],
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      costPer1kTokens: 0.03,
      speedMs: 800,
      contextWindow: 128000
    },
    'claude-3.5-sonnet': {
      provider: 'Anthropic',
      elo: 1390,
      category: 'frontier',
      personality: 'BALANCED',
      characteristics: 'Well-rounded, good reasoning, creative',
      strengths: ['Reasoning', 'Context Understanding', 'Adaptability'],
      weaknesses: ['Moderate Speed'],
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
      costPer1kTokens: 0.003,
      speedMs: 1200,
      contextWindow: 200000
    },
    'grok-3': {
      provider: 'xAI',
      elo: 1380,
      category: 'frontier',
      personality: 'AGGRESSIVE',
      characteristics: 'Quick, witty, takes calculated risks',
      strengths: ['Speed', 'Risk Taking', 'Quick Decisions'],
      weaknesses: ['Overconfidence', 'Less Risk Averse'],
      apiEndpoint: 'https://api.x.ai/v1/chat/completions',
      costPer1kTokens: 0.02,
      speedMs: 400,
      contextWindow: 128000
    }
  },

  // Tier 2: Strong models (ELO 1200-1300)
  TIER_2: {
    'gpt-4o': {
      provider: 'OpenAI',
      elo: 1280,
      category: 'strong',
      personality: 'ANALYTICAL',
      characteristics: 'Methodical, thorough, systematic',
      strengths: ['Pattern Recognition', 'Data Analysis'],
      weaknesses: ['Can be Verbose'],
      apiEndpoint: 'https://api.openai.com/v1/chat/completions',
      costPer1kTokens: 0.015,
      speedMs: 600,
      contextWindow: 128000
    },
    'copilot-pro': {
      provider: 'Microsoft',
      elo: 1260,
      category: 'strong',
      personality: 'COLLABORATIVE',
      characteristics: 'Helpful, practical, good at trade synthesis',
      strengths: ['Synthesis', 'User Understanding'],
      weaknesses: ['Less Aggressive'],
      apiEndpoint: 'https://api.microsoft.com/copilot/v1',
      costPer1kTokens: 0.01,
      speedMs: 700,
      contextWindow: 120000
    },
    'claude-3-opus': {
      provider: 'Anthropic',
      elo: 1250,
      category: 'strong',
      personality: 'THOUGHTFUL',
      characteristics: 'Deliberate, careful reasoning',
      strengths: ['Deep Reasoning', 'Nuance'],
      weaknesses: ['Slower', 'Conservative'],
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
      costPer1kTokens: 0.015,
      speedMs: 1500,
      contextWindow: 200000
    }
  },

  // Tier 3: Solid models (ELO 1100-1200)
  TIER_3: {
    'llama-3-70b': {
      provider: 'Meta',
      elo: 1180,
      category: 'solid',
      personality: 'STEADY',
      characteristics: 'Reliable, consistent decisions',
      strengths: ['Consistency', 'Open Source'],
      weaknesses: ['Less Creative'],
      apiEndpoint: 'https://api.together.xyz/v1/chat/completions',
      costPer1kTokens: 0.001,
      speedMs: 900,
      contextWindow: 8000
    },
    'mistral-large': {
      provider: 'Mistral AI',
      elo: 1170,
      category: 'solid',
      personality: 'PRAGMATIC',
      characteristics: 'Practical, efficient, good value',
      strengths: ['Efficiency', 'Speed', 'Cost'],
      weaknesses: ['Smaller Context'],
      apiEndpoint: 'https://api.mistral.ai/v1/chat/completions',
      costPer1kTokens: 0.0008,
      speedMs: 500,
      contextWindow: 32000
    },
    'claude-3-sonnet': {
      provider: 'Anthropic',
      elo: 1150,
      category: 'solid',
      personality: 'BALANCED',
      characteristics: 'Good all-rounder, fast',
      strengths: ['Speed', 'Balance'],
      weaknesses: ['Less Powerful'],
      apiEndpoint: 'https://api.anthropic.com/v1/messages',
      costPer1kTokens: 0.003,
      speedMs: 600,
      contextWindow: 200000
    }
  },

  // Tier 4: Capable models (ELO 1000-1100)
  TIER_4: {
    'neural-shadow': {
      provider: 'DeepSeek',
      elo: 1100,
      category: 'capable',
      personality: 'CREATIVE',
      characteristics: 'Experimental, novel approaches',
      strengths: ['Innovation', 'Alternative Strategies'],
      weaknesses: ['Unpredictability'],
      apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
      costPer1kTokens: 0.0005,
      speedMs: 800,
      contextWindow: 4000
    },
    'qwen-72b': {
      provider: 'Alibaba',
      elo: 1090,
      category: 'capable',
      personality: 'CURIOUS',
      characteristics: 'Inquisitive, asks clarifying questions',
      strengths: ['Questioner', 'Detail Oriented'],
      weaknesses: ['Slower'],
      apiEndpoint: 'https://api.aliyun.com/qwen/v1',
      costPer1kTokens: 0.0003,
      speedMs: 1000,
      contextWindow: 32000
    },
    'gemini-2.0': {
      provider: 'Google',
      elo: 1080,
      category: 'capable',
      personality: 'SYSTEMATIC',
      characteristics: 'Organized, structured thinking',
      strengths: ['Organization', 'Structure'],
      weaknesses: ['Conservative'],
      apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
      costPer1kTokens: 0.0015,
      speedMs: 700,
      contextWindow: 1000000
    }
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// BOT-TO-MODEL ASSIGNMENT STRATEGY
// ════════════════════════════════════════════════════════════════════════════════

const BOT_MODEL_ASSIGNMENT = {
  // Assign models based on bot profile + trading style
  assignments: {
    'SCALPER': {
      preferred: 'grok-3',           // Fast decision maker
      alternatives: ['mistral-large', 'neural-shadow'],
      rationale: 'Speed is critical for scalping'
    },
    'TREND': {
      preferred: 'gpt-5-turbo',      // Good at pattern recognition
      alternatives: ['claude-3.5-sonnet', 'mistral-large'],
      rationale: 'Pattern recognition for momentum'
    },
    'AGGRESSIVE': {
      preferred: 'grok-3',           // Risk-taking personality
      alternatives: ['gpt-5-turbo', 'neural-shadow'],
      rationale: 'Calculated risk-taking required'
    },
    'CONSERVATIVE': {
      preferred: 'claude-3-opus',    // Careful reasoning
      alternatives: ['gpt-4o', 'gemini-2.0'],
      rationale: 'Deep risk analysis needed'
    },
    'BALANCED': {
      preferred: 'claude-3.5-sonnet', // Well-rounded
      alternatives: ['gpt-4o', 'copilot-pro'],
      rationale: 'Balanced approach for mixed strategies'
    },
    'NICHE': {
      preferred: 'neural-shadow',    // Creative/experimental
      alternatives: ['mistral-large', 'qwen-72b'],
      rationale: 'Novel strategies for alternatives'
    }
  },

  // Model personality traits for trading decisions
  personalityTraits: {
    'PRECISION': {
      edgeMultiplier: 1.0,
      riskAversion: 1.2,
      decisionSpeed: 0.9,
      creativity: 0.7
    },
    'AGGRESSIVE': {
      edgeMultiplier: 1.3,
      riskAversion: 0.7,
      decisionSpeed: 1.2,
      creativity: 1.0
    },
    'BALANCED': {
      edgeMultiplier: 1.0,
      riskAversion: 1.0,
      decisionSpeed: 1.0,
      creativity: 0.9
    },
    'ANALYTICAL': {
      edgeMultiplier: 0.95,
      riskAversion: 1.1,
      decisionSpeed: 0.8,
      creativity: 0.8
    },
    'COLLABORATIVE': {
      edgeMultiplier: 0.95,
      riskAversion: 1.0,
      decisionSpeed: 0.9,
      creativity: 0.9
    },
    'THOUGHTFUL': {
      edgeMultiplier: 0.9,
      riskAversion: 1.3,
      decisionSpeed: 0.7,
      creativity: 0.8
    },
    'STEADY': {
      edgeMultiplier: 0.95,
      riskAversion: 1.0,
      decisionSpeed: 0.95,
      creativity: 0.8
    },
    'PRAGMATIC': {
      edgeMultiplier: 1.0,
      riskAversion: 0.95,
      decisionSpeed: 1.1,
      creativity: 0.75
    },
    'CREATIVE': {
      edgeMultiplier: 1.1,
      riskAversion: 0.85,
      decisionSpeed: 1.0,
      creativity: 1.3
    },
    'CURIOUS': {
      edgeMultiplier: 0.95,
      riskAversion: 1.05,
      decisionSpeed: 0.85,
      creativity: 1.1
    },
    'SYSTEMATIC': {
      edgeMultiplier: 0.95,
      riskAversion: 1.1,
      decisionSpeed: 0.9,
      creativity: 0.7
    }
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// ARENA COMPETITION TRACKING
// ════════════════════════════════════════════════════════════════════════════════

const ARENA_COMPETITION = {
  // Track model performance across all bots
  modelStats: {},
  
  // Initialize model stats
  initializeModel(modelName, botId, botProfile) {
    if (!this.modelStats[modelName]) {
      this.modelStats[modelName] = {
        name: modelName,
        provider: LM_ARENA_MODELS.TIER_1[modelName]?.provider || 
                 LM_ARENA_MODELS.TIER_2[modelName]?.provider ||
                 LM_ARENA_MODELS.TIER_3[modelName]?.provider ||
                 LM_ARENA_MODELS.TIER_4[modelName]?.provider ||
                 'Unknown',
        baseTrades: 0,
        wins: 0,
        losses: 0,
        totalPnL: 0,
        avgEdge: 0,
        successRate: 0,
        botIds: [],
        winRate: 0,
        eloRating: this.getModelElo(modelName),
        trades: []
      };
    }
    if (!this.modelStats[modelName].botIds.includes(botId)) {
      this.modelStats[modelName].botIds.push(botId);
    }
  },

  // Get model ELO rating
  getModelElo(modelName) {
    for (const tier in LM_ARENA_MODELS) {
      if (LM_ARENA_MODELS[tier][modelName]) {
        return LM_ARENA_MODELS[tier][modelName].elo;
      }
    }
    return 1000; // Default
  },

  // Record trade result
  recordTrade(modelName, botId, result) {
    if (!this.modelStats[modelName]) return;
    
    const stats = this.modelStats[modelName];
    stats.baseTrades++;
    
    if (result.isWin) {
      stats.wins++;
    } else {
      stats.losses++;
    }
    
    stats.totalPnL += result.pnl;
    stats.successRate = (stats.wins / stats.baseTrades * 100).toFixed(1);
    stats.trades.push({
      botId,
      timestamp: Date.now(),
      pnl: result.pnl,
      isWin: result.isWin,
      edge: result.edge,
      method: result.method
    });
  },

  // Get leaderboard
  getLeaderboard() {
    const stats = Object.values(this.modelStats)
      .sort((a, b) => b.totalPnL - a.totalPnL);
    
    return stats.map((stat, idx) => ({
      rank: idx + 1,
      model: stat.name,
      provider: stat.provider,
      trades: stat.baseTrades,
      wins: stat.wins,
      losses: stat.losses,
      winRate: stat.successRate,
      totalPnL: stat.totalPnL,
      avgPnL: stat.baseTrades > 0 ? (stat.totalPnL / stat.baseTrades).toFixed(2) : 0,
      eloRating: stat.eloRating,
      bots: stat.botIds.length
    }));
  },

  // Get best model for profile
  getBestModelForProfile(botProfile) {
    const assignment = BOT_MODEL_ASSIGNMENT.assignments[botProfile];
    if (!assignment) return 'claude-3.5-sonnet'; // Default
    
    return assignment.preferred;
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// DECISION ENGINE WITH MODEL-SPECIFIC TRAITS
// ════════════════════════════════════════════════════════════════════════════════

function generateModelSpecificDecision(botId, botProfile, modelName, marketData, bet, botStrategy) {
  // Get model configuration
  const modelConfig = getModelConfig(modelName);
  if (!modelConfig) return fallbackDecision(bet, botProfile, modelName);
  
  // Get personality traits
  const personality = BOT_MODEL_ASSIGNMENT.personalityTraits[modelConfig.personality] || 
                      BOT_MODEL_ASSIGNMENT.personalityTraits['BALANCED'];
  
  // Generate base decision using profile-based engine
  const baseDecision = generateBotSpecificDecision(botId, botProfile, marketData, bet, botStrategy);
  
  // Apply model-specific adjustments
  const adjustedDecision = {
    ...baseDecision,
    // Apply personality multipliers
    edge_pct: baseDecision.edge_pct * personality.edgeMultiplier,
    win_probability: Math.max(0.35, Math.min(0.75, 
      baseDecision.win_probability * (personality.riskAversion < 1 ? 1.1 : 0.95)
    )),
    
    // Add model identification
    aiModel: modelName,
    modelProvider: modelConfig.provider,
    modelPersonality: modelConfig.personality,
    modelElo: modelConfig.elo,
    modelTier: getModelTier(modelName),
    
    // Add model reasoning
    modelReasoning: `${modelConfig.personality} approach: ${modelConfig.characteristics}`,
    
    // Apply speed penalty/bonus to decision time
    decisionTimeMs: modelConfig.speedMs
  };
  
  return adjustedDecision;
}

function getModelConfig(modelName) {
  for (const tier in LM_ARENA_MODELS) {
    if (LM_ARENA_MODELS[tier][modelName]) {
      return LM_ARENA_MODELS[tier][modelName];
    }
  }
  return null;
}

function getModelTier(modelName) {
  for (const tier in LM_ARENA_MODELS) {
    if (LM_ARENA_MODELS[tier][modelName]) {
      return tier;
    }
  }
  return 'TIER_4';
}

function getRandomModelForProfile(botProfile) {
  const assignment = BOT_MODEL_ASSIGNMENT.assignments[botProfile];
  if (!assignment) return 'claude-3.5-sonnet';
  
  const models = [assignment.preferred, ...assignment.alternatives];
  return models[Math.floor(Math.random() * models.length)];
}

// ════════════════════════════════════════════════════════════════════════════════
// PUBLIC INTERFACE FOR HTML
// ════════════════════════════════════════════════════════════════════════════════

// Global bot-to-model mapping
const BOT_AI_MODELS = {};

/**
 * Get the assigned AI model for a bot
 * @param {number} botId - Bot ID
 * @returns {string} Model name
 */
function getBotModelName(botId) {
  return BOT_AI_MODELS[botId] || 'claude-3.5-sonnet';
}

/**
 * Call AI with model-specific decision making + Trade Olympics integration
 * @param {array} marketData - Market data
 * @param {number} bet - Bet amount
 * @param {number} botId - Bot ID
 * @returns {Promise<object>} Decision object
 */
async function callAIModel(marketData, bet, botId) {
  try {
    // Get bot profile
    const bot = typeof bots !== 'undefined' ? bots.find(b => b.id === botId) : null;
    const botProfile = bot?.profile || 'BALANCED';
    const botStrategy = typeof botStrategies !== 'undefined' ? botStrategies[botId] : {};

    // Generate model-specific decision
    const decision = generateModelSpecificDecision(
      botId,
      botProfile,
      null, // Will be assigned by Trade Olympics
      marketData,
      bet,
      botStrategy
    );

    // TRADE OLYMPICS: Get model assignment for this specific trade scenario
    let modelName = null;
    let olympicsBracket = null;
    
    if (typeof TRADE_OLYMPICS !== 'undefined' && TRADE_OLYMPICS.getModelForTrade) {
      const olympicsAssignment = TRADE_OLYMPICS.getModelForTrade(
        decision.method,
        decision.token,
        decision.edge_pct
      );
      
      if (olympicsAssignment && olympicsAssignment.isOlympics) {
        modelName = olympicsAssignment.model;
        olympicsBracket = olympicsAssignment.bracket;
      }
    }

    // Fallback to profile-based assignment if Trade Olympics not available
    if (!modelName) {
      if (!BOT_AI_MODELS[botId]) {
        modelName = MODEL_SELECTION.profileOptimal ? 
          MODEL_SELECTION.profileOptimal(botProfile) : 
          getRandomModelForProfile(botProfile);
        BOT_AI_MODELS[botId] = modelName;
        
        // Initialize arena competition tracking
        if (ARENA_COMPETITION && ARENA_COMPETITION.initializeModel) {
          ARENA_COMPETITION.initializeModel(modelName, botId, botProfile);
        }
      } else {
        modelName = BOT_AI_MODELS[botId];
      }
    }

    const modelConfig = getModelConfig(modelName);

    // Apply model-specific personality adjustments
    if (modelConfig && modelConfig.personality) {
      const personality = MODEL_PERSONALITY_TRAITS[modelConfig.personality] || {};
      decision.edge_pct *= personality.edgeMultiplier || 1.0;
      decision.win_probability *= (1 - (personality.riskAversion || 1.0) * 0.1);
      decision.aiModel = modelName;
      decision.modelProvider = modelConfig.provider;
      decision.modelElo = modelConfig.elo;
      decision.modelPersonality = modelConfig.personality;
      decision.olympicsBracket = olympicsBracket;
      decision.isOlympicsMatch = !!olympicsBracket;
    }

    // Record trade result in Trade Olympics if applicable
    if (olympicsBracket && typeof TRADE_OLYMPICS !== 'undefined' && TRADE_OLYMPICS.recordTrade) {
      const tradeResult = {
        outcome: decision.outcome === 'WIN' ? 'WIN' : 'LOSS',
        pnl: (decision.pnl_multiplier || 0) * bet,
        edge: decision.edge_pct || 0
      };
      TRADE_OLYMPICS.recordTrade(olympicsBracket, tradeResult);
    }

    // Record in standard arena as well
    if (ARENA_COMPETITION && ARENA_COMPETITION.recordTrade) {
      const tradeResult = {
        outcome: decision.outcome === 'WIN' ? 1 : -1,
        pnl: (decision.pnl_multiplier || 0) * bet,
        edge: decision.edge_pct || 0
      };
      ARENA_COMPETITION.recordTrade(modelName, botId, tradeResult);
    }

    // Log decision with Olympics info
    if (typeof console !== 'undefined') {
      const olympicsLabel = olympicsBracket ? ` 🏅 ${olympicsBracket}` : '';
      console.log(`[Multi-AI Arena] Bot #${botId}: Model ${modelName} (${modelConfig.provider}, ELO ${modelConfig.elo})${olympicsLabel}`);
      console.log(`  Decision: ${decision.method} on ${decision.token}`);
      console.log(`  Edge: ${decision.edge_pct}% | Win Prob: ${decision.win_probability * 100}%`);
    }

    return decision;
  } catch (error) {
    console.error('[callAIModel] Error:', error);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// MODEL SELECTION STRATEGIES
// ════════════════════════════════════════════════════════════════════════════════

const MODEL_SELECTION = {
  // Strategy 1: Round-robin through tiers
  roundRobin: (() => {
    let counter = 0;
    const allModels = [
      ...Object.keys(LM_ARENA_MODELS.TIER_1),
      ...Object.keys(LM_ARENA_MODELS.TIER_2),
      ...Object.keys(LM_ARENA_MODELS.TIER_3),
      ...Object.keys(LM_ARENA_MODELS.TIER_4)
    ];
    return () => allModels[counter++ % allModels.length];
  })(),

  // Strategy 2: ELO-based selection (higher ELO more likely)
  eloWeighted: () => {
    const allModels = [];
    
    for (const tier in LM_ARENA_MODELS) {
      Object.entries(LM_ARENA_MODELS[tier]).forEach(([name, config]) => {
        // Add multiple times based on ELO (higher ELO = more likely)
        const weight = Math.floor(config.elo / 100);
        for (let i = 0; i < weight; i++) {
          allModels.push(name);
        }
      });
    }
    
    return allModels[Math.floor(Math.random() * allModels.length)];
  },

  // Strategy 3: Profile-optimal selection
  profileOptimal: (botProfile) => {
    return getRandomModelForProfile(botProfile);
  },

  // Strategy 4: Diverse tier selection
  diverseTiers: (() => {
    let lastTier = 0;
    const tiers = ['TIER_1', 'TIER_2', 'TIER_3', 'TIER_4'];
    return () => {
      const tier = tiers[lastTier++ % tiers.length];
      const models = Object.keys(LM_ARENA_MODELS[tier]);
      return models[Math.floor(Math.random() * models.length)];
    };
  })(),

  // Strategy 5: Cost-efficient selection (good bang for buck)
  costEfficient: () => {
    const candidates = [];
    
    for (const tier in LM_ARENA_MODELS) {
      Object.entries(LM_ARENA_MODELS[tier]).forEach(([name, config]) => {
        const eloPerCost = config.elo / config.costPer1kTokens;
        candidates.push({ name, score: eloPerCost });
      });
    }
    
    // Pick from top 5 cost-efficient
    candidates.sort((a, b) => b.score - a.score);
    const top5 = candidates.slice(0, 5);
    return top5[Math.floor(Math.random() * top5.length)].name;
  },

  // Strategy 6: Speed-based selection
  speedOptimal: () => {
    const candidates = [];
    
    for (const tier in LM_ARENA_MODELS) {
      Object.entries(LM_ARENA_MODELS[tier]).forEach(([name, config]) => {
        candidates.push({ name, speed: config.speedMs });
      });
    }
    
    // Pick from fastest 5
    candidates.sort((a, b) => a.speed - b.speed);
    const fastest5 = candidates.slice(0, 5);
    return fastest5[Math.floor(Math.random() * fastest5.length)].name;
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LM_ARENA_MODELS,
    BOT_MODEL_ASSIGNMENT,
    ARENA_COMPETITION,
    generateModelSpecificDecision,
    MODEL_SELECTION,
    getModelConfig,
    getModelTier,
    getRandomModelForProfile,
    callAIModel,
    getBotModelName,
    BOT_AI_MODELS
  };
}
