# 🏟️ AI ARENA - VISUAL SYSTEM DIAGRAM

## Tournament Flow (Step-by-Step)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                     USER CLICKS ▶️ AUTO                       ┃
┃                  (or manually 🎰 SPIN)                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                              ↓
                    ┌─────────────────────┐
                    │  Fetch Market Data  │
                    │  Top 8 coins        │
                    │  Volatility/Volume  │
                    └─────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │    RUN AI ARENA TOURNAMENT              │
        │                                          │
        │  ┌─────────────────────────────────┐   │
        │  │  🔬 ANALYST                      │   │
        │  │  "Conservative Risk Analysis"   │   │
        │  │  ↓ Analyzes...                  │   │
        │  │  Proposal: ETH, ARBITRAGE       │   │
        │  │  Confidence: 0.72               │   │
        │  │  Edge: 2.3%                     │   │
        │  │  Vote Score: 0.68 ⭐⭐⭐        │   │
        │  └─────────────────────────────────┘   │
        │                                          │
        │  ┌─────────────────────────────────┐   │
        │  │  ⚡ TRADER                       │   │
        │  │  "Aggressive Momentum Hunter"   │   │
        │  │  ↓ Analyzes...                  │   │
        │  │  Proposal: SOL, PERP LONG       │   │
        │  │  Confidence: 0.85               │   │
        │  │  Edge: 4.5%                     │   │
        │  │  Vote Score: 0.79 ⭐⭐⭐⭐     │   │
        │  └─────────────────────────────────┘   │
        │                                          │
        │  ┌─────────────────────────────────┐   │
        │  │  🎯 STRATEGIST                   │   │
        │  │  "Balanced Market Adapter"      │   │
        │  │  ↓ Analyzes...                  │   │
        │  │  Proposal: BTC, SPOT LONG       │   │
        │  │  Confidence: 0.68               │   │
        │  │  Edge: 3.1%                     │   │
        │  │  Vote Score: 0.71 ⭐⭐⭐       │   │
        │  └─────────────────────────────────┘   │
        │                                          │
        └─────────────────────────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  🗳️ VOTING ROUND    │
                    │                     │
                    │  Compare Scores:    │
                    │  ANALYST:  0.68     │
                    │  TRADER:   0.79 ✅  │
                    │  STRATEGIST: 0.71   │
                    │                     │
                    │  Winner: TRADER     │
                    │  Consensus: 85%     │
                    └─────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │  ✅ EXECUTION VALIDATION                 │
        │                                          │
        │  ✅ Consensus 85% > 65% → PASS         │
        │  ✅ Confidence 85% > 60% → PASS        │
        │  ✅ Volatility 4.8% < 8% → PASS        │
        │  ✅ All sanity checks → PASS            │
        │                                          │
        │  Result: TRADE APPROVED ✅             │
        └─────────────────────────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  💰 EXECUTE TRADE   │
                    │  SOL PERP LONG      │
                    │  Edge: 4.5%         │
                    │  Confidence: 0.85   │
                    └─────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  🎰 SPIN ANIMATION  │
                    │  (3-5 seconds)      │
                    └─────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  🏆 RECORD RESULT   │
                    │  WIN or LOSS?       │
                    │  Update model score │
                    └─────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  📊 UPDATE          │
                    │  LEADERBOARD        │
                    │  TRADER wins +1     │
                    └─────────────────────┘
                              ↓
                    ┏━━━━━━━━━━━━━━━━━━━━━━━━┓
                    ┃   ✅ TOURNAMENT       ┃
                    ┃       COMPLETE        ┃
                    ┗━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Voting System Architecture

```
╔════════════════════════════════════════════════════════════╗
║             VOTE SCORE CALCULATION FORMULA                ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Final Vote Score =                                       ║
║    (40% × Confidence)        +                            ║
║    (30% × Edge Quality)      +                            ║
║    (20% × Win Probability)   +                            ║
║    (10% × Risk Adjustment)                                ║
║                                                            ║
║  Score Range: 0.0 (worst) → 1.0 (best)                   ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                      EXAMPLE:                              ║
║                                                            ║
║  TRADER Proposal:                                         ║
║  • Confidence: 0.85 → 40% weight → 0.85 × 0.4 = 0.34    ║
║  • Edge: 4.5% → 30% weight → (4.5/10) × 0.3 = 0.135    ║
║  • Win Prob: 0.62 → 20% weight → 0.62 × 0.2 = 0.124    ║
║  • Risk: HIGH → 10% weight → 0.70 × 0.1 = 0.070         ║
║                                                            ║
║  Total = 0.34 + 0.135 + 0.124 + 0.070 = 0.669           ║
║  Rounded = 0.79 (79%) ⭐⭐⭐⭐ EXCELLENT                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## Model Performance vs Market Condition

```
┌──────────────────────────────────────────────────────────────┐
│        MODEL PERFORMANCE BY MARKET TYPE                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  BULLISH MARKET ↗️  (Bitcoin +5%, Altcoins +6%)             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  🥇 TRADER ⚡        80% | Momentum works perfect            │
│  🥈 STRATEGIST 🎯   65% | Balanced approach ok              │
│  🥉 ANALYST 🔬      55% | Too cautious for this market     │
│                                                              │
│  CHOPPY MARKET 🔄  (Bitcoin ±1%, Alts ±2%)                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  🥇 ANALYST 🔬      75% | Safety works, prevents whipsaws  │
│  🥈 STRATEGIST 🎯   68% | Balanced defense works            │
│  🥉 TRADER ⚡        50% | Momentum doesn't work here       │
│                                                              │
│  BEARISH MARKET ↘️  (Bitcoin -5%, Altcoins -7%)            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  🥇 ANALYST 🔬      70% | Defensive focus saves money       │
│  🥈 STRATEGIST 🎯   65% | Can short safely                  │
│  🥉 TRADER ⚡        45% | Shorts work but risky            │
│                                                              │
│  VOLATILE MARKET 📉 (Bitcoin 8%+ 24h change)               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  🥇 STRATEGIST 🎯   72% | Balanced approach safest          │
│  🥈 ANALYST 🔬      65% | Conservative but profitable       │
│  🥉 TRADER ⚡        55% | Leverage risks whipsaws          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       INPUT LAYER                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Market Data                Bot Config           Strategy   │
│  ├─ 8 Coin Prices          ├─ Bet Amount        ├─ Profile │
│  ├─ 24h % Changes          ├─ Bot ID            ├─ History │
│  ├─ Trading Volumes        └─ Auto Mode         └─ State   │
│  └─ Market Condition                                        │
│     (BULLISH/BEARISH/VOLATILE)                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                    ANALYSIS LAYER (Parallel)                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🔬 ANALYST            ⚡ TRADER           🎯 STRATEGIST    │
│  │                      │                   │                │
│  ├─ Read data          ├─ Read data         ├─ Read data    │
│  ├─ Risk analysis      ├─ Momentum check    ├─ Condition    │
│  ├─ Edge detection     ├─ Vol scan          ├─ Adaptation   │
│  ├─ Safety focus       ├─ Quick wins        ├─ Balance      │
│  └─ Propose trade      └─ Propose trade     └─ Propose      │
│                                                              │
│  Token: ETH            Token: SOL           Token: BTC      │
│  Method: ARBITRAGE     Method: PERP LONG    Method: SPOT    │
│  Confidence: 0.72      Confidence: 0.85     Confidence: 0.68│
│  Edge: 2.3%            Edge: 4.5%           Edge: 3.1%      │
│  Vote Score: 0.68      Vote Score: 0.79     Vote Score: 0.71│
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                    VOTING LAYER                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Compare Vote Scores:                                       │
│  ANALYST:    0.68 ⭐⭐⭐                                    │
│  TRADER:     0.79 ⭐⭐⭐⭐ ← HIGHEST                        │
│  STRATEGIST: 0.71 ⭐⭐⭐                                    │
│                                                              │
│  Consensus Strength = Winner / Average                       │
│  = 0.79 / 0.73 = 1.08 → 85% (strong!)                      │
│                                                              │
│  Winner: TRADER (0.79)                                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                 VALIDATION LAYER (Safety Gates)              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ Consensus Gate:   85% > 65% threshold   → PASS         │
│  ✅ Confidence Gate:  0.85 > 0.60 avg       → PASS         │
│  ✅ Volatility Gate:  4.8% < 8.0% max       → PASS         │
│  ✅ Sanity Gate:      All fields valid       → PASS         │
│                                                              │
│  All Gates Passed → EXECUTE ✅                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                   OUTPUT LAYER                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Final Decision:                                            │
│  {                                                          │
│    token: "SOL",                                            │
│    method: "PERP LONG",                                     │
│    edge_pct: 4.5,                                           │
│    confidence: 0.85,                                        │
│    win_probability: 0.62,                                   │
│    arena_tournament: {                                      │
│      all_proposals: [...],                                  │
│      winner: "TRADER",                                      │
│      consensus_strength: 0.85,                              │
│      can_execute: true                                      │
│    }                                                        │
│  }                                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                   EXECUTION LAYER                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Trade: SOL PERP LONG                                       │
│  Size: $100 bet                                             │
│  Edge: 4.5%                                                 │
│  Probability: 62% win                                       │
│                                                              │
│  [SPIN ANIMATION] ← 3-5 seconds                             │
│                                                              │
│  Result: WIN +$62 (after fees)                              │
│  PnL: +$61.50 (net)                                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│              LEADERBOARD UPDATE LAYER                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🏆 AI ARENA LEADERBOARD                                    │
│                                                              │
│  🥇 TRADER ⚡        72.5% • 14W-5L                         │
│  🥈 STRATEGIST 🎯    68.2% • 13W-6L                         │
│  🥉 ANALYST 🔬       61.0% • 11W-7L                         │
│                                                              │
│  (Updated in real-time after each trade)                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Execution Validation Rules (Decision Tree)

```
                    TRADE DECISION READY
                            ↓
                    ┌─────────────────┐
                    │  CHECK 1:       │
                    │  CONSENSUS      │
                    │  STRENGTH       │
                    │  ≥ 65%?         │
                    └────────┬────────┘
                             ↓
                    ┌────────────────────┐
              YES → │ CHECK 2:           │ ← NO: PAUSE ⏸️
                    │ CONFIDENCE         │   (Low consensus)
                    │ SCORE ≥ 60%?       │
                    └────────┬───────────┘
                             ↓
                    ┌────────────────────┐
              YES → │ CHECK 3:           │ ← NO: PAUSE ⏸️
                    │ MARKET             │   (Low confidence)
                    │ VOLATILITY         │
                    │ ≤ 8.0%?            │
                    └────────┬───────────┘
                             ↓
                    ┌────────────────────┐
              YES → │ CHECK 4:           │ ← NO: PAUSE ⏸️
                    │ SANITY CHECKS      │   (Too volatile)
                    │ (token/method/edge)│
                    └────────┬───────────┘
                             ↓
                    ┏━━━━━━━━━━━━━━━━━━┓
              YES → ┃ EXECUTE TRADE ✅ ┃ ← NO: PAUSE ⏸️
                    ┃ ALL GATES PASS    ┃   (Invalid data)
                    ┗━━━━━━━━━━━━━━━━━━┛
```

---

## Real-Time State Management

```
┌─────────────────────────────────────────────────────────┐
│           ARENA STATE (in JavaScript memory)            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  arenaState = {                                         │
│                                                         │
│    lastTournament: {                                    │
│      token: "SOL",                                      │
│      method: "PERP LONG",                               │
│      arena_tournament: {                                │
│        winner: "TRADER",                                │
│        consensus_strength: 0.85,                        │
│        all_proposals: [...]                             │
│      },                                                 │
│      outcome: "WIN"                                     │
│    },                                                   │
│                                                         │
│    modelPerformance: {                                  │
│      ANALYST: {                                         │
│        wins: 11,                                        │
│        losses: 7,                                       │
│        accuracy: '61.0'                                 │
│      },                                                 │
│      TRADER: {                                          │
│        wins: 14,                                        │
│        losses: 5,                                       │
│        accuracy: '73.5'   ← LEADING               │
│      },                                                 │
│      STRATEGIST: {                                      │
│        wins: 13,                                        │
│        losses: 6,                                       │
│        accuracy: '68.2'                                 │
│      }                                                  │
│    },                                                   │
│                                                         │
│    tournamentHistory: [                                 │
│      { tournament 1 data... },                          │
│      { tournament 2 data... },                          │
│      ...                                                │
│      (last 50 stored)                                   │
│    ]                                                    │
│                                                         │
│  }                                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Leaderboard Ranking System

```
┌──────────────────────────────────────────────────────────┐
│        LEADERBOARD CALCULATION & DISPLAY                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  For each model:                                        │
│  ────────────────────────────────────────────────────   │
│                                                          │
│  1. Count wins:        (when model won tournament       │
│                         and trade won)                  │
│                                                          │
│  2. Count losses:      (when model won tournament       │
│                         and trade lost)                 │
│                                                          │
│  3. Calculate WR:      Accuracy = Wins / (Wins+Losses)  │
│                        × 100                            │
│                                                          │
│  4. Sort by accuracy:  Highest % = 🥇                  │
│                                                          │
│  EXAMPLE:                                              │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  TRADER:                                                │
│    Wins:  14 (tournaments won that turned to wins)     │
│    Losses: 5 (tournaments won that turned to losses)   │
│    Total: 19 trades                                    │
│    Accuracy: 14 / 19 = 0.7368 = 73.68% ≈ 73.5% 🥇     │
│                                                          │
│  STRATEGIST:                                            │
│    Wins:  13                                            │
│    Losses: 6                                            │
│    Total: 19                                            │
│    Accuracy: 13 / 19 = 0.6842 = 68.42% ≈ 68.2% 🥈     │
│                                                          │
│  ANALYST:                                               │
│    Wins:  11                                            │
│    Losses: 7                                            │
│    Total: 18                                            │
│    Accuracy: 11 / 18 = 0.6111 = 61.11% ≈ 61.0% 🥉     │
│                                                          │
│  Display:                                              │
│  ────────────────────────────────────────────────────  │
│  🏆 AI ARENA LEADERBOARD                               │
│  🥇 TRADER ⚡        73.5% • 14W-5L                    │
│  🥈 STRATEGIST 🎯    68.2% • 13W-6L                    │
│  🥉 ANALYST 🔬       61.0% • 11W-7L                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Confidence Matrix (Model vs Market)

```
                  BULLISH  CHOPPY  BEARISH  VOLATILE
                  ──────────────────────────────────
ANALYST 🔬        40%      75%     70%      65%
TRADER ⚡         80%      50%     45%      55%
STRATEGIST 🎯     65%      68%     65%      72%

→ Matrix shows expected win rates by model & market
→ Over time, real data replaces expectations
→ System learns which models perform best
```

---

*Visual System Design | AI Arena v5 | March 2026*
