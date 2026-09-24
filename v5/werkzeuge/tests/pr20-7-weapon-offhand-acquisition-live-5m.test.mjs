import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";

const source = fs.readFileSync(
  "werkzeuge/pr20-7-weapon-offhand-acquisition-live-5m.js",
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
  storage = storageFake(),
  purchased = false,
  existingBefore = false,
  doublehand = false,
  classCompatible = true,
  price = 4800,
} = {}) {
  const clock = makeFakeClock();
  let buyCalls = 0;
  const inventory = Array(42).fill(null);
  if (purchased || existingBefore) inventory[0] = { name: "wshield", level: 0 };
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
    server_region: "EU",
    server_identifier: "I",
    entities: {},
    B: { sell_dist: 400 },
    G: {
      items: {
        wshield: {
          type: "shield",
          g: price,
          ...(classCompatible ? {} : { class: ["warrior"] }),
        },
        staff: { type: "weapon", wtype: "staff" },
        rod: { type: "weapon", wtype: "rod" },
      },
      classes: {
        merchant: {
          offhand: { shield: {} },
          doublehand: { rod: {}, pickaxe: {}, axe: {}, basher: {} },
        },
      },
      npcs: {
        basics: {
          role: "merchant",
          name: "Gabriel",
          items: ["wshield", "helmet", "gloves"],
        },
      },
      maps: {
        main: {
          items: {
            wshield: [[0, 0]],
          },
        },
      },
    },
    character: {
      name: "My_Merchant",
      id: "My_Merchant",
      ctype: "merchant",
      level: 58,
      map: "main",
      x: 10,
      y: 0,
      rip: false,
      dead: false,
      moving: false,
      target: null,
      q: {},
      gold: purchased ? 14_488_844 : 14_493_644,
      items: inventory,
      slots: {
        mainhand: doublehand
          ? { name: "rod", level: 0 }
          : { name: "staff", level: 0 },
        offhand: null,
      },
    },
    sounds: {
      empty: {
        cplaying: true,
        playing() { return true; },
      },
    },
    performance_trick() {},
    async buy_with_gold(name, quantity) {
      buyCalls += 1;
      assert.equal(name, "wshield");
      assert.equal(quantity, 1);
      sandbox.character.gold -= 4800;
      const index = sandbox.character.items.findIndex(item => item == null);
      if (index < 0) throw new Error("NO_SLOT");
      sandbox.character.items[index] = { name: "wshield", level: 0 };
      return true;
    },
  };
  sandbox.parent = sandbox;
  sandbox.globalThis = sandbox;
  return { sandbox, storage, buyCalls: () => buyCalls, clock };
}

async function execute(env) {
  vm.createContext(env.sandbox);
  vm.runInContext(source, env.sandbox, {
    filename: "pr20-7-weapon-offhand-acquisition-live-5m.js",
  });
  for (let i = 0; i < 1500; i += 1) {
    await new Promise(resolve => setImmediate(resolve));
    const api = env.sandbox.V5PR207WeaponOffhandAcquisitionLiveTest;
    if (api?.status()?.terminal === true) return api.status();
  }
  throw new Error("TEST_DID_NOT_REACH_TERMINAL_STATE");
}

test("PR20.7 wshield live performs exactly one buy and passes 5m soak", async () => {
  const env = context();
  const state = await execute(env);

  assert.equal(state.status, "BESTANDEN");
  assert.equal(state.phase, "COMPLETE");
  assert.equal(state.terminal, true);
  assert.equal(env.buyCalls(), 1);
  assert.equal(state.gameplayWrites, 1);
  assert.equal(state.publicFunctionCalls, 1);
  assert.equal(state.rawWriteCalls, 0);
  assert.equal(state.sameIntentRetry, false);
  assert.equal(state.startCalls, 0);
  assert.equal(state.disconnectCalls, 0);
  assert.equal(state.farmerWorkersInstalled, 0);
  assert.equal(state.normalRuntimeAllowed, false);

  const e = state.evidence;
  assert.equal(e.status, "BESTANDEN");
  assert.equal(e.candidate.itemName, "wshield");
  assert.equal(e.candidate.targetSlot, "offhand");
  assert.equal(e.candidate.quantity, 1);
  assert.equal(e.candidate.exactCost, 4800);
  assert.equal(e.poststate.goldDelta, -4800);
  assert.equal(e.poststate.itemQuantityDelta, 1);
  assert.equal(e.goldBudgetLedger.reservationAmount, 4800);
  assert.equal(e.goldBudgetLedger.minimumGoldSafetyReserve, 1000);
  assert.equal(e.durableIntentReadback, true);
  assert.equal(e.reconciliation, "COMMITTED");
  assert.equal(e.settlement, "BESTAETIGT");
  assert.equal(e.oneShotAuthority.maximumUses, 1);
  assert.equal(e.oneShotAuthority.consumed, true);
  assert.equal(
    e.oneShotAuthority.goldInventoryBuyChannelSocketFenceClaims,
    true,
  );
  assert.equal(e.performanceTrick.active, true);
  assert.equal(e.soak.status, "BESTANDEN");
  assert.equal(e.soak.samples, 60);
  assert.ok(e.soak.durationMs >= 299_000);

  const intents = [...env.storage.data.entries()]
    .filter(([key]) => key.includes(":intent:"))
    .map(([, value]) => JSON.parse(value));
  assert.equal(intents.length, 1);
  assert.equal(intents[0].completionStatus, "BESTANDEN");
  assert.equal(intents[0].possibleSend, true);
  assert.equal(intents[0].gameplayWrites, 1);
  assert.equal(intents[0].publicFunctionCalls, 1);
  assert.equal(intents[0].sameIntentRetry, false);
  assert.equal(intents[0].oneShot.maximumUses, 1);
  assert.equal(intents[0].oneShot.consumed, true);
});

test("PR20.7 restart after possible send reconciles committed purchase without resend", async () => {
  const first = context();
  const firstState = await execute(first);
  assert.equal(firstState.status, "BESTANDEN");
  assert.equal(first.buyCalls(), 1);

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
    purchased: true,
  });
  const recovered = await execute(restarted);

  assert.equal(restarted.buyCalls(), 0);
  assert.equal(recovered.status, "BESTANDEN");
  assert.equal(recovered.evidence.restartRecovered, true);
  assert.equal(recovered.evidence.resendAttempted, false);
  assert.equal(recovered.evidence.reconciliation, "COMMITTED");
  assert.equal(recovered.evidence.soak.samples, 60);
  assert.ok(recovered.evidence.soak.durationMs >= 299_000);
  assert.equal(recovered.sameIntentRetry, false);
});

test("PR20.7 pre-existing wshield blocks before any purchase", async () => {
  const env = context({ existingBefore: true });
  const state = await execute(env);
  assert.equal(state.status, "BLOCKIERT");
  assert.ok(state.blocker.includes(
    "PR20_7_ACQUISITION_LIVE_WSHIELD_BEREITS_VORHANDEN",
  ));
  assert.equal(env.buyCalls(), 0);
  assert.equal(state.gameplayWrites, 0);
  assert.equal(state.publicFunctionCalls, 0);
});

test("PR20.7 doublehand mainhand and item class drift fail closed before send", async () => {
  for (const options of [
    { doublehand: true },
    { classCompatible: false },
    { price: 4801 },
  ]) {
    const env = context(options);
    const state = await execute(env);
    assert.equal(state.status, "BLOCKIERT");
    assert.equal(env.buyCalls(), 0);
    assert.equal(state.gameplayWrites, 0);
    assert.equal(state.publicFunctionCalls, 0);
  }
});

test("PR20.7 live package exposes exactly one public buy send and no raw bypass", () => {
  assert.equal((source.match(/r\.buy_with_gold\(/g) || []).length, 1);
  for (const forbidden of [
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "equip(",
    "unequip(",
    "sell(",
    "send_item(",
    "send_gold(",
    "start_character(",
    "command_character(",
    "/disconnect ",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.ok(source.includes('const ITEM_NAME = "wshield"'));
  assert.ok(source.includes('const TARGET_SLOT = "offhand"'));
  assert.ok(source.includes("sameIntentRetry: false"));
  assert.ok(source.includes("normalRuntimeAllowed: false"));
});
