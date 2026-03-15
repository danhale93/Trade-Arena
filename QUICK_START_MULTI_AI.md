# Quick Start: Testing Multi-AI Arena Integration

## 🚀 Get Started in 2 Minutes

### Step 1: Open the App
Navigate to: **http://localhost:8000**

### Step 2: Add 6 Bots (One Per Profile)
Click "ADD BOT" six times and set each profile:
1. Bot #1 → Profile: **SCALPER**
2. Bot #2 → Profile: **TREND**  
3. Bot #3 → Profile: **AGGRESSIVE**
4. Bot #4 → Profile: **CONSERVATIVE**
5. Bot #5 → Profile: **BALANCED**
6. Bot #6 → Profile: **NICHE**

Set a bet amount for each (e.g., $100-200)

### Step 3: Trade with Each Bot
Click **SPIN** on Bot #1. Watch for console output:
```
[Multi-AI Arena] Bot #1: Model grok-3 (xAI, ELO 1380)
  Decision: FLASH LOAN on BTC
  Edge: 2.5% | Win Prob: 62%
```

Repeat for all 6 bots. Each should show a different model!

## 📊 Expected Model Assignments

| Bot # | Profile | Assigned Model | Provider | ELO |
|-------|---------|-----------------|----------|-----|
| 1 | SCALPER | **grok-3** | xAI | 1380 |
| 2 | TREND | **gpt-5-turbo** | OpenAI | 1400 |
| 3 | AGGRESSIVE | **grok-3** | xAI | 1380 |
| 4 | CONSERVATIVE | **claude-3-opus** | Anthropic | 1250 |
| 5 | BALANCED | **claude-3.5-sonnet** | Anthropic | 1390 |
| 6 | NICHE | **neural-shadow** | DeepSeek | 1100 |

## 🔍 Verify Integration

### Open Browser DevTools (F12)
Go to **Console** tab

### Check Model Assignments
```javascript
console.log(BOT_AI_MODELS);
```

**Expected Output:**
```
{
  1: "grok-3",
  2: "gpt-5-turbo",
  3: "grok-3",
  4: "claude-3-opus",
  5: "claude-3.5-sonnet",
  6: "neural-shadow"
}
```

### Check Arena Leaderboard
```javascript
ARENA_COMPETITION.getLeaderboard();
```

**Expected Output (after several trades):**
```
[
  { model: "gpt-5-turbo", wins: 12, losses: 8, totalPnL: 450, winRate: 0.60 },
  { model: "claude-3.5-sonnet", wins: 11, losses: 9, totalPnL: 425, winRate: 0.55 },
  { model: "grok-3", wins: 15, losses: 10, totalPnL: 500, winRate: 0.60 },
  ...
]
```

### Verify Functions Available
```javascript
// Should return TRUE
typeof callAIModel === 'function'
typeof getBotModelName === 'function'
typeof ARENA_COMPETITION.getLeaderboard === 'function'
```

## 📈 What You Should See

### In Console (on each SPIN):
```
[Multi-AI Arena] Bot #3: Model grok-3 (xAI, ELO 1380)
  Decision: PERP LONG on SOL
  Edge: 3.2% | Win Prob: 58%
```

### In Global Trade Log:
Each trade should show model information:
- Model name
- Model provider
- Model ELO rating
- Decision reasoning with model personality

### On Bot Card:
- Bot profile (SCALPER, TREND, etc.)
- Assigned model name (shown in console)
- Trade results (WIN/LOSS with P&L)

## 🎯 Personality Effects

Different models make different decisions even with same data:

### AGGRESSIVE Models (grok-3)
- Higher edge predictions (2-4%)
- Higher win probability (55-65%)
- Take more risks
- Faster decisions

### CONSERVATIVE Models (claude-3-opus)
- Lower edge predictions (1-2%)
- Lower win probability (50-55%)
- More cautious trades
- Deeper analysis

### BALANCED Models (claude-3.5-sonnet)
- Medium edge (1.5-3%)
- Medium probability (52-60%)
- Mix of both approaches
- Good for mixed portfolios

## 🔧 Advanced Testing

### Test Profile Optimal Selection
```javascript
// This chooses the best model for each profile
MODEL_SELECTION.profileOptimal('SCALPER')
// Output: "grok-3"

MODEL_SELECTION.profileOptimal('CONSERVATIVE')
// Output: "claude-3-opus"
```

### Test ELO-Weighted Selection
```javascript
// Models with higher ELO more likely to be selected
MODEL_SELECTION.eloWeighted()
// Output: Varies (likely a TIER_1 model)
```

### Test Speed Optimization
```javascript
// Selects fastest models
MODEL_SELECTION.speedOptimal()
// Output: Likely "grok-3" (400ms) or "gpt-5-turbo" (800ms)
```

### Check Model Details
```javascript
// Get all info about a specific model
getModelConfig('grok-3')
// Output: { provider: "xAI", elo: 1380, personality: "AGGRESSIVE", speedMs: 400, ... }

getModelTier('grok-3')
// Output: "TIER_1"
```

## ✅ Checklist

After running through this quick start:

- [ ] 6 bots added with different profiles
- [ ] Clicked SPIN on each bot
- [ ] Saw console output with model names
- [ ] Each bot assigned to expected model
- [ ] Arena leaderboard showing trades
- [ ] Models have different P&L results
- [ ] Bot cards show trade history

## 🐛 Troubleshooting

### "callAIModel is not a function"
- **Cause:** multi-ai-arena.js not loaded
- **Fix:** Check browser console, look for 404 error
- **Verify:** Refresh page, check Network tab

### "BOT_AI_MODELS is undefined"
- **Cause:** Script loaded but variable not global
- **Fix:** Check that multi-ai-arena.js loaded before index.html calls it
- **Verify:** Open DevTools, type `BOT_AI_MODELS` in console

### "Model names not showing in trades"
- **Cause:** Advanced bot engine being used (fallback)
- **Fix:** Verify callAIModel is defined before bots trade
- **Verify:** Check if ANTHROPIC_API_KEY is set for Claude fallback

### "All bots using same model"
- **Cause:** Model assignment not happening per-profile
- **Fix:** Check BOT_MODEL_ASSIGNMENT has all profiles
- **Verify:** `BOT_MODEL_ASSIGNMENT.assignments` has SCALPER, TREND, etc.

## 📚 Next Steps

### Add UI Display (Optional)
1. Show model name on bot card
2. Add model provider icon
3. Display ELO rating
4. Create leaderboard panel

### Performance Analysis
1. Compare win rates by model
2. Compare win rates by profile
3. Find best profile-model combinations
4. Analyze decision patterns per model

### Advanced Features
1. Manual model selection per bot
2. Model voting (multiple models deciding)
3. Adaptive switching based on market
4. Custom personality multipliers

## 📞 Questions?

Check these files for more info:
- `MULTI_AI_INTEGRATION_COMPLETE.md` - Full integration details
- `COMPLETE_BOT_DIVERSITY_FINAL_REPORT.md` - Bot strategy documentation
- `multi-ai-arena.js` - Source code with comments
- `advanced-bot-engine.js` - Fallback trading engine

---

**Happy Trading! 🚀**
