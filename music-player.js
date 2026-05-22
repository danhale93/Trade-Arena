/**
 * MUSIC PLAYER - Trade Arena Background Audio System
 * 60+ immersive tracks + full controls
 */

class MusicPlayer {
  constructor() {
    this.audio = document.getElementById('musicPlayer');
    this.playBtn = document.getElementById('playBtn');
    this.ghPlayBtn = document.getElementById('ghPlayBtn');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.ghVolume = document.getElementById('ghVolume');
    this.currentTrackEl = document.getElementById('currentTrack');

    // Tracklist - Trade Arena themed tracks (Mixkit CDN royalty-free)
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
      {title: 'Crypto Crescendo', src: 'https://assets.mixkit.co/sfx/preview/mixkit-game-success-notification-892.mp3'},
      {title: 'Diamond Hands', src: 'https://assets.mixkit.co/sfx/preview/mixkit-mysterious-game-treasure-closing-903.mp3'},
      {title: 'Yield Farmer', src: 'https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-2616.mp3'},
      {title: 'HODL Hero', src: 'https://assets.mixkit.co/sfx/preview/mixkit-game-level-cleared-2061.mp3'},
      {title: 'Bullish Beats', src: 'https://assets.mixkit.co/sfx/preview/mixkit-casino-bonus-announcement-1810.mp3'},
      {title: 'Paper Hands', src: 'https://assets.mixkit.co/sfx/preview/mixkit-game-over-tone-2073.mp3'},
      {title: 'Whale Alert', src: 'https://assets.mixkit.co/sfx/preview/mixkit-alert-sound-892.mp3'},
      {title: 'DeFi Dream', src: 'https://assets.mixkit.co/sfx/preview/mixkit-fantasy-game-bonus-collected-1988.mp3'},
      {title: 'Rug Pull', src: 'https://assets.mixkit.co/sfx/preview/mixkit-negative-game-notification-2491.mp3'},
      {title: 'Moon Shot', src: 'https://assets.mixkit.co/sfx/preview/mixkit-flash-effervescent-728.mp3'},
      {title: 'Chart Patterns', src: 'https://assets.mixkit.co/sfx/preview/mixkit-tech-digital-futuristic-success-287.mp3'},
      {title: 'Candle Glow', src: 'https://assets.mixkit.co/sfx/preview/mixkit-game-tick-2005.mp3'},
      {title: 'Volume Spike', src: 'https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-2619.mp3'},
      {title: 'Market Makers', src: 'https://assets.mixkit.co/sfx/preview/mixkit-audit-success-2081.mp3'},
      {title: 'Order Book Deep', src: 'https://assets.mixkit.co/sfx/preview/mixkit-water-splash-1366.mp3'},
      {title: 'Leverage Loop', src: 'https://assets.mixkit.co/sfx/preview/mixkit-sci-fi-click-1096.mp3'},
      {title: 'Margin Call', src: 'https://assets.mixkit.co/sfx/preview/mixkit-fail-trombone-original-23.mp3'},
      {title: 'Liquidation Station', src: 'https://assets.mixkit.co/sfx/preview/mixkit-negative-game-notification-2492.mp3'},
      {title: 'Funding Fee', src: 'https://assets.mixkit.co/sfx/preview/mixkit-metal-hit-2079.mp3'},
      {title: 'Perpetual Swaps', src: 'https://assets.mixkit.co/sfx/preview/mixkit-swap-endlessly-1588.mp3'},
      {title: 'Delta Neutral', src: 'https://assets.mixkit.co/sfx/preview/mixkit-calm-piano-581.mp3'},
      {title: 'Impermanent Loss', src: 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-success-2433.mp3'},
      {title: 'APY Dreams', src: 'https://assets.mixkit.co/sfx/preview/mixkit-cash-register-ambience-1961.mp3'},
      {title: 'Gas Fees', src: 'https://assets.mixkit.co/sfx/preview/mixkit-negative-game-notification-2490.mp3'},
      {title: 'Block Confirm', src: 'https://assets.mixkit.co/sfx/preview/mixkit-success-automation-success-318.mp3'},
      {title: 'Slippage Slip', src: 'https://assets.mixkit.co/sfx/preview/mixkit-slick-game-swoosh-2188.mp3'},
      {title: 'MEV Capture', src: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-game-jump-223.mp3'},
      {title: 'Flash Loan', src: 'https://assets.mixkit.co/sfx/preview/mixkit-sci-fi-crystal-laser-890.mp3'},
      {title: 'Arbitrage Arc', src: 'https://assets.mixkit.co/sfx/preview/mixkit-fast-swoosh-1562.mp3'},
      {title: 'Sandwich Attack', src: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-opponent-hit-2057.mp3'},
      {title: 'Jpeg Lord', src: 'https://assets.mixkit.co/sfx/preview/mixkit-art-bell-652.mp3'},
      {title: 'PFP Profits', src: 'https://assets.mixkit.co/sfx/preview/mixkit-magic-notification-2487.mp3'},
      {title: 'Floor Rising', src: 'https://assets.mixkit.co/sfx/preview/mixkit-level-up-effect-2600.mp3'},
      {title: 'Blue Chip Blue', src: 'https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-2618.mp3'},
      {title: 'Stable Gain', src: 'https://assets.mixkit.co/sfx/preview/mixkit-cash-register-ambience-1960.mp3'},
      {title: 'Alt Season', src: 'https://assets.mixkit.co/sfx/preview/mixkit-music-for-movies-34.mp3'},
      {title: 'BTC Maxi', src: 'https://assets.mixkit.co/sfx/preview/mixkit-serious-game-over-2074.mp3'},
      {title: 'Ethereum Elite', src: 'https://assets.mixkit.co/sfx/preview/mixkit-game-success-celebration-894.mp3'},
      {title: 'Meme Coin Mania', src: 'https://assets.mixkit.co/sfx/preview/mixkit-cartoon-toy-bump-1948.mp3'},
      {title: 'Degen Deck', src: 'https://assets.mixkit.co/sfx/preview/mixkit-casino-win-tones-2819.mp3'},
      {title: 'Sniper Bot', src: 'https://assets.mixkit.co/sfx/preview/mixkit-sniper-whizzing-into-place-24.mp3'},
      {title: 'Anti-Bot Tax', src: 'https://assets.mixkit.co/sfx/preview/mixkit-game-over-voice-2072.mp3'},
      {title: 'Honeypot Horror', src: 'https://assets.mixkit.co/sfx/preview/mixkit-horror-electric-sweep-c-108.mp3'},
      {title: 'Audit Pass', src: 'https://assets.mixkit.co/sfx/preview/mixkit-success-ambience-689.mp3'},
      {title: 'Code Review', src: 'https://assets.mixkit.co/sfx/preview/mixkit-small-clear-sfx-ambience-1792.mp3'},
      {title: 'Rebase Rewards', src: 'https://assets.mixkit.co/sfx/preview/mixkit-reward-cash-register-2889.mp3'},
      {title: 'Vesting Schedule', src: 'https://assets.mixkit.co/sfx/preview/mixkit-ticking-clock-close-up-1062.mp3'},
      {title: 'Token Launch', src: 'https://assets.mixkit.co/sfx/preview/mixkit-synth-ambience-622.mp3'},
      {title: 'Airdrop Alert', src: 'https://assets.mixkit.co/sfx/preview/mixkit-magic-notification-2486.mp3'}
    ];

    this.currentTrack = 0;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.5;

    // Load saved state
    const savedVol = localStorage.getItem('ta_music_vol');
    if (savedVol !== null) {
      this.volume = parseFloat(savedVol);
    }

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

    // Sync UI with saved volume
    if (this.volumeSlider) this.volumeSlider.value = this.volume;
    if (this.ghVolume) this.ghVolume.value = this.volume;
    this.audio.volume = this.volume;

    this.updateUI();
    this.updateTrackDisplay();

    // Load first track
    this.loadTrack(0);
    console.log('🎵 MusicPlayer initialized with', this.tracks.length, 'tracks');
  }

  loadTrack(index) {
    if (index < 0 || index >= this.tracks.length) return;

    this.currentTrack = index;
    this.audio.src = this.tracks[index].src;
    this.audio.load();
    this.updateTrackDisplay();
  }

  playPause() {
    if (this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
    } else {
      this.audio.play().catch(e => {
        console.warn('Play failed:', e.message);
      });
      this.isPlaying = true;
    }
    this.updateUI();
    return this.isPlaying;
  }

  playNext() {
    const next = (this.currentTrack + 1) % this.tracks.length;
    this.loadTrack(next);
    if (this.isPlaying) {
      this.audio.play().catch(e => console.warn('Next track error:', e.message));
    }
  }

  playPrev() {
    const prev = this.currentTrack === 0 ? this.tracks.length - 1 : this.currentTrack - 1;
    this.loadTrack(prev);
    if (this.isPlaying) {
      this.audio.play().catch(e => console.warn('Prev track error:', e.message));
    }
  }

  setVolume(val) {
    this.volume = parseFloat(val);
    this.audio.volume = this.isMuted ? 0 : this.volume;
    if (this.volumeSlider) this.volumeSlider.value = val;
    if (this.ghVolume) this.ghVolume.value = val;
    localStorage.setItem('ta_music_vol', this.volume);
  }

  toggleMute(forceMute = null) {
    if (forceMute !== null) {
      this.isMuted = forceMute;
    } else {
      this.isMuted = !this.isMuted;
    }

    this.audio.volume = this.isMuted ? 0 : this.volume;
    this.updateUI();
    return this.isMuted;
  }

  updateTrackDisplay() {
    if (this.currentTrackEl) {
      this.currentTrackEl.textContent = this.tracks[this.currentTrack]?.title || 'Loading...';
    }
  }

  updateUI() {
    const icon = this.isPlaying ? '⏸️' : '▶️';
    if (this.playBtn) this.playBtn.textContent = icon;
    if (this.ghPlayBtn) this.ghPlayBtn.innerHTML = this.isPlaying ? '&#10074;&#10074;' : '&#9654;';

    if (this.currentTrackEl) {
      this.currentTrackEl.style.opacity = this.isMuted ? '0.5' : '1';
    }
  }

  isPlaying() {
    return this.isPlaying;
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.MusicPlayer = new MusicPlayer();
  
  // Bind methods for onclick handlers in HTML
  window.MusicPlayer.playPause = window.MusicPlayer.playPause.bind(window.MusicPlayer);
  window.MusicPlayer.playNext = window.MusicPlayer.playNext.bind(window.MusicPlayer);
  window.MusicPlayer.playPrev = window.MusicPlayer.playPrev.bind(window.MusicPlayer);
  window.MusicPlayer.setVolume = window.MusicPlayer.setVolume.bind(window.MusicPlayer);
  window.MusicPlayer.toggleMute = window.MusicPlayer.toggleMute.bind(window.MusicPlayer);
});

// Also create placeholder if DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => {
    if (!window.MusicPlayer) {
      window.MusicPlayer = new MusicPlayer();
    }
  }, 100);
}

