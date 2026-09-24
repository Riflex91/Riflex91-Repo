import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";

const source = fs.readFileSync(
  "werkzeuge/pr20-7-gear-occupied-slot-live-5m.js",
  "utf8",
);

function storageFake(initial = new Map()) {
  const data = initial;
  return {
    setItem(key, value) { data.set(String(key), String(value)); },
    getItem(key) { return data.has(String(key)) ? data.get(String(key)) : null; },
    removeItem(key) { data.delete(String(key)); },
    key(index) { return [...data.keys()][index] ?? null; },
    get length() { return data.size; },
    data,
  };
}

function makeFakeClock(start = 1_000_000) {
  let now = start;
  class FakeDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [now]));
    }
    static now() { return now; }
  }
  const setTimeoutFake = (fn, ms = 0) => {
    now += Number(ms) || 0;
    queueMicrotask(fn);
    return 1;
  };
  return { FakeDate, setTimeoutFake, now: () => now };
}

function context({
  classList = null,
  requiredLevel = 0,
  storage = storageFake(),
  swapped = false,
} = {}) {
  const clock = makeFakeClock();
  let equipCalls = 0;
  const wcap = { name: "wcap", level: 4 };
  const partyhat = { name: "partyhat", level: 5 };
  const sandbox = {
    console,
    crypto: webcrypto,
    TextEncoder,
    Uint8Array,
    JSON,
    Object,
    Array,
    Number,
    String,
    Boolean,
    Promise,
    Map,
    Math,
    Date: clock.FakeDate,
    setTimeout: clock.setTimeoutFake,
    clearTimeout() {},
    localStorage: storage,
    user_id: "account-1",
    server_region: "EU",
    server_identifier: "I",
    entities: {},
    G: {
      items: {
        wcap: {
          type: "helmet",
          ...(classList ? { class: classList } : {}),
          ...(requiredLevel ? { level: requiredLevel } : {}),
        },
        partyhat: { type: "helmet" },
      },
    },
    character: {
      name: "My_Merchant",
      id: "merchant-session-1",
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
        swapped ? partyhat : wcap,
      ],
      slots: {
        cape: null,
        belt: null,
        amulet: null,
        orb: null,
        helmet: swapped ? wcap : partyhat,
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
    async equip(index, slot) {
      equipCalls += 1;
      const existing = sandbox.character.slots[slot] ?? null;
      sandbox.character.slots[slot] = sandbox.character.items[index];
      sandbox.character.items[index] = existing;
      return true;
    },
  };
  sandbox.parent = sandbox;
  sandbox.globalThis = sandbox;
  return { sandbox, storage, equipCalls: () => equipCalls, clock };
}

async function execute(env) {
  vm.createContext(env.sandbox);
  vm.runInContext(source, env.sandbox, {
    filename: "pr20-7-gear-occupied-slot-live-5m.js",
  });
  for (let i = 0; i < 300; i += 1) {
    await Promise.resolve();
    const api = env.sandbox.V5PR207GearOccupiedLiveTest;
    if (api?.status()?.terminal === true) return api.status();
  }
  throw new Error("TEST_DID_NOT_REACH_TERMINAL_STATE");
}

test("PR20.7 occupied-slot live performs exactly one pinned equip and 5m soak", async () => {
  const env = context();
  const state = await execute(env);

  assert.equal(state.status, "BESTANDEN");
  assert.equal(state.phase, "COMPLETE");
  assert.equal(state.terminal, true);
  assert.equal(env.equipCalls(), 1);
  assert.equal(state.gameplayWrites, 1);
  assert.equal(state.publicFunctionCalls, 1);
  assert.equal(state.rawWriteCalls, 0);
  assert.equal(state.sameIntentRetry, false);
  assert.equal(state.startCalls, 0);
  assert.equal(state.disconnectCalls, 0);
  assert.equal(state.farmerWorkersInstalled, 0);
  assert.equal(state.normalRuntimeAllowed, false);

  const evidence = state.evidence;
  assert.equal(evidence.status, "BESTANDEN");
  assert.equal(evidence.candidate.slot, "helmet");
  assert.equal(evidence.candidate.inventoryIndex, 7);
  assert.equal(evidence.candidate.name, "wcap");
  assert.equal(evidence.candidate.level, 4);
  assert.equal(evidence.previousSlotItem.name, "partyhat");
  assert.equal(evidence.previousSlotItem.level, 5);
  assert.equal(evidence.durableIntentReadback, true);
  assert.equal(evidence.reconciliation, "COMMITTED");
  assert.equal(evidence.settlement, "BESTAETIGT");
  assert.equal(evidence.oneShotAuthority.maximumUses, 1);
  assert.equal(evidence.oneShotAuthority.consumed, true);
  assert.equal(evidence.oneShotAuthority.equipmentInventoryFenceClaims, true);
  assert.equal(evidence.soak.status, "BESTANDEN");
  assert.equal(evidence.soak.samples, 60);
  assert.ok(evidence.soak.durationMs >= 299_000);
  assert.equal(evidence.performanceTrick.active, true);

  const intents = [...env.storage.data.entries()]
    .filter(([key]) => key.includes(":intent:"))
    .map(([, value]) => JSON.parse(value));
  assert.equal(intents.length, 1);
  assert.equal(intents[0].completionStatus, "BESTANDEN");
  assert.equal(intents[0].possibleSend, true);
  assert.equal(intents[0].gameplayWrites, 1);
  assert.equal(intents[0].sameIntentRetry, false);
  assert.equal(intents[0].completionEvidence.soak.samples, 60);
});

test("PR20.7 occupied-slot live fails closed on class or level incompatibility", async () => {
  for (const options of [
    { classList: ["warrior"] },
    { requiredLevel: 99 },
  ]) {
    const env = context(options);
    const state = await execute(env);
    assert.equal(state.status, "BLOCKIERT");
    assert.ok(state.blocker.includes(
      "PR20_7_GEAR_KEIN_KOMPATIBLER_BELEGTER_SLOT_KANDIDAT",
    ));
    assert.equal(env.equipCalls(), 0);
    assert.equal(state.gameplayWrites, 0);
    assert.equal(state.publicFunctionCalls, 0);
  }
});

test("PR20.7 restart reconciles a possible prior send and never resends", async () => {
  const first = context();
  const firstState = await execute(first);
  assert.equal(firstState.status, "BESTANDEN");
  assert.equal(first.equipCalls(), 1);

  const intentEntry = [...first.storage.data.entries()]
    .find(([key]) => key.includes(":intent:"));
  assert.ok(intentEntry);
  const [intentKey, encoded] = intentEntry;
  const interrupted = JSON.parse(encoded);
  delete interrupted.completionStatus;
  delete interrupted.completionEvidence;
  delete interrupted.soak;
  interrupted.terminal = false;
  first.storage.setItem(intentKey, JSON.stringify(interrupted));

  const restarted = context({
    storage: first.storage,
    swapped: true,
  });
  const recovered = await execute(restarted);

  assert.equal(restarted.equipCalls(), 0);
  assert.equal(recovered.status, "BESTANDEN");
  assert.equal(recovered.evidence.restartRecovered, true);
  assert.equal(recovered.evidence.resendAttempted, false);
  assert.equal(recovered.evidence.reconciliation, "COMMITTED");
  assert.equal(recovered.evidence.soak.samples, 60);
  assert.ok(recovered.evidence.soak.durationMs >= 299_000);
  assert.equal(recovered.sameIntentRetry, false);
});

test("PR20.7 restart with unchanged prestate blocks without retry", async () => {
  const storage = storageFake();
  const env = context({ storage });
  const candidateMaterial = JSON.stringify({ level: 4, name: "wcap" });
  const previousMaterial = JSON.stringify({ level: 5, name: "partyhat" });
  const restEquipmentMaterial = JSON.stringify([
    ["cape", null], ["belt", null], ["amulet", null], ["orb", null],
    ["gloves", null], ["shoes", null], ["pants", null], ["chest", null],
  ]);
  const key = "v5:pr20-7-gear-occupied-slot-live-5m:intent:test";
  storage.setItem(key, JSON.stringify({
    schemaVersion: 1,
    testId: "pr20-7-gear-occupied-slot-live-5m",
    version: "1.0.0",
    recipient: {
      account: "account-1",
      characterName: "My_Merchant",
      sessionId: "merchant-session-1",
      serverRegion: "EU",
      serverIdentifier: "I",
    },
    slot: "helmet",
    inventoryIndex: 7,
    candidateFingerprintMaterial: candidateMaterial,
    previousFingerprintMaterial: previousMaterial,
    restInventoryMaterial: "[]",
    restEquipmentMaterial,
    possibleSend: true,
    gameplayWrites: 1,
    publicFunctionCalls: 1,
    sameIntentRetry: false,
  }));

  const state = await execute(env);
  assert.equal(env.equipCalls(), 0);
  assert.equal(state.status, "BLOCKIERT");
  assert.ok(state.blocker.includes("PR20_7_GEAR_RESTART_NOT_APPLIED"));
  assert.equal(state.evidence.resendAttempted, false);
  assert.equal(state.sameIntentRetry, false);
});

test("PR20.7 live package exposes exactly one public equip send and no bypass", () => {
  assert.equal((source.match(/r\.equip\(/g) || []).length, 1);
  for (const forbidden of [
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
  assert.ok(source.includes('candidateName: "wcap"'));
  assert.ok(source.includes('slot: "helmet"'));
  assert.ok(source.includes("sameIntentRetry:false"));
  assert.ok(source.includes("normalRuntimeAllowed:false"));
});
