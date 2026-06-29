
      function showToast(msg, type='info') {
        const container = document.getElementById('toastContainer');
        if (!container) {
          const c = document.createElement('div');
          c.id = 'toastContainer';
          c.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;';
          document.body.appendChild(c);
        }
        const t = document.createElement('div');
        t.style.cssText = `background:rgba(0,0,0,0.9);color:${type==='error'?'var(--hot)':'var(--cyan)'};padding:8px 16px;border:1px solid ${type==='error'?'var(--hot)':'var(--cyan)'};border-radius:4px;font-family:monospace;font-size:12px;box-shadow:0 0 10px rgba(0,0,0,0.5);animation:toastFadeIn 0.3s ease;`;
        t.textContent = `[${type.toUpperCase()}] ${msg}`;
        document.getElementById('toastContainer').appendChild(t);
        setTimeout(() => {
          t.style.animation = 'toastFadeOut 0.3s ease';
          setTimeout(() => t.remove(), 300);
        }, 3000);
      }

      function switchTradingMode(mode) {
        const isLive = mode === 'live';
        if (isLive && (!window.walletState || !window.walletState.isConnected)) {
           showToast('Connect real wallet first!', 'error');
           return;
        }
        const simBtn = document.getElementById('simModeBtn');
        const liveBtn = document.getElementById('liveModeBtn');

        simBtn.classList.toggle('active', !isLive);
        simBtn.setAttribute('aria-pressed', (!isLive).toString());

        liveBtn.classList.toggle('active', isLive);
        liveBtn.setAttribute('aria-pressed', isLive.toString());

        if (typeof CrucibleRealTrading !== 'undefined') {
          CrucibleRealTrading.config.liveMode = isLive;
          showToast(`Mode switched to ${isLive ? 'LIVE' : 'SIMULATED'}`, 'info');
        }
      }
      function updateCrucibleProgress(current, total, equity) {
        const prog = document.getElementById('crucibleProgress');
        const bar = document.getElementById('crucibleProgressBar');
        const text = document.getElementById('crucibleProgressText');
        if (prog) prog.style.display = 'block';
        if (bar) bar.style.width = (current / total * 100) + '%';
        if (text) text.textContent = `${current}/${total} | $${equity.toFixed(2)}`;
      }
      function toggleCruciblePause() {
        if (typeof CrucibleRealTrading !== 'undefined') {
          const paused = CrucibleRealTrading.togglePause();
          event.target.textContent = paused ? 'RESUME' : 'PAUSE';
          event.target.classList.toggle('active', paused);
        }
      }
      function stopCrucible() {
        if (typeof CrucibleRealTrading !== 'undefined') {
          CrucibleRealTrading.stop();
          document.getElementById('crucibleProgress').style.display = 'none';
          showToast('Trading session stopped', 'info');
        }
      }
