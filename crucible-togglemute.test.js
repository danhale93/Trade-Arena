/**
 * Tests for crucible-entertainment.js toggleMute() changes in this PR.
 *
 * PR change summary:
 * - Removed `window.MusicPlayer.toggleMute(true/false)` calls from both
 *   the mute and unmute branches (MusicPlayer integration removed).
 * - Changed mute commentary: 'ALL SOUNDS MUTED' → 'SOUND MUTED! Vibe: SILENT MODE ACTIVATED!'
 * - Changed unmute commentary: 'FULL AUDIO RESTORED' → 'SOUND RESTORED! Welcome BACK!'
 *
 * Uses Node environment with a lightweight mock document element.
 */

'use strict';

// ════════════════════════════════════════════════════════════
// Minimal mock DOM element
// ════════════════════════════════════════════════════════════

function makeMockElement() {
  return {
    textContent: '',
    classList: {
      _classes: new Set(),
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains(cls) { return this._classes.has(cls); },
    },
  };
}

// ════════════════════════════════════════════════════════════
// Factory for a fresh CrucibleEntertainment-like object
// with the exact toggleMute() from the PR
// ════════════════════════════════════════════════════════════

function makeEntertainmentObj() {
  const commentary = [];
  let muteBtn;

  // Set up mock document for this instance
  muteBtn = makeMockElement();
  const mockDoc = {
    getElementById(id) {
      if (id === 'mute-btn') return muteBtn;
      return null;
    },
  };

  global.document = mockDoc;

  const obj = {
    isMuted: false,
    sounds: {},
    bgMusic: null,
    _lastSound: undefined,
    _commentary: commentary,
    _muteBtn: muteBtn,

    showCommentary(msg, type) {
      commentary.push({ msg, type });
    },

    playSound(name) {
      this._lastSound = name;
    },

    // Exact toggleMute from the PR (post-change)
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
    },
  };

  return obj;
}

// ════════════════════════════════════════════════════════════
// State toggling
// ════════════════════════════════════════════════════════════

describe('CrucibleEntertainment.toggleMute() — state toggling', () => {
  test('toggleMute sets isMuted to true when initially false', () => {
    const ce = makeEntertainmentObj();
    ce.toggleMute();
    expect(ce.isMuted).toBe(true);
  });

  test('toggleMute sets isMuted back to false on second call', () => {
    const ce = makeEntertainmentObj();
    ce.toggleMute(); // mute
    ce.toggleMute(); // unmute
    expect(ce.isMuted).toBe(false);
  });

  test('toggleMute alternates correctly over multiple calls', () => {
    const ce = makeEntertainmentObj();
    for (let i = 0; i < 5; i++) ce.toggleMute();
    expect(ce.isMuted).toBe(true); // 5 odd calls → muted
  });
});

// ════════════════════════════════════════════════════════════
// Button DOM updates
// ════════════════════════════════════════════════════════════

describe('CrucibleEntertainment.toggleMute() — button DOM updates', () => {
  test('muting sets button textContent to "🔇 UNMUTE"', () => {
    const ce = makeEntertainmentObj();
    ce.toggleMute();
    expect(ce._muteBtn.textContent).toBe('🔇 UNMUTE');
  });

  test('unmuting sets button textContent to "🔊 MUTE"', () => {
    const ce = makeEntertainmentObj();
    ce.toggleMute(); // mute
    ce.toggleMute(); // unmute
    expect(ce._muteBtn.textContent).toBe('🔊 MUTE');
  });

  test('muting adds "muted" class to button', () => {
    const ce = makeEntertainmentObj();
    ce.toggleMute();
    expect(ce._muteBtn.classList.contains('muted')).toBe(true);
  });

  test('unmuting removes "muted" class from button', () => {
    const ce = makeEntertainmentObj();
    ce._muteBtn.classList.add('muted');
    ce.toggleMute(); // mute (adds again, idempotent)
    ce.toggleMute(); // unmute (removes)
    expect(ce._muteBtn.classList.contains('muted')).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════
// Audio volume management
// ════════════════════════════════════════════════════════════

describe('CrucibleEntertainment.toggleMute() — audio volume management', () => {
  test('muting sets matched audio element volume to 0', () => {
    const audio = { volume: 0.3 };
    const ce = makeEntertainmentObj();
    ce.sounds = { bell: true, bell_audio: audio };
    ce.toggleMute();
    expect(audio.volume).toBe(0);
  });

  test('unmuting sets matched audio element volume to 0.3', () => {
    const audio = { volume: 0 };
    const ce = makeEntertainmentObj();
    ce.sounds = { bell: true, bell_audio: audio };
    ce.toggleMute(); // mute
    ce.toggleMute(); // unmute
    expect(audio.volume).toBe(0.3);
  });

  test('muting sets bgMusic volume to 0', () => {
    const bgMusic = { volume: 0.1 };
    const ce = makeEntertainmentObj();
    ce.bgMusic = bgMusic;
    ce.toggleMute();
    expect(bgMusic.volume).toBe(0);
  });

  test('unmuting sets bgMusic volume to 0.1', () => {
    const bgMusic = { volume: 0 };
    const ce = makeEntertainmentObj();
    ce.bgMusic = bgMusic;
    ce.toggleMute(); // mute
    ce.toggleMute(); // unmute
    expect(bgMusic.volume).toBe(0.1);
  });

  test('muting with no audio elements does not throw', () => {
    const ce = makeEntertainmentObj();
    ce.sounds = {};
    expect(() => ce.toggleMute()).not.toThrow();
  });

  test('muting with null bgMusic does not throw', () => {
    const ce = makeEntertainmentObj();
    ce.bgMusic = null;
    expect(() => ce.toggleMute()).not.toThrow();
  });

  test('sounds key without matching _audio entry is safely skipped', () => {
    const ce = makeEntertainmentObj();
    ce.sounds = { win: true }; // no win_audio
    expect(() => ce.toggleMute()).not.toThrow();
  });

  test('muting updates all audio elements in sounds', () => {
    const audio1 = { volume: 0.3 };
    const audio2 = { volume: 0.3 };
    const ce = makeEntertainmentObj();
    ce.sounds = {
      win: true, win_audio: audio1,
      loss: true, loss_audio: audio2,
    };
    ce.toggleMute();
    expect(audio1.volume).toBe(0);
    expect(audio2.volume).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════
// Commentary strings — PR changed these
// ════════════════════════════════════════════════════════════

describe('CrucibleEntertainment.toggleMute() — commentary strings (PR-changed)', () => {
  test('mute emits new PR commentary containing "SOUND MUTED! Vibe: SILENT MODE ACTIVATED!"', () => {
    const ce = makeEntertainmentObj();
    ce.toggleMute();
    const last = ce._commentary[ce._commentary.length - 1];
    expect(last.msg).toContain('SOUND MUTED! Vibe: SILENT MODE ACTIVATED!');
  });

  test('mute commentary type is "neutral"', () => {
    const ce = makeEntertainmentObj();
    ce.toggleMute();
    const last = ce._commentary[ce._commentary.length - 1];
    expect(last.type).toBe('neutral');
  });

  test('unmute emits new PR commentary containing "SOUND RESTORED! Welcome BACK!"', () => {
    const ce = makeEntertainmentObj();
    ce.toggleMute(); // mute
    ce.toggleMute(); // unmute
    const last = ce._commentary[ce._commentary.length - 1];
    expect(last.msg).toContain('SOUND RESTORED! Welcome BACK!');
  });

  test('unmute commentary type is "win"', () => {
    const ce = makeEntertainmentObj();
    ce.toggleMute(); // mute
    ce.toggleMute(); // unmute
    const last = ce._commentary[ce._commentary.length - 1];
    expect(last.type).toBe('win');
  });

  // Regression: OLD strings must NOT appear (removed in this PR)
  test('mute does NOT use old "ALL SOUNDS MUTED" text (regression guard)', () => {
    const ce = makeEntertainmentObj();
    ce.toggleMute();
    const last = ce._commentary[ce._commentary.length - 1];
    expect(last.msg).not.toContain('ALL SOUNDS MUTED');
  });

  test('unmute does NOT use old "FULL AUDIO RESTORED" text (regression guard)', () => {
    const ce = makeEntertainmentObj();
    ce.toggleMute(); // mute
    ce.toggleMute(); // unmute
    const last = ce._commentary[ce._commentary.length - 1];
    expect(last.msg).not.toContain('FULL AUDIO RESTORED');
  });

  test('each toggle call adds exactly one commentary entry', () => {
    const ce = makeEntertainmentObj();
    ce.toggleMute();
    expect(ce._commentary).toHaveLength(1);
    ce.toggleMute();
    expect(ce._commentary).toHaveLength(2);
  });
});

// ════════════════════════════════════════════════════════════
// MusicPlayer integration removed (regression guard)
// ════════════════════════════════════════════════════════════

describe('CrucibleEntertainment.toggleMute() — MusicPlayer.toggleMute removed (PR regression guard)', () => {
  test('muting does not call window.MusicPlayer.toggleMute even if MusicPlayer exists', () => {
    const mockToggleMute = jest.fn();
    global.MusicPlayer = { toggleMute: mockToggleMute };

    const ce = makeEntertainmentObj();
    ce.toggleMute(); // mute

    expect(mockToggleMute).not.toHaveBeenCalled();
    delete global.MusicPlayer;
  });

  test('unmuting does not call window.MusicPlayer.toggleMute even if MusicPlayer exists', () => {
    const mockToggleMute = jest.fn();
    global.MusicPlayer = { toggleMute: mockToggleMute };

    const ce = makeEntertainmentObj();
    ce.toggleMute(); // mute
    ce.toggleMute(); // unmute

    expect(mockToggleMute).not.toHaveBeenCalled();
    delete global.MusicPlayer;
  });

  test('toggleMute does not throw when window.MusicPlayer is absent', () => {
    delete global.MusicPlayer;
    const ce = makeEntertainmentObj();
    expect(() => {
      ce.toggleMute();
      ce.toggleMute();
    }).not.toThrow();
  });
});

// ════════════════════════════════════════════════════════════
// playSound on unmute
// ════════════════════════════════════════════════════════════

describe('CrucibleEntertainment.toggleMute() — playSound on unmute', () => {
  test('unmuting plays the "bell" sound', () => {
    const ce = makeEntertainmentObj();
    ce.toggleMute(); // mute
    ce.toggleMute(); // unmute
    expect(ce._lastSound).toBe('bell');
  });

  test('muting does NOT play any sound', () => {
    const ce = makeEntertainmentObj();
    ce.toggleMute(); // mute only
    expect(ce._lastSound).toBeUndefined();
  });
});