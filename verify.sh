#!/bin/bash
# TRADE ARENA - Installation & Verification Script
# Run this to verify all files are present and working

echo "🤖 TRADE ARENA - Project Verification"
echo "====================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Track results
TOTAL=0
PASSED=0
FAILED=0

# Function to check file
check_file() {
    TOTAL=$((TOTAL + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌${NC} $1"
        FAILED=$((FAILED + 1))
    fi
}

# Check frontend files
echo "📁 Frontend Files:"
check_file "index.html"
check_file "app.js"
check_file "trading-engine.js"
check_file "contract-helpers.js"
echo ""

# Check backend files
echo "🖥️ Backend Files:"
check_file "server.js"
check_file "package.json"
check_file ".env"
echo ""

# Check documentation
echo "📖 Documentation:"
check_file "README.md"
check_file "QUICKSTART.md"
check_file "PROJECT_SUMMARY.md"
check_file "DEPLOYMENT.md"
check_file "FILES.md"
check_file "LICENSE.md"
check_file "FILES_INDEX.html"
echo ""

# Check testing
echo "🧪 Testing:"
check_file "tests.js"
echo ""

# Summary
echo "====================================="
echo "📊 Verification Results:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All files present! Ready to use.${NC}"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Open index.html in your browser"
    echo "2. Click 'DEMO MODE' to test"
    echo "3. Read QUICKSTART.md for setup"
    echo ""
    echo "For backend (optional):"
    echo "npm install"
    echo "npm start"
else
    echo -e "${RED}❌ Some files are missing!${NC}"
    echo "Please ensure all files are in the correct directory."
fi

echo ""
echo "📞 Support: Check README.md for documentation"
echo "🔗 Live: Open index.html in browser"
echo ""
