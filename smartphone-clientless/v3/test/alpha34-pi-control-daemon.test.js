'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { PiControlDaemon, validServiceName } = require('../../ops/pi-control/pi-control-daemon');

class FakeRunner {
  constructor() {
    this.calls = [];
    this.sha = 'oldsha';
    this.originMain = 'newsha';
    this.active = true;
  }
  async run(command, args) {
    this.calls.push([command, ...args]);
    if (command === 'systemctl') {
      if (args[0] === 'is-active') return { stdout: this.active ? 'active' : 'inactive', stderr: '' };
      if (args[0] === 'stop') this.active = false;
      if (args[0] === 'start' || args[0] === 'restart') this.active = true;
      return { stdout: '', stderr: '' };
    }
    if (command === 'git') {
      if (args[0] === 'status') return { stdout: '', stderr: '' };
      if (args[0] === 'fetch') return { stdout: '', stderr: '' };
      if (args[0] === 'rev-parse' && args[1] === 'HEAD') return { stdout: this.sha, stderr: '' };
      if (args[0] === 'rev-parse' && args[1] === 'origin/main') return { stdout: this.originMain, stderr: '' };
      if (args[0] === 'checkout') { this.sha = args[2]; return { stdout: '', stderr: '' }; }
    }
    throw new Error(`unexpected command: ${command} ${args.join(' ')}`);
  }
}

function request(port, token, method, path, key) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path, headers: {
      authorization: token ? `Bearer ${token}` : '',
      ...(key ? { 'idempotency-key': key } : {})
    } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('rejects unsafe service names and remote bind without TLS', async () => {
  assert.equal(validServiceName('aio-bot.service'), true);
  assert.equal(validServiceName('aio-bot.service;rm -rf /'), false);
  const invalid = new PiControlDaemon({ token: 'x'.repeat(32), botService: '../bad.service', runner: new FakeRunner() });
  assert.equal((await invalid.start()).reason, 'INVALID_BOT_SERVICE');
  const remote = new PiControlDaemon({ host: '0.0.0.0', token: 'x'.repeat(32), runner: new FakeRunner() });
  assert.equal((await remote.start()).reason, 'REMOTE_TLS_REQUIRED');
});

test('authenticates status and requires idempotency keys for mutations', async () => {
  const token = 't'.repeat(40);
  const daemon = new PiControlDaemon({ host: '127.0.0.1', port: 0, token, repoPath: process.cwd(), runner: new FakeRunner() });
  const started = await daemon.start();
  const port = started.address.port;
  try {
    assert.equal((await request(port, '', 'GET', '/v1/status')).status, 401);
    const status = await request(port, token, 'GET', '/v1/status');
    assert.equal(status.status, 200);
    assert.equal(status.body.arbitraryShell, false);
    assert.equal(status.body.gameplayActionAuthority, false);
    assert.equal((await request(port, token, 'POST', '/v1/bot/restart')).status, 400);
  } finally { await daemon.stop(); }
});

test('restart is idempotent and deploy main records rollback target', async () => {
  const token = 'z'.repeat(40);
  const runner = new FakeRunner();
  const daemon = new PiControlDaemon({ host: '127.0.0.1', port: 0, token, repoPath: process.cwd(), runner });
  const started = await daemon.start();
  const port = started.address.port;
  try {
    const first = await request(port, token, 'POST', '/v1/bot/restart', 'restart-0001');
    const callsAfterFirst = runner.calls.length;
    const duplicate = await request(port, token, 'POST', '/v1/bot/restart', 'restart-0001');
    assert.equal(first.status, 200);
    assert.deepEqual(duplicate.body, first.body);
    assert.equal(runner.calls.length, callsAfterFirst);

    const deploy = await request(port, token, 'POST', '/v1/deploy/main', 'deploy-0001');
    assert.equal(deploy.status, 200);
    assert.equal(deploy.body.result.from, 'oldsha');
    assert.equal(deploy.body.result.to, 'newsha');
    assert.equal(daemon.previousSha, 'oldsha');
    assert.deepEqual(runner.calls.find((call) => call[0] === 'git' && call[1] === 'fetch'), ['git', 'fetch', '--prune', 'origin', 'main']);
  } finally { await daemon.stop(); }
});

test('unknown mutations never become arbitrary commands', async () => {
  const token = 'q'.repeat(40);
  const runner = new FakeRunner();
  const daemon = new PiControlDaemon({ host: '127.0.0.1', port: 0, token, repoPath: process.cwd(), runner });
  const started = await daemon.start();
  try {
    const response = await request(started.address.port, token, 'POST', '/v1/exec', 'unknown-0001');
    assert.equal(response.status, 404);
    assert.equal(runner.calls.length, 0);
  } finally { await daemon.stop(); }
});
