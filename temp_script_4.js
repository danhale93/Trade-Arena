
function toggleVoiceAgent() {
  if(typeof SFX !== "undefined") SFX.tick();
  if(typeof SFX !== 'undefined') SFX.tick();
  const modal = document.getElementById('voiceAgentModal');
  const btn = document.getElementById('voiceAgentBtn');
  if (!modal) return;
  const isOpen = modal.classList.toggle('open');
  if (btn) {
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
  }
}

async function sendVoiceCommand() {
  const input = document.getElementById('vaInput');
  const chat = document.getElementById('vaChat');
  const status = document.getElementById('vaStatus');
  const btn = input?.nextElementSibling;
  if (!input || !input.value.trim()) return;

  const cmd = input.value.trim();

  try {
    input.disabled = true;
    if (btn) btn.disabled = true;

    const userMsg = document.createElement('div');
    const userLabel = document.createElement('span');
    userLabel.style.color = 'var(--cyan)';
    userLabel.textContent = 'You: ';
    userMsg.appendChild(userLabel);
    userMsg.appendChild(document.createTextNode(cmd));
    chat.appendChild(userMsg);
    input.value = '';
    chat.scrollTop = chat.scrollHeight;

    status.textContent = 'Agent Thinking...';

    // Real LLM AI Floor Manager
    const apiKey = getApiKey();
  const systemPrompt = `You are the AI Floor Manager for Trade Arena. You have FULL AGENCY over the trading floor.
Your goal is to assist the user in managing their fleet of ${bots.length} trading bots.

CURRENT STATE:
- Balance: $${balance.toFixed(2)}
- Total P&L: $${totalPnl.toFixed(2)}
- Open Positions: ${openPositions.length}
- Market Regime: ${closedTrades.length > 0 ? closedTrades[closedTrades.length-1].regime : 'Scanning...'}
- ELO Standings: ${typeof getEloStandings === 'function' ? JSON.stringify(getEloStandings()) : 'N/A'}

AVAILABLE ACTIONS:
- SHOW_FLEET: Toggles compact fleet view.
- EMERGENCY_STOP: Stops all trading bots immediately.
- GENERATE_REPORT: Creates a performance pitch report.
- OPEN_ARENA: Displays the ELO ranking and tournament panel.
- OPEN_TASKS: Displays the earning tasks center.
- OPEN_STAFF: Opens the Staff Operations panel for maintenance and customer service.
- CLAIM_FAUCET: Requests $50 starting capital if eligible.
- EXECUTE_TRADE: Triggers a new trade on an available bot.

Respond in JSON format:
{
  "reply": "Your natural language response to the user",
  "action": "SHOW_FLEET | EMERGENCY_STOP | GENERATE_REPORT | OPEN_ARENA | OPEN_TASKS | OPEN_STAFF | CLAIM_FAUCET | EXECUTE_TRADE | NONE",
  "reasoning": "Internal reasoning for your choice"
}`;

  let aiResponse;

  if (!apiKey) {
    // Fallback if no API key
    aiResponse = {
      reply: "I'm operating in rule-based fallback mode (no API key). " + (cmd.toLowerCase().includes('balance') ? `Your balance is $${balance.toFixed(2)}.` : "How can I help with the fleet?"),
      action: cmd.toLowerCase().includes('stop') ? 'EMERGENCY_STOP' : 'NONE'
    };
  } else {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 300,
          messages: [{ role: 'user', content: `USER COMMAND: ${cmd}\n\n${systemPrompt}` }]
        })
      });
      const data = await res.json();
      aiResponse = JSON.parse((data.content?.[0]?.text || '{}').replace(/```json|```/g, '').trim());
    } catch (e) {
      console.error('Floor Manager LLM Error:', e);
      aiResponse = { reply: "I'm having trouble connecting to my cognitive core, but I'm still monitoring the telemetry.", action: 'NONE' };
    }
  }

  // Handle Actions
  switch (aiResponse.action) {
    case 'SHOW_FLEET': toggleFleetView(); break;
    case 'EMERGENCY_STOP': globalKill(); break;
    case 'GENERATE_REPORT': generatePitchReport(); break;
    case 'OPEN_ARENA': togglePanel('elo'); break;
    case 'OPEN_TASKS': togglePanel('task'); break;
    case 'OPEN_STAFF': togglePanel('staff'); break;
    case 'CLAIM_FAUCET': if (typeof claimFaucet === 'function') claimFaucet(); break;
    case 'EXECUTE_TRADE':
      const b = bots.find(bot => !bot.spinning && !bot.cooling);
      if (b) spinBot(b.id);
      break;
  }

    const agentMsg = document.createElement('div');
    const agentLabel = document.createElement('span');
    agentLabel.style.color = 'var(--purple)';
    agentLabel.textContent = 'Agent: ';
    agentMsg.appendChild(agentLabel);
    agentMsg.appendChild(document.createTextNode(aiResponse.reply));
    chat.appendChild(agentMsg);
    chat.scrollTop = chat.scrollHeight;
    status.textContent = 'Connected & Ready';

    if (typeof VOICE !== 'undefined' && VOICE.enabled) {
      VOICE.speak(aiResponse.reply);
    }
  } finally {
    input.disabled = false;
    if (btn) btn.disabled = false;
  }
}
