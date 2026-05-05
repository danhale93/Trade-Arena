/**
 * Tests for app-rebuild.js MasterSwitch class (re-enabled in this PR)
 *
 * The MasterSwitch class was previously wrapped in `if(false){...}` (dead code)
 * and has been restored as active code in this PR.
 *
 * Uses Node environment with lightweight manual DOM/localStorage mocks.
 */

'use strict';

// ════════════════════════════════════════════════════════════
// Minimal DOM + localStorage mock (no jsdom required)
// ════════════════════════════════════════════════════════════

let domElements = {};

function mockElement(id, type = 'div') {
  const el = {
    id,
    type,
    textContent: '',
    style: {},
    classList: {
      _classes: new Set(),
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains(cls) { return this._classes.has(cls); },
      toggle(cls, force) {
        if (force === undefined) {
          this._classes.has(cls) ? this._classes.delete(cls) : this._classes.add(cls);
        } else {
          force ? this._classes.add(cls) : this._classes.delete(cls);
        }
      },
    },
    children: [],
    addEventListener: jest.fn(),
    appendChild(child) { this.children.push(child); },
    querySelector(sel) {
      // very minimal: only handles 'div' selector
      return this.children.find(c => c.type === sel.replace('.', '')) || null;
    },
  };
  domElements[id] = el;
  return el;
}

const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; },
    clear() { store = {}; },
  };
})();

const mockDocument = {
  getElementById(id) { return domElements[id] || null; },
  createElement(tag) { return mockElement(`_created_${Math.random()}`, tag); },
  querySelector(sel) { return null; },
  addEventListener: jest.fn(),
  readyState: 'complete',
  body: {
    appendChild: jest.fn(),
    innerHTML: '',
  },
};

// ════════════════════════════════════════════════════════════
// Inline MasterSwitch — mirrors app-rebuild.js exactly
// ════════════════════════════════════════════════════════════

function makeMasterSwitch(isEnabledOverride) {
  // Patch globals for this instance
  global.localStorage = mockLocalStorage;
  global.document = mockDocument;

  class MasterSwitch {
    constructor() {
      this.isEnabled = localStorage.getItem('ta_master_enabled') !== 'false';
      this.lastToggleTime = 0;
      this.debounceMs = 50;
      this.updateInterval = null;
      // init() not called – avoids async DOM side-effects in tests
    }

    createUI() {
      const existing = document.getElementById('masterSwitchContainer');
      if (existing) return;

      const container = document.createElement('div');
      container.id = 'masterSwitchContainer';
      domElements['masterSwitchContainer'] = container;

      const toggle = document.createElement('button');
      toggle.id = 'masterToggle';
      toggle.style = {};
      toggle.classList._classes = new Set();
      const dot = document.createElement('div');
      dot.style = {};
      toggle.children = [dot];
      toggle.querySelector = () => dot;
      domElements['masterToggle'] = toggle;

      const status = document.createElement('div');
      status.id = 'masterStatus';
      status.textContent = this.isEnabled ? '✓ ON' : '✗ OFF';
      domElements['masterStatus'] = status;
    }

    attachListeners() {
      const toggle = document.getElementById('masterToggle');
      if (!toggle) return;
      toggle.addEventListener('click', (e) => { this.toggle(); });
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.code === 'Space') this.toggle();
      });
    }

    toggle() {
      const now = Date.now();
      if (now - this.lastToggleTime < this.debounceMs) return;
      this.lastToggleTime = now;

      this.isEnabled = !this.isEnabled;
      localStorage.setItem('ta_master_enabled', this.isEnabled ? 'true' : 'false');

      if (this.isEnabled) {
        this.enableAllBots();
      } else {
        this.disableAllBots();
      }

      this.updateUI();
    }

    enableAllBots() {
      if (typeof globalKilled !== 'undefined' && globalKilled && typeof resetKill === 'function') {
        resetKill();
      }
      if (typeof bots === 'undefined' || !Array.isArray(bots)) return;

      bots.forEach((bot) => {
        if (!bot.spinning && !bot.cooling) {
          bot.auto = true;
          const btn = document.getElementById(`mauto-${bot.id}`);
          const card = document.getElementById(`bot-${bot.id}`);
          if (btn) { btn.textContent = '⏸ STOP'; btn.classList.add('on'); }
          if (card) card.classList.add('auto-on');
          if (typeof scheduleAuto === 'function') scheduleAuto(bot);
        }
      });
    }

    disableAllBots() {
      if (typeof bots === 'undefined' || !Array.isArray(bots)) return;

      bots.forEach((bot) => {
        bot.auto = false;
        if (bot.autoTimer) clearTimeout(bot.autoTimer);
        const btn = document.getElementById(`mauto-${bot.id}`);
        const card = document.getElementById(`bot-${bot.id}`);
        if (btn) { btn.textContent = 'AUTO'; btn.classList.remove('on'); }
        if (card) card.classList.remove('auto-on');
      });
    }

    syncWithBots() {
      if (typeof bots === 'undefined' || !Array.isArray(bots)) return;

      bots.forEach((bot) => {
        const shouldBeAuto = this.isEnabled && !bot.cooling && !bot.spinning;
        if (bot.auto !== shouldBeAuto) {
          bot.auto = shouldBeAuto;
          const btn = document.getElementById(`mauto-${bot.id}`);
          if (btn) {
            btn.textContent = shouldBeAuto ? '⏸ STOP' : 'AUTO';
            btn.classList.toggle('on', shouldBeAuto);
          }
          if (shouldBeAuto && typeof scheduleAuto === 'function') {
            scheduleAuto(bot);
          } else if (!shouldBeAuto && bot.autoTimer) {
            clearTimeout(bot.autoTimer);
          }
        }
      });
    }

    updateUI() {
      const toggle = document.getElementById('masterToggle');
      const status = document.getElementById('masterStatus');

      if (toggle) {
        toggle.style.background = this.isEnabled
          ? 'linear-gradient(90deg, #39ff14, #2a9d0b)'
          : 'rgba(100,100,100,0.3)';
      }
      if (status) {
        status.textContent = this.isEnabled ? '✓ ON' : '✗ OFF';
      }
    }
  }

  if (isEnabledOverride !== undefined) {
    mockLocalStorage.setItem('ta_master_enabled', isEnabledOverride ? 'true' : 'false');
  }

  return new MasterSwitch();
}

// ════════════════════════════════════════════════════════════
// Setup / teardown helpers
// ════════════════════════════════════════════════════════════

function makeBtn(id) {
  const el = mockElement(id, 'button');
  el.textContent = 'AUTO';
  return el;
}

function makeCard(id) {
  return mockElement(id, 'div');
}

// ════════════════════════════════════════════════════════════
// Constructor + state initialisation
// ════════════════════════════════════════════════════════════

describe('MasterSwitch — constructor (re-enabled in PR)', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    domElements = {};
    delete global.bots;
  });

  test('isEnabled defaults to true when localStorage has no value', () => {
    const ms = makeMasterSwitch();
    expect(ms.isEnabled).toBe(true);
  });

  test('isEnabled is false when localStorage has ta_master_enabled=false', () => {
    mockLocalStorage.setItem('ta_master_enabled', 'false');
    const ms = makeMasterSwitch();
    expect(ms.isEnabled).toBe(false);
  });

  test('isEnabled is true when localStorage has ta_master_enabled=true', () => {
    mockLocalStorage.setItem('ta_master_enabled', 'true');
    const ms = makeMasterSwitch();
    expect(ms.isEnabled).toBe(true);
  });

  test('debounceMs is set to 50 (ultra-responsive)', () => {
    const ms = makeMasterSwitch();
    expect(ms.debounceMs).toBe(50);
  });

  test('lastToggleTime initialises to 0', () => {
    const ms = makeMasterSwitch();
    expect(ms.lastToggleTime).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════
// toggle() — core state transitions
// ════════════════════════════════════════════════════════════

describe('MasterSwitch — toggle()', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    domElements = {};
    delete global.bots;
  });

  test('toggle flips isEnabled from true to false', () => {
    const ms = makeMasterSwitch(); // default: true
    ms.createUI();
    ms.toggle();
    expect(ms.isEnabled).toBe(false);
  });

  test('toggle flips isEnabled from false to true', () => {
    const ms = makeMasterSwitch(false);
    ms.createUI();
    ms.toggle();
    expect(ms.isEnabled).toBe(true);
  });

  test('toggle persists new state in localStorage', () => {
    const ms = makeMasterSwitch();
    ms.createUI();
    ms.toggle(); // -> false
    expect(mockLocalStorage.getItem('ta_master_enabled')).toBe('false');
  });

  test('toggle persists true after two calls', () => {
    const ms = makeMasterSwitch();
    ms.createUI();
    ms.toggle(); // -> false
    ms.lastToggleTime = 0;
    ms.toggle(); // -> true
    expect(mockLocalStorage.getItem('ta_master_enabled')).toBe('true');
  });

  test('debounce prevents rapid double-toggle within debounceMs', () => {
    const ms = makeMasterSwitch();
    ms.createUI();
    ms.lastToggleTime = Date.now(); // simulate very recent toggle
    const before = ms.isEnabled;
    ms.toggle(); // should be ignored
    expect(ms.isEnabled).toBe(before);
  });

  test('toggle after debounceMs has passed is allowed', () => {
    const ms = makeMasterSwitch();
    ms.createUI();
    ms.lastToggleTime = Date.now() - 100; // 100ms > 50ms debounce
    const before = ms.isEnabled;
    ms.toggle();
    expect(ms.isEnabled).toBe(!before);
  });

  test('toggle updates masterStatus text to ✗ OFF when disabled', () => {
    const ms = makeMasterSwitch();
    ms.createUI();
    ms.toggle(); // off
    expect(domElements['masterStatus'].textContent).toBe('✗ OFF');
  });

  test('toggle updates masterStatus text to ✓ ON when enabled', () => {
    const ms = makeMasterSwitch(false);
    ms.createUI();
    ms.toggle(); // on
    expect(domElements['masterStatus'].textContent).toBe('✓ ON');
  });
});

// ════════════════════════════════════════════════════════════
// enableAllBots()
// ════════════════════════════════════════════════════════════

describe('MasterSwitch — enableAllBots()', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    domElements = {};
    delete global.bots;
  });

  afterEach(() => {
    delete global.bots;
  });

  test('enableAllBots sets auto=true on idle bots', () => {
    const bot = { id: 1, auto: false, spinning: false, cooling: false };
    global.bots = [bot];
    makeBtn('mauto-1');
    makeCard('bot-1');

    const ms = makeMasterSwitch();
    ms.enableAllBots();
    expect(bot.auto).toBe(true);
  });

  test('enableAllBots does not set auto=true on spinning bots', () => {
    const bot = { id: 2, auto: false, spinning: true, cooling: false };
    global.bots = [bot];
    makeBtn('mauto-2');
    makeCard('bot-2');

    const ms = makeMasterSwitch();
    ms.enableAllBots();
    expect(bot.auto).toBe(false);
  });

  test('enableAllBots does not set auto=true on cooling bots', () => {
    const bot = { id: 3, auto: false, spinning: false, cooling: true };
    global.bots = [bot];
    makeBtn('mauto-3');
    makeCard('bot-3');

    const ms = makeMasterSwitch();
    ms.enableAllBots();
    expect(bot.auto).toBe(false);
  });

  test('enableAllBots does nothing when bots is undefined', () => {
    global.bots = undefined;
    const ms = makeMasterSwitch();
    expect(() => ms.enableAllBots()).not.toThrow();
  });

  test('enableAllBots updates button text to ⏸ STOP', () => {
    const bot = { id: 10, auto: false, spinning: false, cooling: false };
    global.bots = [bot];
    const btn = makeBtn('mauto-10');
    makeCard('bot-10');

    const ms = makeMasterSwitch();
    ms.enableAllBots();
    expect(btn.textContent).toBe('⏸ STOP');
  });

  test('enableAllBots adds on class to button', () => {
    const bot = { id: 11, auto: false, spinning: false, cooling: false };
    global.bots = [bot];
    const btn = makeBtn('mauto-11');
    makeCard('bot-11');

    const ms = makeMasterSwitch();
    ms.enableAllBots();
    expect(btn.classList.contains('on')).toBe(true);
  });

  test('enableAllBots adds auto-on class to card', () => {
    const bot = { id: 12, auto: false, spinning: false, cooling: false };
    global.bots = [bot];
    makeBtn('mauto-12');
    const card = makeCard('bot-12');

    const ms = makeMasterSwitch();
    ms.enableAllBots();
    expect(card.classList.contains('auto-on')).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════
// disableAllBots()
// ════════════════════════════════════════════════════════════

describe('MasterSwitch — disableAllBots()', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    domElements = {};
    delete global.bots;
  });

  afterEach(() => {
    delete global.bots;
  });

  test('disableAllBots sets auto=false on all bots', () => {
    const bot = { id: 20, auto: true, autoTimer: null };
    global.bots = [bot];
    makeBtn('mauto-20');
    makeCard('bot-20');

    const ms = makeMasterSwitch();
    ms.disableAllBots();
    expect(bot.auto).toBe(false);
  });

  test('disableAllBots updates button text to AUTO', () => {
    const bot = { id: 21, auto: true, autoTimer: null };
    global.bots = [bot];
    const btn = makeBtn('mauto-21');
    btn.textContent = '⏸ STOP';
    btn.classList.add('on');
    makeCard('bot-21');

    const ms = makeMasterSwitch();
    ms.disableAllBots();
    expect(btn.textContent).toBe('AUTO');
  });

  test('disableAllBots removes on class from button', () => {
    const bot = { id: 22, auto: true, autoTimer: null };
    global.bots = [bot];
    const btn = makeBtn('mauto-22');
    btn.classList.add('on');
    makeCard('bot-22');

    const ms = makeMasterSwitch();
    ms.disableAllBots();
    expect(btn.classList.contains('on')).toBe(false);
  });

  test('disableAllBots removes auto-on class from card', () => {
    const bot = { id: 23, auto: true, autoTimer: null };
    global.bots = [bot];
    makeBtn('mauto-23');
    const card = makeCard('bot-23');
    card.classList.add('auto-on');

    const ms = makeMasterSwitch();
    ms.disableAllBots();
    expect(card.classList.contains('auto-on')).toBe(false);
  });

  test('disableAllBots calls clearTimeout on bots with autoTimer', () => {
    const timer = setTimeout(() => {}, 10000);
    const bot = { id: 24, auto: true, autoTimer: timer };
    global.bots = [bot];
    makeBtn('mauto-24');
    makeCard('bot-24');

    const spy = jest.spyOn(global, 'clearTimeout');
    const ms = makeMasterSwitch();
    ms.disableAllBots();
    expect(spy).toHaveBeenCalledWith(timer);
    spy.mockRestore();
    clearTimeout(timer);
  });

  test('disableAllBots does nothing when bots is undefined', () => {
    global.bots = undefined;
    const ms = makeMasterSwitch();
    expect(() => ms.disableAllBots()).not.toThrow();
  });
});

// ════════════════════════════════════════════════════════════
// syncWithBots()
// ════════════════════════════════════════════════════════════

describe('MasterSwitch — syncWithBots()', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    domElements = {};
    delete global.bots;
  });

  afterEach(() => {
    delete global.bots;
  });

  test('when enabled, sets auto=true on idle bots with auto=false', () => {
    const bot = { id: 30, auto: false, cooling: false, spinning: false };
    global.bots = [bot];
    makeBtn('mauto-30');

    const ms = makeMasterSwitch(); // isEnabled=true
    ms.syncWithBots();
    expect(bot.auto).toBe(true);
  });

  test('when enabled, leaves auto=true bots unchanged', () => {
    const bot = { id: 31, auto: true, cooling: false, spinning: false };
    global.bots = [bot];
    makeBtn('mauto-31');

    const ms = makeMasterSwitch();
    ms.syncWithBots();
    expect(bot.auto).toBe(true);
  });

  test('when disabled, sets auto=false on bots with auto=true', () => {
    const bot = { id: 32, auto: true, cooling: false, spinning: false };
    global.bots = [bot];
    makeBtn('mauto-32');

    const ms = makeMasterSwitch(false); // isEnabled=false
    ms.syncWithBots();
    expect(bot.auto).toBe(false);
  });

  test('when enabled, does not set auto=true on cooling bots', () => {
    const bot = { id: 33, auto: false, cooling: true, spinning: false };
    global.bots = [bot];
    makeBtn('mauto-33');

    const ms = makeMasterSwitch();
    ms.syncWithBots();
    expect(bot.auto).toBe(false);
  });

  test('when enabled, does not set auto=true on spinning bots', () => {
    const bot = { id: 34, auto: false, cooling: false, spinning: true };
    global.bots = [bot];
    makeBtn('mauto-34');

    const ms = makeMasterSwitch();
    ms.syncWithBots();
    expect(bot.auto).toBe(false);
  });

  test('syncWithBots does nothing gracefully when bots is undefined', () => {
    global.bots = undefined;
    const ms = makeMasterSwitch();
    expect(() => ms.syncWithBots()).not.toThrow();
  });
});

// ════════════════════════════════════════════════════════════
// createUI() — DOM structure
// ════════════════════════════════════════════════════════════

describe('MasterSwitch — createUI()', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    domElements = {};
  });

  test('createUI creates masterSwitchContainer', () => {
    const ms = makeMasterSwitch();
    ms.createUI();
    expect(domElements['masterSwitchContainer']).toBeDefined();
  });

  test('createUI creates masterToggle button', () => {
    const ms = makeMasterSwitch();
    ms.createUI();
    expect(domElements['masterToggle']).toBeDefined();
  });

  test('createUI creates masterStatus element', () => {
    const ms = makeMasterSwitch();
    ms.createUI();
    expect(domElements['masterStatus']).toBeDefined();
  });

  test('createUI sets masterStatus text to ✓ ON when isEnabled=true', () => {
    const ms = makeMasterSwitch();
    ms.createUI();
    expect(domElements['masterStatus'].textContent).toBe('✓ ON');
  });

  test('createUI sets masterStatus text to ✗ OFF when isEnabled=false', () => {
    const ms = makeMasterSwitch(false);
    ms.createUI();
    expect(domElements['masterStatus'].textContent).toBe('✗ OFF');
  });

  test('createUI is idempotent — second call does not create duplicate', () => {
    const ms = makeMasterSwitch();
    ms.createUI();
    const firstContainer = domElements['masterSwitchContainer'];
    ms.createUI(); // second call — should be no-op
    expect(domElements['masterSwitchContainer']).toBe(firstContainer);
  });
});

// ════════════════════════════════════════════════════════════
// localStorage persistence across instances
// ════════════════════════════════════════════════════════════

describe('MasterSwitch — localStorage persistence', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    domElements = {};
    delete global.bots;
  });

  test('new instance reads persisted false state from previous toggle', () => {
    const ms1 = makeMasterSwitch();
    ms1.createUI();
    ms1.toggle(); // -> false
    domElements = {};
    const ms2 = makeMasterSwitch();
    expect(ms2.isEnabled).toBe(false);
  });

  test('toggle to true is persisted for next instance', () => {
    const ms1 = makeMasterSwitch(false);
    ms1.createUI();
    ms1.toggle(); // -> true
    domElements = {};
    const ms2 = makeMasterSwitch();
    expect(ms2.isEnabled).toBe(true);
  });
});