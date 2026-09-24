(() => {
  'use strict';

  const VERSION = '1.0.1';
  const TEST_ID = 'pr20-7-gear-weapon-offhand-acquisition-durable-shadow-no-write';
  const ITEM_NAME = 'wshield';
  const TARGET_SLOT = 'offhand';
  const VENDOR_ID = 'basics';
  const EXPECTED_VENDOR_NAME = 'Gabriel';
  const QUANTITY = 1;
  const EXPECTED_UNIT_PRICE = 4800;
  const EXACT_COST = 4800;
  const MIN_GOLD_RESERVE = 1000;
  const EXPECTED_SERVER_REGION = 'EU';
  const EXPECTED_SERVER_IDENTIFIER = 'I';
  const SOURCE_PINNED_SELL_DISTANCE = 400;
  const OFFICIAL_SERVER_SOURCE_COMMIT = '90052162eb3ebda36c893e1eb4af643913c8f984';
  const OFFICIAL_SERVER_BLOB_SHA = '40d0aeda16b9a4320441e833020fe1b4db496e2c';
  const DOUBLE_OBSERVE_DELAY_MS = 350;
  const INTENT_PREFIX = 'v5:' + TEST_ID + ':intent:';

  const events = [];
  let seq = 0;
  let state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    status: 'BOOT',
    phase: 'BOOT',
    startedAtMs: Date.now(),
    updatedAtMs: Date.now(),
    terminal: false,
    blocker: [],
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
      purchaseAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      weaponOffhandWriteRatification: false,
      farmerGearAllocationRatification: false
    }
  };

  function text(value, max = 240) {
    return String(value == null ? '' : value).trim().slice(0, max);
  }

  function roots() {
    const out = [];
    try { out.push(globalThis); } catch {}
    try {
      if (globalThis.parent && globalThis.parent !== globalThis
          && !out.includes(globalThis.parent)) out.push(globalThis.parent);
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
            && candidate.G?.npcs
            && candidate.G?.maps) return candidate;
      } catch {}
    }
    throw new Error('PR20_7_ACQUISITION_SHADOW_SPIELKONTEXT_FEHLT');
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function canonical(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    return '{' + Object.keys(value).sort()
      .map(key => JSON.stringify(key) + ':' + canonical(value[key]))
      .join(',') + '}';
  }

  async function sha256(value) {
    const r = root();
    const cryptoApi = globalThis.crypto || r.crypto;
    if (!cryptoApi?.subtle?.digest) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_WEB_CRYPTO_UNAVAILABLE');
    }
    const bytes = new TextEncoder().encode(String(value));
    const digest = await cryptoApi.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte =>
      byte.toString(16).padStart(2, '0')).join('');
  }

  function storage() {
    for (const candidate of roots()) {
      try {
        if (candidate?.localStorage
            && typeof candidate.localStorage.setItem === 'function'
            && typeof candidate.localStorage.getItem === 'function') {
          return candidate.localStorage;
        }
      } catch {}
    }
    throw new Error('PR20_7_ACQUISITION_SHADOW_DURABLE_STORAGE_UNAVAILABLE');
  }

  function stableItemMaterial(item) {
    if (!item || typeof item !== 'object') return null;
    const out = {};
    for (const key of Object.keys(item).sort().slice(0, 64)) {
      const value = item[key];
      if (value === null
          || typeof value === 'string'
          || typeof value === 'number'
          || typeof value === 'boolean') out[key] = value;
    }
    return canonical(out);
  }

  function serverBinding(r) {
    let parentRoot = null;
    try { if (r.parent && r.parent !== r) parentRoot = r.parent; } catch {}
    const region = [
      r.server_region,
      r.server?.region,
      parentRoot?.server_region,
      parentRoot?.server?.region
    ].map(v => text(v, 32)).find(Boolean) || '';
    const identifier = [
      r.server_identifier,
      r.server?.id,
      parentRoot?.server_identifier,
      parentRoot?.server?.id
    ].map(v => text(v, 32)).find(Boolean) || '';
    return { region, identifier };
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
      if (status?.running === true || status?.aktivFreigegeben === true) {
        return 'V4_RUNTIME_ACTIVE';
      }
    } catch {
      return 'V4_RUNTIME_UNREADABLE';
    }
    return null;
  }

  async function ensurePerformanceTrick() {
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
          const empty = candidate?.sounds?.empty;
          if (!empty) continue;
          audioFound = true;
          if (empty.cplaying === true) cplaying = true;
          if (typeof empty.playing === 'function' && empty.playing() === true) playing = true;
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

  function buyWithGoldAvailable() {
    for (const candidate of roots()) {
      try { if (typeof candidate?.buy_with_gold === 'function') return true; } catch {}
    }
    return false;
  }

  function sellDistanceEvidence() {
    let observed = null;
    for (const candidate of roots()) {
      try {
        const value = Number(candidate?.B?.sell_dist);
        if (Number.isFinite(value) && value > 0) {
          observed = value;
          break;
        }
      } catch {}
    }
    if (Number.isFinite(observed) && observed !== SOURCE_PINNED_SELL_DISTANCE) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_SELL_DIST_DRIFT');
    }
    return {
      value: Number.isFinite(observed) ? observed : SOURCE_PINNED_SELL_DISTANCE,
      source: Number.isFinite(observed) ? 'LIVE_BROWSER_B' : 'OFFICIAL_SERVER_SOURCE_PIN',
      browserObserved: Number.isFinite(observed)
    };
  }

  function countItem(items, name) {
    return items.reduce((sum, item) =>
      sum + (item?.name === name ? Math.max(1, Number(item.q || 1)) : 0), 0);
  }

  function observation() {
    const r = root();
    const c = r.character;
    if (text(c.name, 192) !== 'My_Merchant') {
      throw new Error('PR20_7_ACQUISITION_SHADOW_RECIPIENT_DRIFT');
    }
    if (text(c.id, 192) !== 'My_Merchant') {
      throw new Error('PR20_7_ACQUISITION_SHADOW_SESSION_DRIFT');
    }
    if (text(c.ctype, 32).toLowerCase() !== 'merchant') {
      throw new Error('PR20_7_ACQUISITION_SHADOW_MERCHANT_ERFORDERLICH');
    }
    const server = serverBinding(r);
    if (server.region !== EXPECTED_SERVER_REGION
        || server.identifier !== EXPECTED_SERVER_IDENTIFIER) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_SERVER_BINDUNG_DRIFT');
    }
    if (c.rip === true || c.dead === true) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_CHARACTER_TOT');
    }
    if (c.moving === true) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_CHARACTER_BEWEGT_SICH');
    }
    if (c.target !== null && c.target !== undefined && text(c.target, 192)) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_CHARACTER_HAT_ZIEL');
    }
    if (c.q && typeof c.q === 'object' && Object.keys(c.q).length) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_CHARACTER_QUEUE_AKTIV');
    }
    const conflict = runtimeConflict(r);
    if (conflict) throw new Error('PR20_7_ACQUISITION_SHADOW_ALTERNATIVE_RUNTIME_AKTIV:' + conflict);

    let hostile = 0;
    try {
      for (const entity of Object.values(r.entities || {})) {
        if (entity
            && entity.type === 'monster'
            && !entity.dead
            && !entity.rip
            && text(entity.target, 192) === 'My_Merchant') hostile += 1;
      }
    } catch {
      throw new Error('PR20_7_ACQUISITION_SHADOW_AGGRO_UNLESBAR');
    }
    if (hostile !== 0) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_CHARACTER_UNTER_ANGRIFF');
    }

    const def = r.G.items[ITEM_NAME];
    if (!def || text(def.type, 64) !== 'shield') {
      throw new Error('PR20_7_ACQUISITION_SHADOW_ITEM_DEFINITION_DRIFT');
    }
    const unitPrice = Number(def.g ?? def.gold);
    if (!Number.isSafeInteger(unitPrice) || unitPrice !== EXPECTED_UNIT_PRICE) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_PRICE_DRIFT');
    }
    if (Array.isArray(def.class) && def.class.length
        && !def.class.map(x => text(x, 32).toLowerCase()).includes('merchant')) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_ITEM_CLASS_DRIFT');
    }

    const merchantClass = r.G.classes?.merchant || {};
    const offhandKinds = Object.keys(merchantClass.offhand || {})
      .map(x => text(x, 64))
      .sort();
    if (!offhandKinds.includes('shield')) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_OFFHAND_CLASS_DRIFT');
    }

    const vendor = r.G.npcs[VENDOR_ID];
    if (!vendor
        || text(vendor.role, 32) !== 'merchant'
        || text(vendor.name, 96) !== EXPECTED_VENDOR_NAME
        || !Array.isArray(vendor.items)
        || !vendor.items.includes(ITEM_NAME)) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_VENDOR_DEFINITION_DRIFT');
    }
    if (!buyWithGoldAvailable()) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_BUY_WITH_GOLD_FEHLT');
    }

    const currentOffhand = c.slots?.[TARGET_SLOT] || null;
    if (currentOffhand) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_OFFHAND_BELEGT');
    }
    const currentMainhand = c.slots?.mainhand || null;
    if (currentMainhand?.name) {
      const mainDef = r.G.items[currentMainhand.name] || {};
      const wtype = text(mainDef.wtype || currentMainhand.wtype, 64);
      const doublehand = Object.keys(merchantClass.doublehand || {})
        .map(x => text(x, 64))
        .sort();
      if (doublehand.includes(wtype)) {
        throw new Error('PR20_7_ACQUISITION_SHADOW_DOUBLEHAND_MAINHAND');
      }
    }

    const freeSlots = c.items.reduce((sum, item) => sum + (item ? 0 : 1), 0);
    if (freeSlots < 1) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_INVENTAR_VOLL');
    }
    const existingQuantity = countItem(c.items, ITEM_NAME);
    if (existingQuantity !== 0) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_WSHIELD_BEREITS_VORHANDEN');
    }
    const gold = Number(c.gold);
    if (!Number.isSafeInteger(gold) || gold < EXACT_COST + MIN_GOLD_RESERVE) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_GOLD_BUDGET_NICHT_VERFUEGBAR');
    }

    const sellDistance = sellDistanceEvidence();
    const vendorLocations = Array.isArray(r.G.maps?.[c.map]?.items?.[ITEM_NAME])
      ? r.G.maps[c.map].items[ITEM_NAME]
      : [];
    if (!vendorLocations.length) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_VENDOR_POSITION_FEHLT');
    }
    let nearestVendorDistance = null;
    for (const row of vendorLocations) {
      const x = Number(row?.[0] ?? row?.x);
      const y = Number(row?.[1] ?? row?.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const dx = Number(c.x || 0) - x;
      const dy = Number(c.y || 0) - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (!Number.isFinite(nearestVendorDistance) || distance < nearestVendorDistance) {
        nearestVendorDistance = distance;
      }
    }
    if (!Number.isFinite(nearestVendorDistance)
        || nearestVendorDistance >= sellDistance.value) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_VENDOR_NICHT_ERREICHBAR');
    }

    const inventoryMaterial = canonical(c.items.map((item, index) => [
      index,
      stableItemMaterial(item)
    ]));
    const goldMaterial = canonical({
      characterName: text(c.name, 192),
      sessionId: text(c.id, 192),
      serverRegion: server.region,
      serverIdentifier: server.identifier,
      gold
    });
    const vendorMaterial = canonical({
      vendorId: VENDOR_ID,
      vendorName: text(vendor.name, 96),
      items: [...vendor.items].sort(),
      map: text(c.map, 96),
      nearestVendorDistance,
      sellDistance: sellDistance.value,
      sellDistanceSource: sellDistance.source
    });
    const itemDefinitionMaterial = canonical({
      itemName: ITEM_NAME,
      type: text(def.type, 64),
      wtype: text(def.wtype, 64),
      class: Array.isArray(def.class) ? [...def.class].sort() : [],
      unitPrice
    });

    return {
      characterName: 'My_Merchant',
      sessionId: 'My_Merchant',
      ctype: 'merchant',
      level: Number(c.level || 0),
      map: text(c.map, 96),
      serverRegion: server.region,
      serverIdentifier: server.identifier,
      gold,
      safetyReserve: MIN_GOLD_RESERVE,
      exactCost: EXACT_COST,
      goldAvailableAfterReserve: gold - MIN_GOLD_RESERVE,
      freeSlots,
      existingQuantity,
      currentMainhand: currentMainhand?.name ? {
        name: text(currentMainhand.name, 128),
        level: Number(currentMainhand.level || 0),
        material: stableItemMaterial(currentMainhand)
      } : null,
      currentOffhand: null,
      nearestVendorDistance,
      sellDistance: sellDistance.value,
      sellDistanceSource: sellDistance.source,
      sellDistanceBrowserObserved: sellDistance.browserObserved,
      inventoryMaterial,
      goldMaterial,
      vendorMaterial,
      itemDefinitionMaterial
    };
  }

  function stableIdentity(o) {
    return canonical({
      characterName: o.characterName,
      sessionId: o.sessionId,
      serverRegion: o.serverRegion,
      serverIdentifier: o.serverIdentifier,
      map: o.map,
      gold: o.gold,
      safetyReserve: o.safetyReserve,
      exactCost: o.exactCost,
      freeSlots: o.freeSlots,
      existingQuantity: o.existingQuantity,
      currentMainhand: o.currentMainhand,
      currentOffhand: o.currentOffhand,
      nearestVendorDistance: o.nearestVendorDistance,
      sellDistance: o.sellDistance,
      sellDistanceSource: o.sellDistanceSource,
      inventoryMaterial: o.inventoryMaterial,
      vendorMaterial: o.vendorMaterial,
      itemDefinitionMaterial: o.itemDefinitionMaterial
    });
  }

  function assertNoOpenEqualIntent(store, key) {
    const existing = store.getItem(key);
    if (existing === null) return;
    let decoded = null;
    try { decoded = JSON.parse(existing); } catch {}
    if (!decoded
        || decoded.terminal !== true
        || decoded.sendBoundaryState !== 'NICHT_GESENDET'
        || decoded.sameIntentRetry !== false) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_OFFENER_GLEICHER_INTENT');
    }
    throw new Error('PR20_7_ACQUISITION_SHADOW_GLEICHER_INTENT_BEREITS_TERMINAL');
  }

  function persistShadowIntent(record) {
    const store = storage();
    const key = INTENT_PREFIX + record.prestateFingerprintSha256;
    assertNoOpenEqualIntent(store, key);
    const payload = JSON.stringify({
      schemaVersion: 1,
      testId: TEST_ID,
      version: VERSION,
      art: 'ACQUISITION_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE',
      createdAtMs: Date.now(),
      terminal: true,
      journalTerminalArt: 'ABBRUCH',
      sendBoundaryState: 'NICHT_GESENDET',
      sameIntentRetry: false,
      actionContractId: 'AL-ACTION-BUY-WITH-GOLD',
      recoveryContractId: 'AL-RECOVERY-BUY-WITH-GOLD',
      verifierId: 'AL-VERIFIER-BUY-WITH-GOLD',
      recipient: record.recipient,
      itemName: ITEM_NAME,
      targetSlot: TARGET_SLOT,
      quantity: QUANTITY,
      unitPrice: EXPECTED_UNIT_PRICE,
      exactCost: EXACT_COST,
      goldBudgetLedger: {
        observedGold: record.observedGold,
        safetyReserve: MIN_GOLD_RESERVE,
        reservationAmount: EXACT_COST,
        reservationSatisfied: true,
        availableAfterReserveAndReservation:
          record.observedGold - MIN_GOLD_RESERVE - EXACT_COST
      },
      resourceClaims: [
        'character:My_Merchant:gold',
        'character:My_Merchant:inventory',
        'character:My_Merchant:action_channel:buy'
      ],
      socketBudget: {
        resource: 'character:My_Merchant:socket_call_budget',
        planBudgetReserved: 100,
        serverLimit: 200,
        serverReserveUntouched: 100
      },
      oneShot: {
        bindingPrepared: true,
        maximumUses: 1,
        purchaseAuthorityIssued: false
      },
      fingerprints: {
        prestate: record.prestateFingerprintSha256,
        inventory: record.inventoryFingerprintSha256,
        gold: record.goldFingerprintSha256,
        vendor: record.vendorFingerprintSha256,
        itemDefinition: record.itemDefinitionFingerprintSha256
      },
      gameplayAuthority: false,
      rawWriteAuthority: false,
      purchaseAuthority: false,
      normalRuntimeAllowed: false
    });
    store.setItem(key, payload);
    const readback = store.getItem(key);
    if (readback !== payload) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_DURABLE_READBACK_MISMATCH');
    }
    let decoded = null;
    try { decoded = JSON.parse(readback); } catch {}
    if (!decoded
        || decoded.terminal !== true
        || decoded.journalTerminalArt !== 'ABBRUCH'
        || decoded.sendBoundaryState !== 'NICHT_GESENDET'
        || decoded.sameIntentRetry !== false
        || decoded.goldBudgetLedger?.reservationAmount !== EXACT_COST
        || decoded.goldBudgetLedger?.safetyReserve < MIN_GOLD_RESERVE
        || decoded.goldBudgetLedger?.reservationSatisfied !== true
        || decoded.oneShot?.maximumUses !== 1
        || decoded.oneShot?.purchaseAuthorityIssued !== false
        || decoded.purchaseAuthority !== false
        || decoded.gameplayAuthority !== false
        || decoded.rawWriteAuthority !== false
        || decoded.normalRuntimeAllowed !== false) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_DURABLE_INTENT_INVALID');
    }
    return {
      storage: 'LOCAL_STORAGE_SHADOW_ONLY',
      key,
      durableReadback: true,
      journalTerminalArt: 'ABBRUCH',
      sendBoundaryState: 'NICHT_GESENDET',
      sameIntentRetry: false,
      resourceClaims: decoded.resourceClaims,
      socketBudget: decoded.socketBudget,
      goldBudgetLedger: decoded.goldBudgetLedger,
      oneShot: decoded.oneShot
    };
  }

  function emit(type, severity, data = {}) {
    seq += 1;
    events.push({
      seq,
      ts: new Date().toISOString(),
      event: type,
      type,
      severity,
      reason: data.reason || null,
      component: 'v5-pr20-7-acquisition-shadow-no-write',
      data
    });
    if (events.length > 128) events.splice(0, events.length - 128);
  }

  function setState(patch) {
    state = {
      ...state,
      ...patch,
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
        purchaseAuthority: false,
        gameplayAuthority: false,
        rawWriteAuthority: false,
        weaponOffhandWriteRatification: false,
        farmerGearAllocationRatification: false
      }
    };
    return state;
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
      __v5Pr207AcquisitionShadowFacadeVersion: VERSION,
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
          v5AutonomousTest: state,
          telemetry: {
            queued: events.length,
            lastCapturedSeq: seq,
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
          alive: true,
          mode: 'V5_AUTONOMOUS_TEST',
          testId: TEST_ID,
          observedAtMs: Date.now()
        };
      },
      reconciliationStatus: () => ({
        schemaVersion: 1,
        status: state.terminal ? 'TERMINAL_NO_MUTATION' : 'NO_MUTATION_RECONCILIATION_REQUIRED',
        v5AutonomousTestStatus: state.status,
        v5Terminal: state.terminal === true,
        sameIntentRetry: false
      }),
      peekTelemetry: (limit = 2000) =>
        events.slice(-Math.max(1, Math.min(2000, Number(limit) || 2000)))
    };
  }

  async function run() {
    installTelemetryFacade();
    emit('PR20_7_ACQUISITION_SHADOW_NO_WRITE_STARTED', 'INFO');

    const performanceTrick = await ensurePerformanceTrick();
    if (!performanceTrick.active) {
      setState({
        status: 'BLOCKIERT',
        phase: 'BACKGROUND_EXECUTION',
        terminal: true,
        blocker: ['PR20_7_ACQUISITION_SHADOW_PERFORMANCE_TRICK_NICHT_AKTIV'],
        performanceTrick
      });
      return;
    }

    const first = observation();
    const firstIdentity = stableIdentity(first);
    await sleep(DOUBLE_OBSERVE_DELAY_MS);
    const second = observation();
    const secondIdentity = stableIdentity(second);
    if (firstIdentity !== secondIdentity) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_PREFLIGHT_SNAPSHOT_DRIFT');
    }

    const [
      prestateFingerprintSha256,
      inventoryFingerprintSha256,
      goldFingerprintSha256,
      vendorFingerprintSha256,
      itemDefinitionFingerprintSha256
    ] = await Promise.all([
      sha256(secondIdentity),
      sha256(second.inventoryMaterial),
      sha256(second.goldMaterial),
      sha256(second.vendorMaterial),
      sha256(second.itemDefinitionMaterial)
    ]);

    const shadowIntent = persistShadowIntent({
      recipient: {
        characterName: second.characterName,
        sessionId: second.sessionId,
        ctype: second.ctype,
        serverRegion: second.serverRegion,
        serverIdentifier: second.serverIdentifier
      },
      observedGold: second.gold,
      prestateFingerprintSha256,
      inventoryFingerprintSha256,
      goldFingerprintSha256,
      vendorFingerprintSha256,
      itemDefinitionFingerprintSha256
    });

    await sleep(DOUBLE_OBSERVE_DELAY_MS);
    const third = observation();
    const thirdIdentity = stableIdentity(third);
    if (thirdIdentity !== secondIdentity) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_POST_INTENT_DRIFT');
    }
    const postIntentPrestateFingerprintSha256 = await sha256(thirdIdentity);
    if (postIntentPrestateFingerprintSha256 !== prestateFingerprintSha256) {
      throw new Error('PR20_7_ACQUISITION_SHADOW_PRESTATE_HASH_DRIFT');
    }

    const evidence = {
      schemaVersion: 1,
      evidenceArt: 'V5_PR20_7_WEAPON_OFFHAND_ACQUISITION_DURABLE_SHADOW_NO_WRITE',
      status: 'BESTANDEN',
      observedAtMs: Date.now(),
      recipient: {
        characterName: second.characterName,
        sessionId: second.sessionId,
        ctype: second.ctype,
        level: second.level,
        map: second.map,
        serverRegion: second.serverRegion,
        serverIdentifier: second.serverIdentifier
      },
      candidate: {
        itemName: ITEM_NAME,
        targetSlot: TARGET_SLOT,
        quantity: QUANTITY,
        unitPrice: EXPECTED_UNIT_PRICE,
        exactCost: EXACT_COST
      },
      acquisition: {
        publicFunction: 'buy_with_gold',
        publicFunctionAvailable: true,
        observedGold: second.gold,
        safetyReserve: MIN_GOLD_RESERVE,
        goldAvailableAfterReserve: second.goldAvailableAfterReserve,
        freeInventorySlots: second.freeSlots,
        existingQuantity: second.existingQuantity,
        vendorReachableNow: true,
        nearestVendorDistance: second.nearestVendorDistance,
        sellDistance: second.sellDistance,
        sellDistanceSource: second.sellDistanceSource,
        sellDistanceBrowserObserved: second.sellDistanceBrowserObserved,
        sourcePinnedSellDistance: SOURCE_PINNED_SELL_DISTANCE,
        officialServerSourceCommit: OFFICIAL_SERVER_SOURCE_COMMIT,
        officialServerBlobSha: OFFICIAL_SERVER_BLOB_SHA
      },
      fingerprints: {
        prestateFingerprintSha256,
        postIntentPrestateFingerprintSha256,
        inventoryFingerprintSha256,
        goldFingerprintSha256,
        vendorFingerprintSha256,
        itemDefinitionFingerprintSha256
      },
      shadowIntent,
      goldBudgetLedgerReservationSatisfied: true,
      goldBudgetReservationAmount: EXACT_COST,
      minimumGoldSafetyReserve: MIN_GOLD_RESERVE,
      inventoryFencePrepared: true,
      goldFencePrepared: true,
      buyActionChannelFencePrepared: true,
      socketBudgetReservationPrepared: true,
      socketPlanBudgetReserved: 100,
      socketServerReserveUntouched: 100,
      oneShotBindingPrepared: true,
      oneShotMaximumUses: 1,
      oneShotPurchaseAuthorityIssued: false,
      durableIntentCreatedShadowOnly: true,
      durableReadback: true,
      journalTerminalArt: 'ABBRUCH',
      sendBoundaryState: 'NICHT_GESENDET',
      reconciliationClassification: 'NOT_APPLIED',
      stableDoubleObservation: true,
      stablePostIntentReobserve: true,
      performanceTrick,
      gameplayWrites: 0,
      publicFunctionCalls: 0,
      rawWriteCalls: 0,
      startCalls: 0,
      disconnectCalls: 0,
      farmerWorkersInstalled: 0,
      authorityIssued: false,
      purchaseAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      sameIntentRetry: false,
      normalRuntimeAllowed: false
    };

    setState({
      status: 'BESTANDEN',
      phase: 'COMPLETE',
      terminal: true,
      blocker: [],
      performanceTrick,
      evidence
    });
    emit('PR20_7_ACQUISITION_SHADOW_NO_WRITE_PASSED', 'INFO', {
      prestateFingerprintSha256
    });
  }

  installTelemetryFacade();
  globalThis.V5PR207WeaponOffhandAcquisitionShadow = Object.freeze({
    version: VERSION,
    testId: TEST_ID,
    status: () => state,
    start: () => run()
  });

  Promise.resolve().then(run).catch(error => {
    const message = text(error?.message || error || 'PR20_7_ACQUISITION_SHADOW_FEHLER', 240);
    setState({
      status: 'FEHLER',
      phase: state.phase || 'UNKNOWN',
      terminal: true,
      error: message,
      blocker: [message]
    });
    emit('PR20_7_ACQUISITION_SHADOW_NO_WRITE_ERROR', 'ERROR', { reason: message });
  });
})();
