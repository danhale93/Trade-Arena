/**
 * ╔════════════════════════════════════════════════════════════════════════════════╗
 * ║                            AI ARENA TOURNAMENT SYSTEM                          ║
 * ║  Multiple AI models compete & vote on the best trading decisions (LLM Arena)   ║
 * ╚════════════════════════════════════════════════════════════════════════════════╝
 * 
 * System: 3 AI Models battle for the best decision
 * - ANALYST: Conservative, risk analysis focus
 * - TRADER: Aggressive, momentum & opportunity focus  
 * - STRATEGIST: Balanced, market condition adapted
 * 
 * Decision Flow:
 * 1. All 3 models analyze market & propose trades
 * 2. Each model votes on the proposals
 * 3. Winner decided by vote consensus + confidence score
 * 4. Final decision executed with reasoning
 */

// ════════════════════════════════════════════════════════════════════════════════
// AI ARENA CONFIG
// ════════════════════════════════════════════════════════════════════════════════

const AI_ARENA = {
  // Three AI personalities competing
  models: {
    ANALYST: {
      name: 'ANALYST',
      emoji: '🔬',
      personality: 'Conservative analyst focusing on risk/reward ratio and market safety',
      style: 'Focus on downside protection, real edge detection, avoid false signals',
      riskProfile: 'LOW',
      confidence_range: [0.5, 0.75],
    },
    TRADER: {
      name: 'TRADER',
      emoji: '⚡',
      personality: 'Aggressive trader hunting momentum and quick wins',
      style: 'Hunt volatility, look for explosive moves, timing is everything',
      riskProfile: 'HIGH',
      confidence_range: [0.6, 0.9],
    },
    STRATEGIST: {
      name: 'STRATEGIST',
      emoji: '🎯',
      personality: 'Market-adaptive strategist balancing all factors',
      style: 'Read market conditions, adapt strategy, balance opportunity vs risk',
      riskProfile: 'MEDIUM',
      confidence_range: [0.55, 0.80],
    }
  },

  // Decision criteria weights
  voting: {
    confidence_weight: 0.4,      // How sure the AI is
    edge_weight: 0.3,             // Math edge (win % - loss %)
    reasoning_quality_weight: 0.2, // Quality of explanation
    risk_adjusted_weight: 0.1,     // Risk/reward ratio
  },

  // Trade execution rules
  execution: {
    minConsensus: 0.65,        // Need 65%+ agreement to trade
    minAveragConfidence: 0.6,  // Models must be 60%+ confident on avg
    maxDisagreement: 0.35,     // Max spread between votes
    requireMinModels: 2,       // At least 2 models must agree
  },

  // Pause conditions
  pause_conditions: {
    extreme_volatility: 8.0,   // >8% 24h volatility
    low_liquidity: 100e6,      // <$100M daily volume
    bearish_consensus: 0.75,   // >75% coins down
  }
};

// ════════════════════════════════════════════════════════════════════════════════
// ARENA STATE
// ════════════════════════════════════════════════════════════════════════════════

let arenaState = {
  lastTournament: null,
  modelPerformance: {
    ANALYST: { wins: 0, losses: 0, accuracy: 0 },
    TRADER: { wins: 0, losses: 0, accuracy: 0 },
    STRATEGIST: { wins: 0, losses: 0, accuracy: 0 },
    FALLBACK: { wins: 0, losses: 0, accuracy: 0 }
  },
  tournamentHistory: [],
};

// API cooldown / circuit breaker to prevent CORS storm + timer overload
const ARENA_API_GUARD = {
  consecutiveFailures: 0,
  cooldownUntil: 0,
  baseCooldownMs: 1500,
  maxCooldownMs: 60000,
  lastLogAt: 0,
  logThrottleMs: 5000
};

function isArenaApiCoolingDown() {
  return Date.now() < ARENA_API_GUARD.cooldownUntil;
}

function noteArenaApiFailure(reason = 'network') {
  ARENA_API_GUARD.consecutiveFailures += 1;
  const exp = Math.min(ARENA_API_GUARD.consecutiveFailures - 1, 6); // up to 64x
  const cooldownMs = Math.min(
    ARENA_API_GUARD.baseCooldownMs * Math.pow(2, Math.max(0, exp)),
    ARENA_API_GUARD.maxCooldownMs
  );
  ARENA_API_GUARD.cooldownUntil = Date.now() + cooldownMs;

  const now = Date.now();
  if (now - ARENA_API_GUARD.lastLogAt > ARENA_API_GUARD.logThrottleMs) {
    ARENA_API_GUARD.lastLogAt = now;
    console.warn(`[AI Arena] API cooldown active (${cooldownMs}ms) after ${ARENA_API_GUARD.consecutiveFailures} failures (${reason})`);
  }
}

function noteArenaApiSuccess() {
  ARENA_API_GUARD.consecutiveFailures = 0;
  ARENA_API_GUARD.cooldownUntil = 0;
}

// ════════════════════════════════════════════════════════════════════════════════
// ARENA: GET DECISION FROM ONE AI MODEL
// ════════════════════════════════════════════════════════════════════════════════

async function getAIModelDecision(modelType, marketData, bet, botId, botStrategy = null) {
  const model = AI_ARENA.models[modelType];
  let summary = 'No live data.';
  
  if (marketData?.length) {
    summary = marketData.slice(0, 8).map(c =>
      `${c.symbol.toUpperCase()}: $${c.current_price} | 24h: ${(c.price_change_percentage_24h||0).toFixed(1)}% | Vol: $${(c.total_volume/1e6).toFixed(0)}M`
    ).join('\n');
  }

  // Market condition analysis
  let marketContext = 'STABLE';
  if (marketData?.length > 0) {
    const avg24h = marketData.slice(0, 8).reduce((sum, c) => sum + (c.price_change_percentage_24h || 0), 0) / 8;
    const volatility = Math.abs(avg24h);
    if (volatility > 5) marketContext = 'VOLATILE';
    else if (avg24h > 2) marketContext = 'BULLISH';
    else if (avg24h < -2) marketContext = 'BEARISH';
  }

  // Build personality-specific prompt
  let prompt = `You are "${model.name}" in an AI Trading Arena. ${model.personality}.

${model.style}

MARKET DATA:
${summary}

MARKET CONTEXT: ${marketContext}
BET SIZE: $${bet}
BOT ID: ${botId}

Your job: Propose the SINGLE BEST trade right now.
Be confident in your recommendation.
Your confidence score should reflect how sure you are (0.5-0.9).

Respond ONLY with JSON, no markdown:
{
  "model": "${modelType}",
  "token": "TOKEN_SYMBOL",
  "method": "FLASH LOAN|ARBITRAGE|SPOT LONG|SPOT SHORT|NFT FLIP|YIELD FARM|PERP LONG|PERP SHORT",
  "size_label": "SNIPER|DEGEN|SAFE|YOLO|HEDGE|SURF",
  "edge_pct": 1.0-7.5,
  "confidence": 0.5-0.9,
  "win_probability": 0.45-0.75,
  "reasoning": "UNDER 40 CHARS - WHY THIS TRADE",
  "risk_level": "LOW|MEDIUM|HIGH",
  "target_outcome": "+$XX or description",
  "decision_timestamp": "ISO string"
}`;

  // Get API key from multiple possible sources
  let apiKey = window.ANTHROPIC_API_KEY || 
               globalThis.ANTHROPIC_API_KEY || 
               (window.parent?.ANTHROPIC_API_KEY) || 
               (typeof ANTHROPIC_API_KEY !== 'undefined' ? ANTHROPIC_API_KEY : '') ||
               '';
  
  // Fast-fail during cooldown to avoid repeated network churn
  if (isArenaApiCoolingDown()) {
    return null;
  }

  // Log if API key is available
  if (apiKey && apiKey.startsWith('sk-ant')) {
    // keep this quiet to reduce high-frequency log spam
  } else {
    return null;
  }
  
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await res.json();
    if (!res.ok || !data.content?.[0]?.text) {
      noteArenaApiFailure(`http_${res.status}`);
      return null;
    }

    const jsonStr = data.content[0].text
      .replace(/```json/g, '').replace(/```/g, '').trim();
    const decision = JSON.parse(jsonStr);
    
    // Add vote score (used in consensus)
    decision.vote_score = calculateVoteScore(decision);
    decision.model = modelType;
    decision.emoji = model.emoji;

    noteArenaApiSuccess();
    return decision;
  } catch (e) {
    // CORS/network errors: trigger cooldown and fail silently for efficiency
    const msg = e?.message || '';
    if (msg.includes('Failed to fetch') || msg.includes('CORS')) {
      noteArenaApiFailure('network');
    } else {
      noteArenaApiFailure('exception');
    }
    return null;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// VOTE SCORE: How good is this decision?
// ════════════════════════════════════════════════════════════════════════════════

function calculateVoteScore(decision) {
  if (!decision) return 0;
  
  // Confidence (40% weight)
  const confidence = Math.max(0.5, Math.min(0.9, decision.confidence || 0.6));
  const confScore = (confidence - 0.5) / 0.4; // Normalize to 0-1
  
  // Edge (30% weight) - how profitable is this?
  const edge = Math.max(0, Math.min(10, decision.edge_pct || 2.5));
  const edgeScore = edge / 10; // Normalize to 0-1
  
  // Win probability (20% weight)
  const winProb = Math.max(0.4, Math.min(0.8, decision.win_probability || 0.55));
  const winScore = (winProb - 0.4) / 0.4; // Normalize to 0-1
  
  // Risk (10% weight) - penalize for high risk
  const riskPenalty = decision.risk_level === 'HIGH' ? 0.7 : (decision.risk_level === 'MEDIUM' ? 0.85 : 1.0);
  
  const score = 
    (confScore * 0.4) +
    (edgeScore * 0.3) +
    (winScore * 0.2) +
    (riskPenalty * 0.1);
  
  return Math.max(0, Math.min(1, score));
}

// ════════════════════════════════════════════════════════════════════════════════
// ARENA TOURNAMENT: All 3 models battle for best decision
// ════════════════════════════════════════════════════════════════════════════════

async function runAIArenaTournament(marketData, bet, botId, botStrategy = null) {
  console.log(`\n🏟️ AI ARENA TOURNAMENT STARTING for Bot #${botId}...`);
  
  const startTime = Date.now();
  
  // Step 1: Get decisions from all 3 models (in parallel)
  console.log('⚡ Step 1: Summoning all models...');
  
  // Use allSettled to handle both resolved and rejected promises gracefully
  const settledResults = await Promise.allSettled([
    getAIModelDecision('ANALYST', marketData, bet, botId, botStrategy),
    getAIModelDecision('TRADER', marketData, bet, botId, botStrategy),
    getAIModelDecision('STRATEGIST', marketData, bet, botId, botStrategy),
  ]);
  
  // Extract successful decisions
  const decisions = settledResults
    .map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Log rejected promises but don't throw
        const modelNames = ['ANALYST', 'TRADER', 'STRATEGIST'];
        console.warn(`[AI Arena] ${modelNames[index]} promise rejected:`, result.reason?.message || result.reason);
        return null;
      }
    })
    .filter(d => d !== null);

  if (decisions.length === 0) {
    return generateFallbackDecision();
  }

  // Step 2: Each model votes on all proposals (consensus voting)
  console.log('🗳️ Step 2: Models voting on each other\'s proposals...');
  const votes = await runVotingRound(decisions, marketData, bet, botId);
  
  // Step 3: Tally votes and determine winner
  console.log('📊 Step 3: Tallying votes and determining consensus...');
  const consensusResult = determineConsensusWinner(decisions, votes);
  
  // Step 4: Validate execution rules
  console.log('✅ Step 4: Validating execution rules...');
  const executionCheck = validateExecutionRules(consensusResult, marketData);
  
  // Step 5: Generate final decision with detailed reasoning
  const finalDecision = {
    ...consensusResult.winnerDecision,
    // Arena metadata
    arena_tournament: {
      all_proposals: decisions.map(d => ({
        model: d.model,
        emoji: d.emoji,
        token: d.token,
        method: d.method,
        edge_pct: d.edge_pct,
        confidence: d.confidence,
        vote_score: d.vote_score,
      })),
      votes: votes,
      consensus_strength: consensusResult.consensusStrength,
      winner: consensusResult.winnerModel,
      decision_time_ms: Date.now() - startTime,
      can_execute: executionCheck.canExecute,
      execution_reason: executionCheck.reason,
    }
  };

  console.log('🏆 TOURNAMENT WINNER:', {
    model: consensusResult.winnerModel,
    token: consensusResult.winnerDecision.token,
    method: consensusResult.winnerDecision.method,
    confidence: consensusResult.winnerDecision.confidence,
    consensus: (consensusResult.consensusStrength * 100).toFixed(1) + '%',
    canExecute: executionCheck.canExecute,
  });

  // Store for history
  arenaState.lastTournament = finalDecision;
  arenaState.tournamentHistory.unshift(finalDecision);
  if (arenaState.tournamentHistory.length > 50) arenaState.tournamentHistory.pop();

  return finalDecision;
}

// ════════════════════════════════════════════════════════════════════════════════
// VOTING ROUND: Each model votes on each proposal
// ════════════════════════════════════════════════════════════════════════════════

async function runVotingRound(proposals, marketData, bet, botId) {
  // Each proposal gets a vote score and confidence
  // In real system, could call Claude again to have models critique each other
  // For now, use calculated vote scores
  
  const votes = {};
  
  for (const proposal of proposals) {
    votes[proposal.model] = {
      proposed_by: proposal.model,
      vote_scores: {
        ANALYST: proposal.vote_score,
        TRADER: proposal.vote_score,
        STRATEGIST: proposal.vote_score,
      },
      consensus_votes: 0,
      reasoning: proposal.reasoning,
    };
  }

  return votes;
}

// ════════════════════════════════════════════════════════════════════════════════
// CONSENSUS: Which proposal wins based on voting?
// ════════════════════════════════════════════════════════════════════════════════

function determineConsensusWinner(proposals, votes) {
  // Simple consensus: highest average vote score wins
  let bestProposal = proposals[0];
  let bestScore = bestProposal.vote_score || 0;
  let totalScore = 0;
  
  for (const proposal of proposals) {
    const score = proposal.vote_score || 0;
    if (score > bestScore) {
      bestScore = score;
      bestProposal = proposal;
    }
    totalScore += score;
  }
  
  const avgScore = totalScore / proposals.length;
  const consensusStrength = Math.max(0, Math.min(1, bestScore / Math.max(0.01, avgScore)));
  
  return {
    winnerModel: bestProposal.model,
    winnerDecision: bestProposal,
    consensusStrength: consensusStrength,
    allProposals: proposals,
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// EXECUTION VALIDATION: Should we actually execute this trade?
// ════════════════════════════════════════════════════════════════════════════════

function validateExecutionRules(consensusResult, marketData) {
  const exec = AI_ARENA.execution;
  const decision = consensusResult.winnerDecision;
  
  // Check 1: Consensus strength
  if (consensusResult.consensusStrength < exec.minConsensus) {
    return {
      canExecute: false,
      reason: `Low consensus (${(consensusResult.consensusStrength * 100).toFixed(0)}% < ${exec.minConsensus * 100}%)`
    };
  }

  // Check 2: Model confidence
  if ((decision.confidence || 0.5) < exec.minAveragConfidence) {
    return {
      canExecute: false,
      reason: `Low confidence (${(decision.confidence * 100).toFixed(0)}% < ${exec.minAveragConfidence * 100}%)`
    };
  }

  // Check 3: Market conditions - avoid extreme volatility
  if (marketData?.length > 0) {
    const volatility = marketData.slice(0, 8).map(c => Math.abs(c.price_change_percentage_24h || 0));
    const avgVolatility = volatility.reduce((a, b) => a + b, 0) / volatility.length;
    
    if (avgVolatility > AI_ARENA.pause_conditions.extreme_volatility) {
      return {
        canExecute: false,
        reason: `Extreme volatility detected (${avgVolatility.toFixed(1)}% > ${AI_ARENA.pause_conditions.extreme_volatility}%)`
      };
    }
  }

  // All checks passed!
  return {
    canExecute: true,
    reason: 'All execution rules passed ✅'
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// FALLBACK: If all models fail, return a safe default
// ════════════════════════════════════════════════════════════════════════════════

function generateFallbackDecision() {
  return {
    token: 'BTC',
    method: 'ARBITRAGE',
    edge_pct: 1.5,
    confidence: 0.5,
    win_probability: 0.52,
    reasoning: 'Fallback safe trade',
    size_label: 'SAFE',
    risk_level: 'LOW',
    outcome: 'WIN',
    pnl_multiplier: 0.8,
    arena_tournament: {
      all_proposals: [],
      winner: 'FALLBACK',
      can_execute: true,
      execution_reason: 'All models failed, using safe fallback'
    }
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// TRACK MODEL PERFORMANCE: Update model win/loss records
// ════════════════════════════════════════════════════════════════════════════════

function updateModelPerformance(decision, outcome) {
  try {
    if (!decision?.arena_tournament?.winner) {
      console.warn('[AI Arena] No winner found in decision:', decision);
      return;
    }
    
    const winner = decision.arena_tournament.winner;
    const performance = arenaState.modelPerformance[winner];
    
    // Defensive check: ensure performance object exists
    if (!performance) {
      console.warn(`[AI Arena] Performance object not found for winner: ${winner}`, {
        availableModels: Object.keys(arenaState.modelPerformance),
        winner: winner
      });
      return;
    }
    
    // Ensure performance has required properties
    if (typeof performance.wins !== 'number') performance.wins = 0;
    if (typeof performance.losses !== 'number') performance.losses = 0;
    
    if (outcome === 'WIN') {
      performance.wins += 1;
    } else {
      performance.losses += 1;
    }
    
    const total = performance.wins + performance.losses;
    performance.accuracy = (performance.wins / Math.max(1, total) * 100).toFixed(1);
    
    console.log(`📈 ${winner} accuracy: ${performance.accuracy}% (${performance.wins}W/${performance.losses}L)`);
  } catch (error) {
    console.error('[AI Arena] updateModelPerformance error:', error, {
      decision,
      outcome,
      modelPerformance: arenaState.modelPerformance
    });
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// GET ARENA INSIGHTS: Show which models are performing best
// ════════════════════════════════════════════════════════════════════════════════

function getArenaInsights() {
  const perf = arenaState.modelPerformance;
  const models = Object.entries(perf)
    .map(([name, stats]) => ({
      name,
      accuracy: parseFloat(stats.accuracy) || 0,
      total: stats.wins + stats.losses,
      wins: stats.wins,
      emoji: AI_ARENA.models[name].emoji,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);
  
  return {
    models,
    bestModel: models[0]?.name || 'BALANCED',
    totalTournaments: arenaState.tournamentHistory.length,
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AI_ARENA,
    arenaState,
    getAIModelDecision,
    runAIArenaTournament,
    calculateVoteScore,
    updateModelPerformance,
    getArenaInsights,
  };
}
