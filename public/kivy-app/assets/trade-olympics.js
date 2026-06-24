/**
 * TRADE OLYMPICS SYSTEM
 * Head-to-Head Model Competition
 * Each model gets assigned to specific trade methods/tokens/edges for direct comparison
 * Creates a fair bracket system where all models compete on equal footing
 */

// ════════════════════════════════════════════════════════════════════════════════
// TRADE OLYMPICS CONFIG
// ════════════════════════════════════════════════════════════════════════════════

const TRADE_OLYMPICS = {
  // All available trading methods
  METHODS: [
    'ARBITRAGE',
    'FLASH LOAN',
    'SPOT LONG',
    'SPOT SHORT',
    'PERP LONG',
    'PERP SHORT',
    'NFT FLIP',
    'YIELD FARM'
  ],

  // Popular tokens to trade
  TOKENS: [
    'BTC', 'ETH', 'SOL', 'AVAX', 'MATIC', 'LINK',
    'UNI', 'AAVE', 'CRV', 'ARB', 'OP', 'BLUR'
  ],

  // Edge tiers (% profit opportunity)
  EDGE_TIERS: [
    { name: 'MICRO', min: 0.1, max: 0.5, label: '0.1-0.5%' },
    { name: 'SMALL', min: 0.5, max: 1.5, label: '0.5-1.5%' },
    { name: 'MEDIUM', min: 1.5, max: 3.5, label: '1.5-3.5%' },
    { name: 'LARGE', min: 3.5, max: 6.5, label: '3.5-6.5%' },
    { name: 'MEGA', min: 6.5, max: 10.0, label: '6.5-10%' }
  ],

  // Tournament brackets - each model assigned to specific combinations
  BRACKETS: {},

  // Model competition history
  COMPETITION_LOG: {},

  // Overall standings
  STANDINGS: {},

  /**
   * Initialize the Olympics system
   * Distributes each model evenly across methods/tokens/edges
   */
  initialize() {
    const models = [];
    
    // Collect all 12 models
    if (typeof LM_ARENA_MODELS !== 'undefined') {
      for (const tier in LM_ARENA_MODELS) {
        for (const modelName in LM_ARENA_MODELS[tier]) {
          models.push(modelName);
        }
      }
    }

    const numModels = models.length;
    const numMethods = this.METHODS.length;
    const numTokens = this.TOKENS.length;
    const numEdges = this.EDGE_TIERS.length;

    // Create brackets - round-robin assignment
    let modelIndex = 0;
    for (let m = 0; m < numMethods; m++) {
      for (let t = 0; t < numTokens; t++) {
        for (let e = 0; e < numEdges; e++) {
          const bracket = `${this.METHODS[m]}_${this.TOKENS[t]}_${this.EDGE_TIERS[e].name}`;
          const assignedModel = models[modelIndex % numModels];
          
          this.BRACKETS[bracket] = {
            method: this.METHODS[m],
            token: this.TOKENS[t],
            edgeTier: this.EDGE_TIERS[e],
            assignedModel: assignedModel,
            trades: 0,
            wins: 0,
            losses: 0,
            totalPnL: 0,
            winRate: 0.0,
            avgEdge: 0.0,
            avgPnL: 0.0
          };

          // Initialize model standings
          if (!this.STANDINGS[assignedModel]) {
            this.STANDINGS[assignedModel] = {
              model: assignedModel,
              provider: this._getProvider(assignedModel),
              elo: this._getElo(assignedModel),
              bracketsAssigned: [],
              totalTrades: 0,
              totalWins: 0,
              totalLosses: 0,
              totalPnL: 0,
              overallWinRate: 0.0,
              avgTradeValue: 0.0,
              medals: { gold: 0, silver: 0, bronze: 0 }
            };
          }

          this.STANDINGS[assignedModel].bracketsAssigned.push(bracket);
          modelIndex++;
        }
      }
    }

    console.log(`[Trade Olympics] Initialized with ${numModels} models across ${Object.keys(this.BRACKETS).length} brackets`);
    this._logBracketAssignments();
  },

  /**
   * Get or assign a model for a specific trade scenario
   * @param {string} method - Trade method (e.g., 'ARBITRAGE')
   * @param {string} token - Token symbol (e.g., 'BTC')
   * @param {number} edgePercent - Edge percentage (0.1-10)
   * @returns {object} Model assignment and bracket info
   */
  getModelForTrade(method, token, edgePercent) {
    // Determine edge tier
    let edgeTier = 'MICRO';
    for (const tier of this.EDGE_TIERS) {
      if (edgePercent >= tier.min && edgePercent <= tier.max) {
        edgeTier = tier.name;
        break;
      }
    }

    const bracket = `${method}_${token}_${edgeTier}`;
    const bracketInfo = this.BRACKETS[bracket];

    if (!bracketInfo) {
      // Fallback if bracket not found
      return {
        model: 'claude-3.5-sonnet',
        method: method,
        token: token,
        edgeTier: edgeTier,
        bracket: bracket,
        isOlympics: false
      };
    }

    return {
      model: bracketInfo.assignedModel,
      method: method,
      token: token,
      edgeTier: edgeTier,
      bracket: bracket,
      isOlympics: true,
      bracketInfo: bracketInfo
    };
  },

  /**
   * Record a trade result for the Olympics
   * @param {string} bracket - Bracket identifier
   * @param {object} result - Trade result {outcome, pnl, edge}
   */
  recordTrade(bracket, result) {
    if (!this.BRACKETS[bracket]) return;

    const bracketInfo = this.BRACKETS[bracket];
    const modelName = bracketInfo.assignedModel;

    // Update bracket stats
    bracketInfo.trades++;
    if (result.outcome === 'WIN') {
      bracketInfo.wins++;
    } else {
      bracketInfo.losses++;
    }
    bracketInfo.totalPnL += result.pnl || 0;
    bracketInfo.winRate = bracketInfo.trades > 0 ? 
      (bracketInfo.wins / bracketInfo.trades) : 0;
    bracketInfo.avgEdge = (bracketInfo.avgEdge + (result.edge || 0)) / 2;
    bracketInfo.avgPnL = bracketInfo.totalPnL / bracketInfo.trades;

    // Update model standings
    const standings = this.STANDINGS[modelName];
    standings.totalTrades++;
    if (result.outcome === 'WIN') {
      standings.totalWins++;
    } else {
      standings.totalLosses++;
    }
    standings.totalPnL += result.pnl || 0;
    standings.overallWinRate = standings.totalTrades > 0 ?
      (standings.totalWins / standings.totalTrades) : 0;
    standings.avgTradeValue = standings.totalPnL / standings.totalTrades;

    // Log to competition history
    if (!this.COMPETITION_LOG[bracket]) {
      this.COMPETITION_LOG[bracket] = [];
    }
    this.COMPETITION_LOG[bracket].push({
      timestamp: new Date().toISOString(),
      outcome: result.outcome,
      pnl: result.pnl,
      edge: result.edge,
      model: modelName
    });
  },

  /**
   * Get leaderboard by various metrics
   * @param {string} metric - 'winRate', 'totalPnL', 'trades', 'avgTradeValue'
   * @returns {array} Ranked models
   */
  getLeaderboard(metric = 'totalPnL') {
    const rankings = Object.values(this.STANDINGS)
      .sort((a, b) => {
        if (metric === 'winRate') {
          return b.overallWinRate - a.overallWinRate;
        } else if (metric === 'totalPnL') {
          return b.totalPnL - a.totalPnL;
        } else if (metric === 'trades') {
          return b.totalTrades - a.totalTrades;
        } else if (metric === 'avgTradeValue') {
          return b.avgTradeValue - a.avgTradeValue;
        }
        return 0;
      });

    return rankings.map((model, index) => ({
      rank: index + 1,
      ...model,
      medal: index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : ''))
    }));
  },

  /**
   * Get all brackets assigned to a model
   * @param {string} modelName - Model name
   * @returns {array} Bracket assignments
   */
  getModelBrackets(modelName) {
    return (this.STANDINGS[modelName]?.bracketsAssigned || [])
      .map(bracket => this.BRACKETS[bracket]);
  },

  /**
   * Get competition summary for UI display
   * @returns {object} Summary stats
   */
  getSummary() {
    const totalTrades = Object.values(this.STANDINGS)
      .reduce((sum, model) => sum + model.totalTrades, 0);
    
    const totalPnL = Object.values(this.STANDINGS)
      .reduce((sum, model) => sum + model.totalPnL, 0);

    const topModel = this.getLeaderboard('totalPnL')[0];

    return {
      totalBrackets: Object.keys(this.BRACKETS).length,
      totalModels: Object.keys(this.STANDINGS).length,
      totalTrades: totalTrades,
      totalPnL: totalPnL,
      topModel: topModel?.model,
      topModelPnL: topModel?.totalPnL,
      topModelWinRate: topModel?.overallWinRate
    };
  },

  /**
   * Get bracket-level leaderboard (best performing brackets)
   * @param {number} limit - Top N brackets
   * @returns {array} Top brackets by performance
   */
  getTopBrackets(limit = 10) {
    return Object.entries(this.BRACKETS)
      .map(([bracket, info]) => ({
        bracket,
        ...info,
        roi: info.avgPnL > 0 ? (info.avgPnL / info.trades) * 100 : 0
      }))
      .sort((a, b) => b.totalPnL - a.totalPnL)
      .slice(0, limit);
  },

  /**
   * Get weakest brackets (opportunities for improvement)
   * @param {number} limit - Bottom N brackets
   * @returns {array} Worst performing brackets
   */
  getWeakestBrackets(limit = 10) {
    return Object.entries(this.BRACKETS)
      .filter(([, info]) => info.trades > 0)
      .map(([bracket, info]) => ({
        bracket,
        ...info,
        roi: (info.avgPnL / info.trades) * 100
      }))
      .sort((a, b) => a.totalPnL - b.totalPnL)
      .slice(0, limit);
  },

  /**
   * Get model performance on specific method
   * @param {string} modelName - Model name
   * @param {string} method - Trade method
   * @returns {object} Method-specific stats
   */
  getModelMethodStats(modelName, method) {
    const brackets = this.getModelBrackets(modelName);
    const methodBrackets = brackets.filter(b => b.method === method);

    return {
      model: modelName,
      method: method,
      brackets: methodBrackets.length,
      totalTrades: methodBrackets.reduce((sum, b) => sum + b.trades, 0),
      totalWins: methodBrackets.reduce((sum, b) => sum + b.wins, 0),
      totalPnL: methodBrackets.reduce((sum, b) => sum + b.totalPnL, 0),
      winRate: methodBrackets.reduce((sum, b) => sum + b.winRate, 0) / methodBrackets.length
    };
  },

  /**
   * Get model performance on specific token
   * @param {string} modelName - Model name
   * @param {string} token - Token symbol
   * @returns {object} Token-specific stats
   */
  getModelTokenStats(modelName, token) {
    const brackets = this.getModelBrackets(modelName);
    const tokenBrackets = brackets.filter(b => b.token === token);

    return {
      model: modelName,
      token: token,
      brackets: tokenBrackets.length,
      totalTrades: tokenBrackets.reduce((sum, b) => sum + b.trades, 0),
      totalWins: tokenBrackets.reduce((sum, b) => sum + b.wins, 0),
      totalPnL: tokenBrackets.reduce((sum, b) => sum + b.totalPnL, 0),
      winRate: tokenBrackets.reduce((sum, b) => sum + b.winRate, 0) / tokenBrackets.length
    };
  },

  /**
   * Compare two models head-to-head
   * @param {string} model1 - First model
   * @param {string} model2 - Second model
   * @returns {object} Comparison stats
   */
  compareModels(model1, model2) {
    const stats1 = this.STANDINGS[model1];
    const stats2 = this.STANDINGS[model2];

    return {
      model1: model1,
      model2: model2,
      pnlDiff: (stats1?.totalPnL || 0) - (stats2?.totalPnL || 0),
      winRateDiff: (stats1?.overallWinRate || 0) - (stats2?.overallWinRate || 0),
      tradesDiff: (stats1?.totalTrades || 0) - (stats2?.totalTrades || 0),
      winner: ((stats1?.totalPnL || 0) > (stats2?.totalPnL || 0)) ? model1 : model2,
      stats1: stats1,
      stats2: stats2
    };
  },

  // ════════════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ════════════════════════════════════════════════════════════════════════════════

  _getProvider(modelName) {
    if (typeof LM_ARENA_MODELS !== 'undefined') {
      for (const tier in LM_ARENA_MODELS) {
        if (LM_ARENA_MODELS[tier][modelName]) {
          return LM_ARENA_MODELS[tier][modelName].provider;
        }
      }
    }
    return 'Unknown';
  },

  _getElo(modelName) {
    if (typeof LM_ARENA_MODELS !== 'undefined') {
      for (const tier in LM_ARENA_MODELS) {
        if (LM_ARENA_MODELS[tier][modelName]) {
          return LM_ARENA_MODELS[tier][modelName].elo;
        }
      }
    }
    return 1000;
  },

  _logBracketAssignments() {
    console.log('\n[Trade Olympics] Bracket Assignments:');
    
    for (const modelName in this.STANDINGS) {
      const standing = this.STANDINGS[modelName];
      console.log(`\n  ${modelName} (ELO: ${standing.elo})`);
      console.log(`    Assigned Brackets: ${standing.bracketsAssigned.length}`);
      
      // Show sample brackets
      standing.bracketsAssigned.slice(0, 3).forEach(bracket => {
        console.log(`      • ${bracket}`);
      });
      if (standing.bracketsAssigned.length > 3) {
        console.log(`      ... and ${standing.bracketsAssigned.length - 3} more`);
      }
    }
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// AUTO-INITIALIZE ON LOAD
// ════════════════════════════════════════════════════════════════════════════════

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    TRADE_OLYMPICS.initialize();
  });
} else {
  TRADE_OLYMPICS.initialize();
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TRADE_OLYMPICS };
}
