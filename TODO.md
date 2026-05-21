# TODO — Trade Arena $50 → $1M roadmap (Dual-Track Turtle/Hare)

## Plan approval: Implement Supabase-backed orchestration

1. Add backend Supabase client + repository
   - Create `supabaseClient.js`
   - Create `supabaseRepository.js`
2. Add roadmap orchestrator + gating
   - Create `roadmapOrchestrator.js`
   - Create `aiConfidence.js` (scoring + thresholds)
3. Add new backend endpoints
   - Edit `server.js`:
     - `POST /api/ai/learning-state` (get/upsert)
     - `POST /api/trade/decide` (candidate selection + Turtle/Hare + stage gating)
     - `POST /api/trade/execute` (MCP execute_trade + persist trade)
4. Wire frontend AUTO mode to backend
   - Edit `index-new.html` to call backend endpoints instead of browser-random decisions
5. Add migration/schema instructions (documentation)
   - Document required Supabase tables (learning_state, trades, bots)
6. Test end-to-end
   - `npm test` (if applicable)
   - `npm start` backend
   - Load UI and enable AUTO mode
   - Verify:
     - `/api/trade/decide` returns HOLD/EXECUTE
     - `/api/trade/execute` returns trade result
     - Supabase rows are created/updated (if configured)

