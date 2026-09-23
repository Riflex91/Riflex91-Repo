(() => {
  'use strict';

  const TEST_ID = 'pr20-7-gear-occupied-slot-readonly-preflight';
  const VERSION = '1.0.0';
  const REGISTRY_KEY = 'AIO_V5_PR20_7_GEAR_READONLY_OBSERVATIONS_V1';
  const REQUIRED = Object.freeze([
    ['My_Ranger1','ranger'],
    ['My_Priest','priest'],
    ['My_Mage','mage']
  ]);
  const STALE_MS = 15_000;
  const DISCOVERY_MS = 2_000;
  const DISCOVERY_MAX_MS = 120_000;
  const STABILITY_MS = 60_000;
  const SAMPLE_MS = 5_000;
  const MIN_SAMPLES = 12;

  const text = value => String(value == null ? '' : value).trim();
  const root = () => {
    try {
      return globalThis.parent && globalThis.parent.character
        ? globalThis.parent
        : globalThis;
    } catch {
      return globalThis;
    }
  };
  const store = () => {
    try { return globalThis.localStorage || root().localStorage || null; } catch { return null; }
  };
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  let state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    status: 'STARTING',
    phase: 'BOOT',
    terminal: false,
    startedAtMs: Date.now(),
    updatedAtMs: Date.now(),
    gameplayWrites: 0,
    rawWriteCalls: 0,
    sameIntentRetry: false,
    intents: [],
    normalRuntimeAllowed: false,
    performanceTrick: null,
    roster: null,
    preflight: null,
    soak: null,
    blocker: []
  };

  let seq = 0;
  const events = [];

  function setState(patch) {
    state = {
      ...state,
      ...patch,
      gameplayWrites: 0,
      rawWriteCalls: 0,
      sameIntentRetry: false,
      intents: [],
      normalRuntimeAllowed: false,
      updatedAtMs: Date.now()
    };
    return state;
  }

  function emit(event, severity, data = {}) {
    seq += 1;
    events.push({
      seq,
      ts: new Date().toISOString(),
      event,
      type: event,
      severity,
      reason: data.reason || null,
      component: 'v5-pr20-7-gear-readonly',
      data
    });
    if (events.length > 256) events.splice(0, events.length - 256);
  }

  function installTelemetryFacade() {
    const r = root();
    r.AIO_V3 = r.AIO_V3 || {};
    const existing = r.AIO_V3.operations && typeof r.AIO_V3.operations === 'object'
      ? r.AIO_V3.operations
      : {};
    const oldStatus = typeof existing.status === 'function' ? existing.status.bind(existing) : null;
    const oldHeartbeat = typeof existing.hostHeartbeat === 'function'
      ? existing.hostHeartbeat.bind(existing)
      : null;
    const oldRecon = typeof existing.reconciliationStatus === 'function'
      ? existing.reconciliationStatus.bind(existing)
      : null;
    const oldPeek = typeof existing.peekTelemetry === 'function'
      ? existing.peekTelemetry.bind(existing)
      : null;

    r.AIO_V3.operations = {
      ...existing,
      __v5Pr207GearReadonlyFacadeVersion: VERSION,
      status: () => {
        let base = {};
        try {
          const value = oldStatus ? oldStatus() : null;
          if (value && typeof value === 'object') base = value;
        } catch {}
        return {
          ...base,
          schemaVersion: Number(base.schemaVersion) || 1,
          mode: 'V5_AUTONOMOUS_TEST',
          v5AutonomousTest: state,
          telemetry: base.telemetry && typeof base.telemetry === 'object'
            ? base.telemetry
            : { queued: events.length, lastCapturedSeq: seq, dropped: 0 }
        };
      },
      hostHeartbeat: () => {
        try {
          const value = oldHeartbeat ? oldHeartbeat() : null;
          if (value && typeof value === 'object') {
            return { ...value, v5Mode: 'V5_AUTONOMOUS_TEST', v5ObservedAtMs: Date.now() };
          }
        } catch {}
        return {
          schemaVersion: 1,
          alive: true,
          mode: 'V5_AUTONOMOUS_TEST',
          observedAtMs: Date.now(),
          v5ObservedAtMs: Date.now()
        };
      },
      reconciliationStatus: () => {
        try {
          const value = oldRecon ? oldRecon() : null;
          if (value && typeof value === 'object') {
            return {
              ...value,
              v5AutonomousTestStatus: state.status,
              v5Terminal: state.terminal === true,
              sameIntentRetry: false
            };
          }
        } catch {}
        return {
          schemaVersion: 1,
          status: state.terminal ? 'TERMINAL' : 'NO_MUTATION_RECONCILIATION_REQUIRED',
          v5AutonomousTestStatus: state.status,
          v5Terminal: state.terminal === true,
          sameIntentRetry: false
        };
      },
      peekTelemetry: (limit = 2000) => {
        try {
          const value = oldPeek ? oldPeek(limit) : null;
          if (Array.isArray(value) && value.length) return value;
        } catch {}
        return events.slice(-Math.max(1, Math.min(2000, Number(limit) || 2000)));
      }
    };
  }

  async function sha256(value) {
    const r = root();
    const cryptoApi = globalThis.crypto || r.crypto;
    if (!cryptoApi?.subtle?.digest || typeof TextEncoder !== 'function') {
      throw new Error('PR20_7_WEB_CRYPTO_UNAVAILABLE');
    }
    const bytes = new TextEncoder().encode(String(value));
    const digest = await cryptoApi.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte =>
      byte.toString(16).padStart(2, '0')).join('');
  }

  async function ensurePerformanceTrick() {
    const r = root();
    let called = false;
    for (const candidate of [globalThis, r]) {
      try {
        if (typeof candidate?.performance_trick !== 'function') continue;
        candidate.performance_trick();
        called = true;
        break;
      } catch {}
    }
    if (!called) return { active: false, reason: 'PERFORMANCE_TRICK_UNAVAILABLE' };
    await sleep(350);
    for (const candidate of [globalThis, r]) {
      try {
        const empty = candidate?.sounds?.empty;
        if (empty && typeof empty.playing === 'function' && empty.playing() === true) {
          return { active: true, reason: null };
        }
      } catch {}
    }
    return { active: false, reason: 'PERFORMANCE_TRICK_NOT_PLAYING' };
  }

  function serverBinding(r) {
    const region = [
      r.server_region, r.server?.region,
      globalThis.server_region, globalThis.server?.region
    ].map(text).find(Boolean) || '';
    const identifier = [
      r.server_identifier, r.server?.id,
      globalThis.server_identifier, globalThis.server?.id
    ].map(text).find(Boolean) || '';
    return { region, identifier };
  }

  async function merchantBinding() {
    const r = root();
    const c = r.character || globalThis.character;
    if (!c || text(c.ctype || c.type).toLowerCase() !== 'merchant') {
      throw new Error('PR20_7_MERCHANT_COORDINATOR_REQUIRED');
    }
    if (text(c.name) !== 'My_Merchant') {
      throw new Error('PR20_7_MERCHANT_IDENTITY_NOT_ALLOWED');
    }
    const raw = text(r.user_id || globalThis.user_id || c.owner);
    const server = serverBinding(r);
    const accountKey = raw ? await sha256('account:' + raw) : '';
    if (!accountKey || !server.region || !server.identifier || !text(c.id)) {
      throw new Error('PR20_7_MERCHANT_BINDING_INCOMPLETE');
    }
    return {
      name: text(c.name),
      ctype: 'merchant',
      sessionId: text(c.id),
      accountKey,
      serverRegion: server.region,
      serverIdentifier: server.identifier
    };
  }

  function freshRegistry() {
    const storage = store();
    if (!storage) return [];
    let registry = null;
    try {
      const raw = storage.getItem(REGISTRY_KEY);
      if (raw) registry = JSON.parse(raw);
    } catch {}
    const rows = Object.values(
      registry?.observations && typeof registry.observations === 'object'
        ? registry.observations
        : {}
    );
    const now = Date.now();
    return rows.filter(row =>
      row
      && row.schemaVersion === 1
      && row.testId === TEST_ID
      && now - Number(row.observedAtMs || 0) <= STALE_MS
    );
  }

  function rosterStatus(rows, merchant) {
    const selected = [];
    const missing = [];
    const duplicates = [];
    const blockers = [];

    for (const [name, ctype] of REQUIRED) {
      const matches = rows.filter(row =>
        text(row.name) === name && text(row.ctype).toLowerCase() === ctype);
      if (matches.length === 0) {
        missing.push(ctype);
        continue;
      }
      if (matches.length !== 1) {
        duplicates.push(ctype);
        continue;
      }
      const row = matches[0];
      selected.push(row);
      if (row.performanceTrick !== true) blockers.push('PERFORMANCE_TRICK_' + ctype.toUpperCase());
      if (row.runtimeConflict) blockers.push('RUNTIME_CONFLICT_' + ctype.toUpperCase());
      if (text(row.accountKey) !== merchant.accountKey) blockers.push('ACCOUNT_DRIFT_' + ctype.toUpperCase());
      if (text(row.serverRegion) !== merchant.serverRegion
          || text(row.serverIdentifier) !== merchant.serverIdentifier) {
        blockers.push('SERVER_DRIFT_' + ctype.toUpperCase());
      }
      if (!text(row.sessionId)) blockers.push('SESSION_MISSING_' + ctype.toUpperCase());
    }

    return {
      ready: missing.length === 0
        && duplicates.length === 0
        && blockers.length === 0
        && selected.length === REQUIRED.length,
      missing,
      duplicates,
      blockers,
      actors: selected.map(row => ({
        name: row.name,
        ctype: row.ctype,
        sessionId: row.sessionId,
        eligible: row.eligible === true,
        candidateCount: Number(row.candidateCount || 0),
        observedAtMs: row.observedAtMs
      }))
    };
  }

  function chooseCandidate(rows) {
    const order = new Map(REQUIRED.map(([name], index) => [name, index]));
    return rows
      .filter(row => row.eligible === true && row.candidate)
      .sort((a, b) =>
        (order.get(a.name) ?? 99) - (order.get(b.name) ?? 99)
        || String(a.candidate.evidenceFingerprint || '')
          .localeCompare(String(b.candidate.evidenceFingerprint || '')))[0] || null;
  }

  async function run() {
    try {
      const performanceTrick = await ensurePerformanceTrick();
      setState({ performanceTrick });
      if (!performanceTrick.active) {
        setState({
          status: 'BLOCKIERT',
          phase: 'BACKGROUND_EXECUTION',
          terminal: true,
          blocker: [performanceTrick.reason]
        });
        emit('PR20_7_PERFORMANCE_TRICK_BLOCKED', 'ERROR', { reason: performanceTrick.reason });
        return;
      }

      const merchant = await merchantBinding();
      const discoveryStart = Date.now();
      let chosen = null;
      let chosenActor = null;

      while (Date.now() - discoveryStart < DISCOVERY_MAX_MS) {
        const rows = freshRegistry();
        const roster = rosterStatus(rows, merchant);
        setState({
          status: 'WAITING_FOR_READONLY_RECIPIENTS',
          phase: 'READONLY_ROSTER',
          roster
        });

        if (roster.ready) {
          chosenActor = chooseCandidate(rows);
          if (!chosenActor) {
            setState({
              status: 'BLOCKIERT',
              phase: 'READONLY_PREFLIGHT',
              terminal: true,
              blocker: ['PR20_7_NO_SAFE_OCCUPIED_SWAP_CANDIDATE'],
              preflight: {
                status: 'BLOCKIERT',
                candidate: null,
                gameplayWrites: 0,
                rawWriteCalls: 0
              }
            });
            emit('PR20_7_NO_CANDIDATE', 'WARN', {
              reason: 'PR20_7_NO_SAFE_OCCUPIED_SWAP_CANDIDATE'
            });
            return;
          }
          chosen = JSON.parse(JSON.stringify(chosenActor.candidate));
          break;
        }
        await sleep(DISCOVERY_MS);
      }

      if (!chosen || !chosenActor) {
        const rows = freshRegistry();
        const roster = rosterStatus(rows, merchant);
        setState({
          status: 'BLOCKIERT',
          phase: 'READONLY_ROSTER',
          terminal: true,
          roster,
          blocker: ['PR20_7_READONLY_ROSTER_TIMEOUT', ...roster.blockers]
        });
        emit('PR20_7_ROSTER_TIMEOUT', 'ERROR', { reason: 'PR20_7_READONLY_ROSTER_TIMEOUT' });
        return;
      }

      const selectedName = text(chosenActor.name);
      const selectedClass = text(chosenActor.ctype).toLowerCase();
      const selectedSession = text(chosenActor.sessionId);
      const selectedEvidence = text(chosen.evidenceFingerprint);
      setState({
        status: 'RUNNING',
        phase: 'READONLY_PREFLIGHT',
        preflight: {
          status: 'BESTANDEN',
          recipientClass: selectedClass,
          recipientName: selectedName,
          recipientSessionId: selectedSession,
          slot: chosen.slot,
          candidateIndex: chosen.candidateIndex,
          candidateFingerprint: chosen.candidate?.fingerprint || null,
          previousSlotFingerprint: chosen.previousSlotItem?.fingerprint || null,
          evidenceFingerprint: selectedEvidence,
          gameplayWrites: 0,
          rawWriteCalls: 0,
          sameIntentRetry: false
        }
      });

      const stabilityStart = Date.now();
      let samples = 0;
      while (Date.now() - stabilityStart < STABILITY_MS) {
        const rows = freshRegistry();
        const roster = rosterStatus(rows, merchant);
        const current = rows.find(row =>
          text(row.name) === selectedName
          && text(row.ctype).toLowerCase() === selectedClass
          && text(row.sessionId) === selectedSession
        );
        const failures = [];
        if (!roster.ready) failures.push('ROSTER_DRIFT');
        if (!current) failures.push('RECIPIENT_HEARTBEAT_STALE');
        if (current && current.eligible !== true) failures.push('CANDIDATE_NOT_ELIGIBLE');
        if (current && text(current.candidate?.evidenceFingerprint) !== selectedEvidence) {
          failures.push('CANDIDATE_EVIDENCE_DRIFT');
        }
        if (failures.length) {
          setState({
            status: 'BLOCKIERT',
            phase: 'READONLY_STABILITY',
            terminal: true,
            roster,
            soak: {
              status: 'BLOCKIERT',
              durationMs: Date.now() - stabilityStart,
              samples,
              minimumSamples: MIN_SAMPLES,
              failures
            },
            blocker: failures
          });
          emit('PR20_7_READONLY_STABILITY_FAILED', 'ERROR', {
            reason: failures.join(','),
            failures
          });
          return;
        }

        samples += 1;
        setState({
          status: 'RUNNING',
          phase: 'READONLY_STABILITY',
          roster,
          soak: {
            status: 'LAEUFT',
            durationMs: Date.now() - stabilityStart,
            samples,
            minimumSamples: MIN_SAMPLES
          }
        });
        await sleep(SAMPLE_MS);
      }

      if (samples < MIN_SAMPLES) {
        throw new Error('PR20_7_READONLY_TOO_FEW_SAMPLES');
      }

      setState({
        status: 'BESTANDEN',
        phase: 'COMPLETE',
        terminal: true,
        soak: {
          status: 'BESTANDEN',
          durationMs: Date.now() - stabilityStart,
          samples,
          minimumSamples: MIN_SAMPLES
        },
        blocker: []
      });
      emit('PR20_7_GEAR_READONLY_PREFLIGHT_PASSED', 'INFO', {
        recipientClass: selectedClass,
        slot: chosen.slot,
        samples
      });
    } catch (error) {
      setState({
        status: 'BLOCKIERT',
        phase: state.phase || 'ERROR',
        terminal: true,
        blocker: [text(error?.message || error || 'PR20_7_READONLY_FAILED').slice(0, 180)]
      });
      emit('PR20_7_GEAR_READONLY_FAILED', 'ERROR', {
        reason: text(error?.message || error || 'PR20_7_READONLY_FAILED').slice(0, 180)
      });
    }
  }

  installTelemetryFacade();

  Object.defineProperty(globalThis, 'V5PR207GearReadonlyTest', {
    configurable: true,
    enumerable: true,
    writable: false,
    value: Object.freeze({
      version: VERSION,
      testId: TEST_ID,
      status: () => ({ ...state })
    })
  });

  Promise.resolve().then(run);
})();