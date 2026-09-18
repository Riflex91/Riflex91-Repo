'use strict';

const DEFAULT_CDP_ENDPOINT = 'http://127.0.0.1:9222';
const DEFAULT_ADVENTURE_LAND_ORIGIN = 'https://adventure.land';
const CDP_SESSION_SCHEMA_VERSION = 1;
const MAX_TARGET_RESPONSE_BYTES = 1024 * 1024;
const MAX_EXPRESSION_BYTES = 512 * 1024;

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function bounded(value, max = 256) {
  return String(value == null ? '' : value).slice(0, max);
}

function isLoopback(hostname) {
  const value = String(hostname || '').toLowerCase();
  return value === '127.0.0.1' || value === '::1' || value === '[::1]' || value === 'localhost';
}

function parseCdpEndpoint(value) {
  let url;
  try { url = new URL(String(value || DEFAULT_CDP_ENDPOINT)); }
  catch (_) { throw new Error('CDP_ENDPOINT_INVALID'); }
  if (url.protocol !== 'http:' || !isLoopback(url.hostname)) throw new Error('CDP_ENDPOINT_LOOPBACK_HTTP_REQUIRED');
  if (url.username || url.password || url.search || url.hash) throw new Error('CDP_ENDPOINT_UNSAFE');
  return new URL(url.href.endsWith('/') ? url.href : url.href + '/');
}

function parseAllowedOrigin(value, allowInsecureLoopbackForTests = false) {
  let url;
  try { url = new URL(String(value || DEFAULT_ADVENTURE_LAND_ORIGIN)); }
  catch (_) { throw new Error('ADVENTURE_LAND_ORIGIN_INVALID'); }
  const loopback = isLoopback(url.hostname);
  if (url.protocol !== 'https:' && !(allowInsecureLoopbackForTests === true && url.protocol === 'http:' && loopback)) {
    throw new Error('ADVENTURE_LAND_HTTPS_ORIGIN_REQUIRED');
  }
  if (url.username || url.password) throw new Error('ADVENTURE_LAND_ORIGIN_INVALID');
  return url.origin;
}

function sameOrigin(value, origin) {
  try { return new URL(String(value)).origin === origin; }
  catch (_) { return false; }
}

function validateDebuggerUrl(value) {
  let url;
  try { url = new URL(String(value || '')); }
  catch (_) { throw new Error('CDP_DEBUGGER_URL_INVALID'); }
  if (!['ws:', 'wss:'].includes(url.protocol) || !isLoopback(url.hostname)) {
    throw new Error('CDP_DEBUGGER_LOOPBACK_REQUIRED');
  }
  return url.href;
}

function defaultWebSocketFactory(url) {
  if (typeof globalThis.WebSocket !== 'function') throw new Error('CDP_WEBSOCKET_UNAVAILABLE');
  return new globalThis.WebSocket(url);
}

function normalizeMessageData(data) {
  if (typeof data === 'string') return Promise.resolve(data);
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) return Promise.resolve(data.toString('utf8'));
  if (data instanceof ArrayBuffer) return Promise.resolve(Buffer.from(data).toString('utf8'));
  if (ArrayBuffer.isView(data)) return Promise.resolve(Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('utf8'));
  if (data && typeof data.text === 'function') return Promise.resolve(data.text());
  return Promise.resolve(String(data == null ? '' : data));
}

function addListener(socket, name, handler) {
  if (socket && typeof socket.addEventListener === 'function') {
    socket.addEventListener(name, handler);
    return () => {
      if (typeof socket.removeEventListener === 'function') socket.removeEventListener(name, handler);
    };
  }
  if (socket && typeof socket.on === 'function') {
    socket.on(name, handler);
    return () => {
      if (typeof socket.off === 'function') socket.off(name, handler);
      else if (typeof socket.removeListener === 'function') socket.removeListener(name, handler);
    };
  }
  throw new Error('CDP_WEBSOCKET_EVENT_API_REQUIRED');
}

class CdpConnection {
  constructor(options = {}) {
    this.url = options.url;
    this.webSocketFactory = options.webSocketFactory || defaultWebSocketFactory;
    this.commandTimeoutMs = Math.max(250, Math.min(30000, finite(options.commandTimeoutMs, 3000)));
    this.maxResponseBytes = Math.max(4096, Math.min(4 * 1024 * 1024, finite(options.maxResponseBytes, MAX_TARGET_RESPONSE_BYTES)));
    this.socket = null;
    this.pending = new Map();
    this.contexts = new Map();
    this.nextId = 0;
    this.closed = true;
    this.lastError = null;
    this._removeListeners = [];
  }

  async open(timeoutMs = this.commandTimeoutMs) {
    if (this.socket && !this.closed) return true;
    const socket = this.webSocketFactory(this.url);
    this.socket = socket;
    this.closed = false;
    await new Promise((resolve, reject) => {
      let settled = false;
      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        offOpen();
        offError();
        offClose();
        fn(value);
      };
      const offOpen = addListener(socket, 'open', () => finish(resolve, true));
      const offError = addListener(socket, 'error', (error) => finish(reject, new Error('CDP_SOCKET_CONNECT_FAILED:' + bounded(error && error.message || error, 128))));
      const offClose = addListener(socket, 'close', () => finish(reject, new Error('CDP_SOCKET_CLOSED_DURING_CONNECT')));
      const timer = setTimeout(() => finish(reject, new Error('CDP_SOCKET_CONNECT_TIMEOUT')), Math.max(250, timeoutMs));
    });
    this._removeListeners.push(
      addListener(socket, 'message', (event) => {
        const data = event && Object.prototype.hasOwnProperty.call(event, 'data') ? event.data : event;
        normalizeMessageData(data).then((text) => this._handleMessage(text)).catch(() => {});
      }),
      addListener(socket, 'close', () => this._handleClose('CDP_SOCKET_CLOSED')),
      addListener(socket, 'error', (error) => {
        this.lastError = { code: 'CDP_SOCKET_ERROR', message: bounded(error && error.message || error, 160) };
      })
    );
    return true;
  }

  _handleMessage(text) {
    if (Buffer.byteLength(String(text), 'utf8') > this.maxResponseBytes) {
      this._handleClose('CDP_RESPONSE_TOO_LARGE');
      return;
    }
    let message;
    try { message = JSON.parse(String(text)); }
    catch (_) { return; }

    if (message && message.method === 'Runtime.executionContextCreated') {
      const context = message.params && message.params.context;
      if (context && Number.isFinite(Number(context.id))) this.contexts.set(Number(context.id), context);
    } else if (message && message.method === 'Runtime.executionContextDestroyed') {
      const id = Number(message.params && message.params.executionContextId);
      if (Number.isFinite(id)) this.contexts.delete(id);
    } else if (message && message.method === 'Runtime.executionContextsCleared') {
      this.contexts.clear();
    }

    const id = Number(message && message.id);
    if (!Number.isFinite(id) || !this.pending.has(id)) return;
    const row = this.pending.get(id);
    this.pending.delete(id);
    clearTimeout(row.timer);
    if (message.error) row.reject(new Error('CDP_COMMAND_FAILED:' + bounded(JSON.stringify(message.error), 220)));
    else row.resolve(message.result || {});
  }

  _handleClose(code) {
    if (this.closed) return;
    this.closed = true;
    this.lastError = { code, message: code };
    for (const [id, row] of this.pending) {
      clearTimeout(row.timer);
      row.reject(new Error(code));
      this.pending.delete(id);
    }
    this.contexts.clear();
  }

  request(method, params = {}) {
    if (!this.socket || this.closed) return Promise.reject(new Error('CDP_SOCKET_NOT_CONNECTED'));
    const id = ++this.nextId;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        reject(new Error('CDP_COMMAND_TIMEOUT'));
      }, this.commandTimeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      try { this.socket.send(payload); }
      catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(new Error('CDP_SOCKET_SEND_FAILED:' + bounded(error && error.message || error, 160)));
      }
    });
  }

  async evaluate(expression, contextId) {
    const result = await this.request('Runtime.evaluate', {
      expression,
      contextId,
      returnByValue: true,
      awaitPromise: true,
      userGesture: false
    });
    if (result.exceptionDetails) throw new Error('CDP_EVALUATION_FAILED:' + bounded(JSON.stringify(result.exceptionDetails), 220));
    const remote = result.result || {};
    if (!Object.prototype.hasOwnProperty.call(remote, 'value')) {
      if (remote.type === 'undefined') return undefined;
      throw new Error('CDP_RESULT_VALUE_MISSING');
    }
    return remote.value;
  }

  close() {
    if (this.closed && !this.socket) return;
    const socket = this.socket;
    this._handleClose('CDP_SOCKET_CLOSED_BY_DRIVER');
    this.socket = null;
    for (const remove of this._removeListeners.splice(0)) {
      try { remove(); } catch (_) {}
    }
    if (socket && typeof socket.close === 'function') {
      try { socket.close(); } catch (_) {}
    }
  }
}

class CdpAdventureLandSessionDriver {
  constructor(options = {}) {
    this.now = options.now || (() => Date.now());
    this.fetch = options.fetch || globalThis.fetch;
    if (typeof this.fetch !== 'function') throw new Error('CDP_FETCH_REQUIRED');
    this.endpoint = parseCdpEndpoint(options.endpoint || options.cdpEndpoint);
    this.allowedOrigin = parseAllowedOrigin(options.allowedOrigin || options.browserAllowedOrigin, options.allowInsecureLoopbackForTests === true);
    this.webSocketFactory = options.webSocketFactory || defaultWebSocketFactory;
    this.connectTimeoutMs = Math.max(250, Math.min(30000, finite(options.connectTimeoutMs, 3000)));
    this.commandTimeoutMs = Math.max(250, Math.min(30000, finite(options.commandTimeoutMs, 3000)));
    this.discoveryTimeoutMs = Math.max(250, Math.min(30000, finite(options.discoveryTimeoutMs, 3000)));
    this.contextSettleMs = Math.max(0, Math.min(1000, finite(options.contextSettleMs, 25)));
    this.connectAttempts = Math.max(1, Math.min(6, Math.floor(finite(options.connectAttempts, 3))));
    this.reconnectBaseMs = Math.max(0, Math.min(5000, finite(options.reconnectBaseMs, 250)));
    this.reconnectMaxMs = Math.max(this.reconnectBaseMs, Math.min(15000, finite(options.reconnectMaxMs, 2000)));
    this.sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.connection = null;
    this.contextId = null;
    this.currentTarget = null;
    this.started = false;
    this.lastSuccessAt = null;
    this.lastError = null;
    this.lastDiscoveryAt = null;
    this.generation = 0;
    this.stats = {
      starts: 0,
      stops: 0,
      discoveries: 0,
      discoveryFailures: 0,
      targetsExamined: 0,
      targetRejects: 0,
      contextRejects: 0,
      reconnects: 0,
      evaluations: 0,
      evaluationFailures: 0
    };
    const driver = this;
    this.context = Object.freeze({
      evaluate(fn, arg) { return driver.evaluate(fn, arg); },
      url() { return driver.currentTarget && driver.currentTarget.url || driver.allowedOrigin + '/'; },
      isClosed() { return false; }
    });
  }

  executionContext() {
    return this.context;
  }

  _recordError(error) {
    const code = bounded(error && error.message || error || 'CDP_SESSION_FAILED', 220);
    this.lastError = { at: this.now(), code };
    return new Error(code);
  }

  async _fetchTargets() {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), this.discoveryTimeoutMs) : null;
    try {
      const url = new URL('json/list', this.endpoint);
      const response = await this.fetch(url.href, {
        method: 'GET',
        redirect: 'error',
        signal: controller && controller.signal
      });
      if (!response || response.ok !== true) throw new Error('CDP_TARGET_LIST_HTTP_' + finite(response && response.status, 0));
      const text = await response.text();
      if (Buffer.byteLength(text, 'utf8') > MAX_TARGET_RESPONSE_BYTES) throw new Error('CDP_TARGET_LIST_TOO_LARGE');
      let rows;
      try { rows = JSON.parse(text); }
      catch (_) { throw new Error('CDP_TARGET_LIST_INVALID_JSON'); }
      if (!Array.isArray(rows)) throw new Error('CDP_TARGET_LIST_INVALID');
      const matches = [];
      for (const row of rows.slice(0, 128)) {
        if (!row || String(row.type || '').toLowerCase() !== 'page') continue;
        if (!sameOrigin(row.url, this.allowedOrigin)) {
          this.stats.targetRejects += 1;
          continue;
        }
        let webSocketDebuggerUrl;
        try { webSocketDebuggerUrl = validateDebuggerUrl(row.webSocketDebuggerUrl); }
        catch (_) {
          this.stats.targetRejects += 1;
          continue;
        }
        matches.push({
          id: bounded(row.id || '', 160),
          title: bounded(row.title || '', 160),
          url: String(row.url),
          webSocketDebuggerUrl
        });
      }
      if (!matches.length) throw new Error('ADVENTURE_LAND_CDP_TARGET_NOT_FOUND');
      return matches;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  _allowedContext(context) {
    if (!context || !Number.isFinite(Number(context.id))) return false;
    if (!sameOrigin(context.origin, this.allowedOrigin)) return false;
    const aux = context.auxData || {};
    if (aux.isDefault === false) return false;
    return true;
  }

  async _probeConnection(connection) {
    await connection.request('Runtime.enable');
    if (this.contextSettleMs > 0) await this.sleep(this.contextSettleMs);
    const contexts = [...connection.contexts.values()].filter((context) => this._allowedContext(context));
    for (const context of contexts) {
      try {
        const ok = await connection.evaluate(
          "(() => { const o = globalThis.AIO_V3 && globalThis.AIO_V3.operations; return !!o && typeof o === 'object' && typeof o.hostHeartbeat === 'function' && typeof o.pendingAlerts === 'function' && typeof o.claimAlerts === 'function' && typeof o.reconciliationStatus === 'function'; })()",
          Number(context.id)
        );
        if (ok === true) return Number(context.id);
      } catch (_) {
        this.stats.contextRejects += 1;
      }
    }
    return null;
  }

  _resetConnection(reason = 'RESET') {
    if (this.connection) this.connection.close();
    this.connection = null;
    this.contextId = null;
    this.currentTarget = null;
    if (reason) this.lastError = { at: this.now(), code: bounded(reason, 220) };
  }

  invalidate(reason = 'SESSION_INVALIDATED') {
    this._resetConnection(reason);
    return this.status();
  }

  async _discoverOnce() {
    this.stats.discoveries += 1;
    this.lastDiscoveryAt = this.now();
    const targets = await this._fetchTargets();
    for (const target of targets) {
      this.stats.targetsExamined += 1;
      const connection = new CdpConnection({
        url: target.webSocketDebuggerUrl,
        webSocketFactory: this.webSocketFactory,
        commandTimeoutMs: this.commandTimeoutMs
      });
      try {
        await connection.open(this.connectTimeoutMs);
        const contextId = await this._probeConnection(connection);
        if (contextId == null) {
          connection.close();
          this.stats.contextRejects += 1;
          continue;
        }
        this._resetConnection(null);
        this.connection = connection;
        this.contextId = contextId;
        this.currentTarget = { id: target.id, title: target.title, url: target.url };
        this.generation += 1;
        this.lastSuccessAt = this.now();
        this.lastError = null;
        return true;
      } catch (_) {
        connection.close();
      }
    }
    throw new Error('AIO_V3_OPERATIONS_UNAVAILABLE');
  }

  async _ensureSession(force = false) {
    if (!force && this.connection && !this.connection.closed && this.contextId != null && this.currentTarget) return true;
    let lastError = null;
    for (let attempt = 0; attempt < this.connectAttempts; attempt += 1) {
      if (attempt > 0) {
        this.stats.reconnects += 1;
        const wait = Math.min(this.reconnectMaxMs, this.reconnectBaseMs * Math.pow(2, attempt - 1));
        if (wait > 0) await this.sleep(wait);
      }
      try {
        await this._discoverOnce();
        return true;
      } catch (error) {
        lastError = error;
        this.stats.discoveryFailures += 1;
        this._resetConnection(null);
      }
    }
    throw this._recordError(lastError || new Error('CDP_SESSION_UNAVAILABLE'));
  }

  async start() {
    if (this.started && this.connection && !this.connection.closed) return { started: false, duplicate: true, status: this.status() };
    await this._ensureSession(true);
    this.started = true;
    this.stats.starts += 1;
    return { started: true, status: this.status() };
  }

  async stop(reason = 'CDP_SESSION_STOP') {
    this._resetConnection(reason);
    this.started = false;
    this.stats.stops += 1;
    return { stopped: true, reason, status: this.status() };
  }

  async evaluate(fn, arg) {
    if (typeof fn !== 'function') throw this._recordError(new Error('CDP_EVALUATION_FUNCTION_REQUIRED'));
    const serializedArg = JSON.stringify(arg);
    if (serializedArg === undefined) throw this._recordError(new Error('CDP_EVALUATION_ARGUMENT_INVALID'));
    const expression = '(' + fn.toString() + ')(' + serializedArg + ')';
    if (Buffer.byteLength(expression, 'utf8') > MAX_EXPRESSION_BYTES) throw this._recordError(new Error('CDP_EVALUATION_EXPRESSION_TOO_LARGE'));

    let lastError = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await this._ensureSession(attempt > 0);
        this.stats.evaluations += 1;
        const result = await this.connection.evaluate(expression, this.contextId);
        this.lastSuccessAt = this.now();
        this.lastError = null;
        return result;
      } catch (error) {
        lastError = error;
        this.stats.evaluationFailures += 1;
        this._resetConnection(null);
      }
    }
    throw this._recordError(lastError || new Error('CDP_EVALUATION_FAILED'));
  }

  status() {
    return {
      schemaVersion: CDP_SESSION_SCHEMA_VERSION,
      mode: 'cdp-adventure-land-session',
      endpoint: this.endpoint.origin,
      allowedOrigin: this.allowedOrigin,
      started: this.started,
      connected: !!(this.connection && !this.connection.closed && this.contextId != null && this.currentTarget),
      target: this.currentTarget ? { ...this.currentTarget } : null,
      contextBound: this.contextId != null,
      generation: this.generation,
      lastDiscoveryAt: this.lastDiscoveryAt,
      lastSuccessAt: this.lastSuccessAt,
      lastError: this.lastError ? { ...this.lastError } : null,
      reconnectPolicy: {
        attempts: this.connectAttempts,
        baseMs: this.reconnectBaseMs,
        maxMs: this.reconnectMaxMs
      },
      loopbackOnly: true,
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false,
      genericRemoteEvaluationExposed: false,
      credentialsOwnedByDriver: false,
      stats: { ...this.stats }
    };
  }
}

module.exports = {
  CdpAdventureLandSessionDriver,
  CDP_SESSION_SCHEMA_VERSION,
  DEFAULT_CDP_ENDPOINT,
  DEFAULT_ADVENTURE_LAND_ORIGIN,
  parseCdpEndpoint,
  parseAllowedOrigin,
  sameOrigin
};
