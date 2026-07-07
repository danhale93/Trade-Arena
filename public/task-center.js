/**
 * HYBRID TASK CENTER & DEPLOYMENT MONITOR
 * Trade Arena v4 • Real-time rewards & queue viewer
 */

const API_BASE = (location.protocol === 'https:' ? '' : 'http://localhost:3001');
const DEPLOYMENT_POLL_INTERVAL = 4000;

const TASK_CONFIG = {
    initialFaucetAmount: 50,
    quests: [
        { id: 'follow_twitter', label: 'Follow on Twitter', reward: 10, completed: false, icon: '🐦', type: 'social' },
        { id: 'join_discord', label: 'Join Discord Arena', reward: 15, completed: false, icon: '💬', type: 'social' },
        { id: 'share_win', label: 'Share a Big Win', reward: 25, completed: false, icon: '🚀', type: 'social' },
        { id: 'first_trade', label: 'Execute First Trade', reward: 5, completed: false, icon: '🎰', type: 'action' },
        { id: 'hcaptcha_verify', label: 'AI Data Verification', reward: 20, completed: false, icon: '🧠', type: 'verified', provider: 'hcaptcha' },
        { id: 'ai_feedback', label: 'Rate AI Prediction', reward: 30, completed: false, icon: '📊', type: 'verified', provider: 'internal' }
    ]
};

let taskState = {
    faucetClaimed: false,
    creditsEarned: 0,
    quests: [...TASK_CONFIG.quests]
};

let deploymentTimer = null;
let latestDeployments = [];

/**
 * Helper to escape HTML and prevent XSS
 */
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function loadTaskState() {
    try {
        const raw = localStorage.getItem('ta_tasks_v4_quests');
        if (raw) {
            const saved = JSON.parse(raw);
            taskState.faucetClaimed = saved.faucetClaimed || false;
            taskState.creditsEarned = saved.creditsEarned || 0;
            if (saved.quests) {
                taskState.quests.forEach(q => {
                    const s = saved.quests.find(sq => sq.id === q.id);
                    if (s) q.completed = s.completed;
                });
            }
        }
    } catch(e) {}
}

function saveTaskState() {
    try {
        localStorage.setItem('ta_tasks_v4_quests', JSON.stringify(taskState));
    } catch(e) {}
}

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
    if (taskState.faucetClaimed) {
        if (window.showToast) window.showToast('Faucet already claimed!', 'error');
        return;
    }

    try {
        if (window.showToast) window.showToast('Requesting Faucet Payout...', 'info');
        const resp = await fetch(`${API_BASE}/api/faucet/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userAddress: window.ethereum?.selectedAddress || 'demo' })
        });
        const data = await resp.json();

        if (data.success) {
            taskState.faucetClaimed = true;
            if (window.balance !== undefined) {
                window.balance += TASK_CONFIG.initialFaucetAmount;
                if (window.updateGlobalBalance) window.updateGlobalBalance();
            }
            saveTaskState();
            renderTaskCenter();
            fetchDeployments();
            if (typeof SFX !== 'undefined') SFX.bigWin();
            if (window.showToast) window.showToast('Faucet Claimed! Deployment Queued.', 'success');
        } else {
            if (window.showToast) window.showToast(data.error || 'Faucet claim failed', 'error');
        }
    } catch (e) {
        console.error('[Monitor] Faucet claim failed:', e);
    }
}

async function completeTask(taskId) {
    const quest = taskState.quests.find(q => q.id === taskId);
    if (!quest || quest.completed) return;

    if (quest.type === 'verified') {
        if (quest.provider === 'hcaptcha') {
            return startHCaptchaFlow(quest);
        }
        if (quest.provider === 'internal') {
            return startAIFeedbackFlow(quest);
        }
    }

    await submitTaskToBackend(quest);
}

async function submitTaskToBackend(quest) {
    try {
        if (window.showToast) window.showToast(`Submitting ${quest.label}...`, 'info');
        const resp = await fetch(`${API_BASE}/api/tasks/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                taskId: quest.id,
                reward: quest.reward,
                userAddress: window.ethereum?.selectedAddress || 'demo',
                validationToken: localStorage.getItem('ta_task_secret') || ''
            })
        });
        const data = await resp.json();

        if (data.success) {
            quest.completed = true;
            taskState.creditsEarned += quest.reward;
            if (window.balance !== undefined) {
                window.balance += quest.reward;
                if (window.updateGlobalBalance) window.updateGlobalBalance();
            }
            saveTaskState();
            renderTaskCenter();
            fetchDeployments();
            if (typeof SFX !== 'undefined') SFX.win();
            if (window.showToast) window.showToast(`${quest.label} Complete!`, 'success');
        } else {
            if (window.showToast) window.showToast(data.error || 'Task submission failed', 'error');
        }
    } catch (e) {
        console.error('[Monitor] Task claim failed:', e);
    }
}

function startHCaptchaFlow(quest) {
    const container = document.getElementById('hcaptcha-container');
    if (!container) return;
    container.style.display = 'block';
    if (window.showToast) window.showToast('Prove you are human to earn...', 'info');
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window._activeVerifiedTaskId = quest.id;
}

window.onHCaptchaSuccess = function(token) {
    const taskId = window._activeVerifiedTaskId;
    if (window.showToast) window.showToast('Verification Successful!', 'success');
    const container = document.getElementById('hcaptcha-container');
    if (container) container.style.display = 'none';
    verifyTaskCompletion(taskId, token);
};

function startAIFeedbackFlow(quest) {
    if (window.showToast) window.showToast('Opening AI Arena Feedback...', 'info');
    setTimeout(() => {
        const rating = prompt(`[AI Feedback Loop]
How accurate was the last AI prediction for BTC/USD?
(1: Poor, 5: Excellent)`);
        if (rating >= 1 && rating <= 5) {
            verifyTaskCompletion(quest.id);
        }
    }, 500);
}


async function verifyTaskCompletion(taskId, token = null) {
    const task = taskState.quests.find(t => t.id === taskId);
    if (!task) return;

    if (task.type === 'verified') {
        if (window.showToast) window.showToast('Processing Real Crypto Reward...', 'info');
        if (window.simulateTreasuryPayout) {
            const tx = await window.simulateTreasuryPayout(task.reward, task.label);
            if (!tx.success) {
                if (window.showToast) window.showToast('Reward Distribution Failed', 'error');
                return;
            }
        }
    }

    task.completed = true;
    taskState.creditsEarned += task.reward;
    if (window.balance !== undefined) {
        window.balance += task.reward;
        if (window.updateGlobalBalance) window.updateGlobalBalance();
    }
    saveTaskState();
    renderTaskCenter();
    if (typeof SFX !== 'undefined') SFX.bigWin();
    const rewardType = task.type === 'verified' ? 'Real Crypto (Simulated)' : 'Credits';
    if (window.showToast) window.showToast(`Verified Task Complete! +$${task.reward} ${rewardType} Credited`, 'success');
}

function renderTaskCenter() {
    const questContainer = document.getElementById('taskQuestList');
    const deployContainer = document.getElementById('taskCenterRows');
    if (!questContainer || !deployContainer) return;

    const faucetBtn = document.getElementById('claimFaucetBtn');
    if (faucetBtn) {
        faucetBtn.disabled = taskState.faucetClaimed;
        faucetBtn.textContent = taskState.faucetClaimed ? 'CLAIMED' : 'CLAIM $50 STARTING CAPITAL';
    }

    questContainer.innerHTML = \`
        <div style="margin-bottom:10px; font-size:10px; color:var(--cyan); font-family:'Bungee'">REAL EARNING OPPORTUNITIES</div>
        \${taskState.quests.filter(q => q.type === 'verified').map(q => renderQuestRow(q)).join('')}

        <div style="margin-top:15px; margin-bottom:10px; font-size:10px; color:var(--green); font-family:'Bungee'">SOCIAL & PLATFORM QUESTS</div>
        \${taskState.quests.filter(q => q.type !== 'verified').map(q => renderQuestRow(q)).join('')}

        <div style="margin-top:15px; margin-bottom:10px; font-size:10px; color:var(--gold2); font-family:'Bungee'">LIVE DEPLOYMENTS</div>
    \`;

    renderDeploymentMonitor();
}

function renderQuestRow(quest) {
    const isVerified = quest.type === 'verified';
    const rowColor = quest.completed ? 'var(--green)' : (isVerified ? 'var(--cyan)' : 'var(--border)');
    return \`
        <div class=\"task-row\" style=\"display:flex; align-items:center; gap:10px; padding:10px; background:rgba(0,0,0,0.2); border-radius:8px; margin-bottom:5px; border:1px solid \${rowColor}\">
            <div style="font-size:20px">${escapeHTML(quest.icon)}</div>
            <div style=\"flex:1\">
                <div style=\"display:flex; align-items:center; gap:5px\">
                    <div style="font-size:11px; font-weight:bold; color:${quest.completed ? 'var(--green)' : 'white'}">${escapeHTML(quest.label)}</div>
                    \${isVerified ? '<span style=\"font-size:7px; padding:2px 4px; background:var(--cyan); color:black; border-radius:3px\">VERIFIED</span>' : ''}
                </div>
                <div style="font-size:8px; color:var(--dim)">REWARD: $${escapeHTML(quest.reward)} ${isVerified ? 'REAL CRYPTO' : 'CREDITS'}</div>
            </div>
            <button aria-label="${quest.completed ? 'Task completed: ' + quest.label : 'Complete task: ' + quest.label}" onclick="completeTask(${escapeHTML(JSON.stringify(quest.id))})" ${quest.completed ? 'disabled' : ''}
                style=\"padding:5px 10px; border-radius:4px; border:none; background:\${quest.completed ? 'var(--dim)' : 'var(--cyan)'}; color:black; font-family:'Bungee'; font-size:9px; cursor:pointer\">
                \${quest.completed ? 'DONE' : 'GO'}
            </button>
        </div>
    \`;
}

function renderDeploymentMonitor() {
    const container = document.getElementById('taskCenterRows');
    if (!container) return;

    container.innerHTML = latestDeployments.length > 0 ? latestDeployments.slice(0, 8).map(dep => {
        const src = dep.deposit?.source || dep.source || 'unknown';
        const srcIcon = src === 'faucet' ? '⛽' : src === 'task' ? '📋' : src === 'moonpay' ? '💳' : '🤖';
        const amt = dep.deposit?.amount || dep.amount || 0;
        const status = dep.status || 'QUEUED';
        const statusColor = status === 'QUEUED' ? 'var(--amber)' : status === 'DEPLOYED' ? 'var(--green)' : 'var(--dim)';

        return \`
            <div style=\"display:flex; flex-direction:column; gap:4px; padding:10px 12px; background:rgba(0,0,0,0.25); border-radius:8px; margin-bottom:6px; border-left:3px solid \${statusColor}\">
                <div style=\"display:flex; align-items:center; gap:8px; justify-content:space-between\">
                    <span style=\"font-size:16px\">\${srcIcon}</span>
                    <span style=\"font-size:9px; padding:2px 8px; border-radius:8px; background:\${statusColor}; color:var(--bg); font-weight:bold; text-transform:uppercase\">
                        \${escapeHTML(status)}
                    </span>
                </div>
                <div style=\"font-size:11px; color:white\">
                    <strong>\${escapeHTML(src.toUpperCase())}</strong> · \${escapeHTML(amt)} ETH
                </div>
            </div>
        \`;
    }).join('') : \`
        <div style=\"padding:20px; text-align:center; color:var(--dim); font-size:11px\">
            <div style=\"font-size:28px; margin-bottom:8px\">📡</div>
            <div>No deployments in queue</div>
        </div>
    \`;
}

// Export
window.claimFaucet = claimFaucet;
window.completeTask = completeTask;
window.renderTaskCenter = renderTaskCenter;
window.startDeploymentPolling = startDeploymentPolling;
window.stopDeploymentPolling = stopDeploymentPolling;

// Init
loadTaskState();
window.taskState = taskState;

setTimeout(() => {
    startDeploymentPolling();
    renderTaskCenter();
}, 200);
