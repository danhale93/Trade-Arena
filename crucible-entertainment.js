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
  // Audio URLs (Using free royalty-free sources)
  sounds: {
    win: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    loss: 'https://assets.mixkit.co/active_storage/sfx/2016/2016-preview.mp3',
    trade: 'https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3',
    jackpot: 'https://assets.mixkit.co/active_storage/sfx/624/624-preview.mp3',
    boom: 'https://assets.mixkit.co/active_storage/sfx/2876/2876-preview.mp3',
    bell: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3',
  },

  // Hilarious commentary (sarcastic, rude, funny, random, silly)
  commentary: {
    wins: [
      "YESSSSS! 🎉 That's what I'm talking about! Your wallet just got THICC!",
      "BOOM! 💥 And THAT'S how you do it, ladies and gentlemen!",
      "HOLY GUACAMOLE! 🥑 Did you SEE that move?! LEGENDARY!",
      "OHHHHH SNAP! 😱 That's hot! That's REALLY hot!",
      "MAJESTIC! 👑 You just bent the market to your WILL!",
      "BRO! You just made money while I was ROASTING you! IMPRESSIVE!",
      "WHAT A LEGEND! 🌟 Your bank account just had a GLOW-UP!",
      "EZ MONEY! 💰 I could do this in my SLEEP!",
      "DING DING DING! 🔔 CORRECT ANSWER! YOU WIN MONIES!",
      "YEET! 🚀 That profit just LEFT THE EARTH!",
      "OKAY OKAY OKAY! 🎤 We got a GENIUS over here!",
      "NO CAP! 🧢 This is actually INSANE!",
      "BUSSIN! 💯 That's the good stuff right there!",
      "ABSOLUTELY UNHINGED! 🤪 (In a good way!)",
    ],
    losses: [
      "OHHHHH NOOOOO! 💔 That's... that's rough buddy!",
      "OOF! 😬 That one HURT didn't it?",
      "LMAO! 😭 Better luck next time, champ!",
      "YIKES ON BIKES! 🚴 That was NOT it!",
      "BRUHHHHH! 🤦 How did THAT happen?!",
      "MISSION FAILED! ❌ We'll get 'em next time!",
      "REKT! 💀 Absolutely DEMOLISHED!",
      "CRITICAL FAILURE! ⚠️ Even I flinched!",
      "NOPE! That's a big fat NO from me, dawg!",
      "CATASTROPHIC! 🌪️ A LITERAL DISASTER!",
      "AND IT'S GONE! 💨 Poof! Vanished! GONE!",
      "DEAD! ☠️ Completely and utterly FINISHED!",
      "SENT TO THE SHADOW REALM! 👻 R.I.P!",
      "BONK! 🔨 Back to the drawing board!",
    ],
    starts: [
      "ALRIGHT ALRIGHT ALRIGHT! 🎭 Let's GET RICH or DIE TRYIN'!",
      "LET'S GOOOOOOO! 🚀 Time to PRINT MONEY!",
      "READY?! 🎯 BUCKLE UP! We're going IN!",
      "HEY HEY HEY! 👋 Time to MAKE MOVES!",
      "LADIES AND GENTLEMEN! 🎪 Welcome to the SHOW!",
      "WELCOME BACK, YOU ABSOLUTE LEGENDS! 👑",
      "IT'S SHOWTIME BABY! 🎬 Let's MAKE IT RAIN!",
      "THIS IS IT! 🎉 THIS IS THE MOMENT!",
      "BOYS AND GIRLS! 📣 We're TRADING TODAY!",
      "BUCKLE UP BUTTERCUP! 🎢 HERE WE GOOOO!",
      "WHO'S READY TO MAKE SOME $$$$? 💰💰💰",
      "THIS IS YOUR MOMENT! ⭐ SHINE BRIGHT!",
    ],
    midSession: [
      "ABSOLUTE MADLAD! 🤪 Keep it UP!",
      "WE'RE COOKING! 🔥 Don't STOP now!",
      "MOMENTUM! 📈 We're UNSTOPPABLE!",
      "FIRE MODE! 🔥🔥🔥 ACTIVATED!",
      "THE STREAK! ⚡ DON'T BREAK IT!",
      "FILTHY CASUALS! 💎 That's how PROS do it!",
    ],
    milestones: [
      "10 TRADES IN! 🎂 That's a... snack?",
      "HALFWAY THROUGH! 🏁 We're COOKING!",
      "75% DONE! Almost at the FINISH LINE!",
      "20 TRADES BABY! 🏆 WE'RE CHAMPIONS!",
      "SESSION COMPLETE! 🎊 WHAT A ROLLERCOASTER!",
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
          background: rgba(0, 0, 0, 0.8);
          color: #00ff88;
          padding: 15px 25px;
          border-radius: 10px;
          font-family: 'Courier New', monospace;
          font-size: 16px;
          font-weight: bold;
          border: 2px solid #00ff88;
          z-index: 100000;
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
        }

        .win-counter {
          color: #00ff88;
        }

        .loss-counter {
          color: #ff3333;
        }

        .balance-display {
          color: #00ffff;
          font-size: 20px;
          margin-top: 10px;
        }

        .streak {
          animation: glow 1s infinite;
          color: #ffff00;
          font-size: 18px;
          margin-top: 5px;
        }
      </style>

      <div class="trade-ticker" id="trade-ticker">
        <div>📊 CRUCIBLE TRADING SHOW</div>
        <div class="win-counter">✅ WINS: 0</div>
        <div class="loss-counter">❌ LOSSES: 0</div>
        <div class="balance-display">💰 BALANCE: $50.00</div>
        <div class="streak">🔥 STREAK: 0</div>
      </div>
    `;

    document.body.appendChild(container);
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
    const ticker = document.getElementById('trade-ticker');
    if (ticker) {
      ticker.innerHTML = `
        <div>📊 CRUCIBLE TRADING SHOW</div>
        <div class="win-counter">✅ WINS: ${wins}</div>
        <div class="loss-counter">❌ LOSSES: ${losses}</div>
        <div class="balance-display">💰 BALANCE: $${balance.toFixed(2)}</div>
        <div class="streak">🔥 STREAK: ${streak}</div>
      `;
    }
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
