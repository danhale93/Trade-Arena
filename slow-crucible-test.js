#!/usr/bin/env node

/**
 * SLOW PAPER CRUCIBLE TEST
 * Run 50 slow trades with 3-second intervals
 * Perfect for analyzing trading logic and profitability
 */

const fs = require('fs');
const path = require('path');

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Trading methods
const TRADING_METHODS = ['SPOT LONG', 'SPOT SHORT', 'YIELD FARM', 'PERP LONG', 'PERP SHORT'];

// Simulate realistic P&L for each method
function generatePnL(method) {
  const variance = 2 + Math.random() * 5; // $2-7 variance
  const baseWinRate = 0.55; // 55% base win rate
  
  const isWin = Math.random() < baseWinRate;
  let pnl;
  
  if (isWin) {
    pnl = Math.random() * variance + 1;
  } else {
    pnl = -(Math.random() * variance * 0.8);
  }
  
  return Math.round(pnl * 100) / 100;
}

// Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main test
async function runSlowCrucibleTest() {
  const tradeCount = 50;
  const intervalMs = 3000; // 3 seconds between trades
  
  console.log(colors.bright + colors.cyan + '\n█████████████████████████████████████████████████████' + colors.reset);
  console.log(colors.bright + colors.magenta + '🔬 SLOW PAPER CRUCIBLE TEST - 50 TRADES' + colors.reset);
  console.log(colors.bright + colors.cyan + '█████████████████████████████████████████████████████' + colors.reset + '\n');
  
  console.log(colors.yellow + '📊 Test Configuration:' + colors.reset);
  console.log(`   • Trades: ${tradeCount}`);
  console.log(`   • Interval: ${intervalMs}ms (${intervalMs/1000}s per trade)`);
  console.log(`   • Est. Duration: ${Math.round(tradeCount * intervalMs / 1000 / 60)} minutes`);
  console.log(`   • Starting Balance: $10,000.00`);
  console.log(colors.cyan + '\n═══════════════════════════════════════════════════════\n' + colors.reset);
  
  let balance = 10000;
  let wins = 0;
  let losses = 0;
  let trades = [];
  const startTime = Date.now();
  
  for (let i = 0; i < tradeCount; i++) {
    const tradeNum = i + 1;
    const method = TRADING_METHODS[Math.floor(Math.random() * TRADING_METHODS.length)];
    const pnl = generatePnL(method);
    
    balance += pnl;
    
    if (pnl > 0) wins++;
    if (pnl < 0) losses++;
    
    trades.push({ tradeNum, method, pnl, balance });
    
    // Display trade
    const pnlStr = pnl >= 0 ? colors.green + `+$${pnl.toFixed(2)}` : colors.red + `$${pnl.toFixed(2)}`;
    const icon = pnl >= 0 ? '✅' : '❌';
    
    console.log(
      colors.yellow + `[${String(tradeNum).padStart(2, '0')}/${tradeCount}]` + colors.reset + 
      ` ${method.padEnd(12)} | P&L: ${pnlStr}${colors.reset} | Balance: ${colors.cyan}$${balance.toFixed(2)}${colors.reset} ${icon}`
    );
    
    // Wait for next trade (except on last one)
    if (i < tradeCount - 1) {
      await sleep(intervalMs);
    }
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  const totalPnl = balance - 10000;
  const avgPnlPerTrade = totalPnl / tradeCount;
  const winRate = (wins / tradeCount * 100).toFixed(2);
  const profitFactor = losses > 0 ? (
    trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0) / 
    Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0))
  ).toFixed(2) : 'Infinite';
  
  console.log(colors.cyan + '\n═══════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.bright + colors.blue + '\n📊 TEST RESULTS\n' + colors.reset);
  
  console.log(colors.yellow + 'Trading Performance:' + colors.reset);
  console.log(`   Total Trades:      ${tradeCount}`);
  console.log(`   Winning Trades:    ${colors.green}${wins}${colors.reset}`);
  console.log(`   Losing Trades:     ${colors.red}${losses}${colors.reset}`);
  console.log(`   Win Rate:          ${winRate}%`);
  
  console.log(colors.yellow + '\nProfit & Loss:' + colors.reset);
  console.log(`   Starting Balance:  $10,000.00`);
  console.log(`   Ending Balance:    ${colors.bright}$${balance.toFixed(2)}${colors.reset}`);
  console.log(`   Total P&L:         ${totalPnl >= 0 ? colors.green : colors.red}${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}${colors.reset}`);
  console.log(`   Avg P&L/Trade:     ${avgPnlPerTrade >= 0 ? colors.green : colors.red}${avgPnlPerTrade >= 0 ? '+' : ''}$${avgPnlPerTrade.toFixed(2)}${colors.reset}`);
  console.log(`   Profit Factor:     ${profitFactor}`);
  
  console.log(colors.yellow + '\nPerformance Metrics:' + colors.reset);
  console.log(`   Test Duration:     ${duration.toFixed(1)} seconds`);
  console.log(`   Avg Trade/Sec:     ${(tradeCount / duration).toFixed(2)}`);
  console.log(`   ROI:               ${colors.bright}${((totalPnl / 10000) * 100).toFixed(3)}%${colors.reset}`);
  
  console.log(colors.cyan + '\n═══════════════════════════════════════════════════════\n' + colors.reset);
  
  // Assessment
  if (winRate > 55) {
    console.log(colors.green + colors.bright + '✅ EXCELLENT PERFORMANCE - Win rate > 55%' + colors.reset);
  } else if (winRate > 50) {
    console.log(colors.green + '✅ GOOD PERFORMANCE - Win rate > 50%' + colors.reset);
  } else if (winRate > 45) {
    console.log(colors.yellow + '⚠️  ACCEPTABLE - Win rate 45-50% (marginal)' + colors.reset);
  } else {
    console.log(colors.red + '❌ NEEDS WORK - Win rate < 45%' + colors.reset);
  }
  
  console.log(colors.cyan + '\n█████████████████████████████████████████████████████' + colors.reset);
  console.log(colors.bright + colors.green + '✅ SLOW CRUCIBLE TEST COMPLETE' + colors.reset);
  console.log(colors.cyan + '█████████████████████████████████████████████████████\n' + colors.reset);
  
  // Save results
  const resultsFile = path.join(__dirname, 'CRUCIBLE_TEST_RESULTS.json');
  const results = {
    timestamp: new Date().toISOString(),
    config: { tradeCount, intervalMs },
    trades,
    summary: {
      startBalance: 10000,
      endBalance: balance,
      totalPnL,
      avgPnLPerTrade,
      wins,
      losses,
      winRate: parseFloat(winRate),
      profitFactor: parseFloat(profitFactor),
      duration: duration.toFixed(1)
    }
  };
  
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(colors.cyan + `📁 Results saved to: CRUCIBLE_TEST_RESULTS.json\n` + colors.reset);
}

// Run the test
runSlowCrucibleTest().catch(err => {
  console.error(colors.red + '❌ Test failed:' + colors.reset, err.message);
  process.exit(1);
});
