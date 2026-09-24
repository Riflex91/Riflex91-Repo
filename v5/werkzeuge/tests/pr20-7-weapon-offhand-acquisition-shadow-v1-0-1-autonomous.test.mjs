import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";

const source = fs.readFileSync(
  "werkzeuge/pr20-7-weapon-offhand-acquisition-shadow-no-write-v1-0-1-autonomous.js",
  "utf8",
);

function localStorageFake(seed = new Map()) {
  const data = seed;
  return {
    setItem(key, value) { data.set(String(key), String(value)); },
    getItem(key) { return data.has(String(key)) ? data.get(String(key)) : null; },
    removeItem(key) { data.delete(String(key)); },
    key(index) { return [...data.keys()][index] ?? null; },
    get length() { return data.size; },
    keys() { return [...data.keys()]; },
  };
}

function context(overrides = {}) {
  const storage = overrides.storage || localStorageFake();
  let buyCalls = 0;
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
    server_region: overrides.serverRegion ?? "EU",
    server_identifier: overrides.serverIdentifier ?? "I",
    entities: {},
    B: overrides.sellDist === undefined
      ? {}
      : { sell_dist: overrides.sellDist },
    G: {
      items: {
        wshield: {
          type: "shield",
          g: 4800,
          class: ["merchant"],
        },
        staff: {
          type: "weapon",
          wtype: "staff",
        },
        rod: {
          type: "weapon",
          wtype: "rod",
        },
      },
      classes: {
        merchant: {
          offhand: {
            shield: { speed: -8 },
            source: {},
            quiver: { speed: -2 },
            misc_offhand: { speed: -3 },
          },
          doublehand: {
            rod: { speed: -20 },
            pickaxe: { speed: -20 },
            axe: { speed: -20 },
            basher: { speed: -26 },
          },
        },
      },
      npcs: {
        basics: {
          name: "Gabriel",
          role: "merchant",
          items: ["wshield"],
        },
      },
      maps: {
        main: {
          items: {
            wshield: [[50, 50]],
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
      x: 100,
      y: 100,
      gold: overrides.gold ?? 14_493_644,
      rip: false,
      dead: false,
      moving: false,
      target: null,
      q: {},
      items: Array.from({ length: 22 }, () => null),
      slots: {
        mainhand: overrides.mainhand ?? { name: "staff", level: 0 },
        offhand: overrides.offhand ?? null,
      },
    },
    sounds: {
      empty: {
        cplaying: true,
        playing() { return true; },
      },
    },
    performance_trick() {},
    buy_with_gold() { buyCalls += 1; },
  };
  sandbox.parent = sandbox;
  sandbox.globalThis = sandbox;
  return {
    sandbox,
    storage,
    buyCalls: () => buyCalls,
  };
}

async function execute(overrides = {}, waitMs = 1_300) {
  const c = context(overrides);
  vm.createContext(c.sandbox);
  vm.runInContext(source, c.sandbox, {
    filename: "pr20-7-weapon-offhand-acquisition-shadow-no-write-v1-0-1-autonomous.js",
  });
  await new Promise(resolve => setTimeout(resolve, waitMs));
  return {
    ...c,
    api: c.sandbox.V5PR207WeaponOffhandAcquisitionShadow,
    status: c.sandbox.V5PR207WeaponOffhandAcquisitionShadow.status(),
  };
}

test("PR20.7 acquisition shadow proves durable no-send preparation on exact Merchant state", async () => {
  const { api, status, storage, buyCalls } = await execute();
  assert.ok(api);
  assert.equal(api.version, "1.0.1");
  assert.equal(
    api.testId,
    "pr20-7-gear-weapon-offhand-acquisition-durable-shadow-no-write",
  );
  assert.equal(status.status, "BESTANDEN");
  assert.equal(status.terminal, true);
  assert.deepEqual(Array.from(status.blocker), []);
  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.publicFunctionCalls, 0);
  assert.equal(status.rawWriteCalls, 0);
  assert.equal(status.startCalls, 0);
  assert.equal(status.disconnectCalls, 0);
  assert.equal(status.farmerWorkersInstalled, 0);
  assert.equal(status.sameIntentRetry, false);
  assert.equal(status.normalRuntimeAllowed, false);
  assert.equal(status.authority.authorityIssued, false);
  assert.equal(status.authority.purchaseAuthority, false);
  assert.equal(buyCalls(), 0);

  const e = status.evidence;
  assert.equal(
    e.evidenceArt,
    "V5_PR20_7_WEAPON_OFFHAND_ACQUISITION_DURABLE_SHADOW_NO_WRITE",
  );
  assert.equal(e.recipient.characterName, "My_Merchant");
  assert.equal(e.recipient.serverRegion, "EU");
  assert.equal(e.recipient.serverIdentifier, "I");
  assert.equal(e.candidate.itemName, "wshield");
  assert.equal(e.candidate.targetSlot, "offhand");
  assert.equal(e.candidate.exactCost, 4800);
  assert.equal(e.acquisition.safetyReserve, 1000);
  assert.equal(e.acquisition.sellDistance, 400);
  assert.equal(e.acquisition.sellDistanceSource, "OFFICIAL_SERVER_SOURCE_PIN");
  assert.equal(e.acquisition.vendorReachableNow, true);
  assert.equal(e.goldBudgetLedgerReservationSatisfied, true);
  assert.equal(e.goldBudgetReservationAmount, 4800);
  assert.equal(e.minimumGoldSafetyReserve, 1000);
  assert.equal(e.inventoryFencePrepared, true);
  assert.equal(e.goldFencePrepared, true);
  assert.equal(e.buyActionChannelFencePrepared, true);
  assert.equal(e.socketBudgetReservationPrepared, true);
  assert.equal(e.socketPlanBudgetReserved, 100);
  assert.equal(e.socketServerReserveUntouched, 100);
  assert.equal(e.oneShotBindingPrepared, true);
  assert.equal(e.oneShotMaximumUses, 1);
  assert.equal(e.oneShotPurchaseAuthorityIssued, false);
  assert.equal(e.durableIntentCreatedShadowOnly, true);
  assert.equal(e.durableReadback, true);
  assert.equal(e.journalTerminalArt, "ABBRUCH");
  assert.equal(e.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(e.reconciliationClassification, "NOT_APPLIED");
  assert.equal(e.fingerprints.prestateFingerprintSha256,
    e.fingerprints.postIntentPrestateFingerprintSha256);
  assert.equal(e.gameplayWrites, 0);
  assert.equal(e.publicFunctionCalls, 0);
  assert.equal(e.rawWriteCalls, 0);
  assert.equal(e.purchaseAuthority, false);
  assert.equal(e.sameIntentRetry, false);
  assert.equal(e.normalRuntimeAllowed, false);
  assert.equal(e.performanceTrick.active, true);
  assert.equal(storage.keys().length, 1);

  const record = JSON.parse(storage.getItem(storage.keys()[0]));
  assert.equal(record.goldBudgetLedger.reservationAmount, 4800);
  assert.equal(record.goldBudgetLedger.safetyReserve, 1000);
  assert.equal(record.goldBudgetLedger.reservationSatisfied, true);
  assert.equal(record.oneShot.maximumUses, 1);
  assert.equal(record.oneShot.purchaseAuthorityIssued, false);
  assert.equal(record.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(record.journalTerminalArt, "ABBRUCH");
  assert.equal(record.purchaseAuthority, false);
});

test("PR20.7 acquisition shadow blocks if exact cost would breach reserve", async () => {
  const { status, buyCalls, storage } = await execute({ gold: 5799 }, 700);
  assert.equal(status.status, "FEHLER");
  assert.equal(status.terminal, true);
  assert.deepEqual(
    Array.from(status.blocker),
    ["PR20_7_ACQUISITION_SHADOW_GOLD_BUDGET_NICHT_VERFUEGBAR"],
  );
  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.publicFunctionCalls, 0);
  assert.equal(status.rawWriteCalls, 0);
  assert.equal(buyCalls(), 0);
  assert.equal(storage.keys().length, 0);
});

test("PR20.7 acquisition shadow blocks object-shaped Merchant doublehand mainhand", async () => {
  const { status, buyCalls, storage } = await execute({
    mainhand: { name: "rod", level: 0 },
  }, 700);
  assert.equal(status.status, "FEHLER");
  assert.equal(status.terminal, true);
  assert.deepEqual(
    Array.from(status.blocker),
    ["PR20_7_ACQUISITION_SHADOW_DOUBLEHAND_MAINHAND"],
  );
  assert.equal(buyCalls(), 0);
  assert.equal(storage.keys().length, 0);
});

test("PR20.7 acquisition shadow blocks occupied offhand before durable intent", async () => {
  const { status, buyCalls, storage } = await execute({
    offhand: { name: "wshield", level: 0 },
  }, 700);
  assert.equal(status.status, "FEHLER");
  assert.equal(status.terminal, true);
  assert.deepEqual(
    Array.from(status.blocker),
    ["PR20_7_ACQUISITION_SHADOW_OFFHAND_BELEGT"],
  );
  assert.equal(buyCalls(), 0);
  assert.equal(storage.keys().length, 0);
});

test("PR20.7 acquisition shadow refuses duplicate terminal prestate intent instead of overwriting", async () => {
  const first = await execute();
  assert.equal(first.status.status, "BESTANDEN");
  const second = await execute({ storage: first.storage });
  assert.equal(second.status.status, "FEHLER");
  assert.deepEqual(
    Array.from(second.status.blocker),
    ["PR20_7_ACQUISITION_SHADOW_GLEICHER_INTENT_BEREITS_TERMINAL"],
  );
  assert.equal(second.buyCalls(), 0);
  assert.equal(second.storage.keys().length, 1);
});

test("PR20.7 acquisition shadow package statically forbids gameplay and lifecycle writes", () => {
  for (const forbidden of [
    "buy_with_gold(",
    "buy(",
    "equip(",
    "unequip(",
    "sell(",
    "send_item(",
    "send_gold(",
    "start_character(",
    "command_character(",
    "use_skill(",
    "api_call(",
    "socket.emit(",
    ".socket.emit(",
    "/disconnect ",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.ok(source.includes("MIN_GOLD_RESERVE = 1000"));
  assert.ok(source.includes("EXACT_COST = 4800"));
  assert.ok(source.includes("character:My_Merchant:action_channel:buy"));
  assert.ok(source.includes("character:My_Merchant:socket_call_budget"));
  assert.ok(source.includes("planBudgetReserved: 100"));
  assert.ok(source.includes("serverReserveUntouched: 100"));
  assert.ok(source.includes("ACQUISITION_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE"));
  assert.ok(source.includes("journalTerminalArt: 'ABBRUCH'"));
  assert.ok(source.includes("sendBoundaryState: 'NICHT_GESENDET'"));
  assert.ok(source.includes("sameIntentRetry: false"));
  assert.ok(source.includes("normalRuntimeAllowed: false"));
});
