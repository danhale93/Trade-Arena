

















































































































































































































































































































































































































































































































































































































































































    const ms2 = makeMasterSwitch();
    expect(ms2.isEnabled).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════
// Additional boundary/regression tests (re-enabled class)
// ════════════════════════════════════════════════════════════

describe('MasterSwitch — enableAllBots() with mixed bot states', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    domElements = {};
    delete global.bots;
  });

  afterEach(() => {
    delete global.bots;
  });

  test('enables idle bots but skips spinning/cooling ones in the same list', () => {
    const idle    = { id: 50, auto: false, spinning: false, cooling: false };
    const spinning = { id: 51, auto: false, spinning: true,  cooling: false };
    const cooling  = { id: 52, auto: false, spinning: false, cooling: true  };
    global.bots = [idle, spinning, cooling];
    [50, 51, 52].forEach(id => { makeBtn(`mauto-${id}`); makeCard(`bot-${id}`); });

    const ms = makeMasterSwitch();
    ms.enableAllBots();

    expect(idle.auto).toBe(true);
    expect(spinning.auto).toBe(false);
    expect(cooling.auto).toBe(false);
  });

  test('enableAllBots on already-enabled idle bot keeps auto=true', () => {
    const bot = { id: 60, auto: true, spinning: false, cooling: false };
    global.bots = [bot];
    makeBtn('mauto-60');
    makeCard('bot-60');

    const ms = makeMasterSwitch();
    ms.enableAllBots();
    expect(bot.auto).toBe(true);
  });

  test('enableAllBots with empty bots array does not throw', () => {
    global.bots = [];
    const ms = makeMasterSwitch();
    expect(() => ms.enableAllBots()).not.toThrow();
  });
});

describe('MasterSwitch — updateUI() without DOM elements', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    domElements = {};
  });

  test('updateUI does not throw when masterToggle element is absent', () => {
    const ms = makeMasterSwitch();
    // Do NOT call createUI — no DOM elements
    expect(() => ms.updateUI()).not.toThrow();
  });

  test('updateUI does not throw when masterStatus element is absent', () => {
    const ms = makeMasterSwitch();
    expect(() => ms.updateUI()).not.toThrow();
  });

  test('updateUI sets green gradient style on toggle when enabled', () => {
    const ms = makeMasterSwitch();
    ms.createUI();
    ms.isEnabled = true;
    ms.updateUI();
    expect(domElements['masterToggle'].style.background).toContain('39ff14');
  });

  test('updateUI sets grey background on toggle when disabled', () => {
    const ms = makeMasterSwitch(false);
    ms.createUI();
    ms.updateUI();
    expect(domElements['masterToggle'].style.background).toContain('rgba(100,100,100');
  });
});

describe('MasterSwitch — syncWithBots() button text updates', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    domElements = {};
    delete global.bots;
  });

  afterEach(() => {
    delete global.bots;
  });

  test('when enabled, updates button text to ⏸ STOP for newly enabled bot', () => {
    const bot = { id: 70, auto: false, cooling: false, spinning: false };
    global.bots = [bot];
    const btn = makeBtn('mauto-70');

    const ms = makeMasterSwitch();
    ms.syncWithBots();
    expect(btn.textContent).toBe('⏸ STOP');
  });

  test('when disabled, updates button text to AUTO for previously enabled bot', () => {
    const bot = { id: 71, auto: true, cooling: false, spinning: false };
    global.bots = [bot];
    const btn = makeBtn('mauto-71');
    btn.textContent = '⏸ STOP';

    const ms = makeMasterSwitch(false);
    ms.syncWithBots();
    expect(btn.textContent).toBe('AUTO');
  });

  test('does not update button for bot whose auto state already matches', () => {
    const bot = { id: 72, auto: true, cooling: false, spinning: false };
    global.bots = [bot];
    const btn = makeBtn('mauto-72');
    btn.textContent = '⏸ STOP';

    const ms = makeMasterSwitch(); // enabled=true, bot.auto=true: no change needed
    ms.syncWithBots();
    // textContent should remain unchanged since shouldBeAuto === bot.auto
    expect(btn.textContent).toBe('⏸ STOP');
  });
});