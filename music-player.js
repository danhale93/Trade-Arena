/**
 * MUSIC PLAYER - Trade Arena Background Audio System
 * 60+ immersive tracks + full controls
 */

class MusicPlayer {
  constructor() {
    this.audio = document.getElementById('musicPlayer');
    this.playBtn = document.getElementById('playBtn');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.currentTrackEl = document.getElementById('currentTrack');

    // Tracklist - Trade Arena themed tracks (CDN royalty-free)
    this.tracks = [
      {title: 'Algorithm Bling', src: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-game-over-213.mp3'},
      {title: 'Digital Lever', src: 'https://assets.mixkit.co/sfx/preview/mixkit-coin-win-notification-1939.mp3'},
      {title: 'Weighted Wins', src: 'https://assets.mixkit.co/sfx/preview/mixkit-glitch-voice-1318.mp3'},
      {title: 'Fuck You Money', src: 'https://assets.mixkit.co/sfx/preview/mixkit-casino-winning-air-horn-1812.mp3'},
      {title: 'Green Pages', src: 'https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-2617.mp3'},
      {title: 'Money Lord Loop', src: 'https://assets.mixkit.co/sfx/preview/mixkit-8-bit-game-notification-332.mp3'},
      {title: 'Perpetual Profits', src: 'https://assets.mixkit.co/sfx/preview/mixkit-magic-notification-2488.mp3'},
      {title: 'Silicon Slots', src: 'https://assets.mixkit.co/sfx/preview/mixkit-short-notifications-for-games-2202.mp3'},
      {title: 'Arena Spin', src: 'https://assets.mixkit.co/sfx/preview/mixkit-coin-win-notification-1940.mp3'},
      {title: 'The Hack Arena', src: 'https://assets.mixkit.co/sfx/preview/mixkit-techno-glitch-1319.mp3'},
      {title: 'Crypto Cash', src: 'https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-2617.mp3'},
      {title: 'Diamond Hands', src: 'https://assets.mixkit.co/sfx/preview/mixkit-store-coin-release-2432.mp3'},
      {title: 'Blockchain Beats', src: 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3'},
      {title: 'Satoshi Groove', src: 'https://assets.mixkit.co/sfx/preview/mixkit-game-ball-tap-2073.mp3'},
      {title: 'Margin Call', src: 'https://assets.mixkit.co/sfx/preview/mixkit-negative-game-change-2485.mp3'},
      {title: 'Yield Farmer', src: 'https://assets.mixkit.co/sfx/preview/mixkit-coin-notification-1936.mp3'},
      {title: 'DeFi Dreams', src: 'https://assets.mixkit.co/sfx/preview/mixkit-magical-gift-opening-3128.mp3'},
      {title: 'HODL Hero', src: 'https://assets.mixkit.co/sfx/preview/mixkit-game-level-complete-3021.mp3'},
      {title: 'Rug Pull', src: 'https://assets.mixkit.co/sfx/preview/mixkit-negative-interface-appear-3115.mp3'},
      {title: 'Moon Landing', src: 'https://assets.mixkit.co/sfx/preview/mixkit-game-tick-archive-2931.mp3'},
      {title: 'Whale Alert', src: 'https://assets.mixkit.co/sfx/preview/mixkit-casino-winning-air-horn-1812.mp3'},
      {title: 'Alt Season', src: 'https://assets.mixkit.co/sfx/preview/mixkit-excited-crowd-cheer-1069.mp3'},
      {title: 'Bitcoin Billionaire', src: 'https://assets.mixkit.co/sfx/preview/mixkit-award-points-extra-2379.mp3'},
      {title: 'Flash Crash', src: 'https://assets.mixkit.co/sfx/preview/mixkit-hit-light-explosion-2811.mp3'},
      {title: 'Sniper Trade', src: 'https://assets.mixkit.co/sfx/preview/mixkit-sniper-game-start-2316.mp3'},
      {title: 'NFT Owner', src: 'https://assets.mixkit.co/sfx/preview/mixkit-receive-message-notification-2692.mp3'},
      {title: 'Smart Contract', src: 'https://assets.mixkit.co/sfx/preview/mixkit-tech-impact-2964.mp3'},
      {title: 'Gas War Winner', src: 'https://assets.mixkit.co/sfx/preview/mixkit-high-pitch-rooster-crowing-2470.mp3'},
      {title: 'Liquidity Pool', src: 'https://assets.mixkit.co/sfx/preview/mixkit-swipe-tab-2363.mp3'},
      {title: 'Staking Rewards', src: 'https://assets.mixkit.co/sfx/preview/mixkit-login-unlock-2481.mp3'},
      {title: 'Paper Hands', src: 'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-buzzer-949.mp3'},
      {title: 'Diamond Entry', src: 'https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-verification-2927.mp3'},
      {title: 'Leverage Legend', src: 'https://assets.mixkit.co/sfx/preview/mixkit-powerful-strike-feel-3138.mp3'},
      {title: 'Bear Trap Spring', src: 'https://assets.mixkit.co/sfx/preview/mixkit-box-launch-1539.mp3'},
      {title: 'Bull Run Born', src: 'https://assets.mixkit.co/sfx/preview/mixkit-shooting-stars-privacy-2867.mp3'},
      {title: 'Genesis Block', src: 'https://assets.mixkit.co/sfx/preview/mixkit-mysterious-cinematic-trailer-2919.mp3'},
      {title: 'Double Spend', src: 'https://assets.mixkit.co/sfx/preview/mixkit-metal-crash-and-thud-2933.mp3'},
      {title: '51 Percent Attack', src: 'https://assets.mixkit.co/sfx/preview/mixkit-alien-scream-696.mp3'},
      {title: 'Stable Swap', src: 'https://assets.mixkit.co/sfx/preview/mixkit-water-drop-2022.mp3'},
      {title: 'Token Burn', src: 'https://assets.mixkit.co/sfx/preview/mixkit-candle-fire-cinema-2850.mp3'},
      {title: 'DAO Vote', src: 'https://assets.mixkit.co/sfx/preview/mixkit-vote-for-a-candidate-2796.mp3'},
      {title: 'Airdrop Alert', src: 'https://assets.mixkit.co/sfx/preview/mixkit-magic-game-effect-2947.mp3'},
      {title: 'Genesis Trade', src: 'https://assets.mixkit.co/sfx/preview/mixkit-game-start-whoosh-2362.mp3'},
      {title: 'Ice Age Coming', src: 'https://assets.mixkit.co/sfx/preview/mixkit-cold-splash-water-in-the-surface-2978.mp3'},
      {title: 'Supercycle Start', src: 'https://assets.mixkit.co/sfx/preview/mixkit-future-networks-vision-2991.mp3'},
      {title: 'Wyckoff Schema', src: 'https://assets.mixkit.co/sfx/preview/mixkit-on--healing-899.mp3'},
      {title: 'Elliott Wave Rider', src: 'https://assets.mixkit.co/sfx/preview/mixkit-successful-style-20.mp3'},
      {title: 'Fibonacci Trader', src: 'https://assets.mixkit.co/sfx/preview/mixkit-notification-chime-2331.mp3'},
      {title: 'Ichimoku Cloud', src: 'https://assets.mixkit.co/sfx/preview/mixkit-cloudy-day-in-the-city-1069.mp3'},
      {title: 'RSI Oversold', src: 'https://assets.mixkit.co/sfx/preview/mixkit-overweight-careful-female-voice-2849.mp3'},
      {title: 'MACD Cross', src: 'https://assets.mixkit.co/sfx/preview/mixkit-crossbow-short-multiple-shoot-2360.mp3'},
      {title: 'Bollinger Break', src: 'https://assets.mixkit.co/sfx/preview/mixkit-balloon-pop-3132.mp3'},
      {title: 'VWAP Zone', src: 'https://assets.mixkit.co/sfx/preview/mixkit-soccer-ball-whistle-894.mp3'},
      {title: 'Order Book Deep', src: 'https://assets.mixkit.co/sfx/preview/mixkit-deep-pool-splash-2816.mp3'},
      {title: 'Market Maker Hunt', src: 'https://assets.mixkit.co/sfx/preview/mixkit-game-show-buzzers-and-horns-2914.mp3'},
      {title: 'Slippage Saver', src: 'https://assets.mixkit.co/sfx/preview/mixkit-save-notification-2537.mp3'},
      {title: 'Sandwich Attack', src: 'https://assets.mixkit.co/sfx/preview/mixkit-fast-food-customer-2742.mp3'},
      {title: 'MEV Bot Win', src: 'https://assets.mixkit.co/sfx/preview/mixkit-mechanical-arm-cup-2429.mp3'},
      {title: 'Arbitrage Juice', src: 'https://assets.mixkit.co/sfx/preview/mixkit-juicy-pop-3139.mp3'},
      {title: 'Tax Season Loss', src: 'https://assets.mixkit.co/sfx/preview/mixkit-paper-tear-855.mp3'},
      {title: 'Crypto Tax Return', src: 'https://assets.mixkit.co/sfx/preview/mixkit-happy-party- announcer-3127.mp3'}
    ];

    this.currentTrack = 0;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.5;

    this.init();
  }

  init() {
    if (!this.audio) return console.warn('MusicPlayer: No audio element found');

    // Setup event listeners
    this.audio.addEventListener('ended', () => this.playNext());
    this.audio.addEventListener('error', () => {
      console.warn('Track load error, skipping...');
      this.playNext();
    });

    // Sync UI
    if (this.volumeSlider) this.volumeSlider.value = this.volume;
    this.updateUI();

    // Load first track
    this.loadTrack(0);
    console.log('🎵 MusicPlayer initialized with', this.tracks.length, 'tracks');
  }

  loadTrack(index) {
    if (index < 0 || index >= this.tracks.length) return;

    this.currentTrack = index;
    if (this.audio) {
      this.audio.src = this.tracks[index].src;
      this.audio.load();
    }
    this.updateTrackDisplay();
  }

  playPause() {
    if (!this.audio) return;
    if (this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
      if (this.playBtn) this.playBtn.textContent = '▶️';
    } else {
      this.audio.play().catch(e => {
        console.warn('Play failed:', e);
        this.playNext();
      });
      this.isPlaying = true;
      if (this.playBtn) this.playBtn.textContent = '⏸️';
    }
    this.updateUI();
  }

  playNext() {
    const next = (this.currentTrack + 1) % this.tracks.length;
    this.loadTrack(next);
    if (this.isPlaying && this.audio) {
      this.audio.play().catch(e => console.warn('Next track error:', e));
    }
  }

  playPrev() {
    const prev = this.currentTrack === 0 ? this.tracks.length - 1 : this.currentTrack - 1;
    this.loadTrack(prev);
    if (this.isPlaying && this.audio) {
      this.audio.play().catch(e => console.warn('Prev track error:', e));
    }
  }

  setVolume(val) {
    this.volume = parseFloat(val);
    if (this.audio) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
    if (this.volumeSlider) {
      this.volumeSlider.value = val;
    }
  }

  toggleMute(forceMute = null) {
    if (forceMute !== null) {
      this.isMuted = forceMute;
    } else {
      this.isMuted = !this.isMuted;
    }

    if (this.audio) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
    this.updateUI();
  }

  updateTrackDisplay() {
    if (this.currentTrackEl) {
      this.currentTrackEl.textContent = this.tracks[this.currentTrack]?.title || 'Loading...';
    }
  }

  updateUI() {
    if (this.playBtn) {
      this.playBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
    }

    // Visual mute indicator
    if (this.currentTrackEl) {
      this.currentTrackEl.style.opacity = this.isMuted ? '0.5' : '1';
    }
  }
}

// Initialize when DOM is ready
let musicPlayerInstance = null;

function initMusicPlayer() {
  if (!musicPlayerInstance) {
    musicPlayerInstance = new MusicPlayer();
    window.MusicPlayer = musicPlayerInstance;

    // Export methods globally for onclick handlers
    window.MusicPlayer.playPause = window.MusicPlayer.playPause.bind(window.MusicPlayer);
    window.MusicPlayer.playNext = window.MusicPlayer.playNext.bind(window.MusicPlayer);
    window.MusicPlayer.playPrev = window.MusicPlayer.playPrev.bind(window.MusicPlayer);
    window.MusicPlayer.setVolume = window.MusicPlayer.setVolume.bind(window.MusicPlayer);
    window.MusicPlayer.toggleMute = window.MusicPlayer.toggleMute.bind(window.MusicPlayer);
  }
  return musicPlayerInstance;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicPlayer);
} else {
  initMusicPlayer();
}