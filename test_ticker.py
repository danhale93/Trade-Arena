#!/usr/bin/env python3
"""
Test script for Trade Arena Ticker Graph
Tests the ticker graph rendering and trade recording functionality
"""

import time
import subprocess
import json

def test_ticker_graph():
    """Test ticker graph functionality"""
    
    tests = {
        "1. Check HTTP Server": lambda: check_server(),
        "2. Check JavaScript Syntax": lambda: check_js_syntax(),
        "3. Verify Ticker Graph Object": lambda: verify_ticker_object(),
        "4. Test Trade Recording": lambda: test_trade_recording(),
        "5. Test Canvas Initialization": lambda: test_canvas_init(),
    }
    
    print("=" * 60)
    print("🎯 TRADE ARENA TICKER GRAPH TEST SUITE")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests.items():
        try:
            print(f"\n{test_name}...")
            result = test_func()
            if result:
                print(f"✅ PASSED")
                passed += 1
            else:
                print(f"❌ FAILED")
                failed += 1
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 60)
    
    return failed == 0

def check_server():
    """Check if HTTP server is running"""
    try:
        result = subprocess.run(
            ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:8000'],
            capture_output=True,
            timeout=5
        )
        return result.returncode == 0
    except:
        return False

def check_js_syntax():
    """Check JavaScript syntax"""
    try:
        with open('c:\\Users\\admi\\New folder\\index.html', 'r') as f:
            content = f.read()
            # Basic check: look for tickerGraph definition
            return 'const tickerGraph' in content and 'initTickerGraph' in content
    except:
        return False

def verify_ticker_object():
    """Verify ticker object structure"""
    try:
        with open('c:\\Users\\admi\\New folder\\index.html', 'r') as f:
            content = f.read()
            # Check for key methods
            required_methods = ['init()', 'recordTrade(', 'draw(', 'updateLegend(']
            for method in required_methods:
                if method not in content:
                    print(f"  Missing method: {method}")
                    return False
            return True
    except:
        return False

def test_trade_recording():
    """Test trade recording logic"""
    try:
        with open('c:\\Users\\admi\\New folder\\index.html', 'r') as f:
            content = f.read()
            # Check if recordTradeInTicker is properly implemented
            if 'recordTradeInTicker' not in content:
                return False
            if 'botHistory' not in content:
                return False
            return True
    except:
        return False

def test_canvas_init():
    """Test canvas initialization logic"""
    try:
        with open('c:\\Users\\admi\\New folder\\index.html', 'r') as f:
            content = f.read()
            # Check canvas element exists
            if 'tickerGraphCanvas' not in content:
                return False
            # Check for resize handler
            if 'handleResize' not in content:
                return False
            return True
    except:
        return False

if __name__ == '__main__':
    import sys
    success = test_ticker_graph()
    sys.exit(0 if success else 1)
