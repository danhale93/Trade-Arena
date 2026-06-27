const fs = require('fs');
const { execSync } = require('child_process');

console.log("Running final pre-commit checks...");

const requiredFiles = [
    'contracts/src/PayoutManager.sol',
    'contracts/src/FlashloanArbitrage.sol',
    'contracts/src/MockUSDC.sol',
    'services/payouts/payoutService.js',
    'services/payouts/biconomyNexus.js',
    'services/flashloans/flashloanService.js',
    'routes/payoutRoutes.js',
    '.env.example',
    'contracts/foundry.toml'
];

requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        console.error(`CRITICAL: Missing file ${file}`);
        process.exit(1);
    }
});

console.log("Checking for PayoutManager server integration...");
const serverContent = fs.readFileSync('server.js', 'utf8');
if (!serverContent.includes('payoutRoutes') || !serverContent.includes('/api/v1/payouts')) {
    console.error("CRITICAL: payoutRoutes not correctly integrated in server.js");
    process.exit(1);
}

console.log("Verifying Node.js dependencies in package.json...");
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = pkg.dependencies || {};
if (!deps['@biconomy/abstractjs'] || !deps['@biconomy/account'] || !deps['viem']) {
    console.error("CRITICAL: Missing dependencies in package.json");
    process.exit(1);
}

console.log("All systems verified!");
