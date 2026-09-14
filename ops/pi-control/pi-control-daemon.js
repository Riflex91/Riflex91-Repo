'use strict';

const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const crypto = require('node:crypto');
const path = require('node:path');
const { execFile } = require('node:child_process');

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
function isLoopback(host) {
  const value = String(host || '').toLowerCase();
  return value === '127.0.0.1' || value === '::1' || value === 'localhost';
}
function validServiceName(value) { return /^[a-zA-Z0-9_.@-]+\.service$/.test(String(value || '')); }
function bounded(value, max = 512) { return String(value == null ? '' : value).slice(0, max); }

class ExecFileRunner {
  run(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      execFile(command, args, { cwd: options.cwd, timeout: options.timeout || 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          error.stdout = stdout;
          error.stderr = stderr;
          reject(error);
          return;
        }
        resolve({ stdout: String(stdout || '').trim(), stderr: String(stderr || '').trim() });
      });
    });
  }
}

class PiControlDaemon {
  constructor(options = {}) {
    this.host = options.host || process.env.AIO_CONTROL_BIND || '127.0.0.1';
    this.port = Number(options.port ?? process.env.AIO_CONTROL_PORT ?? 8790);
    this.token = String(options.token ?? process.env.AIO_CONTROL_TOKEN ?? '');
    this.repoPath = path.resolve(options.repoPath || process.env.AIO_CONTROL_REPO_PATH || process.cwd());
    this.botService = String(options.botService || process.env.AIO_CONTROL_BOT_SERVICE || 'aio-bot.service');
    this.tlsCertPath = options.tlsCertPath || process.env.AIO_CONTROL_TLS_CERT || '';
    this.tlsKeyPath = options.tlsKeyPath || process.env.AIO_CONTROL_TLS_KEY || '';
    this.runner = options.runner || new ExecFileRunner();
    this.server = null;
    this.startedAt = null;
    this.lastDeploy = null;
    this.previousSha = null;
    this.operationInFlight = null;
    this.idempotency = new Map();
    this.maxIdempotencyEntries = 256;
    this.idempotencyTtlMs = 10 * 60 * 1000;
  }

  _authorized(request) {
    const header = request.headers && request.headers.authorization;
    return !!header && header.startsWith('Bearer ') && safeEqual(header.slice(7), this.token);
  }
  _json(response, statusCode, value) {
    const body = JSON.stringify(value);
    response.statusCode = statusCode;
    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.setHeader('cache-control', 'no-store');
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('x-frame-options', 'DENY');
    response.end(body);
  }
  _pruneIdempotency() {
    const cutoff = Date.now() - this.idempotencyTtlMs;
    for (const [key, entry] of this.idempotency) if (entry.at < cutoff) this.idempotency.delete(key);
    while (this.idempotency.size > this.maxIdempotencyEntries) this.idempotency.delete(this.idempotency.keys().next().value);
  }
  _idempotencyKey(request) {
    const key = bounded(request.headers && request.headers['idempotency-key'], 128);
    return /^[A-Za-z0-9._:-]{8,128}$/.test(key) ? key : '';
  }
  async _systemctl(action) {
    await this.runner.run('systemctl', [action, this.botService], { timeout: 30000 });
    return this._serviceStatus();
  }
  async _serviceStatus() {
    try {
      const result = await this.runner.run('systemctl', ['is-active', this.botService], { timeout: 10000 });
      return { service: this.botService, active: result.stdout === 'active', state: result.stdout || 'unknown' };
    } catch (error) {
      return { service: this.botService, active: false, state: bounded(error.stdout || error.message || 'inactive', 128) };
    }
  }
  async _git(args, timeout = 30000) { return this.runner.run('git', args, { cwd: this.repoPath, timeout }); }
  async _healthAfterChange() {
    const status = await this._serviceStatus();
    if (!status.active) throw new Error(`BOT_SERVICE_NOT_ACTIVE:${status.state}`);
    return status;
  }
  async _deployMain() {
    if (this.operationInFlight) throw new Error('OPERATION_IN_PROGRESS');
    this.operationInFlight = 'deploy';
    const startedAt = Date.now();
    let oldSha = null;
    try {
      const dirty = await this._git(['status', '--porcelain']);
      if (dirty.stdout) throw new Error('DIRTY_WORKTREE');
      oldSha = (await this._git(['rev-parse', 'HEAD'])).stdout;
      await this._git(['fetch', '--prune', 'origin', 'main'], 120000);
      const targetSha = (await this._git(['rev-parse', 'origin/main'])).stdout;
      if (!oldSha || !targetSha) throw new Error('GIT_SHA_RESOLUTION_FAILED');
      if (oldSha === targetSha) {
        const health = await this._serviceStatus();
        this.lastDeploy = { ok: true, changed: false, from: oldSha, to: targetSha, at: Date.now() };
        return { changed: false, from: oldSha, to: targetSha, health };
      }
      this.previousSha = oldSha;
      await this._git(['checkout', '--detach', targetSha], 60000);
      await this._systemctl('restart');
      const health = await this._healthAfterChange();
      this.lastDeploy = { ok: true, changed: true, from: oldSha, to: targetSha, at: Date.now(), durationMs: Date.now() - startedAt };
      return { changed: true, from: oldSha, to: targetSha, health };
    } catch (error) {
      if (oldSha) {
        try {
          await this._git(['checkout', '--detach', oldSha], 60000);
          await this._systemctl('restart');
          await this._healthAfterChange();
        } catch (_) {}
      }
      this.lastDeploy = { ok: false, from: oldSha, error: bounded(error.message), at: Date.now(), durationMs: Date.now() - startedAt };
      throw error;
    } finally {
      this.operationInFlight = null;
    }
  }
  async _rollback() {
    if (this.operationInFlight) throw new Error('OPERATION_IN_PROGRESS');
    if (!this.previousSha) throw new Error('NO_ROLLBACK_TARGET');
    this.operationInFlight = 'rollback';
    try {
      const current = (await this._git(['rev-parse', 'HEAD'])).stdout;
      const target = this.previousSha;
      await this._git(['checkout', '--detach', target], 60000);
      await this._systemctl('restart');
      const health = await this._healthAfterChange();
      this.previousSha = current;
      return { from: current, to: target, health };
    } finally {
      this.operationInFlight = null;
    }
  }
  async _status() {
    let sha = null;
    try { sha = (await this._git(['rev-parse', 'HEAD'], 10000)).stdout; } catch (_) {}
    return {
      ok: true,
      daemon: { mode: 'authenticated-fixed-operations', startedAt: this.startedAt, tls: !isLoopback(this.host), operationInFlight: this.operationInFlight },
      bot: await this._serviceStatus(),
      repo: { path: this.repoPath, sha, previousSha: this.previousSha, lastDeploy: this.lastDeploy },
      capabilities: ['status', 'start', 'stop', 'restart', 'deploy-main', 'rollback'],
      arbitraryShell: false,
      gameplayActionAuthority: false
    };
  }
  async _executeRoute(pathname) {
    if (pathname === '/v1/bot/start') return this._systemctl('start');
    if (pathname === '/v1/bot/stop') return this._systemctl('stop');
    if (pathname === '/v1/bot/restart') return this._systemctl('restart');
    if (pathname === '/v1/deploy/main') return this._deployMain();
    if (pathname === '/v1/rollback') return this._rollback();
    return null;
  }
  async _handle(request, response) {
    if (!this._authorized(request)) {
      response.setHeader('www-authenticate', 'Bearer realm="aio-pi-control"');
      return this._json(response, 401, { ok: false, error: 'UNAUTHORIZED' });
    }
    let pathname = '/';
    try { pathname = new URL(request.url || '/', 'http://localhost').pathname; } catch (_) {}
    if (request.method === 'GET' && pathname === '/v1/status') return this._json(response, 200, await this._status());
    if (request.method !== 'POST') {
      response.setHeader('allow', 'GET, POST');
      return this._json(response, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
    }
    const key = this._idempotencyKey(request);
    if (!key) return this._json(response, 400, { ok: false, error: 'IDEMPOTENCY_KEY_REQUIRED' });
    this._pruneIdempotency();
    if (this.idempotency.has(key)) return this._json(response, 200, this.idempotency.get(key).value);
    try {
      const result = await this._executeRoute(pathname);
      if (result == null) return this._json(response, 404, { ok: false, error: 'NOT_FOUND' });
      const value = { ok: true, result };
      this.idempotency.set(key, { at: Date.now(), value });
      this._pruneIdempotency();
      return this._json(response, 200, value);
    } catch (error) {
      const code = error && error.message === 'OPERATION_IN_PROGRESS' ? 409 : 500;
      return this._json(response, code, { ok: false, error: bounded(error && error.message || error) });
    }
  }
  start() {
    if (this.server) return Promise.resolve({ started: false, reason: 'ALREADY_RUNNING' });
    if (this.token.length < 32) return Promise.resolve({ started: false, reason: 'AUTH_TOKEN_TOO_SHORT' });
    if (!validServiceName(this.botService)) return Promise.resolve({ started: false, reason: 'INVALID_BOT_SERVICE' });
    const remote = !isLoopback(this.host);
    if (remote && (!this.tlsCertPath || !this.tlsKeyPath)) return Promise.resolve({ started: false, reason: 'REMOTE_TLS_REQUIRED' });
    const handler = (request, response) => Promise.resolve(this._handle(request, response)).catch(() => this._json(response, 500, { ok: false, error: 'CONTROL_DAEMON_FAILURE' }));
    const server = remote
      ? https.createServer({ cert: fs.readFileSync(this.tlsCertPath), key: fs.readFileSync(this.tlsKeyPath) }, handler)
      : http.createServer(handler);
    return new Promise((resolve) => {
      const fail = (error) => resolve({ started: false, reason: 'START_FAILED', error: bounded(error.message) });
      server.once('error', fail);
      server.listen(this.port, this.host, () => {
        server.removeListener('error', fail);
        this.server = server;
        this.startedAt = Date.now();
        resolve({ started: true, address: server.address() });
      });
    });
  }
  stop() {
    if (!this.server) return Promise.resolve({ stopped: true, duplicate: true });
    const server = this.server;
    this.server = null;
    return new Promise((resolve) => server.close(() => resolve({ stopped: true, duplicate: false })));
  }
}

async function main() {
  const daemon = new PiControlDaemon();
  const result = await daemon.start();
  if (!result.started) {
    console.error(JSON.stringify(result));
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({ event: 'AIO_PI_CONTROL_STARTED', ...result }));
  const shutdown = async () => { await daemon.stop(); process.exit(0); };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

if (require.main === module) main();
module.exports = { PiControlDaemon, ExecFileRunner, safeEqual, isLoopback, validServiceName };
