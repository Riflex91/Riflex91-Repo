(() => {
  'use strict';

  const VERSION = '1.0.1';
  const TEST_ID = 'pr20-6-account-roster-x-recovery-v2';
  const CONTROLLER_TEST_ID = 'pr20-6-mluck-autonomous-live-5m';
  const CONTROLLER_VERSION = '1.0.5';
  const OPERATOR_RANGER_NAME = 'My_Ranger1';

  function text(v) { return String(v == null ? '' : v).trim(); }
  function root() {
    try { if (globalThis.character) return globalThis; } catch {}
    try { if (parent && parent.character) return parent; } catch {}
    throw new Error('PR20_6_ADVENTURE_LAND_CONTEXT_MISSING');
  }
  function armPerformanceTrick() {
    const r = root();
    try {
      if (typeof r.performance_trick === 'function') {
        r.performance_trick();
        return true;
      }
    } catch {}
    try {
      if (typeof globalThis.performance_trick === 'function') {
        globalThis.performance_trick();
        return true;
      }
    } catch {}
    return false;
  }
  function accountRows() {
    const r = root();
    const candidates = [r];
    try {
      if (globalThis && !candidates.includes(globalThis)) candidates.push(globalThis);
    } catch {}
    for (const owner of [...candidates]) {
      try {
        const p = owner?.parent && owner.parent !== owner ? owner.parent : null;
        if (p && !candidates.includes(p)) candidates.push(p);
      } catch {}
    }
    for (const owner of candidates) {
      try {
        if (Array.isArray(owner?.X?.characters)) return owner.X.characters;
      } catch {}
    }
    return null;
  }

  const status = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    phase: 'ACCOUNT_ROSTER_X_RECOVERY',
    status: 'BOOT',
    terminal: false,
    gameplayWrites: 0,
    rawWriteCalls: 0,
    sameIntentRetry: false,
    normalRuntimeAllowed: false,
    controllerTestId: CONTROLLER_TEST_ID,
    controllerVersion: CONTROLLER_VERSION
  };

  async function run() {
    if (!armPerformanceTrick()) {
      Object.assign(status, { status:'BLOCKIERT', terminal:true, blocker:['PR20_6_PERFORMANCE_TRICK_UNAVAILABLE'] });
      return;
    }
    const rows = accountRows();
    if (!Array.isArray(rows) || !rows.length) {
      Object.assign(status, { status:'BLOCKIERT', terminal:true, blocker:['ACCOUNT_X_CHARACTERS_UNAVAILABLE'] });
      return;
    }
    const normalized = rows.filter(row => row && typeof row === 'object' && text(row.name) && text(row.ctype || row.type));
    const exactRangers = normalized.filter(row =>
      text(row.name) === OPERATOR_RANGER_NAME
      && text(row.ctype || row.type).toLowerCase() === 'ranger'
    );
    if (exactRangers.length !== 1) {
      Object.assign(status, {
        status:'BLOCKIERT',
        terminal:true,
        blocker:[exactRangers.length === 0
          ? 'ACCOUNT_MY_RANGER1_FEHLT'
          : 'ACCOUNT_MY_RANGER1_MEHRFACH']
      });
      return;
    }
    const narrowed = normalized.filter(row =>
      text(row.ctype || row.type).toLowerCase() !== 'ranger'
      || text(row.name) === OPERATOR_RANGER_NAME
    );

    const fallback = () => narrowed;
    if (typeof globalThis.get_characters !== 'function') globalThis.get_characters = fallback;
    try {
      const r = root();
      if (typeof r.get_characters !== 'function') r.get_characters = fallback;
    } catch {}

    const controller = globalThis.V5PR206MluckTest;
    if (!controller || text(controller.version) !== CONTROLLER_VERSION || typeof controller.start !== 'function') {
      Object.assign(status, { status:'BLOCKIERT', terminal:true, blocker:['PR20_6_CONTROLLER_V105_UNAVAILABLE'] });
      return;
    }

    Object.assign(status, { status:'BESTANDEN', terminal:true, accountCharacters:narrowed.length, rangerPresent:true, rangerName:OPERATOR_RANGER_NAME });
    await Promise.resolve(controller.start());
  }

  globalThis.V5PR206AccountRosterXRecovery = {
    version: VERSION,
    status: () => ({ ...status }),
    start: () => run()
  };

  Promise.resolve().then(run).catch(error => {
    Object.assign(status, {
      status:'FEHLER',
      terminal:true,
      error:text(error?.message || error).slice(0, 240),
      gameplayWrites:0,
      rawWriteCalls:0,
      sameIntentRetry:false
    });
  });
})();
