// music-player.js
// Procedural background music using Web Audio API
(() => {
  let ctx = null;
  let masterGain = null;
  let currentSynth = null;
  let isPlaying = false;
  let volume = 0.5;
  let currentPattern = 0;
  let currentStep = 0;
  let bpm = 110;
  let stepInterval = null;

  // Musical patterns (midi note numbers)
  const PATTERNS = [
    // Pattern 0: Chill ambient pad
    [
      [60, 64, 67], [], [60, 64, 67], [],
      [62, 65, 69], [], [62, 65, 69], [],
      [60, 64, 67], [], [67, 72], [],
      [65, 69, 72], [], [65, 69], []
    ],
    // Pattern 1: Upbeat arpeggio
    [
      [60], [64], [67], [72],
      [67], [64], [60], [64],
      [65], [69], [72], [76],
      [72], [69], [65], [69]
    ],
    // Pattern 2: Bass line
    [
      [36], [36], [38], [38],
      [41], [41], [38], [38],
      [36], [36], [43], [43],
      [41], [41], [38], [38]
    ],
    // Pattern 3: Jazz chord progression
    [
      [60, 63, 67], [61, 64, 68], [63, 67, 70], [65, 69, 72],
      [58, 62, 65], [60, 64, 67], [65, 69, 72], [67, 71, 74]
    ]
  ];

  const BPM_INTERVALS = [60 / 110 / 4 * 1000, 60 / 110 / 4 * 1000, 60 / 110 / 4 * 1000, 60 / 110 / 4 * 1000];

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  function playChord(midiNotes, type = 'sine', startTime = null) {
    const c = getCtx();
    const t = startTime || c.currentTime;
    
    midiNotes.forEach((midi, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(midiToFreq(midi), t);
      
      // Add slight detune for warmth
      osc.detune.setValueAtTime((Math.random() - 0.5) * 10, t);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      // Soft attack, sustain, gentle release
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08 / midiNotes.length, t + 0.1);
      gain.gain.setValueAtTime(0.08 / midiNotes.length, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      
      osc.start(t);
      osc.stop(t + 1.3);
    });
  }

  function playBass(midiNote, startTime = null) {
    const c = getCtx();
    const t = startTime || c.currentTime;
    
    const osc = c.createOscillator();
    const gain = c.createGain();
    const filter = c.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(midiToFreq(midiNote), t);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, t);
    filter.Q.setValueAtTime(5, t);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    
    osc.start(t);
    osc.stop(t + 0.5);
  }

  function tick() {
    const pattern = PATTERNS[currentPattern];
    const stepData = pattern[currentStep];
    
    if (stepData.length > 0) {
      if (currentPattern === 2) {
        // Bass pattern
        playBass(stepData[0]);
      } else {
        // Chord pattern
        const type = currentPattern === 1 ? 'triangle' : 'sine';
        playChord(stepData, type);
      }
    }
    
    currentStep = (currentStep + 1) % pattern.length;
  }

  function startSequencer() {
    if (stepInterval) return;
    
    getCtx();
    currentStep = 0;
    
    // Determine interval based on pattern
    const interval = BPM_INTERVALS[currentPattern] || BPM_INTERVALS[0];
    stepInterval = setInterval(tick, interval);
    tick(); // Play first step immediately
  }

  function stopSequencer() {
    if (stepInterval) {
      clearInterval(stepInterval);
      stepInterval = null;
    }
  }

  // Update volume
  function updateVolume() {
    if (masterGain) {
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
    }
  }

  // Public API
  window.MusicPlayer = {
    playPause() {
      const audio = document.getElementById('musicPlayer');
      if (audio && audio.src && audio.src !== window.location.href) {
        // Use HTML audio if available
        if (isPlaying) {
          audio.pause();
        } else {
          audio.play().catch(() => {});
        }
        isPlaying = !isPlaying;
      } else {
        // Use procedural audio
        isPlaying = !isPlaying;
        if (isPlaying) {
          startSequencer();
          // Auto-switch patterns every 16 bars
          setInterval(() => {
            if (isPlaying) {
              currentPattern = (currentPattern + 1) % PATTERNS.length;
            }
          }, 16000);
        } else {
          stopSequencer();
        }
      }
      
      // Update UI
      const playBtn = document.getElementById('playBtn');
      const ghPlayBtn = document.getElementById('ghPlayBtn');
      if (playBtn) playBtn.textContent = isPlaying ? '⏸️' : '▶️';
      if (ghPlayBtn) ghPlayBtn.innerHTML = isPlaying ? '&#10074;&#10074;' : '&#9654;';
      
      return isPlaying;
    },
    
    playNext() {
      stopSequencer();
      currentPattern = (currentPattern + 1) % PATTERNS.length;
      if (isPlaying) {
        currentStep = 0;
        startSequencer();
      }
    },
    
    playPrev() {
      stopSequencer();
      currentPattern = (currentPattern - 1 + PATTERNS.length) % PATTERNS.length;
      if (isPlaying) {
        currentStep = 0;
        startSequencer();
      }
    },
    
    setVolume(val) {
      volume = parseFloat(val);
      updateVolume();
      localStorage.setItem('ta_music_vol', volume);
      
      const volumeSlider = document.getElementById('volumeSlider');
      const ghVolume = document.getElementById('ghVolume');
      if (volumeSlider) volumeSlider.value = volume;
      if (ghVolume) ghVolume.value = volume;
    },
    
    isPlaying() {
      return isPlaying;
    }
  };

  // Restore volume from localStorage
  const savedVol = localStorage.getItem('ta_music_vol');
  if (savedVol !== null) {
    volume = parseFloat(savedVol);
  }

  // Initialize audio context on first user interaction
  document.addEventListener('click', () => getCtx(), { once: true });
  document.addEventListener('keydown', () => getCtx(), { once: true });
})();

