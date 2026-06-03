# Regime Crucible v2 - Brainstorm Implementation Plan

## 📊 Information Gathered

### Already Implemented (Phase 1 - Core Infrastructure)
| File | Status | Purpose |
|------|--------|---------|
| `src/validation/regime.ts` | ✅ COMPLETE | Regime classifier with RSI(14), ATR, returns |
| `src/validation/costmodel.ts` | ✅ COMPLETE | Full cost model + 1.5x stress variant |
| `src/utils/tokenFilter.ts` | ✅ COMPLETE | Stablecoin blocklist filter |

### Partially Implemented (Phase 2 - Data Layer)
| File | Status | Purpose |
|------|--------|---------|
| `src/data/coingecko.ts` | ✅ EXISTS | OHLCV fetching + in-memory caching |
| `/data/cache/` directory | ❌ MISSING | Persistent disk cache |

### Missing Components (Phase 3-6)
| Component | File | Purpose |
|-----------|------|---------|
| Execution Engine | `src/validation/crucible.ts` | Main Regime Crucible engine with dual modes |
| Baseline Comparisons | Built into crucible.ts | Random, Always Long, Momentum baselines |
| Reporting Export | `src/exports/reporting.ts` | JSON/CSV tamper-resistant exports |
| UI Integration | `src/ui/regime-crucible-ui.ts` | Button hook in Quant Report |

## 🎯 Implementation Plan

### Phase 3: Execution Engine
- [ ] **Task 3.1**: Create `src/validation/crucible.ts`
  - Import regime detector from `regime.ts`
  - Import cost model from `costmodel.ts`
  - Import token filter from `tokenFilter.ts`
  
- [ ] **Task 3.2**: Implement dual modes
  - `LIVE` mode: Real-time regime detection + paper trading
  - `HISTORICAL` mode: Backtest on 90 days ETH/BTC 5m candles
  
- [ ] **Task 3.3**: Trade execution logic
  - Generate 50 trades per regime minimum (150 total)
  - Apply entry/exit logic based on regime
  - Calculate costs using costmodel.ts

### Phase 4: Baseline Comparisons
- [ ] **Task 4.1**: Implement baseline strategies
  - Random baseline (seeded coin flip)
  - Always Long baseline
  - Momentum baseline (prior 5m candle direction)
  
- [ ] **Task 4.2**: Run baselines at identical timestamps
  - Use same trade timestamps as regime strategy
  - Compare results fairly

### Phase 5: Exports & UI
- [ ] **Task 5.1**: Create `src/exports/reporting.ts`
  - JSON export with cryptographic hash
  - CSV export for Excel
  - Tamper-resistant metadata
  
- [ ] **Task 5.2**: Create `src/ui/regime-crucible-ui.ts`
  - Button to trigger regime analysis
  - Results display panel
  
- [ ] **Task 5.3**: Wire into `index.html`
  - Add button to Quant Report section

### Phase 6: PASS/FAIL Criteria
- [ ] Win rate ≥ 50%
- [ ] Profit factor ≥ 1.2
- [ ] Max drawdown < 15%
- [ ] Beat Random baseline
- [ ] Beat Momentum baseline  
- [ ] At 1.5x stress costs: profit factor ≥ 1.0
- [ ] Must pass ≥ 2 of 3 regimes

## 🔄 Dependencies

### Required Imports (crucible.ts)
```typescript
import { detectRegime, RegimeType } from './regime.js';
import { calculateCosts, STRESS_COST_MODEL, DEFAULT_COST_MODEL } from './costmodel.js';
import { filterToken, isStablecoin } from '../utils/tokenFilter.js';
```

### Required Exports (for UI)
```typescript
export { runCrucible, getResults } from './crucible.js';
export { exportJSON, exportCSV } from './reporting.js';
```

## ✅ Next Steps

1. Create `src/validation/crucible.ts` - Core execution engine
2. Create `src/exports/reporting.ts` - Export utilities
3. Create `src/ui/regime-crucible-ui.ts` - UI component
4. Wire into index.html
5. Test and verify PASS/FAIL criteria
