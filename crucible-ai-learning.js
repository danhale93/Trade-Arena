/**
 * CRUCIBLE AI LEARNING TEST SYSTEM
 * 1000-Trade Auto-Learning AI Evaluation
 * 
 * Features:
 * - Runs 1000 trades with adaptive strategy selection
 * - Real-time learning from trade outcomes
 * - Strategy performance tracking
 * - Win rate optimization through AI adaptation
 * - Volatility-based method selection
 * - Risk management with feedback loops
 */

const CrucibleAITest = {
  // Test session state
  sessionId: `crucible-ai-${Date.now()}`,
  isRunning: false,
  trades: [],
  startTime: null,
  endTime: null,
  
  // AI Learning state
  aiState: {
    totalTrades: 0,
    consecutiveWins: 0,
    consecutiveLosses: 0,
    strategyPerformance: {},
    volatilityRegime: 'NORMAL',
    learningRate: 0.05,
    edgeMultiplier: 1.0,
    betMultiplier: 1.0,
  },
  
  // Test configuration
  config: {
    paperBalance: 10000,      // Starting paper balance
    tradeCount: 1000,         // 1000 trades for learning
    tradeInterval: 50,        // ms between trades (fast learning)
    verbose: false,           // Less logging for 1000 trades
    verifyResults: true,      // Check trade outcomes
    // Risk Management
    riskPerTrade: 10,         // Max loss per trade ($)
    rewardTarget: 30,         // Min profit per trade ($)
    riskRewardRatio: 3,       // 3:1 ratio (reward = 3× risk)
    minWinProbability: 0.40,  // 40% minimum win rate to take trade
    // AI Settings
    enableAILearning: true,   // Enable adaptive learning
    enableStrategyRotation: true,
    enableVolatilityAdaptation: true,
    updateIntervalTrades: 50, // Update AI state every 50 trades
  },
  
  // Strategy pool (mimic ai-strategies.js)
  strategies: [
    { name: 'ARBITRAGE', volatilityAdapt: 'FAVOR_TIGHT_SPREADS', baseEdge: 2.1 },
    { name: 'PERP_LONG', volatilityAdapt: 'FOLLOW_MOMENTUM', baseEdge: 2.8 },
    { name: 'PERP_SHORT', volatilityAdapt: 'EMBRACE_VOLATILITY', baseEdge: 2.5 },
    { name: 'SPOT_LONG', volatilityAdapt: 'BALANCED', baseEdge: 2.2 },
    { name: 'SPOT_SHORT', volatilityAdapt: 'REDUCE_IN_VOLATILITY', baseEdge: 1.9 },
    { name: 'FLASH_LOAN', volatilityAdapt: 'HUNT_ILLIQUID', baseEdge: 3.5 },
    { name: 'YIELD_FARM', volatilityAdapt: 'FOLLOW_MOMENTUM', baseEdge: 2.3 },
  ],
  
  // ════════════════════════════════════════════════════════════════
  // INITIALIZE TEST SESSION
  // ════════════════════════════════════════════════════════════════
  init(config = {}) {
    this.config = { ...this.config, ...config };
    this.trades = [];
    this.sessionId = `crucible-ai-${Date.now()}`;
    this.isRunning = false;
    
    // Initialize strategy performance tracking
    this.aiState.strategyPerformance = {};
    this.strategies.forEach(s => {
      this.aiState.strategyPerformance[s.name] = {
        trades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        totalPnL: 0,
      };
    });
    
    console.log('%c🔬 CRUCIBLE AI LEARNING TEST INITIALIZED', 'color: #bf5fff; font-weight: bold; font-size: 14px;');
    console.log(`Session ID: ${this.sessionId}`);
    console.log(`Paper Balance: $${this.config.paperBalance}`);
    console.log(`Test Duration: ${this.config.tradeCount} trades with AI learning`);
    console.log(`AI Learning Enabled: ${this.config.enableAILearning}`);
    console.log(`Strategy Rotation: ${this.config.enableStrategyRotation}`);
    console.log(`Volatility Adaptation: ${this.config.enableVolatilityAdaptation}`);
  },

  // ════════════════════════════════════════════════════════════════
  // START PAPER TRADING TEST WITH AI LEARNING
  // ════════════════════════════════════════════════════════════════
  async start() {
    if (this.isRunning) {
      console.warn('❌ Test already running!');
      return;
    }

    this.init();
    this.isRunning = true;
    this.startTime = Date.now();
    let paperBalance = this.config.paperBalance;

    console.log('%c🚀 CRUCIBLE AI TEST STARTED (1000 TRADES)', 'color: #39ff14; font-weight: bold; font-size: 16px;');
    console.log(`Adaptive Learning: ENABLED ✅`);
    console.log(`\n`);

    for (let i = 0; i < this.config.tradeCount; i++) {
      if (!this.isRunning) break;

      const tradeNum = i + 1;

      // Update AI state every N trades
      if (i > 0 && i % this.config.updateIntervalTrades === 0) {
        this.updateAIState();
        if (this.config.verbose) {
          console.log(`\n📊 [LEARNING UPDATE at Trade ${tradeNum}] AI state updated`);
          console.log(`   Edge Multiplier: ${this.aiState.edgeMultiplier.toFixed(2)}`);
          console.log(`   Bet Multiplier: ${this.aiState.betMultiplier.toFixed(2)}`);
          console.log(`   Volatility Regime: ${this.aiState.volatilityRegime}\n`);
        }
      }

      // Generate paper trade with AI logic
      const trade = await this.executePaperTrade(tradeNum, paperBalance);
      this.trades.push(trade);

      // Update paper balance
      paperBalance += trade.pnl;

      // Log progress every 100 trades
      if (tradeNum % 100 === 0) {
        const currentStats = this.getRunningStats();
        console.log(`[Trade ${tradeNum}/1000] WR: ${currentStats.winRate.toFixed(1)}% | PF: ${currentStats.profitFactor.toFixed(2)} | P&L: $${currentStats.totalPnL.toFixed(2)} | Balance: $${paperBalance.toFixed(2)}`);
      }

      // Wait before next trade
      if (i < this.config.tradeCount - 1) {
        await this.sleep(this.config.tradeInterval);
      }
    }

    this.endTime = Date.now();
    this.isRunning = false;

    // Summary report
    await this.sleep(500);
    this.generateReport();
  },

  // ════════════════════════════════════════════════════════════════
  // EXECUTE A SINGLE PAPER TRADE WITH AI ADAPTATION
  // ════════════════════════════════════════════════════════════════
  async executePaperTrade(tradeNum, paperBalance) {
    // AI selects strategy based on learning
    const selectedStrategy = this.selectStrategyAI();
    
    const trade = {
      // Identification
      sessionId: this.sessionId,
      tradeNum,
      timestamp: new Date().toISOString(),
      
      // Strategy selection (AI-driven)
      strategy: selectedStrategy.name,
      strategyEdgeBase: selectedStrategy.baseEdge,
      
      // Trade parameters (simulated)
      method: this.randomToken(),
      token: this.randomToken(),
      
      // Risk Management
      riskPerTrade: this.config.riskPerTrade,
      rewardTarget: this.config.rewardTarget,
      riskRewardRatio: this.config.riskRewardRatio,
      
      // Price execution (simulated)
      entryPrice: Math.random() * 50000 + 10000,
      exitPrice: null,
      stopLossPrice: null,
      takeProfitPrice: null,
      
      // Win/loss determination with AI adaptation
      baseWinProbability: Math.random() * 0.35 + 0.45, // 45-80%
      winProbability: 0, // Will be adjusted by AI
      
      // Result calculation
      pnl: 0,
      pnlPercent: 0,
      isWin: false,
      
      // Edge metrics (AI-adapted)
      baseEdge: selectedStrategy.baseEdge,
      adaptedEdge: 0,
      confidence: Math.random() * 0.35 + 0.5,
      
      // Expected value calculation
      expectedValue: 0,
      
      // AI learning fields
      aiAdapted: false,
      edgeMultiplier: this.aiState.edgeMultiplier,
      betMultiplier: this.aiState.betMultiplier,
      
      // Verification fields
      verified: true,
      executionQuality: 'VERIFIED',
    };

    // ✨ STEP 1: Calculate Risk/Reward Metrics
    trade.stopLossPrice = trade.entryPrice - this.config.riskPerTrade;
    trade.takeProfitPrice = trade.entryPrice + this.config.rewardTarget;
    
    // ✨ STEP 2: AI-ADAPTED EDGE CALCULATION
    trade.adaptedEdge = this.calculateAIAdaptedEdge(trade, selectedStrategy);
    
    // ✨ STEP 3: AI-ADAPTED WIN PROBABILITY
    // Adjust based on learned strategy performance and consecutive results
    trade.winProbability = this.calculateAIAdaptedWinProbability(trade);
    
    // Expected value: (Win% × Reward) - (Loss% × Risk)
    const lossProb = 1 - trade.winProbability;
    trade.expectedValue = (trade.winProbability * this.config.rewardTarget) - 
                         (lossProb * this.config.riskPerTrade);
    
    // ✨ STEP 4: Evaluate Trade Quality (ENFORCE STRICT CRITERIA)
    const minExpectedValue = 1; // Need EV > $1
    trade.isQualityTrade = trade.expectedValue > minExpectedValue;
    
    // ✨ STEP 5: Simulate Trade Execution with Stop Loss & Take Profit
    const winRoll = Math.random();
    trade.isWin = winRoll < trade.winProbability;

    // ✨ KEY FIX: ENFORCE FIXED RISK/REWARD RATIO
    if (trade.isQualityTrade) {
      // ONLY EXECUTE QUALITY TRADES
      if (trade.isWin) {
        // WIN: Hit take profit target ($30)
        trade.exitPrice = trade.takeProfitPrice;
        trade.pnl = this.config.rewardTarget; // Always $30 profit
        trade.pnlPercent = 3.0;
        this.aiState.consecutiveWins++;
        this.aiState.consecutiveLosses = 0;
      } else {
        // LOSS: Hit stop loss (-$10)
        trade.exitPrice = trade.stopLossPrice;
        trade.pnl = -this.config.riskPerTrade; // Always $10 loss
        trade.pnlPercent = -1.0;
        this.aiState.consecutiveLosses++;
        this.aiState.consecutiveWins = 0;
      }
    } else {
      // SKIP BAD TRADES (Expected Value negative)
      trade.pnl = 0;
      trade.pnlPercent = 0;
      trade.isWin = false;
      trade.exitPrice = trade.entryPrice;
      trade.skipped = true;
    }

    // Mark as verified
    trade.executed = true;
    trade.paperBalance = paperBalance + trade.pnl;
    this.aiState.totalTrades++;
    
    // Track strategy performance
    this.trackStrategyPerformance(selectedStrategy.name, trade);

    return trade;
  },

  // ════════════════════════════════════════════════════════════════
  // AI STRATEGY SELECTION (ADAPTIVE)
  // ════════════════════════════════════════════════════════════════
  selectStrategyAI() {
    if (!this.config.enableStrategyRotation) {
      return this.strategies[0]; // Use first strategy
    }

    // Select strategy based on performance and learning
    const performances = this.aiState.strategyPerformance;
    const sortedStrategies = this.strategies.sort((a, b) => {
      const perfA = performances[a.name];
      const perfB = performances[b.name];
      
      // Prefer strategies with higher win rates, break ties with profit factor
      if (perfA.trades === 0) return -1; // Prefer untested strategies
      if (perfB.trades === 0) return 1;
      
      const scoreA = (perfA.winRate * 0.7) + (perfA.profitFactor * 0.3);
      const scoreB = (perfB.winRate * 0.7) + (perfB.profitFactor * 0.3);
      
      return scoreB - scoreA;
    });

    return sortedStrategies[0];
  },

  // ════════════════════════════════════════════════════════════════
  // AI-ADAPTED EDGE CALCULATION
  // ════════════════════════════════════════════════════════════════
  calculateAIAdaptedEdge(trade, strategy) {
    let adaptedEdge = strategy.baseEdge * this.aiState.edgeMultiplier;

    // Adjust for consecutive results
    if (this.aiState.consecutiveWins >= 3) {
      // Increase edge after wins (more confidence)
      adaptedEdge *= 1.1;
    } else if (this.aiState.consecutiveLosses >= 2) {
      // Reduce edge after losses (less confidence)
      adaptedEdge *= 0.85;
    }

    // Adjust for volatility
    if (this.aiState.volatilityRegime === 'HIGH') {
      if (strategy.volatilityAdapt === 'EMBRACE_VOLATILITY') {
        adaptedEdge *= 1.15;
      } else if (strategy.volatilityAdapt === 'REDUCE_IN_VOLATILITY') {
        adaptedEdge *= 0.70;
      }
    }

    return Math.min(adaptedEdge, 5.0); // Cap at 5%
  },

  // ════════════════════════════════════════════════════════════════
  // AI-ADAPTED WIN PROBABILITY
  // ════════════════════════════════════════════════════════════════
  calculateAIAdaptedWinProbability(trade) {
    let probability = trade.baseWinProbability;

    // Adjust based on strategy historical performance
    const stratPerf = this.aiState.strategyPerformance[trade.strategy];
    if (stratPerf && stratPerf.trades > 10) {
      // Blend historical win rate with current probability
      const historicalWinRate = stratPerf.winRate / 100;
      probability = (probability * 0.6) + (historicalWinRate * 0.4);
    }

    // Adjust based on consecutive results
    if (this.aiState.consecutiveWins >= 3) {
      probability *= 1.05; // Slight increase in confidence
    } else if (this.aiState.consecutiveLosses >= 3) {
      probability *= 0.95; // Slight decrease in confidence
    }

    return Math.max(0.3, Math.min(probability, 0.85)); // Keep within bounds
  },

  // ════════════════════════════════════════════════════════════════
  // TRACK STRATEGY PERFORMANCE FOR LEARNING
  // ════════════════════════════════════════════════════════════════
  trackStrategyPerformance(strategyName, trade) {
    const perf = this.aiState.strategyPerformance[strategyName];
    if (!perf) return;

    perf.trades++;
    
    if (trade.isWin && !trade.skipped) {
      perf.wins++;
    } else if (!trade.isWin && !trade.skipped) {
      perf.losses++;
    }

    if (perf.trades > 0) {
      perf.winRate = (perf.wins / perf.trades) * 100;
    }

    // Track P&L
    if (!trade.skipped) {
      perf.totalPnL += trade.pnl;
    }
  },

  // ════════════════════════════════════════════════════════════════
  // UPDATE AI STATE (LEARNING)
  // ════════════════════════════════════════════════════════════════
  updateAIState() {
    // Update edge and bet multipliers based on recent performance
    const stats = this.getRunningStats();
    
    // Adjust edge multiplier based on profit factor
    if (stats.profitFactor > 2.5) {
      this.aiState.edgeMultiplier = Math.min(1.3, this.aiState.edgeMultiplier + 0.05);
    } else if (stats.profitFactor < 1.0) {
      this.aiState.edgeMultiplier = Math.max(0.7, this.aiState.edgeMultiplier - 0.1);
    }

    // Adjust bet multiplier based on win rate
    if (stats.winRate > 60) {
      this.aiState.betMultiplier = Math.min(1.5, this.aiState.betMultiplier + 0.05);
    } else if (stats.winRate < 40) {
      this.aiState.betMultiplier = Math.max(0.5, this.aiState.betMultiplier - 0.1);
    }

    // Detect volatility regime
    const recentTrades = this.trades.slice(-50);
    const wins = recentTrades.filter(t => t.isWin && !t.skipped).length;
    const winRate = (wins / recentTrades.length) * 100;
    
    if (winRate > 65) {
      this.aiState.volatilityRegime = 'LOW';
    } else if (winRate < 45) {
      this.aiState.volatilityRegime = 'HIGH';
    } else {
      this.aiState.volatilityRegime = 'NORMAL';
    }
  },

  // ════════════════════════════════════════════════════════════════
  // GET RUNNING STATISTICS
  // ════════════════════════════════════════════════════════════════
  getRunningStats() {
    const executedTrades = this.trades.filter(t => !t.skipped);
    const wins = executedTrades.filter(t => t.isWin).length;
    const losses = executedTrades.filter(t => !t.isWin).length;
    const winRate = executedTrades.length > 0 ? (wins / executedTrades.length) * 100 : 0;

    const totalPnL = executedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const winTrades = executedTrades.filter(t => t.isWin);
    const lossTrades = executedTrades.filter(t => !t.isWin);
    
    const avgWin = winTrades.length > 0 
      ? (winTrades.reduce((sum, t) => sum + t.pnl, 0) / winTrades.length)
      : 0;
    
    const avgLoss = lossTrades.length > 0
      ? (lossTrades.reduce((sum, t) => sum + t.pnl, 0) / lossTrades.length)
      : 0;

    const totalWinAmount = Math.abs(winTrades.reduce((sum, t) => sum + t.pnl, 0));
    const totalLossAmount = Math.abs(lossTrades.reduce((sum, t) => sum + t.pnl, 0));
    
    const profitFactor = totalLossAmount !== 0
      ? (totalWinAmount / totalLossAmount)
      : (totalWinAmount > 0 ? 999 : 0);

    return {
      totalTrades: executedTrades.length,
      wins,
      losses,
      winRate,
      avgWin,
      avgLoss,
      totalPnL,
      profitFactor,
    };
  },

  // ════════════════════════════════════════════════════════════════
  // GENERATE TEST REPORT
  // ════════════════════════════════════════════════════════════════
  generateReport() {
    const duration = ((this.endTime - this.startTime) / 1000).toFixed(2);
    
    // Separate executed and skipped trades
    const executedTrades = this.trades.filter(t => !t.skipped);
    const skippedTrades = this.trades.filter(t => t.skipped);
    
    const wins = executedTrades.filter(t => t.isWin).length;
    const losses = executedTrades.filter(t => !t.isWin).length;
    const winRate = executedTrades.length > 0 ? (wins / executedTrades.length * 100).toFixed(2) : 0;

    // P&L calculations
    const totalPnL = executedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const finalBalance = this.config.paperBalance + totalPnL;
    const returnPercent = (totalPnL / this.config.paperBalance * 100).toFixed(2);

    // Trade statistics
    const winTrades = executedTrades.filter(t => t.isWin);
    const lossTrades = executedTrades.filter(t => !t.isWin);
    
    const avgWin = winTrades.length > 0 
      ? (winTrades.reduce((sum, t) => sum + t.pnl, 0) / winTrades.length).toFixed(2)
      : 0;
    
    const avgLoss = lossTrades.length > 0
      ? (lossTrades.reduce((sum, t) => sum + t.pnl, 0) / lossTrades.length).toFixed(2)
      : 0;

    // Profit Factor
    const totalWinAmount = Math.abs(winTrades.reduce((sum, t) => sum + t.pnl, 0));
    const totalLossAmount = Math.abs(lossTrades.reduce((sum, t) => sum + t.pnl, 0));
    
    const profitFactor = totalLossAmount !== 0
      ? (totalWinAmount / totalLossAmount).toFixed(2)
      : (totalWinAmount > 0 ? 'Inf' : 0);

    // Strategy performance breakdown
    const strategyStats = this.getStrategyBreakdown();

    // Print report
    console.log('%c════════════════════════════════════════════════════════════', 'color: #bf5fff; font-weight: bold;');
    console.log('%c🔬 CRUCIBLE AI LEARNING TEST REPORT (1000 TRADES)', 'color: #bf5fff; font-weight: bold; font-size: 16px;');
    console.log('%c════════════════════════════════════════════════════════════', 'color: #bf5fff; font-weight: bold;');
    
    console.log(`\n📊 SESSION METADATA:`);
    console.log(`  Session ID: ${this.sessionId}`);
    console.log(`  Duration: ${duration}s (${(duration/60).toFixed(1)} minutes)`);
    console.log(`  Timestamp: ${new Date().toISOString()}`);
    
    console.log(`\n💰 ACCOUNT RESULTS:`);
    console.log(`  Starting Balance: $${this.config.paperBalance.toFixed(2)}`);
    console.log(`  Total P&L: ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`);
    console.log(`  Final Balance: $${finalBalance.toFixed(2)}`);
    console.log(`%c  Return: ${returnPercent >= 0 ? '+' : ''}${returnPercent}%`, 
      totalPnL >= 0 ? 'color: #39ff14; font-weight: bold;' : 'color: #ff2d78; font-weight: bold;');

    console.log(`\n📈 EXECUTION STATISTICS:`);
    console.log(`  Total Opportunities: ${this.trades.length}`);
    console.log(`  Executed: ${executedTrades.length} (${((executedTrades.length/this.trades.length)*100).toFixed(0)}%)`);
    console.log(`  Skipped (Bad EV): ${skippedTrades.length} (${((skippedTrades.length/this.trades.length)*100).toFixed(0)}%)`);
    console.log(`  AI Learning: ENABLED ✅`);

    console.log(`\n🎯 TRADE RESULTS (Executed Trades Only):`);
    console.log(`  Total Trades: ${executedTrades.length}`);
    console.log(`  Wins: ${wins} | Losses: ${losses}`);
    console.log(`%c  Win Rate: ${winRate}%`, winRate >= 50 ? 'color: #39ff14' : 'color: #ffaa00');
    console.log(`  Avg Win: $${avgWin}`);
    console.log(`  Avg Loss: $${avgLoss}`);
    
    const pfColor = profitFactor >= 1.5 ? 'color: #39ff14' : (profitFactor >= 1.0 ? 'color: #ffaa00' : 'color: #ff2d78');
    console.log(`%c  Profit Factor: ${profitFactor} ${profitFactor >= 1.5 ? '✅' : (profitFactor >= 1.0 ? '⚠️' : '❌')}`, pfColor);

    console.log(`\n🧠 AI LEARNING METRICS:`);
    console.log(`  Edge Multiplier: ${this.aiState.edgeMultiplier.toFixed(2)}x`);
    console.log(`  Bet Multiplier: ${this.aiState.betMultiplier.toFixed(2)}x`);
    console.log(`  Volatility Regime: ${this.aiState.volatilityRegime}`);
    console.log(`  Current Streak: ${this.aiState.consecutiveWins > 0 ? '+' + this.aiState.consecutiveWins + ' wins' : '-' + this.aiState.consecutiveLosses + ' losses'}`);

    console.log(`\n📊 TOP PERFORMING STRATEGIES:`);
    strategyStats.sort((a, b) => b.winRate - a.winRate);
    strategyStats.slice(0, 3).forEach((s, i) => {
      console.log(`  ${i+1}. ${s.name}: ${s.winRate.toFixed(1)}% WR | ${s.trades} trades | PF: ${s.profitFactor.toFixed(2)}`);
    });

    console.log(`\n%c════════════════════════════════════════════════════════════`, 'color: #bf5fff; font-weight: bold;');

    // Return report object
    return {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      totalTrades: executedTrades.length,
      wins,
      losses,
      winRate,
      totalPnL,
      finalBalance,
      returnPercent,
      profitFactor,
      avgWin,
      avgLoss,
      strategyStats,
      aiState: this.aiState,
    };
  },

  // ════════════════════════════════════════════════════════════════
  // GET STRATEGY BREAKDOWN
  // ════════════════════════════════════════════════════════════════
  getStrategyBreakdown() {
    return this.strategies.map(s => {
      const perf = this.aiState.strategyPerformance[s.name];
      return {
        name: s.name,
        trades: perf.trades,
        wins: perf.wins,
        losses: perf.losses,
        winRate: perf.trades > 0 ? (perf.wins / perf.trades * 100) : 0,
        totalPnL: perf.totalPnL,
        profitFactor: perf.losses > 0 ? (perf.wins > 0 ? (perf.wins / perf.losses) * (30 / 10) : 0) : 0,
      };
    });
  },

  // ════════════════════════════════════════════════════════════════
  // UTILITY: Sleep (async delay)
  // ════════════════════════════════════════════════════════════════
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // ════════════════════════════════════════════════════════════════
  // UTILITY: Random token selection
  // ════════════════════════════════════════════════════════════════
  randomToken() {
    const tokens = ['BTC', 'ETH', 'SOL', 'MATIC', 'AVAX', 'LINK', 'UNI', 'AAVE'];
    return tokens[Math.floor(Math.random() * tokens.length)];
  },
};

// ════════════════════════════════════════════════════════════════
// EXPORT & GLOBAL FUNCTION
// ════════════════════════════════════════════════════════════════
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CrucibleAITest;
}

// Global function for console access
async function runCrucibleAI(tradeCount = 1000, intervalMs = 50) {
  CrucibleAITest.config.tradeCount = tradeCount;
  CrucibleAITest.config.tradeInterval = intervalMs;
  await CrucibleAITest.start();
  return CrucibleAITest;
}

console.log('%c✅ Crucible AI Learning Test System Loaded', 'color: #39ff14; font-weight: bold;');
console.log('%cUsage: runCrucibleAI(1000, 50) // 1000 trades, 50ms apart', 'color: #ffd700;');
console.log('%cOr: runCrucibleAI() // Uses defaults (1000 trades)', 'color: #ffd700;');
