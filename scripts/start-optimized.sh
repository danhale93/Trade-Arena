#!/bin/bash
# OPTIMIZED STARTUP SCRIPT
# Applies V8 tuning flags for HFT performance.

PROFILE=${1:-"balanced"}

echo "🚀 Starting Trade-Arena with profile: $PROFILE"

case $PROFILE in
  "hft")
    # Aggressive HFT Profile
    # - Large semi-space to reduce Minor GC frequency
    # - Large old-space to prevent Major GC OOM
    # - Disable idle notifications to prevent background jitter
    # - Incremental marking to spread Major GC cost
    FLAGS="--max-semi-space-size=256 --max-old-space-size=4096 --nouse-idle-notification --incremental-marking"
    ;;
  "balanced")
    # Balanced Production Profile
    FLAGS="--max-semi-space-size=64 --max-old-space-size=2048"
    ;;
  "debug")
    # Debug Profile with GC tracing
    FLAGS="--trace-gc --max-semi-space-size=64 --max-old-space-size=2048"
    ;;
  *)
    echo "❌ Unknown profile: $PROFILE. Using default."
    FLAGS=""
    ;;
esac

echo "🛠️ V8 Flags: $FLAGS"
node $FLAGS server.js
