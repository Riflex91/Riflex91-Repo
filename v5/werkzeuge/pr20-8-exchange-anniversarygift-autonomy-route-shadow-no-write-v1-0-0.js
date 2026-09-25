(() => {
  'use strict';

  const TEST_ID = 'pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write';
  const VERSION = '1.0.0';
  const API_NAME = 'V5PR208ExchangeAnniversarygiftAutonomyRouteShadowNoWrite';
  const EXPECTED_CHARACTER = 'My_Merchant';
  const EXPECTED_CLASS = 'merchant';
  const EXPECTED_SERVER_REGION = 'EU';
  const EXPECTED_SERVER_IDENTIFIER = 'I';
  const ITEM_NAME = 'anniversarygift';
  const ITEM_TYPE = 'gem';
  const ITEM_SKIN = 'anniversarygift';
  const ITEM_DISPLAY_NAME = 'Anniversary Gift';
  const ITEM_EXPLANATION = 'Ten years, tied with a ribbon.';
  const ITEM_STACK_LIMIT = 9999;
  const ITEM_BASE_GOLD = 100;
  const EXCHANGE_QUANTITY = 1;
  const ITEM_ACCENT = '#3DB5A5';
  const SOURCE_SCANNER_VERSION = '1.0.7';
  const SOURCE_NOTIFICATION_ID = 2726;
  const SOURCE_LIVE5M_NOTIFICATION_ID = 2986;
  const PRIOR_TRANSACTION_ID =
    'pr20-8-exchange-anniversarygift-productive-one-write-live:0c6a1129be4c9c899f88274fab97108a';
  const SOURCE_COMMIT = '90052162eb3ebda36c893e1eb4af643913c8f984';
  const DROP_GRAPH_SHA256 =
    '2fad9b50ac0bb87a8e53a0cff8f6e34ded949b3531f8843f86d3f1fb8e828342';
  const EXCHANGE_POINT = Object.freeze({map:'main',x:-25,y:-478});
  const SOURCE_PINNED_SELL_DISTANCE = 400;
  const SERVICE_REACHABILITY_SAFETY_MAX = 300;
  const REQUIRED_EMPTY_SLOTS = 1;
  const DOUBLE_OBSERVE_DELAY_MS = 350;
  const INTENT_PREFIX = 'v5:' + TEST_ID + ':decision:';

  const state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    phase: 'PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW',
    status: 'BOOT',
    terminal: false,
    blocker: [],
    startedAtMs: Date.now(),
    updatedAtMs: Date.now(),
    recipient: null,
    candidate: null,
    fingerprints: null,
    shadowIntent: null,
    autonomyDecision: null,
    sourceEvidence: {
      scannerVersion: SOURCE_SCANNER_VERSION,
      scannerNotificationId: SOURCE_NOTIFICATION_ID,
      live5mNotificationId: SOURCE_LIVE5M_NOTIFICATION_ID,
      priorTransactionId: PRIOR_TRANSACTION_ID
    },
    durableStorageWrites: 0,
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
      shadowDurableIntentCreated: false,
      exchangeAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      normalExchangeWriteRatification: false
    },
    performanceTrick: null
  };

  function text(value, max = 240) {
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
    throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_SPIELKONTEXT_FEHLT');
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
    const Encoder = globalThis.TextEncoder || r.TextEncoder;
    if (!cryptoApi?.subtle?.digest || typeof Encoder !== 'function') {
      throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_WEB_CRYPTO_UNAVAILABLE');
    }
    const bytes = new Encoder().encode(String(value));
    const digest = await cryptoApi.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte =>
      byte.toString(16).padStart(2, '0')).join('');
  }

  function stableScalarObject(value, maximumKeys = 96) {
    if (!value || typeof value !== 'object') return {};
    const out = {};
    for (const key of Object.keys(value).sort().slice(0, maximumKeys)) {
      const v = value[key];
      if (v === null
          || typeof v === 'string'
          || typeof v === 'number'
          || typeof v === 'boolean') {
        out[key] = v;
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        const nested = {};
        for (const nk of Object.keys(v).sort().slice(0, 32)) {
          const nv = v[nk];
          if (nv === null
              || typeof nv === 'string'
              || typeof nv === 'number'
              || typeof nv === 'boolean') nested[nk] = nv;
        }
        out[key] = nested;
      }
    }
    return out;
  }

  function stableItemMaterial(item) {
    return item && typeof item === 'object'
      ? canonical(stableScalarObject(item, 64))
      : null;
  }

  function stableQ(q) {
    return canonical(stableScalarObject(q, 64));
  }

  function stableInventory(items) {
    return canonical(items.map(item =>
      item && typeof item === 'object' ? stableScalarObject(item, 64) : null));
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
    throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_DURABLE_STORAGE_UNAVAILABLE');
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
      if (status?.running === true || status?.aktivFreigegeben === true) {
        return 'V4_RUNTIME_ACTIVE';
      }
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
    if (called) await sleep(DOUBLE_OBSERVE_DELAY_MS);
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
        else if (empty.playing === true) playing = true;
      } catch {}
    }
    return {
      available,
      called,
      audioFound,
      playing,
      cplaying,
      active: available && called && audioFound && playing,
      verification: 'HOWLER_PLAYING_TRUE',
      error: lastError
    };
  }

  function publicExchangeAvailable() {
    for (const candidate of roots()) {
      try { if (typeof candidate?.['exchange'] === 'function') return true; } catch {}
    }
    return false;
  }

  function hostileAggro(r) {
    let hostile = 0;
    for (const entity of Object.values(r.entities || {})) {
      if (entity
          && entity.type === 'monster'
          && !entity.dead
          && !entity.rip
          && text(entity.target,192) === EXPECTED_CHARACTER) hostile += 1;
    }
    return hostile;
  }

  function countVisibleEmptySlots(c) {
    const size = Number.isSafeInteger(Number(c.isize))
      ? Math.min(Number(c.isize),c.items.length)
      : c.items.length;
    let empty = 0;
    for (let index = 0; index < size; index += 1) {
      if (c.items[index] == null) empty += 1;
    }
    return empty;
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
      throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_SELL_DIST_DRIFT');
    }
    return {
      value:Number.isFinite(observed) ? observed : SOURCE_PINNED_SELL_DISTANCE,
      source:Number.isFinite(observed) ? 'LIVE_BROWSER_B' : 'OFFICIAL_SERVER_SOURCE_PIN',
      browserObserved:Number.isFinite(observed)
    };
  }

  function serviceReachability(c) {
    const sellDistance = sellDistanceEvidence();
    if (c.computer === true) {
      return {
        reachable:true,
        viaComputer:true,
        distance:null,
        serverLimit:sellDistance.value,
        safetyLimit:SERVICE_REACHABILITY_SAFETY_MAX,
        servicePoint:EXCHANGE_POINT,
        sourceCommit:SOURCE_COMMIT
      };
    }
    if (text(c.map,96) !== EXCHANGE_POINT.map) {
      throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_SERVICE_MAP_DRIFT');
    }
    const px = Number(c.real_x ?? c.x);
    const py = Number(c.real_y ?? c.y);
    if (![px,py].every(Number.isFinite)) {
      throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_POSITION_UNLESBAR');
    }
    const distance = Math.hypot(px-EXCHANGE_POINT.x,py-EXCHANGE_POINT.y);
    const limit = Math.min(sellDistance.value,SERVICE_REACHABILITY_SAFETY_MAX);
    if (!Number.isFinite(distance) || distance > limit) {
      throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_SERVICE_NICHT_ERREICHBAR');
    }
    return {
      reachable:true,
      viaComputer:false,
      distance,
      serverLimit:sellDistance.value,
      safetyLimit:limit,
      servicePoint:EXCHANGE_POINT,
      sourceCommit:SOURCE_COMMIT
    };
  }

  function quantityOf(item) {
    const n = Number(item?.q == null ? 1 : item.q);
    return Number.isSafeInteger(n) && n >= 1 ? n : null;
  }

  function physicalUnsafe(item) {
    return !item
      || typeof item !== 'object'
      || item.l === true
      || item.locked === true
      || item.lock === true
      || item.b === true
      || item.blocked === true
      || item.giveaway === true
      || item.list === true
      || item.expires != null
      || item.acl != null
      || item.rid != null
      || item.p != null
      || item.gift != null;
  }

  function exactDefinition(def) {
    return Boolean(def
      && def.type === ITEM_TYPE
      && def.skin === ITEM_SKIN
      && def.name === ITEM_DISPLAY_NAME
      && def.explanation === ITEM_EXPLANATION
      && Number(def.s) === ITEM_STACK_LIMIT
      && Number(def.g) === ITEM_BASE_GOLD
      && Number(def.e) === EXCHANGE_QUANTITY
      && def.exclusive === true
      && def.cash !== true
      && def.event !== true
      && def.quest !== true
      && def.cx?.accent === ITEM_ACCENT);
  }

  function resolveCandidate(r) {
    const def = r.G?.items?.[ITEM_NAME];
    if (!exactDefinition(def)) {
      return { blocker:'PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_ITEM_DEFINITION_DRIFT' };
    }
    const matches = [];
    for (let index = 0; index < r.character.items.length && index < 128; index += 1) {
      const item = r.character.items[index];
      if (!item || item.name !== ITEM_NAME) continue;
      const quantity = quantityOf(item);
      if (quantity === null || quantity < EXCHANGE_QUANTITY || physicalUnsafe(item)) continue;
      matches.push({index,quantity,material:stableItemMaterial(item)});
    }
    if (matches.length !== 1) {
      return {
        blocker:matches.length === 0
          ? 'PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_EXAKTER_INPUT_FEHLT'
          : 'PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_KANDIDAT_NICHT_EINDEUTIG'
      };
    }
    const selected = matches[0];
    return {
      candidate:{
        name:ITEM_NAME,
        index:selected.index,
        quantity:selected.quantity,
        exchangeQuantity:EXCHANGE_QUANTITY,
        baseGold:ITEM_BASE_GOLD,
        exclusive:true,
        material:selected.material,
        selectionMode:'AUTONOMOUS_FRESH_CURRENT_INVENTORY_SCAN',
        manualPinnedInventoryIndex:false,
        observedIndexCarriesAuthority:false
      },
      definition:{
        type:ITEM_TYPE,
        skin:ITEM_SKIN,
        displayName:ITEM_DISPLAY_NAME,
        explanation:ITEM_EXPLANATION,
        stackLimit:ITEM_STACK_LIMIT,
        baseGold:ITEM_BASE_GOLD,
        exchangeQuantity:EXCHANGE_QUANTITY,
        exclusive:true,
        exclusiveExceptionScope:'ANNIVERSARYGIFT_ONLY',
        genericExclusivePolicyRelaxed:false,
        cash:false,
        event:false,
        quest:false,
        accent:ITEM_ACCENT
      }
    };
  }

  function installTelemetryFacade(owner) {
    if (!owner) return;
    owner.AIO_V3 = owner.AIO_V3 || {};
    const existing = owner.AIO_V3.operations && typeof owner.AIO_V3.operations === 'object'
      ? owner.AIO_V3.operations
      : null;
    let existingFacadeIsCurrent = false;
    if (existing?.__v5Pr208ExchangeAnniversaryAutonomyShadowVersion === VERSION
        && typeof existing.status === 'function') {
      try {
        const current = existing.status()?.v5AutonomousTest;
        existingFacadeIsCurrent = current
          && current.testId === TEST_ID
          && current.version === VERSION;
      } catch {}
    }
    if (existingFacadeIsCurrent) return;

    const oldStatus = existing && typeof existing.status === 'function'
      ? existing.status.bind(existing)
      : null;
    const oldHeartbeat = existing && typeof existing.hostHeartbeat === 'function'
      ? existing.hostHeartbeat.bind(existing)
      : null;

    owner.AIO_V3.operations = {
      ...(existing || {}),
      __v5Pr208ExchangeAnniversaryAutonomyShadowVersion: VERSION,
      status: () => {
        let base = {};
        try {
          const value = oldStatus ? oldStatus() : null;
          if (value && typeof value === 'object') base = value;
        } catch {}
        return {
          ...base,
          schemaVersion:Number(base.schemaVersion) || 1,
          mode:'V5_AUTONOMOUS_TEST',
          v5AutonomousTest:clone(state),
          telemetry:{queued:0,lastCapturedSeq:0,dropped:0}
        };
      },
      hostHeartbeat: () => {
        try {
          const value = oldHeartbeat ? oldHeartbeat() : null;
          if (value && typeof value === 'object') {
            return {
              ...value,
              v5Mode:'V5_AUTONOMOUS_TEST',
              v5TestId:TEST_ID,
              v5ObservedAtMs:Date.now()
            };
          }
        } catch {}
        return {
          schemaVersion:1,
          mode:'V5_AUTONOMOUS_TEST',
          v5Mode:'V5_AUTONOMOUS_TEST',
          v5TestId:TEST_ID,
          alive:true,
          observedAtMs:Date.now(),
          v5ObservedAtMs:Date.now()
        };
      },
      reconciliationStatus: () => ({
        schemaVersion:1,
        status:state.terminal ? 'TERMINAL_NO_GAMEPLAY_WRITE' : 'OBSERVING',
        v5AutonomousTestStatus:state.status,
        v5Terminal:state.terminal === true,
        sameIntentRetry:false
      }),
      peekTelemetry: () => []
    };
  }

  function publish() {
    state.updatedAtMs = Date.now();
    for (const owner of roots()) {
      try { installTelemetryFacade(owner); } catch {}
    }
  }

  function finish(status, blockers = []) {
    state.status = status;
    state.terminal = true;
    state.blocker = [...new Set(blockers)];
    state.phase = status === 'BESTANDEN'
      ? 'COMPLETE'
      : 'PR20_8_EXCHANGE_ANNIVERSARYGIFT_DURABLE_SHADOW';
    publish();
  }

  function exactIntent(decoded, record) {
    return Boolean(decoded
      && decoded.schemaVersion === 1
      && decoded.testId === TEST_ID
      && decoded.version === VERSION
      && decoded.art === 'PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_DECISION_NO_GAMEPLAY_WRITE'
      && decoded.terminal === true
      && decoded.journalTerminalArt === 'ABBRUCH'
      && decoded.sendBoundaryState === 'NICHT_GESENDET'
      && decoded.sameIntentRetry === false
      && decoded.actionContractId === 'AL-ACTION-EXCHANGE'
      && decoded.recoveryContractId === 'AL-RECOVERY-EXCHANGE'
      && decoded.verifierId === 'AL-VERIFIER-EXCHANGE'
      && decoded.publicFunction === 'exchange'
      && decoded.sourceEvidence?.scannerVersion === SOURCE_SCANNER_VERSION
      && decoded.sourceEvidence?.scannerNotificationId === SOURCE_NOTIFICATION_ID
      && decoded.sourceEvidence?.live5mNotificationId === SOURCE_LIVE5M_NOTIFICATION_ID
      && decoded.sourceEvidence?.priorTransactionId === PRIOR_TRANSACTION_ID
      && decoded.priorCommittedTransactionGrantsAuthority === false
      && decoded.recipient?.characterName === record.recipient.characterName
      && decoded.recipient?.sessionId === record.recipient.sessionId
      && decoded.recipient?.serverRegion === EXPECTED_SERVER_REGION
      && decoded.recipient?.serverIdentifier === EXPECTED_SERVER_IDENTIFIER
      && decoded.candidate?.name === ITEM_NAME
      && decoded.candidate?.index === record.candidate.index
      && decoded.candidate?.quantity === record.candidate.quantity
      && decoded.candidate?.exchangeQuantity === EXCHANGE_QUANTITY
      && decoded.candidate?.material === record.candidate.material
      && decoded.candidate?.selectionMode === 'AUTONOMOUS_FRESH_CURRENT_INVENTORY_SCAN'
      && decoded.candidate?.manualPinnedInventoryIndex === false
      && decoded.candidate?.observedIndexCarriesAuthority === false
      && decoded.definition?.type === ITEM_TYPE
      && decoded.definition?.baseGold === ITEM_BASE_GOLD
      && decoded.definition?.exchangeQuantity === EXCHANGE_QUANTITY
      && decoded.definition?.exclusive === true
      && decoded.definition?.exclusiveExceptionScope === 'ANNIVERSARYGIFT_ONLY'
      && decoded.definition?.genericExclusivePolicyRelaxed === false
      && decoded.serviceReachability?.reachable === true
      && decoded.outputSpace?.minimumRequired === REQUIRED_EMPTY_SLOTS
      && decoded.outputSpace?.visibleEmptySlots >= REQUIRED_EMPTY_SLOTS
      && decoded.outputSpace?.esize >= REQUIRED_EMPTY_SLOTS
      && decoded.oneShot?.bindingPrepared === false
      && decoded.oneShot?.maximumUses === 1
      && decoded.oneShot?.exchangeAuthorityIssued === false
      && decoded.fingerprints?.prestate === record.fingerprints.prestate
      && decoded.fingerprints?.inventory === record.fingerprints.inventory
      && decoded.fingerprints?.q === record.fingerprints.q
      && decoded.fingerprints?.candidate === record.fingerprints.candidate
      && decoded.fingerprints?.definition === record.fingerprints.definition
      && decoded.fingerprints?.service === record.fingerprints.service
      && decoded.manualPinnedInventoryIndex === false
      && decoded.freshCandidateReresolutionRequiredBeforeFutureSend === true
      && decoded.durableAutonomyDecision === true
      && decoded.massExchangeAllowed === false
      && decoded.movementAuthority === false
      && decoded.gameplayAuthority === false
      && decoded.rawWriteAuthority === false
      && decoded.exchangeAuthority === false
      && decoded.normalRuntimeAllowed === false);
  }

  function shadowSummary(key, decoded, recoveredExistingTerminal) {
    return {
      storage:'LOCAL_STORAGE_SHADOW_ONLY',
      key,
      durableReadback:true,
      journalTerminalArt:'ABBRUCH',
      sendBoundaryState:'NICHT_GESENDET',
      sameIntentRetry:false,
      selectionMode:'AUTONOMOUS_FRESH_CURRENT_INVENTORY_SCAN',
      manualPinnedInventoryIndex:false,
      observedCandidateIndex:decoded.candidate.index,
      observedIndexCarriesAuthority:false,
      freshCandidateReresolutionRequiredBeforeFutureSend:true,
      authorityIssued:false,
      createdThisRun:recoveredExistingTerminal !== true,
      recoveredExistingTerminal:recoveredExistingTerminal === true,
      recoveredVersion:recoveredExistingTerminal === true ? decoded.version : null
    };
  }

  function persistShadow(record) {
    const store = storage();
    const key = INTENT_PREFIX + record.fingerprints.prestate;
    const existingRaw = store.getItem(key);
    if (existingRaw) {
      let decoded = null;
      try { decoded = JSON.parse(existingRaw); } catch {}
      if (!exactIntent(decoded, record)) {
        throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_TERMINAL_DECISION_DRIFT');
      }
      return shadowSummary(key, decoded, true);
    }

    const payload = {
      schemaVersion:1,
      testId:TEST_ID,
      version:VERSION,
      art:'PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_DECISION_NO_GAMEPLAY_WRITE',
      createdAtMs:Date.now(),
      terminal:true,
      journalTerminalArt:'ABBRUCH',
      sendBoundaryState:'NICHT_GESENDET',
      sameIntentRetry:false,
      actionContractId:'AL-ACTION-EXCHANGE',
      recoveryContractId:'AL-RECOVERY-EXCHANGE',
      verifierId:'AL-VERIFIER-EXCHANGE',
      publicFunction:'exchange',
      sourceEvidence:{
        scannerVersion:SOURCE_SCANNER_VERSION,
        scannerNotificationId:SOURCE_NOTIFICATION_ID,
        live5mNotificationId:SOURCE_LIVE5M_NOTIFICATION_ID,
        priorTransactionId:PRIOR_TRANSACTION_ID,
        sourceCommit:SOURCE_COMMIT,
        dropGraphSha256:DROP_GRAPH_SHA256
      },
      priorCommittedTransactionGrantsAuthority:false,
      recipient:record.recipient,
      candidate:record.candidate,
      definition:record.definition,
      serviceReachability:record.service,
      outputSpace:{
        esize:record.esize,
        visibleEmptySlots:record.visibleEmptySlots,
        minimumRequired:REQUIRED_EMPTY_SLOTS
      },
      conditions:record.conditions,
      fingerprints:record.fingerprints,
      durableAutonomyDecision:true,
      autonomousSelectionPerformed:true,
      manualPinnedInventoryIndex:false,
      oneShot:{
        bindingPrepared:false,
        maximumUses:1,
        exchangeAuthorityIssued:false
      },
      freshCandidateReresolutionRequiredBeforeFutureSend:true,
      massExchangeAllowed:false,
      movementAuthority:false,
      gameplayAuthority:false,
      rawWriteAuthority:false,
      exchangeAuthority:false,
      normalRuntimeAllowed:false
    };
    store.setItem(key, JSON.stringify(payload));
    state.durableStorageWrites += 1;
    const readbackRaw = store.getItem(key);
    let readback = null;
    try { readback = JSON.parse(readbackRaw); } catch {}
    if (!exactIntent(readback, record)) {
      throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_DURABLE_READBACK_DRIFT');
    }
    return shadowSummary(key, readback, false);
  }

  async function observe(r) {
    const c = r.character;
    const server = serverBinding(r);
    if (text(c.name,192) !== EXPECTED_CHARACTER
        || text(c.id,192) !== EXPECTED_CHARACTER
        || text(c.ctype || c.type,32).toLowerCase() !== EXPECTED_CLASS
        || server.region !== EXPECTED_SERVER_REGION
        || server.identifier !== EXPECTED_SERVER_IDENTIFIER) {
      throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_RECIPIENT_ODER_SERVER_DRIFT');
    }
    if (c.rip === true || c.dead === true) {
      throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_CHARACTER_TOT');
    }
    if (c.moving === true) {
      throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_CHARACTER_BEWEGT_SICH');
    }
    if (c.target !== null && c.target !== undefined && text(c.target,192)) {
      throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_CHARACTER_HAT_ZIEL');
    }
    if (c.q && typeof c.q === 'object' && Object.keys(c.q).length) {
      throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_Q_NICHT_FREI');
    }
    if (text(c.map,96).startsWith('bank') || c.user) {
      throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_BANK_KONTEXT_VERBOTEN');
    }
    if (hostileAggro(r) !== 0) {
      throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_CHARACTER_UNTER_ANGRIFF');
    }
    if (c.s?.massexchange) {
      throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_MASSEXCHANGE_AKTIV');
    }
    if (c.s?.massexchangepp) {
      throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_MASSEXCHANGEPP_AKTIV');
    }
    const resolved = resolveCandidate(r);
    if (resolved.blocker) throw new Error(resolved.blocker);
    const esize = Number(c.esize);
    const visibleEmptySlots = countVisibleEmptySlots(c);
    if (!Number.isFinite(esize)
        || esize < REQUIRED_EMPTY_SLOTS
        || visibleEmptySlots < REQUIRED_EMPTY_SLOTS) {
      throw new Error('PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_OUTPUTSPACE_FEHLT');
    }
    const service = serviceReachability(c);
    const recipient = {
      characterName:text(c.name,192),
      sessionId:text(c.id,192),
      ctype:text(c.ctype || c.type,32).toLowerCase(),
      serverRegion:server.region,
      serverIdentifier:server.identifier
    };
    const qMaterial = stableQ(c.q);
    const inventoryMaterial = stableInventory(c.items);
    const definitionMaterial = canonical(resolved.definition);
    const serviceMaterial = canonical(service);
    const conditions = {
      massexchangePresent:false,
      massexchangeppPresent:false,
      hostileAggroCount:0,
      moving:false,
      targetClear:true
    };
    const fingerprints = {
      inventory:await sha256(inventoryMaterial),
      q:await sha256(qMaterial),
      candidate:await sha256(resolved.candidate.material),
      definition:await sha256(definitionMaterial),
      service:await sha256(serviceMaterial)
    };
    fingerprints.prestate = await sha256(canonical({
      recipient,
      inventory:fingerprints.inventory,
      q:fingerprints.q,
      candidate:fingerprints.candidate,
      definition:fingerprints.definition,
      service:fingerprints.service,
      esize,
      visibleEmptySlots,
      conditions,
      sourceCommit:SOURCE_COMMIT,
      dropGraphSha256:DROP_GRAPH_SHA256
    }));
    return {
      recipient,
      qMaterial,
      inventoryMaterial,
      candidate:resolved.candidate,
      definition:resolved.definition,
      service,
      esize,
      visibleEmptySlots,
      conditions,
      fingerprints
    };
  }

  function sameObservation(a,b) {
    return a.recipient.characterName === b.recipient.characterName
      && a.recipient.sessionId === b.recipient.sessionId
      && a.recipient.serverRegion === b.recipient.serverRegion
      && a.recipient.serverIdentifier === b.recipient.serverIdentifier
      && a.qMaterial === b.qMaterial
      && a.inventoryMaterial === b.inventoryMaterial
      && a.candidate.index === b.candidate.index
      && a.candidate.quantity === b.candidate.quantity
      && a.candidate.material === b.candidate.material
      && a.service.distance === b.service.distance
      && a.service.viaComputer === b.service.viaComputer
      && a.esize === b.esize
      && a.visibleEmptySlots === b.visibleEmptySlots
      && a.fingerprints.prestate === b.fingerprints.prestate;
  }

  async function run() {
    publish();
    const r = root();
    const c = r.character;
    const server = serverBinding(r);
    if (text(c.name,192) !== EXPECTED_CHARACTER) {
      finish('BLOCKIERT',['PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_EXAKTER_MERCHANT_ERFORDERLICH']);
      return;
    }
    if (text(c.ctype || c.type,32).toLowerCase() !== EXPECTED_CLASS) {
      finish('BLOCKIERT',['PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_MERCHANT_KLASSE_ERFORDERLICH']);
      return;
    }
    if (!text(c.id,192)) {
      finish('BLOCKIERT',['PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_SESSION_FEHLT']);
      return;
    }
    if (server.region !== EXPECTED_SERVER_REGION || server.identifier !== EXPECTED_SERVER_IDENTIFIER) {
      finish('BLOCKIERT',['PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_SERVER_BINDUNG_DRIFT']);
      return;
    }
    if (c.rip === true || c.dead === true) {
      finish('BLOCKIERT',['PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_CHARACTER_TOT']);
      return;
    }
    if (c.moving === true) {
      finish('BLOCKIERT',['PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_CHARACTER_BEWEGT_SICH']);
      return;
    }
    if (c.target !== null && c.target !== undefined && text(c.target,192)) {
      finish('BLOCKIERT',['PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_CHARACTER_HAT_ZIEL']);
      return;
    }
    if (c.q && typeof c.q === 'object' && Object.keys(c.q).length) {
      finish('BLOCKIERT',['PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_Q_NICHT_FREI']);
      return;
    }
    const conflict = runtimeConflict(r);
    if (conflict) {
      finish('BLOCKIERT',['PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_ALTERNATIVE_RUNTIME_AKTIV:' + conflict]);
      return;
    }
    state.performanceTrick = await performanceStatus();
    if (!state.performanceTrick.active) {
      finish('BLOCKIERT',['PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_PERFORMANCE_TRICK_BLOCKED']);
      return;
    }
    if (!publicExchangeAvailable()) {
      finish('BLOCKIERT',['PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_EXCHANGE_SERVICE_FEHLT']);
      return;
    }

    let first;
    try { first = await observe(r); }
    catch (error) {
      finish('BLOCKIERT',[text(error?.message || error,192)]);
      return;
    }
    await sleep(DOUBLE_OBSERVE_DELAY_MS);
    let second;
    try { second = await observe(r); }
    catch (error) {
      finish('BLOCKIERT',[text(error?.message || error,192)]);
      return;
    }
    if (!sameObservation(first,second)) {
      finish('BLOCKIERT',['PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_DOPPELBEOBACHTUNG_DRIFT']);
      return;
    }

    state.recipient = second.recipient;
    state.candidate = second.candidate;
    state.fingerprints = second.fingerprints;
    state.autonomyDecision = {
      selectionMode:second.candidate.selectionMode,
      manualPinnedInventoryIndex:false,
      observedCandidateIndex:second.candidate.index,
      observedIndexCarriesAuthority:false,
      serviceReachable:second.service.reachable,
      visibleEmptySlots:second.visibleEmptySlots,
      esize:second.esize,
      priorCommittedTransactionGrantsAuthority:false
    };
    try {
      state.shadowIntent = persistShadow(second);
    } catch (error) {
      finish('BLOCKIERT',[text(error?.message || error,192)]);
      return;
    }
    state.authority.shadowDurableIntentCreated =
      state.shadowIntent.createdThisRun === true;
    state.authority.durableIntentCreated =
      state.shadowIntent.createdThisRun === true;
    finish('BESTANDEN',[]);
  }

  const api = Object.freeze({
    version:VERSION,
    testId:TEST_ID,
    status:() => clone(state)
  });
  Object.defineProperty(globalThis,API_NAME,{
    configurable:true,
    enumerable:true,
    writable:false,
    value:api
  });
  try {
    if (parent && parent !== globalThis) {
      Object.defineProperty(parent,API_NAME,{
        configurable:true,
        enumerable:true,
        writable:false,
        value:api
      });
    }
  } catch {}

  publish();
  Promise.resolve().then(run).catch(error => {
    state.error = text(error?.message || error,240);
    finish('FEHLER',['PR20_8_EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_SHADOW_UNEXPECTED_ERROR']);
  });
})();
