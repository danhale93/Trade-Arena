# Regime Crucible v2 Implementation TODO

## TASK 1: REGIME CRUCIBLE v2 (HIGHEST PRIORITY)

### Phase 1: Core Infrastructure
- [ ] Create src/validation/regime.ts - Regime classifier with RSI(14), ATR, returns
- [ ] Create src/validation/costmodel.ts - Full cost model + 1.5x stress variant
- [ ] Create src/utils/tokenFilter.ts - Stablecoin blocklist filter

### Phase 2: Data Layer  
- [ ] Create src/data/coingecko.ts - OHLCV fetching + caching to /data/cache/
- [ ] Implement historical mode: 90 days ETH/BTC 5m candles

### Phase 3: Execution Engine
- [ ] Create src/validation/crucible.ts - Main Regime Crucible engine
- [ ] Implement dual modes: LIVE and HISTORICAL
- [ ] Implement 50 trades per regime (150 total minimum)

### Phase 4: Baseline Comparisons
- [ ] Random baseline (seeded coin flip)
- [ ] Always Long baseline
- [ ] Momentum baseline (prior 5m candle direction)
- [ ] All baselines at identical timestamps

### Phase 5: Exports & UI
- [ ] Create src/exports/reporting.ts - JSON/CSV tamper-resistant exports
- [ ] Implement src/ui/regime-crucible-ui.ts - Button hook in Quant Report
- [ ] Wire into index.html

### Phase 6: PASS/FAIL Criteria
- [ ] Win rate ≥ 50%
- [ ] Profit factor ≥ 1.2
- [ ] Max drawdown < 15%
- [ ] Beat Random baseline
- [ ] Beat Momentum baseline  
- [ ] At 1.5x stress costs: profit factor ≥ 1.0
- [ ] Must pass ≥ 2 of 3 regimes

## TASK 2: GTM INSTRUMENTATION
- [ ] Create /landing route with value prop, screenshots, email capture
- [ ] Create /api/events endpoint
- [ ] Implement experiment switchboard (?src=reddit|tiktok|discord|twitter)
- [ ] Create /metrics dashboard page
- [ ] Create gtm-plan.md with first 3 channels

## TASK 3: OPS & TEAM PLAN
- [ ] Create ops-plan.md with roles, runway, regulatory considerations
- [ ] 90-day milestone timeline

## Deliverables
- All code runnable locally with minimal setup
- Seeded randomness everywhere
- Exports tamper-resistant and reviewer-defensible

## Status
Created: ⏳
Started: ⏳
