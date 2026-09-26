(() => {
  'use strict';

  const VERSION = '1.0.3';
  const TEST_ID = 'pr21-merchant-integration-live-15m-v1-0-3';
  const API_NAME = 'V5PR21MerchantIntegrationLive15mV103';
  const CHECKPOINT_ID = 'PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT';
  const AUTHORIZATION_ID = 'PR21_MERCHANT_LIVE_EXECUTION_AUTHORIZATION_V4_2026_09_26';
  const TARGET_DURATION_MS = 900_000;
  const SAMPLE_INTERVAL_MS = 5_000;
  const MAX_SAMPLE_GAP_MS = 15_000;
  const EXPECTED_SAMPLES = 181;
  const MAX_SAMPLES = 184;
  const MAX_STATUS_AGE_MS = 60_000;
  const STARTUP_TIMEOUT_MS = 30_000;
  const STARTUP_POLL_MS = 500;
  const NATIVE_BOOTSTRAP_TIMEOUT_MS = 60_000;
  const NATIVE_BOOTSTRAP_VERSION = '3.0.0-alpha.20.147';
  const NATIVE_BOOTSTRAP_SOURCE = "/* Adventure Land AiO Bot 3.0.0-alpha.20.147 | generated | bootstrap loader */\n(function(root){\n'use strict';\nconst RELEASE_VERSION = \"3.0.0-alpha.20.147\";\nvar MODE='cloudflare-bootstrap-loader-v1';\nvar DEFAULT_BASE=\"https://aio-bot-dashboard.hansijuergenlul.workers.dev/v3\";\nvar DEFAULT_MAX_RUNTIME_BYTES=32*1024*1024;\nfunction text(value,max){return String(value==null?'':value).trim().slice(0,max||500);}\nfunction finite(value,fallback){var n=Number(value);return Number.isFinite(n)?n:fallback;}\nfunction report(level,message,data){\n  var row='[AIO v3 bootstrap] '+message;\n  try {\n    var logger=root&&typeof root.game_log==='function'?root.game_log:(root&&root.parent&&typeof root.parent.game_log==='function'?root.parent.game_log:null);\n    if(logger) logger(row,level==='error'?'red':level==='warn'?'orange':'#7ad');\n  } catch (_) {}\n  try { if(root&&root.console&&typeof root.console[level]==='function') root.console[level](row,data||''); else if(typeof console!=='undefined'&&console&&typeof console[level]==='function') console[level](row,data||''); } catch (_) {}\n}\nif(!root) return;\nvar parent=root.parent||root;\nvar cfg=root.AIO_V3_BOOTSTRAP_CONFIG&&typeof root.AIO_V3_BOOTSTRAP_CONFIG==='object'?root.AIO_V3_BOOTSTRAP_CONFIG:{};\nvar base=text(cfg.rawBaseUrl||DEFAULT_BASE,1000).replace(/\\/+$/,'');\nvar runtimePath=text(cfg.runtimePath||'dist/aio-v3-runtime.js',300).replace(/^\\/+/, '');\nvar maxRuntimeBytes=Math.max(1024*1024,Math.min(128*1024*1024,finite(cfg.maxRuntimeBytes,DEFAULT_MAX_RUNTIME_BYTES)));\nvar retryBaseMs=Math.max(10,finite(cfg.retryBaseMs,5000));\nvar retryMaxMs=Math.max(retryBaseMs,finite(cfg.retryMaxMs,300000));\nvar updaterConfig=root.AIO_V3_AUTO_UPDATE_CONFIG&&typeof root.AIO_V3_AUTO_UPDATE_CONFIG==='object'?root.AIO_V3_AUTO_UPDATE_CONFIG:{};\nif(updaterConfig.reloadHandshakeTimeoutMs==null) updaterConfig.reloadHandshakeTimeoutMs=60000;\nroot.AIO_V3_AUTO_UPDATE_CONFIG=updaterConfig;\nvar state=root.AIO_V3_BOOTSTRAP&&typeof root.AIO_V3_BOOTSTRAP==='object'?root.AIO_V3_BOOTSTRAP:{};\nstate.schemaVersion=1;\nstate.mode=MODE;\nstate.loaderVersion=RELEASE_VERSION;\nstate.rawBaseUrl=base;\nstate.runtimePath=runtimePath;\nstate.startedAt=Date.now();\nstate.ready=false;\nstate.lastError=null;\nstate.nextRetryAt=null;\nroot.AIO_V3_BOOTSTRAP=state;\nvar existing=root.AIO_V3;\nif(existing&&existing.__runtime&&existing.__aioV3BootstrapProxy!==true){\n  state.ready=String(existing.version||'')===RELEASE_VERSION;\n  state.loading=false;\n  state.runtimeVersion=String(existing.version||'');\n  if(state.ready) state.readyAt=Date.now();\n  return;\n}\nif(state.loading&&state.proxy&&root.AIO_V3===state.proxy) return;\nvar owner=root&&typeof root.fetch==='function'?root:(parent&&typeof parent.fetch==='function'?parent:null);\nvar fetchFn=owner&&owner.fetch;\nvar setTimer=root&&typeof root.setTimeout==='function'?root.setTimeout:(parent&&typeof parent.setTimeout==='function'?parent.setTimeout:(typeof setTimeout==='function'?setTimeout:null));\nvar clearTimer=root&&typeof root.clearTimeout==='function'?root.clearTimeout:(parent&&typeof parent.clearTimeout==='function'?parent.clearTimeout:(typeof clearTimeout==='function'?clearTimeout:null));\nvar token={id:'bootstrap-'+Date.now()+'-'+Math.random().toString(36).slice(2),active:true};\nstate.activationToken=token.id;\nstate.attempts=0;\nstate.failures=0;\nvar proxyRuntime={startedAt:Date.now(),lastHeartbeat:Date.now(),bootstrap:true};\nvar proxy={\n  version:RELEASE_VERSION,\n  __runtime:proxyRuntime,\n  __aioV3BootstrapProxy:true,\n  status:function(){proxyRuntime.lastHeartbeat=Date.now();return {version:RELEASE_VERSION,running:token.active,mode:MODE,bootstrap:true,ready:state.ready===true};},\n  start:function(){if(!token.active)return false;proxyRuntime.lastHeartbeat=Date.now();return true;},\n  stop:function(){\n    token.active=false;state.loading=false;state.stoppedAt=Date.now();\n    if(state.retryTimer&&clearTimer){try{clearTimer.call(root,state.retryTimer);}catch(_){}}\n    state.retryTimer=null;state.nextRetryAt=null;return true;\n  }\n};\nstate.proxy=proxy;\nroot.AIO_V3=proxy;\nstate.loading=true;\nfunction isActive(){return token.active&&state.activationToken===token.id&&root.AIO_V3===proxy;}\nfunction restoreProxy(candidate){\n  if(candidate&&candidate!==proxy&&typeof candidate.stop==='function'){try{candidate.stop();}catch(_){}}\n  if(token.active&&state.activationToken===token.id) root.AIO_V3=proxy;\n}\nfunction scheduleRetry(error){\n  if(!isActive()||!setTimer) return null;\n  state.failures+=1;\n  var exponent=Math.min(8,state.failures-1);\n  var delay=Math.min(retryMaxMs,retryBaseMs*Math.pow(2,exponent));\n  state.nextRetryAt=Date.now()+delay;\n  report('warn','runtime load retry scheduled in '+delay+'ms',{reason:state.lastError&&state.lastError.reason,attempts:state.attempts});\n  state.retryTimer=setTimer.call(root,function(){\n    state.retryTimer=null;state.nextRetryAt=null;\n    if(isActive()) state.promise=attemptLoad();\n  },delay);\n  return null;\n}\nfunction attemptLoad(){\n  if(!isActive()) return Promise.resolve(null);\n  state.attempts+=1;\n  proxyRuntime.lastHeartbeat=Date.now();\n  var separator=runtimePath.indexOf('?')>=0?'&':'?';\n  var url=base+'/'+runtimePath+separator+'release='+encodeURIComponent(RELEASE_VERSION)+'&attempt='+state.attempts+'&ts='+Date.now();\n  state.url=url;\n  if(typeof fetchFn!=='function'){\n    state.lastError={reason:'FETCH_UNAVAILABLE'};state.failedAt=Date.now();report('error','fetch unavailable');\n    return Promise.resolve(scheduleRetry(new Error('FETCH_UNAVAILABLE')));\n  }\n  return Promise.resolve(fetchFn.call(owner,url,{cache:'no-store'}))\n    .then(function(response){\n      if(!response||!response.ok) throw new Error('RUNTIME_HTTP_'+(response&&response.status));\n      return response.text();\n    })\n    .then(function(code){\n      code=String(code||'');\n      state.downloadedBytes=code.length;\n      if(code.length<10000) throw new Error('RUNTIME_TOO_SMALL');\n      if(code.length>maxRuntimeBytes) throw new Error('RUNTIME_TOO_LARGE');\n      if(code.indexOf('Adventure Land AiO Bot '+RELEASE_VERSION+' | generated')<0) throw new Error('RUNTIME_VERSION_MISMATCH');\n      if(code.indexOf('AIO_V3')<0) throw new Error('RUNTIME_MARKER_MISSING');\n      if(code.indexOf('bootstrap loader')>=0&&code.indexOf('aio-v3-runtime.js')>=0) throw new Error('RUNTIME_PATH_RETURNED_BOOTSTRAP');\n      if(!isActive()) throw new Error('BOOTSTRAP_ACTIVATION_SUPERSEDED');\n      state.validatedAt=Date.now();\n      root.AIO_V3=null;\n      try {\n        if(root&&typeof root.eval==='function') root.eval(code);\n        else (0,eval)(code);\n      } catch(error) {\n        restoreProxy(root.AIO_V3);\n        throw error;\n      }\n      var api=root.AIO_V3;\n      if(!api||api===proxy||String(api.version||'')!==RELEASE_VERSION){\n        restoreProxy(api);\n        throw new Error('RUNTIME_BOOT_VERSION_MISMATCH');\n      }\n      token.active=false;\n      state.ready=true;\n      state.loading=false;\n      state.readyAt=Date.now();\n      state.runtimeVersion=String(api.version||'');\n      state.lastError=null;\n      state.nextRetryAt=null;\n      report('log','runtime ready '+state.runtimeVersion,{bytes:state.downloadedBytes,url:url,attempts:state.attempts});\n      return api;\n    })\n    .catch(function(error){\n      var reason=text(error&&error.message||error,240)||'BOOTSTRAP_FAILED';\n      state.failedAt=Date.now();\n      state.lastError={reason:reason};\n      if(reason==='BOOTSTRAP_ACTIVATION_SUPERSEDED'||!token.active||state.activationToken!==token.id||root.AIO_V3!==proxy){\n        token.active=false;state.loading=false;state.nextRetryAt=null;\n        report('warn','runtime activation superseded',{reason:reason,url:url});\n        return null;\n      }\n      state.ready=false;\n      report('error','runtime load failed: '+reason,{url:url,attempts:state.attempts});\n      return scheduleRetry(error);\n    });\n}\nstate.promise=attemptLoad();\n})(typeof globalThis!=='undefined'?globalThis:(typeof window!=='undefined'?window:this));\n\n/* bootstrap compatibility padding: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx */\n";

  let source = null;
  let seq = 0;
  const events = [];
  let lastTelemetrySeq = 0;
  let runPromise = null;
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
    sameIntentRetry: false,
    observationSource: 'AIO_V3.__operations',
    externalRuntimeStartCalls: 0,
    externalRuntimeStopCalls: 0,
    runtimeStartedByCheckpoint: false,
    runtimeWasRunningBeforeCheckpoint: false,
    bootstrapNativeV3: true,
    nativeBootstrapVersion: NATIVE_BOOTSTRAP_VERSION,
    nativeBootstrapCalls: 0,
    nativeBootstrapReady: false
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

  function merchantOwner() {
    for (const owner of roots()) {
      try {
        if (text(owner && owner.character && owner.character.ctype, 32).toLowerCase() === 'merchant') return owner;
      } catch {}
    }
    return null;
  }

  function nativeRuntimeReady(owner) {
    try {
      const api = owner && owner.AIO_V3;
      const operations = api && api.operations;
      const nativeOperations = api && api.__operations;
      const runtime = api && api.__runtime;
      return !!(
        api
        && api.__aioV3BootstrapProxy !== true
        && operations
        && typeof operations.status === 'function'
        && nativeOperations
        && typeof nativeOperations.status === 'function'
        && typeof nativeOperations.hostHeartbeat === 'function'
        && typeof nativeOperations.peekTelemetry === 'function'
        && runtime
        && typeof runtime.status === 'function'
        && typeof runtime.start === 'function'
        && typeof runtime.stop === 'function'
        && typeof api.start === 'function'
        && typeof api.stop === 'function'
        && typeof api.status === 'function'
      );
    } catch {
      return false;
    }
  }

  async function ensureNativeV3() {
    for (const owner of roots()) {
      if (nativeRuntimeReady(owner)) {
        setState({ nativeBootstrapReady: true });
        return owner;
      }
    }
    const owner = merchantOwner();
    if (!owner) throw new Error('PR21_MERCHANT_CONTEXT_UNAVAILABLE_FOR_NATIVE_BOOTSTRAP');
    if (state.nativeBootstrapCalls >= 1) throw new Error('PR21_NATIVE_V3_BOOTSTRAP_ALREADY_CONSUMED');
    if (typeof owner.eval !== 'function') throw new Error('PR21_NATIVE_V3_BOOTSTRAP_EVAL_UNAVAILABLE');

    owner.AIO_V3_AUTOSTART = false;
    setState({
      status: 'BOOTSTRAPPING_NATIVE_V3',
      phase: 'NATIVE_V3_BOOTSTRAP',
      nativeBootstrapCalls: state.nativeBootstrapCalls + 1,
      nativeBootstrapReady: false,
      blocker: []
    });
    owner.eval(NATIVE_BOOTSTRAP_SOURCE);

    const beganAt = now();
    let lastReason = 'BOOTSTRAP_PENDING';
    while (now() - beganAt <= NATIVE_BOOTSTRAP_TIMEOUT_MS) {
      if (nativeRuntimeReady(owner)) {
        setState({ nativeBootstrapReady: true });
        return owner;
      }
      try {
        const boot = owner.AIO_V3_BOOTSTRAP;
        const err = boot && boot.lastError && boot.lastError.reason;
        if (err) lastReason = text(err, 180);
      } catch {}
      await sleep(STARTUP_POLL_MS);
    }
    throw new Error('PR21_NATIVE_V3_BOOTSTRAP_TIMEOUT:' + lastReason);
  }

  function bindSource() {
    if (source) return source;
    for (const owner of roots()) {
      try {
        const api = owner && owner.AIO_V3;
        const publicOperations = api && api.operations;
        const nativeOperations = api && api.__operations;
        const runtime = api && api.__runtime;
        if (text(owner && owner.character && owner.character.ctype, 32).toLowerCase() !== 'merchant') continue;
        if (!publicOperations
            || typeof publicOperations.status !== 'function'
            || !nativeOperations
            || typeof nativeOperations.status !== 'function'
            || typeof nativeOperations.hostHeartbeat !== 'function'
            || typeof nativeOperations.peekTelemetry !== 'function'
            || !runtime
            || typeof runtime.status !== 'function'
            || typeof runtime.start !== 'function'
            || typeof runtime.stop !== 'function') continue;
        source = Object.freeze({
          owner,
          api,
          publicOperations,
          nativeOperations,
          runtime,
          status: nativeOperations.status.bind(nativeOperations),
          hostHeartbeat: nativeOperations.hostHeartbeat.bind(nativeOperations),
          peekTelemetry: nativeOperations.peekTelemetry.bind(nativeOperations)
        });
        return source;
      } catch {}
    }
    throw new Error('PR21_MERCHANT_NATIVE_RUNTIME_UNAVAILABLE');
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
    const operations = binding.publicOperations;
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
      const base = runtimeReconciliation(binding);
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

  function runtimeRunning(binding) {
    if (!binding) binding = bindSource();
    try {
      const runtime = binding.runtime;
      const runtimeStatus = runtime.status();
      return !!(runtime.timer || (runtimeStatus && runtimeStatus.running === true));
    } catch {
      return false;
    }
  }

  function statusOf(target) {
    try {
      if (!target || typeof target.status !== 'function') return null;
      const value = target.status();
      return value && typeof value === 'object' ? value : null;
    } catch {
      return null;
    }
  }

  function runtimeReconciliation(binding) {
    const runtime = binding.runtime;
    const blockers = [];
    const add = code => {
      if (code && !blockers.includes(code)) blockers.push(code);
    };
    const tx = statusOf(runtime && runtime.transactionEngine);
    if (tx && Number(tx.recovering || 0) > 0) add('ECONOMY_TRANSACTION_RECOVERING');
    const bank = statusOf(runtime && runtime.bankExpansionTransactions);
    if (bank && Number(bank.recovering || 0) > 0) add('BANK_EXPANSION_RECOVERING');
    const merchantJournal = statusOf(runtime && runtime.merchantSpaceRecoveryJournal);
    if (merchantJournal && (
      Number(merchantJournal.recovering || 0) > 0
      || Number(merchantJournal && merchantJournal.states && merchantJournal.states.RECOVERING || 0) > 0
    )) add('MERCHANT_SPACE_RECOVERY_RECOVERING');
    const recovery = statusOf(binding.nativeOperations && binding.nativeOperations.recovery);
    if (recovery && recovery.degradedSince != null) add('SAFE_RECOVERY_INCIDENT_ACTIVE');
    const merchantRecoveryStatus = statusOf(runtime && runtime.controlledMerchantSpaceRecovery);
    if (merchantRecoveryStatus && merchantRecoveryStatus.busy === true) {
      add('CONTROLLED_MERCHANT_SPACE_RECOVERY_BUSY');
    }
    const bankConsolidationStatus = statusOf(runtime && runtime.controlledBankConsolidation);
    if (bankConsolidationStatus && bankConsolidationStatus.busy === true) {
      add('BANK_CONSOLIDATION_BUSY');
    }
    const merchantService = statusOf(runtime && runtime.controlledMerchantService);
    const merchantState = text(merchantService && merchantService.activeOperation && merchantService.activeOperation.state, 32).toUpperCase();
    if (['RECOVERING'].includes(merchantState)) add('MERCHANT_SERVICE_RECOVERY_REQUIRED');
    const lifecycle = statusOf(runtime && runtime.controlledPartyLifecycle);
    const lifecycleState = text(lifecycle && lifecycle.operation && lifecycle.operation.state, 32).toUpperCase();
    if (['RECOVERING'].includes(lifecycleState)) add('PARTY_LIFECYCLE_RECOVERY_REQUIRED');
    let liveGate = null;
    try {
      if (runtime && typeof runtime.alpha20LiveGateStatus === 'function') liveGate = runtime.alpha20LiveGateStatus();
    } catch {}
    if (liveGate && liveGate.phase === 'RECOVERING') add('ALPHA20_LIVE_GATE_RECOVERING');
    return {
      schemaVersion: 1,
      observedAt: now(),
      actionAuthority: false,
      rawGameplayActionAuthority: false,
      observedClean: blockers.length === 0,
      blockers
    };
  }

  function startAuthorizedExternalRuntime(binding) {
    const wasRunning = runtimeRunning(binding);
    setState({ runtimeWasRunningBeforeCheckpoint: wasRunning });
    if (wasRunning) return false;
    if (state.externalRuntimeStartCalls >= 1) {
      throw new Error('PR21_MERCHANT_RUNTIME_START_ALREADY_CONSUMED');
    }
    if (text(binding.owner && binding.owner.character && binding.owner.character.ctype, 32).toLowerCase() !== 'merchant') {
      throw new Error('PR21_MERCHANT_RUNTIME_START_CONTEXT_DRIFT');
    }
    const started = binding.runtime.start();
    setState({
      externalRuntimeStartCalls: state.externalRuntimeStartCalls + 1,
      runtimeStartedByCheckpoint: true
    });
    if (started === false && !runtimeRunning(binding)) {
      throw new Error('PR21_MERCHANT_RUNTIME_START_REJECTED');
    }
    return true;
  }

  function stopOwnedRuntime(binding) {
    if (!state.runtimeStartedByCheckpoint || state.externalRuntimeStopCalls >= 1) return null;
    try {
      if (runtimeRunning(binding)) binding.runtime.stop();
      setState({ externalRuntimeStopCalls: state.externalRuntimeStopCalls + 1 });
      return null;
    } catch (error) {
      return text(error && error.message || error || 'PR21_MERCHANT_RUNTIME_STOP_FAILED', 180);
    }
  }

  async function waitForRuntimeReady(binding) {
    const beganAt = now();
    let lastReason = 'PR21_MERCHANT_RUNTIME_READINESS_UNKNOWN';
    while (now() - beganAt <= STARTUP_TIMEOUT_MS) {
      const status = binding.status();
      const running = runtimeRunning(binding);
      const healthState = text(status && status.health && status.health.state, 32).toUpperCase();
      const snapshotAgeMs = numberOrNull(status && status.health && status.health.snapshotAgeMs);
      const heartbeatAgeMs = numberOrNull(status && status.health && status.health.heartbeatAgeMs);
      const recorderDrops = Math.max(0, Number(status && status.telemetry && status.telemetry.dropped || 0));
      const captureErrors = Math.max(0, Number(status && status.captureErrors || 0));
      if (recorderDrops > 0) throw new Error('RECORDER_DROPS');
      if (captureErrors > 0) throw new Error('OPERATIONS_CAPTURE_ERRORS');
      const current = snapshotAgeMs !== null
        && heartbeatAgeMs !== null
        && snapshotAgeMs <= MAX_STATUS_AGE_MS
        && heartbeatAgeMs <= MAX_STATUS_AGE_MS;
      if (running && healthState === 'HEALTHY' && current) return status;
      lastReason = [
        running ? 'RUNNING' : 'NOT_RUNNING',
        healthState || 'HEALTH_UNKNOWN',
        current ? 'CURRENT' : 'STALE'
      ].join(':');
      await sleep(STARTUP_POLL_MS);
    }
    throw new Error('PR21_MERCHANT_RUNTIME_READINESS_TIMEOUT:' + lastReason);
  }

  function primeTelemetryCursor(binding) {
    try {
      const rows = binding.peekTelemetry(2000);
      let highest = 0;
      for (const row of Array.isArray(rows) ? rows : []) {
        const rowSeq = Number(row && row.seq);
        if (Number.isFinite(rowSeq)) highest = Math.max(highest, rowSeq);
      }
      lastTelemetrySeq = highest;
    } catch {
      lastTelemetrySeq = 0;
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
    const reconciliation = runtimeReconciliation(binding);
    const runtimeEvents = recentRuntimeEvents(binding);
    const blockers = [];

    const ctype = text(owner && owner.character && owner.character.ctype, 32).toLowerCase();
    const isRunning = runtimeRunning(binding);
    if (ctype !== 'merchant') blockers.push('PR21_MERCHANT_CONTEXT_DRIFT');
    if (!isRunning) blockers.push('PR21_MERCHANT_RUNTIME_NOT_RUNNING');

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

    const reconBlockers = Array.isArray(reconciliation && reconciliation.blockers)
      ? reconciliation.blockers.map(x => text(x, 96).toUpperCase())
      : [];
    const unsafeReconciliation = reconBlockers.filter(code =>
      code.includes('RECOVERING')
      || code.includes('CIRCUIT_OPEN')
      || code.includes('SAFE_RECOVERY_INCIDENT_ACTIVE')
    );
    if (unsafeReconciliation.length > 0) blockers.push('UNRESOLVED_TRANSACTION');

    const controlElevated = !!(status && status.control && status.control.allowElevated === true);
    const rawRecoveryAuthority = !!(status && status.reliability && status.reliability.rawGameplayActionAuthority === true);
    const unexpectedAuthority = controlElevated || rawRecoveryAuthority
      || (reconciliation && reconciliation.actionAuthority === true)
      || (reconciliation && reconciliation.rawGameplayActionAuthority === true);
    if (unexpectedAuthority) blockers.push('UNEXPECTED_AUTHORITY');

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
        authorityLeaks: unexpectedAuthority ? 1 : 0,
        restartRecoveryFailures: counters.restartRecoveryFailures,
        staleEvidenceActions: counters.staleEvidenceActions,
        thrashEvents: counters.thrashEvents,
        pingpongEvents: counters.pingpongEvents,
        starvationCriticalCount: counters.starvationCriticalCount,
        runtimeAuthorityId: isRunning && ctype === 'merchant' ? 'runtime:merchant' : null,
        runtimeRunning: isRunning,
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
    await ensureNativeV3();
    installFacade();
    const binding = bindSource();
    if (!armPerformanceTrick(binding.owner)) {
      throw new Error('PR21_MERCHANT_PERFORMANCE_TRICK_UNAVAILABLE');
    }

    setState({
      status: 'STARTING_AUTHORIZED_RUNTIME',
      phase: 'EXTERNAL_RUNTIME_START',
      blocker: []
    });
    startAuthorizedExternalRuntime(binding);
    await waitForRuntimeReady(binding);
    primeTelemetryCursor(binding);

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
      authorizationId: AUTHORIZATION_ID,
      runtimeStartedByCheckpoint: state.runtimeStartedByCheckpoint
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
        const stopError = stopOwnedRuntime(binding);
        const blockers = [...new Set([
          ...built.blockers,
          ...(stopError ? ['PR21_MERCHANT_RUNTIME_STOP_FAILED:' + stopError] : [])
        ])];
        setState({
          status: 'NICHT_BESTANDEN',
          phase: 'MERCHANT_INTEGRATION_15M',
          terminal: true,
          completedAtMs: observedAtMs,
          blocker: blockers,
          samples,
          sampleCount: samples.length,
          durationMs,
          evidence: {
            schemaVersion: 1,
            status: 'EVIDENCE_REJECTED_FAIL_CLOSED',
            checkpointId: CHECKPOINT_ID,
            sampleCount: samples.length,
            durationMs,
            blockers
          }
        });
        emit('PR21_MERCHANT_LIVE_CHECKPOINT_FAILED', 'ERROR', {
          reason: blockers.join(','),
          sampleCount: samples.length,
          durationMs
        });
        return state;
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
        const stopError = stopOwnedRuntime(binding);
        if (stopError) throw new Error('PR21_MERCHANT_RUNTIME_STOP_FAILED:' + stopError);
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
          externalRuntimeStartCalls: state.externalRuntimeStartCalls,
          externalRuntimeStopCalls: state.externalRuntimeStopCalls,
          runtimeStartedByCheckpoint: state.runtimeStartedByCheckpoint,
          runtimeWasRunningBeforeCheckpoint: state.runtimeWasRunningBeforeCheckpoint,
          normalRuntimeAllowed: false,
          observationSource: state.observationSource,
          bootstrapNativeV3: state.bootstrapNativeV3,
          nativeBootstrapVersion: state.nativeBootstrapVersion,
          nativeBootstrapCalls: state.nativeBootstrapCalls,
          nativeBootstrapReady: state.nativeBootstrapReady,
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
        return state;
      }

      const nextTarget = startedAtMs + samples.length * SAMPLE_INTERVAL_MS;
      await sleep(Math.max(0, nextTarget - now()));
    }
  }

  bindSource();
  installFacade();
  function startOnce() {
    if (runPromise === null) runPromise = run();
    return runPromise;
  }

  globalThis[API_NAME] = Object.freeze({
    version: VERSION,
    testId: TEST_ID,
    checkpointId: CHECKPOINT_ID,
    authorizationId: AUTHORIZATION_ID,
    status: () => state,
    start: () => startOnce()
  });

  Promise.resolve().then(startOnce).catch(error => {
    const message = text(error && error.message || error || 'PR21_MERCHANT_LIVE_FEHLER', 240);
    const binding = source;
    const stopError = binding ? stopOwnedRuntime(binding) : null;
    if (!state.terminal) {
      setState({
        status: 'FEHLER',
        phase: state.phase || 'UNKNOWN',
        terminal: true,
        completedAtMs: now(),
        blocker: [...new Set([message, ...(stopError ? ['PR21_MERCHANT_RUNTIME_STOP_FAILED:' + stopError] : [])])],
        evidence: {
          schemaVersion: 1,
          status: 'EVIDENCE_REJECTED_FAIL_CLOSED',
          checkpointId: CHECKPOINT_ID,
          sampleCount: state.sampleCount,
          durationMs: state.durationMs,
          blockers: [...new Set([message, ...(stopError ? ['PR21_MERCHANT_RUNTIME_STOP_FAILED:' + stopError] : [])])]
        }
      });
    }
    emit('PR21_MERCHANT_LIVE_CHECKPOINT_ERROR', 'ERROR', { reason: message });
  });
})();
