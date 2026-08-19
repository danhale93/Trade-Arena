# Trade Olympics UI Implementation

## Quick Start: Add Olympics Leaderboard to Your App

### 1. Add HTML Panel

Add this to your `index.html` (in the panels section):

```html
<!-- Olympics Leaderboard Panel -->
<div id="olympics-panel" class="panel" style="grid-column: 1 / -1; margin-top: 20px;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
    <h3 style="color: gold; margin: 0;">🏅 TRADE OLYMPICS</h3>
    <button onclick="refreshOlympics()" style="padding: 8px 15px; background: gold; color: black; border: none; cursor: pointer; border-radius: 5px;">Refresh</button>
  </div>

  <!-- Summary Stats -->
  <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 20px;">
    <div style="background: var(--chrome); padding: 15px; border-radius: 8px; border: 2px solid var(--gold);">
      <div style="color: var(--cyan); font-size: 12px;">Total Brackets</div>
      <div style="color: var(--gold); font-size: 20px; font-weight: bold;" id="oly-total-brackets">480</div>
    </div>
    <div style="background: var(--chrome); padding: 15px; border-radius: 8px; border: 2px solid var(--cyan);">
      <div style="color: var(--cyan); font-size: 12px;">Total Models</div>
      <div style="color: var(--cyan); font-size: 20px; font-weight: bold;" id="oly-total-models">12</div>
    </div>
    <div style="background: var(--chrome); padding: 15px; border-radius: 8px; border: 2px solid var(--green);">
      <div style="color: var(--cyan); font-size: 12px;">Total Trades</div>
      <div style="color: var(--green); font-size: 20px; font-weight: bold;" id="oly-total-trades">0</div>
    </div>
    <div style="background: var(--chrome); padding: 15px; border-radius: 8px; border: 2px solid var(--hot);">
      <div style="color: var(--cyan); font-size: 12px;">Total P&L</div>
      <div style="color: var(--hot); font-size: 20px; font-weight: bold;" id="oly-total-pnl">$0</div>
    </div>
    <div style="background: var(--chrome); padding: 15px; border-radius: 8px; border: 2px solid var(--purple);">
      <div style="color: var(--cyan); font-size: 12px;">Top Model</div>
      <div style="color: var(--purple); font-size: 14px; font-weight: bold;" id="oly-top-model">—</div>
    </div>
  </div>

  <!-- Tabs -->
  <div style="display: flex; gap: 10px; margin-bottom: 15px; border-bottom: 2px solid var(--chrome);">
    <button onclick="showOlympicsTab('rankings')" id="tab-rankings" style="padding: 10px 20px; background: var(--gold); color: black; border: none; cursor: pointer; font-weight: bold;">📊 Rankings</button>
    <button onclick="showOlympicsTab('topbrackets')" id="tab-topbrackets" style="padding: 10px 20px; background: transparent; color: var(--cyan); border: none; cursor: pointer;">🏆 Top Brackets</button>
    <button onclick="showOlympicsTab('weakbrackets')" id="tab-weakbrackets" style="padding: 10px 20px; background: transparent; color: var(--cyan); border: none; cursor: pointer;">⚠️ Weakest</button>
  </div>

  <!-- Rankings Table -->
  <div id="oly-rankings-tab" style="overflow-x: auto;">
    <table style="width: 100%; color: var(--cyan); font-size: 12px; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid var(--gold);">
          <th style="padding: 10px; text-align: left;">Rank</th>
          <th style="padding: 10px; text-align: left;">Medal</th>
          <th style="padding: 10px; text-align: left;">Model</th>
          <th style="padding: 10px; text-align: left;">Provider</th>
          <th style="padding: 10px; text-align: right;">ELO</th>
          <th style="padding: 10px; text-align: right;">Total P&L</th>
          <th style="padding: 10px; text-align: right;">Win Rate</th>
          <th style="padding: 10px; text-align: right;">Trades</th>
          <th style="padding: 10px; text-align: right;">Brackets</th>
        </tr>
      </thead>
      <tbody id="oly-rankings-body">
        <!-- Populated by JavaScript -->
      </tbody>
    </table>
  </div>

  <!-- Top Brackets Tab -->
  <div id="oly-topbrackets-tab" style="display: none; overflow-x: auto;">
    <table style="width: 100%; color: var(--cyan); font-size: 11px; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid var(--gold);">
          <th style="padding: 8px; text-align: left;">Bracket</th>
          <th style="padding: 8px; text-align: left;">Model</th>
          <th style="padding: 8px; text-align: right;">Trades</th>
          <th style="padding: 8px; text-align: right;">Wins</th>
          <th style="padding: 8px; text-align: right;">Win Rate</th>
          <th style="padding: 8px; text-align: right;">Total P&L</th>
          <th style="padding: 8px; text-align: right;">Avg P&L</th>
        </tr>
      </thead>
      <tbody id="oly-topbrackets-body">
        <!-- Populated by JavaScript -->
      </tbody>
    </table>
  </div>

  <!-- Weakest Brackets Tab -->
  <div id="oly-weakbrackets-tab" style="display: none; overflow-x: auto;">
    <table style="width: 100%; color: var(--hot); font-size: 11px; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid var(--hot);">
          <th style="padding: 8px; text-align: left;">Bracket</th>
          <th style="padding: 8px; text-align: left;">Model</th>
          <th style="padding: 8px; text-align: right;">Trades</th>
          <th style="padding: 8px; text-align: right;">Wins</th>
          <th style="padding: 8px; text-align: right;">Win Rate</th>
          <th style="padding: 8px; text-align: right;">Total P&L</th>
          <th style="padding: 8px; text-align: right;">Avg P&L</th>
        </tr>
      </thead>
      <tbody id="oly-weakbrackets-body">
        <!-- Populated by JavaScript -->
      </tbody>
    </table>
  </div>
</div>
```

### 2. Add JavaScript Functions

Add this to your `index.html` (in the `<script>` section or as a separate file):

```javascript
// ════════════════════════════════════════════════════════════════════════════════
// TRADE OLYMPICS UI FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

function refreshOlympics() {
  updateOlympicsPanel();
  console.log('[Olympics] Panel refreshed');
}

function updateOlympicsPanel() {
  if (typeof TRADE_OLYMPICS === 'undefined') {
    console.warn('[Olympics] TRADE_OLYMPICS not loaded');
    return;
  }

  // Update summary stats
  const summary = TRADE_OLYMPICS.getSummary();
  document.getElementById('oly-total-brackets').textContent = summary.totalBrackets;
  document.getElementById('oly-total-models').textContent = summary.totalModels;
  document.getElementById('oly-total-trades').textContent = summary.totalTrades.toLocaleString();
  document.getElementById('oly-total-pnl').textContent = '$' + summary.totalPnL.toLocaleString('en-US', { maximumFractionDigits: 0 });
  document.getElementById('oly-top-model').textContent = summary.topModel || '—';

  // Update rankings table
  updateOlympicsRankings();
}

function updateOlympicsRankings() {
  const rankings = TRADE_OLYMPICS.getLeaderboard('totalPnL');
  const tbody = document.getElementById('oly-rankings-body');
  tbody.innerHTML = '';

  rankings.forEach((model, index) => {
    const row = tbody.insertRow();
    
    // Alternate row colors
    if (index % 2 === 0) {
      row.style.backgroundColor = 'rgba(15, 9, 20, 0.3)';
    }

    const medal = model.medal || '';
    const pnlColor = model.totalPnL >= 0 ? 'var(--green)' : 'var(--hot)';
    const winRateColor = model.overallWinRate >= 0.6 ? 'var(--green)' : (model.overallWinRate >= 0.5 ? 'var(--gold)' : 'var(--hot)');

    row.innerHTML = `
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome);">
        <span style="color: var(--gold); font-weight: bold;">${model.rank}</span>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); font-size: 18px;">
        ${medal}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); color: var(--purple);">
        ${model.model}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); color: var(--cyan);">
        ${model.provider}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); text-align: right; color: var(--gold);">
        ${model.elo}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); text-align: right; color: ${pnlColor}; font-weight: bold;">
        $${model.totalPnL.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); text-align: right; color: ${winRateColor};">
        ${(model.overallWinRate * 100).toFixed(1)}%
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); text-align: right;">
        ${model.totalTrades}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); text-align: right;">
        ${model.bracketsAssigned.length}
      </td>
    `;
  });
}

function showOlympicsTab(tabName) {
  // Hide all tabs
  document.getElementById('oly-rankings-tab').style.display = 'none';
  document.getElementById('oly-topbrackets-tab').style.display = 'none';
  document.getElementById('oly-weakbrackets-tab').style.display = 'none';

  // Reset button styles
  document.getElementById('tab-rankings').style.background = 'transparent';
  document.getElementById('tab-rankings').style.color = 'var(--cyan)';
  document.getElementById('tab-topbrackets').style.background = 'transparent';
  document.getElementById('tab-topbrackets').style.color = 'var(--cyan)';
  document.getElementById('tab-weakbrackets').style.background = 'transparent';
  document.getElementById('tab-weakbrackets').style.color = 'var(--cyan)';

  // Show selected tab and highlight button
  if (tabName === 'rankings') {
    document.getElementById('oly-rankings-tab').style.display = 'block';
    document.getElementById('tab-rankings').style.background = 'var(--gold)';
    document.getElementById('tab-rankings').style.color = 'black';
    updateOlympicsRankings();
  } else if (tabName === 'topbrackets') {
    document.getElementById('oly-topbrackets-tab').style.display = 'block';
    document.getElementById('tab-topbrackets').style.background = 'var(--gold)';
    document.getElementById('tab-topbrackets').style.color = 'black';
    updateTopBracketsTable();
  } else if (tabName === 'weakbrackets') {
    document.getElementById('oly-weakbrackets-tab').style.display = 'block';
    document.getElementById('tab-weakbrackets').style.background = 'var(--hot)';
    document.getElementById('tab-weakbrackets').style.color = 'black';
    updateWeakBracketsTable();
  }
}

function updateTopBracketsTable() {
  const topBrackets = TRADE_OLYMPICS.getTopBrackets(20);
  const tbody = document.getElementById('oly-topbrackets-body');
  tbody.innerHTML = '';

  topBrackets.forEach((bracket, index) => {
    const row = tbody.insertRow();
    
    if (index % 2 === 0) {
      row.style.backgroundColor = 'rgba(15, 9, 20, 0.3)';
    }

    const medal = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : ''));
    
    row.innerHTML = `
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); color: var(--cyan);">
        ${medal} ${bracket.bracket}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); color: var(--purple);">
        ${bracket.assignedModel}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); text-align: right;">
        ${bracket.trades}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); text-align: right; color: var(--green);">
        ${bracket.wins}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); text-align: right; color: var(--green);">
        ${(bracket.winRate * 100).toFixed(1)}%
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); text-align: right; color: var(--green); font-weight: bold;">
        $${bracket.totalPnL.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); text-align: right; color: var(--gold);">
        $${bracket.avgPnL.toLocaleString('en-US', { maximumFractionDigits: 2 })}
      </td>
    `;
  });
}

function updateWeakBracketsTable() {
  const weakBrackets = TRADE_OLYMPICS.getWeakestBrackets(20);
  const tbody = document.getElementById('oly-weakbrackets-body');
  tbody.innerHTML = '';

  weakBrackets.forEach((bracket, index) => {
    const row = tbody.insertRow();
    
    if (index % 2 === 0) {
      row.style.backgroundColor = 'rgba(15, 9, 20, 0.3)';
    }

    row.innerHTML = `
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); color: var(--cyan);">
        ${bracket.bracket}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); color: var(--purple);">
        ${bracket.assignedModel}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); text-align: right;">
        ${bracket.trades}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); text-align: right; color: var(--hot);">
        ${bracket.wins}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); text-align: right; color: var(--hot);">
        ${(bracket.winRate * 100).toFixed(1)}%
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); text-align: right; color: var(--hot); font-weight: bold;">
        $${bracket.totalPnL.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid var(--chrome); text-align: right; color: var(--hot);">
        $${bracket.avgPnL.toLocaleString('en-US', { maximumFractionDigits: 2 })}
      </td>
    `;
  });
}

// Auto-refresh Olympics panel every 30 seconds
setInterval(() => {
  if (typeof TRADE_OLYMPICS !== 'undefined') {
    updateOlympicsPanel();
  }
}, 30000);

// Initial update on page load
window.addEventListener('load', () => {
  setTimeout(() => {
    if (typeof TRADE_OLYMPICS !== 'undefined') {
      updateOlympicsPanel();
      console.log('[Olympics] UI initialized');
    }
  }, 1000);
});
```

### 3. Integration Points

The Olympics system automatically records trades when:
1. `callAI()` is called on a bot
2. A decision is made (method, token, edge)
3. Result is recorded

**No additional code needed!** The system works automatically.

### 4. Example: Check Olympics Data in Console

```javascript
// In browser console:

// View all model rankings
TRADE_OLYMPICS.getLeaderboard('totalPnL')

// View top 10 brackets
TRADE_OLYMPICS.getTopBrackets(10)

// Compare two models
TRADE_OLYMPICS.compareModels('gpt-5-turbo', 'claude-3.5-sonnet')

// Get summary
TRADE_OLYMPICS.getSummary()

// Get specific model's stats
TRADE_OLYMPICS.STANDINGS['gpt-5-turbo']
```

---

## Styling Notes

The panel uses your existing CSS variables:
- `--gold` for highlights
- `--cyan` for text
- `--green` for positive numbers
- `--hot` for negative numbers
- `--purple` for model names
- `--chrome` for borders

Adjust colors in the HTML/CSS if needed.

---

## Next Steps

1. ✅ Add HTML panel to index.html
2. ✅ Add JavaScript functions
3. ✅ Start trading with bots
4. ✅ Olympics data accumulates automatically
5. ✅ View leaderboard and stats
6. 📋 Export Olympics data
7. 📋 Create comparison charts
