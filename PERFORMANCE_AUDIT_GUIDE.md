# Automated Performance Auditing with Clinic.js

To ensure the **Trade-Arena** bot maintains its HFT edge, we've integrated **Clinic.js** for automated performance auditing and heap dump analysis.

---

## 1. The Audit Suite

We use three primary Clinic.js tools to profile the bot:

| Tool | Focus | HFT Insight |
| :--- | :--- | :--- |
| **Clinic Doctor** | Event Loop & I/O | Identifies if the event loop is blocked by synchronous CLI calls. |
| **Clinic Bubbleprof** | Async Flow | Visualizes the latency of multi-chain RPC calls and notification retries. |
| **Clinic HeapProfiler** | Memory Allocation | Pinpoints exactly which functions are creating the most garbage. |

---

## 2. Local Execution

You can run the full audit suite locally using the provided shell script:

```bash
chmod +x scripts/run-performance-audit.sh
./scripts/run-performance-audit.sh
```

The script will run the bot under load for 30 seconds and generate interactive HTML reports in `reports/performance/`.

---

## 3. CI/CD Integration (GitHub Actions)

The repository is now configured with a GitHub Actions workflow (`.github/workflows/performance-audit.yml`) that triggers on every push or pull request to the `main` branch.

### How to Access CI Reports:
1.  Go to the **Actions** tab in your GitHub repository.
2.  Select the latest **Performance Audit** run.
3.  Scroll down to **Artifacts** and download `performance-reports.zip`.
4.  Open the `.html` files in your browser to view the deep analysis.

---

## 4. Interpreting Heap Dumps

When viewing the **HeapProfiler** report:
*   **Flame Graph**: Look for wide bars; these represent functions consuming the most memory.
*   **Top Allocators**: Focus on the `sendAlerts` and `executeCli` paths. If you see high allocations here, consider implementing object pooling.

---

## References

[1] Clinic.js Official Documentation: https://clinicjs.org/
[2] Node.js Performance Best Practices: https://nodejs.org/en/docs/guides/simple-profiling/
