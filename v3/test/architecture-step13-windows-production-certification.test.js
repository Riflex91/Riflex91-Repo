'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { HostApiServer } = require('../host/host-api-server');
const { HostWatchdogSupervisor } = require('../host/host-watchdog-supervisor');
const { RestartReconciliationObserver } = require('../host/restart-reconciliation-observer');
const { buildReconciliationStatus } = require('../src/ops/reconciliation-status');
const {
  GATE_ORDER,
  CERTIFICATION_GATES,
  HashChainedCertificationEvidence,
  assessHostCertificationStatus,
  evaluateCertification,
  controlledRecoveryMarkerEvidence,
  verifyPassedEvidence
} = require('../host/unattended-certification');

function tempFile(name = 'evidence.jsonl') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-step13-'));
  return path.join(dir, name);
}

function healthyPayload(overrides = {}) {
  const payload = {
    ok: true,
    hostApi: {
      listening: true,
      loopbackOnly: true,
      authenticated: true,
      methods: ['GET'],
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false
    },
    launcher: {
      running: true,
      pid: 1234,
      inheritsProcessEnv: false,
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false
    },
    controller: {
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false,
      dashboardDecisionAuthority: false,
      lastHeartbeatError: null,
      lastAlertError: null,
      watchdog: {
        state: 'HEALTHY',
        deadman: { dead: false, state: 'HEALTHY' },
        gameplayActionAuthority: false,
        rawGameplayActionAuthority: false,
        lastRunId: 'run-1',
        lastBeaconSummary: {
          runId: 'run-1',
          seq: 11,
          character: { name: 'Merchant', ctype: 'merchant', map: 'main', rip: false },
          health: { state: 'HEALTHY', groupState: 'HEALTHY', fourCharacterReady: true },
          contract: { actionAuthority: false }
        },
        restartBudget: { used: 0, max: 3 },
        stats: { restartAttempts: 0, restartSuccesses: 0 }
      },
      reconciliation: {
        state: 'IDLE',
        current: { observedAt: 1000, observedClean: true, blockers: [], lastError: null },
        gameplayActionAuthority: false,
        rawGameplayActionAuthority: false,
        reconciliationActionAuthority: false,
        stats: { clean: 0, freshRuns: 0 }
      },
      alertRelay: {
        durableReady: true,
        pendingCritical: 0,
        gameplayActionAuthority: false,
        rawGameplayActionAuthority: false,
        operatorAckAuthority: false,
        transports: [
          { name: 'critical-primary', severities: ['CRITICAL'], required: true },
          { name: 'critical-fallback', severities: ['CRITICAL'], required: true }
        ]
      },
      stats: { ticks: 100 }
    },
    runtimeHost: {
      running: true,
      startedAt: 500,
      gameplayActionAuthority: false,
      rawGameplayActionAuthority: false,
      browserSessionManaged: true,
      narrowBrowserBridge: true,
      lastTickError: null,
      botClient: {
        mode: 'narrow-browser-bot-client',
        originAllowed: true,
        allowedOperations: ['HOST_HEARTBEAT','PENDING_ALERTS','CLAIM_ALERTS','RECONCILIATION_STATUS'],
        arbitraryEvaluateExposed: false,
        genericInvokeExposed: false,
        gameplayActionAuthority: false,
        rawGameplayActionAuthority: false,
        lastError: null
      },
      browserSession: {
        connected: true,
        loopbackOnly: true,
        gameplayActionAuthority: false,
        rawGameplayActionAuthority: false,
        genericRemoteEvaluationExposed: false,
        generation: 1,
        startup: { state: 'READY' }
      }
    }
  };
  return Object.assign(payload, overrides);
}

function goodAssessment(runId = 'run-1', extras = {}) {
  return {
    ok: true,
    reasons: [],
    facts: {
      runId,
      beaconSeq: 10,
      fourCharacterReady: true,
      watchdogState: 'HEALTHY',
      restartSuccesses: 0,
      restartAttempts: 0,
      restartBudgetUsed: 0,
      restartBudgetMax: 3,
      reconciliationState: 'IDLE',
      reconciliationCleanCount: 0,
      reconciliationFreshRuns: 0,
      pendingCritical: 0,
      browserGeneration: 1,
      hostTicks: 100,
      dataComplete: true,
      hostStartIdentity: '500',
      ...extras
    }
  };
}

test('Step 13 gate order and production durations are fixed and monotonic', () => {
  assert.deepEqual(GATE_ORDER, ['canary', '1h', '24h', '72h', '7d']);
  assert.equal(CERTIFICATION_GATES.canary.durationMs, 15 * 60 * 1000);
  assert.equal(CERTIFICATION_GATES['1h'].durationMs, 60 * 60 * 1000);
  assert.equal(CERTIFICATION_GATES['24h'].durationMs, 24 * 60 * 60 * 1000);
  assert.equal(CERTIFICATION_GATES['72h'].durationMs, 72 * 60 * 60 * 1000);
  assert.equal(CERTIFICATION_GATES['7d'].durationMs, 7 * 24 * 60 * 60 * 1000);
  assert.equal(CERTIFICATION_GATES['24h'].prerequisite, '1h');
  assert.equal(CERTIFICATION_GATES['7d'].prerequisite, '72h');
});

test('healthy production status passes every host/session/liveness/alert authority invariant', () => {
  const result = assessHostCertificationStatus(healthyPayload(), 1000);
  assert.equal(result.ok, true);
  assert.deepEqual(result.reasons, []);
  assert.equal(result.facts.runId, 'run-1');
  assert.equal(result.facts.fourCharacterReady, true);
});

test('certification status fails closed on session loss, group liveness loss, critical alert or secret inheritance', () => {
  const payload = healthyPayload();
  payload.runtimeHost.browserSession.connected = false;
  payload.controller.watchdog.lastBeaconSummary.health.fourCharacterReady = false;
  payload.controller.alertRelay.pendingCritical = 1;
  payload.launcher.inheritsProcessEnv = true;
  const result = assessHostCertificationStatus(payload, 1000);
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes('CDP_SESSION_NOT_CONNECTED'));
  assert.ok(result.reasons.includes('FOUR_CHARACTER_GROUP_NOT_READY'));
  assert.ok(result.reasons.includes('CRITICAL_ALERT_PENDING'));
  assert.ok(result.reasons.includes('BROWSER_SECRET_ISOLATION_INVALID'));
});

test('Host API status provider adds read-only runtime host evidence without adding methods', () => {
  const api = new HostApiServer({
    token: 'x'.repeat(64),
    controller: { status: () => ({ gameplayActionAuthority: false }) },
    launcher: { status: () => ({ running: true }) },
    hostStatusProvider: () => ({ browserSession: { connected: true }, gameplayActionAuthority: false })
  });
  const payload = api._statusPayload();
  assert.equal(payload.runtimeHost.browserSession.connected, true);
  assert.equal(api.status().methods.length, 1);
  assert.equal(api.status().methods[0], 'GET');
  assert.equal(api.status().gameplayActionAuthority, false);
});

test('watchdog certification beacon summary is allowlisted and cannot echo unknown secret fields', () => {
  const clock = { value: 1000 };
  const watchdog = new HostWatchdogSupervisor({ now: () => clock.value });
  const beacon = {
    schemaVersion: 1,
    type: 'AIO_V3_HOST_WATCHDOG_BEACON',
    seq: 1,
    at: 1000,
    deadlineAt: 31000,
    leaseMs: 30000,
    runId: 'run-1',
    release: '3.0.0',
    character: { name: 'Merchant', ctype: 'merchant', map: 'main', rip: false, secret: 'never' },
    runtime: { mode: 'active', heartbeatAt: 1000, snapshotAt: 1000, token: 'never' },
    health: { state: 'HEALTHY', watchdogState: 'HEALTHY', watchdogReason: null, groupState: 'HEALTHY', fourCharacterReady: true, password: 'never' },
    alerts: { pending: 0, pendingCritical: 0, credential: 'never' },
    contract: { externalDeadManRequired: true, hostOwnsRestart: true, authenticationOwnedByHost: true, actionAuthority: false }
  };
  assert.equal(watchdog.acceptBeacon(beacon).accepted, true);
  const serialized = JSON.stringify(watchdog.status().lastBeaconSummary);
  assert.equal(serialized.includes('never'), false);
  assert.equal(watchdog.status().lastBeaconSummary.health.fourCharacterReady, true);
});

test('hash-chained evidence detects tampering and keeps marker secrets redacted', () => {
  const file = tempFile();
  const store = new HashChainedCertificationEvidence({ filePath: file, now: () => 1000 });
  store.append('MARKER', {
    type: 'dual_route_alert_canary',
    ok: true,
    data: { authorization: 'Bearer secret', result: 'ok' }
  }, 1000);
  store.append('START', { gate: 'canary' }, 1100);
  const rows = store.readVerified();
  assert.equal(rows.length, 2);
  assert.equal(rows[0].payload.data.authorization, '[REDACTED]');
  assert.equal(store.status().valid, true);

  const text = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, text.replace('"result":"ok"', '"result":"tampered"'));
  assert.throws(() => store.readVerified(), /CERTIFICATION_EVIDENCE_HASH_INVALID/);
  assert.equal(store.status().valid, false);
});

test('canary passes only after dual-route canary, verified recovery marker and stable duration samples', () => {
  const file = tempFile();
  const store = new HashChainedCertificationEvidence({ filePath: file });
  store.append('MARKER', { type: 'dual_route_alert_canary', ok: true, data: { routes: [{ name: 'critical-primary', ok: true }, { name: 'critical-fallback', ok: true }] } }, 100);
  store.append('MARKER', {
    type: 'controlled_recovery_canary',
    ok: true,
    data: {
      previousRunId: 'run-before',
      currentRunId: 'run-after',
      restartSuccessesBefore: 0,
      restartSuccessesAfter: 1,
      reconciliationCleanBefore: 0,
      reconciliationCleanAfter: 1,
      reconciliationState: 'OBSERVED_CLEAN'
    }
  }, 200);
  store.append('START', { gate: 'canary' }, 1000);
  for (const at of [1000, 2000, 3000, 4000]) store.append('SAMPLE', { assessment: goodAssessment('run-after') }, at);

  const gate = { name: 'canary', durationMs: 3000, pollMs: 1000, maxGapMs: 1500, prerequisite: null, requireRecoveryDrill: true, requireAlertCanary: true, requireRuntimeAudit: false };
  const result = evaluateCertification(store.readVerified(), gate, 4000);
  assert.equal(result.passed, true);
  assert.equal(result.complete, true);
  assert.equal(result.recovery.passed, true);
  assert.equal(result.markers.dualRouteAlertCanary, true);
});

test('controlled recovery marker rejects fake unchanged run/counter evidence', () => {
  const file = tempFile();
  const store = new HashChainedCertificationEvidence({ filePath: file });
  store.append('MARKER', {
    type: 'controlled_recovery_canary',
    ok: true,
    data: {
      previousRunId: 'same',
      currentRunId: 'same',
      restartSuccessesBefore: 1,
      restartSuccessesAfter: 1,
      reconciliationCleanBefore: 2,
      reconciliationCleanAfter: 2,
      reconciliationState: 'OBSERVED_CLEAN'
    }
  }, 1000);
  const result = controlledRecoveryMarkerEvidence(store.readVerified());
  assert.equal(result.passed, false);
  assert.equal(result.reason, 'CONTROLLED_RECOVERY_RUN_ID_NOT_FRESH');
});

test('elapsed time alone never passes: unhealthy samples and sampling gaps permanently fail the run', () => {
  const file = tempFile();
  const store = new HashChainedCertificationEvidence({ filePath: file });
  store.append('START', { gate: '1h' }, 1000);
  store.append('MARKER', { type: 'prerequisite:canary', ok: true }, 1000);
  store.append('SAMPLE', { assessment: goodAssessment() }, 1000);
  store.append('SAMPLE', { assessment: { ok: false, reasons: ['WATCHDOG_NOT_HEALTHY'], facts: {} } }, 2000);
  store.append('SAMPLE', { assessment: goodAssessment() }, 5000);
  const gate = { name: '1h', durationMs: 3000, pollMs: 1000, maxGapMs: 1500, prerequisite: 'canary', requireRecoveryDrill: false, requireAlertCanary: false, requireRuntimeAudit: false };
  const result = evaluateCertification(store.readVerified(), gate, 5000);
  assert.equal(result.passed, false);
  assert.ok(result.reasons.some((x) => x.startsWith('UNHEALTHY_SAMPLE_AT_')));
  assert.ok(result.reasons.some((x) => x.startsWith('SAMPLE_GAP_EXCEEDED_AT_')));
});

test('24h+ gates require explicit runtime action audit evidence with a hashed review source', () => {
  const file = tempFile();
  const store = new HashChainedCertificationEvidence({ filePath: file });
  store.append('MARKER', { type: 'prerequisite:1h', ok: true }, 900);
  store.append('START', { gate: '24h' }, 1000);
  for (const at of [1000, 2000, 3000, 4000]) store.append('SAMPLE', { assessment: goodAssessment() }, at);
  const gate = { name: '24h', durationMs: 3000, pollMs: 1000, maxGapMs: 1500, prerequisite: '1h', requireRecoveryDrill: false, requireAlertCanary: false, requireRuntimeAudit: true };
  let result = evaluateCertification(store.readVerified(), gate, 4000);
  assert.equal(result.passed, false);
  assert.ok(result.reasons.includes('RUNTIME_ACTION_AUDIT_MISSING'));

  store.append('MARKER', { type: 'runtime_action_audit_clean', ok: true, data: { sourceName: 'audit.json', sha256: 'a'.repeat(64), reviewed: true, result: 'CLEAN', unexpectedRawGameplayActions: 0 } }, 4000);
  result = evaluateCertification(store.readVerified(), gate, 4000);
  assert.equal(result.passed, true);
});

test('passed prerequisite evidence is hash-verified and tied to the expected gate', () => {
  const file = tempFile('canary.jsonl');
  const store = new HashChainedCertificationEvidence({ filePath: file });
  store.append('START', { gate: 'canary' }, 1000);
  store.append('FINAL', { result: { gate: 'canary', passed: true, evaluatedAt: 2000 } }, 2000);
  const proof = verifyPassedEvidence(file, 'canary');
  assert.equal(proof.gate, 'canary');
  assert.equal(typeof proof.terminalHash, 'string');
  assert.throws(() => verifyPassedEvidence(file, '1h'), /CERTIFICATION_PREREQUISITE_NOT_PASSED/);
});

test('Windows certification scripts use Task Scheduler, DPAPI, explicit restart acknowledgement and immutable audit hashes', () => {
  const root = path.resolve(__dirname, '..', '..');
  const start = fs.readFileSync(path.join(root, 'ops', 'windows-host', 'start-certification.ps1'), 'utf8');
  const run = fs.readFileSync(path.join(root, 'ops', 'windows-host', 'run-certification.ps1'), 'utf8');
  const recovery = fs.readFileSync(path.join(root, 'ops', 'windows-host', 'invoke-recovery-canary.ps1'), 'utf8');
  const audit = fs.readFileSync(path.join(root, 'ops', 'windows-host', 'record-certification-audit.ps1'), 'utf8');

  assert.match(start, /New-ScheduledTaskTrigger -AtLogOn/);
  assert.match(start, /CANARY_REQUIRES_EXPLICIT_RESTART_ACK/);
  assert.ok(start.indexOf('DUAL_ROUTE_ALERT_CANARY_EVIDENCE_FAILED') < start.indexOf("$initArgs = @($entry,'init'"));
  assert.match(run, /DataProtectionScope\]::CurrentUser/);
  assert.match(run, /Remove-Item Env:AIO_V3_HOST_API_TOKEN/);
  assert.match(recovery, /Stop-Process -Id \$browserPid -Force/);
  assert.match(recovery, /OBSERVED_CLEAN/);
  assert.match(recovery, /controlled_recovery_canary/);
  assert.match(audit, /IReviewedRuntimeActions/);
  assert.match(audit, /NoUnexpectedRawGameplayActions/);
  assert.match(audit, /unexpectedRawGameplayActions = 0/);
  assert.match(audit, /Get-FileHash -Algorithm SHA256/);
  assert.match(audit, /runtime_action_audit_clean/);
});


test('certification evidence fails closed on clock regression and future timestamps', () => {
  const file = tempFile('clock.jsonl');
  const clock = { value: 5000 };
  const store = new HashChainedCertificationEvidence({ filePath: file, now: () => clock.value });
  store.append('START', { gate: '1h' }, 4000);
  assert.throws(() => store.append('SAMPLE', { assessment: goodAssessment() }, 3999), /CERTIFICATION_EVIDENCE_CLOCK_REGRESSION/);
  assert.throws(() => store.append('SAMPLE', { assessment: goodAssessment() }, clock.value + (2 * 60 * 1000) + 1), /CERTIFICATION_EVIDENCE_CLOCK_AHEAD/);

  const rows = [
    { seq: 1, kind: 'START', at: 1000, payload: { gate: '1h' } },
    { seq: 2, kind: 'SAMPLE', at: 900, payload: { assessment: goodAssessment() } },
    { seq: 3, kind: 'SAMPLE', at: 200000, payload: { assessment: goodAssessment() } }
  ];
  const gate = { name: '1h', durationMs: 1, pollMs: 1, maxGapMs: 500000, prerequisite: null, requireRecoveryDrill: false, requireAlertCanary: false, requireRuntimeAudit: false };
  const result = evaluateCertification(rows, gate, 2000);
  assert.equal(result.passed, false);
  assert.equal(result.status, 'FAIL');
  assert.ok(result.reasons.some((reason) => reason.startsWith('CLOCK_REGRESSION_AT_')));
  assert.ok(result.reasons.some((reason) => reason.startsWith('FUTURE_TIMESTAMP_AT_')));
});

test('current reconciliation evidence is required, fresh and clean for every production sample', () => {
  let payload = healthyPayload();
  delete payload.controller.reconciliation.current;
  let result = assessHostCertificationStatus(payload, 1000);
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes('CURRENT_RECONCILIATION_EVIDENCE_MISSING'));

  payload = healthyPayload();
  payload.controller.reconciliation.current = { observedAt: 1, observedClean: false, blockers: ['ECONOMY_TRANSACTION_RECOVERING'], lastError: null };
  result = assessHostCertificationStatus(payload, 70000);
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes('CURRENT_RECONCILIATION_STALE'));
  assert.ok(result.reasons.includes('CURRENT_RECONCILIATION_NOT_CLEAN'));
});

test('passive reconciliation polling uses only reconciliationStatus and never gains action authority', async () => {
  let calls = 0;
  const observer = new RestartReconciliationObserver({
    now: () => 1234,
    botClient: {
      reconciliationStatus: async () => {
        calls += 1;
        return { actionAuthority: false, rawGameplayActionAuthority: false, observedClean: true, blockers: [] };
      }
    }
  });
  const result = await observer.observeCurrent();
  assert.equal(result.observed, true);
  assert.equal(result.clean, true);
  assert.equal(calls, 1);
  const status = observer.status();
  assert.equal(status.state, 'IDLE');
  assert.equal(status.current.observedClean, true);
  assert.equal(status.gameplayActionAuthority, false);
  assert.equal(status.rawGameplayActionAuthority, false);
  assert.equal(status.reconciliationActionAuthority, false);
});

test('reconciliation blocks open critical circuits without gaining action authority', () => {
  const runtime = {
    transactionEngine: { status: () => ({ active: 0, recovering: 0, circuits: { SELL: { open: true } } }) },
    bankExpansionTransactions: { status: () => ({ active: 0, recovering: 0, breaker: { open: true } }) },
    merchantSpaceRecoveryJournal: { status: () => ({ active: 0, recovering: 0, states: {}, breaker: { open: true } }) },
    controlledMerchantSpaceRecovery: { status: () => ({ enabled: false, busy: false }) },
    controlledBankConsolidation: { status: () => ({ enabled: false, busy: false }) },
    safeTravel: { status: () => ({ active: 0, circuit: { open: true } }) },
    controlledPartyLifecycle: { status: () => ({ enabled: false, busy: false, operation: null, breaker: { open: true } }) },
    controlledMerchantService: { status: () => ({ enabled: false, busy: false, activeOperation: null, circuit: { open: true } }) },
    adapter: { stabilityStatus: () => ({ movement: { circuitOpen: true } }) },
    persistence: { status: () => ({ saveCircuitOpen: true, saveCircuitUntil: 9999 }) },
    alpha20LiveGateStatus: () => ({ running: false, phase: 'COMPLETE' })
  };
  const result = buildReconciliationStatus(runtime, () => 1000);
  assert.equal(result.observedClean, false);
  for (const blocker of [
    'ECONOMY_SELL_CIRCUIT_OPEN',
    'BANK_EXPANSION_CIRCUIT_OPEN',
    'MERCHANT_SPACE_RECOVERY_CIRCUIT_OPEN',
    'TRAVEL_CIRCUIT_OPEN',
    'PARTY_LIFECYCLE_CIRCUIT_OPEN',
    'MERCHANT_SERVICE_CIRCUIT_OPEN',
    'MOVEMENT_CIRCUIT_OPEN',
    'PERSISTENCE_SAVE_CIRCUIT_OPEN'
  ]) assert.ok(result.blockers.includes(blocker), blocker);
  assert.equal(result.actionAuthority, false);
  assert.equal(result.rawGameplayActionAuthority, false);
});

test('runtime action audit rejects weak attestations and explicit unexpected raw actions', () => {
  const gate = { name: '24h', durationMs: 1, pollMs: 1, maxGapMs: 1000, prerequisite: '1h', requireRecoveryDrill: false, requireAlertCanary: false, requireRuntimeAudit: true };
  const base = [
    { seq: 1, kind: 'MARKER', at: 999, payload: { type: 'prerequisite:1h', ok: true } },
    { seq: 2, kind: 'START', at: 1000, payload: { gate: '24h' } },
    { seq: 3, kind: 'SAMPLE', at: 1001, payload: { assessment: goodAssessment() } }
  ];
  let rows = base.concat([{ seq: 4, kind: 'MARKER', at: 1001, payload: { type: 'runtime_action_audit_clean', ok: true, data: { sha256: 'a'.repeat(64) } } }]);
  let result = evaluateCertification(rows, gate, 1001);
  assert.equal(result.passed, false);
  assert.ok(result.reasons.includes('RUNTIME_ACTION_AUDIT_INVALID'));

  rows = base.concat([{ seq: 4, kind: 'MARKER', at: 1001, payload: { type: 'runtime_action_audit_clean', ok: true, data: { sha256: 'b'.repeat(64), reviewed: true, result: 'CLEAN', unexpectedRawGameplayActions: 1 } } }]);
  result = evaluateCertification(rows, gate, 1001);
  assert.equal(result.passed, false);
  assert.equal(result.status, 'FAIL');
  assert.ok(result.reasons.includes('UNEXPECTED_RAW_GAMEPLAY_ACTIONS_OBSERVED'));
});

test('missing local character evidence blocks certification even if the group flag is inconsistent', () => {
  const payload = healthyPayload();
  payload.controller.watchdog.lastBeaconSummary.character = null;
  const result = assessHostCertificationStatus(payload, 1000);
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes('LOCAL_CHARACTER_EVIDENCE_MISSING'));
});

test('5000 simulated healthy evidence ticks stay bounded and cannot bypass real duration', () => {
  const rows = [{ seq: 1, kind: 'START', at: 1000, payload: { gate: '7d', certificationId: 'soak-test' } }];
  for (let i = 0; i < 5000; i += 1) {
    rows.push({ seq: i + 2, kind: 'SAMPLE', at: 1000 + i * 30000, payload: { assessment: goodAssessment('run-soak', { hostStartIdentity: 'host-1' }) } });
  }
  const gate = { name: '7d', durationMs: 7 * 24 * 60 * 60 * 1000, pollMs: 30000, maxGapMs: 90000, prerequisite: null, requireRecoveryDrill: false, requireAlertCanary: false, requireRuntimeAudit: false };
  const result = evaluateCertification(rows, gate, rows[rows.length - 1].at);
  assert.equal(result.passed, false);
  assert.equal(result.status, 'PENDING');
  assert.ok(result.reasons.includes('DURATION_NOT_SATISFIED'));
  assert.equal(result.sampleCount, 5000);
  assert.equal(result.dataComplete, true);
  assert.equal(JSON.stringify(result).length < 10000, true);
  assert.equal(result.gameplayActionAuthority, false);
  assert.equal(result.rawGameplayActionAuthority, false);
  assert.equal(result.restartAuthority, false);
  assert.equal(result.operatorAckAuthority, false);
});

test('evidence can be reopened after process restart with the same verified hash chain', () => {
  const file = tempFile('reload.jsonl');
  const clock = { value: 5000 };
  let store = new HashChainedCertificationEvidence({ filePath: file, now: () => clock.value });
  store.append('START', { gate: '1h', certificationId: 'reload-test' }, 1000);
  store.append('SAMPLE', { assessment: goodAssessment() }, 2000);
  const before = store.status();
  store = new HashChainedCertificationEvidence({ filePath: file, now: () => clock.value });
  const after = store.status();
  assert.equal(after.valid, true);
  assert.equal(after.rows, before.rows);
  assert.equal(after.terminalHash, before.terminalHash);
});
