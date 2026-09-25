(() => {
  "use strict";

  const VERSION = "1.0.2";
  const PREVIOUS_VERSION = "1.0.1";
  const TEST_ID = "pr20-8-compound-live-5m";
  const API_NAME = "V5PR208CompoundLive5m";
  const SOURCE_TEST_ID = "pr20-8-compound-productive-one-write-live";
  const SOURCE_TRANSACTION_ID =
    "pr20-8-compound-productive-one-write-live:ff08418e6003250471c98f5893dec8dd";
  const SOURCE_INTENT_PREFIX = "v5:" + SOURCE_TEST_ID + ":intent:";
  const SOURCE_AUTHORITY_PREFIX = "v5:" + SOURCE_TEST_ID + ":authority:";
  const SOURCE_FENCE_PREFIX = "v5:" + SOURCE_TEST_ID + ":fence:";
  const PROGRESS_KEY = "v5:" + TEST_ID + ":progress:" + SOURCE_TRANSACTION_ID;
  const RUNTIME_LEASE_KEY = "__V5PR208CompoundLive5mLease";
  const EXPECTED_CHARACTER = "My_Merchant";
  const EXPECTED_CLASS = "merchant";
  const EXPECTED_SERVER_REGION = "EU";
  const EXPECTED_SERVER_IDENTIFIER = "I";
  const RESULT_ITEM_NAME = "hpamulet";
  const RESULT_ITEM_LEVEL = 1;
  const RESULT_ITEM_INDEX = 1;
  const CONSUMED_INPUT_INDEXES = Object.freeze([22, 23]);
  const SCROLL_NAME = "cscroll0";
  const SCROLL_INDEX = 18;
  const SCROLL_QUANTITY = 19;
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
        if (candidate?.character && Array.isArray(candidate.character.items)) {
          return candidate;
        }
      } catch {}
    }
    throw new Error("PR20_8_COMPOUND_5M_SPIELKONTEXT_FEHLT");
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function serverBinding(r) {
    let region = text(r.server_region || globalThis.server_region, 32);
    let identifier = text(r.server_identifier || globalThis.server_identifier, 32);
    const candidates = [r.server, globalThis.server];
    for (const value of candidates) {
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
      throw new Error("PR20_8_COMPOUND_5M_DURABLE_STORAGE_UNAVAILABLE");
    }
    return ls;
  }

  function readJson(key) {
    const raw = storage().getItem(key);
    if (raw === null) return null;
    try { return JSON.parse(raw); }
    catch {
      throw new Error("PR20_8_COMPOUND_5M_DURABLE_JSON_BESCHAEDIGT:" + key);
    }
  }

  function writeJsonExact(key, value) {
    const encoded = JSON.stringify(value);
    storage().setItem(key, encoded);
    const readback = storage().getItem(key);
    if (readback !== encoded) {
      throw new Error("PR20_8_COMPOUND_5M_PROGRESS_READBACK_MISMATCH");
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

  function activeCompoundQueue(c) {
    if (!c.q || typeof c.q !== "object") return false;
    return Object.keys(c.q).some(key => key.toLowerCase().includes("compound"));
  }

  function placeholderCount(c) {
    return c.items.reduce(
      (sum, item) => sum + (item?.name === "placeholder" ? 1 : 0),
      0
    );
  }

  function serverGraceClear(r) {
    const value = r.S?.cgrace;
    if (value == null) return true;
    if (typeof value !== "object") return false;
    return Object.keys(value).length === 0;
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
      throw new Error("PR20_8_COMPOUND_5M_RECIPIENT_ODER_SERVER_DRIFT");
    }

    const result = c.items[RESULT_ITEM_INDEX] || null;
    const resultExact = result?.name === RESULT_ITEM_NAME
      && Number(result.level || 0) === RESULT_ITEM_LEVEL;
    const consumedInputsEmpty = CONSUMED_INPUT_INDEXES.every(index =>
      c.items[index] == null
    );
    const scroll = c.items[SCROLL_INDEX] || null;
    const scrollExact = scroll?.name === SCROLL_NAME
      && itemQuantity(scroll) === SCROLL_QUANTITY;
    const qClear = !c.q || (typeof c.q === "object" && Object.keys(c.q).length === 0);
    const compoundQueueClear = !activeCompoundQueue(c);
    const placeholders = placeholderCount(c);
    const massproductionPresent = !!c.s?.massproduction;
    const massproductionppPresent = !!c.s?.massproductionpp;
    const compoundEffectsClear =
      c.p?.c_roll == null
      && c.p?.c_item == null
      && c.p?.c_itemx == null
      && serverGraceClear(r);

    return {
      recipient: {
        characterName: text(c.name, 192),
        sessionId: text(c.id, 192),
        ctype: text(c.ctype, 32).toLowerCase(),
        serverRegion: server.region,
        serverIdentifier: server.identifier
      },
      resultItem: result
        ? {index: RESULT_ITEM_INDEX, name: result.name, level: Number(result.level || 0)}
        : null,
      consumedInputIndexes: [...CONSUMED_INPUT_INDEXES],
      consumedInputsEmpty,
      scroll: scroll
        ? {index: SCROLL_INDEX, name: scroll.name, quantity: itemQuantity(scroll)}
        : null,
      qClear,
      compoundQueueClear,
      placeholderCount: placeholders,
      massproductionPresent,
      massproductionppPresent,
      compoundEffectsClear,
      stable: resultExact
        && consumedInputsEmpty
        && scrollExact
        && qClear
        && compoundQueueClear
        && placeholders === 0
        && !massproductionPresent
        && !massproductionppPresent
        && compoundEffectsClear
    };
  }

  function findSourceIntent() {
    const rows = listRows(SOURCE_INTENT_PREFIX)
      .filter(row => row.value?.testId === SOURCE_TEST_ID);
    if (rows.length !== 1) {
      throw new Error(
        "PR20_8_COMPOUND_5M_EXAKT_EIN_SOURCE_INTENT_ERFORDERLICH:" + rows.length
      );
    }
    const row = rows[0];
    const intent = row.value;
    if (intent.transactionId !== SOURCE_TRANSACTION_ID
        || intent.status !== "COMMITTED"
        || intent.terminal !== true
        || intent.sendCount !== 1
        || intent.sameIntentRetry !== false
        || intent.sendBoundaryState !== "SEND_MOEGLICH_ODER_VERSUCHT"
        || intent.actionContractId !== "AL-ACTION-COMPOUND"
        || intent.recoveryContractId !== "AL-RECOVERY-COMPOUND"
        || intent.verifierId !== "AL-VERIFIER-COMPOUND"
        || intent.publicFunction !== "compound"
        || intent.outcome?.classification !== "COMMITTED_SUCCESS") {
      throw new Error("PR20_8_COMPOUND_5M_SOURCE_INTENT_DRIFT");
    }
    const indexes = intent.candidate?.indexes;
    if (!Array.isArray(indexes)
        || indexes.length !== 3
        || indexes[0] !== 1
        || indexes[1] !== 22
        || indexes[2] !== 23
        || intent.candidate?.name !== "hpamulet"
        || Number(intent.candidate?.level || 0) !== 0
        || intent.scroll?.name !== SCROLL_NAME
        || intent.scroll?.index !== SCROLL_INDEX
        || intent.scroll?.observedQuantity !== 20
        || intent.scroll?.consumeQuantity !== 1) {
      throw new Error("PR20_8_COMPOUND_5M_SOURCE_SCOPE_DRIFT");
    }
    return row;
  }

  function sourceAuthorityGuard() {
    const key = SOURCE_AUTHORITY_PREFIX + SOURCE_TRANSACTION_ID;
    const authority = readJson(key);
    if (!authority
        || authority.transactionId !== SOURCE_TRANSACTION_ID
        || authority.testId !== SOURCE_TEST_ID
        || authority.authorityClass !== "Pr208CompoundOneShotAuthority"
        || authority.maximumUses !== 1
        || authority.uses !== 1
        || authority.consumed !== true
        || authority.revoked === true
        || authority.sameIntentRetry !== false) {
      throw new Error("PR20_8_COMPOUND_5M_SOURCE_AUTHORITY_DRIFT");
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
      throw new Error("PR20_8_COMPOUND_5M_SOURCE_FENCE_NOCH_AKTIV");
    }
    return {
      intentKey: intentRow.key,
      transactionId: intentRow.value.transactionId,
      intentStatus: intentRow.value.status,
      terminal: intentRow.value.terminal,
      sendCount: intentRow.value.sendCount,
      reconciliation: intentRow.value.outcome.classification,
      authorityConsumed: authority.consumed,
      authorityUses: authority.uses,
      authorityMaximumUses: authority.maximumUses,
      activeSourceFences: activeFences
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
          if (typeof empty.playing === "function" && empty.playing() === true) {
            playing = true;
          }
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
      throw new Error("PR20_8_COMPOUND_5M_PERFORMANCE_TRICK_FEHLT");
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
        "PR20_8_COMPOUND_5M_PERFORMANCE_TRICK_NICHT_AKTIV" +
        (lastError ? ":" + lastError : "")
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
    state = {
      ...state,
      ...patch,
      updatedAtMs: Date.now()
    };
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
          base = typeof existing.status === "function"
            ? existing.status() || {}
            : {};
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
      throw new Error("PR20_8_COMPOUND_5M_DUPLIKAT_INSTANZ_AKTIV");
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

  function progressBaseline() {
    return {
      transactionId: SOURCE_TRANSACTION_ID,
      resultItem: {index: RESULT_ITEM_INDEX, name: RESULT_ITEM_NAME, level: RESULT_ITEM_LEVEL},
      consumedInputIndexes: [...CONSUMED_INPUT_INDEXES],
      scroll: {index: SCROLL_INDEX, name: SCROLL_NAME, quantity: SCROLL_QUANTITY},
      sourceSendCount: 1
    };
  }

  function initialProgress(now) {
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
      baseline: progressBaseline(),
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
      && value.baseline?.resultItem?.index === RESULT_ITEM_INDEX
      && value.baseline?.resultItem?.name === RESULT_ITEM_NAME
      && value.baseline?.resultItem?.level === RESULT_ITEM_LEVEL
      && Array.isArray(value.baseline?.consumedInputIndexes)
      && value.baseline.consumedInputIndexes.length === 2
      && value.baseline.consumedInputIndexes[0] === 22
      && value.baseline.consumedInputIndexes[1] === 23
      && value.baseline?.scroll?.index === SCROLL_INDEX
      && value.baseline?.scroll?.name === SCROLL_NAME
      && value.baseline?.scroll?.quantity === SCROLL_QUANTITY;
  }

  function validPreviousTerminalProgress(value) {
    const durationMs = Math.max(
      0,
      Number(value?.lastObservedAtMs || 0) - Number(value?.soakStartedAtMs || 0)
    );
    return value
      && value.schemaVersion === 1
      && value.testId === TEST_ID
      && value.version === PREVIOUS_VERSION
      && value.transactionId === SOURCE_TRANSACTION_ID
      && value.status === "BESTANDEN"
      && value.terminal === true
      && Number(value.samples) >= SOAK_SAMPLES
      && durationMs >= SOAK_MIN_DURATION_MS
      && value.baseline?.sourceSendCount === 1
      && value.baseline?.resultItem?.index === RESULT_ITEM_INDEX
      && value.baseline?.resultItem?.name === RESULT_ITEM_NAME
      && value.baseline?.resultItem?.level === RESULT_ITEM_LEVEL
      && Array.isArray(value.baseline?.consumedInputIndexes)
      && value.baseline.consumedInputIndexes.length === 2
      && value.baseline.consumedInputIndexes[0] === 22
      && value.baseline.consumedInputIndexes[1] === 23
      && value.baseline?.scroll?.index === SCROLL_INDEX
      && value.baseline?.scroll?.name === SCROLL_NAME
      && value.baseline?.scroll?.quantity === SCROLL_QUANTITY
      && value.evidence?.status === "BESTANDEN"
      && value.evidence?.compoundLive5mTested === true
      && value.evidence?.sourceSendCount === 1
      && value.evidence?.sameIntentRetry === false
      && value.evidence?.noResendPathPresent === true
      && value.evidence?.normalRuntimeAllowed === false
      && value.evidence?.additionalMutationCounters?.gameplayWrites === 0
      && value.evidence?.additionalMutationCounters?.publicFunctionCalls === 0
      && value.evidence?.additionalMutationCounters?.rawWriteCalls === 0;
  }

  function loadOrStartProgress() {
    const now = Date.now();
    const existing = readJson(PROGRESS_KEY);
    if (!existing) return writeJsonExact(PROGRESS_KEY, initialProgress(now));
    if (validPreviousTerminalProgress(existing)) {
      return writeJsonExact(PROGRESS_KEY, {
        ...existing,
        version: VERSION,
        telemetryIdentityRecoveredFromVersion: PREVIOUS_VERSION
      });
    }
    if (!validProgress(existing)) {
      throw new Error("PR20_8_COMPOUND_5M_PROGRESS_DRIFT");
    }
    if (existing.terminal === true && existing.status === "BESTANDEN") {
      return existing;
    }
    const gap = Math.max(0, now - Number(existing.lastObservedAtMs || 0));
    if (gap > MAX_CONTINUATION_GAP_MS) {
      return writeJsonExact(PROGRESS_KEY, {
        ...initialProgress(now),
        restartCount: Number(existing.restartCount || 0) + 1
      });
    }
    return writeJsonExact(PROGRESS_KEY, {
      ...existing,
      restartCount: Number(existing.restartCount || 0) + 1,
      lastObservedAtMs: now
    });
  }

  function terminalEvidence(progress, sourceGuard, postcondition, performance) {
    const durationMs = Math.max(
      0,
      Number(progress.lastObservedAtMs) - Number(progress.soakStartedAtMs)
    );
    return {
      evidenceArt: "V5_PR20_8_COMPOUND_LIVE_5M_POSTCOMMIT",
      status: "BESTANDEN",
      continuationOfRatifiedMutation: true,
      sourceTestId: SOURCE_TEST_ID,
      sourceTransactionId: SOURCE_TRANSACTION_ID,
      sourceIntentStatus: sourceGuard.intentStatus,
      sourceIntentTerminal: sourceGuard.terminal,
      sourceSendCount: sourceGuard.sendCount,
      sourceReconciliation: sourceGuard.reconciliation,
      sourceAuthorityConsumed: sourceGuard.authorityConsumed,
      sourceAuthorityUses: sourceGuard.authorityUses,
      sourceAuthorityMaximumUses: sourceGuard.authorityMaximumUses,
      sourceActiveFences: sourceGuard.activeSourceFences,
      historicalMutationCounters: {
        gameplayWrites: 1,
        publicFunctionCalls: 1,
        rawWriteCalls: 0
      },
      additionalMutationCounters: {
        gameplayWrites: 0,
        publicFunctionCalls: 0,
        rawWriteCalls: 0
      },
      sameIntentRetry: false,
      noResendPathPresent: true,
      postcondition,
      performanceTrick: performance,
      soak: {
        status: "BESTANDEN",
        samples: progress.samples,
        minimumSamples: SOAK_SAMPLES,
        intervalMs: SOAK_INTERVAL_MS,
        durationMs,
        minimumDurationMs: SOAK_MIN_DURATION_MS,
        restartCount: progress.restartCount
      },
      compoundLive5mTested: true,
      exchangeRatified: false,
      exchangeAutonomyProductiveProven: false,
      mayAdvanceToPr20_9: false,
      normalRuntimeAllowed: false
    };
  }

  function installTerminal(progress) {
    const evidence = progress.evidence;
    setState({
      startedAtMs: Number(progress.soakStartedAtMs),
      status: "BESTANDEN",
      phase: "COMPLETE",
      terminal: true,
      blocker: [],
      evidence,
      intents: [{
        transactionId: SOURCE_TRANSACTION_ID,
        status: "COMMITTED",
        sendCount: 1
      }],
      soak: evidence?.soak || state.soak
    });
    emit("PR20_8_COMPOUND_5M_TERMINAL_RECOVERED", "info", {
      transactionId: SOURCE_TRANSACTION_ID,
      samples: evidence?.soak?.samples || progress.samples
    });
    return state;
  }

  function fail(error, phase = "ERROR") {
    const blocker = text(error?.message || error, 500) || "PR20_8_COMPOUND_5M_UNBEKANNTER_FEHLER";
    setState({
      status: "BLOCKIERT",
      phase,
      terminal: true,
      blocker: [blocker],
      gameplayWrites: 0,
      publicFunctionCalls: 0,
      rawWriteCalls: 0,
      additionalGameplayWrites: 0,
      additionalPublicFunctionCalls: 0,
      additionalRawWriteCalls: 0,
      sameIntentRetry: false,
      normalRuntimeAllowed: false
    });
    emit("PR20_8_COMPOUND_5M_BLOCKIERT", "error", {blocker});
    return state;
  }

  async function run() {
    publishTelemetryFacades();
    let lease = null;
    try {
      lease = acquireRuntimeLease();
      const performance = await ensurePerformanceTrick();
      let sourceGuard = exactSourceGuard();
      let postcondition = exactPostcondition();
      if (!postcondition.stable) {
        throw new Error("PR20_8_COMPOUND_5M_POSTCONDITION_DRIFT_VOR_START");
      }

      let progress = loadOrStartProgress();
      if (progress.terminal === true && progress.status === "BESTANDEN") {
        releaseRuntimeLease(lease);
        return installTerminal(progress);
      }

      setState({
        startedAtMs: Number(progress.soakStartedAtMs),
        status: "SOAK",
        phase: "FIVE_MINUTE_POSTCOMMIT_SOAK",
        terminal: false,
        blocker: [],
        intents: [{
          transactionId: SOURCE_TRANSACTION_ID,
          status: "COMMITTED",
          sendCount: 1
        }],
        soak: {
          samples: progress.samples,
          minimumSamples: SOAK_SAMPLES,
          intervalMs: SOAK_INTERVAL_MS,
          minimumDurationMs: SOAK_MIN_DURATION_MS,
          startedAtMs: progress.soakStartedAtMs,
          restartCount: progress.restartCount
        }
      });
      emit("PR20_8_COMPOUND_5M_SOAK_STARTED", "info", {
        transactionId: SOURCE_TRANSACTION_ID,
        samples: progress.samples,
        restartCount: progress.restartCount
      });

      while (progress.samples < SOAK_SAMPLES) {
        await sleep(SOAK_INTERVAL_MS);
        sourceGuard = exactSourceGuard();
        postcondition = exactPostcondition();
        if (!postcondition.stable) {
          throw new Error("PR20_8_COMPOUND_5M_POSTCONDITION_DRIFT");
        }
        if (sourceGuard.sendCount !== 1
            || sourceGuard.intentStatus !== "COMMITTED"
            || sourceGuard.reconciliation !== "COMMITTED_SUCCESS"
            || sourceGuard.authorityConsumed !== true
            || sourceGuard.authorityUses !== 1
            || sourceGuard.activeSourceFences !== 0) {
          throw new Error("PR20_8_COMPOUND_5M_DUPLIKAT_ODER_SOURCE_DRIFT");
        }
        progress = writeJsonExact(PROGRESS_KEY, {
          ...progress,
          status: "SOAK",
          terminal: false,
          samples: Number(progress.samples) + 1,
          lastObservedAtMs: Date.now()
        });
        setState({
          soak: {
            ...state.soak,
            samples: progress.samples,
            startedAtMs: progress.soakStartedAtMs,
            restartCount: progress.restartCount
          }
        });
        emit("PR20_8_COMPOUND_5M_SAMPLE", "info", {
          sample: progress.samples,
          sendCount: sourceGuard.sendCount,
          additionalGameplayWrites: 0,
          additionalPublicFunctionCalls: 0,
          additionalRawWriteCalls: 0
        });
      }

      const durationMs = Math.max(
        0,
        Number(progress.lastObservedAtMs) - Number(progress.soakStartedAtMs)
      );
      if (durationMs < SOAK_MIN_DURATION_MS) {
        throw new Error("PR20_8_COMPOUND_5M_DAUER_ZU_KURZ:" + durationMs);
      }

      sourceGuard = exactSourceGuard();
      postcondition = exactPostcondition();
      if (!postcondition.stable || sourceGuard.sendCount !== 1) {
        throw new Error("PR20_8_COMPOUND_5M_FINALER_DRIFT");
      }
      const evidence = terminalEvidence(progress, sourceGuard, postcondition, performance);
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
        intents: [{
          transactionId: SOURCE_TRANSACTION_ID,
          status: "COMMITTED",
          sendCount: 1
        }],
        soak: evidence.soak
      });
      emit("PR20_8_COMPOUND_5M_COMPLETE", "info", {
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