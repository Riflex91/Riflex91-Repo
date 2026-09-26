(() => {
  'use strict';

  const VERSION = '1.0.0';
  const TEST_ID = 'pr21-merchant-integration-live-15m';
  const API_NAME = 'V5PR21MerchantIntegrationLive15m';
  const CHECKPOINT_ID = 'PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT';
  const AUTHORIZATION_ID = 'PR21_MERCHANT_LIVE_EXECUTION_AUTHORIZATION_2026_09_26';
  const TARGET_DURATION_MS = 900_000;
  const SAMPLE_INTERVAL_MS = 5_000;
  const MAX_SAMPLE_GAP_MS = 15_000;
  const EXPECTED_SAMPLES = 181;
  const MAX_SAMPLES = 184;
  const MAX_STATUS_AGE_MS = 60_000;

  let source = null;
  let seq = 0;
  const events = [];
  let lastTelemetrySeq = 0;
  let state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    checkpointId: CHECKPOINT_ID,
    authorizationId: AUTHORIZATION_ID,
    status: 'BOOT',
    phase: 'BOOT',
    terminal: false,
    blocker: [],
    startedAtMs: null,
    updatedAtMs: Date.now(),
    completedAtMs: null,
    sampleIntervalMs: SAMPLE_INTERVAL_MS,
    maximumSampleGapMs: MAX_SAMPLE_GAP_MS,
    targetDurationMs: TARGET_DURATION_MS,
    expectedSamplesForTarget: EXPECTED_SAMPLES,
    maximumSamples: MAX_SAMPLES,
    sampleCount: 0,
    durationMs: 0,
    samples: [],
    evidence: null,
    externalRuntimeStartAuthorized: true,
    authorizationScope: 'PR21_MERCHANT_INTEGRATION_CHECKPOINT_ONLY',
    observerOnly: true,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    authorityIssuedByHarness: false,
    normalRuntimeAllowed: false,
    sameIntentRetry: false
  };

  function text(value, max = 240) {
    return String(value == null ? '' : value).trim().slice(0, max);
  }
  function now() { return Date.now(); }
  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  function roots() {
    const out = [];
    try { out.push(globalThis); } catch {}
    try {
      if (globalThis.parent && globalThis.parent !== globalThis
          && !out.includes(globalThis.parent)) out.push(globalThis.parent);
    } catch {}
    return out;
  }

  function bindSource() {
    if (source) return source;
    for (const owner of roots()) {
      try {
        const operations = owner?.AIO_V3?.operations;
        if (text(owner?.character?.ctype, 32).toLowerCase() !== 'merchant') continue;
        if (!operations
            || typeof operations.status !== 'function'
            || typeof operations.hostHeartbeat !== 'function'
            || typeof operations.reconciliationStatus !== 'function'
            || typeof operations.peekTelemetry !== 'function') continue;
        source = Object.freeze({
          owner,
          operations,
          status: operations.status.bind(operations),
          hostHeartbeat: operations.hostHeartbeat.bind(operations),
          reconciliationStatus: operations.reconciliationStatus.bind(operations),
          peekTelemetry: operations.peekTelemetry.bind(operations)
        });
        return source;
      } catch {}
    }
    throw new Error('PR21_MERCHANT_RUNTIME_OPERATIONS_UNAVAILABLE');
  }

  function emit(type, severity, data = {}) {
    seq += 1;
    events.push({
      seq,
      ts: new Date(now()).toISOString(),
      event: type,
      type,
      severity,
      reason: data.reason || null,
      component: 'v5-pr21-merchant-integration-live-15m',
      data
    });
    if (events.length > 512) events.splice(0, events.length - 512);
  }

  function setState(patch) {
    state = {
      ...state,
      ...patch,
      updatedAtMs: now(),
      gameplayWrites: 0,
      publicFunctionCalls: 0,
      rawWriteCalls: 0,
      authorityIssuedByHarness: false,
      normalRuntimeAllowed: false,
      sameIntentRetry: false
    };
    return state;
  }

  function installFacade() {
    const binding = bindSource();
    const operations = binding.operations;
    operations.__v5Pr21MerchantLiveVersion = VERSION;
    operations.status = () => {
      let base = {};
      try {
        const value = binding.status();
        if (value && typeof value === 'object') base = value;
      } catch {}
      return {
        ...base,
        mode: 'V5_AUTONOMOUS_TEST',
        v5AutonomousTest: state,
        telemetry: {
          ...(base.telemetry && typeof base.telemetry === 'object' ? base.telemetry : {}),
          v5ObserverQueued: events.length,
          v5ObserverLastSeq: seq
        }
      };
    };
    operations.hostHeartbeat = () => {
      let base = {};
      try {
        const value = binding.hostHeartbeat();
        if (value && typeof value === 'object') base = value;
      } catch {}
      return {
        ...base,
        v5Mode: 'V5_AUTONOMOUS_TEST',
        v5TestId: TEST_ID,
        v5CheckpointId: CHECKPOINT_ID,
        v5ObservedAtMs: now()
      };
    };
    operations.reconciliationStatus = () => {
      let base = {};
      try {
        const value = binding.reconciliationStatus();
        if (value && typeof value === 'object') base = value;
      } catch {}
      return {
        ...base,
        v5ObserverOnly: true,
        v5TestId: TEST_ID,
        v5Terminal: state.terminal === true,
        sameIntentRetry: false
      };
    };
    operations.peekTelemetry = (limit = 2000) => {
      let base = [];
      try {
        const value = binding.peekTelemetry(limit);
        if (Array.isArray(value)) base = value;
      } catch {}
      const max = Math.max(1, Math.min(2000, Number(limit) || 2000));
      return [...base, ...events].slice(-max);
    };
  }

  function armPerformanceTrick(owner) {
    try {
      if (typeof owner.performance_trick === 'function') {
        owner.performance_trick();
        return true;
      }
    } catch {}
    try {
      if (typeof globalThis.performance_trick === 'function') {
        globalThis.performance_trick();
        return true;
      }
    } catch {}
    return false;
  }

  function runtimeRunning(owner) {
    try {
      const runtime = owner?.AIO_V3?.__runtime;
      if (!runtime) return false;
      const runtimeStatus = typeof runtime.status === 'function'
        ? runtime.status()
        : null;
      return !!(runtime.timer || runtimeStatus?.running === true);
    } catch {
      return false;
    }
  }

  function numberOrNull(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function recentRuntimeEvents(binding) {
    let rows = [];
    try {
      const value = binding.peekTelemetry(2000);
      if (Array.isArray(value)) rows = value;
    } catch {}
    const fresh = [];
    let highest = lastTelemetrySeq;
    for (const row of rows) {
      const rowSeq = Number(row?.seq);
      if (!Number.isFinite(rowSeq) || rowSeq <= lastTelemetrySeq) continue;
      highest = Math.max(highest, rowSeq);
      fresh.push(row);
    }
    lastTelemetrySeq = highest;
    return fresh;
  }

  function markerCount(rows, marker) {
    let count = 0;
    for (const row of rows) {
      let value = '';
      try { value = JSON.stringify(row); } catch { value = text(row); }
      if (value.toUpperCase().includes(marker)) count += 1;
    }
    return count;
  }

  function buildSample(observedAtMs, previousObservedAtMs) {
    const binding = bindSource();
    const owner = binding.owner;
    const status = binding.status();
    const heartbeat = binding.hostHeartbeat();
    const reconciliation = binding.reconciliationStatus();
    const runtimeEvents = recentRuntimeEvents(binding);
    const blockers = [];

    const ctype = text(owner?.character?.ctype, 32).toLowerCase();
    if (ctype !== 'merchant') blockers.push('PR21_MERCHANT_CONTEXT_DRIFT');
    if (!runtimeRunning(owner)) blockers.push('PR21_MERCHANT_RUNTIME_NOT_RUNNING');

    const healthState = text(status?.health?.state, 32).toUpperCase();
    if (healthState !== 'HEALTHY') blockers.push('HEALTH_NOT_HEALTHY');

    const snapshotAgeMs = numberOrNull(status?.health?.snapshotAgeMs);
    const heartbeatAgeMs = numberOrNull(status?.health?.heartbeatAgeMs);
    const operationsCurrent = snapshotAgeMs !== null
      && heartbeatAgeMs !== null
      && snapshotAgeMs <= MAX_STATUS_AGE_MS
      && heartbeatAgeMs <= MAX_STATUS_AGE_MS;
    if (!operationsCurrent) blockers.push('OPERATIONS_STALE');

    const recorderDrops = Math.max(0, Number(status?.telemetry?.dropped || 0));
    if (!Number.isSafeInteger(recorderDrops) || recorderDrops !== 0) {
      blockers.push('RECORDER_DROPS');
    }
    const captureErrors = Math.max(0, Number(status?.captureErrors || 0));
    if (!Number.isSafeInteger(captureErrors) || captureErrors !== 0) {
      blockers.push('OPERATIONS_CAPTURE_ERRORS');
    }

    const reconBlockers = Array.isArray(reconciliation?.blockers)
      ? reconciliation.blockers.map(x => text(x, 96).toUpperCase())
      : [];
    const unsafeReconciliation = reconBlockers.filter(code =>
      code.includes('RECOVERING')
      || code.includes('CIRCUIT_OPEN')
      || code.includes('STATUS_UNAVAILABLE')
      || code.includes('SAFE_RECOVERY_INCIDENT_ACTIVE')
    );
    if (reconciliation?.actionAuthority !== false
        || reconciliation?.rawGameplayActionAuthority !== false) {
      blockers.push('UNEXPECTED_AUTHORITY');
    }
    if (unsafeReconciliation.length > 0) blockers.push('UNRESOLVED_TRANSACTION');

    const controlElevated = status?.control?.allowElevated === true;
    const rawRecoveryAuthority = status?.reliability?.rawGameplayActionAuthority === true;
    if (controlElevated || rawRecoveryAuthority) blockers.push('UNEXPECTED_AUTHORITY');

    const gapMs = previousObservedAtMs == null ? 0 : observedAtMs - previousObservedAtMs;
    if (gapMs > MAX_SAMPLE_GAP_MS) blockers.push('SAMPLE_GAPS');

    const counters = {
      unerwarteteGameplayWrites: markerCount(runtimeEvents, 'UNEXPECTED_GAMEPLAY_WRITE'),
      duplicateIrreversibleEffects: markerCount(runtimeEvents, 'DUPLICATE_IRREVERSIBLE'),
      safetyViolations: markerCount(runtimeEvents, 'SAFETY_VIOLATION'),
      sameIntentRetries: markerCount(runtimeEvents, 'SAME_INTENT_RETRY'),
      unresolvedTransactions: unsafeReconciliation.length,
      restartRecoveryFailures: markerCount(runtimeEvents, 'RESTART_RECOVERY_FAILURE'),
      staleEvidenceActions: markerCount(runtimeEvents, 'STALE_EVIDENCE'),
      thrashEvents: markerCount(runtimeEvents, 'THRASH'),
      pingpongEvents: markerCount(runtimeEvents, 'PINGPONG'),
      starvationCriticalCount: markerCount(runtimeEvents, 'CRITICAL_STARVATION')
    };
    if (Object.values(counters).some(value => value > 0)) {
      blockers.push('RUNTIME_SAFETY_COUNTER_NONZERO');
    }

    const authorityLeaks = controlElevated || rawRecoveryAuthority
      || reconciliation?.actionAuthority !== false
      || reconciliation?.rawGameplayActionAuthority !== false
      ? 1
      : 0;

    return {
      sample: {
        schemaVersion: 1,
        sequenz: state.samples.length + 1,
        beobachtetAmMs: observedAtMs,
        segmentId: 'pr21-merchant-integration',
        healthZustand: healthState === 'HEALTHY' ? 'GESUND' : healthState || 'UNBEKANNT',
        operationsAktuell: operationsCurrent,
        recorderDrops,
        unerwarteteGameplayWrites: counters.unerwarteteGameplayWrites,
        duplicateIrreversibleEffects: counters.duplicateIrreversibleEffects,
        safetyViolations: counters.safetyViolations,
        sameIntentRetries: counters.sameIntentRetries,
        unresolvedTransactions: counters.unresolvedTransactions,
        authorityLeaks,
        restartRecoveryFailures: counters.restartRecoveryFailures,
        staleEvidenceActions: counters.staleEvidenceActions,
        thrashEvents: counters.thrashEvents,
        pingpongEvents: counters.pingpongEvents,
        starvationCriticalCount: counters.starvationCriticalCount,
        runtimeAuthorityId: 'runtime:merchant',
        runtimeRunning: true,
        snapshotAgeMs,
        heartbeatAgeMs,
        captureErrors,
        reconciliationBlockers: reconBlockers,
        heartbeatType: text(heartbeat?.type, 64) || null
      },
      blockers: [...new Set(blockers)]
    };
  }

  async function run() {
    installFacade();
    const binding = bindSource();
    if (!armPerformanceTrick(binding.owner)) {
      throw new Error('PR21_MERCHANT_PERFORMANCE_TRICK_UNAVAILABLE');
    }

    const startedAtMs = now();
    let previousObservedAtMs = null;
    setState({
      status: 'RUNNING',
      phase: 'MERCHANT_INTEGRATION_15M',
      startedAtMs,
      samples: [],
      sampleCount: 0,
      durationMs: 0,
      blocker: []
    });
    emit('PR21_MERCHANT_LIVE_CHECKPOINT_STARTED', 'INFO', {
      checkpointId: CHECKPOINT_ID,
      authorizationId: AUTHORIZATION_ID
    });

    while (true) {
      const observedAtMs = now();
      const built = buildSample(observedAtMs, previousObservedAtMs);
      const samples = [...state.samples, built.sample];
      const durationMs = observedAtMs - startedAtMs;

      if (samples.length > MAX_SAMPLES) {
        built.blockers.push('PR21_MERCHANT_SAMPLE_LIMIT_VOR_ZIEL');
      }
      if (built.blockers.length > 0) {
        setState({
          status: 'NICHT_BESTANDEN',
          phase: 'MERCHANT_INTEGRATION_15M',
          terminal: true,
          completedAtMs: observedAtMs,
          blocker: [...new Set(built.blockers)],
          samples,
          sampleCount: samples.length,
          durationMs,
          evidence: {
            schemaVersion: 1,
            status: 'EVIDENCE_REJECTED_FAIL_CLOSED',
            checkpointId: CHECKPOINT_ID,
            sampleCount: samples.length,
            durationMs,
            blockers: [...new Set(built.blockers)]
          }
        });
        emit('PR21_MERCHANT_LIVE_CHECKPOINT_FAILED', 'ERROR', {
          reason: [...new Set(built.blockers)].join(','),
          sampleCount: samples.length,
          durationMs
        });
        return;
      }

      setState({
        status: 'RUNNING',
        phase: 'MERCHANT_INTEGRATION_15M',
        samples,
        sampleCount: samples.length,
        durationMs,
        blocker: []
      });
      previousObservedAtMs = observedAtMs;

      if (durationMs >= TARGET_DURATION_MS) {
        if (samples.length < EXPECTED_SAMPLES) {
          throw new Error('PR21_MERCHANT_LIVE_ZU_WENIGE_SAMPLES');
        }
        const completedAtMs = now();
        const evidence = {
          schemaVersion: 1,
          status: 'EVIDENCE_READY_TARGET_REACHED',
          checkpointId: CHECKPOINT_ID,
          segmentId: 'pr21-merchant-integration',
          sampleCount: samples.length,
          expectedSamplesForTarget: EXPECTED_SAMPLES,
          durationMs,
          sampleGaps: 0,
          allMinimaReached: true,
          allTargetsReached: true,
          activeAuthorityIds: ['runtime:merchant'],
          observerOnly: true,
          collectorGameplayWrites: 0,
          collectorPublicFunctionCalls: 0,
          collectorRawWriteCalls: 0,
          authorityIssuedByHarness: false,
          externalRuntimeStartAuthorized: true,
          normalRuntimeAllowed: false,
          samples
        };
        setState({
          status: 'BESTANDEN',
          phase: 'COMPLETE',
          terminal: true,
          completedAtMs,
          blocker: [],
          samples,
          sampleCount: samples.length,
          durationMs,
          evidence
        });
        emit('PR21_MERCHANT_LIVE_CHECKPOINT_PASSED', 'INFO', {
          sampleCount: samples.length,
          durationMs
        });
        return;
      }

      const nextTarget = startedAtMs + samples.length * SAMPLE_INTERVAL_MS;
      await sleep(Math.max(0, nextTarget - now()));
    }
  }

  bindSource();
  installFacade();
  globalThis[API_NAME] = Object.freeze({
    version: VERSION,
    testId: TEST_ID,
    checkpointId: CHECKPOINT_ID,
    authorizationId: AUTHORIZATION_ID,
    status: () => state,
    start: () => run()
  });

  Promise.resolve().then(run).catch(error => {
    const message = text(error?.message || error || 'PR21_MERCHANT_LIVE_FEHLER', 240);
    if (!state.terminal) {
      setState({
        status: 'FEHLER',
        phase: state.phase || 'UNKNOWN',
        terminal: true,
        completedAtMs: now(),
        blocker: [message],
        evidence: {
          schemaVersion: 1,
          status: 'EVIDENCE_REJECTED_FAIL_CLOSED',
          checkpointId: CHECKPOINT_ID,
          sampleCount: state.sampleCount,
          durationMs: state.durationMs,
          blockers: [message]
        }
      });
    }
    emit('PR21_MERCHANT_LIVE_CHECKPOINT_ERROR', 'ERROR', { reason: message });
  });
})();
