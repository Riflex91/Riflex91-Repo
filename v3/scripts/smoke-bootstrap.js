'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('node:assert/strict');
const { RELEASE_VERSION } = require('../src/release-version');

function makeSandbox(fetchFn) {
  const sandbox = {
    console,
    Date,
    Promise,
    setTimeout,
    clearTimeout,
    AIO_V3_AUTOSTART: false,
    fetch: fetchFn
  };
  sandbox.parent = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  return sandbox;
}

async function main() {
  const loader = fs.readFileSync(path.resolve(__dirname, '../dist/aio-v3.js'), 'utf8');
  assert.ok(loader.length >= 10000, 'bootstrap must remain compatible with legacy updater validation');
  assert.ok(loader.length <= 256000, 'bootstrap must stay comfortably below the Adventure Land code-slot limit');
  assert.ok(loader.includes(`Adventure Land AiO Bot ${RELEASE_VERSION} | generated`));
  assert.ok(loader.includes('cloudflare-bootstrap-loader-v1'));

  const runtimeStub = `/* Adventure Land AiO Bot ${RELEASE_VERSION} | generated | remote runtime */\n` +
    `(function(root){ root.AIO_V3={version:${JSON.stringify(RELEASE_VERSION)},status:function(){return {version:${JSON.stringify(RELEASE_VERSION)},running:true};}}; })(globalThis);\n` +
    `/* ${'runtime-smoke-padding '.repeat(700)} */\n`;

  let requestedUrl = null;
  const sandbox = makeSandbox(async (url) => {
    requestedUrl = String(url);
    return { ok: true, status: 200, text: async () => runtimeStub };
  });
  vm.runInContext(loader, sandbox);

  assert.ok(sandbox.AIO_V3_BOOTSTRAP);
  assert.ok(sandbox.AIO_V3_BOOTSTRAP.promise);
  await sandbox.AIO_V3_BOOTSTRAP.promise;
  assert.equal(sandbox.AIO_V3_BOOTSTRAP.ready, true);
  assert.equal(sandbox.AIO_V3_BOOTSTRAP.runtimeVersion, RELEASE_VERSION);
  assert.equal(sandbox.AIO_V3.version, RELEASE_VERSION);
  assert.equal(sandbox.AIO_V3_AUTO_UPDATE_CONFIG.reloadHandshakeTimeoutMs, 60000);
  assert.match(requestedUrl, /\/v3\/dist\/aio-v3-runtime\.js\?/);

  let releaseRuntime;
  const delayedSandbox = makeSandbox(async () => ({
    ok: true,
    status: 200,
    text: () => new Promise((resolve) => { releaseRuntime = resolve; })
  }));
  vm.runInContext(loader, delayedSandbox);
  await Promise.resolve();
  await Promise.resolve();
  delayedSandbox.AIO_V3 = { version: '3.0.0-alpha.0.0' };
  releaseRuntime(runtimeStub);
  await delayedSandbox.AIO_V3_BOOTSTRAP.promise;

  assert.equal(delayedSandbox.AIO_V3.version, '3.0.0-alpha.0.0');
  assert.equal(delayedSandbox.AIO_V3_BOOTSTRAP.ready, false);
  assert.equal(delayedSandbox.AIO_V3_BOOTSTRAP.lastError.reason, 'RUNTIME_ACTIVATION_CANCELLED_AFTER_ROLLBACK');
  console.log('bootstrap smoke OK');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
