const { supabase, hasSupabase } = require('./supabaseClient');

function nowIso() {
  return new Date().toISOString();
}

async function ensureSupabase() {
  if (!hasSupabase || !supabase) {
    return { configured: false };
  }
  return { configured: true };
}

// Expected tables (recommended columns; Supabase can ignore extra columns if not present).
// learning_state: (user_id text PK/unique, learning_generation int, learning_log jsonb,
//                   agent_weights jsonb, agent_stats jsonb, updated_at timestamptz)
// trades: (id uuid PK default, user_id text, bot_id text, token text, method text,
//          entry_price numeric, exit_price numeric, pnl numeric, timestamp timestamptz)
// bots: (id text PK, user_id text, name text, strategy text, risk_level text, initial_capital numeric,
//        active boolean, status text, total_pnl numeric, win_rate numeric, trade_count int,
//        created_at timestamptz)

async function getLearningState({ userId }) {
  const { configured } = await ensureSupabase();
  if (!configured) {
    return {
      configured: false,
      state: {
        learningGeneration: 0,
        learningLog: [],
        agentWeights: {},
        agentStats: {},
      },
    };
  }

  const { data, error } = await supabase
    .from('learning_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`getLearningState failed: ${error.message}`);

  if (!data) {
    return {
      configured: true,
      state: {
        learningGeneration: 0,
        learningLog: [],
        agentWeights: {},
        agentStats: {},
      },
    };
  }

  return {
    configured: true,
    state: {
      learningGeneration: data.learning_generation ?? 0,
      learningLog: data.learning_log ?? [],
      agentWeights: data.agent_weights ?? {},
      agentStats: data.agent_stats ?? {},
    },
  };
}

async function upsertLearningState({ userId, learningGeneration, learningLog, agentWeights, agentStats }) {
  const { configured } = await ensureSupabase();
  if (!configured) return { configured: false };

  const payload = {
    user_id: userId,
    learning_generation: learningGeneration ?? 0,
    learning_log: learningLog ?? [],
    agent_weights: agentWeights ?? {},
    agent_stats: agentStats ?? {},
    updated_at: nowIso(),
  };

  // Upsert requires a unique constraint on user_id
  const { error } = await supabase.from('learning_state').upsert(payload, { onConflict: 'user_id' });
  if (error) throw new Error(`upsertLearningState failed: ${error.message}`);

  return { configured: true };
}

async function insertTrade({ userId, trade }) {
  const { configured } = await ensureSupabase();
  if (!configured) return { configured: false };

  const payload = {
    user_id: userId,
    bot_id: trade.botId || null,
    token: trade.token,
    method: trade.method,
    entry_price: trade.entryPrice ?? null,
    exit_price: trade.exitPrice ?? null,
    pnl: trade.pnl ?? null,
    timestamp: trade.timestamp ?? nowIso(),
  };

  const { error } = await supabase.from('trades').insert(payload);
  if (error) throw new Error(`insertTrade failed: ${error.message}`);

  return { configured: true };
}

async function upsertBot({ userId, bot }) {
  const { configured } = await ensureSupabase();
  if (!configured) return { configured: false };

  const payload = {
    id: bot.id,
    user_id: userId,
    name: bot.name,
    strategy: bot.strategy,
    risk_level: bot.riskLevel,
    initial_capital: bot.initialCapital,
    active: bot.active,
    status: bot.status,
    total_pnl: bot.totalPnl,
    win_rate: bot.winRate,
    trade_count: bot.tradeCount,
    created_at: bot.createdAt,
  };

  const { error } = await supabase.from('bots').upsert(payload, { onConflict: 'id' });
  if (error) throw new Error(`upsertBot failed: ${error.message}`);

  return { configured: true };
}

module.exports = {
  getLearningState,
  upsertLearningState,
  insertTrade,
  upsertBot,
};

