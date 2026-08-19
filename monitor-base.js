const { execSync } = require('child_process');

const mmPath = '/home/ubuntu/.nvm/versions/node/v22.18.0/bin/mm';
const nodePath = '/home/ubuntu/.nvm/versions/node/v22.18.0/bin/node';

function runMM(cmd) {
    try {
        const output = execSync(`${nodePath} ${mmPath} ${cmd} --json`, { 
            encoding: 'utf8',
            env: { ...process.env }
        });
        return JSON.parse(output);
    } catch (e) {
        console.error(`Error running mm ${cmd}:`, e.message);
        return null;
    }
}

async function monitor() {
    console.log('--- BASE MAINNET MONITOR ---');
    
    // 1. Check Gas Price (estimated from ETH price and network fees)
    console.log('\nFetching Gas Info...');
    const balance = runMM('wallet balance --chain base');
    if (balance && balance.ok) {
        const eth = balance.data.chains[0]?.tokens.find(t => t.token === 'ETH');
        console.log(`Wallet ETH Balance: ${eth?.amount || '0'} ETH ($${eth?.usdValue || '0'})`);
    }

    // 2. Check Recent Transactions
    console.log('\nRecent Transactions:');
    const history = runMM('tx history --chain-ids 8453');
    if (history && history.ok && history.data.transactions) {
        history.data.transactions.slice(0, 5).forEach(tx => {
            console.log(`- [${tx.status.toUpperCase()}] ${tx.readable} | Hash: ${tx.hash.slice(0, 10)}...`);
        });
    } else {
        console.log('No recent transactions found.');
    }

    // 3. Current ETH Price
    const price = runMM('price spot --asset-ids "eip155:8453/slip44:60"');
    if (price && price.ok && price.data) {
        const ethPrice = price.data.find(p => p.assetId === 'eip155:8453/slip44:60')?.price;
        console.log(`\nCurrent ETH Price (Base): $${ethPrice || 'N/A'}`);
    }
}

monitor();
