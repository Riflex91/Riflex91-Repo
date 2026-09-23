import test from "node:test";
import assert from "node:assert/strict";
import crypto, { webcrypto } from "node:crypto";
import fs from "node:fs";
import vm from "node:vm";

const workerSource = fs.readFileSync(
  "werkzeuge/pr20-7-gear-occupied-slot-readonly-worker.js",
  "utf8",
);
const controllerSource = fs.readFileSync(
  "werkzeuge/pr20-7-gear-occupied-slot-readonly-live.js",
  "utf8",
);
const plan = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-gear-occupied-slot-readonly-test-plan.json",
  "utf8",
));

function makeStorage(onRead = null) {
  const data = new Map();
  return {
    data,
    getItem(key) {
      if (onRead) onRead(key, data);
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
  };
}

function workerSandbox({
  name = "My_Ranger1",
  ctype = "ranger",
  items = null,
  slots = null,
} = {}) {
  const store = makeStorage();
  let performanceCalls = 0;
  const sandbox = {
    console,
    Date,
    JSON,
    Object,
    String,
    Number,
    Boolean,
    Math,
    Promise,
    RegExp,
    Error,
    Array,
    Map,
    Set,
    TextEncoder,
    Uint8Array,
    crypto: webcrypto,
    localStorage: store,
    performance_trick() { performanceCalls += 1; return true; },
    sounds: { empty: { playing() { return true; } } },
    setTimeout(fn, ms) {
      return setTimeout(fn, Math.min(Number(ms) || 0, 2));
    },
    clearTimeout,
    setInterval() { return 1; },
    clearInterval() {},
    user_id: "same-account",
    server_region: "EU",
    server_identifier: "I",
    G: {
      items: {
        oldhat: { type: "helmet" },
        newhat: { type: "helmet" },
        coat: { type: "chest" },
      },
    },
    character: {
      name,
      ctype,
      id: name + "-session",
      map: "main",
      items: items ?? [
        null,
        null,
        null,
        { name: "newhat", level: 2 },
      ],
      slots: slots ?? {
        helmet: { name: "oldhat", level: 1 },
      },
    },
  };
  sandbox.parent = sandbox;
  return { sandbox, store, getPerformanceCalls: () => performanceCalls };
}

test("PR20.7 Farmer-Worker beobachtet einen eindeutigen belegten Nicht-Waffen-Swap read-only", async () => {
  const { sandbox, store, getPerformanceCalls } = workerSandbox();
  vm.runInNewContext(workerSource, sandbox, {
    filename: "pr20-7-gear-occupied-slot-readonly-worker.js",
  });
  await new Promise(resolve => setTimeout(resolve, 30));

  const status = sandbox.V5PR207GearWorker.status();
  assert.equal(status.testId, plan.testId);
  assert.equal(status.version, plan.workerVersion);
  assert.equal(status.name, "My_Ranger1");
  assert.equal(status.ctype, "ranger");
  assert.equal(status.performanceTrick, true);
  assert.equal(status.status, "WORKER");
  assert.equal(status.eligible, true);
  assert.equal(status.candidate.slot, "helmet");
  assert.equal(status.candidate.candidateIndex, 3);
  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.rawWriteCalls, 0);
  assert.equal(status.sameIntentRetry, false);
  assert.equal(getPerformanceCalls(), 1);

  const registry = JSON.parse(store.getItem(
    "AIO_V5_PR20_7_GEAR_READONLY_OBSERVATIONS_V1",
  ));
  const observation = registry.observations.My_Ranger1;
  assert.equal(observation.eligible, true);
  assert.equal(observation.candidate.slot, "helmet");
  assert.match(observation.candidate.candidate.fingerprint, /^[0-9a-f]{64}$/);
  assert.match(observation.candidate.previousSlotItem.fingerprint, /^[0-9a-f]{64}$/);
  assert.match(observation.candidate.restInventoryFingerprint, /^[0-9a-f]{64}$/);
  assert.match(observation.candidate.restEquipmentFingerprint, /^[0-9a-f]{64}$/);
  assert.match(observation.candidate.evidenceFingerprint, /^[0-9a-f]{64}$/);
});

test("PR20.7 Worker blockiert fremde Identitaet und veroeffentlicht keine Beobachtung", async () => {
  const { sandbox, store, getPerformanceCalls } = workerSandbox({
    name: "My_Ranger2",
    ctype: "ranger",
  });
  vm.runInNewContext(workerSource, sandbox);
  await new Promise(resolve => setTimeout(resolve, 10));
  const status = sandbox.V5PR207GearWorker.status();
  assert.equal(status.status, "BLOCKIERT");
  assert.equal(status.blocker, "PR20_7_WORKER_IDENTITY_NOT_ALLOWED");
  assert.equal(getPerformanceCalls(), 0);
  assert.equal(
    store.getItem("AIO_V5_PR20_7_GEAR_READONLY_OBSERVATIONS_V1"),
    null,
  );
});

test("PR20.7 Worker behandelt gesperrte oder virtuelle Altitems nicht als Swap-Kandidat", async () => {
  for (const oldItem of [
    { name: "oldhat", level: 1, l: true },
    { name: "oldhat", level: 1, b: true },
  ]) {
    const { sandbox } = workerSandbox({
      slots: { helmet: oldItem },
    });
    vm.runInNewContext(workerSource, sandbox);
    await new Promise(resolve => setTimeout(resolve, 20));
    const status = sandbox.V5PR207GearWorker.status();
    assert.equal(status.status, "WORKER");
    assert.equal(status.eligible, false);
    assert.equal(status.candidate, null);
    assert.equal(status.blocker, "PR20_7_NO_SAFE_OCCUPIED_SWAP_CANDIDATE");
  }
});

class FakeDate extends Date {
  static current = 1_800_000_000_000;
  constructor(...args) {
    super(args.length ? args[0] : FakeDate.current);
  }
  static now() {
    FakeDate.current += 1_000;
    return FakeDate.current;
  }
}

function workerObservation(name, ctype, accountKey, candidate = null) {
  return {
    schemaVersion: 1,
    testId: plan.testId,
    version: plan.workerVersion,
    name,
    ctype,
    sessionId: name + "-session",
    accountKey,
    serverRegion: "EU",
    serverIdentifier: "I",
    performanceTrick: true,
    runtimeConflict: null,
    eligible: candidate !== null,
    candidateCount: candidate ? 1 : 0,
    candidate,
    gameplayWrites: 0,
    rawWriteCalls: 0,
    sameIntentRetry: false,
    observedAtMs: FakeDate.current,
  };
}

function liveCandidate() {
  return {
    slot: "helmet",
    candidateIndex: 3,
    candidate: {
      name: "newhat",
      level: 2,
      fingerprint: "a".repeat(64),
      physicalId: "b".repeat(64),
    },
    previousSlotItem: {
      name: "oldhat",
      level: 1,
      fingerprint: "c".repeat(64),
      physicalId: "d".repeat(64),
    },
    restInventoryFingerprint: "e".repeat(64),
    restEquipmentFingerprint: "f".repeat(64),
    evidenceFingerprint: "1".repeat(64),
  };
}

async function controllerSandbox({ withCandidate = true } = {}) {
  FakeDate.current = 1_800_000_000_000;
  const accountKey = crypto.createHash("sha256")
    .update("account:same-account")
    .digest("hex");
  const observations = {
    My_Ranger1: workerObservation(
      "My_Ranger1",
      "ranger",
      accountKey,
      withCandidate ? liveCandidate() : null,
    ),
    My_Priest: workerObservation("My_Priest", "priest", accountKey, null),
    My_Mage: workerObservation("My_Mage", "mage", accountKey, null),
  };

  const store = makeStorage((key, data) => {
    if (key !== "AIO_V5_PR20_7_GEAR_READONLY_OBSERVATIONS_V1") return;
    const current = JSON.parse(data.get(key) || JSON.stringify({
      schemaVersion: 1,
      observations,
    }));
    for (const row of Object.values(current.observations)) {
      row.observedAtMs = FakeDate.current;
    }
    data.set(key, JSON.stringify(current));
  });
  store.setItem(
    "AIO_V5_PR20_7_GEAR_READONLY_OBSERVATIONS_V1",
    JSON.stringify({ schemaVersion: 1, observations }),
  );

  let performanceCalls = 0;
  const sandbox = {
    console,
    Date: FakeDate,
    JSON,
    Object,
    String,
    Number,
    Boolean,
    Math,
    Promise,
    RegExp,
    Error,
    Array,
    Map,
    Set,
    TextEncoder,
    Uint8Array,
    crypto: webcrypto,
    localStorage: store,
    performance_trick() { performanceCalls += 1; return true; },
    sounds: { empty: { playing() { return true; } } },
    setTimeout(fn, ms) {
      return setTimeout(fn, Math.min(Number(ms) || 0, 1));
    },
    clearTimeout,
    setInterval() { return 1; },
    clearInterval() {},
    user_id: "same-account",
    server_region: "EU",
    server_identifier: "I",
    character: {
      name: "My_Merchant",
      ctype: "merchant",
      id: "merchant-session",
      hp: 1000,
      max_hp: 1000,
      items: [],
      slots: {},
    },
    AIO_V3: {
      operations: {
        status() {
          return {
            v5AutonomousTest: {
              testId: "pr20-6-mluck-autonomous-live-5m",
              version: "1.0.7",
              terminal: true,
            },
          };
        },
        hostHeartbeat() { return { schemaVersion: 1, alive: true }; },
        reconciliationStatus() { return { schemaVersion: 1, status: "TERMINAL" }; },
        peekTelemetry() { return []; },
      },
    },
  };
  sandbox.parent = sandbox;
  return { sandbox, getPerformanceCalls: () => performanceCalls };
}

test("PR20.7 Koordinator besteht mit drei frischen Farmern und 60s stabilem read-only Swap-Fingerprint", async () => {
  const { sandbox, getPerformanceCalls } = await controllerSandbox();
  vm.runInNewContext(controllerSource, sandbox, {
    filename: "pr20-7-gear-occupied-slot-readonly-live.js",
  });
  await new Promise(resolve => setTimeout(resolve, 180));

  const status = sandbox.V5PR207GearReadonlyTest.status();
  assert.equal(status.status, "BESTANDEN");
  assert.equal(status.phase, "COMPLETE");
  assert.equal(status.terminal, true);
  assert.equal(status.roster.ready, true);
  assert.equal(status.preflight.status, "BESTANDEN");
  assert.equal(status.preflight.recipientClass, "ranger");
  assert.equal(status.preflight.slot, "helmet");
  assert.equal(status.soak.status, "BESTANDEN");
  assert.ok(status.soak.samples >= 12);
  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.rawWriteCalls, 0);
  assert.equal(status.sameIntentRetry, false);
  assert.deepEqual(Array.from(status.intents), []);
  assert.equal(status.normalRuntimeAllowed, false);
  assert.equal(getPerformanceCalls(), 1);
});

test("PR20.7 Koordinator blockiert bei 3/3 frischen Farmern ohne sicheren Kandidaten", async () => {
  const { sandbox } = await controllerSandbox({ withCandidate: false });
  vm.runInNewContext(controllerSource, sandbox);
  await new Promise(resolve => setTimeout(resolve, 30));
  const status = sandbox.V5PR207GearReadonlyTest.status();
  assert.equal(status.status, "BLOCKIERT");
  assert.equal(status.phase, "READONLY_PREFLIGHT");
  assert.equal(status.terminal, true);
  assert.ok(status.blocker.includes("PR20_7_NO_SAFE_OCCUPIED_SWAP_CANDIDATE"));
  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.rawWriteCalls, 0);
});

test("PR20.7 Live-Preflight und Worker enthalten keinerlei Gameplay-/Raw-Write-Aufruf", () => {
  for (const source of [workerSource, controllerSource]) {
    for (const forbidden of [
      "use_skill(",
      "equip(",
      "unequip(",
      "socket.emit(",
      ".socket.emit(",
      "api_call(",
      "send_item(",
      "send_gold(",
      "start_character(",
      "/disconnect ",
    ]) {
      assert.equal(source.includes(forbidden), false, forbidden);
    }
  }
  assert.equal(plan.authority.gameplayWrites, 0);
  assert.equal(plan.authority.rawWriteCalls, 0);
  assert.equal(plan.authority.sameIntentRetry, false);
  assert.equal(plan.authority.publicMutationCalls, 0);
  assert.equal(plan.authority.normalRuntimeAllowed, false);
  assert.equal(plan.stability.durationMs, 60000);
  assert.equal(plan.stability.minimumSamples, 12);
});
