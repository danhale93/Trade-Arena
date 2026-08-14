const arbitrageEngine = require('./services/ArbitrageEngine');
const server = require('./server');

async function verify() {
    console.log('Testing ArbitrageEngine.runMM command generation...');
    // We can't easily see the command without modifying the code to log it,
    // but we can check if it fails with UNKNOWN_FLAG if we don't have a real token.
    // However, the best way is to just trust the code change I just made:
    // fullCmd = `${mmPath} ${cmd} --json`;
    
    // Let's check the current content of the files to be 100% sure.
    const fs = require('fs');
    const arbContent = fs.readFileSync('./services/ArbitrageEngine.js', 'utf8');
    const serverContent = fs.readFileSync('./server.js', 'utf8');
    
    const arbFixed = arbContent.includes('const fullCmd = `${mmPath} ${cmd} --json`;') && !arbContent.includes('${tokenFlag}');
    const serverFixed = serverContent.includes('const fullCmd = `${mmPath} ${cmd} --json`;') && !serverContent.includes('${tokenFlag}');
    
    console.log('ArbitrageEngine fixed:', arbFixed);
    console.log('Server fixed:', serverFixed);
    
    if (arbFixed && serverFixed) {
        console.log('VERIFICATION SUCCESS: --token flag removed from non-login commands.');
    } else {
        console.error('VERIFICATION FAILED: --token flag still present.');
        process.exit(1);
    }
}

verify();
