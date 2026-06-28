/**
 * WEB3 STATUS MONITOR
 * Monitors backend connectivity and Web3 readiness
 */

async function updateWeb3Status() {
    try {
        const [payoutResp, flashloanResp] = await Promise.all([
            fetch('/api/v1/payouts/status'),
            fetch('/api/v1/flashloans/status')
        ]);

        const payout = await payoutResp.json();
        const flashloan = await flashloanResp.json();

        renderWeb3Status(payout, flashloan);
    } catch (e) {
        console.error('[Web3Status] Update failed:', e);
    }
}

function renderWeb3Status(payout, flashloan) {
    const container = document.getElementById('web3StatusPanel');
    if (!container) return;

    const isReady = payout.configured && flashloan.configured;

    container.innerHTML = `
        <div style="padding:10px; background:rgba(0,0,0,0.4); border-radius:8px; border:1px solid ${isReady ? 'var(--green)' : 'var(--hot)'}; font-family:monospace; font-size:10px">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px">
                <span style="color:var(--dim)">BACKEND WEB3</span>
                <span style="color:${isReady ? 'var(--green)' : 'var(--hot)'}">${isReady ? 'OPERATIONAL' : 'SIMULATION MODE'}</span>
            </div>
            <div style="margin-bottom:3px">
                Oracle: ${payout.configured ? '✅ READY' : '❌ MISSING KEY'}
            </div>
            <div style="margin-bottom:3px">
                Bot Gas: ${flashloan.nativeBalance} ETH
            </div>
            <div style="color:var(--dim); font-size:8px; word-break:break-all">
                Mngr: ${payout.manager || 'Not Deployed'}
            </div>
        </div>
    `;
}

// Start polling
setInterval(updateWeb3Status, 10000);
updateWeb3Status();
