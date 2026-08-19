#!/bin/bash
# PERFORMANCE AUDIT SCRIPT
# Runs the HFT load test under Clinic.js to generate deep performance insights.

echo "🚀 Starting Clinic.js Performance Audit..."

# 1. Ensure Clinic.js is installed
if ! command -v clinic &> /dev/null
then
    echo "📦 Installing Clinic.js..."
    npm install -g clinic
fi

# 2. Create reports directory
mkdir -p reports/performance

# 3. Run Clinic Doctor (Event Loop & Health)
echo "🩺 Running Clinic Doctor (30s)..."
clinic doctor --on-port 'node scripts/load-test-notifications.js' --dest reports/performance/doctor.html

# 4. Run Clinic Bubbleprof (Async latency)
echo "🫧 Running Clinic Bubbleprof (30s)..."
clinic bubbleprof --on-port 'node scripts/load-test-notifications.js' --dest reports/performance/bubbleprof.html

# 5. Run Clinic HeapProfiler (Memory allocations)
echo "💎 Running Clinic HeapProfiler (30s)..."
clinic heapprofiler --on-port 'node scripts/load-test-notifications.js' --dest reports/performance/heapprofiler.html

echo "🏁 Audit Complete. Reports generated in reports/performance/"
