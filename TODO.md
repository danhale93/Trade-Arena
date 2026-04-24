# Voice Agent Task Tracker

✅ **voice.js** - STT/TTS + Claude + command integration (COMPLETE)

**Next (IN PROGRESS):**
- [x] index.html: Add voice toggle + script import  
- [ ] app-rebuild.js: Expose voice commands (addBot, toggleCrucible, audit)  
- [ ] Test suite: "add bot", "crucible", "audit", "reset"  
- [ ] PWA manifest: voice permissions  

**Testing:**
```
1. npm run dev
2. Open localhost → say "add bot" 
3. Verify: bot added + TTS response
4. Say "crucible" → toggle + confirm
5. Say "audit" → run manual audit
```

**Demo Commands:**
- "add bot" → adds new trading bot
- "crucible" → toggle crucible mode  
- "audit" → run agent performance review
- "reset" → reset learning model
- "report balance" → voice balance update

**Roadmap:**
```
[ ] Voice dashboard widget (live commands, recent)
[ ] Adaptive voice speed (trading intensity)
[ ] Background voice monitoring (PWA service worker)
[ ] Offline mode (local TTS only)
```

