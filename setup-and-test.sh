#!/bin/bash
# Trade Arena Setup & Automation Script
# Run from /workspaces/Trade-Arena directory

set -e

echo "=========================================="
echo "🎮 Trade Arena Trading Engine Setup"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating template...${NC}"
    cat > .env.template << 'EOF'
# Trade Arena Configuration
# Copy this to .env and fill in your values

# REQUIRED: Your wallet private key (with 0x prefix)
SERVER_PRIVATE_KEY=

# RPC URL (leave default for Base Mainnet)
RPC_URL=https://mainnet.base.org

# Server port
PORT=3001
EOF
    echo -e "${YELLOW}Created .env.template - copy to .env and add your private key${NC}"
    echo -e "${YELLOW}Then run: cp .env.template .env && nano .env${NC}"
    exit 1
fi

# Load env vars
export $(grep -v '^#' .env | xargs)

# Check for private key
if [ -z "$SERVER_PRIVATE_KEY" ]; then
    echo -e "${RED}❌ ERROR: SERVER_PRIVATE_KEY not set in .env${NC}"
    echo -e "${YELLOW}Add your private key to .env: SERVER_PRIVATE_KEY=0x...${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Configuration loaded${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Start server in background
echo -e "${GREEN}🚀 Starting Trade Arena server...${NC}"
node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check server health
echo -e "${YELLOW}🔍 Checking server health...${NC}"
HEALTH=$(curl -s http://localhost:$PORT/api/health 2>/dev/null || echo '{"status":"DOWN"}')
echo "Health: $HEALTH"

# Get wallet address from private key
ADDRESS=$(node -e "const ethers = require('ethers'); const wallet = new ethers.Wallet('$SERVER_PRIVATE_KEY'); console.log(wallet.address);")

echo ""
echo "=========================================="
echo "👛 Wallet Address: $ADDRESS"
echo "=========================================="
echo ""

# Check balances
echo -e "${YELLOW}📊 Checking token balances...${NC}"
BALANCES=$(curl -s "http://localhost:$PORT/api/tokens/balances?address=$ADDRESS")
echo "$BALANCES" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
console.log('\\nToken Balances:');
for (const [symbol, info] of Object.entries(data.balances)) {
    console.log(\`  \${symbol}: \${info.balance.toFixed(4)}\`);
}
console.log(\`\\nETH Price: $\${data.ethPriceUSD.toFixed(2)}\`);
"

echo ""
echo "=========================================="
echo "🔄 Testing Swap Quote (READ-ONLY)...${NC}"
echo "=========================================="

# Test quote for WETH -> USDC
echo -e "${YELLOW}Getting quote for 0.01 WETH -> USDC...${NC}"
QUOTE=$(curl -s -X POST http://localhost:$PORT/api/execute/swap \
    -H "Content-Type: application/json" \
    -d '{"fromToken": "WETH", "toToken": "USDC", "amount": "0.01", "slippage": 0.5}')

echo "$QUOTE" | node -e "
const d = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
if (d.success) {
    console.log(\`\\n✅ Quote received:\`);
    console.log(\`   From: \${d.quote.amountIn} WETH\`);
    console.log(\`   To: \${d.quote.amountOut.toFixed(2)} USDC\`);
    console.log(\`   Min Out: \${d.quote.amountOutMin.toFixed(2)} USDC\`);
    console.log(\`   Gas Price: \${d.gas.gasPriceGwei} gwei\`);
} else {
    console.log('❌ Quote failed:', d.error);
}
"

echo ""
echo "=========================================="
echo "📈 Market Prices${NC}"
echo "=========================================="
PRICES=$(curl -s "http://localhost:$PORT/api/market/prices?symbols=WETH,USDC,ARB,OP")
echo "$PRICES" | node -e "
const d = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
console.log('\\nOn-chain DEX Prices:');
for (const [symbol, info] of Object.entries(d.prices)) {
    if (info.onchain) {
        console.log(\`  \${symbol}: $\${info.onchain.usd.toFixed(2)} (on-chain)\`);
    } else if (info.usd) {
        console.log(\`  \${symbol}: $\${info.usd.toFixed(2)}\`);
    }
}
"

echo ""
echo "=========================================="
echo "🎯 Trading Commands${NC}"
echo "=========================================="
echo ""
echo "Wrap ETH to WETH:"
echo "  curl -X POST http://localhost:$PORT/api/wrap -H 'Content-Type: application/json' \\"
echo "    -d '{\"direction\": \"wrap\", \"amount\": \"0.1\"}'"
echo ""
echo "Swap WETH -> USDC (QUOTE only):"
echo "  curl -X POST http://localhost:$PORT/api/execute/swap \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"fromToken\": \"WETH\", \"toToken\": \"USDC\", \"amount\": \"0.01\", \"slippage\": 0.5}'"
echo ""
echo "Swap WETH -> USDC (EXECUTE for real):"
echo "  curl -X POST http://localhost:$PORT/api/execute/swap \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"fromToken\": \"WETH\", \"toToken\": \"USDC\", \"amount\": \"0.01\", \"slippage\": 0.5, \"execute\": true}'"
echo ""
echo "Unwrap WETH to ETH:"
echo "  curl -X POST http://localhost:$PORT/api/wrap -H 'Content-Type: application/json' \\"
echo "    -d '{\"direction\": \"unwrap\", \"amount\": \"0.1\"}'"
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup complete! Server running on port $PORT${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo "=========================================="

# Keep server running
wait $SERVER_PID