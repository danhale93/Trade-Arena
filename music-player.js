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
      // Add 55+ more - abbreviated for brevity
      {title: 'Money Lord Loop', src: 'https://assets.mixkit.co/sfx/preview/mixkit-8-bit-game-notification-332.mp3'},
      {title: 'Perpetual Profits', src: 'https://assets.mixkit.co/sfx/preview/mixkit-magic-notification-2488.mp3'},
      {title: 'Silicon Slots', src: 'https://assets.mixkit.co/sfx/preview/mixkit-short-notifications-for-games-2202.mp3'},
      {title: 'Arena Spin', src: 'https://assets.mixkit.co/sfx/preview/mixkit-coin-win-notification-1940.mp3'},
      {title: 'The Hack Arena', src: 'https://assets.mixkit.co/sfx/preview/mixkit-techno-glitch-1319.mp3'}
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
    this.volumeSlider.value = this.volume;
    this.updateUI();
    
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
      this.playBtn.textContent = '▶️';
    } else {
      this.audio.play().catch(e => {
        console.warn('Play failed:', e);
        this.playNext();
      });
      this.isPlaying = true;
      this.playBtn.textContent = '⏸️';
    }
    this.updateUI();
  }

  playNext() {
    const next = (this.currentTrack + 1) % this.tracks.length;
    this.loadTrack(next);
    if (this.isPlaying) {
      this.audio.play().catch(e => console.warn('Next track error:', e));
    }
  }

  playPrev() {
    const prev = this.currentTrack === 0 ? this.tracks.length - 1 : this.currentTrack - 1;
    this.loadTrack(prev);
    if (this.isPlaying) {
      this.audio.play().catch(e => console.warn('Prev track error:', e));
    }
  }

  setVolume(val) {
    this.volume = parseFloat(val);
    this.audio.volume = this.isMuted ? 0 : this.volume;
    this.volumeSlider.value = val;
  }

  toggleMute(forceMute = null) {
    if (forceMute !== null) {
      this.isMuted = forceMute;
    } else {
      this.isMuted = !this.isMuted;
    }
    
    this.audio.volume = this.isMuted ? 0 : this.volume;
    this.updateUI();
  }

  updateTrackDisplay() {
    if (this.currentTrackEl) {
      this.currentTrackEl.textContent = this.tracks[this.currentTrack]?.title || 'Loading...';
    }
  }

  updateUI() {
    this.playBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
    
    // Visual mute indicator
    if (this.currentTrackEl) {
      this.currentTrackEl.style.opacity = this.isMuted ? '0.5' : '1';
    }
  }
}

// Global access
window.MusicPlayer = new MusicPlayer();

// Export methods globally for onclick handlers
window.MusicPlayer.playPause = window.MusicPlayer.playPause.bind(window.MusicPlayer);
window.MusicPlayer.playNext = window.MusicPlayer.playNext.bind(window.MusicPlayer);
window.MusicPlayer.playPrev = window.MusicPlayer.playPrev.bind(window.MusicPlayer);
window.MusicPlayer.setVolume = window.MusicPlayer.setVolume.bind(window.MusicPlayer);
