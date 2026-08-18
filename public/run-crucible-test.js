/**
 * CRUCIBLE TEST EXECUTOR
 * Runs full test with real trading data integration
 * Captures and exports results
 */

(async function() {
  console.log('');
  console.log('█████████████████████████████████████████████████████');
  console.log('🚀 CRUCIBLE TEST - REAL TRADING DATA INTEGRATION');
  console.log('█████████████████████████████████████████████████████');
  console.log('');
  
  // Wait for CrucibleTest to be available
  if (typeof CrucibleTest === 'undefined') {
    console.error('❌ ERROR: CrucibleTest system not loaded!');
    console.log('Make sure crucible-test.js is loaded in index.html');
    return;
  }
  
  console.log('✅ CrucibleTest system detected');
  console.log('');
  
  // Configuration
  const tradeCount = 20;
  const tradeInterval = 1500;
  
  console.log('📋 TEST CONFIGURATION:');
  console.log(`  • Trade Count: ${tradeCount} trades`);
  console.log(`  • Interval: ${tradeInterval}ms between trades`);
  console.log(`  • Expected Duration: ~${(tradeCount * tradeInterval / 1000).toFixed(1)} seconds`);
  console.log(`  • Integration: Real trading data (CoinGecko, Anthropic API)`);
  console.log('');
  console.log('⏱️ Starting test at: ' + new Date().toLocaleTimeString());
  console.log('');
  
  try {
    // Run the test
    await runCrucibleTest(tradeCount, tradeInterval);
    
    console.log('');
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('');
    
    // Display test results
    console.log('📊 TEST RESULTS:');
    console.log('  Session ID: ' + CrucibleTest.sessionId);
    console.log('  Total Trades: ' + CrucibleTest.trades.length);
    
    if (CrucibleTest.trades.length > 0) {
      const wins = CrucibleTest.trades.filter(t => t.pnl > 0).length;
      const losses = CrucibleTest.trades.filter(t => t.pnl < 0).length;
      const totalPnl = CrucibleTest.trades.reduce((sum, t) => sum + t.pnl, 0);
      const winRate = (wins / CrucibleTest.trades.length * 100).toFixed(2);
      
      console.log('  Wins: ' + wins);
      console.log('  Losses: ' + losses);
      console.log('  Win Rate: ' + winRate + '%');
      console.log('  Total P&L: $' + totalPnl.toFixed(2));
    }
    
    console.log('');
    console.log('💾 EXPORT OPTIONS:');
    console.log('  • exportCrucibleJSON() - Download detailed JSON');
    console.log('  • exportCrucibleCSV() - Download CSV for spreadsheet');
    console.log('');
    console.log('✨ Test ready for review and validation!');
    console.log('');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error(error);
  }
})();
