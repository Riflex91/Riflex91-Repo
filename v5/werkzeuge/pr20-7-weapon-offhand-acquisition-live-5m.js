(() => {
  "use strict";

  const VERSION = "1.0.0";
  const TEST_ID = "pr20-7-gear-weapon-offhand-acquisition-live-5m";
  const ITEM_NAME = "wshield";
  const TARGET_SLOT = "offhand";
  const QUANTITY = 1;
  const EXACT_COST = 4800;
  const MIN_GOLD_RESERVE = 1000;
  const VENDOR_ID = "basics";
  const EXPECTED_VENDOR_NAME = "Gabriel";
  const EXPECTED_SERVER_REGION = "EU";
  const EXPECTED_SERVER_IDENTIFIER = "I";
  const SOURCE_PINNED_SELL_DISTANCE = 400;
  const OFFICIAL_SERVER_SOURCE_COMMIT = "90052162eb3ebda36c893e1eb4af643913c8f984";
  const OFFICIAL_SERVER_BLOB_SHA = "40d0aeda16b9a4320441e833020fe1b4db496e2c";
  const DOUBLE_OBSERVE_DELAY_MS = 350;
  const RECONCILE_ATTEMPTS = 8;
  const RECONCILE_DELAY_MS = 250;
  const SOAK_SAMPLES = 60;
  const SOAK_INTERVAL_MS = 5000;
  const FENCE_TTL_MS = 10000;
  const INTENT_PREFIX = "v5:" + TEST_ID + ":intent:";
  const FENCE_PREFIX = "v5:" + TEST_ID + ":fence:";

  const events = [];
  let seq = 0;
  let state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    status: "BOOT",
    phase: "BOOT",
    startedAtMs: Date.now(),
    updatedAtMs: Date.now(),
    terminal: false,
    blocker: [],
    evidence: null,
    intents: [],
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    sameIntentRetry: false,
    startCalls: 0,
    disconnectCalls: 0,
    farmerWorkersInstalled: 0,
    normalRuntimeAllowed: false,
    authority: {
      authorityIssued: false,
      authorityConsumed: false,
      purchaseAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      purchaseWriteRatification: false,
      maximumUses: 1
    },
    supabase: {
      transport: "WINDOWS_BRIDGE_5S_LOCAL_OBSERVE_60S_AGGREGATE_PLUS_TERMINAL_PUSH",
      localObservationSeconds: 5,
      statusIntervalSeconds: 60,
      terminalEventImmediate: true
    }
  };

  function txt(value, max = 240) {
    return String(value == null ? "" : value).trim().slice(0, max);
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
            && candidate.G?.classes
            && candidate.G?.npcs
            && candidate.G?.maps) return candidate;
      } catch {}
    }
    throw new Error("PR20_7_ACQUISITION_LIVE_SPIELKONTEXT_FEHLT");
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function canonical(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    return "{" + Object.keys(value).sort()
      .map(key => JSON.stringify(key) + ":" + canonical(value[key]))
      .join(",") + "}";
  }

  async function sha256(value) {
    const r = root();
    const cryptoApi = globalThis.crypto || r.crypto;
    if (!cryptoApi?.subtle?.digest) {
      throw new Error("PR20_7_ACQUISITION_LIVE_WEB_CRYPTO_UNAVAILABLE");
    }
    const bytes = new TextEncoder().encode(String(value));
    const digest = await cryptoApi.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), byte =>
      byte.toString(16).padStart(2, "0")).join("");
  }

  function stableItemMaterial(item) {
    if (!item || typeof item !== "object") return null;
    const out = {};
    for (const key of Object.keys(item).sort().slice(0, 64)) {
      const value = item[key];
      if (value === null
          || typeof value === "string"
          || typeof value === "number"
          || typeof value === "boolean") out[key] = value;
    }
    return canonical(out);
  }

  function serverBinding(r) {
    let parentRoot = null;
    try { if (r.parent && r.parent !== r) parentRoot = r.parent; } catch {}
    const region = [
      r.server_region, r.server?.region,
      parentRoot?.server_region, parentRoot?.server?.region
    ].map(value => txt(value, 32)).find(Boolean) || "";
    const identifier = [
      r.server_identifier, r.server?.id,
      parentRoot?.server_identifier, parentRoot?.server?.id
    ].map(value => txt(value, 32)).find(Boolean) || "";
    return { region, identifier };
  }

  function runtimeConflict(r) {
    try {
      const v3 = r.AIO_V3?.__runtime;
      const status = v3 && typeof v3.status === "function" ? v3.status() : null;
      if (v3 && (v3.timer || status?.running === true)) return "AIO_V3_RUNTIME_ACTIVE";
    } catch { return "AIO_V3_RUNTIME_UNREADABLE"; }
    try {
      const v4 = r.AIO_V4 || r.V4Runtime;
      const status = v4 && typeof v4.status === "function" ? v4.status() : null;
      if (status?.running === true || status?.aktivFreigegeben === true) {
        return "V4_RUNTIME_ACTIVE";
      }
    } catch { return "V4_RUNTIME_UNREADABLE"; }
    return null;
  }

  async function ensurePerformanceTrick() {
    let available = false;
    let called = false;
    let lastError = null;
    for (const candidate of roots()) {
      try {
        if (typeof candidate?.performance_trick !== "function") continue;
        available = true;
        candidate.performance_trick();
        called = true;
        break;
      } catch (error) {
        lastError = txt(error?.message || error, 160);
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
          if (typeof empty.playing === "function" && empty.playing() === true) playing = true;
        } catch {}
      }
      return { audioFound, playing, cplaying };
    };
    let status = inspect();
    if (available && called && !status.playing) {
      for (const candidate of roots()) {
        try {
          if (typeof candidate?.performance_trick === "function") {
            candidate.performance_trick();
            break;
          }
        } catch {}
      }
      await sleep(150);
      status = inspect();
    }
    return {
      available, called, audioFound: status.audioFound, playing: status.playing,
      cplaying: status.cplaying,
      active: available && called && status.audioFound && status.playing,
      verification: "HOWLER_PLAYING_TRUE",
      error: lastError
    };
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
      throw new Error("PR20_7_ACQUISITION_LIVE_SELL_DIST_DRIFT");
    }
    return {
      value: Number.isFinite(observed) ? observed : SOURCE_PINNED_SELL_DISTANCE,
      source: Number.isFinite(observed) ? "LIVE_BROWSER_B" : "OFFICIAL_SERVER_SOURCE_PIN",
      browserObserved: Number.isFinite(observed)
    };
  }

  function buyWithGoldAvailable() {
    for (const candidate of roots()) {
      try { if (typeof candidate?.buy_with_gold === "function") return true; } catch {}
    }
    return false;
  }

  function countItem(items, name) {
    return items.reduce((sum, item) =>
      sum + (item?.name === name ? Math.max(1, Number(item.q || 1)) : 0), 0);
  }

  function observation() {
    const r = root();
    const c = r.character;
    if (txt(c.name, 192) !== "My_Merchant") {
      throw new Error("PR20_7_ACQUISITION_LIVE_RECIPIENT_DRIFT");
    }
    if (txt(c.id, 192) !== "My_Merchant") {
      throw new Error("PR20_7_ACQUISITION_LIVE_SESSION_DRIFT");
    }
    if (txt(c.ctype, 32).toLowerCase() !== "merchant") {
      throw new Error("PR20_7_ACQUISITION_LIVE_MERCHANT_ERFORDERLICH");
    }
    const server = serverBinding(r);
    if (server.region !== EXPECTED_SERVER_REGION
        || server.identifier !== EXPECTED_SERVER_IDENTIFIER) {
      throw new Error("PR20_7_ACQUISITION_LIVE_SERVER_BINDUNG_DRIFT");
    }
    if (c.rip === true || c.dead === true) {
      throw new Error("PR20_7_ACQUISITION_LIVE_CHARACTER_TOT");
    }
    if (c.moving === true) {
      throw new Error("PR20_7_ACQUISITION_LIVE_CHARACTER_BEWEGT_SICH");
    }
    if (c.target !== null && c.target !== undefined && txt(c.target, 192)) {
      throw new Error("PR20_7_ACQUISITION_LIVE_CHARACTER_HAT_ZIEL");
    }
    if (c.q && typeof c.q === "object" && Object.keys(c.q).length) {
      throw new Error("PR20_7_ACQUISITION_LIVE_CHARACTER_QUEUE_AKTIV");
    }
    const conflict = runtimeConflict(r);
    if (conflict) throw new Error("PR20_7_ACQUISITION_LIVE_ALTERNATIVE_RUNTIME_AKTIV:" + conflict);

    let hostile = 0;
    try {
      for (const entity of Object.values(r.entities || {})) {
        if (entity
            && entity.type === "monster"
            && !entity.dead
            && !entity.rip
            && txt(entity.target, 192) === "My_Merchant") hostile += 1;
      }
    } catch {
      throw new Error("PR20_7_ACQUISITION_LIVE_AGGRO_UNLESBAR");
    }
    if (hostile !== 0) {
      throw new Error("PR20_7_ACQUISITION_LIVE_CHARACTER_UNTER_ANGRIFF");
    }

    const def = r.G.items[ITEM_NAME];
    if (!def || txt(def.type, 64) !== "shield") {
      throw new Error("PR20_7_ACQUISITION_LIVE_ITEM_DEFINITION_DRIFT");
    }
    const unitPrice = Number(def.g ?? def.gold);
    if (!Number.isSafeInteger(unitPrice) || unitPrice !== EXACT_COST) {
      throw new Error("PR20_7_ACQUISITION_LIVE_PRICE_DRIFT");
    }
    if (Array.isArray(def.class) && def.class.length
        && !def.class.map(x => txt(x, 32).toLowerCase()).includes("merchant")) {
      throw new Error("PR20_7_ACQUISITION_LIVE_ITEM_CLASS_DRIFT");
    }

    const merchantClass = r.G.classes?.merchant || {};
    const offhandKinds = Object.keys(merchantClass.offhand || {})
      .map(x => txt(x, 64))
      .sort();
    if (!offhandKinds.includes("shield")) {
      throw new Error("PR20_7_ACQUISITION_LIVE_OFFHAND_CLASS_DRIFT");
    }

    const vendor = r.G.npcs[VENDOR_ID];
    if (!vendor
        || txt(vendor.role, 32) !== "merchant"
        || txt(vendor.name, 96) !== EXPECTED_VENDOR_NAME
        || !Array.isArray(vendor.items)
        || !vendor.items.includes(ITEM_NAME)) {
      throw new Error("PR20_7_ACQUISITION_LIVE_VENDOR_DEFINITION_DRIFT");
    }
    if (!buyWithGoldAvailable()) {
      throw new Error("PR20_7_ACQUISITION_LIVE_BUY_WITH_GOLD_FEHLT");
    }

    const currentOffhand = c.slots?.[TARGET_SLOT] || null;
    if (currentOffhand) {
      throw new Error("PR20_7_ACQUISITION_LIVE_OFFHAND_BELEGT");
    }
    const currentMainhand = c.slots?.mainhand || null;
    if (currentMainhand?.name) {
      const mainDef = r.G.items[currentMainhand.name] || {};
      const wtype = txt(mainDef.wtype || currentMainhand.wtype, 64);
      const doublehand = Object.keys(merchantClass.doublehand || {})
        .map(x => txt(x, 64))
        .sort();
      if (doublehand.includes(wtype)) {
        throw new Error("PR20_7_ACQUISITION_LIVE_DOUBLEHAND_MAINHAND");
      }
    }

    const freeSlots = c.items.reduce((sum, item) => sum + (item ? 0 : 1), 0);
    const existingQuantity = countItem(c.items, ITEM_NAME);
    const gold = Number(c.gold);
    if (!Number.isSafeInteger(gold) || gold < MIN_GOLD_RESERVE) {
      throw new Error("PR20_7_ACQUISITION_LIVE_GOLD_UNGUELTIG");
    }

    const sellDistance = sellDistanceEvidence();
    const vendorLocations = Array.isArray(r.G.maps?.[c.map]?.items?.[ITEM_NAME])
      ? r.G.maps[c.map].items[ITEM_NAME]
      : [];
    if (!vendorLocations.length) {
      throw new Error("PR20_7_ACQUISITION_LIVE_VENDOR_POSITION_FEHLT");
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
      throw new Error("PR20_7_ACQUISITION_LIVE_VENDOR_NICHT_ERREICHBAR");
    }

    const inventoryMaterial = canonical(c.items.map((item, index) => [
      index, stableItemMaterial(item)
    ]));
    const mainhandMaterial = stableItemMaterial(currentMainhand);
    const vendorMaterial = canonical({
      vendorId: VENDOR_ID,
      vendorName: txt(vendor.name, 96),
      items: [...vendor.items].sort(),
      map: txt(c.map, 96),
      nearestVendorDistance,
      sellDistance: sellDistance.value,
      sellDistanceSource: sellDistance.source
    });
    const itemDefinitionMaterial = canonical({
      itemName: ITEM_NAME,
      type: txt(def.type, 64),
      wtype: txt(def.wtype, 64),
      class: Array.isArray(def.class) ? [...def.class].sort() : [],
      unitPrice
    });

    return {
      characterName: "My_Merchant",
      sessionId: "My_Merchant",
      ctype: "merchant",
      level: Number(c.level || 0),
      map: txt(c.map, 96),
      serverRegion: server.region,
      serverIdentifier: server.identifier,
      gold,
      freeSlots,
      existingQuantity,
      currentMainhandMaterial: mainhandMaterial,
      currentOffhand: null,
      nearestVendorDistance,
      sellDistance: sellDistance.value,
      sellDistanceSource: sellDistance.source,
      sellDistanceBrowserObserved: sellDistance.browserObserved,
      inventoryMaterial,
      vendorMaterial,
      itemDefinitionMaterial
    };
  }

  function stablePreIdentity(o) {
    return canonical({
      characterName: o.characterName,
      sessionId: o.sessionId,
      serverRegion: o.serverRegion,
      serverIdentifier: o.serverIdentifier,
      map: o.map,
      gold: o.gold,
      freeSlots: o.freeSlots,
      existingQuantity: o.existingQuantity,
      currentMainhandMaterial: o.currentMainhandMaterial,
      currentOffhand: o.currentOffhand,
      nearestVendorDistance: o.nearestVendorDistance,
      sellDistance: o.sellDistance,
      sellDistanceSource: o.sellDistanceSource,
      inventoryMaterial: o.inventoryMaterial,
      vendorMaterial: o.vendorMaterial,
      itemDefinitionMaterial: o.itemDefinitionMaterial
    });
  }

  function classify(plan, current) {
    if (current.characterName !== plan.characterName
        || current.sessionId !== plan.sessionId
        || current.serverRegion !== plan.serverRegion
        || current.serverIdentifier !== plan.serverIdentifier
        || current.map !== plan.map
        || current.currentOffhand !== null
        || current.currentMainhandMaterial !== plan.currentMainhandMaterial
        || current.vendorMaterial !== plan.vendorMaterial
        || current.itemDefinitionMaterial !== plan.itemDefinitionMaterial) {
      return {
        status: "UNKNOWN_OPERATOR_REQUIRED",
        settlement: "UNGEKLAERT",
        reason: "RECIPIENT_OR_DEFINITION_DRIFT"
      };
    }

    const goldDelta = current.gold - plan.gold;
    const itemDelta = current.existingQuantity - plan.existingQuantity;
    const inventoryChanged = current.inventoryMaterial !== plan.inventoryMaterial;
    if (goldDelta === -EXACT_COST && itemDelta === QUANTITY && inventoryChanged) {
      return {
        status: "COMMITTED",
        settlement: "BESTAETIGT",
        reason: null,
        goldDelta,
        itemDelta,
        inventoryChanged
      };
    }
    if (goldDelta === 0 && itemDelta === 0 && !inventoryChanged) {
      return {
        status: "NOT_APPLIED",
        settlement: "NICHT_AUSGEFUEHRT",
        reason: null,
        goldDelta,
        itemDelta,
        inventoryChanged
      };
    }
    if (goldDelta === -EXACT_COST || itemDelta === QUANTITY) {
      return {
        status: "PARTIAL_OPERATOR_REQUIRED",
        settlement: "TEILWEISE",
        reason: "NUR_TEILMENGE_DER_BUY_POSTCONDITION",
        goldDelta,
        itemDelta,
        inventoryChanged
      };
    }
    return {
      status: "UNKNOWN_OPERATOR_REQUIRED",
      settlement: "UNGEKLAERT",
      reason: "BUY_DELTA_WIDERSPRUCH",
      goldDelta,
      itemDelta,
      inventoryChanged
    };
  }

  function storage() {
    const r = root();
    const ls = r.localStorage || globalThis.localStorage;
    if (!ls || typeof ls.getItem !== "function" || typeof ls.setItem !== "function") {
      throw new Error("PR20_7_ACQUISITION_LIVE_DURABLE_STORAGE_UNAVAILABLE");
    }
    return ls;
  }

  function writeReadback(key, value) {
    const ls = storage();
    const encoded = JSON.stringify(value);
    ls.setItem(key, encoded);
    const raw = ls.getItem(key);
    if (raw !== encoded) throw new Error("PR20_7_ACQUISITION_LIVE_DURABLE_READBACK_MISMATCH");
    return JSON.parse(raw);
  }

  function existingIntent() {
    const ls = storage();
    for (let i = 0; i < ls.length; i += 1) {
      const key = ls.key(i);
      if (!key || !key.startsWith(INTENT_PREFIX)) continue;
      try {
        const value = JSON.parse(ls.getItem(key));
        if (value?.testId === TEST_ID) return { key, value };
      } catch {}
    }
    return null;
  }

  function acquireFence(resource, owner, epoch, nowMs) {
    const key = FENCE_PREFIX + resource;
    const ls = storage();
    const raw = ls.getItem(key);
    if (raw) {
      try {
        const old = JSON.parse(raw);
        if (Number(old?.expiresAtMs) > nowMs && old?.owner !== owner) {
          throw new Error("PR20_7_ACQUISITION_LIVE_FENCE_BELEGT:" + resource);
        }
      } catch (error) {
        if (String(error?.message || error).startsWith("PR20_7_ACQUISITION_LIVE_FENCE_BELEGT")) {
          throw error;
        }
      }
    }
    const record = {
      schemaVersion: 1, testId: TEST_ID, resource, owner, epoch,
      acquiredAtMs: nowMs, expiresAtMs: nowMs + FENCE_TTL_MS
    };
    writeReadback(key, record);
    return { key, record };
  }

  function releaseFence(fence) {
    try {
      const ls = storage();
      const raw = ls.getItem(fence.key);
      if (!raw) return;
      const current = JSON.parse(raw);
      if (current?.owner === fence.record.owner
          && current?.epoch === fence.record.epoch) ls.removeItem(fence.key);
    } catch {}
  }

  function emit(type, severity, data = {}) {
    seq += 1;
    events.push({
      seq, ts: new Date().toISOString(), event: type, type, severity,
      reason: data.reason || null,
      component: "v5-pr20-7-weapon-offhand-acquisition-live-5m",
      data
    });
    if (events.length > 128) events.splice(0, events.length - 128);
  }

  function setState(patch) {
    state = {
      ...state,
      ...patch,
      updatedAtMs: Date.now(),
      sameIntentRetry: false,
      rawWriteCalls: 0,
      startCalls: 0,
      disconnectCalls: 0,
      farmerWorkersInstalled: 0,
      normalRuntimeAllowed: false
    };
    return state;
  }

  function installTelemetryFacade() {
    const r = root();
    r.AIO_V3 = r.AIO_V3 || {};
    const existing = r.AIO_V3.operations && typeof r.AIO_V3.operations === "object"
      ? r.AIO_V3.operations : null;
    const oldStatus = existing && typeof existing.status === "function"
      ? existing.status.bind(existing) : null;
    const oldHeartbeat = existing && typeof existing.hostHeartbeat === "function"
      ? existing.hostHeartbeat.bind(existing) : null;
    r.AIO_V3.operations = {
      ...(existing || {}),
      __v5Pr207AcquisitionLiveVersion: VERSION,
      status: () => {
        let base = {};
        try {
          const value = oldStatus ? oldStatus() : null;
          if (value && typeof value === "object") base = value;
        } catch {}
        return {
          ...base,
          schemaVersion: Number(base.schemaVersion) || 1,
          mode: "V5_AUTONOMOUS_TEST",
          v5AutonomousTest: state,
          telemetry: { queued: events.length, lastCapturedSeq: seq, dropped: 0 }
        };
      },
      hostHeartbeat: () => {
        try {
          const value = oldHeartbeat ? oldHeartbeat() : null;
          if (value && typeof value === "object") {
            return {
              ...value,
              v5Mode: "V5_AUTONOMOUS_TEST",
              v5TestId: TEST_ID,
              v5ObservedAtMs: Date.now()
            };
          }
        } catch {}
        return {
          schemaVersion: 1,
          v5Mode: "V5_AUTONOMOUS_TEST",
          v5TestId: TEST_ID,
          v5ObservedAtMs: Date.now()
        };
      },
      reconciliationStatus: () => ({
        schemaVersion: 1,
        status: state.terminal ? "TERMINAL_ONE_SHOT" : "ONE_SHOT_IN_PROGRESS",
        v5AutonomousTestStatus: state.status,
        v5Terminal: state.terminal === true,
        sameIntentRetry: false
      }),
      peekTelemetry: (limit = 2000) =>
        events.slice(-Math.max(1, Math.min(2000, Number(limit) || 2000)))
    };
  }

  function planFromIntent(old) {
    return {
      characterName: txt(old?.recipient?.characterName, 192),
      sessionId: txt(old?.recipient?.sessionId, 192),
      serverRegion: txt(old?.recipient?.serverRegion, 32),
      serverIdentifier: txt(old?.recipient?.serverIdentifier, 32),
      map: txt(old?.map, 96),
      gold: Number(old?.prestate?.gold),
      existingQuantity: Number(old?.prestate?.existingQuantity),
      inventoryMaterial: old?.prestate?.inventoryMaterial || null,
      currentMainhandMaterial: old?.prestate?.currentMainhandMaterial ?? null,
      vendorMaterial: old?.prestate?.vendorMaterial || null,
      itemDefinitionMaterial: old?.prestate?.itemDefinitionMaterial || null
    };
  }

  function validRecoveryPlan(plan) {
    return plan.characterName === "My_Merchant"
      && plan.sessionId === "My_Merchant"
      && plan.serverRegion === "EU"
      && plan.serverIdentifier === "I"
      && !!plan.map
      && Number.isSafeInteger(plan.gold)
      && Number.isSafeInteger(plan.existingQuantity)
      && !!plan.inventoryMaterial
      && !!plan.vendorMaterial
      && !!plan.itemDefinitionMaterial;
  }

  async function runSoak(plan, phase, oldIntent, performanceTrick) {
    setState({
      status: "SOAK",
      phase,
      terminal: false,
      blocker: [],
      performanceTrick,
      intents: oldIntent ? [oldIntent] : state.intents
    });
    const startedAtMs = Date.now();
    let samples = 0;
    for (let i = 0; i < SOAK_SAMPLES; i += 1) {
      await sleep(SOAK_INTERVAL_MS);
      const sample = observation();
      const classified = classify(plan, sample);
      if (classified.status !== "COMMITTED") {
        setState({
          status: "BLOCKIERT",
          phase,
          terminal: true,
          blocker: ["PR20_7_ACQUISITION_LIVE_SOAK_STATE_DRIFT"],
          evidence: {
            schemaVersion: 1,
            evidenceArt: "V5_PR20_7_WSHIELD_ACQUISITION_LIVE_5M",
            status: "NICHT_BESTANDEN",
            reconciliation: classified,
            samples,
            gameplayWrites: state.gameplayWrites,
            publicFunctionCalls: state.publicFunctionCalls,
            rawWriteCalls: 0,
            sameIntentRetry: false,
            normalRuntimeAllowed: false
          }
        });
        return null;
      }
      samples += 1;
    }
    const durationMs = Date.now() - startedAtMs;
    if (durationMs < SOAK_SAMPLES * SOAK_INTERVAL_MS - 1000) {
      throw new Error("PR20_7_ACQUISITION_LIVE_SOAK_DAUER_ZU_KURZ");
    }
    return { status: "BESTANDEN", samples, durationMs, minimumSamples: SOAK_SAMPLES };
  }

  async function run() {
    installTelemetryFacade();
    emit("PR20_7_ACQUISITION_LIVE_STARTED", "INFO");

    const performanceTrick = await ensurePerformanceTrick();
    if (!performanceTrick.active) {
      setState({
        status: "BLOCKIERT",
        phase: "BACKGROUND_EXECUTION",
        terminal: true,
        blocker: ["PR20_7_ACQUISITION_LIVE_PERFORMANCE_TRICK_NICHT_AKTIV"],
        performanceTrick,
        gameplayWrites: 0,
        publicFunctionCalls: 0
      });
      return;
    }

    const oldIntent = existingIntent();
    if (oldIntent) {
      const old = oldIntent.value;
      const plan = planFromIntent(old);
      if (!validRecoveryPlan(plan)) {
        setState({
          status: "BLOCKIERT",
          phase: "RESTART_RECONCILIATION",
          terminal: true,
          blocker: ["PR20_7_ACQUISITION_LIVE_EXISTING_INTENT_UNVOLLSTAENDIG"],
          intents: [old],
          performanceTrick,
          gameplayWrites: Number(old?.gameplayWrites) || 0,
          publicFunctionCalls: Number(old?.publicFunctionCalls) || 0
        });
        return;
      }
      const current = observation();
      const recovered = classify(plan, current);
      if (old?.possibleSend !== true || recovered.status !== "COMMITTED") {
        setState({
          status: "BLOCKIERT",
          phase: "RESTART_RECONCILIATION",
          terminal: true,
          blocker: ["PR20_7_ACQUISITION_LIVE_RESTART_" + recovered.status],
          intents: [{ ...old, restartReconciliation: recovered, resendAttempted: false }],
          performanceTrick,
          gameplayWrites: Number(old?.gameplayWrites) || 0,
          publicFunctionCalls: Number(old?.publicFunctionCalls) || 0,
          evidence: {
            schemaVersion: 1,
            evidenceArt: "V5_PR20_7_WSHIELD_ACQUISITION_RESTART_RECONCILIATION",
            status: "NICHT_BESTANDEN",
            reconciliation: recovered,
            sameIntentRetry: false,
            resendAttempted: false,
            normalRuntimeAllowed: false
          },
          authority: {
            ...state.authority,
            authorityIssued: false,
            authorityConsumed: old?.possibleSend === true,
            purchaseAuthority: false,
            gameplayAuthority: false,
            purchaseWriteRatification: true
          }
        });
        return;
      }

      if (old?.completionStatus === "BESTANDEN"
          && old?.completionEvidence?.soak?.status === "BESTANDEN"
          && Number(old?.completionEvidence?.soak?.samples) >= SOAK_SAMPLES
          && Number(old?.completionEvidence?.soak?.durationMs)
            >= SOAK_SAMPLES * SOAK_INTERVAL_MS - 1000) {
        setState({
          status: "BESTANDEN",
          phase: "COMPLETE",
          terminal: true,
          blocker: [],
          performanceTrick,
          intents: [{ ...old, restartReconciliation: recovered, resendAttempted: false }],
          gameplayWrites: Number(old?.gameplayWrites) || 1,
          publicFunctionCalls: Number(old?.publicFunctionCalls) || 1,
          evidence: {
            ...old.completionEvidence,
            restartRecovered: true,
            resendAttempted: false,
            sameIntentRetry: false
          },
          authority: {
            ...state.authority,
            authorityIssued: false,
            authorityConsumed: true,
            purchaseAuthority: false,
            gameplayAuthority: false,
            purchaseWriteRatification: true
          }
        });
        return;
      }

      setState({
        gameplayWrites: Number(old?.gameplayWrites) || 1,
        publicFunctionCalls: Number(old?.publicFunctionCalls) || 1,
        authority: {
          ...state.authority,
          authorityIssued: false,
          authorityConsumed: true,
          purchaseAuthority: false,
          gameplayAuthority: false,
          purchaseWriteRatification: true
        }
      });
      const soak = await runSoak(
        plan,
        "RESTART_FIVE_MINUTE_SOAK",
        { ...old, restartReconciliation: recovered, resendAttempted: false },
        performanceTrick
      );
      if (!soak) return;
      const evidence = {
        schemaVersion: 1,
        evidenceArt: "V5_PR20_7_WSHIELD_ACQUISITION_LIVE_5M",
        status: "BESTANDEN",
        observedAtMs: Date.now(),
        restartRecovered: true,
        resendAttempted: false,
        reconciliation: "COMMITTED",
        settlement: "BESTAETIGT",
        durableIntentReadback: true,
        sendBoundaryState: "MOEGLICH_GESENDET",
        sameIntentRetry: false,
        gameplayWrites: Number(old?.gameplayWrites) || 1,
        publicFunctionCalls: Number(old?.publicFunctionCalls) || 1,
        rawWriteCalls: 0,
        startCalls: 0,
        disconnectCalls: 0,
        farmerWorkersInstalled: 0,
        soak,
        normalRuntimeAllowed: false
      };
      const completedIntent = {
        ...old,
        terminal: true,
        completionStatus: "BESTANDEN",
        completionEvidence: evidence,
        restartReconciliation: recovered,
        resendAttempted: false,
        sameIntentRetry: false
      };
      writeReadback(oldIntent.key, completedIntent);
      setState({
        status: "BESTANDEN",
        phase: "COMPLETE",
        terminal: true,
        blocker: [],
        performanceTrick,
        evidence,
        intents: [completedIntent],
        gameplayWrites: evidence.gameplayWrites,
        publicFunctionCalls: evidence.publicFunctionCalls
      });
      return;
    }

    const first = observation();
    if (first.existingQuantity !== 0) {
      throw new Error("PR20_7_ACQUISITION_LIVE_WSHIELD_BEREITS_VORHANDEN");
    }
    if (first.freeSlots < 1) {
      throw new Error("PR20_7_ACQUISITION_LIVE_INVENTAR_VOLL");
    }
    if (first.gold < EXACT_COST + MIN_GOLD_RESERVE) {
      throw new Error("PR20_7_ACQUISITION_LIVE_GOLD_BUDGET_NICHT_VERFUEGBAR");
    }
    const firstIdentity = stablePreIdentity(first);
    await sleep(DOUBLE_OBSERVE_DELAY_MS);
    const second = observation();
    if (second.existingQuantity !== 0
        || second.freeSlots < 1
        || second.gold < EXACT_COST + MIN_GOLD_RESERVE
        || stablePreIdentity(second) !== firstIdentity) {
      throw new Error("PR20_7_ACQUISITION_LIVE_PREFLIGHT_SNAPSHOT_DRIFT");
    }

    const prestateFingerprintSha256 = await sha256(firstIdentity);
    const plan = {
      characterName: second.characterName,
      sessionId: second.sessionId,
      serverRegion: second.serverRegion,
      serverIdentifier: second.serverIdentifier,
      map: second.map,
      gold: second.gold,
      freeSlots: second.freeSlots,
      existingQuantity: second.existingQuantity,
      inventoryMaterial: second.inventoryMaterial,
      currentMainhandMaterial: second.currentMainhandMaterial,
      vendorMaterial: second.vendorMaterial,
      itemDefinitionMaterial: second.itemDefinitionMaterial,
      nearestVendorDistance: second.nearestVendorDistance,
      sellDistance: second.sellDistance
    };

    const runId = TEST_ID + ":" + Date.now();
    const epochBase = Date.now();
    const fences = [];
    try {
      fences.push(acquireFence(
        "character:My_Merchant:gold", runId, epochBase, Date.now()));
      fences.push(acquireFence(
        "character:My_Merchant:inventory", runId, epochBase + 1, Date.now()));
      fences.push(acquireFence(
        "character:My_Merchant:action_channel:buy", runId, epochBase + 2, Date.now()));
      fences.push(acquireFence(
        "character:My_Merchant:socket_call_budget", runId, epochBase + 3, Date.now()));

      const intentKey = INTENT_PREFIX + prestateFingerprintSha256;
      const intent = {
        schemaVersion: 1,
        testId: TEST_ID,
        version: VERSION,
        runId,
        transaktionsId: "PR20.7-WSHIELD-BUY-" + Date.now(),
        createdAtMs: Date.now(),
        recipient: {
          characterName: plan.characterName,
          sessionId: plan.sessionId,
          serverRegion: plan.serverRegion,
          serverIdentifier: plan.serverIdentifier
        },
        map: plan.map,
        itemName: ITEM_NAME,
        targetSlot: TARGET_SLOT,
        quantity: QUANTITY,
        exactCost: EXACT_COST,
        minimumGoldSafetyReserve: MIN_GOLD_RESERVE,
        prestate: {
          gold: plan.gold,
          freeSlots: plan.freeSlots,
          existingQuantity: plan.existingQuantity,
          inventoryMaterial: plan.inventoryMaterial,
          currentMainhandMaterial: plan.currentMainhandMaterial,
          vendorMaterial: plan.vendorMaterial,
          itemDefinitionMaterial: plan.itemDefinitionMaterial
        },
        prestateFingerprintSha256,
        actionContractId: "AL-ACTION-BUY-WITH-GOLD",
        recoveryContractId: "AL-RECOVERY-BUY-WITH-GOLD",
        verifierId: "AL-VERIFIER-BUY-WITH-GOLD",
        resourceClaims: fences.map(fence => ({
          resource: fence.record.resource,
          epoch: fence.record.epoch
        })),
        goldBudgetLedger: {
          observedGold: plan.gold,
          safetyReserve: MIN_GOLD_RESERVE,
          reservationAmount: EXACT_COST,
          reservationSatisfied: true,
          availableAfterReserveAndReservation:
            plan.gold - MIN_GOLD_RESERVE - EXACT_COST
        },
        socketBudget: {
          resource: "character:My_Merchant:socket_call_budget",
          planBudgetReserved: 100,
          serverLimit: 200,
          serverReserveUntouched: 100
        },
        oneShot: {
          maximumUses: 1,
          purchaseAuthorityIssued: true,
          consumed: false
        },
        sendBoundaryState: "NICHT_GESENDET",
        possibleSend: false,
        gameplayWrites: 0,
        publicFunctionCalls: 0,
        sameIntentRetry: false,
        terminal: false
      };
      writeReadback(intentKey, intent);

      const beforeSend = observation();
      if (stablePreIdentity(beforeSend) !== firstIdentity
          || beforeSend.existingQuantity !== 0
          || beforeSend.gold !== plan.gold) {
        throw new Error("PR20_7_ACQUISITION_LIVE_PRE_SEND_DRIFT");
      }

      const sendIntent = {
        ...intent,
        sendBoundaryState: "MOEGLICH_GESENDET",
        possibleSend: true,
        sendStartedAtMs: Date.now(),
        oneShot: { ...intent.oneShot, consumed: true }
      };
      writeReadback(intentKey, sendIntent);

      setState({
        status: "RUNNING",
        phase: "ONE_SHOT_SEND",
        terminal: false,
        blocker: [],
        performanceTrick,
        intents: [sendIntent],
        authority: {
          authorityIssued: true,
          authorityConsumed: false,
          purchaseAuthority: true,
          gameplayAuthority: true,
          rawWriteAuthority: false,
          purchaseWriteRatification: true,
          maximumUses: 1,
          scope: {
            characterName: plan.characterName,
            sessionId: plan.sessionId,
            itemName: ITEM_NAME,
            quantity: QUANTITY,
            exactCost: EXACT_COST,
            prestateFingerprintSha256
          }
        }
      });

      const r = root();
      if (typeof r.buy_with_gold !== "function") {
        throw new Error("PR20_7_ACQUISITION_LIVE_BUY_WITH_GOLD_UNAVAILABLE");
      }

      let callResult = null;
      let callError = null;
      setState({
        gameplayWrites: 1,
        publicFunctionCalls: 1,
        authority: {
          ...state.authority,
          authorityConsumed: true,
          purchaseAuthority: false,
          gameplayAuthority: false
        }
      });
      try {
        callResult = await Promise.resolve(r.buy_with_gold(ITEM_NAME, QUANTITY));
      } catch (error) {
        callError = txt(error?.message || error, 240);
      }

      let reconciliation = null;
      let settledObservation = null;
      for (let attempt = 0; attempt < RECONCILE_ATTEMPTS; attempt += 1) {
        await sleep(RECONCILE_DELAY_MS);
        const current = observation();
        const classified = classify(plan, current);
        reconciliation = classified;
        settledObservation = current;
        if (classified.status === "COMMITTED"
            || classified.status === "PARTIAL_OPERATOR_REQUIRED") break;
      }

      for (const fence of [...fences].reverse()) releaseFence(fence);

      const terminalIntent = {
        ...sendIntent,
        gameplayWrites: 1,
        publicFunctionCalls: 1,
        callResult: callResult == null ? null : txt(
          typeof callResult === "string" ? callResult : JSON.stringify(callResult), 240),
        callError,
        reconciliation,
        terminal: true,
        terminalAtMs: Date.now()
      };
      writeReadback(intentKey, terminalIntent);

      if (!reconciliation || reconciliation.status !== "COMMITTED") {
        setState({
          status: "BLOCKIERT",
          phase: "RECONCILIATION",
          terminal: true,
          blocker: [
            "PR20_7_ACQUISITION_LIVE_"
            + (reconciliation?.status || "RECONCILIATION_FEHLT")
          ],
          intents: [terminalIntent],
          evidence: {
            schemaVersion: 1,
            evidenceArt: "V5_PR20_7_WSHIELD_ACQUISITION_LIVE_ONE_SHOT",
            status: "NICHT_BESTANDEN",
            reconciliation,
            prestateFingerprintSha256,
            gameplayWrites: 1,
            publicFunctionCalls: 1,
            rawWriteCalls: 0,
            sameIntentRetry: false,
            normalRuntimeAllowed: false
          }
        });
        return;
      }

      setState({
        gameplayWrites: 1,
        publicFunctionCalls: 1,
        intents: [terminalIntent]
      });
      const soak = await runSoak(
        plan,
        "FIVE_MINUTE_SOAK",
        terminalIntent,
        performanceTrick
      );
      if (!soak) return;

      const postInventoryFingerprintSha256 =
        await sha256(settledObservation.inventoryMaterial);
      const evidence = {
        schemaVersion: 1,
        evidenceArt: "V5_PR20_7_WSHIELD_ACQUISITION_LIVE_5M",
        status: "BESTANDEN",
        observedAtMs: Date.now(),
        recipient: {
          characterName: plan.characterName,
          ctype: "merchant",
          serverRegion: plan.serverRegion,
          serverIdentifier: plan.serverIdentifier,
          sessionBindingSha256: await sha256(plan.sessionId)
        },
        candidate: {
          itemName: ITEM_NAME,
          targetSlot: TARGET_SLOT,
          quantity: QUANTITY,
          exactCost: EXACT_COST,
          vendorId: VENDOR_ID,
          vendorName: EXPECTED_VENDOR_NAME
        },
        prestate: {
          gold: plan.gold,
          existingQuantity: plan.existingQuantity,
          freeSlots: plan.freeSlots,
          prestateFingerprintSha256
        },
        poststate: {
          gold: settledObservation.gold,
          existingQuantity: settledObservation.existingQuantity,
          goldDelta: settledObservation.gold - plan.gold,
          itemQuantityDelta:
            settledObservation.existingQuantity - plan.existingQuantity,
          inventoryFingerprintSha256: postInventoryFingerprintSha256
        },
        goldBudgetLedger: {
          reservationAmount: EXACT_COST,
          minimumGoldSafetyReserve: MIN_GOLD_RESERVE,
          reservationSatisfied: true
        },
        vendorReachability: {
          nearestVendorDistance: plan.nearestVendorDistance,
          sellDistance: plan.sellDistance,
          sourcePinnedSellDistance: SOURCE_PINNED_SELL_DISTANCE,
          officialServerSourceCommit: OFFICIAL_SERVER_SOURCE_COMMIT,
          officialServerBlobSha: OFFICIAL_SERVER_BLOB_SHA
        },
        durableIntentReadback: true,
        sendBoundaryState: "MOEGLICH_GESENDET",
        reconciliation: "COMMITTED",
        settlement: "BESTAETIGT",
        oneShotAuthority: {
          issued: true,
          maximumUses: 1,
          consumed: true,
          exactRecipientSessionBinding: true,
          exactItemQuantityCostBinding: true,
          goldInventoryBuyChannelSocketFenceClaims: true
        },
        performanceTrick,
        gameplayWrites: 1,
        publicFunctionCalls: 1,
        rawWriteCalls: 0,
        sameIntentRetry: false,
        startCalls: 0,
        disconnectCalls: 0,
        farmerWorkersInstalled: 0,
        soak,
        normalRuntimeAllowed: false
      };

      const completedIntent = {
        ...terminalIntent,
        completionStatus: "BESTANDEN",
        completionEvidence: evidence,
        soak,
        sameIntentRetry: false
      };
      writeReadback(intentKey, completedIntent);
      setState({
        status: "BESTANDEN",
        phase: "COMPLETE",
        terminal: true,
        blocker: [],
        evidence,
        intents: [completedIntent],
        gameplayWrites: 1,
        publicFunctionCalls: 1,
        authority: {
          ...state.authority,
          authorityConsumed: true,
          purchaseAuthority: false,
          gameplayAuthority: false
        }
      });
      emit("PR20_7_ACQUISITION_LIVE_PASSED", "INFO", {
        itemName: ITEM_NAME,
        goldDelta: -EXACT_COST,
        itemDelta: QUANTITY,
        samples: soak.samples,
        soakDurationMs: soak.durationMs
      });
    } catch (error) {
      for (const fence of [...fences].reverse()) releaseFence(fence);
      throw error;
    }
  }

  installTelemetryFacade();
  globalThis.V5PR207WeaponOffhandAcquisitionLiveTest = Object.freeze({
    version: VERSION,
    testId: TEST_ID,
    status: () => state,
    start: () => run()
  });

  Promise.resolve().then(run).catch(error => {
    const message = txt(error?.message || error, 240);
    setState({
      status: "BLOCKIERT",
      phase: state.phase === "BOOT" ? "ERROR" : state.phase,
      terminal: true,
      blocker: [message],
      authority: {
        ...state.authority,
        purchaseAuthority: false,
        gameplayAuthority: false
      }
    });
    emit("PR20_7_ACQUISITION_LIVE_ERROR", "ERROR", { reason: message });
  });
})();
