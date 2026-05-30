// Test script for regime classification functions
// Since the functions are defined globally in crucible-test.js, we need to load the file first
const fs = require('fs');
const vm = require('vm');

// Load the crucible-test.js file
const code = fs.readFileSync('./crucible-test.js', 'utf8');

// Create a context and run the code to define the global functions
const context = {};
vm.createContext(context); // For Node.js vm module
vm.runInContext(code, context);

// Now the functions should be in the context
const { calculateRSI, calculateATR, calculateSMA, classifyRegime } = context;

console.log('Testing regime classification functions...\n');

// Test RSI calculation
console.log('Testing RSI:');
const prices = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 110, 108, 107, 106, 105];
const rsi = calculateRSI(prices, 14);
console.log(`RSI for ${prices}: ${rsi.toFixed(2)}`);

// Test ATR calculation
console.log('\nTesting ATR:');
const highs = [102, 104, 103, 105, 107, 106, 108, 110, 109, 111, 112, 110, 109, 108, 107];
const lows = [99, 101, 100, 102, 104, 103, 105, 107, 105, 108, 109, 107, 106, 105, 104];
const closes = [101, 103, 102, 104, 106, 105, 107, 109, 108, 110, 111, 109, 108, 107, 106];
const atrPercent = calculateATR(highs, lows, closes, 14);
console.log(`ATR% for given data: ${atrPercent.toFixed(2)}%`);

// Test SMA calculation
console.log('\nTesting SMA:');
const sma = calculateSMA(closes, 5);
console.log(`SMA (5-period) for last 5 closes [${closes.slice(-5)}]: ${sma.toFixed(2)}`);

// Test regime classification
console.log('\nTesting Regime Classification:');
console.log('BULL condition (RSI > 60 AND price > SMA):');
const bullRegime = classifyRegime(65, 2.0, 110, 105); // RSI > 60, price > SMA
console.log(`RSI=65, ATR%=2.0, Price=110, SMA=105 → ${bullRegime}`);

console.log('\nBEAR condition (RSI < 40 AND price < SMA):');
const bearRegime = classifyRegime(35, 2.0, 100, 105); // RSI < 40, price < SMA
console.log(`RSI=35, ATR%=2.0, Price=100, SMA=105 → ${bearRegime}`);

console.log('\nHIGH_VOL condition (ATR% > 5%):');
const highVolRegime = classifyRegime(50, 6.0, 105, 105); // ATR% > 5%
console.log(`RSI=50, ATR%=6.0, Price=105, SMA=105 → ${highVolRegime}`);

console.log('\nCHOP condition (everything else):');
const chopRegime = classifyRegime(50, 2.0, 105, 105); // Neutral conditions
console.log(`RSI=50, ATR%=2.0, Price=105, SMA=105 → ${chopRegime}`);

console.log('\nAll tests completed!');