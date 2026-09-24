(() => {
  "use strict";

  const VERSION = "1.0.3";
  const TEST_ID = "pr20-8-upgrade-productive-one-write-live";
  const API_NAME = "V5PR208UpgradeProductiveOneWriteLive";

  function reusableIncumbentState(value) {
    if (!value || typeof value !== "object") return false;
    if (value.terminal !== true) return true;
    const durableOrSent = Number(value.gameplayWrites) > 0
      || Number(value.publicFunctionCalls) > 0
      || value.authority?.durableIntentCreated === true
      || (Array.isArray(value.intents) && value.intents.length > 0);
    if (durableOrSent) return true;
    return value.status !== "FEHLER";
  }

  function incumbentSameVersionApi() {
    const hosts = [globalThis];
    try {
      if (globalThis.parent
          && globalThis.parent !== globalThis
          && !hosts.includes(globalThis.parent)) hosts.push(globalThis.parent);
    } catch {}
    for (const host of hosts) {
      try {
        const api = host?.[API_NAME];
        if (api?.testId === TEST_ID
            && api?.version === VERSION
            && typeof api.status === "function"
            && typeof api.start === "function"
            && reusableIncumbentState(api.status())) return api;
      } catch {}
    }
    return null;
  }

  const INCUMBENT_SAME_VERSION_API = incumbentSameVersionApi();
  if (INCUMBENT_SAME_VERSION_API) {
    try { globalThis[API_NAME] = INCUMBENT_SAME_VERSION_API; } catch {}
    return;
  }

  function priorSameTestApi() {
    const hosts = [globalThis];
    try {
      if (globalThis.parent
          && globalThis.parent !== globalThis
          && !hosts.includes(globalThis.parent)) hosts.push(globalThis.parent);
    } catch {}
    for (const host of hosts) {
      try {
        const api = host?.[API_NAME];
        if (api?.testId === TEST_ID
            && typeof api.status === "function"
            && typeof api.start === "function") return api;
      } catch {}
    }
    return null;
  }

  const PRIOR_SAME_TEST_API = priorSameTestApi();
  const EXPECTED_CHARACTER = "My_Merchant";
  const EXPECTED_CLASS = "merchant";
  const EXPECTED_SERVER_REGION = "EU";
  const EXPECTED_SERVER_IDENTIFIER = "I";
  const ITEM_NAME = "gloves";
  const ITEM_LEVEL = 0;
  const ITEM_BASE_GOLD = 3400;
  const SCROLL_NAME = "scroll0";
  const SCROLL_TYPE = "uscroll";
  const SCROLL_GRADE = 0;
  const SCROLL_BASE_GOLD = 1000;
  const SCROLL_CONSUME_QUANTITY = 1;
  const SOURCE_SNAPSHOT_COMMIT = "ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4";
  const RATIFIED_SHADOW_EVIDENCE_BATCH = 8244;
  const SOURCE_PINNED_SELL_DISTANCE = 400;
  const SERVICE_REACHABILITY_SAFETY_MAX = 300;
  const DOUBLE_OBSERVE_DELAY_MS = 350;
  const AUTHORITY_TTL_MS = 1500;
  const FENCE_TTL_MS = 60000;
  const RECONCILE_ATTEMPTS = 160;
  const RECONCILE_DELAY_MS = 250;
  const PUBLIC_FUNCTION_PROMISE_TIMEOUT_MS = 2000;
  const RUNTIME_LEASE_KEY = "__V5PR208UpgradeProductiveOneWriteLiveLease";
  const RUNTIME_LEASE_STALE_NO_INTENT_MS = 120000;
  const INTENT_PREFIX = "v5:" + TEST_ID + ":intent:";
  const AUTHORITY_PREFIX = "v5:" + TEST_ID + ":authority:";
  const FENCE_PREFIX = "v5:" + TEST_ID + ":fence:";
  const RESOURCE_CLAIMS = Object.freeze([
    "character:My_Merchant:inventory",
    "character:My_Merchant:q",
    "character:My_Merchant:socket_call_budget",
    "character:My_Merchant:action_channel:upgrade"
  ]);

  const events = [];
  let seq = 0;
  let recoveryTimer = null;
  let runPromise = null;
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
    startCalls: 0,
    disconnectCalls: 0,
    farmerWorkersInstalled: 0,
    sameIntentRetry: false,
    normalRuntimeAllowed: false,
    authority: {
      authorityIssued: false,
      authorityConsumed: false,
      durableIntentCreated: false,
      upgradeAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      normalUpgradeWriteRatification: false,
      maximumUses: 1
    }
  };

  function text(value, max = 240) {
    return String(value == null ? "" : value).trim().slice(0, max);
  }

  function roots() {
    const out = [];
    try { out.push(globalThis); } catch {}
    try {
      if (globalThis.parent
          && globalThis.parent !== globalThis
          && !out.includes(globalThis.parent)) out.push(globalThis.parent);
    } catch {}
    return out;
  }

  function root() {
    for (const candidate of roots()) {
      try {
        if (candidate?.character
            && Array.isArray(candidate.character.items)
            && candidate.G?.items) return candidate;
      } catch {}
    }
    throw new Error("PR20_8_UPGRADE_LIVE_SPIELKONTEXT_FEHLT");
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
      throw new Error("PR20_8_UPGRADE_LIVE_WEB_CRYPTO_UNAVAILABLE");
    }
    const bytes = new TextEncoder().encode(String(value));
    const digest = await cryptoApi.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), byte =>
      byte.toString(16).padStart(2, "0")).join("");
  }

  function createInstanceId() {
    const cryptoApi = globalThis.crypto;
    if (typeof cryptoApi?.randomUUID === "function") {
      return cryptoApi.randomUUID();
    }
    if (typeof cryptoApi?.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      cryptoApi.getRandomValues(bytes);
      return Array.from(bytes, byte =>
        byte.toString(16).padStart(2, "0")).join("");
    }
    throw new Error("PR20_8_UPGRADE_LIVE_INSTANCE_ID_CRYPTO_UNAVAILABLE");
  }

  const INSTANCE_ID = createInstanceId();

  function stableScalarObject(value, maxKeys = 32) {
    const out = {};
    if (!value || typeof value !== "object") return out;
    for (const key of Object.keys(value).sort().slice(0, maxKeys)) {
      const v = value[key];
      if (v === null
          || typeof v === "string"
          || typeof v === "number"
          || typeof v === "boolean") out[key] = v;
    }
    return out;
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

  function itemQuantity(item) {
    if (!item) return 0;
    const q = Number(item.q);
    return Number.isFinite(q) && q > 0 ? Math.trunc(q) : 1;
  }

  function unsafePhysicalItem(item) {
    return item?.l === true
      || item?.locked === true
      || item?.lock === true
      || item?.b === true
      || item?.blocked === true
      || item?.giveaway === true
      || item?.list === true
      || item?.gift != null
      || item?.expires != null
      || item?.acl != null
      || item?.rid != null
      || item?.p != null
      || item?.stat_type != null
      || item?.data != null;
  }

  function unsafeDefinition(def) {
    return !def
      || def.cash === true
      || def.event === true
      || def.quest === true
      || def.exclusive === true;
  }

  function validUpgradeDefinition(def) {
    return !!def
      && def.upgrade !== null
      && typeof def.upgrade === "object"
      && !Array.isArray(def.upgrade);
  }

  function serverBinding(r) {
    let parentRoot = null;
    try { if (r.parent && r.parent !== r) parentRoot = r.parent; } catch {}
    const region = [
      r.server_region, r.server?.region,
      parentRoot?.server_region, parentRoot?.server?.region
    ].map(value => text(value, 32)).find(Boolean) || "";
    const identifier = [
      r.server_identifier, r.server?.id,
      parentRoot?.server_identifier, parentRoot?.server?.id
    ].map(value => text(value, 32)).find(Boolean) || "";
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

  function hostileAggro(r) {
    let hostile = 0;
    for (const entity of Object.values(r.entities || {})) {
      if (entity
          && entity.type === "monster"
          && !entity.dead
          && !entity.rip
          && text(entity.target, 192) === EXPECTED_CHARACTER) hostile += 1;
    }
    return hostile;
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
      available,
      called,
      audioFound: status.audioFound,
      playing: status.playing,
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
      throw new Error("PR20_8_UPGRADE_LIVE_SELL_DIST_DRIFT");
    }
    return {
      value: Number.isFinite(observed) ? observed : SOURCE_PINNED_SELL_DISTANCE,
      source: Number.isFinite(observed)
        ? "LIVE_BROWSER_B"
        : "OFFICIAL_SERVER_SOURCE_PIN",
      browserObserved: Number.isFinite(observed)
    };
  }

  function serviceReachability(r, c) {
    const sellDistance = sellDistanceEvidence();
    if (c.computer === true) {
      return {
        reachable: true,
        viaComputer: true,
        distance: null,
        serverLimit: sellDistance.value,
        safetyLimit: SERVICE_REACHABILITY_SAFETY_MAX,
        sellDistanceSource: sellDistance.source,
        browserObserved: sellDistance.browserObserved
      };
    }
    if (text(c.map, 96) !== "main") {
      throw new Error("PR20_8_UPGRADE_LIVE_SERVICE_MAP_DRIFT");
    }
    const service = r.G?.maps?.main?.ref?.u_mid;
    const sx = Number(Array.isArray(service) ? service[0] : service?.x);
    const sy = Number(Array.isArray(service) ? service[1] : service?.y);
    const px = Number(c.real_x ?? c.x);
    const py = Number(c.real_y ?? c.y);
    if (![sx, sy, px, py].every(Number.isFinite)) {
      throw new Error("PR20_8_UPGRADE_LIVE_SERVICE_POSITION_UNLESBAR");
    }
    const distance = Math.hypot(px - sx, py - sy);
    const conservativeLimit = Math.min(
      sellDistance.value,
      SERVICE_REACHABILITY_SAFETY_MAX
    );
    if (!Number.isFinite(distance) || distance > conservativeLimit) {
      throw new Error("PR20_8_UPGRADE_LIVE_SERVICE_NICHT_ERREICHBAR");
    }
    return {
      reachable: true,
      viaComputer: false,
      distance,
      serverLimit: sellDistance.value,
      safetyLimit: conservativeLimit,
      servicePoint: { map: "main", x: sx, y: sy },
      sellDistanceSource: sellDistance.source,
      browserObserved: sellDistance.browserObserved
    };
  }

  function candidateRows(items, G) {
    const def = G.items?.[ITEM_NAME];
    if (unsafeDefinition(def)
        || !validUpgradeDefinition(def)
        || def.scroll !== true
        || text(def.type, 64) !== "gloves"
        || Number(def.g) !== ITEM_BASE_GOLD) {
      throw new Error("PR20_8_UPGRADE_LIVE_ITEM_DEFINITION_DRIFT");
    }
    const rows = [];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item
          || item.name !== ITEM_NAME
          || Number(item.level || 0) !== ITEM_LEVEL
          || itemQuantity(item) !== 1
          || unsafePhysicalItem(item)) continue;
      rows.push({
        index,
        name: ITEM_NAME,
        level: ITEM_LEVEL,
        quantity: 1,
        baseGold: ITEM_BASE_GOLD,
        material: stableItemMaterial(item)
      });
    }
    return rows.sort((a, b) => a.index - b.index);
  }

  function scrollRows(items, G) {
    const def = G.items?.[SCROLL_NAME];
    if (unsafeDefinition(def)
        || text(def.type, 64) !== SCROLL_TYPE
        || Number(def.grade) !== SCROLL_GRADE
        || Number(def.g) !== SCROLL_BASE_GOLD) {
      throw new Error("PR20_8_UPGRADE_LIVE_SCROLL_DEFINITION_DRIFT");
    }
    const rows = [];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item
          || item.name !== SCROLL_NAME
          || itemQuantity(item) < SCROLL_CONSUME_QUANTITY
          || unsafePhysicalItem(item)) continue;
      rows.push({
        index,
        name: SCROLL_NAME,
        observedQuantity: itemQuantity(item),
        consumeQuantity: SCROLL_CONSUME_QUANTITY,
        material: stableItemMaterial(item)
      });
    }
    return rows.sort((a, b) => a.index - b.index);
  }

  async function strictObservation(performance) {
    const r = root();
    const c = r.character;
    if (text(c.name, 192) !== EXPECTED_CHARACTER) {
      throw new Error("PR20_8_UPGRADE_LIVE_RECIPIENT_DRIFT");
    }
    if (text(c.id, 192) !== EXPECTED_CHARACTER) {
      throw new Error("PR20_8_UPGRADE_LIVE_SESSION_DRIFT");
    }
    if (text(c.ctype, 32).toLowerCase() !== EXPECTED_CLASS) {
      throw new Error("PR20_8_UPGRADE_LIVE_MERCHANT_ERFORDERLICH");
    }
    const server = serverBinding(r);
    if (server.region !== EXPECTED_SERVER_REGION
        || server.identifier !== EXPECTED_SERVER_IDENTIFIER) {
      throw new Error("PR20_8_UPGRADE_LIVE_SERVER_BINDUNG_DRIFT");
    }
    if (c.rip === true || c.dead === true) {
      throw new Error("PR20_8_UPGRADE_LIVE_CHARACTER_TOT");
    }
    if (c.moving === true) {
      throw new Error("PR20_8_UPGRADE_LIVE_CHARACTER_BEWEGT_SICH");
    }
    if (c.target !== null && c.target !== undefined && text(c.target, 192)) {
      throw new Error("PR20_8_UPGRADE_LIVE_CHARACTER_HAT_ZIEL");
    }
    if (c.q && typeof c.q === "object" && Object.keys(c.q).length) {
      throw new Error("PR20_8_UPGRADE_LIVE_Q_NICHT_FREI");
    }
    const conflict = runtimeConflict(r);
    if (conflict) {
      throw new Error("PR20_8_UPGRADE_LIVE_ALTERNATIVE_RUNTIME_AKTIV:" + conflict);
    }
    if (hostileAggro(r) !== 0) {
      throw new Error("PR20_8_UPGRADE_LIVE_CHARACTER_UNTER_ANGRIFF");
    }
    if (!performance?.active) {
      throw new Error("PR20_8_UPGRADE_LIVE_PERFORMANCE_TRICK_NICHT_AKTIV");
    }
    if (typeof globalThis.upgrade !== "function") {
      throw new Error("PR20_8_UPGRADE_LIVE_CODE_WRAPPER_UPGRADE_FEHLT");
    }

    const service = serviceReachability(r, c);
    const candidates = candidateRows(c.items, r.G);
    const scrolls = scrollRows(c.items, r.G);
    if (!candidates.length) {
      throw new Error("PR20_8_UPGRADE_LIVE_KANDIDAT_FEHLT");
    }
    if (!scrolls.length) {
      throw new Error("PR20_8_UPGRADE_LIVE_SCROLL_FEHLT");
    }
    const candidate = candidates[0];
    const scroll = scrolls[0];
    if (candidate.index === scroll.index) {
      throw new Error("PR20_8_UPGRADE_LIVE_INPUT_INDEX_KOLLISION");
    }

    const inventoryMaterial = canonical(c.items.map((item, index) => [
      index, stableItemMaterial(item)
    ]));
    const qMaterial = canonical(c.q || {});
    const upgradeEffectMaterial = canonical({
      massproduction: stableScalarObject(c.s?.massproduction || {}, 32),
      massproductionpp: stableScalarObject(c.s?.massproductionpp || {}, 32),
      upgrace: stableScalarObject(c.p?.ugrace || {}, 32),
      ograce: c.p?.ograce ?? null,
      serverUgrace: stableScalarObject(r.S?.ugrace || {}, 32)
    });
    const itemDefMaterial = canonical({
      name: ITEM_NAME,
      type: text(r.G.items[ITEM_NAME].type, 64),
      upgradeDefinitionKind: typeof r.G.items[ITEM_NAME].upgrade,
      upgradeDefinitionMaterial: canonical(
        stableScalarObject(r.G.items[ITEM_NAME].upgrade, 32)
      ),
      scroll: r.G.items[ITEM_NAME].scroll === true,
      g: Number(r.G.items[ITEM_NAME].g)
    });
    const scrollDefMaterial = canonical({
      name: SCROLL_NAME,
      type: text(r.G.items[SCROLL_NAME].type, 64),
      grade: Number(r.G.items[SCROLL_NAME].grade),
      g: Number(r.G.items[SCROLL_NAME].g)
    });
    const recipient = {
      characterName: EXPECTED_CHARACTER,
      sessionId: EXPECTED_CHARACTER,
      ctype: EXPECTED_CLASS,
      level: Number(c.level || 0),
      map: text(c.map, 96),
      serverRegion: server.region,
      serverIdentifier: server.identifier
    };

    const inventoryFingerprintSha256 = await sha256(inventoryMaterial);
    const qFingerprintSha256 = await sha256(qMaterial);
    const candidateFingerprintSha256 = await sha256(canonical(candidate));
    const scrollFingerprintSha256 = await sha256(canonical(scroll));
    const upgradeEffectsFingerprintSha256 = await sha256(upgradeEffectMaterial);
    const itemDefinitionFingerprintSha256 = await sha256(itemDefMaterial);
    const scrollDefinitionFingerprintSha256 = await sha256(scrollDefMaterial);
    const prestateFingerprintSha256 = await sha256(canonical({
      recipient,
      inventoryFingerprintSha256,
      qFingerprintSha256,
      candidateFingerprintSha256,
      scrollFingerprintSha256,
      upgradeEffectsFingerprintSha256,
      itemDefinitionFingerprintSha256,
      scrollDefinitionFingerprintSha256,
      service
    }));

    return {
      observedAtMs: Date.now(),
      recipient,
      service,
      candidate: {
        ...candidate,
        matchingCandidateCount: candidates.length,
        fingerprintSha256: candidateFingerprintSha256
      },
      scroll: {
        ...scroll,
        matchingScrollCount: scrolls.length,
        fingerprintSha256: scrollFingerprintSha256
      },
      inventoryMaterial,
      qMaterial,
      upgradeEffectMaterial,
      itemDefMaterial,
      scrollDefMaterial,
      fingerprints: {
        prestateFingerprintSha256,
        inventoryFingerprintSha256,
        qFingerprintSha256,
        candidateFingerprintSha256,
        scrollFingerprintSha256,
        upgradeEffectsFingerprintSha256,
        itemDefinitionFingerprintSha256,
        scrollDefinitionFingerprintSha256
      }
    };
  }

  function storage() {
    const r = root();
    const ls = r.localStorage || globalThis.localStorage;
    if (!ls || typeof ls.getItem !== "function" || typeof ls.setItem !== "function") {
      throw new Error("PR20_8_UPGRADE_LIVE_DURABLE_STORAGE_UNAVAILABLE");
    }
    return ls;
  }

  function writeJsonExact(key, value) {
    const encoded = JSON.stringify(value);
    storage().setItem(key, encoded);
    const readback = storage().getItem(key);
    if (readback !== encoded) {
      throw new Error("PR20_8_UPGRADE_LIVE_DURABLE_READBACK_MISMATCH");
    }
    return JSON.parse(readback);
  }

  function readJson(key) {
    const raw = storage().getItem(key);
    if (raw === null) return null;
    try { return JSON.parse(raw); }
    catch { throw new Error("PR20_8_UPGRADE_LIVE_DURABLE_JSON_BESCHAEDIGT"); }
  }

  function findExistingIntent() {
    const ls = storage();
    const found = [];
    for (let i = 0; i < ls.length; i += 1) {
      const key = ls.key(i);
      if (!key || !key.startsWith(INTENT_PREFIX)) continue;
      const value = readJson(key);
      if (value?.testId === TEST_ID) found.push({ key, value });
    }
    if (found.length > 1) {
      throw new Error("PR20_8_UPGRADE_LIVE_MEHRERE_INTENTS");
    }
    return found[0] || null;
  }

  function intentKey(prestateFingerprint) {
    return INTENT_PREFIX + prestateFingerprint;
  }

  function authorityKey(txId) {
    return AUTHORITY_PREFIX + txId;
  }

  function fenceKey(resource) {
    return FENCE_PREFIX + encodeURIComponent(resource);
  }

  function fenceOwner(txId) {
    return txId + ":instance:" + INSTANCE_ID;
  }

  function terminalZeroWriteDuplicateBlockedState(value) {
    return !!value
      && typeof value === "object"
      && value.testId === TEST_ID
      && value.terminal === true
      && value.status === "FEHLER"
      && Number(value.gameplayWrites) === 0
      && Number(value.publicFunctionCalls) === 0
      && Number(value.rawWriteCalls) === 0
      && value.sameIntentRetry === false
      && Array.isArray(value.intents)
      && value.intents.length === 0
      && value.authority?.durableIntentCreated === false
      && value.authority?.authorityIssued === false
      && Array.isArray(value.blocker)
      && value.blocker.length === 1
      && value.blocker[0] === "PR20_8_UPGRADE_LIVE_DUPLIKAT_INSTANZ_AKTIV";
  }

  function persistedMutationGuardStatePresent() {
    const ls = storage();
    for (let i = 0; i < ls.length; i += 1) {
      const key = ls.key(i);
      if (!key) continue;
      if (key.startsWith(INTENT_PREFIX)
          || key.startsWith(AUTHORITY_PREFIX)
          || key.startsWith(FENCE_PREFIX)) return true;
    }
    return false;
  }

  function mutationQueueIdle(r) {
    const q = r.character?.q;
    return !!q
      && typeof q === "object"
      && !Array.isArray(q)
      && Object.keys(q).length === 0;
  }

  function canReclaimStaleRuntimeLease(r, existing) {
    if (!existing
        || existing.schemaVersion !== 1
        || existing.testId !== TEST_ID
        || !existing.instanceId
        || existing.instanceId === INSTANCE_ID) return false;
    const acquiredAtMs = Number(existing.acquiredAtMs);
    if (!Number.isFinite(acquiredAtMs)) return false;
    const ageMs = Date.now() - acquiredAtMs;
    if (!Number.isFinite(ageMs)
        || ageMs < RUNTIME_LEASE_STALE_NO_INTENT_MS) return false;
    let priorState = null;
    try { priorState = PRIOR_SAME_TEST_API?.status?.() || null; } catch {}
    if (!terminalZeroWriteDuplicateBlockedState(priorState)) return false;
    if (persistedMutationGuardStatePresent()) return false;
    if (!mutationQueueIdle(r)) return false;
    return true;
  }

  function reclaimStaleRuntimeLease(r, existing) {
    if (!canReclaimStaleRuntimeLease(r, existing)) return false;
    try { delete r[RUNTIME_LEASE_KEY]; }
    catch { r[RUNTIME_LEASE_KEY] = null; }
    if (r[RUNTIME_LEASE_KEY]?.instanceId) {
      throw new Error("PR20_8_UPGRADE_LIVE_STALE_RUNTIME_LEASE_RECLAIM_FEHLER");
    }
    emit("PR20_8_UPGRADE_LIVE_STALE_RUNTIME_LEASE_RECLAIMED","warning",{
      previousInstanceId: text(existing.instanceId, 160),
      previousControllerVersion: text(existing.controllerVersion, 80) || null,
      ageMs: Date.now() - Number(existing.acquiredAtMs)
    });
    return true;
  }

  function acquireRuntimeLease() {
    const r = root();
    const existing = r[RUNTIME_LEASE_KEY];
    if (existing?.instanceId && existing.instanceId !== INSTANCE_ID) {
      if (!reclaimStaleRuntimeLease(r, existing)) {
        throw new Error("PR20_8_UPGRADE_LIVE_DUPLIKAT_INSTANZ_AKTIV");
      }
    }
    const lease = {
      schemaVersion: 1,
      testId: TEST_ID,
      controllerVersion: VERSION,
      instanceId: INSTANCE_ID,
      acquiredAtMs: Date.now()
    };
    r[RUNTIME_LEASE_KEY] = lease;
    if (r[RUNTIME_LEASE_KEY]?.instanceId !== INSTANCE_ID
        || r[RUNTIME_LEASE_KEY]?.controllerVersion !== VERSION) {
      throw new Error("PR20_8_UPGRADE_LIVE_RUNTIME_LEASE_VERLOREN");
    }
    return lease;
  }

  function assertRuntimeLease() {
    const current = root()[RUNTIME_LEASE_KEY];
    if (current?.instanceId !== INSTANCE_ID
        || current?.testId !== TEST_ID
        || current?.controllerVersion !== VERSION) {
      throw new Error("PR20_8_UPGRADE_LIVE_RUNTIME_LEASE_VERLOREN");
    }
  }

  function releaseRuntimeLease() {
    const r = root();
    if (r[RUNTIME_LEASE_KEY]?.instanceId === INSTANCE_ID) {
      try { delete r[RUNTIME_LEASE_KEY]; }
      catch { r[RUNTIME_LEASE_KEY] = null; }
    }
  }

  function acquireFences(txId) {
    const now = Date.now();
    const owner = fenceOwner(txId);
    const keys = [];
    for (const resource of RESOURCE_CLAIMS) {
      const key = fenceKey(resource);
      const old = readJson(key);
      if (old
          && Number(old.expiresAtMs) > now
          && old.owner !== owner) {
        throw new Error("PR20_8_UPGRADE_LIVE_FENCE_BELEGT:" + resource);
      }
      const record = {
        schemaVersion: 1,
        testId: TEST_ID,
        resource,
        transactionId: txId,
        owner,
        ownerInstanceId: INSTANCE_ID,
        acquiredAtMs: now,
        expiresAtMs: now + FENCE_TTL_MS
      };
      writeJsonExact(key, record);
      keys.push(key);
    }
    for (const resource of RESOURCE_CLAIMS) {
      const current = readJson(fenceKey(resource));
      if (current?.owner !== owner
          || current?.ownerInstanceId !== INSTANCE_ID
          || Number(current.expiresAtMs) <= Date.now()) {
        throw new Error("PR20_8_UPGRADE_LIVE_FENCE_OWNERSHIP_VERLOREN:" + resource);
      }
    }
    return keys;
  }

  function assertFences(txId) {
    const owner = fenceOwner(txId);
    for (const resource of RESOURCE_CLAIMS) {
      const current = readJson(fenceKey(resource));
      if (current?.owner !== owner
          || current?.ownerInstanceId !== INSTANCE_ID
          || Number(current.expiresAtMs) <= Date.now()) {
        throw new Error("PR20_8_UPGRADE_LIVE_FENCE_OWNERSHIP_VERLOREN:" + resource);
      }
    }
  }

  function releaseFences(txId) {
    const ls = storage();
    const owner = fenceOwner(txId);
    for (const resource of RESOURCE_CLAIMS) {
      const key = fenceKey(resource);
      const current = readJson(key);
      if (current?.owner === owner
          && current?.ownerInstanceId === INSTANCE_ID) ls.removeItem(key);
    }
  }

  function createIntent(observation) {
    const pre = observation.fingerprints.prestateFingerprintSha256;
    const txId = TEST_ID + ":" + pre.slice(0, 32);
    const record = {
      schemaVersion: 1,
      testId: TEST_ID,
      version: VERSION,
      art: "PR20_8_UPGRADE_PRODUCTIVE_ONE_WRITE_INTENT",
      transactionId: txId,
      attemptId: txId + ":attempt:1",
      actionContractId: "AL-ACTION-UPGRADE",
      recoveryContractId: "AL-RECOVERY-UPGRADE",
      verifierId: "AL-VERIFIER-UPGRADE",
      publicFunction: "upgrade",
      publicFunctionSignature: "upgrade(item_num, scroll_num, offering_num, only_calculate)",
      sourceSnapshotCommit: SOURCE_SNAPSHOT_COMMIT,
      prerequisiteShadowEvidenceBatchId: RATIFIED_SHADOW_EVIDENCE_BATCH,
      runnerInstanceId: INSTANCE_ID,
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      status: "INTENT_DURABLE",
      terminal: false,
      sendBoundaryState: "NICHT_GESENDET",
      sendCount: 0,
      sameIntentRetry: false,
      resourceClaims: [...RESOURCE_CLAIMS],
      recipient: observation.recipient,
      serviceReachability: observation.service,
      candidate: {
        name: observation.candidate.name,
        level: observation.candidate.level,
        index: observation.candidate.index,
        quantity: observation.candidate.quantity,
        baseGold: observation.candidate.baseGold,
        material: observation.candidate.material,
        fingerprintSha256: observation.candidate.fingerprintSha256
      },
      scroll: {
        name: observation.scroll.name,
        index: observation.scroll.index,
        observedQuantity: observation.scroll.observedQuantity,
        consumeQuantity: observation.scroll.consumeQuantity,
        material: observation.scroll.material,
        fingerprintSha256: observation.scroll.fingerprintSha256
      },
      offering: null,
      onlyCalculate: false,
      fingerprints: { ...observation.fingerprints },
      authority: {
        class: "Pr208UpgradeOneShotAuthority",
        maximumUses: 1,
        maximumTtlMs: AUTHORITY_TTL_MS,
        durableAuthorityWriteRequired: true,
        consumed: false
      },
      outcome: null
    };
    const key = intentKey(pre);
    const existing = readJson(key);
    if (existing) return { key, value: existing, existing: true };
    const persisted = writeJsonExact(key, record);
    if (persisted.runnerInstanceId !== INSTANCE_ID) {
      throw new Error("PR20_8_UPGRADE_LIVE_INTENT_OWNERSHIP_VERLOREN");
    }
    return { key, value: persisted, existing: false };
  }

  function issueAuthority(intent, observation) {
    const now = Date.now();
    const record = {
      schemaVersion: 1,
      testId: TEST_ID,
      transactionId: intent.transactionId,
      authorityClass: "Pr208UpgradeOneShotAuthority",
      actionContractId: "AL-ACTION-UPGRADE",
      recoveryContractId: "AL-RECOVERY-UPGRADE",
      verifierId: "AL-VERIFIER-UPGRADE",
      issuedAtMs: now,
      expiresAtMs: now + AUTHORITY_TTL_MS,
      maximumUses: 1,
      uses: 0,
      consumed: false,
      revoked: false,
      sameIntentRetry: false,
      binding: {
        characterName: observation.recipient.characterName,
        sessionId: observation.recipient.sessionId,
        serverRegion: observation.recipient.serverRegion,
        serverIdentifier: observation.recipient.serverIdentifier,
        prestateFingerprintSha256:
          observation.fingerprints.prestateFingerprintSha256,
        inventoryFingerprintSha256:
          observation.fingerprints.inventoryFingerprintSha256,
        qFingerprintSha256:
          observation.fingerprints.qFingerprintSha256,
        upgradeEffectsFingerprintSha256:
          observation.fingerprints.upgradeEffectsFingerprintSha256,
        runnerInstanceId: INSTANCE_ID,
        candidateFingerprintSha256:
          observation.fingerprints.candidateFingerprintSha256,
        scrollFingerprintSha256:
          observation.fingerprints.scrollFingerprintSha256,
        candidateIndex: observation.candidate.index,
        scrollIndex: observation.scroll.index
      }
    };
    return writeJsonExact(authorityKey(intent.transactionId), record);
  }

  function consumeAuthority(intent, authority, observation) {
    const now = Date.now();
    const b = authority.binding || {};
    const matches = authority.testId === TEST_ID
      && authority.transactionId === intent.transactionId
      && authority.maximumUses === 1
      && authority.uses === 0
      && authority.consumed === false
      && authority.revoked === false
      && now <= Number(authority.expiresAtMs)
      && b.characterName === observation.recipient.characterName
      && b.sessionId === observation.recipient.sessionId
      && b.serverRegion === observation.recipient.serverRegion
      && b.serverIdentifier === observation.recipient.serverIdentifier
      && b.prestateFingerprintSha256
        === observation.fingerprints.prestateFingerprintSha256
      && b.inventoryFingerprintSha256
        === observation.fingerprints.inventoryFingerprintSha256
      && b.qFingerprintSha256
        === observation.fingerprints.qFingerprintSha256
      && b.upgradeEffectsFingerprintSha256
        === observation.fingerprints.upgradeEffectsFingerprintSha256
      && b.runnerInstanceId === INSTANCE_ID
      && b.candidateFingerprintSha256
        === observation.fingerprints.candidateFingerprintSha256
      && b.scrollFingerprintSha256
        === observation.fingerprints.scrollFingerprintSha256
      && b.candidateIndex === observation.candidate.index
      && b.scrollIndex === observation.scroll.index;
    if (!matches) {
      const revoked = { ...authority, revoked: true, revokedAtMs: now };
      writeJsonExact(authorityKey(intent.transactionId), revoked);
      throw new Error("PR20_8_UPGRADE_LIVE_AUTHORITY_BINDING_DRIFT");
    }
    const consumed = {
      ...authority,
      uses: 1,
      consumed: true,
      consumedAtMs: now
    };
    return writeJsonExact(authorityKey(intent.transactionId), consumed);
  }

  function updateIntent(key, current, patch) {
    const next = {
      ...current,
      ...patch,
      updatedAtMs: Date.now()
    };
    return writeJsonExact(key, next);
  }

  function recoverySnapshot(intent) {
    const r = root();
    const c = r.character;
    const server = serverBinding(r);
    if (text(c.name, 192) !== intent.recipient.characterName
        || text(c.id, 192) !== intent.recipient.sessionId
        || server.region !== intent.recipient.serverRegion
        || server.identifier !== intent.recipient.serverIdentifier) {
      return {
        classification: "UNRESOLVED",
        reason: "RECIPIENT_OR_SERVER_DRIFT"
      };
    }

    const target = c.items[intent.candidate.index] || null;
    const scrollSlot = c.items[intent.scroll.index] || null;
    const targetMaterial = stableItemMaterial(target);
    const scrollMaterial = stableItemMaterial(scrollSlot);
    const qActive = !!c.q?.upgrade;
    const candidatePlaceholder = target?.name === "placeholder";
    const placeholderCount = c.items.reduce(
      (sum, item) => sum + (item?.name === "placeholder" ? 1 : 0), 0
    );
    const scrollQuantityNow = scrollSlot?.name === SCROLL_NAME
      ? itemQuantity(scrollSlot)
      : scrollSlot == null
        ? 0
        : -1;
    const expectedScrollQuantity =
      Number(intent.scroll.observedQuantity) - SCROLL_CONSUME_QUANTITY;
    const scrollConsumedExactly = scrollQuantityNow === expectedScrollQuantity;
    const targetSuccess = target?.name === ITEM_NAME
      && Number(target.level || 0) === ITEM_LEVEL + 1;
    const targetDestroyed = target === null;
    const targetUnchanged = targetMaterial === intent.candidate.material;
    const scrollUnchanged = scrollMaterial === intent.scroll.material
      && scrollQuantityNow === intent.scroll.observedQuantity;

    let classification = "UNRESOLVED";
    let reason = "POSTCONDITION_WIDERSPRUCH";
    if (!qActive
        && !candidatePlaceholder
        && targetSuccess
        && scrollConsumedExactly) {
      classification = "COMMITTED_SUCCESS";
      reason = null;
    } else if (!qActive
        && !candidatePlaceholder
        && targetDestroyed
        && scrollConsumedExactly) {
      classification = "COMMITTED_EXPECTED_FAILURE";
      reason = null;
    } else if (!qActive
        && placeholderCount === 0
        && targetUnchanged
        && scrollUnchanged) {
      classification = "NOT_APPLIED";
      reason = null;
    } else if (qActive
        || candidatePlaceholder
        || scrollConsumedExactly) {
      classification = "STILL_PENDING";
      reason = null;
    }

    return {
      classification,
      reason,
      qActive,
      candidatePlaceholder,
      placeholderCount,
      target: target ? {
        name: target.name,
        level: Number(target.level || 0),
        material: targetMaterial
      } : null,
      scrollQuantityBefore: intent.scroll.observedQuantity,
      scrollQuantityNow,
      expectedScrollQuantity,
      scrollConsumedExactly
    };
  }

  async function reconcile(intent) {
    let acceptedEvidenceObserved = false;
    let last = null;
    for (let attempt = 0; attempt < RECONCILE_ATTEMPTS; attempt += 1) {
      last = recoverySnapshot(intent);
      if (last.qActive
          || last.candidatePlaceholder
          || last.scrollConsumedExactly) acceptedEvidenceObserved = true;
      if (last.classification === "COMMITTED_SUCCESS"
          || last.classification === "COMMITTED_EXPECTED_FAILURE"
          || last.classification === "NOT_APPLIED") {
        return { ...last, acceptedEvidenceObserved, attempts: attempt + 1 };
      }
      await sleep(RECONCILE_DELAY_MS);
    }
    return {
      ...(last || { classification: "UNRESOLVED", reason: "NO_OBSERVATION" }),
      acceptedEvidenceObserved,
      attempts: RECONCILE_ATTEMPTS
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
      component: "v5-pr20-8-upgrade-productive-one-write-live",
      data
    });
    if (events.length > 2000) events.splice(0, events.length - 2000);
  }

  function setState(patch) {
    state = {
      ...state,
      ...patch,
      updatedAtMs: Date.now()
    };
    publishTelemetryFacades();
    return state;
  }

  function installTelemetryFacade(owner) {
    if (!owner) return;
    owner.AIO_V3 = owner.AIO_V3 || {};
    const existing = owner.AIO_V3.operations
      && typeof owner.AIO_V3.operations === "object"
      ? owner.AIO_V3.operations
      : {};
    owner.AIO_V3.operations = {
      ...existing,
      status: () => {
        let base = {};
        try {
          base = typeof existing.status === "function"
            ? existing.status() || {}
            : {};
        } catch {}
        return { ...base, v5AutonomousTest: state };
      },
      telemetry: (limit = 2000) =>
        events.slice(-Math.max(1, Math.min(2000, Number(limit) || 2000))),
      peekTelemetry: (limit = 2000) =>
        events.slice(-Math.max(1, Math.min(2000, Number(limit) || 2000)))
    };
  }

  function publishTelemetryFacades() {
    const r = root();
    installTelemetryFacade(r);
    if (globalThis !== r) installTelemetryFacade(globalThis);
    try {
      const host = globalThis.parent;
      if (host && host !== globalThis && host !== r) installTelemetryFacade(host);
    } catch {}
  }

  function terminalEvidence(intent, outcome, extra = {}) {
    return {
      evidenceArt: "V5_PR20_8_UPGRADE_PRODUCTIVE_ONE_WRITE_LIVE",
      status: outcome.classification.startsWith("COMMITTED_")
        ? "BESTANDEN"
        : outcome.classification === "NOT_APPLIED"
          ? "NICHT_BESTANDEN"
          : "UNGEKLAERT",
      sourceSnapshotCommit: SOURCE_SNAPSHOT_COMMIT,
      prerequisiteShadowEvidenceBatchId: RATIFIED_SHADOW_EVIDENCE_BATCH,
      recipient: intent.recipient,
      candidate: intent.candidate,
      scroll: intent.scroll,
      offering: null,
      serviceReachability: intent.serviceReachability,
      publicFunction: "upgrade",
      publicFunctionSignature:
        "upgrade(item_num, scroll_num, offering_num, only_calculate)",
      sendArguments: {
        candidateIndex: intent.candidate.index,
        scrollIndex: intent.scroll.index,
        offeringIndex: null,
        onlyCalculate: false
      },
      durableIntentReadback: true,
      journalStatus: intent.status,
      sendBoundaryState: intent.sendBoundaryState,
      sendCount: intent.sendCount,
      sameIntentRetry: false,
      oneShotAuthorityMaximumUses: 1,
      authorityConsumed: state.authority.authorityConsumed,
      reconciliation: outcome,
      gameplayWrites: state.gameplayWrites,
      publicFunctionCalls: state.publicFunctionCalls,
      rawWriteCalls: state.rawWriteCalls,
      normalRuntimeAllowed: false,
      ...extra
    };
  }

  function settleIntent(existing, outcome) {
    const { key } = existing;
    const current = readJson(key) || existing.value;
    let journalStatus = "RECOVERY_PENDING";
    let terminal = false;
    let runnerStatus = "UNGEKLAERT";
    if (outcome.classification === "COMMITTED_SUCCESS"
        || outcome.classification === "COMMITTED_EXPECTED_FAILURE") {
      journalStatus = "COMMITTED";
      terminal = true;
      runnerStatus = "BESTANDEN";
    } else if (outcome.classification === "NOT_APPLIED") {
      journalStatus = "FAILED_SAFE_NOT_APPLIED";
      terminal = true;
      runnerStatus = "NICHT_BESTANDEN";
    }
    const settled = updateIntent(key, current, {
      status: journalStatus,
      terminal,
      sendBoundaryState: current.sendCount === 1
        ? "SEND_MOEGLICH_ODER_VERSUCHT"
        : "NICHT_GESENDET",
      outcome
    });
    if (terminal) {
      releaseFences(settled.transactionId);
      releaseRuntimeLease();
    }
    const authority = {
      ...state.authority,
      upgradeAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false
    };
    setState({
      status: runnerStatus,
      phase: terminal ? "COMPLETE" : "RECOVERY_PENDING",
      terminal,
      blocker: terminal ? [] : ["PR20_8_UPGRADE_LIVE_RECOVERY_PENDING"],
      evidence: terminalEvidence(settled, outcome),
      intents: [{
        transactionId: settled.transactionId,
        status: settled.status,
        sendCount: settled.sendCount
      }],
      authority
    });
    emit(
      terminal ? "PR20_8_UPGRADE_LIVE_TERMINAL" : "PR20_8_UPGRADE_LIVE_RECOVERY_PENDING",
      terminal ? "info" : "warning",
      { classification: outcome.classification }
    );
    return state;
  }

  async function recoverExisting(existing) {
    const intent = existing.value;
    if (intent.schemaVersion !== 1
        || intent.testId !== TEST_ID
        || intent.sameIntentRetry !== false
        || !Number.isInteger(intent.sendCount)
        || intent.sendCount < 0
        || intent.sendCount > 1) {
      throw new Error("PR20_8_UPGRADE_LIVE_EXISTING_INTENT_UNGUELTIG");
    }
    const persistedAuthority = readJson(authorityKey(intent.transactionId));
    setState({
      phase: "RECOVERY",
      status: "RECOVERY",
      intents: [{
        transactionId: intent.transactionId,
        status: intent.status,
        sendCount: intent.sendCount
      }],
      gameplayWrites: intent.sendCount === 1 ? 1 : 0,
      publicFunctionCalls: intent.sendCount === 1 ? 1 : 0,
      rawWriteCalls: 0,
      authority: {
        ...state.authority,
        durableIntentCreated: true,
        authorityIssued: !!persistedAuthority,
        authorityConsumed: persistedAuthority?.consumed === true,
        maximumUses: 1
      }
    });

    if (intent.sendCount === 0
        && intent.sendBoundaryState === "NICHT_GESENDET") {
      const outcome = {
        classification: "NOT_APPLIED",
        reason: "DURABLE_INTENT_OHNE_SEND_RECORD",
        acceptedEvidenceObserved: false,
        attempts: 0
      };
      return settleIntent(existing, outcome);
    }

    const outcome = await reconcile(intent);
    const settled = settleIntent(existing, outcome);
    if (!settled.terminal && recoveryTimer === null) {
      recoveryTimer = setTimeout(async () => {
        recoveryTimer = null;
        try {
          const fresh = findExistingIntent();
          if (fresh) await recoverExisting(fresh);
        } catch (error) {
          fail(error);
        }
      }, 1000);
    }
    return settled;
  }

  async function performFreshOneWrite(performance) {
    setState({ phase: "PREFLIGHT", status: "PREFLIGHT" });
    const first = await strictObservation(performance);
    await sleep(DOUBLE_OBSERVE_DELAY_MS);
    const second = await strictObservation(performance);
    if (first.fingerprints.prestateFingerprintSha256
        !== second.fingerprints.prestateFingerprintSha256) {
      throw new Error("PR20_8_UPGRADE_LIVE_DOUBLE_OBSERVE_DRIFT");
    }

    const existing = findExistingIntent();
    if (existing) return recoverExisting(existing);

    const created = createIntent(second);
    if (created.existing === true) return recoverExisting(created);
    let intent = created.value;
    state.authority = {
      ...state.authority,
      durableIntentCreated: true
    };
    state.intents = [{
      transactionId: intent.transactionId,
      status: intent.status,
      sendCount: intent.sendCount
    }];
    publishTelemetryFacades();

    acquireFences(intent.transactionId);
    assertRuntimeLease();
    const fresh = await strictObservation(performance);
    if (fresh.fingerprints.prestateFingerprintSha256
        !== intent.fingerprints.prestateFingerprintSha256
        || fresh.candidate.index !== intent.candidate.index
        || fresh.scroll.index !== intent.scroll.index) {
      releaseFences(intent.transactionId);
      intent = updateIntent(created.key, intent, {
        status: "ABORTED_FRESH_ADMISSION_DRIFT",
        terminal: true,
        sendBoundaryState: "NICHT_GESENDET",
        outcome: {
          classification: "NOT_APPLIED",
          reason: "FRESH_ADMISSION_DRIFT"
        }
      });
      setState({
        status: "NICHT_BESTANDEN",
        phase: "COMPLETE",
        terminal: true,
        blocker: ["PR20_8_UPGRADE_LIVE_FRESH_ADMISSION_DRIFT"],
        evidence: terminalEvidence(intent, intent.outcome)
      });
      return state;
    }

    assertRuntimeLease();
    assertFences(intent.transactionId);
    const durableOwner = readJson(created.key);
    if (durableOwner?.runnerInstanceId !== INSTANCE_ID
        || durableOwner?.sendCount !== 0
        || durableOwner?.status !== "INTENT_DURABLE") {
      throw new Error("PR20_8_UPGRADE_LIVE_INTENT_OWNERSHIP_VERLOREN");
    }

    const issued = issueAuthority(intent, fresh);
    state.authority = {
      ...state.authority,
      authorityIssued: true,
      maximumUses: 1
    };
    publishTelemetryFacades();
    assertRuntimeLease();
    assertFences(intent.transactionId);
    const consumed = consumeAuthority(intent, issued, fresh);
    if (consumed.uses !== 1 || consumed.consumed !== true) {
      throw new Error("PR20_8_UPGRADE_LIVE_AUTHORITY_CONSUME_FEHLER");
    }
    state.authority = {
      ...state.authority,
      authorityConsumed: true,
      upgradeAuthority: true,
      gameplayAuthority: true,
      rawWriteAuthority: false
    };

    intent = updateIntent(created.key, intent, {
      status: "OUTCOME_PENDING",
      sendBoundaryState: "SEND_MOEGLICH_ODER_VERSUCHT",
      sendCount: 1,
      authority: {
        ...intent.authority,
        consumed: true,
        consumedAtMs: consumed.consumedAtMs
      }
    });
    state.intents = [{
      transactionId: intent.transactionId,
      status: intent.status,
      sendCount: intent.sendCount
    }];
    setState({ phase: "SEND", status: "SEND" });

    let sendResult = null;
    let sendError = null;
    let sendPromiseTimedOut = false;
    let sendPromise = null;
    state.gameplayWrites += 1;
    state.publicFunctionCalls += 1;
    assertRuntimeLease();
    assertFences(intent.transactionId);
    try {
      sendPromise = Promise.resolve(
        globalThis.upgrade(
          fresh.candidate.index,
          fresh.scroll.index,
          null,
          false
        )
      );
    } catch (error) {
      sendError = text(error?.message || error, 500);
    }
    state.authority = {
      ...state.authority,
      upgradeAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false
    };
    publishTelemetryFacades();

    if (sendPromise) {
      const promiseObservation = await Promise.race([
        sendPromise.then(
          value => ({ kind: "RESOLVED", value }),
          error => ({
            kind: "REJECTED",
            error: text(error?.message || error, 500)
          })
        ),
        sleep(PUBLIC_FUNCTION_PROMISE_TIMEOUT_MS).then(() => ({
          kind: "TIMEOUT"
        }))
      ]);
      if (promiseObservation.kind === "RESOLVED") {
        sendResult = promiseObservation.value;
      } else if (promiseObservation.kind === "REJECTED") {
        sendError = promiseObservation.error;
      } else {
        sendPromiseTimedOut = true;
        sendError = "PUBLIC_FUNCTION_PROMISE_TIMEOUT";
      }
    }

    setState({ phase: "RECONCILE", status: "RECONCILE" });
    const outcome = await reconcile(intent);
    const withSend = {
      ...outcome,
      promiseResultObserved: sendResult !== null && sendResult !== undefined,
      promiseResult: sendResult ?? null,
      promiseError: sendError,
      promiseTimedOut: sendPromiseTimedOut,
      promiseResultIsSupportingEvidenceOnly: true
    };
    return settleIntent({ key: created.key, value: intent }, withSend);
  }

  function fail(error) {
    const message = text(error?.message || error, 500) || "UNBEKANNTER_FEHLER";
    emit("PR20_8_UPGRADE_LIVE_FEHLER", "error", { reason: message });
    const safeZeroWriteNoIntentFailure = state.gameplayWrites === 0
      && state.publicFunctionCalls === 0
      && state.rawWriteCalls === 0
      && state.authority.durableIntentCreated === false
      && state.intents.length === 0;
    if (safeZeroWriteNoIntentFailure) {
      try { releaseRuntimeLease(); } catch {}
    }
    setState({
      status: "FEHLER",
      phase: "ERROR",
      terminal: true,
      blocker: [message],
      authority: {
        ...state.authority,
        upgradeAuthority: false,
        gameplayAuthority: false,
        rawWriteAuthority: false
      }
    });
    return state;
  }

  async function run() {
    publishTelemetryFacades();
    try {
      acquireRuntimeLease();
      const existing = findExistingIntent();
      if (existing) return await recoverExisting(existing);
      const performance = await ensurePerformanceTrick();
      return await performFreshOneWrite(performance);
    } catch (error) {
      return fail(error);
    }
  }

  function startOnce() {
    if (runPromise === null) runPromise = run();
    return runPromise;
  }

  publishTelemetryFacades();
  const api = Object.freeze({
    testId: TEST_ID,
    version: VERSION,
    status: () => state,
    telemetry: (limit = 2000) =>
      events.slice(-Math.max(1, Math.min(2000, Number(limit) || 2000))),
    start: () => startOnce()
  });
  globalThis[API_NAME] = api;
  try {
    const r = root();
    if (r !== globalThis) r[API_NAME] = api;
  } catch {}
  try {
    if (globalThis.parent && globalThis.parent !== globalThis) {
      globalThis.parent[API_NAME] = api;
    }
  } catch {}

  Promise.resolve().then(startOnce).catch(fail);
})();
