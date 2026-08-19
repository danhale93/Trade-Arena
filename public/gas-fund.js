/**
 * GAS FUND TRACKER
 * Trade Arena • Tracks passive-compute earnings (Salad / Render) against a gas budget goal.
 *
 * NOTE: Neither Salad nor Render expose a documented public API for a personal
 * Chef/node balance, so this is manual-entry by design rather than a fragile
 * scrape of an undocumented endpoint. You glance at your Salad/Render app and
 * log the number here; the tab tracks progress toward your gas target.
 */

window.GAS_FUND_STORAGE_KEY = window.GAS_FUND_STORAGE_KEY || 'ta_gas_fund_v1';

window.gasFundState = window.gasFundState || {
    targetUSD: 20,
    balanceUSD: 0,
    history: [] // { ts, amountUSD, note }
};

function loadGasFundState() {
    try {
        const raw = localStorage.getItem(window.GAS_FUND_STORAGE_KEY);
        if (raw) {
            const saved = JSON.parse(raw);
            window.gasFundState.targetUSD = typeof saved.targetUSD === 'number' ? saved.targetUSD : 20;
            window.gasFundState.balanceUSD = typeof saved.balanceUSD === 'number' ? saved.balanceUSD : 0;
            window.gasFundState.history = Array.isArray(saved.history) ? saved.history : [];
        }
    } catch (e) {}
}

function saveGasFundState() {
    try {
        localStorage.setItem(window.GAS_FUND_STORAGE_KEY, JSON.stringify(window.gasFundState));
    } catch (e) {}
}

function escapeHTMLGF(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function gasFundLogBalance() {
    const input = document.getElementById('gasFundBalanceInput');
    if (!input) return;
    const val = parseFloat(input.value);
    if (isNaN(val) || val < 0) {
        if (window.showToast) window.showToast('Enter a valid balance amount', 'error');
        return;
    }
    window.gasFundState.balanceUSD = val;
    window.gasFundState.history.unshift({ ts: Date.now(), amountUSD: val, note: 'Manual update' });
    window.gasFundState.history = window.gasFundState.history.slice(0, 20);
    saveGasFundState();
    input.value = '';
    renderGasFund();
    if (window.showToast) window.showToast('Gas fund balance updated', 'success');
}

function gasFundSetTarget() {
    const input = document.getElementById('gasFundTargetInput');
    if (!input) return;
    const val = parseFloat(input.value);
    if (isNaN(val) || val <= 0) {
        if (window.showToast) window.showToast('Enter a valid target amount', 'error');
        return;
    }
    window.gasFundState.targetUSD = val;
    saveGasFundState();
    input.value = '';
    renderGasFund();
}

function renderGasFund() {
    const container = document.getElementById('gasFundContainer');
    if (!container) return;

    loadGasFundState();

    const pct = Math.min(100, Math.round((window.gasFundState.balanceUSD / window.gasFundState.targetUSD) * 100)) || 0;
    const remaining = Math.max(0, window.gasFundState.targetUSD - window.gasFundState.balanceUSD);
    const ready = window.gasFundState.balanceUSD >= window.gasFundState.targetUSD;

    container.innerHTML = `
        <div style="font-size:10px; color:var(--cyan); font-family:'Bungee'; margin-bottom:10px">GAS FUND TRACKER</div>

        <div style="background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:8px; padding:12px; margin-bottom:15px">
            <div style="display:flex; justify-content:space-between; font-size:9px; color:var(--dim); margin-bottom:6px">
                <span>PROGRESS TOWARD GAS TARGET</span>
                <span style="color:${ready ? 'var(--green)' : 'var(--gold2)'}">$${window.gasFundState.balanceUSD.toFixed(2)} / $${window.gasFundState.targetUSD.toFixed(2)}</span>
            </div>
            <div style="height:10px; background:rgba(255,255,255,0.06); border-radius:5px; overflow:hidden">
                <div style="height:100%; width:${pct}%; background:${ready ? 'var(--green)' : 'var(--cyan)'}; transition:width 0.3s"></div>
            </div>
            <div style="font-size:9px; color:${ready ? 'var(--green)' : 'var(--dim)'}; margin-top:6px">
                ${ready ? '✓ Target reached — enough to fund upcoming gas fees' : `$${remaining.toFixed(2)} remaining to reach target`}
            </div>
        </div>

        <div style="display:flex; gap:8px; margin-bottom:15px; flex-wrap:wrap">
            <div style="flex:1; min-width:140px">
                <div style="font-size:8px; color:var(--dim); margin-bottom:4px">LOG CURRENT BALANCE ($)</div>
                <div style="display:flex; gap:6px">
                    <input id="gasFundBalanceInput" type="number" step="0.01" min="0" placeholder="e.g. 4.50"
                        style="flex:1; padding:6px 8px; background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:4px; color:white; font-size:10px" />
                    <button onclick="gasFundLogBalance()" style="padding:6px 10px; background:var(--cyan); color:black; border:none; border-radius:4px; font-family:'Bungee'; font-size:8px; cursor:pointer">LOG</button>
                </div>
            </div>
            <div style="flex:1; min-width:140px">
                <div style="font-size:8px; color:var(--dim); margin-bottom:4px">SET GAS TARGET ($)</div>
                <div style="display:flex; gap:6px">
                    <input id="gasFundTargetInput" type="number" step="1" min="1" placeholder="e.g. 20"
                        style="flex:1; padding:6px 8px; background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:4px; color:white; font-size:10px" />
                    <button onclick="gasFundSetTarget()" style="padding:6px 10px; background:var(--gold2); color:black; border:none; border-radius:4px; font-family:'Bungee'; font-size:8px; cursor:pointer">SET</button>
                </div>
            </div>
        </div>

        <div style="margin-bottom:15px; font-size:10px; color:var(--green); font-family:'Bungee'">HOW TO EARN TOWARD THIS</div>
        <div style="background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:8px; padding:12px; margin-bottom:15px; font-size:9px; color:var(--dim); line-height:1.6">
            <div style="color:white; font-weight:bold; margin-bottom:4px">Option A — Salad (lowest effort)</div>
            <div>1. Download the Salad app: <a href="https://salad.com/download" target="_blank" rel="noopener" style="color:var(--cyan)">salad.com/download</a></div>
            <div>2. Sign up, let it run in the background on idle time</div>
            <div>3. Check your balance in the Salad app occasionally and log it above</div>
            <div>4. Redeem Salad Balance for PayPal/gift cards, then convert to ETH/USDC via an exchange when you're ready to fund gas</div>

            <div style="color:white; font-weight:bold; margin:10px 0 4px">Option B — Render Network (direct crypto payout)</div>
            <div>1. Set up a Render Network node: <a href="https://render.io" target="_blank" rel="noopener" style="color:var(--cyan)">render.io</a></div>
            <div>2. Node pays RENDER tokens directly to a Solana wallet</div>
            <div>3. Swap RENDER → ETH/USDC on an exchange or DEX, then bridge to your trading wallet</div>

            <div style="margin-top:10px; color:var(--gold2)">Neither platform has a public API for personal balance, so this tracker is manual by design — log your balance whenever you check in.</div>
        </div>

        ${window.gasFundState.history.length ? `
        <div style="font-size:9px; color:var(--dim); margin-bottom:6px">RECENT UPDATES</div>
        <div>
            ${window.gasFundState.history.slice(0, 5).map(h => `
                <div style="display:flex; justify-content:space-between; font-size:8px; color:var(--dim); padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05)">
                    <span>${escapeHTMLGF(new Date(h.ts).toLocaleString())}</span>
                    <span style="color:white">$${Number(h.amountUSD).toFixed(2)}</span>
                </div>
            `).join('')}
        </div>` : ''}
    `;
}

window.renderGasFund = renderGasFund;
window.gasFundLogBalance = gasFundLogBalance;
window.gasFundSetTarget = gasFundSetTarget;

loadGasFundState();
