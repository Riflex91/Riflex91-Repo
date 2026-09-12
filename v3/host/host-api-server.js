'use strict';

const http = require('node:http');
const crypto = require('node:crypto');

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
function bounded(value, max = 256) {
  return String(value == null ? '' : value).slice(0, max);
}
function isLoopback(host) {
  const value = String(host || '').toLowerCase();
  return value === '127.0.0.1' || value === '::1' || value === 'localhost';
}
function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

class HostApiServer {
  constructor(options = {}) {
    this.controller = options.controller || null;
    this.launcher = options.launcher || null;
    this.host = options.host || '127.0.0.1';
    this.port = Number.isInteger(Number(options.port)) ? Number(options.port) : 0;
    this.token = String(options.token || '');
    this.serverFactory = options.serverFactory || ((handler) => http.createServer(handler));
    this.server = null;
    this.boundAddress = null;
    this.startedAt = null;
    this.stats = { requests: 0, unauthorized: 0, notFound: 0, methodRejected: 0, failures: 0 };
  }

  _authorized(request) {
    const header = request && request.headers && request.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return false;
    return safeEqual(header.slice(7), this.token);
  }

  _json(response, statusCode, value) {
    const body = JSON.stringify(value);
    response.statusCode = statusCode;
    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.setHeader('cache-control', 'no-store');
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('x-frame-options', 'DENY');
    response.setHeader('content-security-policy', "default-src 'none'; frame-ancestors 'none'");
    response.end(body);
  }

  _statusPayload() {
    return {
      hostApi: this.status(),
      controller: this.controller && typeof this.controller.status === 'function' ? this.controller.status() : null,
      launcher: this.launcher && typeof this.launcher.status === 'function' ? this.launcher.status() : null
    };
  }

  _handle(request, response) {
    this.stats.requests += 1;
    if (!this._authorized(request)) {
      this.stats.unauthorized += 1;
      response.setHeader('www-authenticate', 'Bearer realm="aio-v3-host"');
      return this._json(response, 401, { ok: false, error: 'UNAUTHORIZED' });
    }
    if (request.method !== 'GET') {
      this.stats.methodRejected += 1;
      response.setHeader('allow', 'GET');
      return this._json(response, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
    }

    let pathname = '/';
    try { pathname = new URL(request.url || '/', 'http://localhost').pathname; }
    catch (_) { pathname = '/'; }

    if (pathname === '/v1/health' || pathname === '/v1/status') {
      return this._json(response, 200, { ok: true, ...this._statusPayload() });
    }
    if (pathname === '/v1/watchdog') {
      const watchdog = this.controller && this.controller.watchdog && typeof this.controller.watchdog.status === 'function'
        ? this.controller.watchdog.status() : null;
      return this._json(response, 200, { ok: true, watchdog });
    }
    if (pathname === '/v1/alerts') {
      const alerts = this.controller && this.controller.alertRelay && typeof this.controller.alertRelay.pending === 'function'
        ? this.controller.alertRelay.pending(100) : [];
      return this._json(response, 200, { ok: true, alerts });
    }
    if (pathname === '/v1/watchdog/history') {
      const history = this.controller && this.controller.watchdog && typeof this.controller.watchdog.listHistory === 'function'
        ? this.controller.watchdog.listHistory(100) : [];
      return this._json(response, 200, { ok: true, history });
    }

    this.stats.notFound += 1;
    return this._json(response, 404, { ok: false, error: 'NOT_FOUND' });
  }

  start() {
    if (this.server) return Promise.resolve({ started: false, reason: 'API_ALREADY_RUNNING', address: clone(this.boundAddress) });
    if (!isLoopback(this.host)) return Promise.resolve({ started: false, reason: 'LOOPBACK_BIND_REQUIRED' });
    if (this.token.length < 32) return Promise.resolve({ started: false, reason: 'AUTH_TOKEN_TOO_SHORT' });

    return new Promise((resolve) => {
      const server = this.serverFactory((request, response) => {
        try { this._handle(request, response); }
        catch (error) {
          this.stats.failures += 1;
          this._json(response, 500, { ok: false, error: 'HOST_API_FAILURE' });
        }
      });
      const fail = (error) => {
        this.stats.failures += 1;
        try { server.close(); } catch (_) {}
        resolve({ started: false, reason: 'API_START_FAILED', error: bounded(error && error.message || error) });
      };
      server.once('error', fail);
      server.listen(this.port, this.host, () => {
        server.removeListener('error', fail);
        this.server = server;
        const address = server.address();
        this.boundAddress = address && typeof address === 'object'
          ? { address: address.address, port: address.port, family: address.family }
          : { address: this.host, port: this.port };
        this.startedAt = Date.now();
        resolve({ started: true, address: clone(this.boundAddress) });
      });
    });
  }

  stop() {
    if (!this.server) return Promise.resolve({ stopped: true, duplicate: true });
    const server = this.server;
    this.server = null;
    return new Promise((resolve) => {
      server.close(() => {
        this.boundAddress = null;
        resolve({ stopped: true, duplicate: false });
      });
    });
  }

  status() {
    return {
      mode: 'authenticated-loopback-readonly-api',
      listening: !!this.server,
      loopbackOnly: true,
      authenticated: this.token.length >= 32,
      host: this.host,
      address: clone(this.boundAddress),
      startedAt: this.startedAt,
      methods: ['GET'],
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false,
      tokenExposed: false,
      stats: { ...this.stats }
    };
  }
}

module.exports = { HostApiServer, isLoopback, safeEqual };
