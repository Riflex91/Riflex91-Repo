import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const controller = fs.readFileSync(
  "werkzeuge/pr20-3-market-sell-step-test-gui.js",
  "utf8",
);
const paket = fs.readFileSync(
  "werkzeuge/pr20-3-market-sell-step-test-paket.js",
  "utf8",
);

function buyState() {
  return {
    schemaVersion: 1,
    steps: {
      "1": { status: "BESTANDEN" },
      "2": { status: "BESTANDEN" },
      "3": { status: "BESTANDEN" },
      "4": { status: "BESTANDEN" },
      "5": { status: "BESTANDEN" },
      "6": { status: "BESTANDEN" },
      "7": { status: "BESTANDEN" },
    },
    liveAttempts: [
      {
        status: "COMMITTED",
        intentId: "BUY-1",
        gameplayWrites: 1,
        publicFunctionAufrufe: 1,
        sameIntentErneutSenden: false,
        candidate: { itemName: "hpot0", key: "buy-key-1" },
        settlement: { status: "BESTAETIGT" },
      },
      {
        status: "COMMITTED",
        intentId: "BUY-2",
        gameplayWrites: 1,
        publicFunctionAufrufe: 1,
        sameIntentErneutSenden: false,
        candidate: { itemName: "hpot0", key: "buy-key-2" },
        settlement: { status: "BESTAETIGT" },
      },
    ],
  };
}

function baueKontext({ mutate = true, completeBuy = true, speicher = new Map() } = {}) {
  const aktionen = new Map();
  const aktiv = new Map();
  const gui = {
    registriereAktion(a) {
      aktionen.set(a.kennung, a);
      aktiv.set(a.kennung, a.aktiviert !== false);
    },
    setzeAktionAktiv(id, value) { aktiv.set(id, value === true); },
    protokolliere() {},
    setzeErgebnis(v) { return v; },
    setzeRestzeit() {},
    kopiereBericht() { return true; },
  };

  if (completeBuy) {
    speicher.set(
      "AIO_V5_PR20_3_BUY_GOLD_STEP_TEST_V1",
      JSON.stringify(buyState()),
    );
  }

  const character = {
    name: "Merchant",
    id: "session-1",
    ctype: "merchant",
    map: "main",
    x: 0,
    y: 0,
    rip: false,
    moving: false,
    q: {},
    gold: 2000000,
    isize: 4,
    items: [{ name: "hpot0", q: 12 }, null, null, null],
  };

  const basis = {
    parent: null,
    server_region: "EU",
    server_identifier: "I",
    B: { sell_dist: 120 },
    character,
    G: {
      items: {
        hpot0: {
          name: "HP Potion",
          g: 20,
          s: 9999,
          type: "pot",
          cash: false,
          p2w: false,
        },
      },
      maps: {
        main: {
          merchants: [{ x: 0, y: 0, id: "fancypots" }],
        },
      },
    },
    item_value(item) {
      return item?.name === "hpot0" ? 12 : 0;
    },
    sell(index, q) {
      const item = character.items[index];
      if (mutate && item) {
        character.gold += 12 * q;
        const before = item.q || 1;
        if (before <= q) character.items[index] = null;
        else item.q = before - q;
      }
      return Promise.resolve({ gold: 12 * q, item: { name: item?.name, q }, cevent: "sell" });
    },
    localStorage: {
      getItem(key) { return speicher.has(key) ? speicher.get(key) : null; },
      setItem(key, value) { speicher.set(key, String(value)); },
      removeItem(key) { speicher.delete(key); },
    },
    V5TestGui: {
      performanceTrickStatus() {
        return {
          verfuegbar: true,
          audioGefunden: true,
          playing: true,
          aktiv: true,
          howlState: "loaded",
          visibilityState: "visible",
        };
      },
      async aktivierePerformanceTrick() {
        return {
          verfuegbar: true,
          audioGefunden: true,
          playing: true,
          aktiv: true,
          howlState: "loaded",
          visibilityState: "visible",
          aufgerufen: true,
          fehler: null,
        };
      },
      erstelleTest() { return gui; },
    },
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  };
  basis.parent = basis;
  return {
    context: vm.createContext(basis),
    aktionen,
    aktiv,
    speicher,
    character,
  };
}

async function bisShadow(k) {
  vm.runInContext(controller, k.context);
  let r = await k.aktionen.get("step-1").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  r = await k.aktionen.get("step-2").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  r = await k.aktionen.get("step-3").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
}

test("Sell-Harness besitzt sieben persistente Stufen, zwei Live-Gates und keine Zwischen-Merges", () => {
  assert.ok(controller.includes("AIO_V5_PR20_3_SELL_STEP_TEST_V1"));
  assert.ok(controller.includes("AIO_V5_PR20_3_BUY_GOLD_STEP_TEST_V1"));
  assert.ok(controller.includes("const MAX_TRUE_TESTS = 2"));
  assert.ok(controller.includes("PR20.3-SELL-LIVE-1"));
  assert.ok(controller.includes("PR20.3-SELL-LIVE-2"));
  for (let i = 1; i <= 7; i += 1) {
    assert.ok(controller.includes("schritt: " + i), "Schritt " + i);
  }
  assert.ok(controller.includes("sameIntentErneutSenden: false"));
});

test("Sell-Harness enthaelt genau einen kontrollierten sell-Aufruf und keinen Raw-Socket-/Reset-Pfad", () => {
  assert.equal(controller.includes("socket.emit"), false);
  assert.equal(controller.includes(".emit("), false);
  assert.equal(controller.includes("fetch("), false);
  assert.equal(controller.includes("removeItem(STATE_KEY"), false);
  assert.ok(controller.includes("api.fn.call(api.owner, pinned.inventarIndex, MENGE)"));
  assert.equal((controller.match(/api\.fn\.call\(/g) || []).length, 1);
});

test("Paket ist selbstenthalten und source-locked aufgebaut", () => {
  assert.ok(paket.includes("const API_NAME = 'V5TestGui'"));
  assert.ok(paket.includes("const API_NAME = 'V5PR203SellStepTest'"));
  assert.ok(paket.indexOf("V5PR203SellStepTest") > paket.indexOf("V5TestGui"));
});

test("Ohne vollstaendig bestandenen Buy-Gold-Test bleibt Sell Schritt 1 blockiert", async () => {
  const k = baueKontext({ completeBuy: false });
  vm.runInContext(controller, k.context);
  const r = await k.aktionen.get("step-1").ausfuehren();
  assert.equal(r.status, "BLOCKIERT");
  assert.ok(r.blocker.includes("BUY_GOLD_STATE_FEHLT"));
  assert.equal(k.character.gold, 2000000);
  assert.equal(k.character.items[0].q, 12);
});

test("Schritte 1-3 sind read-only und pinnen nur das aus Buy-Evidence stammende Item", async () => {
  const k = baueKontext();
  await bisShadow(k);
  const state = k.context.V5PR203SellStepTest.status();
  assert.equal(state.steps["1"].status, "BESTANDEN");
  assert.equal(state.steps["2"].status, "BESTANDEN");
  assert.equal(state.steps["3"].status, "BESTANDEN");
  assert.equal(state.sourceUnits.length, 2);
  assert.equal(state.pinnedCandidate.itemName, "hpot0");
  assert.equal(state.pinnedCandidate.inventarIndex, 0);
  assert.equal(state.pinnedCandidate.erwarteterGoldZuwachs, 12);
  assert.equal(state.liveAttempts.length, 0);
  assert.equal(k.character.gold, 2000000);
  assert.equal(k.character.items[0].q, 12);
  assert.equal(k.aktiv.get("step-4-live-1"), true);
});

test("LIVE 1 und LIVE 2 verkaufen ohne Zwischen-Merge je exakt eine bestaetigte Testeinheit", async () => {
  const k = baueKontext();
  await bisShadow(k);

  let r = await k.aktionen.get("step-4-live-1").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  assert.equal(r.settlement.status, "BESTAETIGT");
  assert.equal(r.settlement.goldDelta, 12);
  assert.equal(r.settlement.itemMengenDelta, -1);

  r = await k.aktionen.get("step-5").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  assert.equal(k.aktiv.get("step-6-live-2"), true);

  r = await k.aktionen.get("step-6-live-2").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  assert.equal(r.settlement.status, "BESTAETIGT");

  const state = k.context.V5PR203SellStepTest.status();
  assert.equal(state.liveAttempts.length, 2);
  assert.equal(state.liveAttempts[0].status, "COMMITTED");
  assert.equal(state.liveAttempts[1].status, "COMMITTED");
  assert.equal(state.steps["6"].status, "BESTANDEN");
  assert.equal(k.aktiv.get("step-7"), true);
  assert.equal(k.character.gold, 2000024);
  assert.equal(k.character.items[0].q, 10);
});

test("Reload behaelt Sell-Fortschritt und Live-Testbudget", async () => {
  const shared = new Map();
  const a = baueKontext({ speicher: shared });
  await bisShadow(a);
  const live1 = await a.aktionen.get("step-4-live-1").ausfuehren();
  assert.equal(live1.status, "BESTANDEN");

  const b = baueKontext({ speicher: shared });
  b.character.gold = a.character.gold;
  b.character.items[0].q = a.character.items[0].q;
  vm.runInContext(controller, b.context);

  const state = b.context.V5PR203SellStepTest.status();
  assert.equal(state.liveAttempts.length, 1);
  assert.equal(state.steps["4"].status, "BESTANDEN");
  assert.equal(b.aktiv.get("step-4-live-1"), false);
  assert.equal(b.aktiv.get("step-5"), true);
});

test("Moeglicher Sell-Send ohne Wirkung verbraucht Versuch und erlaubt keinen Blind-Retry", async () => {
  const k = baueKontext({ mutate: false });
  await bisShadow(k);
  const r = await k.aktionen.get("step-4-live-1").ausfuehren();

  assert.equal(r.status, "NICHT_BESTANDEN");
  assert.equal(r.functionalTestBudgetConsumed, true);
  assert.equal(r.sameIntentErneutSenden, false);
  const state = k.context.V5PR203SellStepTest.status();
  assert.equal(state.liveAttempts.length, 1);
  assert.notEqual(state.liveAttempts[0].status, "COMMITTED");
  assert.equal(state.steps["4"].status, "NICHT_BESTANDEN");
  assert.equal(k.aktiv.get("step-4-live-1"), false);
  assert.equal(k.aktiv.get("step-5"), false);
});

test("Schritt 7 ist reiner 5-Minuten-NO-WRITE-Soak", () => {
  assert.ok(controller.includes("const SOAK_MS = 5 * 60 * 1000"));
  assert.ok(controller.includes("const SOAK_INTERVAL_MS = 15 * 1000"));
  assert.ok(controller.includes("const MAX_SAMPLE_GAP_MS = 45 * 1000"));
  assert.ok(controller.includes("const MIN_SAMPLES = 20"));
  assert.ok(controller.includes("const MAX_SAMPLES = 30"));
  assert.ok(controller.includes("functionalTestBudgetConsumed: false"));
});
