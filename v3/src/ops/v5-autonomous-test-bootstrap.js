'use strict';

const V5_AUTONOMOUS_TEST_BOOTSTRAP_MODE = 'v5-ingame-test-bootstrap-v1';
const V5_AUTONOMOUS_TEST_MANIFEST_URL =
  'https://raw.githubusercontent.com/Riflex91/Riflex91-Repo/main/v5/roadmap/v5-autonomous-test-manifest.json';
const V5_AUTONOMOUS_TEST_REPOSITORY = 'Riflex91/Riflex91-Repo';
const V5_AUTONOMOUS_TEST_BRANCH = 'main';
const V5_AUTONOMOUS_TEST_PACKAGE_PREFIX = 'v5/werkzeuge/';
const V5_AUTONOMOUS_TEST_POLL_MS = 15_000;
const V5_AUTONOMOUS_TEST_MANIFEST_MAX_BYTES = 32 * 1024;
const V5_AUTONOMOUS_TEST_PACKAGE_HARD_MAX_BYTES = 128 * 1024;
const V5_AUTONOMOUS_TEST_DEPLOY_KEY = 'AIO_V5_TEST_BOOTSTRAP_DEPLOY_V1';

function text(value, max = 300) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function lowerHex(value, length) {
  const normalized = text(value, length + 1).toLowerCase();
  return normalized.length === length && /^[0-9a-f]+$/.test(normalized)
    ? normalized
    : null;
}

function packagePath(value) {
  const normalized = text(value, 220).replace(/\\/g, '/');
  if (!normalized.startsWith(V5_AUTONOMOUS_TEST_PACKAGE_PREFIX)) return null;
  if (!normalized.endsWith('.js')) return null;
  if (normalized.includes('..') || normalized.includes('//')) return null;
  return normalized;
}

function parseV5AutonomousTestManifest(value) {
  let raw = value;
  if (typeof raw === 'string') raw = JSON.parse(raw);
  if (!raw || typeof raw !== 'object') throw new Error('V5_TEST_MANIFEST_INVALID');
  if (raw.schemaVersion !== 1 || raw.enabled !== true) throw new Error('V5_TEST_MANIFEST_DISABLED_OR_SCHEMA');
  if (raw.repository !== V5_AUTONOMOUS_TEST_REPOSITORY) throw new Error('V5_TEST_MANIFEST_REPOSITORY');
  if (raw.branch !== V5_AUTONOMOUS_TEST_BRANCH) throw new Error('V5_TEST_MANIFEST_BRANCH');
  if (raw.coordinatorClass !== 'merchant') throw new Error('V5_TEST_MANIFEST_COORDINATOR');
  if (raw.workerDistribution !== 'PACKAGE_OWNED_COMMAND_CHARACTER') throw new Error('V5_TEST_MANIFEST_WORKER_DISTRIBUTION');
  if (raw.deploymentTransport && raw.deploymentTransport !== 'V3_INGAME_BOOTSTRAP') {
    throw new Error('V5_TEST_MANIFEST_DEPLOYMENT_TRANSPORT');
  }

  const sourceCommit = lowerHex(raw.sourceCommit, 40);
  const packageSha256 = lowerHex(raw.packageSha256, 64);
  const path = packagePath(raw.packagePath);
  const maxPackageBytes = Number(raw.maxPackageBytes);
  const gate = text(raw.gate, 120);
  const testId = text(raw.testId, 160);
  const controllerVersion = text(raw.controllerVersion, 80);
  const expectedGlobal = text(raw.expectedGlobal, 120);
  let requiresPrevious = null;
  if (raw.requiresPrevious != null) {
    if (!raw.requiresPrevious || typeof raw.requiresPrevious !== 'object') {
      throw new Error('V5_TEST_MANIFEST_PREVIOUS_INVALID');
    }
    const previousTestId = text(raw.requiresPrevious.testId, 160);
    const previousStateKey = text(raw.requiresPrevious.stateKey, 180);
    const statuses = Array.isArray(raw.requiresPrevious.statuses)
      ? raw.requiresPrevious.statuses.map((value) => text(value, 80)).filter(Boolean)
      : [];
    if (!previousTestId || !previousStateKey || statuses.length < 1
        || raw.requiresPrevious.terminal !== true) {
      throw new Error('V5_TEST_MANIFEST_PREVIOUS_FIELDS');
    }
    requiresPrevious = Object.freeze({
      testId: previousTestId,
      stateKey: previousStateKey,
      terminal: true,
      statuses: Object.freeze(statuses)
    });
  }

  if (!sourceCommit) throw new Error('V5_TEST_MANIFEST_COMMIT');
  if (!packageSha256) throw new Error('V5_TEST_MANIFEST_SHA256');
  if (!path) throw new Error('V5_TEST_MANIFEST_PACKAGE_PATH');
  if (!gate || !testId || !controllerVersion || !expectedGlobal) throw new Error('V5_TEST_MANIFEST_FIELDS');
  if (!Number.isSafeInteger(maxPackageBytes)
      || maxPackageBytes < 1024
      || maxPackageBytes > V5_AUTONOMOUS_TEST_PACKAGE_HARD_MAX_BYTES) {
    throw new Error('V5_TEST_MANIFEST_PACKAGE_LIMIT');
  }

  return Object.freeze({
    schemaVersion: 1,
    gate,
    testId,
    controllerVersion,
    sourceCommit,
    packagePath: path,
    packageSha256,
    maxPackageBytes,
    expectedGlobal,
    requiresPrevious,
    normalRuntimeAllowed: raw.normalRuntimeAllowed === true
  });
}

function buildV5AutonomousTestPackageUrl(manifest) {
  return 'https://raw.githubusercontent.com/'
    + V5_AUTONOMOUS_TEST_REPOSITORY + '/'
    + manifest.sourceCommit + '/'
    + manifest.packagePath;
}

function currentV5AutonomousTest(root) {
  try {
    const operations = root && root.AIO_V3 && root.AIO_V3.operations;
    const status = operations && typeof operations.status === 'function'
      ? operations.status()
      : null;
    const current = status && status.v5AutonomousTest;
    return current && typeof current === 'object' ? current : null;
  } catch (_) {
    return null;
  }
}

function shouldDeployV5AutonomousTest(desiredTestId, currentTestId, currentTerminal) {
  if (!currentTestId) return true;
  if (String(currentTestId) === String(desiredTestId)) return false;
  return currentTerminal === true;
}

function characterClass(root) {
  try {
    return text(root && root.character && root.character.ctype, 40).toLowerCase();
  } catch (_) {
    return '';
  }
}

function utf8Bytes(value) {
  const source = String(value || '');
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(source);
  const encoded = unescape(encodeURIComponent(source));
  const bytes = new Uint8Array(encoded.length);
  for (let i = 0; i < encoded.length; i += 1) bytes[i] = encoded.charCodeAt(i);
  return bytes;
}

async function sha256Hex(root, bytes) {
  const cryptoObject = root && root.crypto && root.crypto.subtle
    ? root.crypto
    : (typeof crypto !== 'undefined' && crypto && crypto.subtle ? crypto : null);
  if (!cryptoObject || !cryptoObject.subtle || typeof cryptoObject.subtle.digest !== 'function') {
    throw new Error('V5_TEST_WEB_CRYPTO_UNAVAILABLE');
  }
  const digest = await cryptoObject.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

class V5AutonomousTestBootstrap {
  constructor(runtime, options = {}) {
    if (!runtime) throw new Error('runtime required');
    this.runtime = runtime;
    this.root = options.root || runtime.root || globalThis;
    this.now = options.now || runtime.now || (() => Date.now());
    this.fetchFn = options.fetch
      || this.root && this.root.fetch
      || (typeof fetch === 'function' ? fetch : null);
    this.evaluateFn = typeof options.evaluate === 'function' ? options.evaluate : null;
    this.pollMs = Math.max(5000, Number(options.pollMs) || V5_AUTONOMOUS_TEST_POLL_MS);
    this.timer = null;
    this.busy = false;
    this.state = {
      schemaVersion: 1,
      mode: V5_AUTONOMOUS_TEST_BOOTSTRAP_MODE,
      phase: 'IDLE',
      running: false,
      characterClass: characterClass(this.root),
      lastCheckAtMs: null,
      lastSuccessAtMs: null,
      desiredTestId: null,
      desiredGate: null,
      desiredSourceCommit: null,
      desiredSha256: null,
      loadedTestId: null,
      loadedSourceCommit: null,
      loadedSha256: null,
      lastError: null,
      deploymentTransport: 'V3_INGAME_BOOTSTRAP',
      windowsBridgeDeployment: false,
      farmerRepositoryFetch: false
    };
  }

  _emit(event, severity = 'info', reason = null, data = {}) {
    try {
      if (this.runtime.log && typeof this.runtime.log.emit === 'function') {
        this.runtime.log.emit({
          component: 'v5-test-bootstrap',
          event,
          severity,
          reason,
          data
        });
      }
    } catch (_) {}
  }

  _storage() {
    try {
      if (this.root && this.root.localStorage) return this.root.localStorage;
    } catch (_) {}
    return null;
  }

  _readDeployment() {
    const store = this._storage();
    if (!store) return null;
    try {
      const raw = store.getItem(V5_AUTONOMOUS_TEST_DEPLOY_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  _writeDeployment(value) {
    const store = this._storage();
    if (!store) throw new Error('V5_TEST_DEPLOY_STORAGE_UNAVAILABLE');
    const serialized = JSON.stringify(value);
    store.setItem(V5_AUTONOMOUS_TEST_DEPLOY_KEY, serialized);
    if (store.getItem(V5_AUTONOMOUS_TEST_DEPLOY_KEY) !== serialized) {
      throw new Error('V5_TEST_DEPLOY_STORAGE_ROUNDTRIP_FAILED');
    }
    return value;
  }

  async _fetchText(url, maximumBytes) {
    if (!this.fetchFn) throw new Error('V5_TEST_FETCH_UNAVAILABLE');
    const response = await this.fetchFn.call(this.root, url, {
      cache: 'no-store',
      credentials: 'omit'
    });
    if (!response || !response.ok) {
      throw new Error('V5_TEST_HTTP_' + String(response && response.status || 'FAILED'));
    }
    const declared = Number(response.headers && response.headers.get
      ? response.headers.get('content-length')
      : 0);
    if (Number.isFinite(declared) && declared > maximumBytes) {
      throw new Error('V5_TEST_DOWNLOAD_TOO_LARGE');
    }
    const body = String(await response.text());
    const bytes = utf8Bytes(body);
    if (bytes.byteLength < 1 || bytes.byteLength > maximumBytes) {
      throw new Error('V5_TEST_DOWNLOAD_SIZE_INVALID');
    }
    return { body, bytes };
  }

  async _quiesceV3() {
    const api = this.root && this.root.AIO_V3;
    if (!api) return true;
    try { this.root.AIO_V3_AUTOSTART = false; } catch (_) {}
    if (typeof api.stop === 'function') {
      const result = api.stop();
      if (result && typeof result.then === 'function') await result;
    }
    if (api.__runtime && api.__runtime.timer) {
      throw new Error('V5_TEST_V3_RUNTIME_STILL_ACTIVE');
    }
    return true;
  }

  _evaluate(source, sourceUrl, manifest) {
    if (this.evaluateFn) return this.evaluateFn(source, sourceUrl, manifest, this.root);
    const code = String(source || '') + '\n//# sourceURL=' + sourceUrl;
    if (this.root && typeof this.root.eval === 'function') return this.root.eval(code);
    return (0, eval)(code);
  }

  _previousGateSatisfied(manifest) {
    const required = manifest && manifest.requiresPrevious;
    if (!required) return true;
    const store = this._storage();
    if (!store) return false;
    try {
      const raw = store.getItem(required.stateKey);
      if (!raw) return false;
      const state = JSON.parse(raw);
      return !!state
        && typeof state === 'object'
        && String(state.testId || '') === required.testId
        && state.terminal === true
        && required.statuses.includes(String(state.status || ''));
    } catch (_) {
      return false;
    }
  }

  _reconcileDeployment(manifest, current) {
    const deployment = this._readDeployment();
    if (!deployment || deployment.schemaVersion !== 1) return { blocked: false };

    const sameIntent = deployment.testId === manifest.testId
      && deployment.sourceCommit === manifest.sourceCommit
      && deployment.packageSha256 === manifest.packageSha256;

    if (sameIntent && current && String(current.testId || '') === manifest.testId) {
      if (deployment.status !== 'COMMITTED') {
        this._writeDeployment({
          ...deployment,
          status: 'COMMITTED',
          committedAtMs: this.now(),
          reconciled: true
        });
      }
      return { blocked: true, committed: true, reason: 'DESIRED_TEST_RECONCILED' };
    }

    if (sameIntent && deployment.status === 'EVALUATION_BOUNDARY_ENTERED') {
      return { blocked: true, committed: false, reason: 'DEPLOYMENT_UNKNOWN_NO_RETRY' };
    }

    if (!sameIntent
        && deployment.status === 'EVALUATION_BOUNDARY_ENTERED') {
      return { blocked: true, committed: false, reason: 'OLDER_DEPLOYMENT_UNKNOWN_NO_ADVANCE' };
    }

    return { blocked: false };
  }

  async cycle() {
    if (this.busy) return false;
    this.state.characterClass = characterClass(this.root);
    if (this.state.characterClass !== 'merchant') {
      this.state.phase = 'NOT_MERCHANT';
      this.state.lastError = null;
      return false;
    }

    this.busy = true;
    this.state.lastCheckAtMs = this.now();
    try {
      this.state.phase = 'FETCH_MANIFEST';
      const manifestDownload = await this._fetchText(
        V5_AUTONOMOUS_TEST_MANIFEST_URL,
        V5_AUTONOMOUS_TEST_MANIFEST_MAX_BYTES
      );
      const manifest = parseV5AutonomousTestManifest(manifestDownload.body);
      this.state.desiredTestId = manifest.testId;
      this.state.desiredGate = manifest.gate;
      this.state.desiredSourceCommit = manifest.sourceCommit;
      this.state.desiredSha256 = manifest.packageSha256;

      const current = currentV5AutonomousTest(this.root);
      if (!this._previousGateSatisfied(manifest)) {
        this.state.phase = 'PREVIOUS_TEST_TERMINAL_EVIDENCE_MISSING';
        this.state.lastError = {
          atMs: this.now(),
          reason: 'PREVIOUS_TEST_TERMINAL_EVIDENCE_MISSING'
        };
        return false;
      }
      const reconciled = this._reconcileDeployment(manifest, current);
      if (reconciled.blocked) {
        this.state.phase = reconciled.reason;
        if (reconciled.committed) {
          this.state.loadedTestId = manifest.testId;
          this.state.loadedSourceCommit = manifest.sourceCommit;
          this.state.loadedSha256 = manifest.packageSha256;
          this.state.lastSuccessAtMs = this.now();
          this.state.lastError = null;
        }
        return false;
      }

      const currentId = current ? text(current.testId, 160) : '';
      const currentTerminal = !!(current && current.terminal === true);
      if (!shouldDeployV5AutonomousTest(manifest.testId, currentId, currentTerminal)) {
        this.state.phase = currentId === manifest.testId
          ? 'DESIRED_TEST_ALREADY_PRESENT'
          : 'OTHER_V5_TEST_NONTERMINAL';
        this.state.lastSuccessAtMs = this.now();
        this.state.lastError = null;
        return false;
      }

      this.state.phase = 'FETCH_PACKAGE';
      const packageUrl = buildV5AutonomousTestPackageUrl(manifest);
      const packageDownload = await this._fetchText(packageUrl, manifest.maxPackageBytes);
      const actualSha256 = await sha256Hex(this.root, packageDownload.bytes);
      if (actualSha256 !== manifest.packageSha256) {
        throw new Error('V5_TEST_PACKAGE_SHA256_MISMATCH');
      }
      if (!packageDownload.body.includes(manifest.testId)
          || !packageDownload.body.includes(manifest.expectedGlobal)) {
        throw new Error('V5_TEST_PACKAGE_MARKER_MISSING');
      }

      const before = currentV5AutonomousTest(this.root);
      const beforeId = before ? text(before.testId, 160) : '';
      const beforeTerminal = !!(before && before.terminal === true);
      if (!shouldDeployV5AutonomousTest(manifest.testId, beforeId, beforeTerminal)) {
        this.state.phase = beforeId === manifest.testId
          ? 'DESIRED_TEST_ALREADY_PRESENT'
          : 'ACTIVE_TEST_CHANGED_BEFORE_LOAD';
        return false;
      }

      const intent = {
        schemaVersion: 1,
        status: 'EVALUATION_BOUNDARY_ENTERED',
        testId: manifest.testId,
        sourceCommit: manifest.sourceCommit,
        packageSha256: manifest.packageSha256,
        enteredAtMs: this.now(),
        sameIntentRetry: false
      };
      this._writeDeployment(intent);

      this.state.phase = 'QUIESCE_V3';
      await this._quiesceV3();

      this.state.phase = 'EVALUATE_VERIFIED_PACKAGE';
      this._evaluate(packageDownload.body, packageUrl, manifest);

      const api = this.root && this.root[manifest.expectedGlobal];
      if (!api || typeof api.status !== 'function') {
        throw new Error('V5_TEST_PACKAGE_API_NOT_INSTALLED');
      }
      const installed = api.status();
      if (text(installed && installed.testId, 160) !== manifest.testId) {
        throw new Error('V5_TEST_PACKAGE_API_TEST_ID_MISMATCH');
      }
      if (text(installed && installed.version, 80) !== manifest.controllerVersion) {
        throw new Error('V5_TEST_PACKAGE_API_VERSION_MISMATCH');
      }

      this._writeDeployment({
        ...intent,
        status: 'COMMITTED',
        committedAtMs: this.now()
      });

      this.state.phase = 'LOADED';
      this.state.loadedTestId = manifest.testId;
      this.state.loadedSourceCommit = manifest.sourceCommit;
      this.state.loadedSha256 = manifest.packageSha256;
      this.state.lastSuccessAtMs = this.now();
      this.state.lastError = null;
      this._emit('V5_TEST_PACKAGE_LOADED', 'info', 'VERIFIED_PACKAGE_STARTED', {
        testId: manifest.testId,
        gate: manifest.gate,
        sourceCommit: manifest.sourceCommit
      });
      return true;
    } catch (error) {
      const reason = text(error && error.message || error, 240) || 'V5_TEST_BOOTSTRAP_FAILED';
      this.state.phase = reason.includes('UNKNOWN_NO_RETRY') ? reason : 'BLOCKED';
      this.state.lastError = { atMs: this.now(), reason };
      this._emit('V5_TEST_BOOTSTRAP_BLOCKED', 'warn', reason, {
        desiredTestId: this.state.desiredTestId,
        sameIntentRetry: false
      });
      return false;
    } finally {
      this.busy = false;
    }
  }

  start() {
    if (this.timer) return false;
    this.state.running = true;
    const setTimer = this.root && typeof this.root.setInterval === 'function'
      ? this.root.setInterval
      : (typeof setInterval === 'function' ? setInterval : null);
    if (setTimer) {
      this.timer = setTimer.call(this.root, () => {
        Promise.resolve(this.cycle()).catch(() => {});
      }, this.pollMs);
    }
    Promise.resolve(this.cycle()).catch(() => {});
    return true;
  }

  stop() {
    if (this.timer) {
      const clearTimer = this.root && typeof this.root.clearInterval === 'function'
        ? this.root.clearInterval
        : (typeof clearInterval === 'function' ? clearInterval : null);
      if (clearTimer) {
        try { clearTimer.call(this.root, this.timer); } catch (_) {}
      }
      this.timer = null;
    }
    this.state.running = false;
    return true;
  }

  status() {
    return {
      ...this.state,
      busy: this.busy,
      pollMs: this.pollMs,
      manifestUrl: V5_AUTONOMOUS_TEST_MANIFEST_URL,
      deployment: this._readDeployment()
    };
  }
}

function installV5AutonomousTestBootstrap(runtime, options = {}) {
  if (runtime.v5AutonomousTestBootstrap) return runtime.v5AutonomousTestBootstrap;
  const bootstrap = new V5AutonomousTestBootstrap(runtime, options);
  runtime.v5AutonomousTestBootstrap = bootstrap;
  try {
    if (bootstrap.root) bootstrap.root.AIO_V3_V5_TEST_BOOTSTRAP = bootstrap;
  } catch (_) {}
  if (options.autoStart !== false) bootstrap.start();
  return bootstrap;
}

module.exports = {
  V5_AUTONOMOUS_TEST_BOOTSTRAP_MODE,
  V5_AUTONOMOUS_TEST_MANIFEST_URL,
  V5_AUTONOMOUS_TEST_POLL_MS,
  V5_AUTONOMOUS_TEST_DEPLOY_KEY,
  V5AutonomousTestBootstrap,
  installV5AutonomousTestBootstrap,
  parseV5AutonomousTestManifest,
  buildV5AutonomousTestPackageUrl,
  currentV5AutonomousTest,
  shouldDeployV5AutonomousTest,
  utf8Bytes,
  sha256Hex
};
