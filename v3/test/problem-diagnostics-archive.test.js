'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { promisify } = require('node:util');
const { ProblemDiagnosticsArchive, sanitize } = require('../host/problem-diagnostics-archive');

const gunzip = promisify(zlib.gunzip);

async function tempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aio-v3-diagnostics-'));
}

test('problem diagnostics captures a critical event, redacts secrets and writes an atomic gzip bundle', async (t) => {
  const dir = await tempDir();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  let now = Date.parse('2026-09-16T18:00:00.000Z');
  let events = [{ seq: 1, event: 'WATCHDOG_RESTART_REQUIRED', severity: 'error', reason: 'NO_PROGRESS', component: 'watchdog' }];
  const uploads = [];
  const archive = new ProblemDiagnosticsArchive({
    now: () => now,
    enabled: true,
    botId: 'pi-main',
    spoolDir: dir,
    uploader: { flush: async (spoolDir) => { uploads.push(spoolDir); return { uploaded: 0, reason: 'TEST_NOOP' }; }, status: () => ({ enabled: true }) }
  });
  const client = {
    debugEvents: async (afterSeq) => ({ events: events.filter((row) => row.seq > afterSeq) }),
    debugSnapshot: async () => ({ status: { health: { state: 'DEGRADED' } }, password: 'never-store-me', nested: { authorization: 'Bearer secret', ok: true } })
  };

  const result = await archive.tick(client, { processRunning: true, restartCount: 2, watchdogState: 'HEALTHY' });
  assert.equal(result.captured, true);
  assert.equal(result.bundle.severity, 'ERROR');
  assert.equal(uploads.length, 1);
  const compressed = await fs.readFile(result.bundle.localPath);
  const bundle = JSON.parse((await gunzip(compressed)).toString('utf8'));
  assert.equal(bundle.type, 'AIO_V3_PROBLEM_DIAGNOSTICS_BUNDLE');
  assert.equal(bundle.snapshot.password, '[REDACTED]');
  assert.equal(bundle.snapshot.nested.authorization, '[REDACTED]');
  assert.equal(JSON.stringify(bundle).includes('never-store-me'), false);
  assert.match(result.bundle.sha256, /^[a-f0-9]{64}$/);
  assert.equal((await fs.readdir(path.join(dir, 'pending'))).some((name) => name.endsWith('.part')), false);

  events = [...events, { seq: 2, event: 'WATCHDOG_RESTART_REQUIRED', severity: 'error', reason: 'NO_PROGRESS', component: 'watchdog' }];
  now += 60000;
  const duplicate = await archive.tick(client, { watchdogState: 'HEALTHY' });
  assert.equal(duplicate.captured, false);
  assert.equal(duplicate.reason, 'PROBLEM_DIAGNOSTICS_DEDUPED');
  assert.equal(archive.status().stats.captures, 1);
});

test('host failure still produces a bundle when the browser bridge is unavailable', async (t) => {
  const dir = await tempDir();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const archive = new ProblemDiagnosticsArchive({ enabled: true, spoolDir: dir });
  const result = await archive.tick(null, { processRunning: false, harnessError: 'browser process exited' });
  assert.equal(result.captured, true);
  const bundle = JSON.parse((await gunzip(await fs.readFile(result.bundle.localPath))).toString('utf8'));
  assert.equal(bundle.trigger.type, 'HOST_HARNESS_ERROR');
  assert.equal(bundle.bridge.available, false);
  assert.equal(bundle.bridge.error, 'BOT_CLIENT_UNAVAILABLE');
  assert.equal(archive.status().stats.bridgeFailuresCaptured, 1);
});

test('sanitizer redacts credential-like keys recursively without mutating ordinary values', () => {
  const input = { token: 'abc', nested: { api_key: 'def', character: 'MerchantA' }, rows: [{ cookie: 'ghi', hp: 100 }] };
  const safe = sanitize(input);
  assert.equal(safe.token, '[REDACTED]');
  assert.equal(safe.nested.api_key, '[REDACTED]');
  assert.equal(safe.nested.character, 'MerchantA');
  assert.equal(safe.rows[0].cookie, '[REDACTED]');
  assert.equal(safe.rows[0].hp, 100);
});
