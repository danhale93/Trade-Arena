const { ethers } = require('ethers');
const DEFAULT_WALLET = '0x2ca1f801c1e19d16160c982c627e2932e95117be';

async function simulate() {
    const resolvedAddress = DEFAULT_WALLET;
    const currentEthPrice = '3200';
    
    console.log('Target Address:', resolvedAddress);
    
    try {
        const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
        const rawBal = await provider.getBalance(resolvedAddress);
        const ethBalanceFormatted = ethers.formatEther(rawBal);
        const resolvedBalance = (parseFloat(ethBalanceFormatted) * parseFloat(currentEthPrice)).toFixed(2);
        
        console.log('ETH Balance:', ethBalanceFormatted);
        console.log('USD Balance:', resolvedBalance);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

simulate();
