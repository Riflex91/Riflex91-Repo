import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";

const source = fs.readFileSync(
  "werkzeuge/pr20-7-gear-shadow-no-write-autonomous.js",
  "utf8",
);

function localStorageFake() {
  const data = new Map();
  return {
    setItem(key, value) { data.set(String(key), String(value)); },
    getItem(key) { return data.has(String(key)) ? data.get(String(key)) : null; },
    removeItem(key) { data.delete(String(key)); },
    keys() { return [...data.keys()]; },
  };
}

function context() {
  const storage = localStorageFake();
  const sandbox = {
    console,
    crypto: webcrypto,
    TextEncoder,
    Uint8Array,
    Date,
    JSON,
    Object,
    Array,
    Number,
    String,
    Boolean,
    Promise,
    Map,
    Math,
    setTimeout,
    clearTimeout,
    localStorage: storage,
    user_id: "account-1",
    server_region: "EU",
    server_identifier: "I",
    entities: {},
    G: {
      items: {
        wcap: { type: "helmet" },
        partyhat: { type: "helmet" },
      },
    },
    character: {
      name: "My_Merchant",
      id: "My_Merchant",
      owner: "account-1",
      ctype: "merchant",
      level: 58,
      map: "main",
      rip: false,
      dead: false,
      moving: false,
      target: null,
      q: {},
      items: [
        null, null, null, null, null, null, null,
        { name: "wcap", level: 4 },
      ],
      slots: {
        cape: null,
        belt: null,
        amulet: null,
        orb: null,
        helmet: { name: "partyhat", level: 5 },
        gloves: null,
        shoes: null,
        pants: null,
        chest: null,
      },
    },
    sounds: {
      empty: {
        cplaying: true,
        playing() { return true; },
      },
    },
    performance_trick() {},
  };
  sandbox.parent = sandbox;
  sandbox.globalThis = sandbox;
  return { sandbox, storage };
}

test("PR20.7 shadow executes real-state admission without gameplay writes", async () => {
  const { sandbox, storage } = context();
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, {
    filename: "pr20-7-gear-shadow-no-write-autonomous.js",
  });

  await new Promise(resolve => setTimeout(resolve, 1_400));
  const api = sandbox.V5PR207GearShadowTest;
  assert.ok(api);
  assert.equal(api.version, "1.0.0");
  assert.equal(
    api.testId,
    "pr20-7-gear-occupied-slot-shadow-no-write",
  );
  const state = api.status();
  assert.equal(state.status, "BESTANDEN");
  assert.equal(state.terminal, true);
  assert.equal(state.gameplayWrites, 0);
  assert.equal(state.rawWriteCalls, 0);
  assert.equal(state.publicFunctionCalls, 0);
  assert.equal(state.startCalls, 0);
  assert.equal(state.disconnectCalls, 0);
  assert.equal(state.farmerWorkersInstalled, 0);
  assert.equal(state.sameIntentRetry, false);
  assert.equal(state.normalRuntimeAllowed, false);
  assert.equal(state.authority.authorityIssued, false);
  assert.equal(state.authority.gameplayAuthority, false);
  assert.equal(state.authority.rawWriteAuthority, false);

  const evidence = state.evidence;
  assert.equal(
    evidence.evidenceArt,
    "V5_PR20_7_OCCUPIED_SLOT_REAL_BROWSER_SHADOW_NO_WRITE",
  );
  assert.equal(evidence.candidate.slot, "helmet");
  assert.equal(evidence.candidate.inventoryIndex, 7);
  assert.equal(evidence.shadowDurableIntentCreated, true);
  assert.equal(evidence.shadowDurableReadback, true);
  assert.equal(evidence.oneShotBindingPrepared, true);
  assert.equal(evidence.equipmentInventoryFenceClaimsPrepared, true);
  assert.equal(evidence.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(evidence.reconciliationClassification, "NOT_APPLIED");
  assert.equal(evidence.prestateFingerprintSha256,
    evidence.postIntentPrestateFingerprintSha256);
  assert.equal(evidence.browserGameplayWrites, 0);
  assert.equal(evidence.publicFunctionCalls, 0);
  assert.equal(evidence.authorityIssued, false);
  assert.equal(evidence.swapWriteRatification, false);
  assert.equal(evidence.sameIntentRetry, false);
  assert.equal(evidence.normalRuntimeAllowed, false);
  assert.equal(evidence.performanceTrick.active, true);
  assert.equal(evidence.performanceTrick.verification, "HOWLER_PLAYING_TRUE");
  assert.equal(storage.keys().length, 1);
});

test("PR20.7 shadow package statically forbids gameplay/lifecycle writes", () => {
  for (const forbidden of [
    "equip(",
    "unequip(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "use_skill(",
    "send_item(",
    "start_character(",
    "command_character(",
    "/disconnect ",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.ok(source.includes("SHADOW_DURABLE_INTENT_NO_GAMEPLAY_WRITE"));
  assert.ok(source.includes("sendBoundaryState: 'NICHT_GESENDET'"));
  assert.ok(source.includes("reconciliationClassification: 'NOT_APPLIED'"));
  assert.ok(source.includes("gameplayWrites: 0"));
  assert.ok(source.includes("rawWriteCalls: 0"));
  assert.ok(source.includes("sameIntentRetry: false"));
  assert.ok(source.includes("normalRuntimeAllowed: false"));
});
