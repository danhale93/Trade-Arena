# Node.js Memory Profiling for HFT Arbitrage

In high-frequency trading (HFT), **Garbage Collection (GC) pauses** are the enemy of latency. This guide explains how to profile the memory footprint of your Trade-Arena bot and optimize it for sustained 100+ TPS performance.

---

## 1. Key Memory Metrics

When profiling your bot, monitor these four metrics provided by `process.memoryUsage()`:

| Metric | Meaning | HFT Impact |
| :--- | :--- | :--- |
| **RSS** | Total memory allocated for the process. | High RSS can lead to OS-level swapping (latency death). |
| **Heap Used** | Memory actually used by V8 objects. | Large heap size increases GC pause duration. |
| **External** | Memory used by C++ objects (Buffers, RPC connections). | Not managed by V8 GC, but can still cause OOM. |
| **ArrayBuffers** | Raw memory used for network packets. | Efficient, but must be managed carefully to avoid leaks. |

---

## 2. How to Profile

### A. Real-Time Snapshot
Run the specialized profiling script I've added to your repository:
```bash
# --expose-gc allows the script to trigger manual GC for leak detection
node --expose-gc scripts/profile-memory-hft.js
```

### B. Chrome DevTools (Visual)
You can connect the Chrome debugger to your running bot to see a visual heap graph:
1.  Start the bot with the inspect flag:
    ```bash
    node --inspect public/server.js
    ```
2.  Open Chrome and navigate to: `chrome://inspect`
3.  Click **"Open dedicated DevTools for Node"**.
4.  Go to the **Memory** tab and take a **Heap Snapshot** or record an **Allocation Instrumentation Timeline**.

---

## 3. Reducing GC Pressure (HFT Optimizations)

To maintain a flat memory footprint and avoid "Stop-the-World" GC pauses:

1.  **Object Pooling**: Instead of creating a new `quote` object 100 times per second, reuse a pre-allocated pool of objects.
2.  **Avoid String Concatenation**: In your logging and alert logic, use `Buffer` or join arrays instead of `+` to prevent creating thousands of short-lived string objects.
3.  **Buffer Reuse**: For high-frequency RPC calls, reuse `Uint8Array` or `Buffer` instances for data parsing.
4.  **Queue Management**: Ensure your `alertQueue` has a maximum size. If the notification API is down, a growing queue will eventually trigger a massive GC event or OOM [1].

---

## 4. Advanced Node.js Flags

For production HFT environments, consider these V8 tuning flags:

*   `--max-old-space-size=4096`: Increases the heap limit (prevents premature OOM).
*   `--nouse-idle-notification`: Disables GC during idle time (prevents unpredictable pauses).
*   `--trace-gc`: Prints every GC event and its duration to the terminal.

---

## References

[1] MetaMask Agent Trading Operations Skill Documentation (`/home/ubuntu/skills/metamask-agent-trading-ops/SKILL.md`).
