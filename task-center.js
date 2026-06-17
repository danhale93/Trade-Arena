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
    ],
    repeatable: [
        { id: 'mine', label: 'Crypto Mining (CPU)', reward: 0.50, cooldown: 30000, icon: '⛏️' },
        { id: 'ad', label: 'Watch Sponsor Ad', reward: 1.00, cooldown: 60000, icon: '📺' },
        { id: 'faucet_v2', label: 'Daily Faucet Claim', reward: 5.00, cooldown: 86400000, icon: '🚰' }
    ]
};

let taskState = {
    faucetClaimed: false,
    creditsEarned: 0,
    tasks: [...TASK_CONFIG.tasks],
    cooldowns: {} // id -> timestamp of next available claim
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

/**
 * Claim the initial faucet
 */
function claimFaucet() {
    if (taskState.faucetClaimed) {
        alert('Faucet already claimed!');
        return;
    }

    // Add to balance
    window.balance += TASK_CONFIG.initialFaucetAmount;
    window.updateGlobalBalance();

    taskState.faucetClaimed = true;
    saveTaskState();
    renderTaskCenter();

    // SFX
    if (typeof SFX !== 'undefined') SFX.bigWin();

    alert(`$${TASK_CONFIG.initialFaucetAmount} credited to your arena balance!`);
}

/**
 * Complete a task
 */
function completeTask(taskId) {
    const task = taskState.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    task.completed = true;
    taskState.creditsEarned += task.reward;

    // Add to balance
    window.balance += task.reward;
    window.updateGlobalBalance();

    saveTaskState();
    renderTaskCenter();

    if (typeof SFX !== 'undefined') SFX.win();

    console.log(`[Tasks] Task ${taskId} completed! Reward: $${task.reward}`);
}

/**
 * Complete a repeatable task
 */
async function performRepeatableTask(taskId) {
    const config = TASK_CONFIG.repeatable.find(r => r.id === taskId);
    if (!config) return { success: false, error: 'Invalid task' };

    const now = Date.now();
    const nextAvailable = taskState.cooldowns[taskId] || 0;

    if (now < nextAvailable) {
        const remaining = Math.ceil((nextAvailable - now) / 1000);
        return { success: false, error: `Cooldown active: ${remaining}s remaining`, remaining };
    }

    // Set new cooldown
    taskState.cooldowns[taskId] = now + config.cooldown;

    // Add reward
    window.balance += config.reward;
    taskState.creditsEarned += config.reward;

    if (window.updateGlobalBalance) window.updateGlobalBalance();
    saveTaskState();
    renderTaskCenter();

    if (typeof SFX !== 'undefined') SFX.coin();

    console.log(`[Tasks] Repeatable task ${taskId} performed! Reward: $${config.reward}`);
    return { success: true, reward: config.reward };
}

/**
 * UI: Render Task Center
 */
function renderTaskCenter() {
    const container = document.getElementById('taskCenterRows');
    if (!container) return;

    const faucetBtn = document.getElementById('claimFaucetBtn');
    if (faucetBtn) {
        faucetBtn.disabled = taskState.faucetClaimed;
        faucetBtn.textContent = taskState.faucetClaimed ? 'CLAIMED' : 'CLAIM $50 STARTING CAPITAL';
    }

    const now = Date.now();

    let html = '';

    // Fixed Tasks
    html += '<div style="font-size:9px; color:var(--gold); margin-bottom:10px; letter-spacing:1px;">ONE-TIME CHALLENGES</div>';
    html += taskState.tasks.map(task => `
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

    // Repeatable Tasks
    html += '<div style="font-size:9px; color:var(--cyan); margin:15px 0 10px; letter-spacing:1px;">EARN CREDITS (AUTO-BOT READY)</div>';
    html += TASK_CONFIG.repeatable.map(task => {
        const next = taskState.cooldowns[task.id] || 0;
        const isCooldown = now < next;
        const remaining = isCooldown ? Math.ceil((next - now) / 1000) : 0;

        return `
            <div class="task-row" style="display:flex; align-items:center; gap:10px; padding:10px; background:rgba(0,0,0,0.2); border-radius:8px; margin-bottom:5px; border:1px solid ${isCooldown ? 'var(--dim)' : 'var(--cyan)'}">
                <div style="font-size:20px">${task.icon}</div>
                <div style="flex:1">
                    <div style="font-size:11px; font-weight:bold; color:white">${task.label}</div>
                    <div style="font-size:8px; color:var(--dim)">REWARD: $${task.reward.toFixed(2)} ${isCooldown ? `• COOLDOWN: ${remaining}s` : ''}</div>
                </div>
                <button onclick="performRepeatableTask('${task.id}')" ${isCooldown ? 'disabled' : ''} style="padding:5px 10px; border-radius:4px; border:none; background:${isCooldown ? 'var(--panel)' : 'var(--green)'}; color:black; font-family:'Bungee'; font-size:9px; cursor:pointer">
                    ${isCooldown ? 'WAIT' : 'CLAIM'}
                </button>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

// Export
window.claimFaucet = claimFaucet;
window.completeTask = completeTask;
window.performRepeatableTask = performRepeatableTask;
window.renderTaskCenter = renderTaskCenter;
window.taskState = taskState;

// Init
loadTaskState();
