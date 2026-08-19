#!/bin/bash
# Trade-Arena Autonomous Startup Script

# 1. Load NVM and use correct Node version
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22.18

# 2. Navigate to project directory
cd "$(dirname "$0")"

# 3. Start the worker in the background using PM2 (recommended) or direct Node
if command -v pm2 &> /dev/null
then
    echo "🚀 Starting Autonomous Worker with PM2..."
    pm2 start scripts/autonomous-arb.js --name "trade-arena-arb" --log logs/arb.log
else
    echo "🚀 Starting Autonomous Worker with Node..."
    node scripts/autonomous-arb.js >> logs/arb.log 2>&1 &
    echo "✅ Worker started in background. Logs available at logs/arb.log"
fi
