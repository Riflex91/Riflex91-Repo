(() => {
  "use strict";

  const VERSION = "1.0.0";
  const TEST_ID = "pr20-8-exchange-anniversarygift-live-5m";
  const API_NAME = "V5PR208ExchangeAnniversarygiftLive5m";
  const SOURCE_TEST_ID = "pr20-8-exchange-anniversarygift-productive-one-write-live";
  const SOURCE_TRANSACTION_ID =
    "pr20-8-exchange-anniversarygift-productive-one-write-live:0c6a1129be4c9c899f88274fab97108a";
  const SOURCE_INTENT_PREFIX = "v5:" + SOURCE_TEST_ID + ":intent:";
  const SOURCE_AUTHORITY_PREFIX = "v5:" + SOURCE_TEST_ID + ":authority:";
  const SOURCE_FENCE_PREFIX = "v5:" + SOURCE_TEST_ID + ":fence:";
  const PROGRESS_KEY = "v5:" + TEST_ID + ":progress:" + SOURCE_TRANSACTION_ID;
  const RUNTIME_LEASE_KEY = "__V5PR208ExchangeAnniversarygiftLive5mLease";
  const EXPECTED_CHARACTER = "My_Merchant";
  const EXPECTED_CLASS = "merchant";
  const EXPECTED_SERVER_REGION = "EU";
  const EXPECTED_SERVER_IDENTIFIER = "I";
  const ITEM_NAME = "anniversarygift";
  const CANDIDATE_INDEX = 4;
  const QUANTITY_BEFORE = 106;
  const QUANTITY_AFTER = 105;
  const REWARD_GOLD_DELTA = 5000;
  const SOURCE_SNAPSHOT_COMMIT = "90052162eb3ebda36c893e1eb4af643913c8f984";
  const DROP_GRAPH_SHA256 =
    "2fad9b50ac0bb87a8e53a0cff8f6e34ded949b3531f8843f86d3f1fb8e828342";
  const SOURCE_NOTIFICATION_ID = 2949;
  const SOAK_SAMPLES = 60;
  const SOAK_INTERVAL_MS = 5000;
  const SOAK_MIN_DURATION_MS = 299000;
  const MAX_CONTINUATION_GAP_MS = 15000;

  const events = [];
  let seq = 0;
  let runPromise = null;
  let state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    startedAtMs: Date.now(),
    updatedAtMs: Date.now(),
    status: "BOOT",
    phase: "BOOT",
    terminal: false,
    blocker: [],
    evidence: null,
    intents: [],
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    sameIntentRetry: false,
    normalRuntimeAllowed: false,
    sourceTransactionId: SOURCE_TRANSACTION_ID,
    sourceSendCount: 1,
    sourceNotificationId: SOURCE_NOTIFICATION_ID,
    additionalGameplayWrites: 0,
    additionalPublicFunctionCalls: 0,
    additionalRawWriteCalls: 0,
    soak: {
      samples: 0,
      minimumSamples: SOAK_SAMPLES,
      intervalMs: SOAK_INTERVAL_MS,
      minimumDurationMs: SOAK_MIN_DURATION_MS
    }
  };

  function text(value, max = 500) {
    return String(value == null ? "" : value).trim().slice(0, max);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function canonical(value) {
    if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    if (value && typeof value === "object") {
      const keys = Object.keys(value).sort();
      return "{" + keys.map(key => JSON.stringify(key) + ":" + canonical(value[key])).join(",") + "}";
    }
    return JSON.stringify(value);
  }

  function roots() {
    const out = [];
    try { out.push(globalThis); } catch {}
    try {
      if (globalThis.parent
          && globalThis.parent !== globalThis
          && !out.includes(globalThis.parent)) out.push(globalThis.parent);
    } catch {}
    return out;
  }

  function root() {
    for (const candidate of roots()) {
      try {
        if (candidate?.character && Array.isArray(candidate.character.items)) return candidate;
      } catch {}
    }
    throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_SPIELKONTEXT_FEHLT");
  }

  function storage() {
    for (const candidate of roots()) {
      try {
        if (candidate?.localStorage
            && typeof candidate.localStorage.getItem === "function"
            && typeof candidate.localStorage.setItem === "function"
            && typeof candidate.localStorage.key === "function") {
          return candidate.localStorage;
        }
      } catch {}
    }
    throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_DURABLE_STORAGE_FEHLT");
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function readJson(key) {
    const raw = storage().getItem(key);
    if (raw === null) return null;
    try { return JSON.parse(raw); }
    catch {
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_DURABLE_JSON_BESCHAEDIGT:" + key);
    }
  }

  function writeJsonExact(key, value) {
    const encoded = JSON.stringify(value);
    storage().setItem(key, encoded);
    const readback = storage().getItem(key);
    if (readback !== encoded) {
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_PROGRESS_READBACK_MISMATCH");
    }
    return JSON.parse(readback);
  }

  function listRows(prefix) {
    const ls = storage();
    const rows = [];
    for (let i = 0; i < ls.length; i += 1) {
      const key = ls.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      rows.push({key, value: readJson(key)});
    }
    return rows;
  }

  function itemQuantity(item) {
    if (!item) return 0;
    const q = Number(item.q);
    return Number.isFinite(q) && q > 0 ? q : 1;
  }

  function semanticInventoryKey(item) {
    if (!item?.name) return null;
    if (item.name === "cxjar") return "cxjar|" + text(item.data, 120);
    return item.name;
  }

  function inventoryUnits(items) {
    const out = {};
    for (const item of items || []) {
      const key = semanticInventoryKey(item);
      if (!key) continue;
      out[key] = Number(out[key] || 0) + itemQuantity(item);
    }
    return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
  }

  function countPlaceholders(items) {
    return (items || []).filter(item => item?.name === "placeholder").length;
  }

  function serverBinding(r) {
    let p = null;
    try { if (r.parent && r.parent !== r) p = r.parent; } catch {}
    return {
      region: [
        r.server_region, r.server?.region,
        p?.server_region, p?.server?.region
      ].map(v => text(v, 32)).find(Boolean) || "",
      identifier: [
        r.server_identifier, r.server?.id,
        p?.server_identifier, p?.server?.id
      ].map(v => text(v, 32)).find(Boolean) || ""
    };
  }

  function recipientGuard() {
    const r = root();
    const c = r.character;
    const server = serverBinding(r);
    if (text(c.name, 192) !== EXPECTED_CHARACTER
        || text(c.id, 192) !== EXPECTED_CHARACTER
        || text(c.ctype || c.type, 32).toLowerCase() !== EXPECTED_CLASS
        || server.region !== EXPECTED_SERVER_REGION
        || server.identifier !== EXPECTED_SERVER_IDENTIFIER) {
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_RECIPIENT_ODER_SERVER_DRIFT");
    }
    return {
      characterName: text(c.name, 192),
      sessionId: text(c.id, 192),
      ctype: text(c.ctype || c.type, 32).toLowerCase(),
      serverRegion: server.region,
      serverIdentifier: server.identifier
    };
  }

  function findSourceIntent() {
    const rows = listRows(SOURCE_INTENT_PREFIX)
      .filter(row => row.value?.testId === SOURCE_TEST_ID);
    if (rows.length !== 1) {
      throw new Error(
        "PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_EXAKT_EIN_SOURCE_INTENT_ERFORDERLICH:" + rows.length
      );
    }
    const row = rows[0];
    const intent = row.value;
    const outcome = intent?.outcome;
    const domain = outcome?.rewardDomain;
    if (intent?.schemaVersion !== 1
        || intent.testId !== SOURCE_TEST_ID
        || intent.transactionId !== SOURCE_TRANSACTION_ID
        || intent.sourceSnapshotCommit !== SOURCE_SNAPSHOT_COMMIT
        || intent.dropGraphSha256 !== DROP_GRAPH_SHA256
        || intent.status !== "COMMITTED"
        || intent.terminal !== true
        || intent.sendCount !== 1
        || intent.sameIntentRetry !== false
        || intent.sendBoundaryState !== "SEND_MOEGLICH_ODER_VERSUCHT"
        || intent.actionContractId !== "AL-ACTION-EXCHANGE"
        || intent.recoveryContractId !== "AL-RECOVERY-EXCHANGE"
        || intent.verifierId !== "AL-VERIFIER-EXCHANGE"
        || intent.publicFunction !== "exchange"
        || intent.candidate?.name !== ITEM_NAME
        || intent.candidate?.index !== CANDIDATE_INDEX
        || Number(intent.candidate?.quantity) !== QUANTITY_BEFORE
        || Number(intent.candidate?.exchangeQuantity) !== 1
        || outcome?.classification !== "COMMITTED"
        || outcome?.candidateIndex !== CANDIDATE_INDEX
        || Number(outcome?.candidateQuantityBefore) !== QUANTITY_BEFORE
        || Number(outcome?.candidateQuantityNow) !== QUANTITY_AFTER
        || Number(outcome?.expectedQuantity) !== QUANTITY_AFTER
        || outcome?.qActive !== false
        || Number(outcome?.placeholderCount) !== 0
        || outcome?.promiseTimedOut !== true
        || outcome?.promiseError !== "PUBLIC_FUNCTION_PROMISE_TIMEOUT"
        || outcome?.promiseResultObserved !== false
        || outcome?.promiseResultIsSupportingEvidenceOnly !== true
        || domain?.valid !== true
        || domain?.rewardKind !== "gold"
        || Number(domain?.reward?.gold) !== REWARD_GOLD_DELTA
        || Number(domain?.goldDelta) !== REWARD_GOLD_DELTA
        || Number(domain?.inputDelta) !== -1
        || domain?.inputConsumedExactly !== true
        || domain?.noOtherNegative !== true
        || !Array.isArray(domain?.positives)
        || domain.positives.length !== 0
        || !Array.isArray(domain?.negatives)
        || domain.negatives.length !== 0
        || Number(domain?.afterAggregate?.[ITEM_NAME]) !== QUANTITY_AFTER
        || Number(domain?.aggregateDelta?.[ITEM_NAME]) !== -1) {
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_SOURCE_INTENT_DRIFT");
    }
    return row;
  }

  function sourceAuthorityGuard() {
    const key = SOURCE_AUTHORITY_PREFIX + SOURCE_TRANSACTION_ID;
    const authority = readJson(key);
    if (!authority
        || authority.schemaVersion !== 1
        || authority.testId !== SOURCE_TEST_ID
        || authority.transactionId !== SOURCE_TRANSACTION_ID
        || authority.authorityClass !== "Pr208AnniversaryGiftExchangeOneShotAuthority"
        || authority.maximumUses !== 1
        || authority.uses !== 1
        || authority.consumed !== true
        || authority.revoked === true
        || authority.sameIntentRetry !== false) {
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_SOURCE_AUTHORITY_DRIFT");
    }
    return authority;
  }

  function activeSourceFenceCount() {
    const now = Date.now();
    return listRows(SOURCE_FENCE_PREFIX).filter(row =>
      row.value?.transactionId === SOURCE_TRANSACTION_ID
      && Number(row.value?.expiresAtMs) > now
    ).length;
  }

  function exactSourceGuard() {
    const intentRow = findSourceIntent();
    const authority = sourceAuthorityGuard();
    const activeFences = activeSourceFenceCount();
    if (activeFences !== 0) {
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_SOURCE_FENCE_NOCH_AKTIV");
    }
    return {
      intentRow,
      summary: {
        intentKey: intentRow.key,
        transactionId: intentRow.value.transactionId,
        intentStatus: intentRow.value.status,
        terminal: intentRow.value.terminal,
        sendCount: intentRow.value.sendCount,
        reconciliation: intentRow.value.outcome.classification,
        rewardKind: intentRow.value.outcome.rewardDomain.rewardKind,
        rewardGold: intentRow.value.outcome.rewardDomain.reward.gold,
        authorityConsumed: authority.consumed,
        authorityUses: authority.uses,
        authorityMaximumUses: authority.maximumUses,
        activeSourceFences: activeFences
      }
    };
  }

  function exactPostcondition(intent) {
    const r = root();
    const c = r.character;
    const recipient = recipientGuard();
    const currentAggregate = inventoryUnits(c.items);
    const expectedAggregate = intent.outcome.rewardDomain.afterAggregate;
    const expectedGold = Number(intent.prestate?.gold || 0) + REWARD_GOLD_DELTA;
    const candidate = c.items[CANDIDATE_INDEX] || null;
    const candidateExact = candidate?.name === ITEM_NAME
      && itemQuantity(candidate) === QUANTITY_AFTER;
    const aggregateExact = canonical(currentAggregate) === canonical(expectedAggregate);
    const goldExact = Number(c.gold || 0) === expectedGold;
    const qClear = !c.q || (typeof c.q === "object" && Object.keys(c.q).length === 0);
    const placeholderCount = countPlaceholders(c.items);
    const massexchangePresent = !!c.s?.massexchange;
    const massexchangeppPresent = !!c.s?.massexchangepp;
    return {
      recipient,
      candidate: candidate
        ? {index:CANDIDATE_INDEX,name:candidate.name,quantity:itemQuantity(candidate)}
        : null,
      expectedQuantity: QUANTITY_AFTER,
      aggregateExact,
      currentAggregate,
      expectedAggregate,
      goldExact,
      currentGold: Number(c.gold || 0),
      expectedGold,
      rewardGoldDelta: REWARD_GOLD_DELTA,
      qClear,
      placeholderCount,
      massexchangePresent,
      massexchangeppPresent,
      stable: candidateExact
        && aggregateExact
        && goldExact
        && qClear
        && placeholderCount === 0
        && !massexchangePresent
        && !massexchangeppPresent
    };
  }

  async function ensurePerformanceTrick() {
    let available = false;
    let called = false;
    let lastError = null;

    const inspect = () => {
      let audioFound = false;
      let playing = false;
      let cplaying = false;
      for (const candidate of roots()) {
        try {
          const empty = candidate?.sounds?.empty;
          if (!empty) continue;
          audioFound = true;
          if (empty.cplaying === true) cplaying = true;
          if (typeof empty.playing === "function" && empty.playing() === true) playing = true;
        } catch {}
      }
      return {audioFound, playing, cplaying};
    };

    for (const candidate of roots()) {
      try {
        if (typeof candidate?.performance_trick !== "function") continue;
        available = true;
        candidate.performance_trick();
        called = true;
        break;
      } catch (error) {
        lastError = text(error?.message || error, 200);
      }
    }
    if (!available) {
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_PERFORMANCE_TRICK_FEHLT");
    }
    if (called) await sleep(350);

    let status = inspect();
    if (called && !status.playing) {
      for (const candidate of roots()) {
        try {
          if (typeof candidate?.performance_trick === "function") {
            candidate.performance_trick();
            break;
          }
        } catch (error) {
          lastError = text(error?.message || error, 200);
        }
      }
      await sleep(150);
      status = inspect();
    }

    const active = available && called && status.audioFound && status.playing;
    if (!active) {
      throw new Error(
        "PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_PERFORMANCE_TRICK_NICHT_AKTIV"
        + (lastError ? ":" + lastError : "")
      );
    }
    return {
      active:true,
      available,
      called,
      audioFound:status.audioFound,
      playing:status.playing,
      cplaying:status.cplaying,
      verification:"HOWLER_PLAYING_TRUE",
      error:lastError
    };
  }

  function emit(type, severity, data = {}) {
    seq += 1;
    events.push({
      seq,
      ts:new Date().toISOString(),
      type,
      severity,
      ...clone(data)
    });
    if (events.length > 2000) events.splice(0, events.length - 2000);
  }

  function setState(patch) {
    state = {...state, ...patch, updatedAtMs:Date.now()};
    publishTelemetryFacades();
    return state;
  }

  function installFacade(owner) {
    if (!owner) return;
    owner.AIO_V3 = owner.AIO_V3 || {};
    const existing = owner.AIO_V3.operations && typeof owner.AIO_V3.operations === "object"
      ? owner.AIO_V3.operations
      : {};
    owner.AIO_V3.operations = {
      ...existing,
      status: () => {
        let base = {};
        try {
          base = typeof existing.status === "function" ? existing.status() || {} : {};
        } catch {}
        return {...base, schemaVersion:Number(base.schemaVersion)||1, mode:"V5_AUTONOMOUS_TEST",
          v5AutonomousTest:clone(state)};
      },
      reconciliationStatus: () => ({
        schemaVersion:1,
        status:state.terminal
          ? "TERMINAL_NO_ADDITIONAL_MUTATION"
          : "POSTCOMMIT_SOAK_IN_PROGRESS",
        v5Terminal:state.terminal === true,
        sameIntentRetry:false,
        sourceTransactionId:SOURCE_TRANSACTION_ID,
        sourceSendCount:1,
        additionalGameplayWrites:0,
        additionalPublicFunctionCalls:0,
        additionalRawWriteCalls:0,
        v5AutonomousTestStatus:state.status
      }),
      telemetry:(limit=2000) =>
        events.slice(-Math.max(1,Math.min(2000,Number(limit)||2000))),
      peekTelemetry:(limit=2000) =>
        events.slice(-Math.max(1,Math.min(2000,Number(limit)||2000)))
    };
  }

  function publishTelemetryFacades() {
    for (const owner of roots()) installFacade(owner);
  }

  function acquireRuntimeLease() {
    const r = root();
    const existing = r[RUNTIME_LEASE_KEY];
    if (existing?.instanceId) {
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_DUPLIKAT_INSTANZ_AKTIV");
    }
    const lease = {
      schemaVersion:1,
      testId:TEST_ID,
      version:VERSION,
      instanceId:TEST_ID + ":" + Date.now() + ":" + Math.random().toString(16).slice(2),
      acquiredAtMs:Date.now()
    };
    r[RUNTIME_LEASE_KEY] = lease;
    return lease;
  }

  function releaseRuntimeLease(lease) {
    const r = root();
    if (r[RUNTIME_LEASE_KEY]?.instanceId === lease?.instanceId) {
      try { delete r[RUNTIME_LEASE_KEY]; }
      catch { r[RUNTIME_LEASE_KEY] = null; }
    }
  }

  function baselineFromIntent(intent) {
    return {
      transactionId:SOURCE_TRANSACTION_ID,
      sourceSendCount:1,
      candidate:{name:ITEM_NAME,index:CANDIDATE_INDEX,quantity:QUANTITY_AFTER},
      reward:{kind:"gold",goldDelta:REWARD_GOLD_DELTA},
      expectedAggregate:clone(intent.outcome.rewardDomain.afterAggregate),
      expectedGold:Number(intent.prestate?.gold || 0) + REWARD_GOLD_DELTA
    };
  }

  function initialProgress(now, intent) {
    return {
      schemaVersion:1,
      testId:TEST_ID,
      version:VERSION,
      transactionId:SOURCE_TRANSACTION_ID,
      status:"SOAK",
      terminal:false,
      soakStartedAtMs:now,
      lastObservedAtMs:now,
      samples:0,
      restartCount:0,
      baseline:baselineFromIntent(intent),
      evidence:null
    };
  }

  function validProgress(value, intent) {
    const expected = baselineFromIntent(intent);
    return value
      && value.schemaVersion === 1
      && value.testId === TEST_ID
      && value.version === VERSION
      && value.transactionId === SOURCE_TRANSACTION_ID
      && value.baseline?.sourceSendCount === 1
      && value.baseline?.candidate?.name === ITEM_NAME
      && value.baseline?.candidate?.index === CANDIDATE_INDEX
      && value.baseline?.candidate?.quantity === QUANTITY_AFTER
      && value.baseline?.reward?.kind === "gold"
      && value.baseline?.reward?.goldDelta === REWARD_GOLD_DELTA
      && Number(value.baseline?.expectedGold) === expected.expectedGold
      && canonical(value.baseline?.expectedAggregate) === canonical(expected.expectedAggregate);
  }

  function loadOrStartProgress(intent) {
    const now = Date.now();
    const existing = readJson(PROGRESS_KEY);
    if (!existing) return writeJsonExact(PROGRESS_KEY, initialProgress(now, intent));
    if (!validProgress(existing, intent)) {
      throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_PROGRESS_DRIFT");
    }
    if (existing.terminal === true && existing.status === "BESTANDEN") return existing;
    const gap = Math.max(0, now - Number(existing.lastObservedAtMs || 0));
    if (gap > MAX_CONTINUATION_GAP_MS) {
      return writeJsonExact(PROGRESS_KEY, {
        ...initialProgress(now, intent),
        restartCount:Number(existing.restartCount || 0) + 1
      });
    }
    return writeJsonExact(PROGRESS_KEY, {
      ...existing,
      restartCount:Number(existing.restartCount || 0) + 1,
      lastObservedAtMs:now
    });
  }

  function terminalEvidence(progress, sourceGuard, postcondition, performance) {
    const durationMs = Math.max(
      0,
      Number(progress.lastObservedAtMs || 0) - Number(progress.soakStartedAtMs || 0)
    );
    return {
      evidenceArt:"V5_PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_5M_POSTCOMMIT",
      status:"BESTANDEN",
      sourceNotificationId:SOURCE_NOTIFICATION_ID,
      sourceTestId:SOURCE_TEST_ID,
      sourceTransactionId:SOURCE_TRANSACTION_ID,
      sourceSnapshotCommit:SOURCE_SNAPSHOT_COMMIT,
      dropGraphSha256:DROP_GRAPH_SHA256,
      sourceSendCount:1,
      sameIntentRetry:false,
      noResendPathPresent:true,
      exchangeLive5mTested:true,
      normalRuntimeAllowed:false,
      sourceGuard:sourceGuard.summary,
      soak:{
        samples:Number(progress.samples),
        minimumSamples:SOAK_SAMPLES,
        intervalMs:SOAK_INTERVAL_MS,
        durationMs,
        minimumDurationMs:SOAK_MIN_DURATION_MS,
        restartCount:Number(progress.restartCount || 0)
      },
      postcondition,
      performanceTrick:performance,
      historicalMutationCounters:{
        gameplayWrites:1,
        publicFunctionCalls:1,
        rawWriteCalls:0
      },
      additionalMutationCounters:{
        gameplayWrites:0,
        publicFunctionCalls:0,
        rawWriteCalls:0
      },
      mayAdvanceToPr20_9:false
    };
  }

  function fail(error) {
    const message = text(error?.message || error, 500) || "UNBEKANNTER_FEHLER";
    emit("PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_FEHLER","error",{reason:message});
    setState({
      status:"FEHLER",
      phase:"ERROR",
      terminal:true,
      blocker:[message],
      gameplayWrites:0,
      publicFunctionCalls:0,
      rawWriteCalls:0,
      sameIntentRetry:false,
      normalRuntimeAllowed:false,
      additionalGameplayWrites:0,
      additionalPublicFunctionCalls:0,
      additionalRawWriteCalls:0
    });
    return state;
  }

  async function run() {
    if (runPromise) return runPromise;
    runPromise = (async () => {
      publishTelemetryFacades();
      const lease = acquireRuntimeLease();
      try {
        const performance = await ensurePerformanceTrick();
        const firstGuard = exactSourceGuard();
        let progress = loadOrStartProgress(firstGuard.intentRow.value);

        if (progress.terminal === true && progress.status === "BESTANDEN") {
          const post = exactPostcondition(firstGuard.intentRow.value);
          if (!post.stable) {
            throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_TERMINAL_POSTSTATE_DRIFT");
          }
          releaseRuntimeLease(lease);
          return setState({
            status:"BESTANDEN",
            phase:"COMPLETE",
            terminal:true,
            blocker:[],
            evidence:progress.evidence,
            intents:[{transactionId:SOURCE_TRANSACTION_ID,status:"COMMITTED",sendCount:1}],
            soak:progress.evidence?.soak || state.soak
          });
        }

        setState({
          status:"SOAK",
          phase:"POSTCOMMIT_SOAK",
          terminal:false,
          blocker:[],
          intents:[{transactionId:SOURCE_TRANSACTION_ID,status:"COMMITTED",sendCount:1}],
          performanceTrick:performance,
          soak:{
            samples:Number(progress.samples || 0),
            minimumSamples:SOAK_SAMPLES,
            intervalMs:SOAK_INTERVAL_MS,
            minimumDurationMs:SOAK_MIN_DURATION_MS,
            startedAtMs:Number(progress.soakStartedAtMs)
          }
        });

        while (true) {
          const durationMs = Math.max(
            0,
            Number(progress.lastObservedAtMs || 0) - Number(progress.soakStartedAtMs || 0)
          );
          if (Number(progress.samples) >= SOAK_SAMPLES && durationMs >= SOAK_MIN_DURATION_MS) break;

          await sleep(SOAK_INTERVAL_MS);
          const sourceGuard = exactSourceGuard();
          const postcondition = exactPostcondition(sourceGuard.intentRow.value);
          if (!postcondition.stable) {
            throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_POSTSTATE_DRIFT");
          }

          progress = writeJsonExact(PROGRESS_KEY, {
            ...progress,
            status:"SOAK",
            terminal:false,
            samples:Number(progress.samples || 0) + 1,
            lastObservedAtMs:Date.now()
          });
          setState({
            status:"SOAK",
            phase:"POSTCOMMIT_SOAK",
            terminal:false,
            soak:{
              samples:Number(progress.samples),
              minimumSamples:SOAK_SAMPLES,
              intervalMs:SOAK_INTERVAL_MS,
              minimumDurationMs:SOAK_MIN_DURATION_MS,
              startedAtMs:Number(progress.soakStartedAtMs),
              durationMs:Math.max(
                0,
                Number(progress.lastObservedAtMs) - Number(progress.soakStartedAtMs)
              )
            }
          });
        }

        const finalGuard = exactSourceGuard();
        const finalPostcondition = exactPostcondition(finalGuard.intentRow.value);
        if (!finalPostcondition.stable) {
          throw new Error("PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_FINAL_POSTSTATE_DRIFT");
        }
        const evidence = terminalEvidence(
          progress, finalGuard, finalPostcondition, performance
        );
        progress = writeJsonExact(PROGRESS_KEY, {
          ...progress,
          status:"BESTANDEN",
          terminal:true,
          terminalAtMs:Date.now(),
          evidence
        });
        releaseRuntimeLease(lease);
        setState({
          status:"BESTANDEN",
          phase:"COMPLETE",
          terminal:true,
          blocker:[],
          evidence,
          intents:[{transactionId:SOURCE_TRANSACTION_ID,status:"COMMITTED",sendCount:1}],
          soak:evidence.soak
        });
        emit("PR20_8_EXCHANGE_ANNIVERSARYGIFT_5M_COMPLETE","info",{
          transactionId:SOURCE_TRANSACTION_ID,
          samples:evidence.soak.samples,
          durationMs:evidence.soak.durationMs
        });
        return state;
      } catch (error) {
        releaseRuntimeLease(lease);
        return fail(error);
      }
    })();
    return runPromise;
  }

  function incumbent() {
    for (const owner of roots()) {
      try {
        const value = owner?.[API_NAME];
        if (value
            && value.testId === TEST_ID
            && value.version === VERSION
            && typeof value.start === "function"
            && typeof value.status === "function") return value;
      } catch {}
    }
    return null;
  }

  const old = incumbent();
  if (old) {
    try { old.start(); } catch {}
    return;
  }

  publishTelemetryFacades();
  const api = Object.freeze({
    testId:TEST_ID,
    version:VERSION,
    status:()=>clone(state),
    telemetry:(limit=2000)=>
      clone(events.slice(-Math.max(1,Math.min(2000,Number(limit)||2000)))),
    start:()=>run()
  });

  for (const owner of roots()) {
    try {
      Object.defineProperty(owner, API_NAME, {
        configurable:true,
        enumerable:true,
        writable:false,
        value:api
      });
    } catch {
      try { owner[API_NAME] = api; } catch {}
    }
  }

  Promise.resolve().then(run).catch(error => fail(error));
})();
