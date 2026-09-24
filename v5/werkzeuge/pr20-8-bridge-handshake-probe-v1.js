(() => {
  "use strict";

  const TEST_ID = "pr20-8-bridge-handshake-probe-v1";
  const VERSION = "1.0.0";
  const API_NAME = "V5PR208BridgeHandshakeProbe";

  const state = Object.freeze({
    schemaVersion: 1,
    testId: TEST_ID,
    version: VERSION,
    status: "LAEUFT",
    phase: "BRIDGE_HANDSHAKE_PROBE",
    terminal: false,
    blocker: [],
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    sameIntentRetry: false,
    intents: [],
    normalRuntimeAllowed: false,
    probe: Object.freeze({
      synchronous: true,
      updaterInstall: false,
      codeSlotPersistence: false,
      gameplayMutation: false
    })
  });

  const clone = value => JSON.parse(JSON.stringify(value));

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
        status: "RUNNING",
        v5Terminal: false,
        sameIntentRetry: false,
        v5AutonomousTestStatus: state.status
      }),
      peekTelemetry: () => []
    };
  }

  const api = Object.freeze({
    testId: TEST_ID,
    version: VERSION,
    status: () => clone(state)
  });

  for (const owner of roots()) {
    installFacade(owner);
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

  globalThis[API_NAME] = api;
})();
