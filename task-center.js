/**
 * TASK CENTER & FAUCET SYSTEM
 * Trade Arena v4 • Engagement & Onboarding
 */

const TASK_CONFIG = {
    initialFaucetAmount: 50,
    tasks: [
        { id: 'coinbase_learning', label: 'Coinbase Learning Rewards', reward: 20, completed: false, icon: '🎓', link: 'https://www.coinbase.com/learning-rewards' },
        { id: 'alaya_ai', label: 'Alaya AI Data Labeling', reward: 10, completed: false, icon: '🧠', link: 'https://www.alaya-ai.com/' },
        { id: 'layer3_quests', label: 'Layer3 Base Ecosystem Quests', reward: 15, completed: false, icon: '🗺️', link: 'https://layer3.xyz/base' },
        { id: 'follow_twitter', label: 'Follow on Twitter', reward: 10, completed: false, icon: '🐦' },
        { id: 'join_discord', label: 'Join Discord Arena', reward: 15, completed: false, icon: '💬' },
        { id: 'first_trade', label: 'Execute First Trade', reward: 5, completed: false, icon: '🎰' },
    ]
};

let taskState = {
    faucetClaimed: false,
    creditsEarned: 0,
    tasks: [...TASK_CONFIG.tasks]
};

function loadTaskState() {
    try {
        const raw = localStorage.getItem('ta_tasks_v4');
        if (raw) {
            const storedState = JSON.parse(raw);
            // Merge with new tasks if any
            taskState.faucetClaimed = storedState.faucetClaimed;
            taskState.creditsEarned = storedState.creditsEarned;
            taskState.tasks = TASK_CONFIG.tasks.map(t => {
                const storedTask = storedState.tasks?.find(st => st.id === t.id);
                return storedTask ? { ...t, completed: storedTask.completed } : t;
            });
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
    if (typeof window.updateGlobalBalance === 'function') window.updateGlobalBalance();

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

    if (task.link) {
        window.open(task.link, '_blank');
    }

    task.completed = true;
    taskState.creditsEarned += task.reward;

    // Add to balance
    window.balance += task.reward;
    if (typeof window.updateGlobalBalance === 'function') window.updateGlobalBalance();

    saveTaskState();
    renderTaskCenter();

    if (typeof SFX !== 'undefined') SFX.win();

    console.log(`[Tasks] Task ${taskId} completed! Reward: $${task.reward}`);
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

    container.innerHTML = taskState.tasks.map(task => `
        <div class="task-row" style="display:flex; align-items:center; gap:10px; padding:10px; background:rgba(0,0,0,0.2); border-radius:8px; margin-bottom:5px; border:1px solid ${task.completed ? 'var(--green)' : 'var(--border)'}">
            <div style="font-size:20px">${task.icon}</div>
            <div style="flex:1">
                <div style="font-size:11px; font-weight:bold; color:${task.completed ? 'var(--green)' : 'white'}">${task.label}</div>
                <div style="font-size:8px; color:var(--dim)">REWARD: $${task.reward} ${task.link ? '(External Task)' : ''}</div>
            </div>
            <button onclick="completeTask('${task.id}')" ${task.completed ? 'disabled' : ''} style="padding:5px 10px; border-radius:4px; border:none; background:${task.completed ? 'var(--dim)' : 'var(--cyan)'}; color:black; font-family:'Bungee'; font-size:9px; cursor:pointer">
                ${task.completed ? 'DONE' : (task.link ? 'GO ↗' : 'GO')}
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
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderTaskCenter, 1000);
});
