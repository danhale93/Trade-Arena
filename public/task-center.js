/**
 * LIVE DEPLOYMENT MONITOR
 * Trade Arena v4 • Real-time task queue viewer
 */

const API_BASE = (location.protocol === 'https:' ? '' : 'http://localhost:3001');
const DEPLOYMENT_POLL_INTERVAL = 4000;
let deploymentTimer = null;
let latestDeployments = [];

let taskState = {
    faucetClaimed: false,
    creditsEarned: 0,
    tasks: []
};

async function fetchDeployments() {
    try {
        const resp = await fetch(`${API_BASE}/api/deployments`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.success) {
            latestDeployments = data.deployments || [];
            renderDeploymentMonitor();
        }
    } catch (e) {
        console.error('[Monitor] Failed to fetch deployments:', e);
    }
}

function startDeploymentPolling() {
    if (deploymentTimer) return;
    fetchDeployments();
    deploymentTimer = setInterval(fetchDeployments, DEPLOYMENT_POLL_INTERVAL);
}

function stopDeploymentPolling() {
    if (deploymentTimer) {
        clearInterval(deploymentTimer);
        deploymentTimer = null;
    }
}

async function claimFaucet() {
    try {
        await fetch(`${API_BASE}/api/faucet/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userAddress: window.ethereum?.selectedAddress || 'demo' })
        });
        fetchDeployments();
    } catch (e) {
        console.error('[Monitor] Faucet claim failed:', e);
    }
}

async function completeTask(taskId) {
    try {
        await fetch(`${API_BASE}/api/tasks/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                taskId,
                reward: 0,
                userAddress: window.ethereum?.selectedAddress || 'demo'
            })
        });
        fetchDeployments();
    } catch (e) {
        console.error('[Monitor] Task claim failed:', e);
    }
}

function renderDeploymentMonitor() {
    const container = document.getElementById('taskCenterRows');
    if (!container) return;

    const statusEl = document.getElementById('cStatus');
    if (statusEl) {
        statusEl.textContent = latestDeployments.length > 0
            ? `Live: ${latestDeployments.length} deployment(s) in queue · polling every 4s`
            : '⚡ No deployments queued yet — completing tasks will populate this monitor';
        statusEl.style.color = latestDeployments.length > 0 ? 'var(--green)' : 'var(--dim)';
    }

    container.innerHTML = latestDeployments.length > 0 ? latestDeployments.slice(0, 12).map(dep => {
        const src = dep.deposit?.source || dep.source || 'unknown';
        const srcIcon = src === 'faucet' ? '⛽' : src === 'task' ? '📋' : src === 'moonpay' ? '💳' : '🤖';
        const amt = dep.deposit?.amount || dep.amount || 0;
        const currency = dep.deposit?.currency || dep.currency || '';
        const tx = dep.deposit?.payout?.txHash || dep.payout?.txHash;
        const status = dep.status || 'QUEUED';
        const statusColor = status === 'QUEUED' ? 'var(--amber)' : status === 'DEPLOYED' ? 'var(--green)' : 'var(--dim)';
        const simNote = dep.deposit?.payout?.simulated ? ' (sim)' : tx ? ` tx:${tx.slice(0, 10)}...` : ' pending';
        const created = new Date(dep.created || dep.deposit?.confirmedAt).toLocaleTimeString();

        return `
            <div style="display:flex; flex-direction:column; gap:4px; padding:10px 12px; background:rgba(0,0,0,0.25); border-radius:8px; margin-bottom:6px; border-left:3px solid ${statusColor}">
                <div style="display:flex; align-items:center; gap:8px; justify-content:space-between">
                    <span style="font-size:16px">${srcIcon}</span>
                    <span style="font-size:9px; padding:2px 8px; border-radius:8px; background:${statusColor}; color:var(--bg); font-weight:bold; text-transform:uppercase">
                        ${status}
                    </span>
                </div>
                <div style="font-size:11px; color:white">
                    <strong>${src.toUpperCase()}</strong> · ${amt} ${currency}${simNote}
                </div>
                <div style="font-size:9px; color:var(--dim); display:flex; justify-content:space-between">
                    <span>ID: ${dep.id?.slice(0, 10)}...</span>
                    <span>${created}</span>
                </div>
            </div>
        `;
    }).join('') : `
        <div style="padding:20px; text-align:center; color:var(--dim); font-size:11px">
            <div style="font-size:28px; margin-bottom:8px">📡</div>
            <div>No deployments in queue</div>
            <div style="font-size:9px; margin-top:4px">Complete tasks or claim faucet to see live entries here</div>
        </div>
    `;
}

// Export
window.claimFaucet = claimFaucet;
window.completeTask = completeTask;
window.startDeploymentPolling = startDeploymentPolling;
window.stopDeploymentPolling = stopDeploymentPolling;
window.fetchDeployments = fetchDeployments;
window.renderDeploymentMonitor = renderDeploymentMonitor;
window.latestDeployments = latestDeployments;

// Init

// Export to window for bot auto-onboarding
window.taskState = taskState;

// Start polling immediately after load (outside setupApp timing issues)
setTimeout(() => {
    if (typeof startDeploymentPolling === 'function') {
        startDeploymentPolling();
    }
}, 200);
