function installV5AutonomousTestIngameUpdaterV102() {
  'use strict';

  const API_NAME = 'V5AutonomousTestIngameUpdater';
  const VERSION = '1.0.2';
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
      && text(active?.version, 80) === '1.0.1'
      && manifest.controllerVersion === '1.0.2'
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

  function safeSameTestVersionUpgrade(active, manifest) {
    const legacyWaitUpgrade = manifest.testId === 'pr20-6-mluck-autonomous-live-5m'
      && text(active?.version, 80) === '1.0.0'
      && manifest.controllerVersion === '1.0.1'
      && active?.terminal !== true
      && text(active?.status, 80) === 'WAITING_FOR_4_CHARACTERS'
      && text(active?.phase, 80) === 'ROSTER'
      && zeroWriteSameIntentState(active);
    return legacyWaitUpgrade || safeTerminalPr206RecoveryUpgrade(active, manifest);
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
    return '(' + installV5AutonomousTestIngameUpdaterV102.toString() + ')();\n';
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

    if (characterClass() !== 'merchant') {
      state.phase = 'NOT_MERCHANT';
      return clone(state);
    }

    try {
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

installV5AutonomousTestIngameUpdaterV102();


(() => {
  'use strict';
  const TEST_ID = 'pr20-6-native-updater-recovery-bootstrap-v1';
  const VERSION = '1.0.0';
  const state = Object.freeze({
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    status: 'BESTANDEN',
    phase: 'UPDATER_RECOVERY_BOOTSTRAP',
    terminal: true,
    gameplayWrites: 0,
    rawWriteCalls: 0,
    sameIntentRetry: false,
    intents: [],
    updaterVersion: '1.0.2',
    normalRuntimeAllowed: false,
    observedAtMs: Date.now()
  });

  const root = (() => {
    try {
      return globalThis.parent && globalThis.parent !== globalThis
        ? globalThis.parent
        : globalThis;
    } catch {
      return globalThis;
    }
  })();

  root.AIO_V3 = root.AIO_V3 || {};
  const existing = root.AIO_V3.operations && typeof root.AIO_V3.operations === 'object'
    ? root.AIO_V3.operations
    : {};
  const oldStatus = typeof existing.status === 'function' ? existing.status.bind(existing) : null;
  root.AIO_V3.operations = {
    ...existing,
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
        v5AutonomousTest: state
      };
    }
  };

  globalThis.V5PR206UpdaterRecoveryBootstrap = Object.freeze({
    version: VERSION,
    testId: TEST_ID,
    updaterVersion: '1.0.2',
    status: () => ({ ...state })
  });
})();
