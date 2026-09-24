(() => {
  'use strict';

  const TEST_ID = 'pr20-7-gear-account-weapon-candidate-discovery-v3';
  const VERSION = '1.0.3';
  const FARMERS = Object.freeze([
    Object.freeze({ name:'My_Ranger1', ctype:'ranger' }),
    Object.freeze({ name:'My_Priest', ctype:'priest' }),
    Object.freeze({ name:'My_Mage', ctype:'mage' })
  ]);
  const SAFE_SLOTS = Object.freeze(['mainhand','offhand']);

  const state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    phase: 'ACCOUNT_WEAPON_CANDIDATE_DISCOVERY',
    status: 'BOOT',
    terminal: false,
    blocker: [],
    startedAtMs: Date.now(),
    updatedAtMs: Date.now(),
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    startCalls: 0,
    disconnectCalls: 0,
    farmerWorkersInstalled: 0,
    sameIntentRetry: false,
    normalRuntimeAllowed: false,
    authority: {
      authorityIssued: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      durableIntentCreated: false,
      weaponOffhandWriteRatification: false,
      farmerMerchantCoordinatorAuthority: false
    },
    performanceTrick: null,
    rosterSource: null,
    activeCharacters: [],
    observations: [],
    selectedCandidate: null
  };

  function text(v, max = 96) {
    return String(v == null ? '' : v).trim().slice(0, max);
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function root() {
    try { if (globalThis.character) return globalThis; } catch {}
    try { if (parent && parent.character) return parent; } catch {}
    throw new Error('PR20_7_ACCOUNT_DISCOVERY_CONTEXT_MISSING');
  }

  function roots() {
    const out = [];
    try { out.push(globalThis); } catch {}
    try {
      if (globalThis.parent
          && globalThis.parent !== globalThis
          && !out.includes(globalThis.parent)) {
        out.push(globalThis.parent);
      }
    } catch {}
    return out;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function installTelemetryFacade(owner) {
    if (!owner) return;
    owner.AIO_V3 = owner.AIO_V3 || {};
    const existing = owner.AIO_V3.operations
      && typeof owner.AIO_V3.operations === 'object'
      ? owner.AIO_V3.operations
      : null;
    if (existing?.__v5Pr207AccountDiscoveryFacadeVersion === VERSION) return;

    const oldStatus = existing && typeof existing.status === 'function'
      ? existing.status.bind(existing)
      : null;
    const oldHeartbeat = existing && typeof existing.hostHeartbeat === 'function'
      ? existing.hostHeartbeat.bind(existing)
      : null;

    owner.AIO_V3.operations = {
      ...(existing || {}),
      __v5Pr207AccountDiscoveryFacadeVersion: VERSION,
      status: () => {
        let base = {};
        try {
          const value = oldStatus ? oldStatus() : null;
          if (value && typeof value === 'object') base = value;
        } catch {}
        return {
          ...base,
          schemaVersion: Number(base.schemaVersion) || 1,
          mode: 'V5_AUTONOMOUS_TEST',
          v5AutonomousTest: clone(state),
          telemetry: {
            queued: 0,
            lastCapturedSeq: 0,
            dropped: 0
          }
        };
      },
      hostHeartbeat: () => {
        try {
          const value = oldHeartbeat ? oldHeartbeat() : null;
          if (value && typeof value === 'object') {
            return {
              ...value,
              v5Mode: 'V5_AUTONOMOUS_TEST',
              v5TestId: TEST_ID,
              v5ObservedAtMs: Date.now()
            };
          }
        } catch {}
        return {
          schemaVersion: 1,
          mode: 'V5_AUTONOMOUS_TEST',
          v5Mode: 'V5_AUTONOMOUS_TEST',
          v5TestId: TEST_ID,
          alive: true,
          observedAtMs: Date.now(),
          v5ObservedAtMs: Date.now()
        };
      },
      reconciliationStatus: () => ({
        schemaVersion: 1,
        status: state.terminal ? 'TERMINAL_NO_MUTATION' : 'OBSERVING',
        v5AutonomousTestStatus: state.status,
        v5Terminal: state.terminal === true,
        sameIntentRetry: false
      }),
      peekTelemetry: () => []
    };
  }

  function publish() {
    state.updatedAtMs = Date.now();
    try { installTelemetryFacade(root()); } catch {}
    try {
      if (globalThis !== root()) installTelemetryFacade(globalThis);
    } catch {}
  }

  function finish(status, blocker = []) {
    state.status = status;
    state.terminal = true;
    state.blocker = [...new Set(blocker)];
    state.phase = status === 'BESTANDEN' ? 'COMPLETE' : 'ACCOUNT_WEAPON_CANDIDATE_DISCOVERY';
    publish();
  }

  async function performanceStatus() {
    let available = false;
    let called = false;
    let lastError = null;

    for (const candidate of roots()) {
      try {
        if (typeof candidate?.performance_trick !== 'function') continue;
        available = true;
        candidate.performance_trick();
        called = true;
        break;
      } catch (error) {
        lastError = text(error?.message || error, 160);
      }
    }

    if (called) await sleep(350);

    const inspect = () => {
      let audioFound = false;
      let playing = false;
      let cplaying = false;
      for (const candidate of roots()) {
        try {
          const audio = candidate?.sounds?.empty;
          if (!audio) continue;
          audioFound = true;
          if (audio.cplaying === true) cplaying = true;
          if (typeof audio.playing === 'function' && audio.playing() === true) {
            playing = true;
          } else if (audio.playing === true) {
            playing = true;
          }
        } catch {}
      }
      return { audioFound, playing, cplaying };
    };

    let status = inspect();
    if (available && called && !status.playing) {
      for (const candidate of roots()) {
        try {
          if (typeof candidate?.performance_trick === 'function') {
            candidate.performance_trick();
            break;
          }
        } catch {}
      }
      await sleep(150);
      status = inspect();
    }

    return {
      available,
      called,
      audioFound: status.audioFound,
      playing: status.playing,
      cplaying: status.cplaying,
      active: available && called && status.audioFound && status.playing,
      verification: 'HOWLER_PLAYING_TRUE',
      error: lastError
    };
  }

  function accountRows() {
    const r = root();
    const owners = [r];
    try { if (globalThis && !owners.includes(globalThis)) owners.push(globalThis); } catch {}
    try { if (r.parent && !owners.includes(r.parent)) owners.push(r.parent); } catch {}

    const candidates = [];
    const pushRows = (source, rows) => {
      if (!Array.isArray(rows) || !rows.length) return;
      const exact = FARMERS.map(expected => {
        const matches = rows.filter(row =>
          row
          && typeof row === 'object'
          && text(row.name, 64) === expected.name
          && text(row.ctype || row.type, 32).toLowerCase() === expected.ctype
        );
        if (matches.length !== 1) return { exact:false, rich:false };
        const row = matches[0];
        return {
          exact:true,
          rich:Array.isArray(row.items)
            && !!row.slots
            && typeof row.slots === 'object'
        };
      });
      const exactCount = exact.filter(x => x.exact).length;
      const richCount = exact.filter(x => x.rich).length;
      candidates.push({
        source,
        rows,
        score: richCount * 1000 + exactCount * 10 + rows.length,
        exactCount,
        richCount
      });
    };

    for (const owner of owners) {
      try {
        if (typeof owner.get_characters === 'function') {
          pushRows('get_characters', owner.get_characters());
        }
      } catch {}
      try {
        pushRows('X.characters', owner?.X?.characters);
      } catch {}
    }

    candidates.sort((a, b) =>
      b.score - a.score
      || b.richCount - a.richCount
      || b.exactCount - a.exactCount
      || (a.source === 'X.characters' ? -1 : 1)
    );
    const best = candidates[0] || null;
    return best
      ? {
          source:best.source,
          rows:best.rows,
          sourceCandidates:candidates.map(row => ({
            source:row.source,
            exactFarmerRows:row.exactCount,
            richFarmerRows:row.richCount,
            score:row.score
          }))
        }
      : { source:null, rows:null, sourceCandidates:[] };
  }

  function activeNames() {
    const r = root();
    const values = [];
    const owners = [r];
    try { if (globalThis && !owners.includes(globalThis)) owners.push(globalThis); } catch {}
    try { if (r.parent && !owners.includes(r.parent)) owners.push(r.parent); } catch {}
    for (const owner of owners) {
      try {
        if (typeof owner.get_active_characters !== 'function') continue;
        const raw = owner.get_active_characters();
        if (Array.isArray(raw)) {
          for (const row of raw) {
            const name = typeof row === 'string' ? row : text(row?.name, 64);
            if (name) values.push(name);
          }
        } else if (raw && typeof raw === 'object') {
          for (const [key, value] of Object.entries(raw)) {
            const name = text(value?.name || key, 64);
            if (name) values.push(name);
          }
        }
      } catch {}
    }
    return [...new Set(values)].sort();
  }

  function material(item) {
    if (!item || typeof item !== 'object') return null;
    const out = {};
    for (const key of Object.keys(item).sort()) {
      const value = item[key];
      if (value == null || ['string','number','boolean'].includes(typeof value)) out[key] = value;
    }
    return JSON.stringify(out);
  }

  function itemView(item, index, G) {
    if (!item || typeof item !== 'object') return null;
    const name = text(item.name, 96);
    const def = G?.items?.[name];
    if (!name || !def) return null;
    return {
      index,
      name,
      level: Number(item.level || 0),
      type: text(def.type, 64),
      wtype: text(def.wtype, 64),
      classList: Array.isArray(def.class) ? def.class.map(x => text(x, 32)).filter(Boolean) : [],
      requiredLevel: Number(def.level || 0),
      locked: item.l === true || item.locked === true || item.lock === true,
      virtualB: item.b === true,
      material: material(item)
    };
  }

  function rulesFor(ctype, G) {
    const def = G?.classes?.[ctype] || {};
    return {
      mainhandWtypes: Object.keys(def.mainhand || {}).sort(),
      doublehandWtypes: Object.keys(def.doublehand || {}).sort(),
      offhandKinds: Object.keys(def.offhand || {}).sort()
    };
  }

  function findCandidates(row, expected, G) {
    const ctype = text(row?.ctype || row?.type, 32).toLowerCase();
    const level = Number(row?.level || 0);
    const rules = rulesFor(ctype, G);
    const items = Array.isArray(row?.items) ? row.items : null;
    const slots = row?.slots && typeof row.slots === 'object' ? row.slots : null;
    const result = {
      name: expected.name,
      ctype: expected.ctype,
      observedCtype: ctype || null,
      level: Number.isFinite(level) ? level : null,
      hasItemsArray: !!items,
      inventorySize: items ? items.length : null,
      hasSlotsObject: !!slots,
      active: state.activeCharacters.includes(expected.name),
      mainhand: slots?.mainhand ? {
        name: text(slots.mainhand.name, 96),
        level: Number(slots.mainhand.level || 0),
        wtype: text(G?.items?.[slots.mainhand.name]?.wtype, 64)
      } : null,
      offhand: slots?.offhand ? {
        name: text(slots.offhand.name, 96),
        level: Number(slots.offhand.level || 0),
        type: text(G?.items?.[slots.offhand.name]?.type, 64),
        wtype: text(G?.items?.[slots.offhand.name]?.wtype, 64)
      } : null,
      classRules: rules,
      candidates: []
    };
    if (ctype !== expected.ctype || !items || !slots || !Number.isFinite(level)) return result;

    const mainhandWtype = text(G?.items?.[slots.mainhand?.name]?.wtype, 64);
    const mainhandIsDouble = !!mainhandWtype && rules.doublehandWtypes.includes(mainhandWtype);

    for (let index = 0; index < items.length && index < 128; index += 1) {
      const item = itemView(items[index], index, G);
      if (!item || item.locked || item.virtualB || !item.material) continue;
      if (item.classList.length && !item.classList.includes(ctype)) continue;
      if (Number.isFinite(item.requiredLevel) && item.requiredLevel > level) continue;

      const options = [];
      const oneHand = !!item.wtype && rules.mainhandWtypes.includes(item.wtype);
      const doubleHand = !!item.wtype && rules.doublehandWtypes.includes(item.wtype);
      if ((oneHand || doubleHand) && (!doubleHand || !slots.offhand)) {
        options.push({ slot:'mainhand', candidateIsDoublehand:doubleHand });
      }

      const typeOffhand = ['shield','source','quiver','misc_offhand'].includes(item.type)
        && rules.offhandKinds.includes(item.type);
      const weaponOffhand = ['weapon','tool'].includes(item.type)
        && !!item.wtype
        && rules.offhandKinds.includes(item.wtype)
        && !mainhandIsDouble;
      if ((typeOffhand || weaponOffhand) && !mainhandIsDouble) {
        options.push({ slot:'offhand', candidateIsDoublehand:false });
      }

      for (const option of options) {
        const previous = slots[option.slot] || null;
        const oppositeSlot = option.slot === 'mainhand' ? 'offhand' : 'mainhand';
        const opposite = slots[oppositeSlot] || null;
        if (previous?.l === true || previous?.b === true) continue;
        if (opposite?.l === true || opposite?.b === true) continue;
        result.candidates.push({
          recipient: expected.name,
          recipientCtype: expected.ctype,
          recipientLevel: level,
          slot: option.slot,
          inventoryIndex: index,
          candidateName: item.name,
          candidateLevel: item.level,
          candidateType: item.type,
          candidateWtype: item.wtype,
          candidateIsDoublehand: option.candidateIsDoublehand,
          previousName: previous ? text(previous.name, 96) : null,
          previousLevel: previous ? Number(previous.level || 0) : null,
          oppositeSlot,
          oppositeName: opposite ? text(opposite.name, 96) : null,
          oppositeLevel: opposite ? Number(opposite.level || 0) : null,
          rosterSnapshotOnly: true,
          exactLiveSessionPreflightStillRequired: true
        });
      }
    }

    result.candidates.sort((a,b) =>
      SAFE_SLOTS.indexOf(a.slot) - SAFE_SLOTS.indexOf(b.slot)
      || Number(a.candidateIsDoublehand) - Number(b.candidateIsDoublehand)
      || a.inventoryIndex - b.inventoryIndex
    );
    return result;
  }

  async function run() {
    publish();
    const r = root();
    const c = r.character;
    if (!c || text(c.name, 64) !== 'My_Merchant'
        || text(c.ctype || c.type, 32).toLowerCase() !== 'merchant') {
      finish('BLOCKIERT', ['PR20_7_ACCOUNT_DISCOVERY_MERCHANT_CONTEXT_REQUIRED']);
      return;
    }

    state.performanceTrick = await performanceStatus();
    if (!state.performanceTrick.active) {
      finish('BLOCKIERT', ['PR20_7_ACCOUNT_DISCOVERY_PERFORMANCE_TRICK_BLOCKED']);
      return;
    }

    state.activeCharacters = activeNames();
    const found = accountRows();
    state.rosterSource = found.source;
    state.rosterSourceCandidates = found.sourceCandidates;
    if (!Array.isArray(found.rows) || !found.rows.length) {
      finish('BLOCKIERT', ['PR20_7_ACCOUNT_DISCOVERY_ROSTER_UNAVAILABLE']);
      return;
    }

    const G = r.G || globalThis.G;
    if (!G?.items || !G?.classes) {
      finish('BLOCKIERT', ['PR20_7_ACCOUNT_DISCOVERY_GAME_DATA_UNAVAILABLE']);
      return;
    }

    const rows = found.rows.filter(row => row && typeof row === 'object');
    state.observations = FARMERS.map(expected => {
      const matches = rows.filter(row =>
        text(row.name, 64) === expected.name
        && text(row.ctype || row.type, 32).toLowerCase() === expected.ctype
      );
      if (matches.length !== 1) {
        return {
          name: expected.name,
          ctype: expected.ctype,
          rowCount: matches.length,
          active: state.activeCharacters.includes(expected.name),
          hasItemsArray: false,
          hasSlotsObject: false,
          candidates: []
        };
      }
      return { rowCount:1, ...findCandidates(matches[0], expected, G) };
    });

    const candidates = state.observations.flatMap(row => row.candidates || []);
    candidates.sort((a,b) =>
      FARMERS.findIndex(x => x.name === a.recipient)
        - FARMERS.findIndex(x => x.name === b.recipient)
      || SAFE_SLOTS.indexOf(a.slot) - SAFE_SLOTS.indexOf(b.slot)
      || Number(a.candidateIsDoublehand) - Number(b.candidateIsDoublehand)
      || a.inventoryIndex - b.inventoryIndex
    );
    state.selectedCandidate = candidates[0] || null;

    if (!state.selectedCandidate) {
      const anyInventory = state.observations.some(x => x.hasItemsArray && x.hasSlotsObject);
      finish('BLOCKIERT', [
        anyInventory
          ? 'PR20_7_ACCOUNT_DISCOVERY_KEIN_KOMPATIBLER_FARMER_KANDIDAT'
          : 'PR20_7_ACCOUNT_DISCOVERY_ROSTER_OHNE_INVENTAR_SLOTS'
      ]);
      return;
    }

    finish('BESTANDEN', []);
  }

  const api = Object.freeze({
    version: VERSION,
    testId: TEST_ID,
    status: () => clone(state)
  });
  Object.defineProperty(globalThis, 'V5PR207AccountWeaponCandidateDiscovery', {
    configurable: true,
    enumerable: true,
    writable: false,
    value: api
  });
  try {
    if (parent && parent !== globalThis) {
      Object.defineProperty(parent, 'V5PR207AccountWeaponCandidateDiscovery', {
        configurable: true,
        enumerable: true,
        writable: false,
        value: api
      });
    }
  } catch {}

  Promise.resolve().then(run).catch(error => {
    state.error = text(error?.message || error, 240);
    finish('FEHLER', ['PR20_7_ACCOUNT_DISCOVERY_UNEXPECTED_ERROR']);
  });
})();
