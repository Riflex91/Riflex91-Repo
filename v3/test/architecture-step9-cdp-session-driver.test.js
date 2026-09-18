'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const {
  CdpAdventureLandSessionDriver,
  parseCdpEndpoint,
  parseAllowedOrigin
} = require('../host/cdp-adventure-land-session');
const { BrowserBotClient } = require('../host/browser-bot-client');
const { ProductionHostHarness } = require('../host/production-host-harness');

function response(value, status = 200) {
  const text = JSON.stringify(value);
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() { return text; }
  };
}

class FakeWebSocket extends EventEmitter {
  constructor(url, scenario) {
    super();
    this.url = url;
    this.scenario = scenario;
    this.closed = false;
    this.actualEvaluations = 0;
    queueMicrotask(() => this.emit('open', {}));
  }

  addEventListener(name, handler) { this.on(name, handler); }
  removeEventListener(name, handler) { this.off(name, handler); }

  _message(payload) {
    queueMicrotask(() => this.emit('message', { data: JSON.stringify(payload) }));
  }

  send(raw) {
    const request = JSON.parse(String(raw));
    if (request.method === 'Runtime.enable') {
      for (const context of this.scenario.contexts || []) {
        this._message({ method: 'Runtime.executionContextCreated', params: { context } });
      }
      this._message({ id: request.id, result: {} });
      return;
    }

    if (request.method !== 'Runtime.evaluate') {
      this._message({ id: request.id, error: { message: 'unsupported method' } });
      return;
    }

    const expression = String(request.params && request.params.expression || '');
    const contextId = Number(request.params && request.params.contextId);
    const isProbe = expression.includes("typeof o.hostHeartbeat === 'function'");
    if (isProbe) {
      const value = Array.isArray(this.scenario.operationContexts)
        && this.scenario.operationContexts.includes(contextId);
      this._message({ id: request.id, result: { result: { type: 'boolean', value } } });
      return;
    }

    this.actualEvaluations += 1;
    if (this.scenario.failActualOnce && this.actualEvaluations === 1) {
      this._message({
        id: request.id,
        result: { exceptionDetails: { text: 'Execution context was destroyed.' }, result: { type: 'undefined' } }
      });
      return;
    }

    let value = null;
    if (expression.includes('"operation":"HOST_HEARTBEAT"')) value = this.scenario.heartbeat || { ok: true };
    else if (expression.includes('"operation":"PENDING_ALERTS"')) value = this.scenario.pendingAlerts || [];
    else if (expression.includes('"operation":"CLAIM_ALERTS"')) value = this.scenario.claimAlerts || [];
    else if (expression.includes('"operation":"RECONCILIATION_STATUS"')) value = this.scenario.reconciliation || { observedClean: true, blockers: [], actionAuthority: false, rawGameplayActionAuthority: false };
    else if (expression.includes('"value":7')) value = 7;
    else value = this.scenario.defaultValue == null ? true : this.scenario.defaultValue;

    this._message({ id: request.id, result: { result: { type: typeof value, value } } });
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    queueMicrotask(() => this.emit('close', {}));
  }
}

function fakeEnvironment(targetSets, scenarios) {
  let fetchIndex = 0;
  const sockets = [];
  return {
    sockets,
    fetchCalls: () => fetchIndex,
    async fetch() {
      const set = targetSets[Math.min(fetchIndex, targetSets.length - 1)] || [];
      fetchIndex += 1;
      return response(set);
    },
    webSocketFactory(url) {
      const scenario = scenarios[url];
      if (!scenario) throw new Error('unexpected websocket url: ' + url);
      const socket = new FakeWebSocket(url, scenario);
      sockets.push(socket);
      return socket;
    }
  };
}

function target(id, url = 'https://adventure.land/character/merchant') {
  return {
    id,
    type: 'page',
    title: id,
    url,
    webSocketDebuggerUrl: 'ws://127.0.0.1:9222/devtools/page/' + id
  };
}

function context(id, origin = 'https://adventure.land', isDefault = true) {
  return { id, origin, auxData: { isDefault } };
}

test('CDP session configuration is loopback-only and Adventure Land is HTTPS by default', () => {
  assert.equal(parseCdpEndpoint('http://127.0.0.1:9222').origin, 'http://127.0.0.1:9222');
  assert.equal(parseAllowedOrigin('https://adventure.land'), 'https://adventure.land');
  assert.throws(() => parseCdpEndpoint('http://192.168.1.20:9222'), /CDP_ENDPOINT_LOOPBACK_HTTP_REQUIRED/);
  assert.throws(() => parseCdpEndpoint('https://127.0.0.1:9222'), /CDP_ENDPOINT_LOOPBACK_HTTP_REQUIRED/);
  assert.throws(() => parseAllowedOrigin('http://adventure.land'), /ADVENTURE_LAND_HTTPS_ORIGIN_REQUIRED/);
});

test('CDP session discovers only same-origin page targets and binds the AIO_V3 operations context', async () => {
  const good = target('good');
  const env = fakeEnvironment(
    [[target('foreign', 'https://example.com/'), good]],
    {
      [good.webSocketDebuggerUrl]: {
        contexts: [
          context(1, 'https://example.com'),
          context(2, 'https://adventure.land', false),
          context(3, 'https://adventure.land', true)
        ],
        operationContexts: [3]
      }
    }
  );
  const driver = new CdpAdventureLandSessionDriver({
    endpoint: 'http://127.0.0.1:9222',
    fetch: env.fetch,
    webSocketFactory: env.webSocketFactory,
    contextSettleMs: 0,
    connectAttempts: 1,
    sleep: async () => {}
  });

  const started = await driver.start();
  assert.equal(started.started, true);
  const status = driver.status();
  assert.equal(status.connected, true);
  assert.equal(status.target.id, 'good');
  assert.equal(status.target.url, good.url);
  assert.equal(status.loopbackOnly, true);
  assert.equal(status.gameplayActionAuthority, false);
  assert.equal(status.rawGameplayActionAuthority, false);
  assert.equal(status.genericRemoteEvaluationExposed, false);
  assert.ok(status.stats.targetRejects >= 1);
  assert.equal(driver.executionContext().url(), good.url);
  await driver.stop();
});

test('BrowserBotClient over the CDP session keeps the public bridge narrow', async () => {
  const good = target('bridge');
  const env = fakeEnvironment([[good]], {
    [good.webSocketDebuggerUrl]: {
      contexts: [context(10)],
      operationContexts: [10],
      heartbeat: {
        schemaVersion: 1,
        type: 'AIO_V3_HOST_WATCHDOG_BEACON',
        seq: 1,
        actionAuthority: false
      }
    }
  });
  const driver = new CdpAdventureLandSessionDriver({
    fetch: env.fetch,
    webSocketFactory: env.webSocketFactory,
    contextSettleMs: 0,
    connectAttempts: 1,
    sleep: async () => {}
  });
  await driver.start();
  const client = new BrowserBotClient({ page: driver.executionContext() });
  const heartbeat = await client.hostHeartbeat();
  assert.equal(heartbeat.seq, 1);
  assert.equal(heartbeat.actionAuthority, false);
  assert.equal(client.evaluate, undefined);
  assert.equal(client.invoke, undefined);
  assert.equal(client.call, undefined);
  assert.equal(client.status().originAllowed, true);
  assert.equal(client.status().gameplayActionAuthority, false);
  await driver.stop();
});

test('CDP session reconnects once to a replacement Adventure Land target after context loss', async () => {
  const first = target('first');
  const second = target('second', 'https://adventure.land/character/merchant?recovered=1');
  const env = fakeEnvironment([[first], [second]], {
    [first.webSocketDebuggerUrl]: {
      contexts: [context(20)],
      operationContexts: [20],
      failActualOnce: true
    },
    [second.webSocketDebuggerUrl]: {
      contexts: [context(21)],
      operationContexts: [21],
      heartbeat: { seq: 2, recovered: true, actionAuthority: false }
    }
  });
  const driver = new CdpAdventureLandSessionDriver({
    fetch: env.fetch,
    webSocketFactory: env.webSocketFactory,
    contextSettleMs: 0,
    connectAttempts: 1,
    reconnectBaseMs: 0,
    reconnectMaxMs: 0,
    sleep: async () => {}
  });
  await driver.start();
  const client = new BrowserBotClient({ page: driver.executionContext() });
  const heartbeat = await client.hostHeartbeat();
  assert.equal(heartbeat.seq, 2);
  assert.equal(heartbeat.recovered, true);
  assert.equal(driver.status().target.id, 'second');
  assert.equal(driver.status().generation, 2);
  assert.ok(driver.status().stats.evaluationFailures >= 1);
  assert.equal(env.fetchCalls(), 2);
  await driver.stop();
});

test('CDP session fails closed when the same-origin page does not expose AIO_V3 operations', async () => {
  const good = target('not-ready');
  const env = fakeEnvironment([[good]], {
    [good.webSocketDebuggerUrl]: {
      contexts: [context(30)],
      operationContexts: []
    }
  });
  const driver = new CdpAdventureLandSessionDriver({
    fetch: env.fetch,
    webSocketFactory: env.webSocketFactory,
    contextSettleMs: 0,
    connectAttempts: 1,
    sleep: async () => {}
  });
  await assert.rejects(() => driver.start(), /AIO_V3_OPERATIONS_UNAVAILABLE/);
  assert.equal(driver.status().connected, false);
  assert.equal(driver.status().gameplayActionAuthority, false);
});

test('ProductionHostHarness manages a session driver without exposing generic browser authority', async () => {
  let starts = 0;
  let stops = 0;
  let invalidations = 0;
  const page = {
    url: () => 'https://adventure.land/',
    isClosed: () => false,
    async evaluate() { return { seq: 1, actionAuthority: false }; }
  };
  const sessionDriver = {
    allowedOrigin: 'https://adventure.land',
    executionContext: () => page,
    async start() { starts += 1; return { started: true }; },
    async stop() { stops += 1; return { stopped: true }; },
    invalidate() { invalidations += 1; },
    status: () => ({
      mode: 'cdp-adventure-land-session',
      connected: starts > stops,
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false,
      genericRemoteEvaluationExposed: false
    })
  };
  const launcher = {
    start: async () => ({ started: true }),
    stop: async () => ({ stopped: true }),
    restart: async () => ({ ok: true }),
    status: () => ({ running: false, stats: { restarts: 0 } })
  };
  const controller = {
    configureRestart: () => ({}),
    tick: async () => ({ watchdog: { state: 'HEALTHY' } }),
    status: () => ({ gameplayActionAuthority: false })
  };
  const api = {
    start: async () => ({ started: true }),
    stop: async () => ({ stopped: true }),
    status: () => ({ loopbackOnly: true })
  };
  const harness = new ProductionHostHarness({
    sessionDriver,
    launcher,
    controller,
    api,
    tickIntervalMs: 60000
  });
  const started = await harness.start({ skipInitialTick: true });
  assert.equal(started.started, true);
  assert.equal(starts, 1);
  assert.equal(harness.status().browserSessionManaged, true);
  assert.equal(harness.status().browserSession.genericRemoteEvaluationExposed, false);
  assert.equal(harness.botClient.evaluate, undefined);
  await harness.stop();
  assert.equal(stops, 1);
  assert.equal(invalidations, 0);
});

test('2500 evaluation soak stays on one valid CDP session without reconnect growth', async () => {
  const good = target('soak');
  const env = fakeEnvironment([[good]], {
    [good.webSocketDebuggerUrl]: {
      contexts: [context(40)],
      operationContexts: [40],
      heartbeat: { seq: 1, actionAuthority: false }
    }
  });
  const driver = new CdpAdventureLandSessionDriver({
    fetch: env.fetch,
    webSocketFactory: env.webSocketFactory,
    contextSettleMs: 0,
    connectAttempts: 1,
    sleep: async () => {}
  });
  await driver.start();
  const client = new BrowserBotClient({ page: driver.executionContext(), timeoutMs: 5000 });
  for (let i = 0; i < 2500; i += 1) {
    const result = await client.hostHeartbeat();
    assert.equal(result.actionAuthority, false);
  }
  const status = driver.status();
  assert.equal(status.generation, 1);
  assert.equal(status.stats.discoveryFailures, 0);
  assert.equal(status.stats.evaluationFailures, 0);
  assert.equal(status.stats.evaluations, 2500);
  assert.equal(env.fetchCalls(), 1);
  await driver.stop();
});
