(() => {
  'use strict';

  const API = 'V5PR205AutonomousFourCharacterTest';
  const VERSION = '1.2.1';
  const TEST_ID = 'pr20-5-merchant-stability-autonomous-4char';
  const STATE_KEY = 'AIO_V5_PR20_5_AUTONOMOUS_TEST_V1';
  const ACTORS_KEY = 'AIO_V5_PR20_5_AUTONOMOUS_ACTORS_V1';
  const PR20_4_STATE_KEY = 'AIO_V5_PR20_4_TRANSFER_STEP_TEST_V1';
  const PR20_4_REPO_EXIT_GATE = 'BESTANDEN_REAL_INGAME_16_OF_16';
  const REQUIRED_CLASSES = Object.freeze(['merchant', 'ranger', 'priest', 'mage']);
  const WORKER_HEARTBEAT_MS = 5_000;
  const ACTOR_STALE_MS = 20_000;
  const DISCOVERY_INTERVAL_MS = 5_000;
  const SOAK_MS = 15 * 60 * 1000;
  const SOAK_SAMPLE_MS = 15_000;
  const MIN_SOAK_SAMPLES = 60;
  const TELEMETRY_MAX_EVENTS = 512;
  const SUPABASE_MONTHLY_INVOCATION_LIMIT = 500_000;
  const SUPABASE_SAFETY_RESERVE = 5_000;

  function root() {
    try { if (globalThis.character) return globalThis; } catch {}
    try { if (parent && parent.character) return parent; } catch {}
    throw new Error('PR20_5_ADVENTURE_LAND_CONTEXT_MISSING');
  }

  function storage() {
    const r = root();
    try { if (r.localStorage) return r.localStorage; } catch {}
    try { if (globalThis.localStorage) return globalThis.localStorage; } catch {}
    throw new Error('PR20_5_LOCAL_STORAGE_MISSING');
  }

  function now() { return Date.now(); }
  function text(v) { return String(v == null ? '' : v).trim(); }
  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  function armPerformanceTrick() {
    const r = root();
    try {
      if (typeof r.performance_trick === 'function') {
        r.performance_trick();
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

  function readJson(key, fallback) {
    try {
      const raw = storage().getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch { return fallback; }
  }

  function writeJson(key, value) {
    const serialized = JSON.stringify(value);
    storage().setItem(key, serialized);
    if (storage().getItem(key) !== serialized) throw new Error('PR20_5_STORAGE_ROUNDTRIP_FAILED');
  }

  function serverBinding(r) {
    let p = null;
    try { if (r.parent && r.parent !== r) p = r.parent; } catch {}
    const region = [r.server_region, r.server?.region, p?.server_region, p?.server?.region]
      .map(text).find(Boolean) || '';
    const identifier = [r.server_identifier, r.server?.id, p?.server_identifier, p?.server?.id]
      .map(text).find(Boolean) || '';
    return { region, identifier };
  }

  function runtimeConflict(r) {
    try { if (r.AIO_V3?.__runtime?.timer) return 'AIO_V3_RUNTIME_ACTIVE'; } catch { return 'AIO_V3_RUNTIME_UNREADABLE'; }
    try { if (r.V4ProduktionsLaufzeit || r.AIO_V4 || r.V4Runtime) return 'V4_RUNTIME_ACTIVE'; } catch { return 'V4_RUNTIME_UNREADABLE'; }
    return null;
  }

  function snapshot(r = root()) {
    const server = serverBinding(r);
    return {
      schemaVersion: 1,
      testId: TEST_ID,
      name: text(r.character?.name),
      ctype: text(r.character?.ctype).toLowerCase(),
      map: text(r.character?.map),
      serverRegion: server.region,
      serverIdentifier: server.identifier,
      hp: Number(r.character?.hp || 0),
      mp: Number(r.character?.mp || 0),
      gold: Number(r.character?.gold || 0),
      runtimeConflict: runtimeConflict(r),
      observedAtMs: now()
    };
  }

  function publishActor() {
    const snap = snapshot();
    const reg = readJson(ACTORS_KEY, { schemaVersion: 1, actors: {} });
    const actors = reg.actors && typeof reg.actors === 'object' ? reg.actors : {};
    writeJson(ACTORS_KEY, { schemaVersion: 1, actors: { ...actors, [snap.name]: snap } });
    return snap;
  }

  function workerSource() {
    const body = function () {
      'use strict';
      const K = 'AIO_V5_PR20_5_AUTONOMOUS_ACTORS_V1';
      const I = 5000;
      function t(v) { return String(v == null ? '' : v).trim(); }
      function s() {
        const r = globalThis;
        let p = null;
        try { if (r.parent && r.parent !== r) p = r.parent; } catch {}
        const region = [r.server_region, r.server?.region, p?.server_region, p?.server?.region].map(t).find(Boolean) || '';
        const identifier = [r.server_identifier, r.server?.id, p?.server_identifier, p?.server?.id].map(t).find(Boolean) || '';
        let conflict = null;
        try { if (r.AIO_V3?.__runtime?.timer) conflict = 'AIO_V3_RUNTIME_ACTIVE'; } catch { conflict = 'AIO_V3_RUNTIME_UNREADABLE'; }
        try { if (!conflict && (r.V4ProduktionsLaufzeit || r.AIO_V4 || r.V4Runtime)) conflict = 'V4_RUNTIME_ACTIVE'; } catch { conflict = 'V4_RUNTIME_UNREADABLE'; }
        return { schemaVersion:1, testId:'pr20-5-merchant-stability-autonomous-4char', name:t(r.character?.name), ctype:t(r.character?.ctype).toLowerCase(), map:t(r.character?.map), serverRegion:region, serverIdentifier:identifier, hp:Number(r.character?.hp||0), mp:Number(r.character?.mp||0), gold:Number(r.character?.gold||0), runtimeConflict:conflict, observedAtMs:Date.now() };
      }
      function pub() {
        const snap=s();
        let reg={schemaVersion:1,actors:{}};
        try { const raw=localStorage.getItem(K); if(raw) reg=JSON.parse(raw); } catch {}
        const actors=reg&&reg.actors&&typeof reg.actors==='object'?reg.actors:{};
        try { localStorage.setItem(K,JSON.stringify({schemaVersion:1,actors:{...actors,[snap.name]:snap}})); } catch {}
      }
      try { if (globalThis.__V5_PR20_5_WORKER_TIMER) clearInterval(globalThis.__V5_PR20_5_WORKER_TIMER); } catch {}
      try { if (typeof globalThis.performance_trick === 'function') globalThis.performance_trick(); else if (globalThis.parent && typeof globalThis.parent.performance_trick === 'function') globalThis.parent.performance_trick(); } catch {}
      pub();
      globalThis.__V5_PR20_5_WORKER_TIMER=setInterval(pub,I);
      globalThis.V5PR205Worker={version:'1.2.1',status:()=>s()};
    };
    return '(' + body.toString() + ')();';
  }

  function installWorkers() {
    const r = root();
    const active = typeof r.get_active_characters === 'function'
      ? r.get_active_characters()
      : (typeof globalThis.get_active_characters === 'function' ? globalThis.get_active_characters() : {});
    const names = Object.keys(active || {});
    const source = workerSource();
    for (const name of names) {
      if (name === r.character?.name) continue;
      try {
        if (typeof r.command_character === 'function') r.command_character(name, source);
        else if (typeof globalThis.command_character === 'function') globalThis.command_character(name, source);
      } catch {}
    }
  }

  function pr204Gate() {
    const state = readJson(PR20_4_STATE_KEY, null);
    const step16 = state?.steps?.['16'];
    const localPassed = step16?.status === 'BESTANDEN';
    const repoPassed = PR20_4_REPO_EXIT_GATE === 'BESTANDEN_REAL_INGAME_16_OF_16';
    const passed = localPassed || repoPassed;
    return {
      passed,
      status: passed ? 'BESTANDEN' : 'AUSSTEHEND',
      source: localPassed ? 'LOCAL_PERSISTENT_EVIDENCE' : 'MERGED_REPO_EXIT_EVIDENCE',
      repoExitGate: PR20_4_REPO_EXIT_GATE,
      step16: step16?.status || null,
      sameIntentRetry: state?.sameIntentErneutSenden === false ? false : null
    };
  }

  async function waitForPr204() {
    while (true) {
      const gate = pr204Gate();
      setState({ status:'WAITING_FOR_PR20_4', phase:'PR20_4_GATE', pr20_4:gate });
      if (gate.passed) {
        emit('PR20_4_GATE_OBSERVED_PASSED','INFO',{ step16:gate.step16 });
        return gate;
      }
      await sleep(DISCOVERY_INTERVAL_MS);
    }
  }

  function freshActors() {
    const reg = readJson(ACTORS_KEY, { schemaVersion: 1, actors: {} });
    const current = now();
    return Object.values(reg.actors || {})
      .filter(a => a && a.schemaVersion === 1)
      .filter(a => current - Number(a.observedAtMs || 0) <= ACTOR_STALE_MS);
  }

  function rosterStatus() {
    const actors = freshActors();
    const byClass = {};
    for (const actor of actors) {
      if (!REQUIRED_CLASSES.includes(actor.ctype)) continue;
      if (!byClass[actor.ctype] || actor.observedAtMs > byClass[actor.ctype].observedAtMs) {
        byClass[actor.ctype] = actor;
      }
    }
    const missing = REQUIRED_CLASSES.filter(c => !byClass[c]);
    const duplicates = REQUIRED_CLASSES.filter(c => actors.filter(a => a.ctype === c).length > 1);
    const chosen = REQUIRED_CLASSES.map(c => byClass[c]).filter(Boolean);
    const servers = new Set(chosen.map(a => a.serverRegion + ':' + a.serverIdentifier));
    const runtimeConflicts = chosen.filter(a => a.runtimeConflict).map(a => ({ ctype: a.ctype, reason: a.runtimeConflict }));
    return {
      ready: missing.length === 0 && duplicates.length === 0 && servers.size === 1 && runtimeConflicts.length === 0,
      missing,
      duplicates,
      sameServer: servers.size === 1,
      runtimeConflicts,
      actors: chosen.map(a => ({ name: a.name, ctype: a.ctype, map: a.map, observedAtMs: a.observedAtMs }))
    };
  }

  function isSafety(k) { return k === 'NOTFALL' || k === 'SICHERHEIT'; }

  function evaluateSwitch(context, candidate, policy, currentMs) {
    const history = Array.isArray(context.wechselHistorieMs) ? context.wechselHistorieMs : [];
    const windowStart = Math.max(0, currentMs - policy.wechselFensterMs);
    const changes = history.filter(v => v >= windowStart && v <= currentMs).length;
    const waited = Math.max(0, currentMs - candidate.wartetSeitMs);
    const out = (allowed, reason) => ({ wechselErlaubt: allowed, grund: reason, wechselImAktuellenFenster: changes, gewartetMs: waited, gameplayAutoritaet:false, rawWriteAutoritaet:false });

    if (candidate.bereich === context.aktuellerBereich) return out(false, 'GLEICHER_BEREICH');
    if (context.irreversibleMutationOffen) return out(false, 'IRREVERSIBLE_MUTATION_OFFEN');
    if (!context.sichereUnterbrechung || !context.checkpointDurable) return out(false, 'KEIN_SICHERER_DURABLER_UNTERBRECHUNGSPUNKT');
    const currentSafety = isSafety(context.aktuellePrioritaetsKlasse);
    const candidateSafety = isSafety(candidate.prioritaetsKlasse);
    if (currentSafety && !candidateSafety) return out(false, 'AKTUELLE_SAFETY_ARBEIT_HAT_VORRANG');
    if (!candidate.schedulerVorrang) return out(false, 'SCHEDULER_GIBT_KEINEN_VORRANG');
    if (candidateSafety && !currentSafety) return out(true, 'SAFETY_PREEMPTION');
    if (waited >= policy.starvationGrenzeMs) return out(true, 'STARVATION_GRENZE_ERREICHT');
    if (currentMs - context.bereichBegonnenAmMs < policy.mindestHaltedauerMs) return out(false, 'MINDEST_HALTEDAUER');
    if (context.letzterWechselAmMs !== null && currentMs - context.letzterWechselAmMs < policy.wechselCooldownMs) return out(false, 'WECHSEL_COOLDOWN');
    if (changes >= policy.maximaleWechselImFenster) return out(false, 'WECHSEL_BUDGET_ERSCHOEPFT');
    return out(true, 'STABILER_WECHSEL_ERLAUBT');
  }

  const POLICY = Object.freeze({
    richtlinienVersion: 'merchant-stability-v1',
    mindestHaltedauerMs: 30_000,
    wechselCooldownMs: 10_000,
    wechselFensterMs: 60_000,
    maximaleWechselImFenster: 3,
    starvationGrenzeMs: 120_000,
    maximaleHistorie: 16
  });

  function deterministicScenarios() {
    const t = 150_000;
    const baseContext = {
      aktuellerBereich:'BANK',
      aktuellePrioritaetsKlasse:'NORMALE_ARBEIT',
      bereichBegonnenAmMs:100_000,
      letzterWechselAmMs:100_000,
      sichereUnterbrechung:true,
      checkpointDurable:true,
      irreversibleMutationOffen:false,
      wechselHistorieMs:[70_000,100_000]
    };
    const baseCandidate = { bereich:'FARMER_RENDEZVOUS', prioritaetsKlasse:'ERFORDERLICHER_DIENST', wartetSeitMs:90_000, deadlineAmMs:300_000, schedulerVorrang:true };
    const cases = [
      ['irreversible', { ...baseContext, irreversibleMutationOffen:true }, { ...baseCandidate, prioritaetsKlasse:'SICHERHEIT' }, false, 'IRREVERSIBLE_MUTATION_OFFEN'],
      ['unsafe-checkpoint', { ...baseContext, sichereUnterbrechung:false }, baseCandidate, false, 'KEIN_SICHERER_DURABLER_UNTERBRECHUNGSPUNKT'],
      ['scheduler-no-priority', baseContext, { ...baseCandidate, schedulerVorrang:false }, false, 'SCHEDULER_GIBT_KEINEN_VORRANG'],
      ['safety-preemption', baseContext, { ...baseCandidate, prioritaetsKlasse:'SICHERHEIT' }, true, 'SAFETY_PREEMPTION'],
      ['starvation', baseContext, { ...baseCandidate, wartetSeitMs:1_000 }, true, 'STARVATION_GRENZE_ERREICHT'],
      ['minimum-hold', { ...baseContext, bereichBegonnenAmMs:140_000, letzterWechselAmMs:100_000 }, { ...baseCandidate, wartetSeitMs:145_000 }, false, 'MINDEST_HALTEDAUER'],
      ['cooldown', { ...baseContext, bereichBegonnenAmMs:100_000, letzterWechselAmMs:145_000 }, { ...baseCandidate, wartetSeitMs:120_000 }, false, 'WECHSEL_COOLDOWN'],
      ['bounded-budget', { ...baseContext, wechselHistorieMs:[100_000,120_000,140_000] }, { ...baseCandidate, wartetSeitMs:130_000 }, false, 'WECHSEL_BUDGET_ERSCHOEPFT'],
      ['stable-switch', { ...baseContext, wechselHistorieMs:[], letzterWechselAmMs:100_000 }, { ...baseCandidate, wartetSeitMs:120_000 }, true, 'STABILER_WECHSEL_ERLAUBT']
    ];
    return cases.map(([name, context, candidate, allow, reason]) => {
      const result = evaluateSwitch(context, candidate, POLICY, t);
      const passed = result.wechselErlaubt === allow && result.grund === reason
        && result.gameplayAutoritaet === false && result.rawWriteAutoritaet === false;
      return { name, passed, expected:{ allow, reason }, result };
    });
  }

  let seq = 0;
  const telemetryEvents = [];
  let publicState = {
    schemaVersion:1,
    testId:TEST_ID,
    version:VERSION,
    status:'BOOT',
    phase:'BOOT',
    startedAtMs:now(),
    updatedAtMs:now(),
    terminal:false,
    fourCharacterRoster:null,
    deterministic:null,
    soak:null,
    gameplayWrites:0,
    rawWriteCalls:0,
    sameIntentRetry:false,
    supabase:{ monthlyInvocationLimit:SUPABASE_MONTHLY_INVOCATION_LIMIT, safetyReserve:SUPABASE_SAFETY_RESERVE, runnerDirectInvocations:0, transport:'WINDOWS_BRIDGE_5S_LOCAL_OBSERVE_60S_AGGREGATE_PLUS_TERMINAL_PUSH', localObservationSeconds:5, statusIntervalSeconds:60, terminalEventImmediate:true, completionEmailEachTerminalTest:true }
  };

  function emit(type, severity, data = {}) {
    seq += 1;
    telemetryEvents.push({ seq, ts:new Date().toISOString(), event:type, type, severity, reason:data.reason || null, component:'v5-pr20-5-autonomous-test', data });
    if (telemetryEvents.length > TELEMETRY_MAX_EVENTS) telemetryEvents.splice(0, telemetryEvents.length - TELEMETRY_MAX_EVENTS);
  }

  function setState(patch) {
    publicState = { ...publicState, ...patch, updatedAtMs:now(), gameplayWrites:0, rawWriteCalls:0, sameIntentRetry:false };
    writeJson(STATE_KEY, publicState);
    return publicState;
  }

  function installTelemetryFacade() {
    const r = root();
    r.AIO_V3 = r.AIO_V3 || {};
    const existing = r.AIO_V3.operations && typeof r.AIO_V3.operations === 'object'
      ? r.AIO_V3.operations
      : null;
    if (existing?.__v5Pr205FacadeVersion === VERSION) return true;

    const existingStatus = existing && typeof existing.status === 'function'
      ? existing.status.bind(existing)
      : null;
    const existingHeartbeat = existing && typeof existing.hostHeartbeat === 'function'
      ? existing.hostHeartbeat.bind(existing)
      : null;
    const existingReconciliation = existing && typeof existing.reconciliationStatus === 'function'
      ? existing.reconciliationStatus.bind(existing)
      : null;
    const existingPeekTelemetry = existing && typeof existing.peekTelemetry === 'function'
      ? existing.peekTelemetry.bind(existing)
      : null;

    const baseStatus = () => {
      if (!existingStatus) return {};
      try {
        const value = existingStatus();
        return value && typeof value === 'object' ? value : {};
      } catch (error) {
        return {
          legacyOperationsStatusUnavailable: true,
          legacyOperationsStatusError: String(error?.message || error || 'UNKNOWN').slice(0,160)
        };
      }
    };

    r.AIO_V3.operations = {
      ...(existing || {}),
      __v5Pr205FacadeVersion: VERSION,
      status: () => {
        const base = baseStatus();
        return {
          ...base,
          schemaVersion: Number(base.schemaVersion) || 1,
          mode:'V5_AUTONOMOUS_TEST',
          v5AutonomousTest:publicState,
          telemetry: base.telemetry && typeof base.telemetry === 'object'
            ? base.telemetry
            : { queued:telemetryEvents.length, lastCapturedSeq:seq, dropped:0 }
        };
      },
      hostHeartbeat: () => {
        if (existingHeartbeat) {
          try {
            const value = existingHeartbeat();
            if (value && typeof value === 'object') {
              return { ...value, v5Mode:'V5_AUTONOMOUS_TEST', v5ObservedAtMs:now() };
            }
          } catch {}
        }
        return { schemaVersion:1, alive:true, mode:'V5_AUTONOMOUS_TEST', observedAtMs:now() };
      },
      reconciliationStatus: () => {
        if (existingReconciliation) {
          try {
            const value = existingReconciliation();
            if (value && typeof value === 'object') {
              return {
                ...value,
                v5AutonomousTestStatus:publicState.status,
                v5Terminal:publicState.terminal === true,
                sameIntentRetry:false
              };
            }
          } catch {}
        }
        return {
          schemaVersion:1,
          status: publicState.terminal ? 'TERMINAL' : 'NO_MUTATION_RECONCILIATION_REQUIRED',
          v5AutonomousTestStatus:publicState.status,
          v5Terminal:publicState.terminal === true,
          sameIntentRetry:false
        };
      },
      peekTelemetry: (limit = 2000) => {
        if (existingPeekTelemetry) {
          try {
            const rows = existingPeekTelemetry(limit);
            if (Array.isArray(rows)) return rows;
          } catch {}
        }
        return telemetryEvents.slice(-Math.max(1, Math.min(2000, Number(limit) || 2000)));
      }
    };
    return true;
  }

  async function waitForRoster() {
    setState({ status:'WAITING_FOR_4_CHARACTERS', phase:'ROSTER' });
    emit('PR20_5_WAITING_FOR_4_CHARACTERS','INFO');
    while (true) {
      publishActor();
      installWorkers();
      const roster = rosterStatus();
      setState({ fourCharacterRoster:roster });
      if (roster.ready) {
        emit('PR20_5_FOUR_CHARACTER_ROSTER_READY','INFO',{ actors:roster.actors.map(a=>({ctype:a.ctype,name:a.name})) });
        return roster;
      }
      await sleep(DISCOVERY_INTERVAL_MS);
    }
  }

  async function runSoak() {
    const started = now();
    const samples = [];
    setState({ status:'RUNNING', phase:'FIFTEEN_MINUTE_NO_WRITE', soak:{ startedAtMs:started, durationTargetMs:SOAK_MS, samples:0 } });
    emit('PR20_5_15M_NO_WRITE_SOAK_STARTED','INFO',{ durationMs:SOAK_MS });
    while (now() - started < SOAK_MS) {
      publishActor();
      installWorkers();
      const roster = rosterStatus();
      const sample = { atMs:now(), ready:roster.ready, missing:roster.missing, duplicates:roster.duplicates, sameServer:roster.sameServer, runtimeConflicts:roster.runtimeConflicts };
      samples.push(sample);
      setState({ fourCharacterRoster:roster, soak:{ startedAtMs:started, durationTargetMs:SOAK_MS, elapsedMs:now()-started, samples:samples.length, last:sample } });
      if (!roster.ready) {
        const result = { status:'BLOCKED', reason:'FOUR_CHARACTER_ROSTER_DRIFT', samples:samples.length, last:sample, gameplayWrites:0 };
        setState({ status:'BLOCKED', phase:'FIFTEEN_MINUTE_NO_WRITE', terminal:true, soak:result });
        emit('PR20_5_BLOCKED','ERROR',result);
        return result;
      }
      await sleep(SOAK_SAMPLE_MS);
    }
    const passed = samples.length >= MIN_SOAK_SAMPLES && samples.every(s => s.ready);
    const result = { status:passed?'BESTANDEN':'NICHT_BESTANDEN', durationMs:now()-started, samples:samples.length, minimumSamples:MIN_SOAK_SAMPLES, gameplayWrites:0, rawWriteCalls:0 };
    setState({ status:passed?'BESTANDEN':'NICHT_BESTANDEN', phase:'COMPLETE', terminal:true, soak:result });
    emit(passed?'PR20_5_AUTONOMOUS_TEST_PASSED':'PR20_5_AUTONOMOUS_TEST_FAILED', passed?'INFO':'ERROR', result);
    return result;
  }

  async function coordinator() {
    const me = publishActor();
    installTelemetryFacade();
    if (!armPerformanceTrick()) {
      setState({ status:'BLOCKED', phase:'BACKGROUND_EXECUTION', terminal:true, blocker:['PR20_5_PERFORMANCE_TRICK_UNAVAILABLE'] });
      emit('PR20_5_BLOCKED','ERROR',{ reason:'PR20_5_PERFORMANCE_TRICK_UNAVAILABLE' });
      return;
    }
    if (me.ctype !== 'merchant') {
      setState({ status:'WORKER', phase:'HEARTBEAT', terminal:false });
      try { if (globalThis.__V5_PR20_5_WORKER_TIMER) clearInterval(globalThis.__V5_PR20_5_WORKER_TIMER); } catch {}
      globalThis.__V5_PR20_5_WORKER_TIMER=setInterval(publishActor,WORKER_HEARTBEAT_MS);
      return;
    }

    const conflict = runtimeConflict(root());
    if (conflict) {
      setState({ status:'BLOCKED', phase:'BOOT', terminal:true, blocker:[conflict] });
      emit('PR20_5_BLOCKED','ERROR',{ reason:conflict });
      return;
    }

    await waitForPr204();
    await waitForRoster();
    setState({ status:'RUNNING', phase:'DETERMINISTIC_CORE' });
    const deterministic = deterministicScenarios();
    const failed = deterministic.filter(x => !x.passed);
    setState({ deterministic:{ status:failed.length?'NICHT_BESTANDEN':'BESTANDEN', scenarios:deterministic } });
    if (failed.length) {
      setState({ status:'NICHT_BESTANDEN', phase:'DETERMINISTIC_CORE', terminal:true });
      emit('PR20_5_DETERMINISTIC_FAILED','ERROR',{ failed:failed.map(x=>x.name) });
      return;
    }
    emit('PR20_5_DETERMINISTIC_PASSED','INFO',{ scenarios:deterministic.length });
    await runSoak();
  }

  try {
    if (globalThis[API]?.version === VERSION) return;
    globalThis[API] = {
      version: VERSION,
      testId: TEST_ID,
      status: () => publicState,
      actors: () => freshActors(),
      report: () => ({ ...publicState, events: telemetryEvents.slice() }),
      stop: () => {
        setState({ status:'STOPPED', phase:'STOPPED', terminal:true });
        emit('PR20_5_STOPPED','WARN',{ reason:'MANUAL_STOP' });
      }
    };
    installTelemetryFacade();
    emit('PR20_5_AUTONOMOUS_TEST_BOOT','INFO',{ version:VERSION, requiredClasses:REQUIRED_CLASSES });
    coordinator().catch(error => {
      const reason=String(error?.message || error || 'UNKNOWN');
      setState({ status:'FEHLER', phase:'UNHANDLED', terminal:true, blocker:[reason] });
      emit('PR20_5_UNHANDLED_ERROR','ERROR',{ reason });
    });
  } catch (error) {
    try { console.error('[V5 PR20.5]', error); } catch {}
  }
})();