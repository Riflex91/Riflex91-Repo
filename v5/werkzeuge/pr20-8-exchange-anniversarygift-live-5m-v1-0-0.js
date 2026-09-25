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
  const ITEM_INDEX = 4;
  const QUANTITY_BEFORE = 106;
  const QUANTITY_AFTER = 105;
  const GOLD_DELTA = 5000;
  const DROP_GRAPH_SHA256 =
    "2fad9b50ac0bb87a8e53a0cff8f6e34ded949b3531f8843f86d3f1fb8e828342";
  const OFFICIAL_SOURCE_COMMIT =
    "90052162eb3ebda36c893e1eb4af643913c8f984";

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
    sourceTransactionId: SOURCE_TRANSACTION_ID,
    sourceSendCount: 1,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    additionalGameplayWrites: 0,
    additionalPublicFunctionCalls: 0,
    additionalRawWriteCalls: 0,
    sameIntentRetry: false,
    exchangeAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
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
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
    const keys = Object.keys(value).sort();
    return "{" + keys.map(key => JSON.stringify(key) + ":" + canonical(value[key])).join(",") + "}";
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
    throw new Error("PR20_8_EXCHANGE_5M_SPIELKONTEXT_FEHLT");
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function serverBinding(r) {
    let region = text(r.server_region || globalThis.server_region, 32);
    let identifier = text(r.server_identifier || globalThis.server_identifier, 32);
    for (const value of [r.server, globalThis.server]) {
      if (!value || typeof value !== "object") continue;
      if (!region) region = text(value.region || value.server_region, 32);
      if (!identifier) {
        identifier = text(
          value.identifier || value.id || value.name || value.server_identifier,
          32
        );
      }
    }
    return {region, identifier};
  }

  function storage() {
    const r = root();
    const ls = r.localStorage || globalThis.localStorage;
    if (!ls
        || typeof ls.getItem !== "function"
        || typeof ls.setItem !== "function"
        || typeof ls.key !== "function") {
      throw new Error("PR20_8_EXCHANGE_5M_DURABLE_STORAGE_UNAVAILABLE");
    }
    return ls;
  }

  function readJson(key) {
    const raw = storage().getItem(key);
    if (raw === null) return null;
    try { return JSON.parse(raw); }
    catch {
      throw new Error("PR20_8_EXCHANGE_5M_DURABLE_JSON_BESCHAEDIGT:" + key);
    }
  }

  function writeJsonExact(key, value) {
    const encoded = JSON.stringify(value);
    storage().setItem(key, encoded);
    const readback = storage().getItem(key);
    if (readback !== encoded) {
      throw new Error("PR20_8_EXCHANGE_5M_PROGRESS_READBACK_MISMATCH");
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

  function inventoryUnits(items) {
    const out = {};
    for (const item of items || []) {
      if (!item?.name || item.name === "placeholder") continue;
      const key = item.name === "cxjar"
        ? "cxjar|" + text(item.data, 160)
        : text(item.name, 160);
      out[key] = Number(out[key] || 0) + itemQuantity(item);
    }
    return out;
  }

  function placeholderCount(c) {
    return c.items.reduce(
      (sum, item) => sum + (item?.name === "placeholder" ? 1 : 0),
      0
    );
  }

  function activeExchangeQueue(c) {
    if (!c.q || typeof c.q !== "object") return false;
    return Object.keys(c.q).some(key => key.toLowerCase().includes("exchange"));
  }

  function findSourceIntent() {
    const rows = listRows(SOURCE_INTENT_PREFIX)
      .filter(row => row.value?.testId === SOURCE_TEST_ID);
    if (rows.length !== 1) {
      throw new Error("PR20_8_EXCHANGE_5M_EXAKT_EIN_SOURCE_INTENT_ERFORDERLICH:" + rows.length);
    }
    const row = rows[0];
    const intent = row.value;
    const outcome = intent?.outcome;
    const domain = outcome?.rewardDomain;
    if (intent.transactionId !== SOURCE_TRANSACTION_ID
        || intent.version !== "1.0.0"
        || intent.status !== "COMMITTED"
        || intent.terminal !== true
        || intent.sendCount !== 1
        || intent.sameIntentRetry !== false
        || intent.sendBoundaryState !== "SEND_MOEGLICH_ODER_VERSUCHT"
        || intent.actionContractId !== "AL-ACTION-EXCHANGE"
        || intent.recoveryContractId !== "AL-RECOVERY-EXCHANGE"
        || intent.verifierId !== "AL-VERIFIER-EXCHANGE"
        || intent.publicFunction !== "exchange"
        || intent.sourceSnapshotCommit !== OFFICIAL_SOURCE_COMMIT
        || intent.dropGraphSha256 !== DROP_GRAPH_SHA256
        || outcome?.classification !== "COMMITTED"
        || domain?.valid !== true
        || domain?.rewardKind !== "gold"
        || Number(domain?.goldDelta) !== GOLD_DELTA
        || Number(domain?.inputDelta) !== -1
        || domain?.inputConsumedExactly !== true
        || domain?.noOtherNegative !== true
        || Number(outcome?.candidateQuantityBefore) !== QUANTITY_BEFORE
        || Number(outcome?.candidateQuantityNow) !== QUANTITY_AFTER
        || Number(outcome?.expectedQuantity) !== QUANTITY_AFTER
        || intent.candidate?.name !== ITEM_NAME
        || Number(intent.candidate?.index) !== ITEM_INDEX
        || Number(intent.candidate?.quantity) !== QUANTITY_BEFORE
        || Number(intent.candidate?.exchangeQuantity) !== 1
        || !domain?.afterAggregate
        || Number(domain.afterAggregate[ITEM_NAME]) !== QUANTITY_AFTER
        || !Number.isFinite(Number(intent.prestate?.gold))) {
      throw new Error("PR20_8_EXCHANGE_5M_SOURCE_INTENT_DRIFT");
    }
    return row;
  }

  function sourceAuthorityGuard() {
    const key = SOURCE_AUTHORITY_PREFIX + SOURCE_TRANSACTION_ID;
    const authority = readJson(key);
    if (!authority
        || authority.transactionId !== SOURCE_TRANSACTION_ID
        || authority.testId !== SOURCE_TEST_ID
        || authority.authorityClass !== "Pr208AnniversaryGiftExchangeOneShotAuthority"
        || authority.maximumUses !== 1
        || authority.uses !== 1
        || authority.consumed !== true
        || authority.revoked === true
        || authority.sameIntentRetry !== false) {
      throw new Error("PR20_8_EXCHANGE_5M_SOURCE_AUTHORITY_DRIFT");
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
      throw new Error("PR20_8_EXCHANGE_5M_SOURCE_FENCE_NOCH_AKTIV");
    }
    return {
      intentKey: intentRow.key,
      transactionId: intentRow.value.transactionId,
      intentStatus: intentRow.value.status,
      terminal: intentRow.value.terminal,
      sendCount: intentRow.value.sendCount,
      reconciliation: intentRow.value.outcome.classification,
      rewardKind: intentRow.value.outcome.rewardDomain.rewardKind,
      goldDelta: Number(intentRow.value.outcome.rewardDomain.goldDelta),
      inputDelta: Number(intentRow.value.outcome.rewardDomain.inputDelta),
      authorityConsumed: authority.consumed,
      authorityUses: authority.uses,
      authorityMaximumUses: authority.maximumUses,
      activeSourceFences: activeFences
    };
  }

  function exactPostcondition() {
    const r = root();
    const c = r.character;
    const server = serverBinding(r);
    if (text(c.name, 192) !== EXPECTED_CHARACTER
        || text(c.id, 192) !== EXPECTED_CHARACTER
        || text(c.ctype, 32).toLowerCase() !== EXPECTED_CLASS
        || server.region !== EXPECTED_SERVER_REGION
        || server.identifier !== EXPECTED_SERVER_IDENTIFIER) {
      throw new Error("PR20_8_EXCHANGE_5M_RECIPIENT_ODER_SERVER_DRIFT");
    }

    const source = findSourceIntent().value;
    const committedAggregate = source.outcome.rewardDomain.afterAggregate;
    const aggregate = inventoryUnits(c.items);
    const aggregateExact = canonical(aggregate) === canonical(committedAggregate);
    const expectedGold = Number(source.prestate.gold) + GOLD_DELTA;
    const goldExact = Number(c.gold || 0) === expectedGold;
    const input = c.items[ITEM_INDEX] || null;
    const inputExact = input?.name === ITEM_NAME && itemQuantity(input) === QUANTITY_AFTER;
    const qClear = !c.q || (typeof c.q === "object" && Object.keys(c.q).length === 0);
    const exchangeQueueClear = !activeExchangeQueue(c);
    const placeholders = placeholderCount(c);
    const massexchangePresent = !!c.s?.massexchange;
    const massexchangeppPresent = !!c.s?.massexchangepp;
    const moving = c.moving === true;
    const targetClear = c.target == null || !text(c.target, 192);

    return {
      recipient: {
        characterName: text(c.name, 192),
        sessionId: text(c.id, 192),
        ctype: text(c.ctype, 32).toLowerCase(),
        serverRegion: server.region,
        serverIdentifier: server.identifier
      },
      input: input
        ? {index: ITEM_INDEX, name: input.name, quantity: itemQuantity(input)}
        : null,
      aggregate,
      committedAggregate,
      aggregateExact,
      gold: Number(c.gold || 0),
      expectedGold,
      goldExact,
      qClear,
      exchangeQueueClear,
      placeholderCount: placeholders,
      massexchangePresent,
      massexchangeppPresent,
      moving,
      targetClear,
      stable: aggregateExact
        && goldExact
        && inputExact
        && qClear
        && exchangeQueueClear
        && placeholders === 0
        && !massexchangePresent
        && !massexchangeppPresent
        && !moving
        && targetClear
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
    if (!available) throw new Error("PR20_8_EXCHANGE_5M_PERFORMANCE_TRICK_FEHLT");
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
        "PR20_8_EXCHANGE_5M_PERFORMANCE_TRICK_NICHT_AKTIV"
        + (lastError ? ":" + lastError : "")
      );
    }
    return {
      active: true,
      available,
      called,
      audioFound: status.audioFound,
      cplaying: status.cplaying,
      playing: status.playing,
      verification: "HOWLER_PLAYING_TRUE",
      error: lastError
    };
  }

  function emit(type, severity, data = {}) {
    seq += 1;
    events.push({
      seq,
      ts: new Date().toISOString(),
      type,
      severity,
      ...clone(data)
    });
    if (events.length > 2000) events.splice(0, events.length - 2000);
  }

  function setState(patch) {
    state = {...state, ...patch, updatedAtMs: Date.now()};
    publishTelemetryFacades();
    return state;
  }

  function installFacade(owner) {
    if (!owner) return;
    owner.AIO_V3 = owner.AIO_V3 || {};
    const existing = owner.AIO_V3.operations
      && typeof owner.AIO_V3.operations === "object"
      ? owner.AIO_V3.operations
      : {};
    owner.AIO_V3.operations = {
      ...existing,
      status: () => {
        let base = {};
        try {
          base = typeof existing.status === "function" ? existing.status() || {} : {};
        } catch {}
        return {
          ...base,
          schemaVersion: Number(base.schemaVersion) || 1,
          mode: "V5_AUTONOMOUS_TEST",
          v5AutonomousTest: clone(state)
        };
      },
      reconciliationStatus: () => ({
        schemaVersion: 1,
        status: state.terminal
          ? "TERMINAL_NO_ADDITIONAL_MUTATION"
          : "POSTCOMMIT_SOAK_IN_PROGRESS",
        v5Terminal: state.terminal === true,
        sameIntentRetry: false,
        sourceTransactionId: SOURCE_TRANSACTION_ID,
        sourceSendCount: 1,
        additionalGameplayWrites: 0,
        additionalPublicFunctionCalls: 0,
        additionalRawWriteCalls: 0,
        v5AutonomousTestStatus: state.status
      }),
      peekTelemetry: (limit = 2000) =>
        events.slice(-Math.max(1, Math.min(2000, Number(limit) || 2000)))
    };
  }

  function publishTelemetryFacades() {
    for (const owner of roots()) installFacade(owner);
  }

  function acquireRuntimeLease() {
    const r = root();
    const existing = r[RUNTIME_LEASE_KEY];
    if (existing?.instanceId) {
      throw new Error("PR20_8_EXCHANGE_5M_DUPLIKAT_INSTANZ_AKTIV");
    }
    const lease = {
      schemaVersion: 1,
      testId: TEST_ID,
      version: VERSION,
      instanceId: TEST_ID + ":" + Date.now() + ":" + Math.random().toString(16).slice(2),
      acquiredAtMs: Date.now()
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

  function progressBaseline(sourceGuard, postcondition) {
    return {
      transactionId: SOURCE_TRANSACTION_ID,
      sourceSendCount: 1,
      sourceReconciliation: sourceGuard.reconciliation,
      rewardKind: sourceGuard.rewardKind,
      goldDelta: sourceGuard.goldDelta,
      inputDelta: sourceGuard.inputDelta,
      input: {index: ITEM_INDEX, name: ITEM_NAME, quantity: QUANTITY_AFTER},
      aggregate: clone(postcondition.aggregate),
      gold: postcondition.gold
    };
  }

  function initialProgress(now, sourceGuard, postcondition) {
    return {
      schemaVersion: 1,
      testId: TEST_ID,
      version: VERSION,
      transactionId: SOURCE_TRANSACTION_ID,
      status: "SOAK",
      terminal: false,
      soakStartedAtMs: now,
      lastObservedAtMs: now,
      samples: 0,
      restartCount: 0,
      baseline: progressBaseline(sourceGuard, postcondition),
      evidence: null
    };
  }

  function validProgress(value) {
    return value
      && value.schemaVersion === 1
      && value.testId === TEST_ID
      && value.version === VERSION
      && value.transactionId === SOURCE_TRANSACTION_ID
      && value.baseline?.sourceSendCount === 1
      && value.baseline?.sourceReconciliation === "COMMITTED"
      && value.baseline?.rewardKind === "gold"
      && Number(value.baseline?.goldDelta) === GOLD_DELTA
      && Number(value.baseline?.inputDelta) === -1
      && value.baseline?.input?.index === ITEM_INDEX
      && value.baseline?.input?.name === ITEM_NAME
      && Number(value.baseline?.input?.quantity) === QUANTITY_AFTER
      && value.baseline?.aggregate
      && Number(value.baseline.aggregate[ITEM_NAME]) === QUANTITY_AFTER
      && Number.isFinite(Number(value.baseline?.gold));
  }

  function loadOrStartProgress(sourceGuard, postcondition) {
    const now = Date.now();
    const existing = readJson(PROGRESS_KEY);
    if (!existing) {
      return writeJsonExact(PROGRESS_KEY, initialProgress(now, sourceGuard, postcondition));
    }
    if (!validProgress(existing)) {
      throw new Error("PR20_8_EXCHANGE_5M_PROGRESS_DRIFT");
    }
    if (existing.terminal === true && existing.status === "BESTANDEN") return existing;
    const gap = Math.max(0, now - Number(existing.lastObservedAtMs || 0));
    if (gap > MAX_CONTINUATION_GAP_MS) {
      return writeJsonExact(PROGRESS_KEY, {
        ...initialProgress(now, sourceGuard, postcondition),
        restartCount: Number(existing.restartCount || 0) + 1
      });
    }
    return writeJsonExact(PROGRESS_KEY, {
      ...existing,
      restartCount: Number(existing.restartCount || 0) + 1,
      lastObservedAtMs: now
    });
  }

  function assertBaseline(progress, postcondition) {
    if (canonical(progress.baseline.aggregate) !== canonical(postcondition.aggregate)
        || Number(progress.baseline.gold) !== Number(postcondition.gold)
        || Number(postcondition.input?.index) !== ITEM_INDEX
        || postcondition.input?.name !== ITEM_NAME
        || Number(postcondition.input?.quantity) !== QUANTITY_AFTER) {
      throw new Error("PR20_8_EXCHANGE_5M_POSTCONDITION_BASELINE_DRIFT");
    }
  }

  function terminalEvidence(progress, sourceGuard, postcondition, performance) {
    const durationMs = Math.max(
      0,
      Number(progress.lastObservedAtMs || 0) - Number(progress.soakStartedAtMs || 0)
    );
    return {
      evidenceArt: "V5_PR20_8_EXCHANGE_ANNIVERSARYGIFT_LIVE_5M_POSTCOMMIT",
      status: "BESTANDEN",
      exchangeLive5mTested: true,
      sourceTestId: SOURCE_TEST_ID,
      sourceTransactionId: SOURCE_TRANSACTION_ID,
      sourceSendCount: 1,
      sameIntentRetry: false,
      noResendPathPresent: true,
      normalRuntimeAllowed: false,
      sourceGuard,
      postcondition,
      performanceTrick: performance,
      soak: {
        status: "BESTANDEN",
        samples: progress.samples,
        minimumSamples: SOAK_SAMPLES,
        intervalMs: SOAK_INTERVAL_MS,
        durationMs,
        minimumDurationMs: SOAK_MIN_DURATION_MS,
        restartCount: Number(progress.restartCount || 0)
      },
      additionalMutationCounters: {
        gameplayWrites: 0,
        publicFunctionCalls: 0,
        rawWriteCalls: 0
      }
    };
  }

  function fail(error) {
    const reason = text(error?.message || error, 500) || "UNBEKANNTER_FEHLER";
    emit("PR20_8_EXCHANGE_5M_FEHLER", "error", {reason});
    setState({
      status: "FEHLER",
      phase: "ERROR",
      terminal: true,
      blocker: [reason],
      gameplayWrites: 0,
      publicFunctionCalls: 0,
      rawWriteCalls: 0,
      additionalGameplayWrites: 0,
      additionalPublicFunctionCalls: 0,
      additionalRawWriteCalls: 0,
      exchangeAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      normalRuntimeAllowed: false
    });
    return state;
  }

  async function run() {
    let lease = null;
    try {
      lease = acquireRuntimeLease();
      const performance = await ensurePerformanceTrick();
      const sourceGuard = exactSourceGuard();
      const firstPostcondition = exactPostcondition();
      if (!firstPostcondition.stable) {
        throw new Error("PR20_8_EXCHANGE_5M_POSTCONDITION_NICHT_STABIL");
      }

      let progress = loadOrStartProgress(sourceGuard, firstPostcondition);
      if (progress.terminal === true && progress.status === "BESTANDEN") {
        releaseRuntimeLease(lease);
        return setState({
          status: "BESTANDEN",
          phase: "COMPLETE",
          terminal: true,
          blocker: [],
          evidence: progress.evidence,
          intents: [{transactionId: SOURCE_TRANSACTION_ID,status:"COMMITTED",sendCount:1}],
          soak: progress.evidence?.soak || state.soak
        });
      }

      setState({
        status: "SOAK",
        phase: "SOAK",
        terminal: false,
        blocker: [],
        intents: [{transactionId: SOURCE_TRANSACTION_ID,status:"COMMITTED",sendCount:1}],
        soak: {
          samples: Number(progress.samples || 0),
          minimumSamples: SOAK_SAMPLES,
          intervalMs: SOAK_INTERVAL_MS,
          minimumDurationMs: SOAK_MIN_DURATION_MS
        }
      });

      while (Number(progress.samples || 0) < SOAK_SAMPLES) {
        const currentGuard = exactSourceGuard();
        const postcondition = exactPostcondition();
        if (!postcondition.stable) {
          throw new Error("PR20_8_EXCHANGE_5M_POSTCONDITION_DRIFT");
        }
        assertBaseline(progress, postcondition);
        if (currentGuard.transactionId !== sourceGuard.transactionId
            || currentGuard.sendCount !== 1
            || currentGuard.reconciliation !== "COMMITTED"
            || currentGuard.authorityConsumed !== true
            || currentGuard.authorityUses !== 1
            || currentGuard.authorityMaximumUses !== 1
            || currentGuard.activeSourceFences !== 0
            || currentGuard.rewardKind !== "gold"
            || currentGuard.goldDelta !== GOLD_DELTA
            || currentGuard.inputDelta !== -1) {
          throw new Error("PR20_8_EXCHANGE_5M_SOURCE_GUARD_DRIFT");
        }

        const now = Date.now();
        progress = writeJsonExact(PROGRESS_KEY, {
          ...progress,
          lastObservedAtMs: now,
          samples: Number(progress.samples || 0) + 1
        });
        setState({
          status: "SOAK",
          phase: "SOAK",
          terminal: false,
          blocker: [],
          soak: {
            samples: progress.samples,
            minimumSamples: SOAK_SAMPLES,
            intervalMs: SOAK_INTERVAL_MS,
            minimumDurationMs: SOAK_MIN_DURATION_MS
          }
        });
        if (progress.samples < SOAK_SAMPLES) await sleep(SOAK_INTERVAL_MS);
      }

      const durationMs = Math.max(
        0,
        Number(progress.lastObservedAtMs || 0) - Number(progress.soakStartedAtMs || 0)
      );
      if (durationMs < SOAK_MIN_DURATION_MS) {
        const remaining = SOAK_MIN_DURATION_MS - durationMs;
        await sleep(remaining);
        const currentGuard = exactSourceGuard();
        const postcondition = exactPostcondition();
        if (!postcondition.stable) {
          throw new Error("PR20_8_EXCHANGE_5M_FINAL_POSTCONDITION_DRIFT");
        }
        assertBaseline(progress, postcondition);
        if (currentGuard.activeSourceFences !== 0
            || currentGuard.authorityConsumed !== true
            || currentGuard.authorityUses !== 1
            || currentGuard.sendCount !== 1) {
          throw new Error("PR20_8_EXCHANGE_5M_FINAL_SOURCE_GUARD_DRIFT");
        }
        progress = writeJsonExact(PROGRESS_KEY, {
          ...progress,
          lastObservedAtMs: Date.now()
        });
      }

      const finalDuration = Math.max(
        0,
        Number(progress.lastObservedAtMs || 0) - Number(progress.soakStartedAtMs || 0)
      );
      if (Number(progress.samples) < SOAK_SAMPLES || finalDuration < SOAK_MIN_DURATION_MS) {
        throw new Error("PR20_8_EXCHANGE_5M_MINIMUM_NICHT_ERREICHT");
      }

      const finalGuard = exactSourceGuard();
      const finalPostcondition = exactPostcondition();
      if (!finalPostcondition.stable) {
        throw new Error("PR20_8_EXCHANGE_5M_FINAL_POSTCONDITION_NICHT_STABIL");
      }
      assertBaseline(progress, finalPostcondition);
      const evidence = terminalEvidence(progress, finalGuard, finalPostcondition, performance);
      progress = writeJsonExact(PROGRESS_KEY, {
        ...progress,
        status: "BESTANDEN",
        terminal: true,
        terminalAtMs: Date.now(),
        evidence
      });

      releaseRuntimeLease(lease);
      setState({
        status: "BESTANDEN",
        phase: "COMPLETE",
        terminal: true,
        blocker: [],
        evidence,
        intents: [{transactionId: SOURCE_TRANSACTION_ID,status:"COMMITTED",sendCount:1}],
        gameplayWrites: 0,
        publicFunctionCalls: 0,
        rawWriteCalls: 0,
        additionalGameplayWrites: 0,
        additionalPublicFunctionCalls: 0,
        additionalRawWriteCalls: 0,
        exchangeAuthority: false,
        gameplayAuthority: false,
        rawWriteAuthority: false,
        normalRuntimeAllowed: false,
        soak: evidence.soak
      });
      emit("PR20_8_EXCHANGE_5M_COMPLETE", "info", {
        transactionId: SOURCE_TRANSACTION_ID,
        samples: evidence.soak.samples,
        durationMs: evidence.soak.durationMs
      });
      return state;
    } catch (error) {
      if (lease) releaseRuntimeLease(lease);
      return fail(error);
    }
  }

  function startOnce() {
    if (runPromise === null) runPromise = run();
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
    testId: TEST_ID,
    version: VERSION,
    status: () => clone(state),
    telemetry: (limit = 2000) =>
      events.slice(-Math.max(1, Math.min(2000, Number(limit) || 2000))),
    start: () => startOnce()
  });

  for (const owner of roots()) {
    try {
      Object.defineProperty(owner, API_NAME, {
        configurable: true,
        enumerable: true,
        writable: false,
        value: api
      });
    } catch {
      try { owner[API_NAME] = api; } catch {}
    }
  }

  Promise.resolve().then(startOnce).catch(error => fail(error));
})();