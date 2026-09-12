'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { BrowserBotClient, browserDispatcher } = require('../host/browser-bot-client');
const { ProductionHostHarness } = require('../host/production-host-harness');
const { HeadlessHostController } = require('../host/headless-host-controller');
const { buildReconciliationStatus, RECONCILIATION_STATUS_TYPE } = require('../src/ops/reconciliation-status');

function pageWithOperations(operations, options = {}) {
  const calls = [];
  let closed = false;
  return {
    calls,
    url: () => options.url || 'https://adventure.land/game',
    isClosed: () => closed,
    closeForTest: () => { closed = true; },
    async evaluate(fn, payload) {
      calls.push(JSON.parse(JSON.stringify(payload)));
      if (options.evaluate) return options.evaluate(fn, payload);
      const previous = globalThis.AIO_V3;
      globalThis.AIO_V3 = { operations };
      try { return await fn(payload); }
      finally {
        if (previous === undefined) delete globalThis.AIO_V3;
        else globalThis.AIO_V3 = previous;
      }
    }
  };
}

function cleanRuntime(overrides = {}) {
  return Object.assign({
    transactionEngine: { status: () => ({ active: 0, recovering: 0 }) },
    bankExpansionTransactions: { status: () => ({ active: 0, recovering: 0 }) },
    merchantSpaceRecoveryJournal: { status: () => ({ active: 0, recovering: 0, states: { RECOVERING: 0 } }) },
    controlledMerchantSpaceRecovery: { status: () => ({ enabled: false, busy: false }) },
    controlledBankConsolidation: { status: () => ({ enabled: false, busy: false }) },
    safeTravel: { status: () => ({ active: 0 }) },
    controlledPartyLifecycle: { status: () => ({ enabled: false, busy: false, operation: null, developmentSession: null }) },
    alpha20LiveGateStatus: () => ({ running: false, phase: 'COMPLETE' })
  }, overrides);
}

function validBeacon(clock, seq = 1, runId = 'bridge-run') {
  return {
    schemaVersion: 1,
    type: 'AIO_V3_HOST_WATCHDOG_BEACON',
    seq,
    at: clock.value,
    deadlineAt: clock.value + 5000,
    leaseMs: 5000,
    runId,
    release: '3.0.0-alpha.20.0',
    character: { name: 'MerchantA', ctype: 'merchant', map: 'main', rip: false },
    runtime: { mode: 'shadow', heartbeatAt: clock.value, snapshotAt: clock.value },
    health: { state: 'HEALTHY', watchdogState: 'HEALTHY', groupState: 'HEALTHY', fourCharacterReady: true },
    recovery: { enabled: false, stage: null, rawGameplayActionAuthority: false, automaticRestart: false },
    alerts: { pending: 0, pendingCritical: 0 },
    contract: {
      externalDeadManRequired: true,
      hostMustTreatMissedDeadlineAsUnhealthy: true,
      hostOwnsRestart: true,
      authenticationOwnedByHost: true,
      actionAuthority: false
    }
  };
}

function memoryStateStore() {
  let value = { schemaVersion: 1, records: [] };
  return {
    load: () => JSON.parse(JSON.stringify(value)),
    save: (next) => { value = JSON.parse(JSON.stringify(next)); return true; },
    status: () => ({ mode: 'memory-test-store' })
  };
}

test('BrowserBotClient exposes exactly the four host operations and no generic evaluate/invoke surface', async () => {
  const observed = [];
  const operations = {
    hostHeartbeat: () => ({ type: 'heartbeat' }),
    pendingAlerts: (limit) => { observed.push(['pending', limit]); return [{ id: 'a1' }]; },
    claimAlerts: (ids) => { observed.push(['claim', ids]); return ids.map((id) => ({ id, claimed: true })); },
    reconciliationStatus: () => ({ type: RECONCILIATION_STATUS_TYPE, observedClean: true, blockers: [], actionAuthority: false, rawGameplayActionAuthority: false })
  };
  const page = pageWithOperations(operations);
  const client = new BrowserBotClient({ page });

  assert.deepEqual(await client.hostHeartbeat(), { type: 'heartbeat' });
  assert.deepEqual(await client.pendingAlerts(999), [{ id: 'a1' }]);
  assert.deepEqual(await client.claimAlerts(['a1']), [{ id: 'a1', claimed: true }]);
  assert.equal((await client.reconciliationStatus()).observedClean, true);
  assert.deepEqual(observed, [['pending', 100], ['claim', ['a1']]]);
  assert.deepEqual(page.calls.map((row) => row.operation), ['HOST_HEARTBEAT', 'PENDING_ALERTS', 'CLAIM_ALERTS', 'RECONCILIATION_STATUS']);
  assert.equal(client.evaluate, undefined);
  assert.equal(client.invoke, undefined);
  assert.equal(client.call, undefined);
  const status = client.status();
  assert.equal(status.arbitraryEvaluateExposed, false);
  assert.equal(status.genericInvokeExposed, false);
  assert.equal(status.gameplayActionAuthority, false);
  assert.equal(status.rawGameplayActionAuthority, false);
  assert.equal(status.originAllowed, true);
});

test('browser dispatcher rejects missing operations and every non-host operation', () => {
  const previous = globalThis.AIO_V3;
  try {
    delete globalThis.AIO_V3;
    assert.throws(() => browserDispatcher({ operation: 'HOST_HEARTBEAT' }), /AIO_V3_OPERATIONS_UNAVAILABLE/);
    globalThis.AIO_V3 = { operations: { hostHeartbeat: () => ({}) } };
    assert.throws(() => browserDispatcher({ operation: 'ATTACK' }), /HOST_OPERATION_NOT_ALLOWED/);
    assert.throws(() => browserDispatcher({ operation: 'SMART_MOVE' }), /HOST_OPERATION_NOT_ALLOWED/);
    assert.throws(() => browserDispatcher({ operation: 'SELL' }), /HOST_OPERATION_NOT_ALLOWED/);
  } finally {
    if (previous === undefined) delete globalThis.AIO_V3;
    else globalThis.AIO_V3 = previous;
  }
});

test('claim validation rejects asynchronously before page evaluation', async () => {
  const page = pageWithOperations({ claimAlerts: () => { throw new Error('must not execute'); } });
  const client = new BrowserBotClient({ page });
  await assert.rejects(() => client.claimAlerts('a1'), /CLAIM_IDS_ARRAY_REQUIRED/);
  await assert.rejects(() => client.claimAlerts(['a1', 'a1']), /CLAIM_ID_DUPLICATE/);
  await assert.rejects(() => client.claimAlerts(['x'.repeat(161)]), /CLAIM_ID_INVALID/);
  await assert.rejects(() => client.claimAlerts(Array.from({ length: 101 }, (_, i) => `a${i}`)), /CLAIM_IDS_LIMIT_EXCEEDED/);
  assert.equal(page.calls.length, 0);
  assert.equal(client.status().stats.inputRejects, 4);
  assert.equal(client.status().stats.failures, 4);
  assert.deepEqual(await client.claimAlerts([]), []);
  assert.equal(page.calls.length, 0);
});

test('bridge fails closed on wrong origin, insecure origin and closed browser context without status side effects', async () => {
  const wrongPage = pageWithOperations({}, { url: 'https://example.com/' });
  const wrong = new BrowserBotClient({ page: wrongPage });
  assert.equal(wrong.status().origin, 'https://example.com');
  assert.equal(wrong.status().stats.originRejects, 0);
  await assert.rejects(() => wrong.hostHeartbeat(), /BROWSER_CONTEXT_ORIGIN_REJECTED/);
  assert.equal(wrong.status().stats.originRejects, 1);
  assert.equal(wrong.status().stats.failures, 1);
  assert.equal(wrongPage.calls.length, 0);

  assert.throws(
    () => new BrowserBotClient({ page: pageWithOperations({}, { url: 'http://adventure.land/' }), allowedOrigins: ['http://adventure.land'] }),
    /BROWSER_BRIDGE_HTTPS_ORIGIN_REQUIRED/
  );

  const closedPage = pageWithOperations({ hostHeartbeat: () => ({}) });
  closedPage.closeForTest();
  const closed = new BrowserBotClient({ page: closedPage });
  await assert.rejects(() => closed.hostHeartbeat(), /BROWSER_CONTEXT_CLOSED/);
  assert.equal(closedPage.calls.length, 0);
});

test('bridge rejects oversized and non-serializable browser results without exposing page state', async () => {
  const huge = new BrowserBotClient({
    page: pageWithOperations({ hostHeartbeat: () => ({ data: 'x'.repeat(5000) }) }),
    maxResultBytes: 4096
  });
  await assert.rejects(() => huge.hostHeartbeat(), /BROWSER_RESULT_TOO_LARGE/);
  assert.equal(huge.status().stats.resultRejects, 1);

  const cyclic = {};
  cyclic.self = cyclic;
  const page = pageWithOperations({}, { evaluate: async () => cyclic });
  const client = new BrowserBotClient({ page });
  await assert.rejects(() => client.hostHeartbeat(), /BROWSER_RESULT_NOT_SERIALIZABLE/);
  assert.equal(Object.prototype.hasOwnProperty.call(client, 'page'), false);
  assert.equal(JSON.stringify(client.status()).includes('cyclic'), false);
});

test('bridge timeout stays live and keeps the underlying evaluation single-flight until it actually settles', async () => {
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const page = pageWithOperations({}, { evaluate: async () => pending });
  const client = new BrowserBotClient({ page, timeoutMs: 250 });

  await assert.rejects(() => client.hostHeartbeat(), /BROWSER_BRIDGE_TIMEOUT/);
  assert.equal(client.status().inFlight.operation, 'HOST_HEARTBEAT');
  await assert.rejects(() => client.reconciliationStatus(), /BROWSER_BRIDGE_BUSY/);
  assert.equal(page.calls.length, 1, 'busy rejection must not start a second page evaluation');

  release({ ok: true });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(client.status().inFlight, null);
  assert.equal(client.status().stats.timeouts, 1);
  assert.equal(client.status().stats.busyRejects, 1);
});

test('reconciliation evidence is observation-only and blocks every unresolved action family', () => {
  let result = buildReconciliationStatus(
    cleanRuntime(),
    () => 12345,
    { status: () => ({ enabled: false, degradedSince: null, lastPlan: { stage: 'NONE' } }) }
  );
  assert.equal(result.type, RECONCILIATION_STATUS_TYPE);
  assert.equal(result.observedAt, 12345);
  assert.equal(result.observedClean, true);
  assert.equal(result.actionAuthority, false);
  assert.equal(result.rawGameplayActionAuthority, false);
  assert.deepEqual(result.blockers, []);

  const runtime = cleanRuntime({
    transactionEngine: { status: () => ({ active: 1, recovering: 2 }) },
    bankExpansionTransactions: { status: () => ({ active: 1, recovering: 1 }) },
    merchantSpaceRecoveryJournal: { status: () => ({ active: 1, recovering: 1, states: { RECOVERING: 1 } }) },
    controlledMerchantSpaceRecovery: { status: () => ({ enabled: false, busy: true }) },
    controlledBankConsolidation: { status: () => ({ enabled: false, busy: true }) },
    safeTravel: { status: () => ({ active: 1 }) },
    controlledPartyLifecycle: { status: () => ({ busy: true, operation: { state: 'RECOVERING' }, developmentSession: { candidate: 'Rogue' } }) },
    alpha20LiveGateStatus: () => ({ running: true, phase: 'PASSIVE_OBSERVATION' })
  });
  result = buildReconciliationStatus(
    runtime,
    () => 20000,
    { status: () => ({ enabled: true, degradedSince: 19000, lastPlan: { stage: 'REOBSERVE' } }) }
  );
  assert.equal(result.observedClean, false);
  for (const blocker of [
    'ECONOMY_TRANSACTION_ACTIVE', 'ECONOMY_TRANSACTION_RECOVERING',
    'BANK_EXPANSION_ACTIVE', 'BANK_EXPANSION_RECOVERING',
    'MERCHANT_SPACE_RECOVERY_ACTIVE', 'MERCHANT_SPACE_RECOVERY_RECOVERING',
    'CONTROLLED_MERCHANT_SPACE_RECOVERY_BUSY', 'BANK_CONSOLIDATION_BUSY',
    'TRAVEL_ACTIVE', 'PARTY_LIFECYCLE_BUSY', 'PARTY_LIFECYCLE_RECOVERY_REQUIRED',
    'ALPHA20_LIVE_GATE_RUNNING', 'SAFE_RECOVERY_INCIDENT_ACTIVE'
  ]) assert.equal(result.blockers.includes(blocker), true, blocker);
  assert.equal(result.actionAuthority, false);
  assert.equal(result.rawGameplayActionAuthority, false);
});

test('reconciliation evidence fails closed when required runtime status surfaces are missing or throw', () => {
  const result = buildReconciliationStatus({
    transactionEngine: { status: () => { throw new Error('corrupt'); } },
    alpha20LiveGateStatus: () => null
  }, () => 1);
  assert.equal(result.observedClean, false);
  for (const blocker of [
    'ECONOMY_STATUS_UNAVAILABLE',
    'BANK_EXPANSION_STATUS_UNAVAILABLE',
    'MERCHANT_SPACE_RECOVERY_STATUS_UNAVAILABLE',
    'CONTROLLED_SPACE_RECOVERY_STATUS_UNAVAILABLE',
    'BANK_CONSOLIDATION_STATUS_UNAVAILABLE',
    'TRAVEL_STATUS_UNAVAILABLE',
    'PARTY_LIFECYCLE_STATUS_UNAVAILABLE',
    'ALPHA20_LIVE_GATE_STATUS_UNAVAILABLE'
  ]) assert.equal(result.blockers.includes(blocker), true, blocker);
  assert.equal(result.actionAuthority, false);
  assert.equal(result.rawGameplayActionAuthority, false);
});

test('ProductionHostHarness constructs only the narrow client from an injected Adventure Land execution context', () => {
  const page = pageWithOperations({});
  const harness = new ProductionHostHarness({ browserPage: page, alertStore: memoryStateStore() });
  const status = harness.status();
  assert.equal(status.narrowBrowserBridge, true);
  assert.equal(status.botClient.mode, 'narrow-browser-bot-client');
  assert.equal(status.gameplayActionAuthority, false);
  assert.equal(status.rawGameplayActionAuthority, false);
  assert.equal(typeof harness.botClient.hostHeartbeat, 'function');
  assert.equal(harness.botClient.evaluate, undefined);
  assert.equal(harness.botClient.invoke, undefined);
});

test('HeadlessHostController polls and persist-before-claims through BrowserBotClient without generic page authority', async () => {
  const clock = { value: 1000 };
  const claimed = [];
  let pending = [{ id: 'alert-bridge-1', severity: 'CRITICAL', type: 'BRIDGE_TEST', reason: 'TEST', at: 1000 }];
  const operations = {
    hostHeartbeat: () => validBeacon(clock),
    pendingAlerts: () => pending,
    claimAlerts: (ids) => {
      claimed.push(...ids);
      pending = pending.filter((row) => !ids.includes(row.id));
      return ids.map((id) => ({ id, claimed: true }));
    },
    reconciliationStatus: () => ({
      schemaVersion: 1,
      type: RECONCILIATION_STATUS_TYPE,
      observedClean: true,
      blockers: [],
      actionAuthority: false,
      rawGameplayActionAuthority: false
    })
  };
  const client = new BrowserBotClient({ page: pageWithOperations(operations) });
  const controller = new HeadlessHostController({
    now: () => clock.value,
    botClient: client,
    alertStore: memoryStateStore(),
    alertTransports: [{ name: 'test', severities: ['CRITICAL'], send: async () => ({ ok: true }) }]
  });
  const result = await controller.tick();
  assert.equal(result.status.watchdog.state, 'HEALTHY');
  assert.deepEqual(claimed, ['alert-bridge-1']);
  assert.equal(client.status().gameplayActionAuthority, false);
  assert.equal(client.evaluate, undefined);
});

test('3000-call browser bridge soak remains bounded, origin-locked and gameplay-authority free', async () => {
  let seq = 0;
  const page = pageWithOperations({
    hostHeartbeat: () => ({ seq: ++seq, actionAuthority: false }),
    pendingAlerts: () => [],
    claimAlerts: (ids) => ids,
    reconciliationStatus: () => ({ observedClean: true, blockers: [], actionAuthority: false, rawGameplayActionAuthority: false })
  });
  const client = new BrowserBotClient({ page });

  for (let i = 0; i < 3000; i += 1) {
    const mode = i % 3;
    if (mode === 0) assert.equal((await client.hostHeartbeat()).actionAuthority, false);
    else if (mode === 1) assert.deepEqual(await client.pendingAlerts(25), []);
    else assert.equal((await client.reconciliationStatus()).observedClean, true);
  }

  const status = client.status();
  assert.equal(status.stats.calls, 3000);
  assert.equal(status.stats.successes, 3000);
  assert.equal(status.stats.failures, 0);
  assert.equal(status.inFlight, null);
  assert.equal(status.origin, 'https://adventure.land');
  assert.equal(status.originAllowed, true);
  assert.equal(status.allowedOperations.length, 4);
  assert.equal(status.gameplayActionAuthority, false);
  assert.equal(status.rawGameplayActionAuthority, false);
  assert.equal(page.calls.length, 3000);
});
