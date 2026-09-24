(() => {
  'use strict';

  const VERSION = '1.0.0';
  const TEST_ID = 'pr20-7-gear-weapon-offhand-acquisition-read-only-preflight';
  const ITEM_NAME = 'wshield';
  const ITEM_DISPLAY_NAME = 'Wooden Shield';
  const TARGET_SLOT = 'offhand';
  const VENDOR_ID = 'basics';
  const QUANTITY = 1;
  const EXPECTED_UNIT_PRICE = 4800;
  const DOUBLE_OBSERVE_DELAY_MS = 350;

  let state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    status: 'BOOT',
    phase: 'BOOT',
    terminal: false,
    blocker: [],
    startedAtMs: Date.now(),
    updatedAtMs: Date.now(),
    evidence: null,
    intents: [],
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
      durableIntentCreated: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      purchaseAuthority: false,
      weaponOffhandWriteRatification: false,
      farmerGearAllocationRatification: false
    }
  };

  function text(value, max = 192) {
    return String(value == null ? '' : value).trim().slice(0, max);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
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

  function root() {
    for (const candidate of roots()) {
      try {
        if (candidate?.character
            && Array.isArray(candidate.character.items)
            && candidate.character.slots
            && candidate.G?.items
            && candidate.G?.classes
            && candidate.G?.npcs
            && candidate.G?.maps) {
          return candidate;
        }
      } catch {}
    }
    throw new Error('PR20_7_ACQUISITION_SPIELKONTEXT_FEHLT');
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function serverBinding(r) {
    let parentRoot = null;
    try { if (r.parent && r.parent !== r) parentRoot = r.parent; } catch {}
    return {
      region: [r.server_region, r.server?.region, parentRoot?.server_region, parentRoot?.server?.region]
        .map(v => text(v, 32)).find(Boolean) || '',
      identifier: [r.server_identifier, r.server?.id, parentRoot?.server_identifier, parentRoot?.server?.id]
        .map(v => text(v, 32)).find(Boolean) || ''
    };
  }

  function runtimeConflict(r) {
    try {
      const v3 = r.AIO_V3?.__runtime;
      const status = v3 && typeof v3.status === 'function' ? v3.status() : null;
      if (v3 && (v3.timer || status?.running === true)) return 'AIO_V3_RUNTIME_ACTIVE';
    } catch {
      return 'AIO_V3_RUNTIME_UNREADABLE';
    }
    try {
      const v4 = r.AIO_V4 || r.V4Runtime;
      const status = v4 && typeof v4.status === 'function' ? v4.status() : null;
      if (status?.running === true || status?.aktivFreigegeben === true) return 'V4_RUNTIME_ACTIVE';
    } catch {
      return 'V4_RUNTIME_UNREADABLE';
    }
    return null;
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
          if (typeof audio.playing === 'function' && audio.playing() === true) playing = true;
          else if (audio.playing === true) playing = true;
        } catch {}
      }
      return { audioFound, playing, cplaying };
    };

    let observed = inspect();
    if (available && called && !observed.playing) {
      for (const candidate of roots()) {
        try {
          if (typeof candidate?.performance_trick === 'function') {
            candidate.performance_trick();
            break;
          }
        } catch {}
      }
      await sleep(150);
      observed = inspect();
    }
    return {
      available,
      called,
      audioFound: observed.audioFound,
      playing: observed.playing,
      cplaying: observed.cplaying,
      active: available && called && observed.audioFound && observed.playing,
      verification: 'HOWLER_PLAYING_TRUE',
      error: lastError
    };
  }

  function itemSummary(r, item) {
    if (!item || typeof item !== 'object' || !item.name) return null;
    const def = r.G.items[item.name] || {};
    return {
      name: text(item.name, 128),
      level: Number(item.level || 0),
      type: text(def.type, 64),
      wtype: text(def.wtype, 64),
      locked: item.l === true || item.locked === true || item.lock === true,
      virtualB: item.b === true
    };
  }

  function quantityOf(items, name) {
    return items.reduce((sum, item) => {
      if (!item || item.name !== name) return sum;
      return sum + Math.max(1, Number(item.q || 1));
    }, 0);
  }

  function observe() {
    const r = root();
    const c = r.character;
    const server = serverBinding(r);

    if (text(c.name, 192) !== 'My_Merchant') {
      throw new Error('PR20_7_ACQUISITION_EXAKTER_MERCHANT_ERFORDERLICH');
    }
    if (text(c.ctype || c.type, 32).toLowerCase() !== 'merchant') {
      throw new Error('PR20_7_ACQUISITION_MERCHANT_KLASSE_ERFORDERLICH');
    }
    if (!text(c.id, 192)) throw new Error('PR20_7_ACQUISITION_SESSION_FEHLT');
    if (!server.region || !server.identifier) throw new Error('PR20_7_ACQUISITION_SERVER_FEHLT');
    if (c.rip === true || c.dead === true) throw new Error('PR20_7_ACQUISITION_CHARACTER_TOT');
    if (c.moving === true) throw new Error('PR20_7_ACQUISITION_CHARACTER_BEWEGT_SICH');
    if (c.target !== null && c.target !== undefined && text(c.target, 192)) {
      throw new Error('PR20_7_ACQUISITION_CHARACTER_HAT_ZIEL');
    }
    if (c.q && typeof c.q === 'object' && Object.keys(c.q).length) {
      throw new Error('PR20_7_ACQUISITION_CHARACTER_QUEUE_AKTIV');
    }
    const conflict = runtimeConflict(r);
    if (conflict) throw new Error('PR20_7_ACQUISITION_ALTERNATIVE_RUNTIME_AKTIV:' + conflict);

    const def = r.G.items[ITEM_NAME];
    if (!def || text(def.type, 64) !== 'shield') {
      throw new Error('PR20_7_ACQUISITION_ITEM_DEFINITION_DRIFT');
    }
    const unitPrice = Number(def.g);
    if (!Number.isSafeInteger(unitPrice) || unitPrice !== EXPECTED_UNIT_PRICE) {
      throw new Error('PR20_7_ACQUISITION_PREIS_DRIFT');
    }
    if (Array.isArray(def.class) && def.class.length
        && !def.class.map(x => text(x, 32).toLowerCase()).includes('merchant')) {
      throw new Error('PR20_7_ACQUISITION_ITEM_CLASS_BLOCK');
    }
    if (Number(def.level || 0) > Number(c.level || 0)) {
      throw new Error('PR20_7_ACQUISITION_ITEM_LEVEL_BLOCK');
    }

    const classDef = r.G.classes.merchant || {};
    const offhandKinds = Object.keys(classDef.offhand || {}).sort();
    const doublehandWtypes = Object.keys(classDef.doublehand || {}).sort();
    if (!offhandKinds.includes('shield')) {
      throw new Error('PR20_7_ACQUISITION_MERCHANT_SHIELD_OFFHAND_NICHT_ERLAUBT');
    }

    const mainhand = itemSummary(r, c.slots.mainhand || null);
    const offhand = itemSummary(r, c.slots.offhand || null);
    if (offhand !== null) throw new Error('PR20_7_ACQUISITION_OFFHAND_NICHT_LEER');
    if (mainhand?.wtype && doublehandWtypes.includes(mainhand.wtype)) {
      throw new Error('PR20_7_ACQUISITION_DOUBLEHAND_KONFLIKT');
    }

    const vendor = r.G.npcs[VENDOR_ID];
    if (!vendor || text(vendor.role, 32) !== 'merchant'
        || !Array.isArray(vendor.items)
        || !vendor.items.includes(ITEM_NAME)) {
      throw new Error('PR20_7_ACQUISITION_VENDOR_DEFINITION_DRIFT');
    }

    const vendorLocations = Array.isArray(r.G.maps?.[c.map]?.items?.[ITEM_NAME])
      ? r.G.maps[c.map].items[ITEM_NAME]
      : [];
    const sellDist = Number(r.B?.sell_dist);
    let nearestVendorDistance = null;
    if (typeof r.simple_distance === 'function' && vendorLocations.length) {
      for (const location of vendorLocations) {
        try {
          const d = Number(r.simple_distance(c, location));
          if (!Number.isFinite(d)) continue;
          if (nearestVendorDistance === null || d < nearestVendorDistance) nearestVendorDistance = d;
        } catch {}
      }
    }
    const vendorReachableNow = Number.isFinite(nearestVendorDistance)
      && Number.isFinite(sellDist)
      && nearestVendorDistance < sellDist;

    const freeSlots = c.items.reduce((sum, item) => sum + (item ? 0 : 1), 0);
    if (freeSlots < 1) throw new Error('PR20_7_ACQUISITION_KEIN_FREIER_INVENTARSLOT');

    const existingQuantity = quantityOf(c.items, ITEM_NAME);
    if (existingQuantity > 0) {
      throw new Error('PR20_7_ACQUISITION_ITEM_BEREITS_VORHANDEN_REOBSERVE_GEAR');
    }

    const gold = Number(c.gold);
    if (!Number.isSafeInteger(gold) || gold < 0) {
      throw new Error('PR20_7_ACQUISITION_GOLD_UNGUELTIG');
    }
    if (gold < unitPrice * QUANTITY) {
      throw new Error('PR20_7_ACQUISITION_GOLD_UNTER_BASISKOSTEN');
    }

    return {
      recipient: {
        characterName: text(c.name, 192),
        sessionId: text(c.id, 192),
        ctype: 'merchant',
        level: Number(c.level || 0),
        map: text(c.map, 96),
        serverRegion: server.region,
        serverIdentifier: server.identifier
      },
      candidate: {
        itemName: ITEM_NAME,
        displayName: ITEM_DISPLAY_NAME,
        targetSlot: TARGET_SLOT,
        quantity: QUANTITY,
        type: text(def.type, 64),
        unitPrice,
        totalPrice: unitPrice * QUANTITY,
        vendorId: VENDOR_ID,
        vendorName: text(vendor.name, 96),
        classOffhandCompatible: true,
        requiredLevel: Number(def.level || 0),
        currentMainhand: mainhand,
        currentOffhand: offhand
      },
      acquisition: {
        route: 'GOLD_ONLY_NPC',
        publicFunction: 'buy_with_gold',
        publicFunctionAvailable: typeof r.buy_with_gold === 'function',
        freeInventorySlots: freeSlots,
        existingQuantity,
        observedGold: gold,
        baseCostAffordable: gold >= unitPrice * QUANTITY,
        goldBudgetLedgerReservationRequired: true,
        goldBudgetLedgerReservationSatisfied: false,
        purchaseAuthority: false,
        vendorReachableNow,
        nearestVendorDistance,
        sellDistance: Number.isFinite(sellDist) ? sellDist : null
      }
    };
  }

  function stableIdentity(value) {
    return JSON.stringify({
      recipient: value.recipient,
      candidate: value.candidate,
      acquisition: {
        route: value.acquisition.route,
        publicFunctionAvailable: value.acquisition.publicFunctionAvailable,
        freeInventorySlots: value.acquisition.freeInventorySlots,
        existingQuantity: value.acquisition.existingQuantity,
        observedGold: value.acquisition.observedGold,
        baseCostAffordable: value.acquisition.baseCostAffordable,
        vendorReachableNow: value.acquisition.vendorReachableNow,
        nearestVendorDistance: value.acquisition.nearestVendorDistance,
        sellDistance: value.acquisition.sellDistance
      }
    });
  }

  function installTelemetryFacade() {
    const r = root();
    r.AIO_V3 = r.AIO_V3 || {};
    const existing = r.AIO_V3.operations && typeof r.AIO_V3.operations === 'object'
      ? r.AIO_V3.operations
      : null;
    const oldStatus = existing && typeof existing.status === 'function'
      ? existing.status.bind(existing)
      : null;
    const oldHeartbeat = existing && typeof existing.hostHeartbeat === 'function'
      ? existing.hostHeartbeat.bind(existing)
      : null;

    r.AIO_V3.operations = {
      ...(existing || {}),
      __v5Pr207WeaponOffhandAcquisitionReadOnlyFacadeVersion: VERSION,
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
          telemetry: { queued: 0, lastCapturedSeq: 0, dropped: 0 }
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

  function finish(status, blocker = [], evidence = null) {
    state = {
      ...state,
      status,
      phase: status === 'BESTANDEN'
        ? 'ACQUISITION_SOURCE_READY'
        : 'ACQUISITION_READ_ONLY_PREFLIGHT',
      terminal: true,
      blocker: [...new Set(blocker)],
      evidence,
      updatedAtMs: Date.now(),
      intents: [],
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
        durableIntentCreated: false,
        gameplayAuthority: false,
        rawWriteAuthority: false,
        purchaseAuthority: false,
        weaponOffhandWriteRatification: false,
        farmerGearAllocationRatification: false
      }
    };
    try { installTelemetryFacade(); } catch {}
  }

  async function run() {
    try {
      state.phase = 'PERFORMANCE_TRICK';
      state.updatedAtMs = Date.now();
      installTelemetryFacade();

      const performanceTrick = await performanceStatus();
      if (!performanceTrick.active) {
        finish('BLOCKIERT', ['PR20_7_ACQUISITION_PERFORMANCE_TRICK_BLOCKED'], { performanceTrick });
        return;
      }

      state.phase = 'DOUBLE_OBSERVE';
      const first = observe();
      await sleep(DOUBLE_OBSERVE_DELAY_MS);
      const second = observe();
      if (stableIdentity(first) !== stableIdentity(second)) {
        finish('BLOCKIERT', ['PR20_7_ACQUISITION_LIVE_STATE_DRIFT'], {
          performanceTrick,
          first,
          second,
          stableDoubleObservation: false
        });
        return;
      }

      finish('BESTANDEN', [], {
        performanceTrick,
        ...second,
        stableDoubleObservation: true,
        sourceCandidateRatifiedOnly: true,
        purchaseStillRequiresGoldBudgetLedgerReservation: true,
        purchaseStillRequiresDurableIntentAndOneShotAuthority: true,
        equipStillSeparateMutation: true
      });
    } catch (error) {
      finish('BLOCKIERT', [text(error?.message || error, 240) || 'PR20_7_ACQUISITION_UNEXPECTED_ERROR'], null);
    }
  }

  const api = Object.freeze({
    version: VERSION,
    testId: TEST_ID,
    status: () => clone(state)
  });
  Object.defineProperty(globalThis, 'V5PR207WeaponOffhandAcquisitionReadOnly', {
    configurable: true,
    enumerable: true,
    writable: false,
    value: api
  });
  try {
    if (parent && parent !== globalThis) {
      Object.defineProperty(parent, 'V5PR207WeaponOffhandAcquisitionReadOnly', {
        configurable: true,
        enumerable: true,
        writable: false,
        value: api
      });
    }
  } catch {}

  Promise.resolve().then(run).catch(error => {
    finish('BLOCKIERT', [text(error?.message || error, 240) || 'PR20_7_ACQUISITION_UNEXPECTED_ERROR'], null);
  });
})();
