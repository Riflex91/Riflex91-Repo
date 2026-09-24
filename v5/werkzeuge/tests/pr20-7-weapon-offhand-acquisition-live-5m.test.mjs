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
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const setTimeoutFake = (fn, ms = 0) => {
    now += Number(ms) || 0;
    queueMicrotask(fn);
    return 1;
  };
  return { FakeDate, setTimeoutFake, now: () => now };
}

function buildContext({
  storage = storageFake(),
  buyMode = "COMMIT",
  existingShield = false,
  mainhand = "staff",
} = {}) {
  const clock = makeFakeClock();
  let buyCalls = 0;
  const items = Array.from({ length: 42 }, (_, i) =>
    i < 21 ? { name: "hpot0", q: 1 } : null);
  if (existingShield) items[21] = { name: "wshield", q: 1 };

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
    B: { sell_dist: 400 },
    G: {
      items: {
        wshield: { type: "shield", g: 4800 },
        staff: { type: "weapon", wtype: "staff" },
        rod: { type: "weapon", wtype: "rod" },
        hpot0: { type: "pot", g: 20 },
      },
      npcs: {
        basics: {
          role: "merchant",
          name: "Gabriel",
          items: ["wshield"],
        },
      },
      classes: {
        merchant: {
          offhand: { shield: true, source: true, quiver: true, misc_offhand: true },
          doublehand: { rod: true, pickaxe: true, axe: true, basher: true },
        },
      },
      maps: {
        main: {
          items: {
            wshield: [[100, 100]],
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
      x: 110,
      y: 110,
      gold: 14_493_644,
      items,
      slots: {
        mainhand: { name: mainhand, level: 0 },
        offhand: null,
      },
      rip: false,
      dead: false,
      moving: false,
      target: null,
      q: {},
    },
    sounds: {
      empty: {
        cplaying: true,
        playing() { return true; },
      },
    },
    performance_trick() {},
    async buy_with_gold(itemName, quantity) {
      buyCalls += 1;
      assert.equal(itemName, "wshield");
      assert.equal(quantity, 1);
      if (buyMode === "COMMIT") {
        this.character.gold -= 4800;
        const index = this.character.items.findIndex(x => x === null);
        assert.ok(index >= 0);
        this.character.items[index] = { name: "wshield", q: 1 };
        return { ok: true };
      }
      if (buyMode === "GOLD_ONLY") {
        this.character.gold -= 4800;
        return { ok: false };
      }
      if (buyMode === "THROW_AFTER_COMMIT") {
        this.character.gold -= 4800;
        const index = this.character.items.findIndex(x => x === null);
        this.character.items[index] = { name: "wshield", q: 1 };
        throw new Error("response lost");
      }
      throw new Error("unexpected buy mode");
    },
  };
  sandbox.globalThis = sandbox;
  sandbox.parent = sandbox;
  vm.createContext(sandbox);
  return { sandbox, storage, clock, buyCalls: () => buyCalls };
}

async function waitTerminal(api, max = 3000) {
  for (let i = 0; i < max; i += 1) {
    await new Promise(resolve => setImmediate(resolve));
    const status = api.status();
    if (status.terminal === true) return status;
  }
  throw new Error("test did not become terminal");
}

test("PR20.7 wshield live package commits exactly one buy and completes 5m soak", async () => {
  const env = buildContext();
  vm.runInContext(source, env.sandbox);
  const api = env.sandbox.V5PR207WeaponOffhandAcquisitionLive;
  assert.equal(api.version, "1.0.0");
  assert.equal(api.testId, "pr20-7-gear-weapon-offhand-acquisition-live-5m");

  const status = await waitTerminal(api);
  assert.equal(status.status, "BESTANDEN");
  assert.equal(status.phase, "COMPLETE");
  assert.equal(env.buyCalls(), 1);
  assert.equal(status.gameplayWrites, 1);
  assert.equal(status.publicFunctionCalls, 1);
  assert.equal(status.rawWriteCalls, 0);
  assert.equal(status.sameIntentRetry, false);
  assert.equal(status.normalRuntimeAllowed, false);

  const e = status.evidence;
  assert.equal(e.evidenceArt, "V5_PR20_7_WEAPON_OFFHAND_ACQUISITION_LIVE_5M");
  assert.equal(e.candidate.itemName, "wshield");
  assert.equal(e.candidate.targetSlot, "offhand");
  assert.equal(e.candidate.exactCost, 4800);
  assert.equal(e.settlement.reconciliation, "COMMITTED");
  assert.equal(e.settlement.settlement, "BESTAETIGT");
  assert.equal(e.settlement.goldDelta, -4800);
  assert.equal(e.settlement.itemDelta, 1);
  assert.equal(e.oneShotAuthority.issued, true);
  assert.equal(e.oneShotAuthority.maximumUses, 1);
  assert.equal(e.oneShotAuthority.consumed, true);
  assert.equal(e.goldBudgetLedger.reservationAmount, 4800);
  assert.equal(e.goldBudgetLedger.minimumSafetyReserve, 1000);
  assert.equal(e.socketBudget.planBudgetReserved, 100);
  assert.equal(e.socketBudget.serverReserveUntouched, 100);
  assert.equal(e.soak.samples, 60);
  assert.ok(e.soak.durationMs >= 299000);
});

test("PR20.7 response loss after applied purchase reconciles COMMITTED without resend", async () => {
  const env = buildContext({ buyMode: "THROW_AFTER_COMMIT" });
  vm.runInContext(source, env.sandbox);
  const status = await waitTerminal(env.sandbox.V5PR207WeaponOffhandAcquisitionLive);
  assert.equal(status.status, "BESTANDEN");
  assert.equal(env.buyCalls(), 1);
  assert.equal(status.evidence.settlement.reconciliation, "COMMITTED");
  assert.equal(status.sameIntentRetry, false);
});

test("PR20.7 partial gold-only effect fails closed and never sends twice", async () => {
  const env = buildContext({ buyMode: "GOLD_ONLY" });
  vm.runInContext(source, env.sandbox);
  const status = await waitTerminal(env.sandbox.V5PR207WeaponOffhandAcquisitionLive);
  assert.equal(status.status, "BLOCKIERT");
  assert.equal(status.phase, "RECONCILIATION");
  assert.equal(env.buyCalls(), 1);
  assert.equal(status.gameplayWrites, 1);
  assert.equal(status.publicFunctionCalls, 1);
  assert.equal(status.sameIntentRetry, false);
  assert.match(status.blocker[0], /PARTIAL_OPERATOR_REQUIRED/);
});

test("PR20.7 pre-existing wshield blocks before any live write", async () => {
  const env = buildContext({ existingShield: true });
  vm.runInContext(source, env.sandbox);
  const status = await waitTerminal(env.sandbox.V5PR207WeaponOffhandAcquisitionLive);
  assert.equal(status.status, "FEHLER");
  assert.equal(env.buyCalls(), 0);
  assert.equal(status.gameplayWrites, 0);
  assert.equal(status.publicFunctionCalls, 0);
  assert.match(status.blocker[0], /WSHIELD_BEREITS_VORHANDEN/);
});

test("PR20.7 doublehand mainhand blocks before any live write", async () => {
  const env = buildContext({ mainhand: "rod" });
  vm.runInContext(source, env.sandbox);
  const status = await waitTerminal(env.sandbox.V5PR207WeaponOffhandAcquisitionLive);
  assert.equal(status.status, "FEHLER");
  assert.equal(env.buyCalls(), 0);
  assert.match(status.blocker[0], /DOUBLEHAND_MAINHAND/);
});

test("PR20.7 live package has one controlled public purchase call and no raw write path", () => {
  assert.equal(
    source.split("buyWithGold(ITEM_NAME,QUANTITY)").length - 1,
    1,
  );
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
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.ok(source.includes("sendBoundaryState:'MOEGLICH_GESENDET'"));
  assert.ok(source.includes("sameIntentRetry:false"));
  assert.ok(source.includes("SOAK_SAMPLES = 60"));
  assert.ok(source.includes("SOAK_INTERVAL_MS = 5000"));
  assert.ok(source.includes("OFFICIAL_SERVER_SOURCE_COMMIT"));
});
