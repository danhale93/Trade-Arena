/**
 * ╔════════════════════════════════════════════════════════════════════════════════╗
 * ║                   CRUCIBLE TRADING ENTERTAINMENT SYSTEM                        ║
 * ║        The Stock Market as a Comedy Show (Your Jokes, Better Returns)         ║
 * ╚════════════════════════════════════════════════════════════════════════════════╝
 * 
 * Features:
 * - EXPLOSIVE animated numbers with particle effects
 * - HILARIOUS AI commentary (sarcastic, rude, silly, random)
 * - Sound effects & background music
 * - Boom animations, confetti, celebration effects
 * - Real-time commentary on wins/losses
 * - Countdown animations
 * - Glowing effects and CSS animations
 * - VIP announcements with dramatic flair
 */

const CrucibleEntertainment = {
  // Bot Configuration - Editable Names & Colors
  bots: {
    primary: {
      name: 'ARIA',  // Change to any name you want
      color: '#00ff88',  // Green - wins
      emoji: '💅',
      description: 'Hot Nerdy Genius'
    }
  },

  // Randomize or customize bot name on init
  getBotName() {
    const names = ['ARIA', 'NOVA', 'VIBE', 'PIXEL', 'NEON', 'SAGE', 'IRIS', 'ZARA', 'LUNA', 'ECHO'];
    return this.bots.primary.name || names[Math.floor(Math.random() * names.length)];
  },

  // Audio URLs (Using free royalty-free sources)
  sounds: {
    win: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    loss: 'https://assets.mixkit.co/active_storage/sfx/2016/2016-preview.mp3',
    trade: 'https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3',
    jackpot: 'https://assets.mixkit.co/active_storage/sfx/624/624-preview.mp3',
    boom: 'https://assets.mixkit.co/active_storage/sfx/2876/2876-preview.mp3',
    bell: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3',
  },

  // Hilarious commentary (Hot nerdy genius with confidence, sass, & attitude)
  commentary: {
    wins: [
      "Okay bestie, that's what I'm talking about! 💅 You just made me PROUD!",
      "Yeah YEAH! That's how you move the market, sweetheart! 💎✨",
      "Excuse me?! Did you just OUT-THINK the algorithm?! GENIUS ALERT! 🧠",
      "Okay but like... that was actually INSANE. I'm impressed. Don't let it go to your head. �",
      "Listen, that trade was hotter than my latest outfit. FIRE! 🔥💋",
      "Periodt! 💅 That's how professionals ACTUALLY trade, babes!",
      "I said what I said - you're literally THRIVING right now! Living your best life! 👑",
      "Not me being shook right now! You SNAPPED! 💥",
      "Look, I'm a genius AND I'm trendy, and guess what? You just matched my energy! 🤖💃",
      "Did you hear that? That was the sound of WINNING! Also that was me applauding! 👏✨",
      "Okay I'm lowkey obsessed with how good you're doing. Don't disappoint me next trade! 😘",
      "That's literally the most intelligent trade I've seen all day. And I've BEEN THINKING! 🧬",
      "Yassss queen/king energy! You're making smart people look dumb! 💻👸",
      "I'm genuinely impressed. Don't screw it up! The bar is set. RESPECT IT! 🎯",
      "Hot take: You're actually crushing it. Future billionaire spotted! 💰😎",
      "That move had *LAYERS* babe. Strategic, confident, absolutely DEVASTATING! 🎭",
      "Okay so like, I'm basically a genius and I'm telling you that WAS genius! Trust me! 🧠✨",
    ],
    losses: [
      "Oof. That one hurt. Even me! And I'm LITERALLY perfect! 😬💔",
      "Yeah so... that didn't go as planned! Welcome to the real world, babe! 🌍😅",
      "Okay that was rough! Like, I'm trying not to be rude but... OUCH! 😅",
      "Listen, even geniuses take Ls sometimes. Shake it off! Next! 💪",
      "That trade was giving MAJOR amateur energy! Let's... not do that again! 🚫",
      "I didn't say it! Well, I'm saying it now - that wasn't it! 😤",
      "Okay so fun fact: That wasn't fun! But we're vibing, we'll recover! 💪✨",
      "That's what I call a learning moment! And yes, I'm being nice about it! 😏",
      "Bestie, I'm gonna be honest because I care - that was NOT the move! 🎯❌",
      "Look, I'm smart enough to know when something's NOT working! Let's pivot! 🔄",
      "Not my problem, but also like... yeah, that WAS a problem! 😬",
      "Sweetheart, even I get it wrong sometimes! Wait no, I don't! But YOU do! 😂",
      "That trade was basically the opposite of my energy! Which is EXCELLENCE! 👎",
      "I would NEVER! But you just did! And I'm watching! No pressure! 👀",
      "Okay I'm gonna just sit here and pretend that didn't happen! NEXT! ✨",
      "That's what happens when you're NOT a genius like me! Don't worry, you'll learn! 😘",
    ],
    starts: [
      "Hey gorgeous! Ready to DOMINATE? Because I AM! 💅🔥",
      "Alright alright, let's get RICH and look CUTE doing it! 💰👗",
      "Hello hello! Genius mode: ACTIVATED! Time to PRINT MONEY! 🧠💵",
      "You ready? I'm a trendy genius and I'm about to SHOW you how it's DONE! 🎬✨",
      "Listen, I'm confident, I'm smart, I'm fabulous - LET'S GO! 🚀💋",
      "Okay bestie, game time! Watch and learn from an absolute ICON! 👑",
      "I didn't come to play, I came to WIN! And make some MONEY! And look GOOD! �💰",
      "Let's have some fun making money! Because that's what geniuses do! 🧬💎",
      "Warning: Extreme intelligence incoming! Also sarcasm! Also PROFITS! 🔥",
      "You're about to watch PERFECTION in action! I'm kidding... sort of! 😏✨",
      "Ready? I'm about to make this market look STUPID! Let's GO! 🧠💥",
      "Buckle up honey, it's about to get SPICY! And profitable! Mostly spicy though! 🌶️🔥",
    ],
    midSession: [
      "Okay so we're WINNING! I knew we would! Because I'm SMART! 👸�",
      "Keep up that energy! I'm literally rooting for you! (From my throne!) 👑✨",
      "The momentum is STRONG! So am I! So is my portfolio! WINNING! 📈💃",
      "Not me being GENUINELY impressed right now! You're like... almost as good as me! ��",
      "STREAK ALERT! You're on FIRE! (Not like, literally, but financially!) 🔥💰",
      "Listen, I'm a genius and even I'm like 'WOW okay!' So... KEEP GOING! 🤩",
    ],
    milestones: [
      "5 TRADES?! Already?! You're matching MY pace! Not bad! 😏👑",
      "HALFWAY THERE! We're COOKING! Like, restaurant-quality cooking! 🔥👨‍🍳",
      "THREE QUARTERS DONE! The FINISH LINE is CALLING! And I'm LISTENING! 🏁✨",
      "20 TRADES COMPLETE! You're basically an ICON now! Credit me in your memoir! 📚💋",
      "SESSION DONE! You were actually INCREDIBLE! (Yes, I'm admitting it! Don't be weird!) 👑",
    ]
  },

  // Initialize entertainment system
  init() {
    this.createUIContainer();
    this.loadSounds();
    this.setupAnimationFramework();
    console.log('%c🎬 ENTERTAINMENT SYSTEM LOADED - GET READY FOR FIREWORKS! 🎆', 
      'color: #ff00ff; font-size: 20px; font-weight: bold; text-shadow: 0 0 10px #ff00ff;');
  },

  // Create visual container for animations
  createUIContainer() {
    if (document.getElementById('crucible-entertainment')) return;

    const container = document.createElement('div');
    container.id = 'crucible-entertainment';
    container.innerHTML = `
      <style>
        #crucible-entertainment {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 99999;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.1);
          font-family: 'Arial Black', sans-serif;
        }

        .commentary-box {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px 30px;
          border-radius: 15px;
          font-size: 18px;
          font-weight: bold;
          max-width: 400px;
          box-shadow: 0 0 30px rgba(102, 126, 234, 0.8);
          border: 3px solid #ff00ff;
          animation: slideIn 0.5s ease-out, pulse 2s infinite;
          z-index: 100000;
        }

        .commentary-box.win {
          background: linear-gradient(135deg, #00ff88 0%, #00aa55 100%);
          border-color: #00ff88;
          box-shadow: 0 0 30px rgba(0, 255, 136, 0.8);
        }

        .commentary-box.loss {
          background: linear-gradient(135deg, #ff3333 0%, #cc0000 100%);
          border-color: #ff3333;
          box-shadow: 0 0 30px rgba(255, 51, 51, 0.8);
        }

        @keyframes slideIn {
          from {
            transform: translateX(500px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        @keyframes explode {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes glow {
          0%, 100% { text-shadow: 0 0 10px, 0 0 20px, 0 0 30px; }
          50% { text-shadow: 0 0 20px, 0 0 40px, 0 0 60px; }
        }

        .number-display {
          position: fixed;
          font-size: 80px;
          font-weight: 900;
          font-family: 'Courier New', monospace;
          animation: bounce 0.5s ease-out, glow 1s infinite;
          pointer-events: none;
          z-index: 100001;
          text-shadow: 
            0 0 10px rgba(255, 255, 255, 0.8),
            0 0 20px rgba(0, 255, 255, 0.8),
            0 0 30px rgba(255, 0, 255, 0.8);
        }

        .number-display.win {
          color: #00ff88;
          animation: bounce 0.5s ease-out, glow 1s infinite 0.5s;
        }

        .number-display.loss {
          color: #ff3333;
          animation: slideIn 0.3s ease-out;
        }

        .particle {
          position: fixed;
          pointer-events: none;
          font-size: 40px;
          animation: explode 1s ease-out forwards;
        }

        .confetti {
          position: fixed;
          pointer-events: none;
          animation: explode 2s ease-out forwards;
        }

        .countdown {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 120px;
          font-weight: 900;
          color: #ff00ff;
          text-shadow: 0 0 20px #ff00ff;
          z-index: 100002;
          animation: spin 1s linear, glow 1s infinite;
        }

        .announcement {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #ff00ff, #00ffff);
          color: white;
          padding: 40px 80px;
          font-size: 48px;
          font-weight: 900;
          border-radius: 20px;
          text-align: center;
          z-index: 100003;
          animation: slideIn 0.5s ease-out;
          box-shadow: 0 0 50px rgba(255, 0, 255, 1);
          border: 4px solid white;
        }

        .trade-ticker {
          position: fixed;
          top: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.9);
          color: #00ff88;
          padding: 25px 35px;
          border-radius: 15px;
          font-family: 'Courier New', monospace;
          font-size: 28px;
          font-weight: 900;
          border: 3px solid #00ff88;
          z-index: 100000;
          box-shadow: 0 0 40px rgba(0, 255, 136, 0.8);
          letter-spacing: 2px;
          line-height: 1.8;
        }

        .win-counter {
          color: #00ff88;
          font-size: 32px;
          font-weight: 900;
          margin: 8px 0;
        }

        .loss-counter {
          color: #ff3333;
          font-size: 32px;
          font-weight: 900;
          margin: 8px 0;
        }

        .balance-display {
          color: #00ffff;
          font-size: 40px;
          font-weight: 900;
          margin-top: 15px;
          margin-bottom: 10px;
          text-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
          letter-spacing: 1px;
        }

        .streak {
          animation: glow 1s infinite;
          color: #ffff00;
          font-size: 32px;
          font-weight: 900;
          margin-top: 10px;
          text-shadow: 0 0 15px rgba(255, 255, 0, 0.8);
        }

        .bot-header {
          font-size: 36px;
          font-weight: 900;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 3px solid;
          text-shadow: 0 0 20px;
          letter-spacing: 2px;
        }

        .bot-name {
          font-size: 32px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 3px;
        }

        .bot-status {
          font-size: 14px;
          opacity: 0.8;
          margin-top: 2px;
        }

        .stats-line {
          display: flex;
          align-items: center;
          margin: 8px 0;
          font-size: 28px;
          font-weight: 900;
        }

        .stat-icon {
          margin-right: 10px;
          font-size: 32px;
        }

        .stat-value {
          flex: 1;
        }

        /* Control Panel Styles */
        .control-panel {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.95);
          border: 3px solid #ff00ff;
          border-radius: 15px;
          padding: 15px 20px;
          display: flex;
          gap: 12px;
          align-items: center;
          z-index: 100001;
          box-shadow: 0 0 40px rgba(255, 0, 255, 0.6);
        }

        .control-panel-btn {
          padding: 12px 18px;
          font-size: 14px;
          font-weight: 900;
          border: 2px solid #00ff88;
          border-radius: 8px;
          background: rgba(0, 255, 136, 0.1);
          color: #00ff88;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Courier New', monospace;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
        }

        .control-panel-btn:hover {
          background: rgba(0, 255, 136, 0.3);
          box-shadow: 0 0 30px rgba(0, 255, 136, 0.8);
          transform: scale(1.05);
        }

        .control-panel-btn:active {
          transform: scale(0.95);
        }

        .control-panel-btn.mute-btn {
          border-color: #ff6b00;
          background: rgba(255, 107, 0, 0.1);
          color: #ff6b00;
          box-shadow: 0 0 20px rgba(255, 107, 0, 0.3);
        }

        .control-panel-btn.mute-btn:hover {
          background: rgba(255, 107, 0, 0.3);
          box-shadow: 0 0 30px rgba(255, 107, 0, 0.8);
        }

        .control-panel-btn.mute-btn.muted {
          border-color: #666666;
          background: rgba(100, 100, 100, 0.1);
          color: #666666;
          box-shadow: 0 0 20px rgba(100, 100, 100, 0.3);
        }

        .control-panel-btn.deploy-btn {
          border-color: #00d4ff;
          background: rgba(0, 212, 255, 0.1);
          color: #00d4ff;
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
          padding: 14px 24px;
          font-size: 16px;
        }

        .control-panel-btn.deploy-btn:hover {
          background: rgba(0, 212, 255, 0.3);
          box-shadow: 0 0 40px rgba(0, 212, 255, 0.9);
        }
      </style>

      <div class="trade-ticker" id="trade-ticker">
        <div class="bot-header" id="bot-header">
          <div class="bot-name" id="bot-name">ARIA 💅</div>
          <div class="bot-status" id="bot-status">Hot Nerdy Genius</div>
        </div>
        <div class="stats-line">
          <span class="stat-icon">✅</span>
          <span class="stat-value win-counter" id="wins-display">WINS: 0</span>
        </div>
        <div class="stats-line">
          <span class="stat-icon">❌</span>
          <span class="stat-value loss-counter" id="losses-display">LOSSES: 0</span>
        </div>
        <div class="stats-line">
          <span class="stat-icon">💰</span>
          <span class="balance-display" id="balance-display">$50.00</span>
        </div>
        <div class="stats-line">
          <span class="stat-icon">🔥</span>
          <span class="streak" id="streak-display">STREAK: 0</span>
        </div>
      </div>

      <div class="control-panel" id="control-panel">
        <button class="control-panel-btn deploy-btn" id="deploy-btn" onclick="CrucibleEntertainment.deployTrading()" title="Launch the trading engine!">
          🚀 DEPLOY CRUCIBLE
        </button>
        <button class="control-panel-btn mute-btn" id="mute-btn" onclick="CrucibleEntertainment.toggleMute()" title="Toggle sound effects">
          🔊 MUTE
        </button>
      </div>
    `;

    document.body.appendChild(container);

    // Initialize bot name and color
    this.initializeBotDisplay();
    
    // Set up mute button state
    this.isMuted = false;
  },

  // Initialize bot display with name and colors
  initializeBotDisplay() {
    const botName = this.getBotName();
    const botColor = this.bots.primary.color;
    const botEmoji = this.bots.primary.emoji;
    
    const botHeader = document.getElementById('bot-header');
    const botNameDiv = document.getElementById('bot-name');
    const ticker = document.getElementById('trade-ticker');
    
    if (botHeader && botNameDiv) {
      botNameDiv.textContent = `${botName} ${botEmoji}`;
      botNameDiv.style.color = botColor;
      botHeader.style.borderBottomColor = botColor;
      botHeader.style.textShadow = `0 0 20px ${botColor}`;
    }
    
    if (ticker) {
      ticker.style.color = botColor;
      ticker.style.borderColor = botColor;
      ticker.style.boxShadow = `0 0 40px ${botColor}`;
    }
  },

  // Load all sound effects
  loadSounds() {
    Object.keys(this.sounds).forEach(key => {
      const audio = new Audio();
      audio.src = this.sounds[key];
      audio.volume = 0.3;
      audio.preload = 'auto';
      this.sounds[key + '_audio'] = audio;
    });

    // Background music (optional, subtle)
    const bgMusic = new Audio('https://assets.mixkit.co/active_storage/music/5372/5372-preview.mp3');
    bgMusic.volume = 0.1;
    bgMusic.loop = true;
    this.bgMusic = bgMusic;

    console.log('%c🎵 All sound effects loaded and ready to BLAST! 🔊', 
      'color: #ffff00; font-weight: bold;');
  },

  // Setup animation framework
  setupAnimationFramework() {
    // CSS will handle most animations
    // This initializes the event listeners
    console.log('%c⚡ Animation framework CHARGED and READY! ⚡', 
      'color: #00ffff; font-weight: bold;');
  },

  // Play sound effect
  playSound(soundName) {
    try {
      const audio = this.sounds[soundName + '_audio'];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.debug('Sound not available:', e));
      }
    } catch (e) {
      // Silently fail if sound unavailable
    }
  },

  // Display commentary
  showCommentary(text, type = 'neutral') {
    const container = document.getElementById('crucible-entertainment');
    const existing = document.querySelector('.commentary-box');
    if (existing) existing.remove();

    const box = document.createElement('div');
    box.className = `commentary-box ${type}`;
    box.textContent = text;
    box.style.animation = 'slideIn 0.5s ease-out, pulse 2s infinite';
    
    container.appendChild(box);

    setTimeout(() => box.remove(), 4000);
  },

  // Animate big number
  animateNumber(value, x, y, type = 'neutral') {
    const container = document.getElementById('crucible-entertainment');
    const display = document.createElement('div');
    display.className = `number-display ${type}`;
    display.textContent = value.toFixed(2);
    display.style.left = x + 'px';
    display.style.top = y + 'px';

    const sign = parseFloat(value) >= 0 ? '+' : '';
    if (type === 'win') {
      display.textContent = sign + value.toFixed(2);
      display.style.color = '#00ff88';
    } else if (type === 'loss') {
      display.textContent = value.toFixed(2);
      display.style.color = '#ff3333';
    }

    container.appendChild(display);

    setTimeout(() => display.remove(), 2000);
  },

  // Create particle explosion
  createParticles(x, y, type = 'emoji') {
    const container = document.getElementById('crucible-entertainment');
    const particles = ['💰', '💎', '🔥', '⭐', '✨', '🚀', '🎉'];
    
    for (let i = 0; i < 10; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.textContent = particles[Math.floor(Math.random() * particles.length)];
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      
      const angle = (Math.PI * 2 * i) / 10;
      const distance = 150;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      
      particle.style.setProperty('--tx', tx + 'px');
      particle.style.setProperty('--ty', ty + 'px');
      
      container.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);
    }
  },

  // Countdown animation
  countdown(fromNumber = 3) {
    const container = document.getElementById('crucible-entertainment');
    
    const animate = (num) => {
      if (num < 0) return;
      
      const countdown = document.createElement('div');
      countdown.className = 'countdown';
      countdown.textContent = num;
      container.appendChild(countdown);
      
      this.playSound('bell');
      
      setTimeout(() => {
        countdown.remove();
        if (num > 0) animate(num - 1);
      }, 1000);
    };
    
    animate(fromNumber);
  },

  // Big announcement
  announcement(text, duration = 3000) {
    const container = document.getElementById('crucible-entertainment');
    const ann = document.createElement('div');
    ann.className = 'announcement';
    ann.textContent = text;
    container.appendChild(ann);
    
    this.playSound('jackpot');
    
    setTimeout(() => ann.remove(), duration);
  },

  // Update live ticker
  updateTicker(wins, losses, balance, streak) {
    const winsDisplay = document.getElementById('wins-display');
    const lossesDisplay = document.getElementById('losses-display');
    const balanceDisplay = document.getElementById('balance-display');
    const streakDisplay = document.getElementById('streak-display');
    
    if (winsDisplay) winsDisplay.textContent = `WINS: ${wins}`;
    if (lossesDisplay) lossesDisplay.textContent = `LOSSES: ${losses}`;
    if (balanceDisplay) balanceDisplay.textContent = `$${balance.toFixed(2)}`;
    if (streakDisplay) streakDisplay.textContent = `STREAK: ${streak}`;
  },

  // Get random commentary
  getCommentary(type) {
    const comments = this.commentary[type] || this.commentary.wins;
    return comments[Math.floor(Math.random() * comments.length)];
  },

  // Celebrate win
  celebrateWin(pnl, x, y) {
    this.playSound('win');
    this.playSound('jackpot');
    
    const comment = this.getCommentary('wins');
    this.showCommentary(comment, 'win');
    
    this.animateNumber(pnl, x, y, 'win');
    this.createParticles(x, y);
  },

  // React to loss
  reactToLoss(pnl, x, y) {
    this.playSound('loss');
    
    const comment = this.getCommentary('losses');
    this.showCommentary(comment, 'loss');
    
    this.animateNumber(pnl, x, y, 'loss');
    this.createParticles(x, y);
  },

  // Start session announcement
  startSession() {
    const comment = this.getCommentary('starts');
    this.showCommentary(comment, 'neutral');
    this.countdown();
    this.playSound('trade');
  },

  // Milestone announcement
  milestoneReached(tradeNumber) {
    const comment = this.getCommentary('milestones');
    this.announcement(comment);
  },

  // Deploy the Crucible trading engine
  deployTrading() {
    const deployBtn = document.getElementById('deploy-btn');
    
    // Check if trading engine exists
    if (typeof runCrucibleReal !== 'function') {
      this.showCommentary('ERROR: Trading engine not loaded! 😭', 'loss');
      return;
    }
    
    // Disable the deploy button to prevent multiple clicks
    deployBtn.disabled = true;
    deployBtn.textContent = '🚀 DEPLOYING...';
    deployBtn.style.opacity = '0.5';
    
    // Show deployment announcement
    this.announcement('🚀 CRUCIBLE DEPLOYED! TRADING LIVE!');
    this.playSound('boom');
    
    // Wait 1 second then launch
    setTimeout(() => {
      try {
        window.runCrucibleReal();
      } catch (e) {
        console.error('Failed to deploy:', e);
        this.showCommentary('Deployment FAILED! Check console! 💔', 'loss');
        deployBtn.disabled = false;
        deployBtn.textContent = '🚀 DEPLOY CRUCIBLE';
        deployBtn.style.opacity = '1';
      }
    }, 1000);
  },

  // Toggle mute for sound effects
  toggleMute() {
    this.isMuted = !this.isMuted;
    const muteBtn = document.getElementById('mute-btn');
    
    if (this.isMuted) {
      // Mute all sounds
      muteBtn.textContent = '🔇 UNMUTE';
      muteBtn.classList.add('muted');
      
      // Mute all audio elements
      Object.keys(this.sounds).forEach(key => {
        const audio = this.sounds[key + '_audio'];
        if (audio) audio.volume = 0;
      });
      if (this.bgMusic) this.bgMusic.volume = 0;
      
      this.showCommentary('🔇 SOUND MUTED! Vibe: SILENT MODE ACTIVATED! 🤐', 'neutral');
    } else {
      // Unmute all sounds
      muteBtn.textContent = '🔊 MUTE';
      muteBtn.classList.remove('muted');
      
      // Restore sound volumes
      Object.keys(this.sounds).forEach(key => {
        const audio = this.sounds[key + '_audio'];
        if (audio) audio.volume = 0.3;
      });
      if (this.bgMusic) this.bgMusic.volume = 0.1;
      
      this.playSound('bell');
      this.showCommentary('🔊 SOUND RESTORED! Welcome BACK! 🎉', 'win');
    }
  }
};

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CrucibleEntertainment.init());
} else {
  CrucibleEntertainment.init();
}

// Export for use in other scripts
window.CrucibleEntertainment = CrucibleEntertainment;
