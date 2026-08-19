const { ethers } = require('ethers');

async function check() {
    const addresses = [
        '0x92CEAf1CA43deCfc443A34B915B45343BeE9c2DB',
        '0x2ca1f801c1e19d16160c982c627e2932e95117be',
        '0x0347D6d0331F5C84B198Bf8C08107b7A6d5F29Ba',
        '0xf26279A149A7a33385614Db2E3bbCfb19FC729e1'
    ];
    const rpc = 'https://mainnet.base.org';
    const provider = new ethers.JsonRpcProvider(rpc);
    
    const usdc = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
    const abi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];
    
    for (const addr of addresses) {
        try {
            const ethBal = await provider.getBalance(addr);
            const contract = new ethers.Contract(usdc, abi, provider);
            const usdcBal = await contract.balanceOf(addr);
            const decimals = await contract.decimals();
            console.log(`Address: ${addr} | ETH: ${ethers.formatEther(ethBal)} | USDC: ${ethers.formatUnits(usdcBal, decimals)}`);
        } catch (e) {
            console.log(`Address: ${addr} | Error: ${e.message}`);
        }
    }
}

check();
