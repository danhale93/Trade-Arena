import re

with open('public/index.html', 'r') as f:
    content = f.read()

new_card = """<div class="login-card">
    <div class="login-card-hd">UNIFIED ARENA ACCESS</div>
    <div class="login-card-bd">
      <button class="mm-btn" onclick="if(typeof privyInit==='function') privyInit(); privyLoginGoogle()" style="width:100%; height: 52px; font-size: 16px;">
        ENTER ARENA
      </button>

      <div style="margin-top: 12px; display:flex; gap:8px;">
        <button class="onramp-btn" onclick="window.openMoonpay && window.openMoonpay()" style="flex:1">💳 DEPOSIT</button>
        <button class="offramp-btn" onclick="openOskoRamp('offramp')" style="flex:1">💵 WITHDRAW</button>
      </div>
    </div>
  </div>"""

# Replace the entire login-card div
content = re.sub(r'<div class="login-card">.*?<!-- Advanced Settings \(hidden by default\) -->.*?</div>\s*</div>', new_card, content, flags=re.DOTALL)

with open('public/index.html', 'w') as f:
    f.write(content)
