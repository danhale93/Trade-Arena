## 2026-06-22 - Synchronized Telemetry Pruning
**Learning:** Pruning a primary data array (like `closedTrades`) to maintain performance is insufficient if parallel telemetry arrays (like `equityHistory` used for SVG charts) grow indefinitely. The overhead of rendering large SVG paths from unpruned history eventually becomes the primary bottleneck, negating the benefits of pruning the main data set.
**Action:** Ensure that any 'Janitor' or hygiene logic prunes all related historical arrays in synchronization. In this case, `equityHistory` was updated to be pruned alongside `closedTrades`.

## 2026-06-22 - Consolidating O(N) Traversals
**Learning:** In monolithic UI update functions like `updateQuantReport`, high-frequency updates trigger multiple redundant O(N) filter/reduce/map operations. Consolidating these into a single `for...of` loop significantly reduces scripting time during active trading sessions.
**Action:** Pass pre-aggregated data objects to sub-drawing functions rather than having each function re-traverse the raw array.

## 2026-06-23 - DOM Dirty-Checking and Render Caching
**Learning:** Even simple DOM property assignments (like `textContent` or `className`) can incur measurable overhead in high-frequency update loops if triggered redundantly. Furthermore, periodic UI updates (e.g., a 15s interval) that perform O(N) aggregations and SVG re-renders should be guarded by state-change checks.
**Action:** Implement "dirty-checking" at the helper level (`setVal`, `setMCard`) and high-level render functions (`updateQuantReport`) to skip processing when the underlying data (e.g., `closedTrades.length`) hasn't changed.

## 2026-06-23 - Production Ready: Live Mode & PayID
Learning: Real-money trading requires explicit state visibility (Live vs Sim) and high-fidelity feedback (Progress bars, Tx links) to ensure user confidence during execution.
Action: Implemented dual-mode trading system with real on-chain execution, batch progress monitoring, and AUD-optimized PayID onboarding.

## 2026-06-25 - Efficient SVG String Building and Loop Optimization
**Learning:** For high-frequency dashboard updates, even O(N) operations like `.map().join()` for SVG paths or `Math.max(...array)` can become bottlenecks as N grows, due to intermediate array allocations and spread operator overhead. Replacing these with manual loops and string accumulation provides a smoother UI experience.
**Action:** Optimized Quant Report drawing functions to use single-pass traversals and manual string accumulation for SVG rendering.
## 2026-06-29 - O(1) Space Volatility and Parallelized Strategy Detection
**Learning:** Monolithic loops that traverse datasets multiple times (e.g., once for returns, once for mean, once for variance) incur unnecessary CPU overhead and intermediate allocations. Furthermore, network-bound strategy detection logic (like arbitrage checks) that executes sequentially creates a waterfall latency bottleneck proportional to the number of trading pairs.
**Action:** Implemented single-pass O(N) variance calculation using the identity $Var(X) = E[X^2] - (E[X])^2$ to achieve O(1) space complexity. Parallelized exchange price fetching and mempool simulations using `Promise.all` to convert O(N) sequential waterfalls into O(1) concurrent batches.
## 2026-06-30 - Backend Latency: Parallelized Connection Health Checks
**Learning:** Performing sequential network-bound checks (RPC health, wallet balances) in a single API endpoint creates a latency waterfall. This cumulative delay is directly visible to the user as a "hanging" or slow-loading dashboard panel.
**Action:** Use `Promise.all` to concurrently execute independent asynchronous checks, reducing total endpoint response time to the duration of the slowest single request.

## 2026-07-03 - O(M+N) Agent Matrix Updates
**Learning:** In dashboards with high bot counts (M) and active trades (N), nested loops in UI update functions (like `updateMatrix`) lead to O(M*N) complexity which causes noticeable lag. Using a `Set` for bot ID lookups reduces this to O(M+N).
**Action:** Always pre-calculate lookup sets (e.g., `botsWithOpen`) before entering map/filter loops that iterate over the entire bot fleet.

## 2026-07-03 - Backend Network Batching and Frontend UI Throttling
**Learning:** Sequential network requests in API endpoints (like fetching multiple asset prices) create a significant latency waterfall that scales linearly with the number of items. Furthermore, high-frequency bot management functions can cause redundant DOM updates if they trigger full UI re-renders (like Matrix updates) on every single addition.
**Action:** Implemented batched CoinGecko requests in the `/api/market/prices` endpoint and added a `silent` parameter to `addBot` to allow throttling UI updates during mass bot commissioning.

## 2026-07-06 - UI Event Throttling with requestAnimationFrame
**Learning:** In dashboards driven by high-frequency asynchronous events (like rapid trade executions or multiple bot updates), synchronous UI update functions that perform O(N) calculations and DOM manipulation can stack up multiple calls within a single browser frame. This leads to redundant CPU work and potential "jank" as the main thread struggles to clear the task queue between frames.
**Action:** Implement a throttling wrapper using `requestAnimationFrame` and a "pending" flag for expensive UI render functions. This ensures that regardless of event burst frequency, the application only performs one calculation and render pass per display frame, significantly smoothing the UX during periods of high activity.

## 2026-07-08 - Visibility Guards and Single-Pass Rolling Metrics
**Learning:** Collapsible dashboard panels often trigger expensive O(N) re-renders even when hidden from view. Adding simple "is open" guards to these render functions eliminates unnecessary DOM churn. Furthermore, calculating rolling window metrics (like win rate over the last N trades) should be done via a backwards loop to achieve O(window) complexity instead of O(N) full array traversals.
**Action:** Always implement visibility guards for render functions tied to collapsible UI sections. Refactor rolling metrics to walk backwards from the end of the dataset.

## 2026-07-08 - Multi-Factor UI Consolidation
**Learning:** High-frequency applications often have multiple disparate functions updating different parts of the same UI component (e.g., the global header). Running these independently leads to redundant DOM queries, layout thrashing, and multiple 'requestAnimationFrame' overheads. Furthermore, updates that only check one piece of state (like balance) may miss the need to refresh when a related piece of state (like open trade count) changes.
**Action:** Consolidate related UI updates into a single "Master" update function (like 'updateLiveBalance'). Implement a multi-factor dirty-check that evaluates all relevant state variables (balance, P&L, counts) simultaneously to trigger a single, atomic DOM update pass per display frame.

## 2026-07-12 - Defensive requestAnimationFrame Scheduling
**Learning:** Throttling UI updates with `requestAnimationFrame` is a good practice, but scheduling the frame callback itself can be a source of overhead if triggered at high frequency (e.g., from multiple asynchronous trade events) when the panel is hidden or data hasn't changed.
**Action:** Move visibility and data-change guards *before* the `requestAnimationFrame` call to prevent unnecessary frame registrations.

## 2026-07-13 - Consolidated Header Ticker and O(N) Traversals
**Learning:** Consolidating disparate O(N) traversals (like P&L calculation and nearest exit search) into a single pass not only reduces CPU cycles but also provides a natural point for synchronizing related DOM updates into a single `requestAnimationFrame` block. This eliminates potential visual "stutter" where different parts of a component (like a header) update in different display frames.
**Action:** When multiple metrics depend on the same dataset (e.g., `openPositions`), always prefer a manual `for` loop that aggregates all required data in a single pass, and perform all associated UI writes within the same animation frame.
