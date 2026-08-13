/**
 * ON-CHAIN EXECUTION ENGINE (V6 BRIDGE)
 * Trade Arena v4 • Real Money Trading on Base
 */

const ExecutionState = {
    isExecuting: false,
    lastTxHash: null,
    pendingTrades: new Map()
};

async function executeOnChainTrade(tradeRequest) {
    if (ExecutionState.isExecuting) {
        throw new Error('Execution in progress');
    }

    const { botId, token, method, amountUSD } = tradeRequest;
    console.log(`[Execution Bridge] EXECUTING: Bot #${botId} - ${method} ${token} $${amountUSD}`);

    ExecutionState.isExecuting = true;
    updateExecutionUI(botId, 'PREPARING');

    try {
        // Map token symbol to address if needed
        const tokenIn = method.includes('LONG') ? 'USDC' : token;
        const tokenOut = method.includes('LONG') ? token : 'USDC';

        updateExecutionUI(botId, 'EXECUTING');
        
        // Call the new Ethers v6 engine
        if (typeof window.executeRealSwap !== 'function') {
            throw new Error('Blockchain Engine not loaded. Please refresh.');
        }

        const result = await window.executeRealSwap(amountUSD, tokenIn, tokenOut, method);

        if (!result.success) {
            throw new Error(result.error || 'Swap failed');
        }

        ExecutionState.lastTxHash = result.txHash;
        updateExecutionUI(botId, 'COMPLETE', result.txHash);
        
        // Notify the UI about the receipt
        if (window.addOnChainReceipt) {
            window.addOnChainReceipt(result);
        }

        ExecutionState.isExecuting = false;
        return result;

    } catch (e) {
        ExecutionState.isExecuting = false;
        updateExecutionUI(botId, 'ERROR', e.message);
        console.error('[Execution Bridge] Trade failed:', e);
        throw e;
    }
}

function updateExecutionUI(botId, status, detail = '') {
    const el = document.getElementById('mtick-' + botId);
    if (!el) return;

    const colors = {
        'PREPARING': 'var(--dim)',
        'EXECUTING': 'var(--blue)',
        'SIGNING': 'var(--amber)',
        'MINING': 'var(--purple)',
        'COMPLETE': 'var(--green)',
        'ERROR': 'var(--hot)'
    };

    const statusText = `[${status}] ${detail ? (detail.length > 20 ? detail.substring(0,20)+'...' : detail) : ''}`;
    el.textContent = statusText;
    el.style.color = colors[status] || 'white';

    const vaStatus = document.getElementById('vaStatus');
    if (vaStatus) {
        vaStatus.textContent = `Fleet Action: ${status}`;
    }
}

window.executeOnChainTrade = executeOnChainTrade;
window.ExecutionState = ExecutionState;
console.log('✅ Execution Engine Bridge (V6) loaded');
