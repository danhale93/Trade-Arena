import os

path = 'public/index.html'
with open(path, 'r') as f:
    content = f.read()

# 1. Rename Slot machine TOKENS to SLOT_TOKENS
content = content.replace('const TOKENS=[', 'const SLOT_TOKENS=[')
content = content.replace('fill(`mt0-${id}`,TOKENS)', 'fill(`mt0-${id}`,SLOT_TOKENS)')
content = content.replace('fill(`mt2-${id}`,TOKENS.slice(0,6))', 'fill(`mt2-${id}`,SLOT_TOKENS.slice(0,6))')
content = content.replace('TOKENS.findIndex(t=>t.l===decision.token)', 'SLOT_TOKENS.findIndex(t=>t.l===decision.token)')

# 2. Fix redundant updateMatrix in setupApp (I added it twice by mistake)
# Let's find the exact sequence and simplify it.
# Sequence was:
# try{ updateMatrix(); }catch(e){}
# try{ addBot(); }catch(e){ console.error('addBot:',e); }
# try{ updateMatrix(); }catch(e){}

bad_sequence = """      try{ updateMatrix(); }catch(e){}
      try{ addBot(); }catch(e){ console.error('addBot:',e); }
      try{ updateMatrix(); }catch(e){}"""

good_sequence = """      try{ addBot(); }catch(e){ console.error('addBot:',e); }
      try{ updateMatrix(); }catch(e){}"""

content = content.replace(bad_sequence, good_sequence)

with open(path, 'w') as f:
    f.write(content)
