#!/bin/bash
# ==============================================================================
# HFT MEMORY STRESS TEST RUNNER (scripts/stress-memory.sh)
# Executes the sustained memory stress-profiler under optimal HFT V8 tuning flags.
# ==============================================================================

# Ensure execution flags are set properly
set -e

# Default configurations (can be overridden by environment variables)
export TRADES_PER_SECOND=${TRADES_PER_SECOND:-100}
export TEST_DURATION_MINUTES=${TEST_DURATION_MINUTES:-2}

# Use node to evaluate the floating point math cleanly
TOTAL_TRADES=$(node -e "console.log(Math.round($TRADES_PER_SECOND * 60 * $TEST_DURATION_MINUTES))")

echo "======================================================================"
echo "🎯 STARTING HIGH-FREQUENCY TRADING (HFT) MEMORY STRESS TEST"
echo "======================================================================"
echo "⚙️  Target Intensity  : $TRADES_PER_SECOND Trades/Second (TPS)"
echo "⏱️  Test Duration     : $TEST_DURATION_MINUTES Minutes"
echo "📈 Total Transactions : $TOTAL_TRADES simulations"

# Apply HFT V8 Tuning Flags as per V8_TUNING_GUIDE.md:
# 1. --expose-gc: Allows manual heap sweep invocation during post-load analysis.
# 2. --max-semi-space-size=256: Dramatically reduces Minor GC frequency and pause times.
# 3. --max-old-space-size=4096: Maximizes heap tolerance to avoid OOM under 100+ TPS bursts.
# 4. --nouse-idle-notification: Stops the engine from doing random, jittery background GC cleanup.
# 5. --incremental-marking: Interleaves Major GC marking chunks to spread/minimize latency spikes.
V8_FLAGS="--expose-gc --max-semi-space-size=256 --max-old-space-size=4096 --nouse-idle-notification --incremental-marking"

echo "🛠️  Applying V8 Tuning Flags:"
echo "    $V8_FLAGS"
echo "======================================================================"

# Run the memory profiler using node with the specified V8 tuning flags
node $V8_FLAGS scripts/profile-memory-hft.js
