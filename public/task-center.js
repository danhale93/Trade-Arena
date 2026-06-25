/**
 * TASK CENTER & FAUCET SYSTEM
 * Trade Arena v4 • Engagement & Onboarding
 */

const TASK_CONFIG = {
    initialFaucetAmount: 50,
    tasks: [
        { id: 'follow_twitter', label: 'Follow on Twitter', reward: 10, completed: false, icon: '🐦' },
        { id: 'join_discord', label: 'Join Discord Arena', reward: 15, completed: false, icon: '💬' },
        { id: 'share_win', label: 'Share a Big Win', reward: 25, completed: false, icon: '🚀' },
        { id: 'first_trade', label: 'Execute First Trade', reward: 5, completed: false, icon: '🎰' },
    ]
};

const API_BASE = (location.protocol === 'https:' ? '' : 'http://localhost:3001');

let taskState = {
    faucetClaimed: false,
    creditsEarned: 0,
    tasks: [...TASK_CONFIG.tasks]
};

function loadTaskState() {
    try {
        const raw = localStorage.getItem('ta_tasks_v4');
        if (raw) {
            taskState = JSON.parse(raw);
        }
    } catch(e) {}
}

function saveTaskState() {
    try {
        localStorage.setItem('ta_tasks_v4', JSON.stringify(taskState));
    } catch(e) {}
}

async function claimFaucet() {
    if (taskState.faucetClaimed) {
        alert('Faucet already claimed!');
        return;
    }

    const s = document.getElementById('cStatus');
    if (s) s.innerHTML = '⛽ Claiming faucet...';

    try {
        const resp = await fetch(`${API_BASE}/api/faucet/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userAddress: window.ethereum?.selectedAddress || 'demo'
            })
        });
        const data = await resp.json();
        if (!data.success) throw new Error(data.error || 'Claim failed');

        window.balance += TASK_CONFIG.initialFaucetAmount;
        window.updateGlobalBalance();
        taskState.faucetClaimed = true;
        saveTaskState();
        renderTaskCenter();

        if (typeof SFX !== 'undefined') SFX.bigWin();
        if (s) s.innerHTML = '';
        alert(`$${TASK_CONFIG.initialFaucetAmount} credited to your arena balance!`);
    } catch (e) {
        console.error('Faucet error:', e);
        if (s) s.innerHTML = '❌ Faucet claim failed: ' + (e.message || 'Unknown error');
    }
}

async function completeTask(taskId) {
    const task = taskState.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    const s = document.getElementById('cStatus');
    if (s) s.innerHTML = '⚡ Processing task reward...';

    try {
        const resp = await fetch(`${API_BASE}/api/tasks/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                taskId,
                reward: task.reward,
                userAddress: window.ethereum?.selectedAddress || 'demo'
            })
        });
        const data = await resp.json();
        if (!data.success) throw new Error(data.error || 'Claim failed');

        task.completed = true;
        taskState.creditsEarned += task.reward;
        window.balance += task.reward;
        window.updateGlobalBalance();
        saveTaskState();
        renderTaskCenter();

        if (typeof SFX !== 'undefined') SFX.win();
        if (s) s.innerHTML = '';
        console.log(`[Tasks] Task ${taskId} completed! Reward: $${task.reward}`);
    } catch (e) {
        console.error('Task error:', e);
        if (s) s.innerHTML = '❌ Task claim failed: ' + (e.message || 'Unknown error');
    }
}

function renderTaskCenter() {
    const container = document.getElementById('taskCenterRows');
    if (!container) return;

    const faucetBtn = document.getElementById('claimFaucetBtn');
    if (faucetBtn) {
        faucetBtn.disabled = taskState.faucetClaimed;
        faucetBtn.textContent = taskState.faucetClaimed ? 'CLAIMED' : 'CLAIM $50 STARTING CAPITAL';
    }

    container.innerHTML = taskState.tasks.map(task => `
        <div class="task-row" style="display:flex; align-items:center; gap:10px; padding:10px; background:rgba(0,0,0,0.2); border-radius:8px; margin-bottom:5px; border:1px solid ${task.completed ? 'var(--green)' : 'var(--border)'}">
            <div style="font-size:20px">${task.icon}</div>
            <div style="flex:1">
                <div style="font-size:11px; font-weight:bold; color:${task.completed ? 'var(--green)' : 'white'}">${task.label}</div>
                <div style="font-size:8px; color:var(--dim)">REWARD: $${task.reward}</div>
            </div>
            <button onclick="completeTask('${task.id}')" ${task.completed ? 'disabled' : ''} style="padding:5px 10px; border-radius:4px; border:none; background:${task.completed ? 'var(--dim)' : 'var(--cyan)'}; color:black; font-family:'Bungee'; font-size:9px; cursor:pointer">
                ${task.completed ? 'DONE' : 'GO'}
            </button>
        </div>
    `).join('');
}

// Export
window.claimFaucet = claimFaucet;
window.completeTask = completeTask;
window.renderTaskCenter = renderTaskCenter;

// Init
loadTaskState();

// Export to window for bot auto-onboarding
window.taskState = taskState;
