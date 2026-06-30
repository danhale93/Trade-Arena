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
