(() => {
  "use strict";

  const TEST_ID = "pr20-8-exchange-anniversarygift-service-mount";
  const VERSION = "1.0.0";
  const API_NAME = "V5PR208ExchangeAnniversarygiftServiceMount";
  const EXPECTED_CHARACTER = "My_Merchant";
  const EXPECTED_CLASS = "merchant";
  const EXPECTED_SERVER_REGION = "EU";
  const EXPECTED_SERVER_IDENTIFIER = "I";
  const TARGET = "exchange";
  const TARGET_POINT = Object.freeze({ map: "main", x: -25, y: -478 });
  const SOURCE_COMMIT = "90052162eb3ebda36c893e1eb4af643913c8f984";
  const SOURCE_MAPS_BLOB = "78350dac1a18c4eb0e7c6f545ebf08bb3d6729e4";
  const SOURCE_PINNED_SELL_DISTANCE = 400;
  const SAFETY_DISTANCE = 300;
  const POLL_MS = 250;
  const MOVE_TIMEOUT_MS = 120000;
  const INTENT_KEY = "v5:" + TEST_ID + ":intent:exchange-service";

  const events = [];
  let seq = 0;
  let runPromise = null;
  let recoveryTimer = null;

  let state = {
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    phase: "PR20_8_EXCHANGE_ANNIVERSARYGIFT_SERVICE_MOUNT",
    status: "BOOT",
    terminal: false,
    blocker: [],
    startedAtMs: Date.now(),
    updatedAtMs: Date.now(),
    recipient: null,
    target: TARGET,
    targetPoint: TARGET_POINT,
    sourceCommit: SOURCE_COMMIT,
    sourceMapsBlob: SOURCE_MAPS_BLOB,
    movementIssued: false,
    movementCompleted: false,
    movementError: null,
    recoveredExistingIntent: false,
    durableIntentReadback: false,
    sendBoundaryState: "NICHT_GESENDET",
    sendCount: 0,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    sameIntentRetry: false,
    exchangeAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
    nextAction: null
  };

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const text = (value, max = 240) =>
    String(value == null ? "" : value).trim().slice(0, max);

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
    throw new Error("PR20_8_EXCHANGE_SERVICE_MOUNT_SPIELKONTEXT_FEHLT");
  }

  function storage() {
    for (const candidate of roots()) {
      try {
        if (candidate?.localStorage
            && typeof candidate.localStorage.getItem === "function"
            && typeof candidate.localStorage.setItem === "function") {
          return candidate.localStorage;
        }
      } catch {}
    }
    throw new Error("PR20_8_EXCHANGE_SERVICE_MOUNT_DURABLE_STORAGE_FEHLT");
  }

  function readIntent() {
    const raw = storage().getItem(INTENT_KEY);
    if (raw === null) return null;
    try { return JSON.parse(raw); }
    catch { throw new Error("PR20_8_EXCHANGE_SERVICE_MOUNT_INTENT_BESCHAEDIGT"); }
  }

  function writeIntent(value) {
    const encoded = JSON.stringify(value);
    storage().setItem(INTENT_KEY, encoded);
    const readback = storage().getItem(INTENT_KEY);
    if (readback !== encoded) {
      throw new Error("PR20_8_EXCHANGE_SERVICE_MOUNT_DURABLE_READBACK_MISMATCH");
    }
    return JSON.parse(readback);
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

  function runtimeConflict(r) {
    try {
      const v3 = r.AIO_V3?.__runtime;
      const s = v3 && typeof v3.status === "function" ? v3.status() : null;
      if (v3 && (v3.timer || s?.running === true)) return "AIO_V3_RUNTIME_ACTIVE";
    } catch { return "AIO_V3_RUNTIME_UNREADABLE"; }
    try {
      const v4 = r.AIO_V4 || r.V4Runtime;
      const s = v4 && typeof v4.status === "function" ? v4.status() : null;
      if (s?.running === true || s?.aktivFreigegeben === true) {
        return "V4_RUNTIME_ACTIVE";
      }
    } catch { return "V4_RUNTIME_UNREADABLE"; }
    return null;
  }

  function distanceToService(c) {
    if (text(c.map, 96) !== TARGET_POINT.map) return Number.POSITIVE_INFINITY;
    const x = Number(c.real_x ?? c.x);
    const y = Number(c.real_y ?? c.y);
    if (![x, y].every(Number.isFinite)) return Number.POSITIVE_INFINITY;
    return Math.hypot(x - TARGET_POINT.x, y - TARGET_POINT.y);
  }

  function serviceReady(c) {
    const d = distanceToService(c);
    return Number.isFinite(d) && d <= SAFETY_DISTANCE;
  }

  function recipientSnapshot(r) {
    const c = r.character;
    const server = serverBinding(r);
    return {
      characterName: text(c.name, 192),
      sessionId: text(c.id, 192),
      ctype: text(c.ctype || c.type, 32).toLowerCase(),
      map: text(c.map, 96),
      x: Number(c.real_x ?? c.x),
      y: Number(c.real_y ?? c.y),
      serverRegion: server.region,
      serverIdentifier: server.identifier,
      distanceToExchange: distanceToService(c)
    };
  }

  function strictPreflight(r) {
    const c = r.character;
    const recipient = recipientSnapshot(r);
    if (recipient.characterName !== EXPECTED_CHARACTER) {
      throw new Error("PR20_8_EXCHANGE_SERVICE_MOUNT_EXAKTER_MERCHANT_ERFORDERLICH");
    }
    if (recipient.sessionId !== EXPECTED_CHARACTER) {
      throw new Error("PR20_8_EXCHANGE_SERVICE_MOUNT_SESSION_DRIFT");
    }
    if (recipient.ctype !== EXPECTED_CLASS) {
      throw new Error("PR20_8_EXCHANGE_SERVICE_MOUNT_MERCHANT_KLASSE_ERFORDERLICH");
    }
    if (recipient.serverRegion !== EXPECTED_SERVER_REGION
        || recipient.serverIdentifier !== EXPECTED_SERVER_IDENTIFIER) {
      throw new Error("PR20_8_EXCHANGE_SERVICE_MOUNT_SERVER_BINDUNG_DRIFT");
    }
    if (c.rip === true || c.dead === true) {
      throw new Error("PR20_8_EXCHANGE_SERVICE_MOUNT_CHARACTER_TOT");
    }
    if (c.moving === true) {
      throw new Error("PR20_8_EXCHANGE_SERVICE_MOUNT_CHARACTER_BEWEGT_SICH");
    }
    if (c.target !== null && c.target !== undefined && text(c.target, 192)) {
      throw new Error("PR20_8_EXCHANGE_SERVICE_MOUNT_CHARACTER_HAT_ZIEL");
    }
    if (c.q && typeof c.q === "object" && Object.keys(c.q).length > 0) {
      throw new Error("PR20_8_EXCHANGE_SERVICE_MOUNT_Q_NICHT_FREI");
    }
    const conflict = runtimeConflict(r);
    if (conflict) {
      throw new Error("PR20_8_EXCHANGE_SERVICE_MOUNT_ALTERNATIVE_RUNTIME_AKTIV:" + conflict);
    }
    const sellDistance = Number(r.B?.sell_dist);
    if (Number.isFinite(sellDistance)
        && sellDistance > 0
        && sellDistance !== SOURCE_PINNED_SELL_DISTANCE) {
      throw new Error("PR20_8_EXCHANGE_SERVICE_MOUNT_SELL_DIST_DRIFT");
    }
    return recipient;
  }

  function findSmartMove() {
    for (const owner of roots()) {
      try {
        if (typeof owner?.smart_move === "function") {
          return owner.smart_move.bind(owner);
        }
      } catch {}
    }
    return null;
  }

  function emit(type, severity, data = {}) {
    seq += 1;
    events.push({
      seq,
      ts: new Date().toISOString(),
      event: type,
      type,
      severity,
      component: "v5-pr20-8-exchange-anniversarygift-service-mount",
      reason: data.reason || null,
      data
    });
    if (events.length > 1000) events.splice(0, events.length - 1000);
  }

  function installTelemetryFacade(owner) {
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
        return { ...base, v5AutonomousTest: state };
      },
      telemetry: (limit = 1000) =>
        events.slice(-Math.max(1, Math.min(1000, Number(limit) || 1000))),
      peekTelemetry: (limit = 1000) =>
        events.slice(-Math.max(1, Math.min(1000, Number(limit) || 1000)))
    };
  }

  function publish() {
    state = { ...state, updatedAtMs: Date.now() };
    const r = root();
    installTelemetryFacade(r);
    if (globalThis !== r) installTelemetryFacade(globalThis);
    try {
      const p = globalThis.parent;
      if (p && p !== globalThis && p !== r) installTelemetryFacade(p);
    } catch {}
  }

  function finish(status, blocker = [], extra = {}) {
    state = {
      ...state,
      ...extra,
      status,
      phase: "COMPLETE",
      terminal: true,
      blocker,
      exchangeAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      normalRuntimeAllowed: false,
      updatedAtMs: Date.now()
    };
    publish();
    emit("PR20_8_EXCHANGE_SERVICE_MOUNT_TERMINAL",
      status === "BESTANDEN" ? "info" : "warning",
      { status, blocker });
    return state;
  }

  function validateIntent(intent) {
    return intent
      && intent.schemaVersion === 1
      && intent.testId === TEST_ID
      && intent.version === VERSION
      && intent.target === TARGET
      && intent.sourceCommit === SOURCE_COMMIT
      && intent.sourceMapsBlob === SOURCE_MAPS_BLOB
      && Number.isInteger(intent.sendCount)
      && intent.sendCount >= 0
      && intent.sendCount <= 1
      && intent.sameIntentRetry === false;
  }

  async function recover(intent) {
    if (!validateIntent(intent)) {
      throw new Error("PR20_8_EXCHANGE_SERVICE_MOUNT_EXISTING_INTENT_UNGUELTIG");
    }
    const r = root();
    const c = r.character;
    const recipient = recipientSnapshot(r);
    state = {
      ...state,
      recipient,
      recoveredExistingIntent: true,
      durableIntentReadback: true,
      movementIssued: intent.sendCount === 1,
      sendBoundaryState: intent.sendBoundaryState,
      sendCount: intent.sendCount,
      gameplayWrites: intent.sendCount === 1 ? 1 : 0,
      publicFunctionCalls: intent.sendCount === 1 ? 1 : 0,
      rawWriteCalls: 0
    };
    publish();

    if (serviceReady(c)) {
      return finish("BESTANDEN", [], {
        movementCompleted: true,
        nextAction: "RESTORE_ANNIVERSARYGIFT_PRODUCTIVE_ONE_WRITE_MANIFEST",
        recipient: recipientSnapshot(r)
      });
    }

    if (intent.sendCount === 0) {
      return finish("BLOCKIERT", [
        "PR20_8_EXCHANGE_SERVICE_MOUNT_DURABLE_INTENT_OHNE_SEND_RECORD"
      ], {
        nextAction: "REMAIN_BLOCKED_NO_RETRY",
        recipient
      });
    }

    if (c.moving === true) {
      state = {
        ...state,
        phase: "RECOVERY_PENDING",
        status: "RECOVERY_PENDING",
        terminal: false,
        blocker: ["PR20_8_EXCHANGE_SERVICE_MOUNT_MOVEMENT_IN_FLIGHT_NO_RETRY"],
        nextAction: "RECONCILE_EXISTING_MOVEMENT_NO_RETRY"
      };
      publish();
      if (recoveryTimer === null) {
        recoveryTimer = setTimeout(async () => {
          recoveryTimer = null;
          try { await recover(readIntent()); }
          catch (error) { fail(error); }
        }, 1000);
      }
      return state;
    }

    return finish("BLOCKIERT", [
      "PR20_8_EXCHANGE_SERVICE_MOUNT_MOVEMENT_OUTCOME_UNGEKLAERT_NO_RETRY"
    ], {
      movementError: intent.movementError || null,
      nextAction: "RECONCILE_MOVEMENT_MANUALLY_NO_RETRY",
      recipient
    });
  }

  async function freshRun() {
    const r = root();
    const c = r.character;
    const recipient = strictPreflight(r);
    state = { ...state, recipient };
    publish();

    if (serviceReady(c)) {
      return finish("BESTANDEN", [], {
        movementCompleted: true,
        nextAction: "RESTORE_ANNIVERSARYGIFT_PRODUCTIVE_ONE_WRITE_MANIFEST",
        recipient: recipientSnapshot(r)
      });
    }

    const smartMove = findSmartMove();
    if (!smartMove) {
      return finish("BLOCKIERT", ["PR20_8_EXCHANGE_SERVICE_MOUNT_SMART_MOVE_FEHLT"], {
        nextAction: "REMAIN_BLOCKED_NO_MOVEMENT_CALL"
      });
    }

    const createdAtMs = Date.now();
    let intent = writeIntent({
      schemaVersion: 1,
      testId: TEST_ID,
      version: VERSION,
      art: "PR20_8_EXCHANGE_ANNIVERSARYGIFT_SERVICE_MOUNT_INTENT",
      target: TARGET,
      targetPoint: TARGET_POINT,
      sourceCommit: SOURCE_COMMIT,
      sourceMapsBlob: SOURCE_MAPS_BLOB,
      createdAtMs,
      updatedAtMs: createdAtMs,
      sendCount: 0,
      sendBoundaryState: "NICHT_GESENDET",
      sameIntentRetry: false,
      movementError: null
    });
    state = { ...state, durableIntentReadback: true };
    publish();

    intent = writeIntent({
      ...intent,
      updatedAtMs: Date.now(),
      sendCount: 1,
      sendBoundaryState: "SEND_MOEGLICH_ODER_VERSUCHT"
    });

    state = {
      ...state,
      movementIssued: true,
      sendCount: 1,
      sendBoundaryState: intent.sendBoundaryState,
      gameplayWrites: 1,
      publicFunctionCalls: 1,
      rawWriteCalls: 0
    };
    publish();

    let movementError = null;
    try {
      const result = smartMove(TARGET);
      if (result && typeof result.then === "function") {
        result.catch(error => {
          movementError = text(error?.message || error, 500) || "MOVE_FAILED";
          try {
            const current = readIntent();
            if (current) writeIntent({
              ...current,
              movementError,
              updatedAtMs: Date.now()
            });
          } catch {}
        });
      }
    } catch (error) {
      movementError = text(error?.message || error, 500) || "MOVE_FAILED";
      intent = writeIntent({
        ...intent,
        movementError,
        updatedAtMs: Date.now()
      });
    }

    const started = Date.now();
    while (Date.now() - started <= MOVE_TIMEOUT_MS) {
      if (serviceReady(c)) {
        intent = writeIntent({
          ...readIntent(),
          terminal: true,
          outcome: "ARRIVED_IN_SAFE_EXCHANGE_SERVICE_RANGE",
          updatedAtMs: Date.now()
        });
        return finish("BESTANDEN", [], {
          movementCompleted: true,
          movementError,
          nextAction: "RESTORE_ANNIVERSARYGIFT_PRODUCTIVE_ONE_WRITE_MANIFEST",
          recipient: recipientSnapshot(r)
        });
      }
      if (movementError && c.moving !== true) {
        return finish("BLOCKIERT", [
          "PR20_8_EXCHANGE_SERVICE_MOUNT_MOVE_FEHLER_NO_RETRY"
        ], {
          movementError,
          nextAction: "RECONCILE_MOVEMENT_MANUALLY_NO_RETRY",
          recipient: recipientSnapshot(r)
        });
      }
      await sleep(POLL_MS);
    }

    return finish("BLOCKIERT", [
      "PR20_8_EXCHANGE_SERVICE_MOUNT_TIMEOUT_NO_RETRY"
    ], {
      movementError,
      nextAction: "RECONCILE_MOVEMENT_MANUALLY_NO_RETRY",
      recipient: recipientSnapshot(r)
    });
  }

  function fail(error) {
    const message = text(error?.message || error, 500) || "UNBEKANNTER_FEHLER";
    emit("PR20_8_EXCHANGE_SERVICE_MOUNT_FEHLER", "error", { reason: message });
    state = {
      ...state,
      status: "FEHLER",
      phase: "ERROR",
      terminal: true,
      blocker: [message],
      exchangeAuthority: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      normalRuntimeAllowed: false
    };
    try { publish(); } catch {}
    return state;
  }

  async function run() {
    if (runPromise) return runPromise;
    runPromise = (async () => {
      publish();
      const existing = readIntent();
      if (existing) return recover(existing);
      return freshRun();
    })().catch(fail);
    return runPromise;
  }

  const api = Object.freeze({
    testId: TEST_ID,
    version: VERSION,
    status: () => state,
    telemetry: (limit = 200) =>
      events.slice(-Math.max(1, Math.min(1000, Number(limit) || 200))),
    start: run
  });

  Object.defineProperty(globalThis, API_NAME, {
    configurable: true,
    enumerable: true,
    writable: false,
    value: api
  });
  try {
    if (globalThis.parent && globalThis.parent !== globalThis) {
      Object.defineProperty(globalThis.parent, API_NAME, {
        configurable: true,
        enumerable: true,
        writable: false,
        value: api
      });
    }
  } catch {}

  publish();
  Promise.resolve().then(run).catch(fail);
})();
