# Real-Time V8 & GC Monitoring

This guide explains how to monitor Node.js V8 heap usage and Garbage Collection (GC) pause durations in real-time using **Prometheus** and **Grafana**.

---

## 1. Exported Metrics

The **Trade-Arena** bot now exports the following runtime health metrics via the `/metrics` endpoint:

| Metric | Type | Description |
| :--- | :--- | :--- |
| `nodejs_v8_heap_stats_bytes` | Gauge | Real-time V8 heap statistics (used, total, limit, available). |
| `nodejs_gc_duration_seconds` | Histogram | Duration of Minor (Scavenge) and Major (Mark-Sweep) GC events. |
| `process_cpu_user_seconds_total` | Counter | CPU time spent in user mode. |
| `process_resident_memory_bytes` | Gauge | Total memory used by the process (RSS). |

---

## 2. Grafana Dashboard Configuration

To visualize these metrics, create a new Grafana dashboard and add the following panels:

### A. V8 Heap Usage (Gauge & Time Series)
*   **Query**: `nodejs_v8_heap_stats_bytes{stat="used_heap_size"}`
*   **Goal**: Monitor how much memory your bot is actively using. Spikes here correlate with high-frequency trading bursts.

### B. GC Pause Duration (Heatmap)
*   **Query**: `sum by (le) (rate(nodejs_gc_duration_seconds_bucket[1m]))`
*   **Goal**: Identify "Stop-the-World" pauses. In HFT, we want to see most events in the `< 2ms` buckets.

### C. Memory Fragmentation (Gauge)
*   **Query**: `(nodejs_v8_heap_stats_bytes{stat="total_heap_size"} - nodejs_v8_heap_stats_bytes{stat="used_heap_size"}) / nodejs_v8_heap_stats_bytes{stat="total_heap_size"}`
*   **Goal**: High fragmentation (> 30%) indicates that V8 is struggling to find contiguous memory, which can lead to longer Major GCs.

---

## 3. Alerting on Performance Degradation

We recommend setting up the following alerts in Grafana or Prometheus Alertmanager:

1.  **High GC Latency**: `histogram_quantile(0.99, sum by (le) (rate(nodejs_gc_duration_seconds_bucket[1m]))) > 0.05`
    *   *Triggers if 99% of GC events take longer than 50ms.*
2.  **Memory Leak Detection**: `predict_linear(nodejs_v8_heap_stats_bytes{stat="used_heap_size"}[1h], 3600) > nodejs_v8_heap_stats_bytes{stat="heap_size_limit"}`
    *   *Predicts if the bot will hit the heap limit in the next hour based on the current growth rate.*

---

## 4. Integration with V8 Tuning

Use these real-time metrics to validate your V8 flags:
*   If `nodejs_gc_duration_seconds` shows frequent **Minor** GCs, increase `--max-semi-space-size`.
*   If `used_heap_size` is consistently near the limit, increase `--max-old-space-size`.

---

## References

[1] prom-client Documentation: https://github.com/siimon/prom-client
[2] Node.js perf_hooks API: https://nodejs.org/api/perf_hooks.html
