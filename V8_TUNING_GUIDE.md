# V8 Tuning Guide for HFT Arbitrage

This guide explains how to translate **Clinic.js** profiling results into optimized **Node.js V8 flags** to minimize Garbage Collection (GC) pauses and maximize trade execution speed.

---

## 1. Mapping Clinic.js Results to V8 Flags

### A. From Clinic Doctor: High Event Loop Delay
If the Doctor report shows frequent spikes in Event Loop Delay, it usually indicates that the GC is "stopping the world" to clean up memory.
*   **Observation**: Event Loop Delay > 50ms during bursts.
*   **Optimization**: Disable idle notifications and increase the semi-space size.
*   **Flags**: `--nouse-idle-notification --max-semi-space-size=64`

### B. From HeapProfiler: Frequent Minor GCs (Scavenge)
If you see a high frequency of "Minor GC" events in the allocation timeline, your "New Space" (where new objects are created) is too small, forcing V8 to clean it constantly.
*   **Observation**: Hundreds of Minor GCs per minute.
*   **Optimization**: Increase the New Space (Semi-Space).
*   **Flags**: `--max-semi-space-size=128` (or 256 for extreme HFT).

### C. From HeapProfiler: Long Major GCs (Mark-Sweep)
If Major GCs are taking longer than 100ms, your "Old Space" is likely fragmented or too full.
*   **Observation**: Large drops in "Heap Used" accompanied by long pauses.
*   **Optimization**: Increase the Old Space limit and enable incremental marking.
*   **Flags**: `--max-old-space-size=4096 --incremental-marking`

---

## 2. Optimized Startup Profiles

We have provided three pre-configured startup profiles in `package.json`.

### 🚀 Profile: Aggressive HFT (Lowest Latency)
Use this when you have at least 8GB of RAM and want the absolute lowest execution latency.
```bash
npm run start:hft
```
**Flags used**:
*   `--max-semi-space-size=256`: Dramatically reduces Minor GC frequency.
*   `--max-old-space-size=4096`: Prevents premature Major GCs.
*   `--nouse-idle-notification`: Stops V8 from doing "cleanup" during idle time that might bleed into the next trade.
*   `--noconcurrent-recompilation`: Ensures CPU is focused on execution, not background JIT optimization.

### ⚖️ Profile: Balanced (Default Production)
Suitable for most production environments (Base/Arbitrum/Optimism scanning).
```bash
npm run start:balanced
```
**Flags used**:
*   `--max-semi-space-size=64`
*   `--max-old-space-size=2048`

---

## 3. Debugging GC with `--trace-gc`

If you are still experiencing latency spikes, run the bot with the trace flag to see exactly when and why GC is firing:

```bash
node --trace-gc server.js
```

**How to read the output**:
`[1234:0x5678] 100ms: Scavenge 15.5 (20.0) -> 10.2 (20.5) MB, 1.2 / 0.0 ms`
*   `1.2 ms`: This is the actual "Stop-the-World" pause time. In HFT, we aim for this to be **< 2ms** for Minor GCs and **< 20ms** for Major GCs.

---

## 4. Implementation in Trade-Arena

The startup scripts have been added to your `package.json`. You can also use the `scripts/start-optimized.sh` for manual control.

---

## References

[1] V8 Garbage Collection Internals: https://v8.dev/blog/trash-talk
[2] Node.js CLI Options: https://nodejs.org/api/cli.html#v8-options
