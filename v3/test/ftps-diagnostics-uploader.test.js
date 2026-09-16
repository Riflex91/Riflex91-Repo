'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { FtpsDiagnosticsUploader } = require('../host/ftps-diagnostics-uploader');

async function tempDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aio-v3-ftps-'));
  await fs.mkdir(path.join(dir, 'pending'), { recursive: true });
  return dir;
}

async function sourceBuffer(source) {
  if (typeof source === 'string') return fs.readFile(source);
  const chunks = [];
  for await (const chunk of source) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function fakeClient(remote = new Map(), options = {}) {
  return {
    accessCalls: [],
    closed: false,
    async access(config) {
      this.accessCalls.push({ ...config, password: config.password ? '[REDACTED]' : null });
      if (options.failAccess) throw new Error(options.failMessage || 'network-down');
    },
    async ensureDir() {},
    async uploadFrom(source, target) { remote.set(target, await sourceBuffer(source)); },
    async size(target) { return remote.has(target) ? remote.get(target).length : -1; },
    async remove(target) { remote.delete(target); },
    async rename(from, to) {
      if (!remote.has(from)) throw new Error(`missing:${from}`);
      remote.set(to, remote.get(from)); remote.delete(from);
    },
    close() { this.closed = true; }
  };
}

async function writePending(dir) {
  const file = path.join(dir, 'pending', 'problem-2026-test.json.gz');
  const body = Buffer.from('compressed-test-data');
  await fs.writeFile(file, body);
  await fs.writeFile(`${file}.meta.json`, JSON.stringify({
    schemaVersion: 1,
    bundleId: '2026-test',
    botId: 'pi-main',
    capturedAt: '2026-09-16T18:00:00.000Z',
    day: '2026-09-16',
    severity: 'ERROR',
    reason: 'NO_PROGRESS',
    sha256: 'a'.repeat(64),
    bytes: body.length,
    filename: path.basename(file)
  }));
  return file;
}

test('FTPS uploader uses TLS, .part rename, size verification and latest-problem index', async (t) => {
  const dir = await tempDir();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const local = await writePending(dir);
  const remote = new Map();
  let client;
  const uploader = new FtpsDiagnosticsUploader({
    host: 'ftp.example.test',
    user: 'bot',
    password: 'super-secret',
    root: '/diagnostics/v3',
    botId: 'pi-main',
    clientFactory: () => { client = fakeClient(remote); return client; }
  });

  const result = await uploader.flush(dir);
  assert.equal(result.uploaded, 1);
  assert.equal(client.accessCalls[0].secure, true);
  assert.equal(client.closed, true);
  assert.equal(await fs.stat(local).then(() => true, () => false), false);
  const finalPath = '/diagnostics/v3/pi-main/2026-09-16/problem-2026-test.json.gz';
  assert.equal(remote.has(finalPath), true);
  assert.equal(remote.has(`${finalPath}.part`), false);
  assert.equal(remote.get(`${finalPath}.sha256`).toString('utf8').includes('a'.repeat(64)), true);
  const latest = JSON.parse(remote.get('/diagnostics/v3/pi-main/latest-problem.json').toString('utf8'));
  assert.equal(latest.bundleId, '2026-test');
  assert.equal(latest.remotePath, finalPath);
  const statusText = JSON.stringify(uploader.status());
  assert.equal(statusText.includes('super-secret'), false);
  assert.equal(uploader.status().credentialsExposed, false);
  assert.equal(uploader.status().gameplayActionAuthority, false);
});

test('FTPS failure keeps the pending bundle and applies exponential reconnect backoff', async (t) => {
  const dir = await tempDir();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const local = await writePending(dir);
  let now = 100000;
  let clientCreates = 0;
  const uploader = new FtpsDiagnosticsUploader({
    now: () => now,
    host: 'ftp.example.test', user: 'bot', password: 'secret',
    baseBackoffMs: 30000,
    maxBackoffMs: 120000,
    clientFactory: () => { clientCreates += 1; return fakeClient(new Map(), { failAccess: true, failMessage: 'network-down secret' }); }
  });
  const failed = await uploader.flush(dir);
  assert.equal(failed.uploaded, 0);
  assert.equal(failed.reason, 'DIAGNOSTICS_FTPS_FAILED');
  assert.equal(failed.nextAttemptAt, 130000);
  assert.equal(await fs.stat(local).then(() => true, () => false), true);
  assert.equal(uploader.status().stats.failures, 1);
  assert.equal(JSON.stringify(uploader.status()).includes('network-down secret'), false);
  assert.equal(JSON.stringify(uploader.status()).includes('[REDACTED]'), true);

  now += 5000;
  const backedOff = await uploader.flush(dir);
  assert.equal(backedOff.reason, 'DIAGNOSTICS_FTPS_BACKOFF');
  assert.equal(clientCreates, 1);
  assert.equal(uploader.status().stats.skippedBackoff, 1);
});

test('configured diagnostics transport refuses plaintext FTP by default', () => {
  assert.throws(() => new FtpsDiagnosticsUploader({ host: 'ftp.example.test', user: 'bot', password: 'secret', secure: false }), /DIAGNOSTICS_FTPS_TLS_REQUIRED/);
});
