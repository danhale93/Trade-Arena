/**
 * TRADE OLYMPICS ELO TOURNAMENT SYSTEM
 * Chess-style model ratings for live trades and simulated tournaments.
 */

const DEFAULT_OLYMPICS_MODELS = [
  { name: "ANALYST", provider: "local", elo: 1200, style: "risk" },
  { name: "TRADER", provider: "local", elo: 1200, style: "momentum" },
  { name: "STRATEGIST", provider: "local", elo: 1200, style: "balanced" },
  { name: "SCALPER", provider: "local", elo: 1180, style: "speed" },
  { name: "HEDGER", provider: "local", elo: 1180, style: "defensive" },
  { name: "ARBITRAGEUR", provider: "local", elo: 1220, style: "arb" },
];

const TRADE_OLYMPICS = {
  METHODS: [
    "ARBITRAGE",
    "FLASH LOAN",
    "SPOT LONG",
    "SPOT SHORT",
    "PERP LONG",
    "PERP SHORT",
    "NFT FLIP",
    "YIELD FARM",
  ],
  TOKENS: [
    "BTC",
    "ETH",
    "SOL",
    "AVAX",
    "MATIC",
    "LINK",
    "UNI",
    "AAVE",
    "CRV",
    "ARB",
    "OP",
    "BLUR",
  ],
  EDGE_TIERS: [
    { name: "MICRO", min: 0.1, max: 0.5, label: "0.1-0.5%" },
    { name: "SMALL", min: 0.5, max: 1.5, label: "0.5-1.5%" },
    { name: "MEDIUM", min: 1.5, max: 3.5, label: "1.5-3.5%" },
    { name: "LARGE", min: 3.5, max: 6.5, label: "3.5-6.5%" },
    { name: "MEGA", min: 6.5, max: 10.0, label: "6.5-10%" },
  ],

  K_FACTOR: 24,
  STORAGE_KEY: "ta_trade_olympics_v2",
  BRACKETS: {},
  COMPETITION_LOG: {},
  MATCH_LOG: [],
  TOURNAMENTS: [],
  STANDINGS: {},
  initialized: false,

  initialize(options = {}) {
    const {
      reset = false,
      models = null,
      persist = true,
      silent = false,
    } = options;
    if (this.initialized && !reset) return this.getSummary();

    this.BRACKETS = {};
    this.COMPETITION_LOG = {};
    this.MATCH_LOG = [];
    this.TOURNAMENTS = [];
    this.STANDINGS = {};

    const modelList = this._collectModels(models);
    modelList.forEach((model) => this._ensureStanding(model.name, model));

    let modelIndex = 0;
    for (const method of this.METHODS) {
      for (const token of this.TOKENS) {
        for (const edgeTier of this.EDGE_TIERS) {
          const assignedModel = modelList[modelIndex % modelList.length];
          const bracket = this._bracketKey(method, token, edgeTier.name);
          this.BRACKETS[bracket] = {
            method,
            token,
            edgeTier,
            assignedModel: assignedModel.name,
            trades: 0,
            wins: 0,
            losses: 0,
            totalPnL: 0,
            winRate: 0,
            avgEdge: 0,
            avgPnL: 0,
          };
          this.STANDINGS[assignedModel.name].bracketsAssigned.push(bracket);
          modelIndex += 1;
        }
      }
    }

    if (!reset) this._loadPersisted();
    this.initialized = true;
    if (persist) this.persist();
    if (!silent)
      console.log(
        `[Trade Olympics] ELO initialized: ${modelList.length} models, ${Object.keys(this.BRACKETS).length} brackets`,
      );
    return this.getSummary();
  },

  reset(options = {}) {
    this.initialized = false;
    if (this._hasStorage()) localStorage.removeItem(this.STORAGE_KEY);
    return this.initialize({ ...options, reset: true });
  },

  getModelForTrade(method, token, edgePercent = 1) {
    this._ensureInitialized();
    const normalizedMethod = this._normalizeMethod(method);
    const normalizedToken = this._normalizeToken(token);
    const edgeTier = this._getEdgeTier(edgePercent).name;
    const bracket = this._bracketKey(
      normalizedMethod,
      normalizedToken,
      edgeTier,
    );
    const bracketInfo = this.BRACKETS[bracket];

    if (!bracketInfo) {
      const fallback =
        this.getEloLeaderboard()[0]?.model || DEFAULT_OLYMPICS_MODELS[0].name;
      return {
        model: fallback,
        method: normalizedMethod,
        token: normalizedToken,
        edgeTier,
        bracket,
        isOlympics: false,
      };
    }

    return {
      model: bracketInfo.assignedModel,
      method: normalizedMethod,
      token: normalizedToken,
      edgeTier,
      bracket,
      isOlympics: true,
      bracketInfo,
    };
  },

  recordTrade(bracket, result = {}) {
    this._ensureInitialized();
    const bracketInfo = this.BRACKETS[bracket];
    if (!bracketInfo) return null;

    const modelName = result.model || bracketInfo.assignedModel;
    const pnl = Number(result.pnl || 0);
    const edge = Number(result.edge || 0);
    const isWin = result.outcome ? result.outcome === "WIN" : pnl > 0;

    bracketInfo.trades += 1;
    bracketInfo.wins += isWin ? 1 : 0;
    bracketInfo.losses += isWin ? 0 : 1;
    bracketInfo.totalPnL += pnl;
    bracketInfo.winRate = bracketInfo.trades
      ? bracketInfo.wins / bracketInfo.trades
      : 0;
    bracketInfo.avgEdge = this._rollingAverage(
      bracketInfo.avgEdge,
      edge,
      bracketInfo.trades,
    );
    bracketInfo.avgPnL = bracketInfo.totalPnL / bracketInfo.trades;

    const standing = this._ensureStanding(modelName);
    standing.totalTrades += 1;
    standing.totalWins += isWin ? 1 : 0;
    standing.totalLosses += isWin ? 0 : 1;
    standing.totalPnL += pnl;
    standing.overallWinRate = standing.totalTrades
      ? standing.totalWins / standing.totalTrades
      : 0;
    standing.avgTradeValue = standing.totalTrades
      ? standing.totalPnL / standing.totalTrades
      : 0;

    const entry = {
      timestamp: new Date().toISOString(),
      bracket,
      outcome: isWin ? "WIN" : "LOSS",
      pnl,
      edge,
      model: modelName,
      token: bracketInfo.token,
      method: bracketInfo.method,
    };
    if (!this.COMPETITION_LOG[bracket]) this.COMPETITION_LOG[bracket] = [];
    this.COMPETITION_LOG[bracket].push(entry);

    if (result.opponentModel) {
      this.recordMatch({
        modelA: modelName,
        modelB: result.opponentModel,
        scoreA: isWin ? 1 : 0,
        pnlA: pnl,
        pnlB: Number(result.opponentPnl || -pnl),
        context: {
          bracket,
          method: bracketInfo.method,
          token: bracketInfo.token,
          edge,
        },
      });
    }

    this.persist();
    this.renderEloPanel();
    return entry;
  },

  recordMatch(match = {}) {
    this._ensureInitialized();
    const modelA = match.modelA;
    const modelB = match.modelB;
    if (!modelA || !modelB || modelA === modelB) return null;

    const a = this._ensureStanding(modelA);
    const b = this._ensureStanding(modelB);
    const scoreA = this._normalizeScore(match.scoreA);
    const scoreB = 1 - scoreA;
    const oldA = a.elo;
    const oldB = b.elo;
    const expectedA = this.expectedScore(oldA, oldB);
    const expectedB = 1 - expectedA;
    const k =
      Number(match.kFactor || this.K_FACTOR) *
      this._marginMultiplier(match.pnlA, match.pnlB);

    a.elo = Math.round(oldA + k * (scoreA - expectedA));
    b.elo = Math.round(oldB + k * (scoreB - expectedB));
    a.eloPeak = Math.max(a.eloPeak || oldA, a.elo);
    b.eloPeak = Math.max(b.eloPeak || oldB, b.elo);
    a.eloLow = Math.min(a.eloLow || oldA, a.elo);
    b.eloLow = Math.min(b.eloLow || oldB, b.elo);
    a.headToHead[modelB] = (a.headToHead[modelB] || 0) + scoreA;
    b.headToHead[modelA] = (b.headToHead[modelA] || 0) + scoreB;

    const entry = {
      id: `match-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      modelA,
      modelB,
      scoreA,
      scoreB,
      oldEloA: oldA,
      oldEloB: oldB,
      newEloA: a.elo,
      newEloB: b.elo,
      deltaA: a.elo - oldA,
      deltaB: b.elo - oldB,
      pnlA: Number(match.pnlA || 0),
      pnlB: Number(match.pnlB || 0),
      context: match.context || {},
    };

    this.MATCH_LOG.unshift(entry);
    if (this.MATCH_LOG.length > 500) this.MATCH_LOG.pop();
    this.persist();
    this.renderEloPanel();
    return entry;
  },

  runEloTournament(config = {}) {
    this._ensureInitialized();
    const rounds = Math.max(1, Number(config.rounds || 1));
    const models = (config.models || Object.keys(this.STANDINGS)).filter(
      Boolean,
    );
    const random =
      typeof config.random === "function" ? config.random : Math.random;
    const matches = [];

    for (let round = 1; round <= rounds; round += 1) {
      for (let i = 0; i < models.length; i += 1) {
        for (let j = i + 1; j < models.length; j += 1) {
          const scenario = this._buildScenario(round, i, j, random);
          matches.push(
            this.recordMatch(
              this._simulateMatch(models[i], models[j], scenario, random),
            ),
          );
        }
      }
    }

    const tournament = {
      id: `elo-${Date.now()}`,
      timestamp: new Date().toISOString(),
      rounds,
      models: models.length,
      matches: matches.filter(Boolean),
      leaderboard: this.getEloLeaderboard(),
    };
    this.TOURNAMENTS.unshift(tournament);
    if (this.TOURNAMENTS.length > 50) this.TOURNAMENTS.pop();
    this.persist();
    this.renderEloPanel();
    return tournament;
  },

  expectedScore(eloA, eloB) {
    return 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
  },

  getLeaderboard(metric = "elo") {
    this._ensureInitialized();
    return Object.values(this.STANDINGS)
      .sort((a, b) => {
        if (metric === "winRate")
          return b.overallWinRate - a.overallWinRate || b.elo - a.elo;
        if (metric === "totalPnL")
          return b.totalPnL - a.totalPnL || b.elo - a.elo;
        if (metric === "trades")
          return b.totalTrades - a.totalTrades || b.elo - a.elo;
        if (metric === "avgTradeValue")
          return b.avgTradeValue - a.avgTradeValue || b.elo - a.elo;
        return b.elo - a.elo || b.totalPnL - a.totalPnL;
      })
      .map((model, index) => ({
        rank: index + 1,
        ...model,
        medal:
          index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "",
      }));
  },

  getEloLeaderboard(limit = 20) {
    return this.getLeaderboard("elo").slice(0, limit);
  },

  getGlobalWeights() {
    this._ensureInitialized();
    const standings = Object.values(this.STANDINGS);
    if (!standings.length) return [];

    const rawWeights = standings.map((standing) => {
      const eloScore = Math.pow(10, (standing.elo - 1200) / 400);
      const winRateScore = standing.totalTrades
        ? 0.75 + standing.overallWinRate
        : 1;
      const pnlScore = standing.totalTrades
        ? Math.max(0.5, Math.min(1.5, 1 + standing.avgTradeValue / 100))
        : 1;
      const score = Math.max(0.0001, eloScore * winRateScore * pnlScore);
      return { standing, score };
    });

    const totalScore = rawWeights.reduce((sum, item) => sum + item.score, 0);
    return rawWeights
      .map(({ standing, score }) => ({
        model: standing.model,
        provider: standing.provider,
        elo: standing.elo,
        weight: score / totalScore,
        weightPct: Number(((score / totalScore) * 100).toFixed(2)),
        totalTrades: standing.totalTrades,
        totalPnL: standing.totalPnL,
        winRate: standing.overallWinRate,
      }))
      .sort((a, b) => b.weight - a.weight);
  },

  getSummary() {
    const standings = Object.values(this.STANDINGS);
    const totalTrades = standings.reduce(
      (sum, model) => sum + model.totalTrades,
      0,
    );
    const totalPnL = standings.reduce((sum, model) => sum + model.totalPnL, 0);
    const topModel = this.getLeaderboard("elo")[0];
    return {
      totalBrackets: Object.keys(this.BRACKETS).length,
      totalModels: standings.length,
      totalTrades,
      totalPnL,
      topModel: topModel?.model,
      topModelElo: topModel?.elo,
      topModelPnL: topModel?.totalPnL,
      topModelWinRate: topModel?.overallWinRate,
      totalMatches: this.MATCH_LOG.length,
      tournaments: this.TOURNAMENTS.length,
    };
  },

  getTopBrackets(limit = 10) {
    this._ensureInitialized();
    return Object.entries(this.BRACKETS)
      .filter(([, info]) => info.trades > 0)
      .map(([bracket, info]) => ({
        bracket,
        ...info,
        roi: info.trades ? (info.totalPnL / info.trades) * 100 : 0,
      }))
      .sort((a, b) => b.totalPnL - a.totalPnL)
      .slice(0, limit);
  },

  compareModels(model1, model2) {
    this._ensureInitialized();
    const stats1 = this.STANDINGS[model1];
    const stats2 = this.STANDINGS[model2];
    return {
      model1,
      model2,
      eloDiff: (stats1?.elo || 0) - (stats2?.elo || 0),
      pnlDiff: (stats1?.totalPnL || 0) - (stats2?.totalPnL || 0),
      winner: (stats1?.elo || 0) >= (stats2?.elo || 0) ? model1 : model2,
      stats1,
      stats2,
    };
  },

  persist() {
    if (!this._hasStorage()) return;
    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          standings: this.STANDINGS,
          brackets: this.BRACKETS,
          competitionLog: this.COMPETITION_LOG,
          matchLog: this.MATCH_LOG.slice(0, 200),
          tournaments: this.TOURNAMENTS.slice(0, 20),
        }),
      );
    } catch (error) {
      console.warn("[Trade Olympics] Persist failed:", error.message);
    }
  },

  injectEloPanel() {
    if (
      typeof document === "undefined" ||
      document.getElementById("eloTournamentPanel")
    )
      return;
    const host = document.getElementById("mainApp") || document.body;
    const panel = document.createElement("div");
    panel.id = "eloTournamentPanel";
    panel.className = "cpanel";
    panel.innerHTML = `
      <div class="cpanel-hd open" onclick="document.getElementById('eloTournamentBody')?.classList.toggle('open')">
        <div class="cpanel-title">🏆 ELO TOURNAMENTS</div><div class="cpanel-toggle">AI model ratings</div>
      </div>
      <div class="cpanel-body open" id="eloTournamentBody">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
          <button class="bus-apply-btn bus-apply-primary" onclick="runEloTournamentUI()">RUN ELO ROUND</button>
          <button class="bus-apply-btn bus-apply-secondary" onclick="resetEloTournamentUI()">RESET ELO</button>
        </div>
        <div id="eloTournamentSummary" style="font-size:9px;color:var(--dim);margin-bottom:8px"></div>
        <div id="eloTournamentRows" style="display:grid;gap:4px"></div>
      </div>`;
    const quantPanel = document.getElementById("ensemblePanel");
    if (quantPanel?.parentNode)
      quantPanel.parentNode.insertBefore(panel, quantPanel.nextSibling);
    else host.appendChild(panel);
    this.renderEloPanel();
  },

  renderEloPanel() {
    if (typeof document === "undefined") return;
    const rows = document.getElementById("eloTournamentRows");
    const summaryEl = document.getElementById("eloTournamentSummary");
    if (!rows || !summaryEl) return;
    const summary = this.getSummary();
    summaryEl.textContent = `${summary.totalModels} models · ${summary.totalMatches} ELO matches · leader ${summary.topModel || "N/A"} (${summary.topModelElo || 0})`;
    rows.innerHTML = this.getEloLeaderboard(6)
      .map(
        (model) => `
      <div style="display:grid;grid-template-columns:28px 1fr 58px 58px 58px;gap:6px;align-items:center;font-size:9px;background:var(--chrome);border:1px solid var(--border);border-radius:6px;padding:5px 7px">
        <span>${model.medal || model.rank}</span><span style="color:var(--cyan)">${model.model}</span><span>${model.elo}</span><span>${model.totalTrades}T</span><span style="color:${model.totalPnL >= 0 ? "var(--green)" : "var(--hot)"}">${model.totalPnL >= 0 ? "+" : ""}$${model.totalPnL.toFixed(2)}</span>
      </div>`,
      )
      .join("");
  },

  _ensureInitialized() {
    if (!this.initialized) this.initialize({ silent: true });
  },

  _hasStorage() {
    return (
      typeof localStorage !== "undefined" &&
      typeof localStorage.getItem === "function" &&
      typeof localStorage.setItem === "function" &&
      typeof localStorage.removeItem === "function"
    );
  },

  _collectModels(models) {
    if (Array.isArray(models) && models.length)
      return models.map((model) =>
        typeof model === "string"
          ? { name: model, provider: "custom", elo: 1200 }
          : model,
      );
    if (typeof LM_ARENA_MODELS !== "undefined") {
      const collected = [];
      for (const tier in LM_ARENA_MODELS) {
        for (const modelName in LM_ARENA_MODELS[tier]) {
          collected.push({
            name: modelName,
            provider: LM_ARENA_MODELS[tier][modelName].provider || tier,
            elo: LM_ARENA_MODELS[tier][modelName].elo || 1200,
          });
        }
      }
      if (collected.length) return collected;
    }
    return DEFAULT_OLYMPICS_MODELS;
  },

  _ensureStanding(modelName, model = {}) {
    if (!this.STANDINGS[modelName]) {
      const startingElo = Number(model.elo || 1200);
      this.STANDINGS[modelName] = {
        model: modelName,
        provider: model.provider || "unknown",
        style: model.style || "general",
        elo: startingElo,
        eloPeak: startingElo,
        eloLow: startingElo,
        bracketsAssigned: [],
        totalTrades: 0,
        totalWins: 0,
        totalLosses: 0,
        totalPnL: 0,
        overallWinRate: 0,
        avgTradeValue: 0,
        medals: { gold: 0, silver: 0, bronze: 0 },
        headToHead: {},
      };
    }
    return this.STANDINGS[modelName];
  },

  _loadPersisted() {
    if (!this._hasStorage()) return;
    try {
      const saved = JSON.parse(
        localStorage.getItem(this.STORAGE_KEY) || "null",
      );
      if (!saved) return;
      this.STANDINGS = { ...this.STANDINGS, ...(saved.standings || {}) };
      this.BRACKETS = { ...this.BRACKETS, ...(saved.brackets || {}) };
      this.COMPETITION_LOG = saved.competitionLog || this.COMPETITION_LOG;
      this.MATCH_LOG = saved.matchLog || [];
      this.TOURNAMENTS = saved.tournaments || [];
    } catch (error) {
      console.warn("[Trade Olympics] Load failed:", error.message);
    }
  },

  _normalizeMethod(method) {
    const upper = String(method || "SPOT LONG").toUpperCase();
    return this.METHODS.includes(upper) ? upper : "SPOT LONG";
  },

  _normalizeToken(token) {
    const upper = String(token || "ETH").toUpperCase();
    return this.TOKENS.includes(upper) ? upper : "ETH";
  },

  _getEdgeTier(edgePercent) {
    const edge = Math.abs(Number(edgePercent || 0));
    return (
      this.EDGE_TIERS.find((tier) => edge >= tier.min && edge <= tier.max) ||
      this.EDGE_TIERS[this.EDGE_TIERS.length - 1]
    );
  },

  _bracketKey(method, token, edgeTier) {
    return `${method}_${token}_${edgeTier}`;
  },

  _rollingAverage(previous, next, count) {
    return count <= 1 ? next : previous + (next - previous) / count;
  },

  _normalizeScore(score) {
    const numeric = Number(score);
    if (!Number.isFinite(numeric)) return 0.5;
    return Math.max(0, Math.min(1, numeric));
  },

  _marginMultiplier(pnlA = 0, pnlB = 0) {
    const margin = Math.abs(Number(pnlA || 0) - Number(pnlB || 0));
    return Math.max(0.75, Math.min(1.75, 1 + Math.log10(1 + margin) / 8));
  },

  _buildScenario(round, i, j, random) {
    const method = this.METHODS[(round + i + j) % this.METHODS.length];
    const token = this.TOKENS[(round * 3 + i + j) % this.TOKENS.length];
    const edgeTier =
      this.EDGE_TIERS[Math.floor(random() * this.EDGE_TIERS.length)];
    return {
      method,
      token,
      edgeTier,
      edge: edgeTier.min + random() * (edgeTier.max - edgeTier.min),
    };
  },

  _simulateMatch(modelA, modelB, scenario, random) {
    const a = this._ensureStanding(modelA);
    const b = this._ensureStanding(modelB);
    const expectedA = this.expectedScore(a.elo, b.elo);
    const noise = (random() - 0.5) * 0.22;
    const scoreA = expectedA + noise >= 0.5 ? 1 : 0;
    const pnlBase = scenario.edge * 10;
    return {
      modelA,
      modelB,
      scoreA,
      pnlA: scoreA ? pnlBase : -pnlBase * 0.65,
      pnlB: scoreA ? -pnlBase * 0.65 : pnlBase,
      context: scenario,
    };
  },
};

function runEloTournamentUI(rounds = 1) {
  const tournament = TRADE_OLYMPICS.runEloTournament({ rounds });
  const leader = tournament.leaderboard[0];
  if (typeof alert !== "undefined")
    alert(
      `ELO round complete: ${tournament.matches.length} matches\nLeader: ${leader.model} (${leader.elo})`,
    );
  return tournament;
}

function resetEloTournamentUI() {
  TRADE_OLYMPICS.reset();
  TRADE_OLYMPICS.injectEloPanel();
}

if (typeof window !== "undefined") {
  window.TRADE_OLYMPICS = TRADE_OLYMPICS;
  window.runEloTournamentUI = runEloTournamentUI;
  window.resetEloTournamentUI = resetEloTournamentUI;
  const boot = () => {
    TRADE_OLYMPICS.initialize({ silent: true });
    TRADE_OLYMPICS.injectEloPanel();
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    TRADE_OLYMPICS,
    DEFAULT_OLYMPICS_MODELS,
    runEloTournamentUI,
    resetEloTournamentUI,
  };
}
