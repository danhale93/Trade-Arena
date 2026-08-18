/**
 * ELO TOURNAMENT ENGINE
 * Trade Arena v4 • Recursive Self-Improvement Framework
 *
 * Each of the 5 agents (Momentum, Volatility, Politician, Sentiment, Risk)
 * competes in a continuous ELO-based tournament.
 *
 * Recursive Improvement:
 * - High ELO agents become "Lead" agents for the next generation.
 * - Low ELO agents receive performance improvement plans (PIPs).
 * - Agent weights are derived directly from ELO ratings.
 */

const ELO_CONFIG = {
    initialRating: 1200,
    kFactor: 32, // How much a rating can change per match
    minRating: 800,
    maxRating: 2400,
};

/**
 * Agent ELO State
 */
let eloState = {
    generation: 0,
    agents: {
        mom:  { rating: 1200, matches: 0, wins: 0, losses: 0, icon: '🔥' },
        vol:  { rating: 1200, matches: 0, wins: 0, losses: 0, icon: '🌀' },
        pol:  { rating: 1200, matches: 0, wins: 0, losses: 0, icon: '🏛️' },
        sen:  { rating: 1200, matches: 0, wins: 0, losses: 0, icon: '📊' },
        risk: { rating: 1200, matches: 0, wins: 0, losses: 0, icon: '🛡️' },
    },
    history: []
};

/**
 * Record a match result between an agent and the "Market"
 * @param {string} agentKey
 * @param {boolean} isWin
 */
function recordEloMatch(agentKey, isWin) {
    const agent = eloState.agents[agentKey];
    if (!agent) return;

    // The "Market" is treated as an opponent with a rating relative to recent performance
    // If the fleet is winning, the Market rating increases (harder to beat)
    const marketRating = calculateMarketOpponentRating();

    const expectedScore = 1 / (1 + Math.pow(10, (marketRating - agent.rating) / 400));
    const actualScore = isWin ? 1 : 0;

    const ratingChange = Math.round(ELO_CONFIG.kFactor * (actualScore - expectedScore));
    agent.rating = Math.max(ELO_CONFIG.minRating, Math.min(ELO_CONFIG.maxRating, agent.rating + ratingChange));

    agent.matches++;
    if (isWin) agent.wins++; else agent.losses++;

    // Check for evolution
    checkForEvolution();

    // Save state
    saveEloState();
    return ratingChange;
}

/**
 * Recursive Self-Improvement: Check if fleet has reached evolution threshold
 */
// ⚡ Bolt Optimization: Replace Object.values/Object.keys .reduce operations with single-pass manual for...in loops
// to accumulate match totals and average ELO ratings, eliminating array allocations and callback overhead on every ELO check.
function checkForEvolution() {
    let totalMatches = 0;
    for (const key in eloState.agents) {
        totalMatches += eloState.agents[key].matches;
    }

    if (totalMatches > 0 && totalMatches % 50 === 0) {
        eloState.generation++;
        const leader = getLeaderAgent();
        console.log(`[ELO] EVOLUTION REACHED: Generation ${eloState.generation}. Leader: ${leader.toUpperCase()}`);

        let totalElo = 0;
        let count = 0;
        for (const key in eloState.agents) {
            totalElo += eloState.agents[key].rating;
            count++;
        }

        // Push to history
        eloState.history.push({
            gen: eloState.generation,
            leader: leader,
            avgElo: count > 0 ? totalElo / count : 0,
            timestamp: Date.now()
        });

        if (typeof SFX !== 'undefined') SFX.bigWin();
        return true;
    }
    return false;
}

/**
 * Identify the current "Lead" agent (highest ELO)
 */
// ⚡ Bolt Optimization: Replace Object.keys().reduce with a manual single-pass loop to determine the leader agent
// without temporary array allocations or reducer callbacks.
function getLeaderAgent() {
    let leader = null;
    let maxRating = -Infinity;
    for (const key in eloState.agents) {
        const rating = eloState.agents[key].rating;
        if (rating > maxRating) {
            maxRating = rating;
            leader = key;
        }
    }
    return leader || 'mom';
}

/**
 * Derive Agent Weight from ELO
 * Replaces the old Bayesian weight system
 */
function getWeightFromElo(agentKey) {
    const agent = eloState.agents[agentKey];
    if (!agent) return 1.0;

    // Scale 800-2400 ELO to 0.2 - 2.5 weight
    return 0.2 + ((agent.rating - 800) / 1600) * 2.3;
}

/**
 * Market Rating adjusts based on total fleet performance
 */
function calculateMarketOpponentRating() {
    // Default market difficulty
    let base = 1200;

    // If we have closed trades, adjust base by fleet win rate
    // ⚡ Bolt Optimization: Use a non-allocating single-pass backwards loop on window.closedTrades
    // to calculate the win rate of the last 20 elements, eliminating slice and filter garbage collection overhead.
    if (typeof window !== 'undefined' && window.closedTrades && window.closedTrades.length > 0) {
        const len = window.closedTrades.length;
        const count = Math.min(len, 20);
        let wins = 0;
        const start = len - 1;
        const end = len - count;
        for (let i = start; i >= end; i--) {
            if (window.closedTrades[i].isWin) {
                wins++;
            }
        }
        const wr = wins / count;
        // High win rate = harder market
        base += (wr - 0.5) * 400;
    }

    return base;
}

function saveEloState() {
    try {
        localStorage.setItem('ta_elo_v4', JSON.stringify(eloState));
    } catch(e) {}
}

function loadEloState() {
    try {
        const raw = localStorage.getItem('ta_elo_v4');
        if (raw) {
            const parsed = JSON.parse(raw);
            eloState = parsed;
        }
    } catch(e) {}
}

/**
 * UI: Render ELO Arena
 */
function renderEloArena() {
    const body = document.getElementById('eloBody');
    if (body && !body.classList.contains('open')) return;

    const container = document.getElementById('eloArenaRows');
    if (!container) return;

    const sorted = Object.entries(eloState.agents).sort((a, b) => b[1].rating - a[1].rating);

    container.innerHTML = sorted.map(([key, data]) => {
        const wr = data.matches > 0 ? (data.wins / data.matches * 100).toFixed(1) : 0;
        const rank = data.rating > 1800 ? 'GRANDMASTER' : data.rating > 1500 ? 'ELITE' : data.rating > 1200 ? 'PRO' : 'NOVICE';
        const rankColor = data.rating > 1800 ? 'var(--purple)' : data.rating > 1500 ? 'var(--cyan)' : data.rating > 1200 ? 'var(--green)' : 'var(--dim)';

        return `
            <div class="elo-row" style="display:flex; align-items:center; gap:10px; padding:8px; border-bottom:1px solid var(--border)">
                <div style="font-size:18px">${data.icon}</div>
                <div style="flex:1">
                    <div style="font-family:'Bungee'; font-size:10px">${key.toUpperCase()} <span style="color:${rankColor}; font-size:8px">[${rank}]</span></div>
                    <div style="font-size:8px; color:var(--dim)">WR: ${wr}% | Matches: ${data.matches}</div>
                </div>
                <div style="text-align:right">
                    <div style="font-family:'Oswald'; font-size:16px; color:var(--gold)">${data.rating}</div>
                    <div style="font-size:7px; color:var(--dim)">ELO RATING</div>
                </div>
            </div>
        `;
    }).join('');
}

// Global Exports
if (typeof window !== 'undefined') {
    window.recordEloMatch = recordEloMatch;
    window.getWeightFromElo = getWeightFromElo;
    window.renderEloArena = renderEloArena;
    window.loadEloState = loadEloState;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        recordEloMatch,
        getWeightFromElo,
        renderEloArena,
        loadEloState,
        checkForEvolution,
        getLeaderAgent,
        eloState
    };
}

// Initial Load
loadEloState();
