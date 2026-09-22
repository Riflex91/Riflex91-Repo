'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {
  V5_AUTONOMOUS_TEST_BOOTSTRAP_MODE,
  V5_AUTONOMOUS_TEST_MANIFEST_URL,
  V5_AUTONOMOUS_TEST_POLL_MS,
  V5_AUTONOMOUS_TEST_DEPLOY_KEY,
  V5AutonomousTestBootstrap,
  parseV5AutonomousTestManifest,
  buildV5AutonomousTestPackageUrl,
  shouldDeployV5AutonomousTest
} = require('../src/ops/v5-autonomous-test-bootstrap');

function storage() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(String(key), String(value)); },
    removeItem(key) { map.delete(String(key)); }
  };
}

function response(body) {
  return {
    ok: true,
    status: 200,
    headers: { get() { return String(Buffer.byteLength(body, 'utf8')); } },
    async text() { return body; }
  };
}

function fixture({ ctype = 'merchant', evaluateThrows = false } = {}) {
  const store = storage();
  store.setItem('AIO_V5_PR20_5_AUTONOMOUS_TEST_V1', JSON.stringify({
    schemaVersion: 1,
    testId: 'pr20-5-merchant-stability-autonomous-4char',
    status: 'BESTANDEN',
    phase: 'COMPLETE',
    terminal: true
  }));
  const current = {
    testId: 'pr20-5-merchant-stability-autonomous-4char',
    version: '1.2.0',
    status: 'BESTANDEN',
    phase: 'COMPLETE',
    terminal: true
  };
  let runtimeTimer = { active: true };
  let stopCalls = 0;
  let evaluateCalls = 0;
  const root = {
    character: { name: ctype === 'merchant' ? 'MerchantA' : 'RangerA', ctype },
    localStorage: store,
    crypto: crypto.webcrypto,
    AIO_V3_AUTOSTART: true,
    AIO_V3: {
      __runtime: { get timer() { return runtimeTimer; }, set timer(value) { runtimeTimer = value; } },
      operations: { status() { return { v5AutonomousTest: current }; } },
      stop() { stopCalls += 1; runtimeTimer = null; return true; }
    }
  };

  const packageSource = "/* pr20-6-mluck-autonomous-live-5m V5PR206MluckTest */";
  const packageSha256 = crypto.createHash('sha256').update(packageSource).digest('hex');
  const manifest = {
    schemaVersion: 1,
    enabled: true,
    repository: 'Riflex91/Riflex91-Repo',
    branch: 'main',
    gate: 'PR20.6_MLUCK',
    testId: 'pr20-6-mluck-autonomous-live-5m',
    controllerVersion: '1.0.0',
    coordinatorClass: 'merchant',
    workerDistribution: 'PACKAGE_OWNED_COMMAND_CHARACTER',
    deploymentTransport: 'V3_INGAME_BOOTSTRAP',
    requiresPrevious: {
      testId: 'pr20-5-merchant-stability-autonomous-4char',
      stateKey: 'AIO_V5_PR20_5_AUTONOMOUS_TEST_V1',
      terminal: true,
      statuses: ['BESTANDEN']
    },
    sourceCommit: 'a'.repeat(40),
    packagePath: 'v5/werkzeuge/pr20-6-mluck-autonomous-live-5m.js',
    packageSha256,
    maxPackageBytes: 131072,
    expectedGlobal: 'V5PR206MluckTest',
    normalRuntimeAllowed: false
  };
  const packageUrl = buildV5AutonomousTestPackageUrl(parseV5AutonomousTestManifest(manifest));
  let fetchCalls = 0;
  const fetch = async (url) => {
    fetchCalls += 1;
    if (url === V5_AUTONOMOUS_TEST_MANIFEST_URL) return response(JSON.stringify(manifest));
    if (url === packageUrl) return response(packageSource);
    throw new Error('UNEXPECTED_URL:' + url);
  };
  const runtime = { root, now: () => Date.now(), log: { emit() {} } };
  const bootstrap = new V5AutonomousTestBootstrap(runtime, {
    root,
    fetch,
    pollMs: V5_AUTONOMOUS_TEST_POLL_MS,
    evaluate(source, url, parsed, targetRoot) {
      evaluateCalls += 1;
      if (evaluateThrows) throw new Error('AMBIGUOUS_EVALUATION_FAILURE');
      current.testId = parsed.testId;
      current.version = parsed.controllerVersion;
      current.status = 'RUNNING';
      current.phase = 'ROSTER';
      current.terminal = false;
      targetRoot[parsed.expectedGlobal] = {
        version: parsed.controllerVersion,
        status: () => ({ testId: parsed.testId, version: parsed.controllerVersion })
      };
    }
  });
  return {
    bootstrap,
    root,
    store,
    manifest,
    packageUrl,
    get stopCalls() { return stopCalls; },
    get fetchCalls() { return fetchCalls; },
    get evaluateCalls() { return evaluateCalls; }
  };
}

test('V5 manifest is repository-, branch-, commit- and SHA-bound', () => {
  const fx = fixture();
  const parsed = parseV5AutonomousTestManifest(fx.manifest);
  assert.equal(parsed.testId, 'pr20-6-mluck-autonomous-live-5m');
  assert.equal(parsed.sourceCommit, 'a'.repeat(40));
  assert.match(parsed.packageSha256, /^[0-9a-f]{64}$/);
  assert.equal(parsed.normalRuntimeAllowed, false);
  assert.equal(
    buildV5AutonomousTestPackageUrl(parsed),
    'https://raw.githubusercontent.com/Riflex91/Riflex91-Repo/' + 'a'.repeat(40)
      + '/v5/werkzeuge/pr20-6-mluck-autonomous-live-5m.js'
  );
});

test('manifest requires durable terminal evidence from the previous V5 gate', () => {
  const fx = fixture();
  const parsed = parseV5AutonomousTestManifest(fx.manifest);
  assert.equal(parsed.requiresPrevious.testId, 'pr20-5-merchant-stability-autonomous-4char');
  assert.equal(parsed.requiresPrevious.stateKey, 'AIO_V5_PR20_5_AUTONOMOUS_TEST_V1');
  assert.deepEqual(parsed.requiresPrevious.statuses, ['BESTANDEN']);
});

test('deployment advances only from no test or a terminal previous test', () => {
  assert.equal(shouldDeployV5AutonomousTest('next', null, false), true);
  assert.equal(shouldDeployV5AutonomousTest('next', 'next', false), false);
  assert.equal(shouldDeployV5AutonomousTest('next', 'old', false), false);
  assert.equal(shouldDeployV5AutonomousTest('next', 'old', true), true);
});

test('merchant downloads verified package, stops V3, and starts desired V5 test', async () => {
  const fx = fixture();
  const changed = await fx.bootstrap.cycle();
  assert.equal(changed, true);
  assert.equal(fx.stopCalls, 1);
  assert.equal(fx.evaluateCalls, 1);
  assert.equal(fx.root.AIO_V3_AUTOSTART, false);
  assert.equal(fx.bootstrap.status().mode, V5_AUTONOMOUS_TEST_BOOTSTRAP_MODE);
  assert.equal(fx.bootstrap.status().phase, 'LOADED');
  assert.equal(fx.bootstrap.status().loadedTestId, fx.manifest.testId);
  const deployment = JSON.parse(fx.store.getItem(V5_AUTONOMOUS_TEST_DEPLOY_KEY));
  assert.equal(deployment.status, 'COMMITTED');
  assert.equal(deployment.sameIntentRetry, false);
});

test('missing durable previous-gate evidence blocks before package download', async () => {
  const fx = fixture();
  fx.store.removeItem('AIO_V5_PR20_5_AUTONOMOUS_TEST_V1');
  assert.equal(await fx.bootstrap.cycle(), false);
  assert.equal(fx.fetchCalls, 1);
  assert.equal(fx.evaluateCalls, 0);
  assert.equal(fx.stopCalls, 0);
  assert.equal(fx.bootstrap.status().phase, 'PREVIOUS_TEST_TERMINAL_EVIDENCE_MISSING');
});

test('farmer never fetches repository code', async () => {
  const fx = fixture({ ctype: 'ranger' });
  const changed = await fx.bootstrap.cycle();
  assert.equal(changed, false);
  assert.equal(fx.fetchCalls, 0);
  assert.equal(fx.evaluateCalls, 0);
  assert.equal(fx.stopCalls, 0);
  assert.equal(fx.bootstrap.status().phase, 'NOT_MERCHANT');
});

test('ambiguous evaluation boundary is never retried automatically', async () => {
  const fx = fixture({ evaluateThrows: true });
  assert.equal(await fx.bootstrap.cycle(), false);
  assert.equal(fx.evaluateCalls, 1);
  assert.equal(fx.stopCalls, 1);
  const first = JSON.parse(fx.store.getItem(V5_AUTONOMOUS_TEST_DEPLOY_KEY));
  assert.equal(first.status, 'EVALUATION_BOUNDARY_ENTERED');
  assert.equal(first.sameIntentRetry, false);

  assert.equal(await fx.bootstrap.cycle(), false);
  assert.equal(fx.evaluateCalls, 1);
  assert.equal(fx.stopCalls, 1);
  assert.equal(fx.bootstrap.status().phase, 'DEPLOYMENT_UNKNOWN_NO_RETRY');
});
