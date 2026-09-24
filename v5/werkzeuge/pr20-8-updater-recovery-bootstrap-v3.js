function installV5AutonomousTestIngameUpdater() {
  'use strict';

  const API_NAME = 'V5AutonomousTestIngameUpdater';
  const VERSION = '1.0.8';
  const MODE = 'NATIVE_INGAME_CLOUDFLARE_R2_V1';
  const BASE_URL = 'https://aio-bot-dashboard.hansijuergenlul.workers.dev';
  const MANIFEST_PATH = '/v5/roadmap/v5-autonomous-test-manifest.json';
  const POLL_MS = 60_000;
  const MANIFEST_MAX_BYTES = 32 * 1024;
  const PACKAGE_HARD_MAX_BYTES = 128 * 1024;
  const APPLY_MARKER_KEY = 'AIO_V5_NATIVE_TEST_UPDATER_APPLY_V1';

  const state = {
    schemaVersion: 1,
    version: VERSION,
    mode: MODE,
    phase: 'STARTING',
    installedAtMs: Date.now(),
    lastCheckAtMs: 0,
    lastSuccessAtMs: 0,
    desiredTestId: null,
    desiredGate: null,
    desiredSourceCommit: null,
    desiredSha256: null,
    activeSlot: null,
    lastApply: null,
    performanceTrick: null,
    error: null
  };

  const root = () => {
    try {
      return globalThis.parent && globalThis.parent !== globalThis
        ? globalThis.parent
        : globalThis;
    } catch {
      return globalThis;
    }
  };
  const text = (value, max = 240) =>
    String(value == null ? '' : value).trim().slice(0, max);
  const clone = value => JSON.parse(JSON.stringify(value));

  function performanceRoots() {
    const roots = [];
    try { roots.push(globalThis); } catch {}
    try {
      const host = root();
      if (host && !roots.includes(host)) roots.push(host);
    } catch {}
    return roots;
  }

  function performanceStatus() {
    let available = false;
    let playing = false;
    let cplaying = false;
    for (const host of performanceRoots()) {
      try {
        if (typeof host?.performance_trick === 'function') available = true;
        const empty = host?.sounds?.empty;
        if (!empty) continue;
        if (empty.cplaying === true) cplaying = true;
        if (typeof empty.playing === 'function' && empty.playing() === true) playing = true;
      } catch {}
    }
    return { available, playing, cplaying, active: available && playing };
  }

  async function ensurePerformanceTrick() {
    let called = false;
    let lastError = null;
    for (const host of performanceRoots()) {
      try {
        if (typeof host?.performance_trick !== 'function') continue;
        host.performance_trick();
        called = true;
        break;
      } catch (error) {
        lastError = text(error?.message || error || 'PERFORMANCE_TRICK_FAILED', 160);
      }
    }
    if (called) await new Promise(resolve => setTimeout(resolve, 350));
    const status = performanceStatus();
    return {
      ...status,
      called,
      reason: status.active
        ? null
        : (status.available ? 'PERFORMANCE_TRICK_NOT_PLAYING' : (lastError || 'PERFORMANCE_TRICK_UNAVAILABLE'))
    };
  }

  function binding(name) {
    const local = globalThis;
    const host = root();
    if (local && typeof local[name] === 'function') return { fn: local[name], owner: local };
    if (host && typeof host[name] === 'function') return { fn: host[name], owner: host };
    return null;
  }

  function character() {
    const host = root();
    return globalThis.character || host.character || null;
  }

  function characterClass() {
    return text(character()?.ctype, 40).toLowerCase();
  }

  function currentV5() {
    for (const host of [globalThis, root()]) {
      try {
        const operations = host?.AIO_V3?.operations;
        const status = typeof operations?.status === 'function' ? operations.status() : null;
        const value = status?.v5AutonomousTest;
        if (value && typeof value === 'object') return value;
      } catch {}
    }
    return null;
  }

  function validateHex(value, length) {
    const normalized = text(value, length + 8).toLowerCase();
    return normalized.length === length && /^[0-9a-f]+$/.test(normalized)
      ? normalized
      : null;
  }

  function validatePackagePath(value) {
    const path = text(value, 200).replace(/\\/g, '/');
    if (!path.startsWith('v5/werkzeuge/') || !path.endsWith('.js')) return null;
    if (path.includes('..') || path.includes('//')) return null;
    if (!/^v5\/werkzeuge\/[A-Za-z0-9._-]+\.js$/.test(path)) return null;
    return path;
  }

  function validateManifest(raw) {
    if (!raw || typeof raw !== 'object') throw new Error('MANIFEST_NOT_OBJECT');
    if (raw.schemaVersion !== 1 || raw.enabled !== true) throw new Error('MANIFEST_SCHEMA');
    if (raw.repository !== 'Riflex91/Riflex91-Repo') throw new Error('MANIFEST_REPOSITORY');
    if (raw.branch !== 'main') throw new Error('MANIFEST_BRANCH');
    if (raw.coordinatorClass !== 'merchant') throw new Error('MANIFEST_COORDINATOR');
    if (raw.workerDistribution !== 'PACKAGE_OWNED_COMMAND_CHARACTER')
      throw new Error('MANIFEST_WORKER_DISTRIBUTION');
    if (raw.normalRuntimeAllowed !== false) throw new Error('MANIFEST_NORMAL_RUNTIME_MUST_STAY_BLOCKED');

    const gate = text(raw.gate, 100);
    const testId = text(raw.testId, 160);
    const controllerVersion = text(raw.controllerVersion, 80);
    const expectedGlobal = text(raw.expectedGlobal, 100);
    const sourceCommit = validateHex(raw.sourceCommit, 40);
    const packageSha256 = validateHex(raw.packageSha256, 64);
    const packagePath = validatePackagePath(raw.packagePath);
    const maxPackageBytes = Number(raw.maxPackageBytes);

    if (!gate || !testId || !controllerVersion || !expectedGlobal)
      throw new Error('MANIFEST_FIELDS');
    if (!sourceCommit) throw new Error('MANIFEST_COMMIT');
    if (!packageSha256) throw new Error('MANIFEST_SHA256');
    if (!packagePath) throw new Error('MANIFEST_PACKAGE_PATH');
    if (!Number.isSafeInteger(maxPackageBytes)
        || maxPackageBytes < 1024
        || maxPackageBytes > PACKAGE_HARD_MAX_BYTES)
      throw new Error('MANIFEST_PACKAGE_LIMIT');

    return Object.freeze({
      gate,
      testId,
      controllerVersion,
      expectedGlobal,
      sourceCommit,
      packageSha256,
      packagePath,
      maxPackageBytes
    });
  }

  function zeroWriteSameIntentState(active) {
    return Number.isFinite(Number(active?.gameplayWrites))
      && Number(active.gameplayWrites) === 0
      && Number.isFinite(Number(active?.rawWriteCalls))
      && Number(active.rawWriteCalls) === 0
      && active?.sameIntentRetry === false
      && Array.isArray(active?.intents)
      && active.intents.length === 0;
  }

  function safeTerminalPr206RecoveryUpgrade(active, manifest) {
    const blockers = Array.isArray(active?.blocker)
      ? active.blocker.map(value => text(value, 160))
      : [];
    const lifecycle = active?.characterLifecycle;
    const required = Array.isArray(lifecycle?.required) ? lifecycle.required : [];
    const alreadyRunning = new Set(required
      .filter(row => ['priest', 'mage'].includes(text(row?.ctype, 40).toLowerCase())
        && text(row?.lastResult, 120) === 'already_running')
      .map(row => text(row?.ctype, 40).toLowerCase()));

    return manifest.testId === 'pr20-6-mluck-autonomous-live-5m'
      && ['1.0.1', '1.0.3'].includes(text(active?.version, 80))
      && manifest.controllerVersion === '1.0.4'
      && active?.terminal === true
      && text(active?.status, 80) === 'BLOCKIERT'
      && text(active?.phase, 80) === 'ROSTER'
      && zeroWriteSameIntentState(active)
      && blockers.includes('PR20_6_ROSTER_AUTOSTART_TIMEOUT')
      && blockers.includes('ACCOUNT_RANGER_MEHRDEUTIG')
      && text(lifecycle?.mode, 100) === 'ACCOUNT_ROSTER_AUTOSTART_V1'
      && alreadyRunning.has('priest')
      && alreadyRunning.has('mage');
  }

  function safeTerminalPr208RecoveryUpgrade(active, manifest) {
    const blockers = Array.isArray(active?.blocker)
      ? active.blocker.map(value => text(value, 160))
      : [];
    const authority = active?.authority;
    const activeVersion = text(active?.version, 80);
    let expectedBlocker = null;
    if (activeVersion === '1.0.0' && manifest.controllerVersion === '1.0.1') {
      expectedBlocker = 'PR20_8_UPGRADE_LIVE_DUPLIKAT_INSTANZ_AKTIV';
    } else if (activeVersion === '1.0.1' && manifest.controllerVersion === '1.0.2') {
      expectedBlocker = 'PR20_8_UPGRADE_LIVE_DUPLIKAT_INSTANZ_AKTIV';
    } else if (activeVersion === '1.0.2' && manifest.controllerVersion === '1.0.3') {
      expectedBlocker = 'PR20_8_UPGRADE_LIVE_ITEM_DEFINITION_DRIFT';
    }

    return manifest.testId === 'pr20-8-upgrade-productive-one-write-live'
      && expectedBlocker !== null
      && active?.terminal === true
      && text(active?.status, 80) === 'FEHLER'
      && text(active?.phase, 80) === 'ERROR'
      && zeroWriteSameIntentState(active)
      && Number.isFinite(Number(active?.publicFunctionCalls))
      && Number(active.publicFunctionCalls) === 0
      && blockers.length === 1
      && blockers[0] === expectedBlocker
      && authority
      && typeof authority === 'object'
      && authority.authorityIssued === false
      && authority.authorityConsumed === false
      && authority.durableIntentCreated === false
      && authority.upgradeAuthority === false
      && authority.gameplayAuthority === false
      && authority.rawWriteAuthority === false
      && authority.normalUpgradeWriteRatification === false;
  }

  function safeSameTestVersionUpgrade(active, manifest) {
    const legacyWaitUpgrade = manifest.testId === 'pr20-6-mluck-autonomous-live-5m'
      && text(active?.version, 80) === '1.0.0'
      && manifest.controllerVersion === '1.0.1'
      && active?.terminal !== true
      && text(active?.status, 80) === 'WAITING_FOR_4_CHARACTERS'
      && text(active?.phase, 80) === 'ROSTER'
      && zeroWriteSameIntentState(active);
    return legacyWaitUpgrade
      || safeTerminalPr206RecoveryUpgrade(active, manifest)
      || safeTerminalPr208RecoveryUpgrade(active, manifest);
  }

  function deploymentDecision(manifest) {
    const active = currentV5();
    if (!active) return { deploy: true, reason: 'NO_ACTIVE_V5_TEST' };
    const activeId = text(active.testId, 160);
    if (activeId === manifest.testId) {
      const activeVersion = text(active.version, 80);
      if (activeVersion === manifest.controllerVersion)
        return { deploy: false, reason: 'DESIRED_TEST_ALREADY_PRESENT' };
      if (safeSameTestVersionUpgrade(active, manifest))
        return { deploy: true, reason: 'SAFE_SAME_TEST_VERSION_UPGRADE' };
      return { deploy: false, reason: 'SAME_TEST_VERSION_MISMATCH_BLOCKED' };
    }
    if (active.terminal === true)
      return { deploy: true, reason: 'PREVIOUS_TEST_TERMINAL' };
    return { deploy: false, reason: 'OTHER_V5_TEST_NONTERMINAL' };
  }

  function localSafety() {
    const c = character();
    const reasons = [];
    if (!c || !text(c.name, 100)) reasons.push('CHARACTER_UNKNOWN');
    if (characterClass() !== 'merchant') reasons.push('NOT_MERCHANT');
    if (c?.rip || c?.dead) reasons.push('CHARACTER_DEAD');
    const hp = Number(c?.hp || 0);
    const maxHp = Number(c?.max_hp || 0);
    if (maxHp > 0 && hp / maxHp < 0.9) reasons.push('HP_BELOW_UPDATE_THRESHOLD');

    try {
      const entities = typeof globalThis.get_entities === 'function'
        ? Object.values(globalThis.get_entities() || {})
        : Object.values(root().entities || {});
      const self = text(c?.name, 100);
      const aggro = entities.some(entity =>
        entity
        && entity.mtype
        && !entity.dead
        && !entity.rip
        && text(entity.target, 100) === self);
      if (aggro) reasons.push('ACTIVE_AGGRO');
    } catch {
      reasons.push('AGGRO_STATE_UNREADABLE');
    }

    return { safe: reasons.length === 0, reasons };
  }

  async function fetchBounded(path, maximumBytes) {
    const fetchBinding = binding('fetch');
    if (!fetchBinding) throw new Error('FETCH_UNAVAILABLE');
    if (!String(path).startsWith('/')) throw new Error('FETCH_PATH_INVALID');
    const url = BASE_URL + path;
    const response = await fetchBinding.fn.call(fetchBinding.owner, url, {
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error'
    });
    if (!response || response.ok !== true)
      throw new Error('HTTP_' + String(response?.status || 0));

    const declared = Number(response.headers?.get?.('content-length') || 0);
    if (Number.isFinite(declared) && declared > maximumBytes)
      throw new Error('DOWNLOAD_TOO_LARGE');

    const body = await response.text();
    const bytes = new TextEncoder().encode(body);
    if (bytes.byteLength < 1 || bytes.byteLength > maximumBytes)
      throw new Error('DOWNLOAD_SIZE_INVALID');
    return { body, bytes };
  }

  async function sha256(bytes) {
    const cryptoApi = globalThis.crypto || root().crypto;
    if (!cryptoApi?.subtle?.digest) throw new Error('WEB_CRYPTO_UNAVAILABLE');
    const digest = await cryptoApi.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte =>
      byte.toString(16).padStart(2, '0')).join('');
  }

  function activeSlot() {
    const getSlot = binding('get_active_code_slot');
    if (!getSlot) throw new Error('ACTIVE_CODE_SLOT_UNAVAILABLE');
    const value = getSlot.fn.call(getSlot.owner);
    if (value && typeof value === 'object') {
      const slot = value.slot ?? value.id ?? value.name;
      if (slot == null || slot === '') throw new Error('ACTIVE_CODE_SLOT_UNKNOWN');
      return { slot, name: text(value.name, 100) || null };
    }
    if (value == null || value === '') throw new Error('ACTIVE_CODE_SLOT_UNKNOWN');
    return { slot: value, name: null };
  }

  function bootstrapSource() {
    return '(' + installV5AutonomousTestIngameUpdater.toString() + ')();\n';
  }

  async function saveBundle(slotInfo, code, manifest) {
    const upload = binding('upload_code');
    if (!upload) throw new Error('UPLOAD_CODE_UNAVAILABLE');
    const slotName = slotInfo.name || 'AIO V5 Autonomous Tests';
    let result = upload.fn.call(
      upload.owner,
      slotInfo.slot,
      slotName,
      code
    );
    if (result && typeof result.then === 'function') result = await result;
    if (result?.failed === true) throw new Error('UPLOAD_CODE_FAILED');

    try {
      globalThis.localStorage?.setItem(APPLY_MARKER_KEY, JSON.stringify({
        schemaVersion: 1,
        atMs: Date.now(),
        testId: manifest.testId,
        gate: manifest.gate,
        sourceCommit: manifest.sourceCommit,
        packageSha256: manifest.packageSha256,
        slot: slotInfo.slot
      }));
    } catch {}

    return result;
  }

  async function reloadSlot(slotInfo) {
    const load = binding('load_code');
    if (!load) throw new Error('LOAD_CODE_UNAVAILABLE');
    let result = load.fn.call(load.owner, slotInfo.slot);
    if (result && typeof result.then === 'function') result = await result;
    if (result?.failed === true) throw new Error('LOAD_CODE_FAILED');
    return result;
  }

  function reconcileApplyMarker() {
    try {
      const raw = globalThis.localStorage?.getItem(APPLY_MARKER_KEY);
      if (!raw) return;
      const marker = JSON.parse(raw);
      if (!marker || marker.schemaVersion !== 1) return;
      const active = currentV5();
      if (active && text(active.testId, 160) === text(marker.testId, 160)) {
        state.lastApply = {
          atMs: Number(marker.atMs) || null,
          testId: text(marker.testId, 160),
          gate: text(marker.gate, 100),
          sourceCommit: text(marker.sourceCommit, 40),
          packageSha256: text(marker.packageSha256, 64),
          slot: marker.slot ?? null,
          confirmed: true
        };
        globalThis.localStorage?.removeItem(APPLY_MARKER_KEY);
      }
    } catch {}
  }

  async function cycle() {
    if (state.phase === 'CHECKING' || state.phase === 'APPLYING') return clone(state);
    state.error = null;
    state.lastCheckAtMs = Date.now();

    try {
      const performanceTrick = await ensurePerformanceTrick();
      state.performanceTrick = performanceTrick;
      if (!performanceTrick.active) {
        state.phase = 'WAITING_FOR_PERFORMANCE_TRICK';
        state.error = performanceTrick.reason;
        return clone(state);
      }

      if (characterClass() !== 'merchant') {
        state.phase = 'FARMER_PERFORMANCE_TRICK_ARMED';
        state.lastSuccessAtMs = Date.now();
        return clone(state);
      }

      state.phase = 'CHECKING';
      const manifestDownload = await fetchBounded(MANIFEST_PATH, MANIFEST_MAX_BYTES);
      const manifest = validateManifest(JSON.parse(manifestDownload.body));
      state.desiredTestId = manifest.testId;
      state.desiredGate = manifest.gate;
      state.desiredSourceCommit = manifest.sourceCommit;
      state.desiredSha256 = manifest.packageSha256;

      const decision = deploymentDecision(manifest);
      if (!decision.deploy) {
        state.phase = decision.reason;
        state.lastSuccessAtMs = Date.now();
        reconcileApplyMarker();
        return clone(state);
      }

      const safety = localSafety();
      if (!safety.safe) {
        state.phase = 'WAITING_FOR_SAFE_MERCHANT';
        state.error = safety.reasons.join(',');
        return clone(state);
      }

      const slotInfo = activeSlot();
      state.activeSlot = slotInfo.slot;
      const packageDownload = await fetchBounded(
        '/' + manifest.packagePath,
        manifest.maxPackageBytes
      );
      const actualSha256 = await sha256(packageDownload.bytes);
      if (actualSha256 !== manifest.packageSha256)
        throw new Error('PACKAGE_SHA256_MISMATCH');
      if (!packageDownload.body.includes(manifest.testId))
        throw new Error('PACKAGE_TEST_ID_MARKER_MISSING');
      if (!packageDownload.body.includes(manifest.expectedGlobal))
        throw new Error('PACKAGE_GLOBAL_MARKER_MISSING');

      const finalDecision = deploymentDecision(manifest);
      if (!finalDecision.deploy) {
        state.phase = finalDecision.reason;
        state.lastSuccessAtMs = Date.now();
        return clone(state);
      }

      const finalSafety = localSafety();
      if (!finalSafety.safe)
        throw new Error('SAFETY_CHANGED_BEFORE_APPLY:' + finalSafety.reasons.join(','));

      state.phase = 'APPLYING';
      const combined = bootstrapSource() + packageDownload.body;
      await saveBundle(slotInfo, combined, manifest);
      state.lastApply = {
        atMs: Date.now(),
        testId: manifest.testId,
        gate: manifest.gate,
        sourceCommit: manifest.sourceCommit,
        packageSha256: manifest.packageSha256,
        slot: slotInfo.slot,
        confirmed: false
      };
      state.phase = 'RELOADING';
      await reloadSlot(slotInfo);
      return clone(state);
    } catch (error) {
      state.phase = 'BLOCKED';
      state.error = text(error?.message || error || 'NATIVE_V5_UPDATE_FAILED', 240);
      return clone(state);
    }
  }

  try {
    const existing = globalThis[API_NAME];
    if (existing?.version === VERSION && typeof existing.cycle === 'function') {
      void existing.cycle();
      return existing;
    }
  } catch {}

  try {
    if (globalThis.__V5_NATIVE_TEST_UPDATER_TIMER)
      clearInterval(globalThis.__V5_NATIVE_TEST_UPDATER_TIMER);
  } catch {}

  const api = Object.freeze({
    version: VERSION,
    mode: MODE,
    baseUrl: BASE_URL,
    manifestPath: MANIFEST_PATH,
    pollMs: POLL_MS,
    status: () => clone(state),
    cycle
  });

  Object.defineProperty(globalThis, API_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: api
  });

  reconcileApplyMarker();
  globalThis.__V5_NATIVE_TEST_UPDATER_TIMER = setInterval(() => {
    void cycle();
  }, POLL_MS);
  Promise.resolve().then(() => cycle());
  return api;
}

installV5AutonomousTestIngameUpdater();

function installPr208UpdaterRecoveryBootstrapV3() {
  'use strict';

  const API_NAME = 'V5PR208UpdaterRecoveryBootstrap';
  const TEST_ID = 'pr20-8-native-updater-recovery-bootstrap-v3';
  const VERSION = '1.0.0';
  const UPDATER_VERSION = '1.0.8';
  const PERSIST_MARKER_KEY = 'AIO_V5_PR20_8_UPDATER_BOOTSTRAP_V3_PERSISTED';
  const PERSIST_DELAY_MS = 3000;

  const state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    status: 'LAEUFT',
    phase: 'PERSISTENCE_PENDING',
    terminal: false,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    sameIntentRetry: false,
    intents: [],
    updaterVersion: UPDATER_VERSION,
    normalRuntimeAllowed: false,
    codeSlotWrites: 0,
    codeSlotReloads: 0,
    persisted: false,
    persistedAtMs: null,
    activeSlot: null,
    persistenceDelayMs: PERSIST_DELAY_MS,
    blocker: []
  };

  const clone = value => JSON.parse(JSON.stringify(value));
  const text = (value, max = 240) =>
    String(value == null ? '' : value).trim().slice(0, max);

  const root = () => {
    try {
      return globalThis.parent && globalThis.parent !== globalThis
        ? globalThis.parent
        : globalThis;
    } catch {
      return globalThis;
    }
  };

  function runtimeRoots() {
    const rows = [globalThis];
    try {
      const host = root();
      if (host && !rows.includes(host)) rows.push(host);
    } catch {}
    return rows;
  }

  function binding(name) {
    for (const owner of runtimeRoots()) {
      if (owner && typeof owner[name] === 'function')
        return { fn: owner[name], owner };
    }
    return null;
  }

  function storage() {
    for (const owner of runtimeRoots()) {
      try {
        if (owner?.localStorage) return owner.localStorage;
      } catch {}
    }
    return null;
  }

  function currentCharacter() {
    for (const owner of runtimeRoots()) {
      try {
        if (owner?.character) return owner.character;
      } catch {}
    }
    return null;
  }

  function safeForCodeSlotPersistence() {
    const c = currentCharacter();
    const reasons = [];
    if (!c || !text(c.name, 100)) reasons.push('CHARACTER_UNKNOWN');
    if (text(c?.ctype, 40).toLowerCase() !== 'merchant') reasons.push('NOT_MERCHANT');
    if (c?.rip === true || c?.dead === true) reasons.push('CHARACTER_DEAD');
    const hp = Number(c?.hp || 0);
    const maxHp = Number(c?.max_hp || 0);
    if (maxHp > 0 && hp / maxHp < 0.9) reasons.push('HP_BELOW_UPDATE_THRESHOLD');

    try {
      const getEntities = binding('get_entities');
      const entities = getEntities
        ? Object.values(getEntities.fn.call(getEntities.owner) || {})
        : Object.values(root().entities || {});
      const self = text(c?.name, 100);
      const aggro = entities.some(entity =>
        entity
        && entity.mtype
        && !entity.dead
        && !entity.rip
        && text(entity.target, 100) === self);
      if (aggro) reasons.push('ACTIVE_AGGRO');
    } catch {
      reasons.push('AGGRO_STATE_UNREADABLE');
    }

    return { safe: reasons.length === 0, reasons };
  }

  function activeSlot() {
    const getSlot = binding('get_active_code_slot');
    if (!getSlot) throw new Error('ACTIVE_CODE_SLOT_UNAVAILABLE');
    const value = getSlot.fn.call(getSlot.owner);
    if (value && typeof value === 'object') {
      const slot = value.slot ?? value.id ?? value.name;
      if (slot == null || slot === '') throw new Error('ACTIVE_CODE_SLOT_UNKNOWN');
      return { slot, name: text(value.name, 100) || null };
    }
    if (value == null || value === '') throw new Error('ACTIVE_CODE_SLOT_UNKNOWN');
    return { slot: value, name: null };
  }

  function persistedMarker() {
    try {
      const raw = storage()?.getItem(PERSIST_MARKER_KEY);
      if (!raw) return null;
      const value = JSON.parse(raw);
      if (!value || value.schemaVersion !== 1) return null;
      if (value.testId !== TEST_ID || value.updaterVersion !== UPDATER_VERSION) return null;
      return value;
    } catch {
      return null;
    }
  }

  function setPersisted(marker) {
    state.status = 'BESTANDEN';
    state.phase = 'UPDATER_PERSISTENCE_BOOTSTRAP';
    state.terminal = true;
    state.persisted = true;
    state.persistedAtMs = Number(marker?.atMs) || Date.now();
    state.activeSlot = marker?.slot ?? state.activeSlot;
    state.blocker = [];
  }

  function installObservabilityBridgeOn(owner) {
    if (!owner) return;
    owner.AIO_V3 = owner.AIO_V3 || {};
    const existing = owner.AIO_V3.operations && typeof owner.AIO_V3.operations === 'object'
      ? owner.AIO_V3.operations
      : {};
    const oldStatus = typeof existing.status === 'function' ? existing.status.bind(existing) : null;
    const oldHeartbeat = typeof existing.hostHeartbeat === 'function'
      ? existing.hostHeartbeat.bind(existing)
      : null;
    const oldReconciliation = typeof existing.reconciliationStatus === 'function'
      ? existing.reconciliationStatus.bind(existing)
      : null;
    const oldPeekTelemetry = typeof existing.peekTelemetry === 'function'
      ? existing.peekTelemetry.bind(existing)
      : null;
    const telemetry = Object.freeze({
      queued: 0,
      dropped: 0,
      lastCapturedSeq: 0,
      lastAcknowledgedSeq: 0
    });

    const status = () => {
      let base = {};
      try {
        const value = oldStatus ? oldStatus() : null;
        if (value && typeof value === 'object') base = value;
      } catch {}
      return {
        ...base,
        schemaVersion: Number(base.schemaVersion) || 1,
        mode: 'V5_AUTONOMOUS_TEST',
        telemetry: base.telemetry && typeof base.telemetry === 'object'
          ? base.telemetry
          : telemetry,
        v5AutonomousTest: clone(state)
      };
    };

    const hostHeartbeat = () => {
      if (oldHeartbeat) {
        try {
          const value = oldHeartbeat();
          if (value && typeof value === 'object') return value;
        } catch {}
      }
      const now = Date.now();
      return {
        schemaVersion: 1,
        mode: 'V5_AUTONOMOUS_TEST',
        alive: true,
        v5Mode: 'V5_AUTONOMOUS_TEST',
        observedAtMs: now,
        v5ObservedAtMs: now
      };
    };

    const reconciliationStatus = () => {
      if (oldReconciliation) {
        try {
          const value = oldReconciliation();
          if (value && typeof value === 'object') return value;
        } catch {}
      }
      return {
        schemaVersion: 1,
        status: state.terminal ? 'TERMINAL' : 'RUNNING',
        v5Terminal: state.terminal === true,
        sameIntentRetry: false,
        v5AutonomousTestStatus: state.status
      };
    };

    const peekTelemetry = limit => {
      if (oldPeekTelemetry) {
        try {
          const rows = oldPeekTelemetry(limit);
          if (Array.isArray(rows)) return rows;
        } catch {}
      }
      return [];
    };

    owner.AIO_V3.operations = {
      ...existing,
      status,
      hostHeartbeat,
      reconciliationStatus,
      peekTelemetry
    };
  }

  function installObservabilityBridge() {
    for (const owner of runtimeRoots())
      installObservabilityBridgeOn(owner);
  }

  function cleanBundleSource() {
    return installV5AutonomousTestIngameUpdater.toString()
      + '\ninstallV5AutonomousTestIngameUpdater();\n\n'
      + installPr208UpdaterRecoveryBootstrapV3.toString()
      + '\ninstallPr208UpdaterRecoveryBootstrapV3();\n';
  }

  async function persistOnce() {
    const existing = persistedMarker();
    if (existing) {
      setPersisted(existing);
      return;
    }

    const safety = safeForCodeSlotPersistence();
    if (!safety.safe) {
      state.phase = 'WAITING_FOR_SAFE_MERCHANT';
      state.blocker = safety.reasons;
      return;
    }

    try {
      const slotInfo = activeSlot();
      state.activeSlot = slotInfo.slot;
      const upload = binding('upload_code');
      if (!upload) throw new Error('UPLOAD_CODE_UNAVAILABLE');
      const bundle = cleanBundleSource();
      const slotName = slotInfo.name || 'AIO V5 Autonomous Tests';
      let result = upload.fn.call(upload.owner, slotInfo.slot, slotName, bundle);
      if (result && typeof result.then === 'function') result = await result;
      if (result?.failed === true) throw new Error('UPLOAD_CODE_FAILED');
      state.codeSlotWrites += 1;

      const marker = {
        schemaVersion: 1,
        testId: TEST_ID,
        updaterVersion: UPDATER_VERSION,
        atMs: Date.now(),
        slot: slotInfo.slot
      };
      storage()?.setItem(PERSIST_MARKER_KEY, JSON.stringify(marker));
      setPersisted(marker);

      const load = binding('load_code');
      if (load) {
        state.codeSlotReloads += 1;
        let reload = load.fn.call(load.owner, slotInfo.slot);
        if (reload && typeof reload.then === 'function') await reload;
      }
    } catch (error) {
      state.status = 'FEHLER';
      state.phase = 'PERSISTENCE_ERROR';
      state.terminal = true;
      state.blocker = [text(error?.message || error || 'PERSISTENCE_FAILED', 240)];
    }
  }

  installObservabilityBridge();

  const api = Object.freeze({
    version: VERSION,
    testId: TEST_ID,
    updaterVersion: UPDATER_VERSION,
    status: () => clone(state),
    persist: persistOnce
  });
  for (const owner of runtimeRoots()) {
    try {
      Object.defineProperty(owner, API_NAME, {
        configurable: true,
        enumerable: true,
        writable: false,
        value: api
      });
    } catch {
      try { owner[API_NAME] = api; } catch {}
    }
  }

  const marker = persistedMarker();
  if (marker) {
    setPersisted(marker);
  } else {
    state.phase = 'HANDSHAKE_READY_PERSISTENCE_DELAY';
    setTimeout(() => { void persistOnce(); }, PERSIST_DELAY_MS);
  }
  return api;
}

installPr208UpdaterRecoveryBootstrapV3();
