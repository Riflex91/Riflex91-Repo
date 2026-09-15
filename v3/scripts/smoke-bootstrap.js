'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('node:assert/strict');
const { RELEASE_VERSION } = require('../src/release-version');

function makeSandbox(fetchFn, bootstrapConfig = null) {
  const sandbox = {
    console,
    Date,
    Math,
    Promise,
    setTimeout,
    clearTimeout,
    AIO_V3_AUTOSTART: false,
    fetch: fetchFn
  };
  if (bootstrapConfig) sandbox.AIO_V3_BOOTSTRAP_CONFIG = bootstrapConfig;
  sandbox.parent = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  return sandbox;
}

async function waitFor(predicate, timeoutMs = 2000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return false;
}

async function main() {
  const loader = fs.readFileSync(path.resolve(__dirname, '../dist/aio-v3.js'), 'utf8');
  assert.ok(loader.length >= 10000, 'bootstrap must remain compatible with legacy updater validation');
  assert.ok(loader.length <= 256000, 'bootstrap must stay comfortably below the Adventure Land code-slot limit');
  assert.ok(loader.includes(`Adventure Land AiO Bot ${RELEASE_VERSION} | generated`));
  assert.ok(loader.includes('cloudflare-bootstrap-loader-v1'));

  const runtimeStub = `/* Adventure Land AiO Bot ${RELEASE_VERSION} | generated | remote runtime */\n` +
    `(function(root){ root.AIO_V3={version:${JSON.stringify(RELEASE_VERSION)},__runtime:{startedAt:Date.now(),lastHeartbeat:Date.now()},status:function(){return {version:${JSON.stringify(RELEASE_VERSION)},running:true};},stop:function(){return true;}}; })(globalThis);\n` +
    `/* ${'runtime-smoke-padding '.repeat(700)} */\n`;

  let requestedUrl = null;
  const sandbox = makeSandbox(async (url) => {
    requestedUrl = String(url);
    return { ok: true, status: 200, text: async () => runtimeStub };
  });
  vm.runInContext(loader, sandbox);

  assert.ok(sandbox.AIO_V3_BOOTSTRAP);
  assert.ok(sandbox.AIO_V3_BOOTSTRAP.promise);
  assert.equal(sandbox.AIO_V3.__aioV3BootstrapProxy, true, 'bootstrap must expose an immediate updater handshake proxy');
  assert.equal(sandbox.AIO_V3.version, RELEASE_VERSION);
  assert.equal(sandbox.AIO_V3.status().version, RELEASE_VERSION);
  assert.equal(sandbox.AIO_V3.status().running, true);
  assert.ok(sandbox.AIO_V3.__runtime.startedAt > 0);
  const firstProxy = sandbox.AIO_V3;

  await sandbox.AIO_V3_BOOTSTRAP.promise;
  assert.equal(sandbox.AIO_V3_BOOTSTRAP.ready, true);
  assert.equal(sandbox.AIO_V3_BOOTSTRAP.runtimeVersion, RELEASE_VERSION);
  assert.equal(sandbox.AIO_V3.version, RELEASE_VERSION);
  assert.notEqual(sandbox.AIO_V3, firstProxy, 'full runtime must atomically replace the bootstrap proxy');
  assert.equal(sandbox.AIO_V3.__aioV3BootstrapProxy, undefined);
  assert.equal(sandbox.AIO_V3_AUTO_UPDATE_CONFIG.reloadHandshakeTimeoutMs, 60000);
  assert.match(requestedUrl, /\/v3\/dist\/aio-v3-runtime\.js\?/);

  let releaseRuntime;
  const delayedSandbox = makeSandbox(async () => ({
    ok: true,
    status: 200,
    text: () => new Promise((resolve) => { releaseRuntime = resolve; })
  }));
  vm.runInContext(loader, delayedSandbox);
  const delayedProxy = delayedSandbox.AIO_V3;
  assert.equal(delayedProxy.__aioV3BootstrapProxy, true);
  assert.equal(delayedProxy.status().running, true);
  await Promise.resolve();
  await Promise.resolve();
  delayedSandbox.AIO_V3 = {
    version: '3.0.0-alpha.0.0',
    __runtime: { startedAt: Date.now(), lastHeartbeat: Date.now() },
    status() { return { version: this.version, running: true }; }
  };
  releaseRuntime(runtimeStub);
  await delayedSandbox.AIO_V3_BOOTSTRAP.promise;

  assert.equal(delayedSandbox.AIO_V3.version, '3.0.0-alpha.0.0');
  assert.equal(delayedSandbox.AIO_V3_BOOTSTRAP.ready, false);
  assert.equal(delayedSandbox.AIO_V3_BOOTSTRAP.lastError.reason, 'BOOTSTRAP_ACTIVATION_SUPERSEDED');
  assert.equal(delayedSandbox.AIO_V3_BOOTSTRAP.nextRetryAt, null);

  let retryFetches = 0;
  const retrySandbox = makeSandbox(async () => {
    retryFetches += 1;
    if (retryFetches === 1) return { ok: false, status: 503, text: async () => '' };
    return { ok: true, status: 200, text: async () => runtimeStub };
  }, { retryBaseMs: 10, retryMaxMs: 20 });
  vm.runInContext(loader, retrySandbox);
  const retryProxy = retrySandbox.AIO_V3;
  assert.equal(retryProxy.__aioV3BootstrapProxy, true);
  await retrySandbox.AIO_V3_BOOTSTRAP.promise;
  assert.equal(retrySandbox.AIO_V3, retryProxy, 'failed download must keep the handshake proxy alive');
  assert.equal(retrySandbox.AIO_V3_BOOTSTRAP.lastError.reason, 'RUNTIME_HTTP_503');
  assert.ok(retrySandbox.AIO_V3_BOOTSTRAP.nextRetryAt > 0);
  assert.equal(await waitFor(() => retrySandbox.AIO_V3_BOOTSTRAP.ready === true), true, 'bootstrap retry should recover automatically');
  assert.equal(retryFetches, 2);
  assert.equal(retrySandbox.AIO_V3.version, RELEASE_VERSION);
  assert.notEqual(retrySandbox.AIO_V3, retryProxy);
  assert.equal(retrySandbox.AIO_V3_BOOTSTRAP.failures, 1);
  assert.equal(retrySandbox.AIO_V3_BOOTSTRAP.attempts, 2);

  console.log('bootstrap smoke OK');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
