import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const controller = fs.readFileSync(
  "werkzeuge/pr20-3-market-buy-gold-step-test-gui.js",
  "utf8",
);
const paket = fs.readFileSync(
  "werkzeuge/pr20-3-market-buy-gold-step-test-paket.js",
  "utf8",
);

test("PR20.3 Stufentest enthaelt sieben persistente Stufen und exakt zwei Live-Freigaben", () => {
  assert.ok(controller.includes("const VERSION = '1.0.0'"));
  assert.ok(controller.includes("AIO_V5_PR20_3_BUY_GOLD_STEP_TEST_V1"));
  assert.ok(controller.includes("const MAX_TRUE_TESTS = 2"));
  assert.ok(controller.includes("PR20.3-BUY-GOLD-LIVE-1"));
  assert.ok(controller.includes("PR20.3-BUY-GOLD-LIVE-2"));
  for (let i = 1; i <= 7; i += 1) {
    assert.ok(controller.includes("schritt: " + i), "Schritt " + i);
  }
  assert.ok(controller.includes("sameIntentErneutSenden: false"));
});

test("Harness besitzt keinen Raw-Socket-, Fetch- oder versteckten Reset-Pfad", () => {
  for (const verboten of [
    "socket.emit",
    ".emit(",
    "fetch(",
    "XMLHttpRequest",
    "removeItem(STATE_KEY",
  ]) {
    assert.equal(controller.includes(verboten), false, verboten);
  }
  assert.ok(controller.includes("api.fn.call(api.owner, pinned.itemName, MENGE)"));
  assert.equal((controller.match(/api\.fn\.call\(/g) || []).length, 1);
});

test("Paket ist selbstenthalten und source-locked aufgebaut", () => {
  assert.ok(paket.includes("const API_NAME = 'V5TestGui'"));
  assert.ok(paket.includes("const API_NAME = 'V5PR203BuyGoldStepTest'"));
  assert.ok(paket.includes("Gesamtbericht kopieren"));
  assert.ok(paket.indexOf("V5PR203BuyGoldStepTest") > paket.indexOf("V5TestGui"));
});

function baueKontext({ mutate = true, speicher = new Map() } = {}) {
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
    kopiereBericht() { return true; }
  };

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
    items: [{ name: "hpot0", q: 10 }, null, null, null]
  };

  const basis = {
    parent: null,
    server_region: "EU",
    server_identifier: "I",
    B: { sell_dist: 120 },
    character,
    G: {
      items: {
        hpot0: { name: "HP Potion", g: 20, s: 9999, type: "pot" },
        expensive: { name: "Too Expensive", g: 20000, s: 9999 }
      },
      maps: {
        main: {
          items: {
            hpot0: [{ x: 0, y: 0, id: "fancypots" }],
            expensive: [{ x: 0, y: 0, id: "fancypots" }]
          }
        }
      }
    },
    buy_with_gold(name, q) {
      if (mutate) {
        character.gold -= 20 * q;
        const item = character.items.find(x => x && x.name === name);
        if (item) item.q = (item.q || 1) + q;
        else character.items[1] = { name, q };
      }
      return Promise.resolve({ name, q, cost: 20 });
    },
    localStorage: {
      getItem(key) { return speicher.has(key) ? speicher.get(key) : null; },
      setItem(key, value) { speicher.set(key, String(value)); },
      removeItem(key) { speicher.delete(key); }
    },
    V5TestGui: {
      performanceTrickStatus() {
        return {
          verfuegbar: true,
          audioGefunden: true,
          playing: true,
          aktiv: true,
          howlState: "loaded",
          visibilityState: "visible"
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
          fehler: null
        };
      },
      erstelleTest() { return gui; }
    },
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval
  };
  basis.parent = basis;
  return {
    context: vm.createContext(basis),
    aktionen,
    aktiv,
    speicher,
    character
  };
}

async function fuehreBisShadow(k) {
  vm.runInContext(controller, k.context);
  let r = await k.aktionen.get("step-1").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  r = await k.aktionen.get("step-2").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  r = await k.aktionen.get("step-3").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
}

test("Schritte 1-3 schalten LIVE 1 frei und bleiben vollstaendig read-only", async () => {
  const k = baueKontext();
  await fuehreBisShadow(k);
  const state = k.context.V5PR203BuyGoldStepTest.status();
  assert.equal(state.steps["1"].status, "BESTANDEN");
  assert.equal(state.steps["2"].status, "BESTANDEN");
  assert.equal(state.steps["3"].status, "BESTANDEN");
  assert.equal(state.liveAttempts.length, 0);
  assert.equal(k.character.gold, 2000000);
  assert.equal(k.character.items[0].q, 10);
  assert.equal(k.aktiv.get("step-4-live-1"), true);
  assert.equal(k.aktiv.get("step-5"), false);
});

test("LIVE 1 und LIVE 2 koennen ohne Merge direkt nacheinander mit frischer Re-Admission bestanden werden", async () => {
  const k = baueKontext();
  await fuehreBisShadow(k);

  let r = await k.aktionen.get("step-4-live-1").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  assert.equal(r.settlement.status, "BESTAETIGT");
  assert.equal(r.settlement.goldDelta, -20);
  assert.equal(r.settlement.itemMengenDelta, 1);
  assert.equal(k.aktiv.get("step-5"), true);

  r = await k.aktionen.get("step-5").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  assert.equal(k.aktiv.get("step-6-live-2"), true);

  r = await k.aktionen.get("step-6-live-2").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  assert.equal(r.settlement.status, "BESTAETIGT");

  const state = k.context.V5PR203BuyGoldStepTest.status();
  assert.equal(state.liveAttempts.length, 2);
  assert.equal(state.liveAttempts[0].status, "COMMITTED");
  assert.equal(state.liveAttempts[1].status, "COMMITTED");
  assert.equal(state.steps["6"].status, "BESTANDEN");
  assert.equal(k.aktiv.get("step-7"), true);
  assert.equal(k.character.gold, 1999960);
  assert.equal(k.character.items[0].q, 12);
});

test("Persistenter Reload behaelt Live-Testbudget und Fortschritt; kein Reset zwischen Stufen", async () => {
  const shared = new Map();
  const a = baueKontext({ speicher: shared });
  await fuehreBisShadow(a);
  const live1 = await a.aktionen.get("step-4-live-1").ausfuehren();
  assert.equal(live1.status, "BESTANDEN");

  const b = baueKontext({ speicher: shared });
  b.character.gold = a.character.gold;
  b.character.items[0].q = a.character.items[0].q;
  vm.runInContext(controller, b.context);

  const state = b.context.V5PR203BuyGoldStepTest.status();
  assert.equal(state.liveAttempts.length, 1);
  assert.equal(state.steps["4"].status, "BESTANDEN");
  assert.equal(b.aktiv.get("step-4-live-1"), false);
  assert.equal(b.aktiv.get("step-5"), true);
});

test("Moeglicher Send ohne beobachtete Wirkung verbraucht Versuch und wird niemals blind erneut freigegeben", async () => {
  const k = baueKontext({ mutate: false });
  await fuehreBisShadow(k);
  const r = await k.aktionen.get("step-4-live-1").ausfuehren();

  assert.equal(r.status, "NICHT_BESTANDEN");
  assert.equal(r.functionalTestBudgetConsumed, true);
  assert.equal(r.sameIntentErneutSenden, false);
  const state = k.context.V5PR203BuyGoldStepTest.status();
  assert.equal(state.liveAttempts.length, 1);
  assert.notEqual(state.liveAttempts[0].status, "COMMITTED");
  assert.equal(state.steps["4"].status, "NICHT_BESTANDEN");
  assert.equal(k.aktiv.get("step-4-live-1"), false);
  assert.equal(k.aktiv.get("step-5"), false);
});

test("Schritt 7 ist ein reiner 5-Minuten-NO-WRITE-Soak mit ratifizierten Grenzen", () => {
  assert.ok(controller.includes("const SOAK_MS = 5 * 60 * 1000"));
  assert.ok(controller.includes("const SOAK_INTERVAL_MS = 15 * 1000"));
  assert.ok(controller.includes("const MAX_SAMPLE_GAP_MS = 45 * 1000"));
  assert.ok(controller.includes("const MIN_SAMPLES = 20"));
  assert.ok(controller.includes("const MAX_SAMPLES = 30"));
  assert.ok(controller.includes("gameplayWrites: 0"));
  assert.ok(controller.includes("functionalTestBudgetConsumed: false"));
});
