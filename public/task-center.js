/**
 * TASK CENTER & FAUCET SYSTEM
 * Trade Arena v4 • Engagement & Onboarding
 */

const TASK_CONFIG = {
    initialFaucetAmount: 50,
    tasks: [
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
    tasks: [...TASK_CONFIG.tasks],
    verifiedTasks: [] // Track tasks pending external verification
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
        if (window.showToast) window.showToast('Faucet already claimed!', 'error');
        else alert('Faucet already claimed!');
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

    if (window.showToast) window.showToast(`$${TASK_CONFIG.initialFaucetAmount} credited to your arena balance!`, 'success');
    else alert(`$${TASK_CONFIG.initialFaucetAmount} credited to your arena balance!`);
}

/**
 * Complete a task
 */
function completeTask(taskId) {
    const task = taskState.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    // Handle Verified Tasks
    if (task.type === 'verified') {
        if (task.provider === 'hcaptcha') {
            return startHCaptchaFlow(task);
        }
        if (task.provider === 'internal') {
            return startAIFeedbackFlow(task);
        }
    }

    task.completed = true;
    taskState.creditsEarned += task.reward;

    // Add to balance
    window.balance += task.reward;
    window.updateGlobalBalance();

    saveTaskState();
    renderTaskCenter();

    if (typeof SFX !== 'undefined') SFX.win();
    if (window.showToast) window.showToast(`Task completed! +$${task.reward}`, 'success');

    console.log(`[Tasks] Task ${taskId} completed! Reward: $${task.reward}`);
}

/**
 * Verified Task: hCaptcha Flow
 */
function startHCaptchaFlow(task) {
    const container = document.getElementById('hcaptcha-container');
    if (!container) return;

    container.style.display = 'block';
    if (window.showToast) window.showToast('Prove you are human to earn...', 'info');

    // Scroll to widget
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Store active task for callback
    window._activeVerifiedTaskId = task.id;
}

/**
 * Global Callback for hCaptcha Success
 */
window.onHCaptchaSuccess = function(token) {
    console.log('[hCaptcha] Token received:', token);
    const taskId = window._activeVerifiedTaskId;

    if (window.showToast) window.showToast('Verification Successful!', 'success');

    // Hide container
    const container = document.getElementById('hcaptcha-container');
    if (container) container.style.display = 'none';

    // Verify and Finalize
    verifyTaskCompletion(taskId, token);
};

/**
 * Verified Task: AI Feedback Flow
 */
function startAIFeedbackFlow(task) {
    if (window.showToast) window.showToast('Opening AI Arena Feedback...', 'info');

    setTimeout(() => {
        const rating = prompt(`[AI Feedback Loop]\nHow accurate was the last AI prediction for BTC/USD?\n(1: Poor, 5: Excellent)`);
        if (rating >= 1 && rating <= 5) {
            verifyTaskCompletion(task.id);
        }
    }, 500);
}

/**
 * Verify and Finalize Task
 */
async function verifyTaskCompletion(taskId, token = null) {
    const task = taskState.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Simulate On-Chain Reward Distribution (Real Crypto Simulation)
    if (task.type === 'verified') {
        if (window.showToast) window.showToast('Processing Real Crypto Reward...', 'info');

        // Call simulated treasury in real-wallet.js
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

    // Add to balance
    window.balance += task.reward;
    window.updateGlobalBalance();

    saveTaskState();
    renderTaskCenter();

    if (typeof SFX !== 'undefined') SFX.bigWin();
    const rewardType = task.type === 'verified' ? 'Real Crypto (Simulated)' : 'Credits';
    if (window.showToast) window.showToast(`Verified Task Complete! +$${task.reward} ${rewardType} Credited`, 'success');
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

    container.innerHTML = `
        <div style="margin-bottom:10px; font-size:10px; color:var(--cyan); font-family:'Bungee'">REAL EARNING OPPORTUNITIES</div>
        ${taskState.tasks.filter(t => t.type === 'verified').map(task => renderTaskRow(task)).join('')}

        <div style="margin-top:15px; margin-bottom:10px; font-size:10px; color:var(--green); font-family:'Bungee'">SOCIAL & PLATFORM QUESTS</div>
        ${taskState.tasks.filter(t => t.type !== 'verified').map(task => renderTaskRow(task)).join('')}
    `;
}

/**
 * Helper: Render a single task row
 */
function renderTaskRow(task) {
    const isVerified = task.type === 'verified';
    const rowColor = task.completed ? 'var(--green)' : (isVerified ? 'var(--cyan)' : 'var(--border)');
    const glow = (!task.completed && isVerified) ? 'box-shadow: 0 0 10px rgba(0,255,255,0.2);' : '';

    return `
        <div class="task-row" style="display:flex; align-items:center; gap:10px; padding:10px; background:rgba(0,0,0,0.2); border-radius:8px; margin-bottom:5px; border:1px solid ${rowColor}; ${glow}">
            <div style="font-size:20px">${task.icon}</div>
            <div style="flex:1">
                <div style="display:flex; align-items:center; gap:5px">
                    <div style="font-size:11px; font-weight:bold; color:${task.completed ? 'var(--green)' : 'white'}">${task.label}</div>
                    ${isVerified ? '<span style="font-size:7px; padding:2px 4px; background:var(--cyan); color:black; border-radius:3px">VERIFIED</span>' : ''}
                </div>
                <div style="font-size:8px; color:var(--dim)">REWARD: $${task.reward} ${isVerified ? 'REAL CRYPTO' : 'CREDITS'}</div>
            </div>
            <button onclick="completeTask('${task.id}')" ${task.completed ? 'disabled' : ''}
                aria-label="${task.completed ? 'Task completed: ' + task.label : 'Complete task: ' + task.label}"
                style="padding:5px 10px; border-radius:4px; border:none; background:${task.completed ? 'var(--dim)' : (isVerified ? 'var(--cyan)' : 'var(--cyan)')}; color:black; font-family:'Bungee'; font-size:9px; cursor:pointer">
                ${task.completed ? 'DONE' : 'GO'}
            </button>
        </div>
    `;
}

// Export
window.claimFaucet = claimFaucet;
window.completeTask = completeTask;
window.renderTaskCenter = renderTaskCenter;

// Init
loadTaskState();

// Export to window for bot auto-onboarding
window.taskState = taskState;
