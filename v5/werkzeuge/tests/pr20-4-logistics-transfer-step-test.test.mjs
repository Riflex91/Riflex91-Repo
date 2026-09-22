import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const controller = fs.readFileSync(
  "werkzeuge/pr20-4-logistics-transfer-step-test-gui.js",
  "utf8",
);
const paket = fs.readFileSync(
  "werkzeuge/pr20-4-logistics-transfer-step-test-paket.js",
  "utf8",
);

function baueBus({ mutateItem = true, mutateGold = true } = {}) {
  const speicher = new Map();
  const roots = {};
  function storage() {
    return {
      getItem(key) { return speicher.has(key) ? speicher.get(key) : null; },
      setItem(key, value) { speicher.set(key, String(value)); },
      removeItem(key) { speicher.delete(key); },
    };
  }
  function make(name, ctype, x, gold, q) {
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
    const character = {
      name,
      id: "session-" + name,
      ctype,
      map: "main",
      x,
      y: 0,
      real_x: x,
      real_y: 0,
      rip: false,
      moving: false,
      gold,
      isize: 4,
      items: [{ name: "hpot0", q }, null, null, null],
    };
    const root = {
      parent: null,
      user_id: "same-account",
      server_region: "EU",
      server_identifier: "I",
      character,
      G: {
        items: {
          hpot0: { name: "HP Potion", g: 20, s: 9999, type: "pot" },
        },
      },
      get_entity(target) { return roots[target]?.character || null; },
      send_item(target, index, quantity) {
        const dest = roots[target];
        const item = character.items[index];
        if (mutateItem && dest && item) {
          item.q -= quantity;
          if (item.q <= 0) character.items[index] = null;
          const existing = dest.character.items.find(x => x?.name === item.name);
          if (existing) existing.q = Number(existing.q || 1) + quantity;
          else {
            const slot = dest.character.items.findIndex(x => !x);
            dest.character.items[slot] = { name: item.name, q: quantity };
          }
        }
        return Promise.resolve({ success: true });
      },
      send_gold(target, amount) {
        const dest = roots[target];
        if (mutateGold && dest) {
          character.gold -= amount;
          dest.character.gold += amount;
        }
        return Promise.resolve({ success: true });
      },
      localStorage: storage(),
      V5TestGui: {
        performanceTrickStatus() {
          return {
            verfuegbar: true, audioGefunden: true, playing: true,
            aktiv: true, howlState: "loaded", visibilityState: "visible"
          };
        },
        async aktivierePerformanceTrick() {
          return {
            verfuegbar: true, audioGefunden: true, playing: true,
            aktiv: true, howlState: "loaded", visibilityState: "visible",
            aufgerufen: true, fehler: null
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
    root.parent = root;
    roots[name] = root;
    return { root, context: vm.createContext(root), aktionen, aktiv, character };
  }
  const merchant = make("Merchant", "merchant", 0, 5000, 5);
  const partner = make("Partner", "ranger", 20, 3000, 1);
  return { speicher, roots, merchant, partner };
}

async function lade(bus) {
  vm.runInContext(controller, bus.merchant.context);
  vm.runInContext(controller, bus.partner.context);
  await bus.merchant.aktionen.get("actor-refresh").ausfuehren();
  await bus.partner.aktionen.get("actor-refresh").ausfuehren();
}

async function itemRoundtrip(bus) {
  let r = await bus.merchant.aktionen.get("step-1").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  r = await bus.merchant.aktionen.get("step-2").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  r = await bus.merchant.aktionen.get("step-3-item-live-1").ausfuehren();
  assert.equal(r.gameplayWrites, 1);
  await bus.partner.aktionen.get("actor-refresh").ausfuehren();
  r = await bus.partner.aktionen.get("step-4-item-settle-1").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  await bus.merchant.aktionen.get("actor-refresh").ausfuehren();
  r = await bus.partner.aktionen.get("step-5-item-return-pin").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  r = await bus.partner.aktionen.get("step-6-item-live-2").ausfuehren();
  assert.equal(r.gameplayWrites, 1);
  await bus.merchant.aktionen.get("actor-refresh").ausfuehren();
  r = await bus.merchant.aktionen.get("step-7-item-settle-2").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
}

test("PR20.4 Harness ist ein persistentes 16-Stufen-Paket mit vier harten Live-Gates", () => {
  assert.ok(controller.includes("AIO_V5_PR20_4_TRANSFER_STEP_TEST_V1"));
  assert.ok(controller.includes("AIO_V5_PR20_4_TRANSFER_ACTORS_V1"));
  assert.ok(controller.includes("const MAX_TRUE_TESTS_PER_FUNCTION = 2"));
  for (const text of [
    "PR20.4-ITEM-LIVE-1-SUPPLY",
    "PR20.4-ITEM-LIVE-2-COLLECTION",
    "PR20.4-GOLD-LIVE-1",
    "PR20.4-GOLD-LIVE-2",
  ]) assert.ok(controller.includes(text), text);
  for (const id of [
    "step-1","step-2","step-3-item-live-1","step-4-item-settle-1",
    "step-5-item-return-pin","step-6-item-live-2","step-7-item-settle-2",
    "step-8-item-soak","step-9-gold-pin","step-10-gold-live-1",
    "step-11-gold-settle-1","step-12-gold-return-pin","step-13-gold-live-2",
    "step-14-gold-settle-2","step-15-gold-soak","step-16-closeout"
  ]) assert.ok(controller.includes("kennung: '" + id + "'"), id);
  assert.ok(controller.includes("sameIntentErneutSenden: false"));
  assert.ok(controller.includes("productiveTransferAuthority: false"));
});

test("Transfer-Harness besitzt keinen Raw-Socket-, Market-Authority- oder State-Reset-Bypass", () => {
  for (const verboten of [
    ".emit(", "socket.emit", "parent.socket", "fetch(",
    "productiveTradeAuthority: true", "productiveMarketAuthority: true",
    "removeItem(STATE_KEY", "removeItem(ACTORS_KEY"
  ]) assert.equal(controller.includes(verboten), false, verboten);
  assert.equal((controller.match(/api\.fn\.call\(/g) || []).length, 2);
});

test("Paket ist selbstenthalten und source-locked aufgebaut", () => {
  assert.ok(paket.includes("const API_NAME = 'V5TestGui'"));
  assert.ok(paket.includes("const API_NAME = 'V5PR204TransferStepTest'"));
  assert.ok(paket.indexOf("V5PR204TransferStepTest") > paket.indexOf("V5TestGui"));
});

test("Pair, Rendezvous und Item-Preflight sind read-only", async () => {
  const bus = baueBus();
  await lade(bus);
  const beforeM = bus.merchant.character.items[0].q;
  const beforeP = bus.partner.character.items[0].q;
  let r = await bus.merchant.aktionen.get("step-1").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  assert.equal(r.gameplayWrites, 0);
  r = await bus.merchant.aktionen.get("step-2").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  assert.equal(r.gameplayWrites, 0);
  assert.equal(bus.merchant.character.items[0].q, beforeM);
  assert.equal(bus.partner.character.items[0].q, beforeP);
});

test("send_item deckt Supply und Collection mit exakt 2/2 bestaetigten Roundtrip-Writes ab", async () => {
  const bus = baueBus();
  await lade(bus);
  await itemRoundtrip(bus);
  const state = bus.merchant.context.V5PR204TransferStepTest.status();
  assert.equal(state.itemBudget.length, 2);
  assert.equal(state.itemBudget.every(x => x.status === "COMMITTED"), true);
  assert.equal(state.intents.filter(x => x.kind === "ITEM").length, 2);
  assert.equal(state.intents.filter(x => x.kind === "ITEM").every(x => x.recipientSettlement === "BESTAETIGT"), true);
  assert.equal(bus.merchant.character.items[0].q, 5);
  assert.equal(bus.partner.character.items[0].q, 1);
});

test("Collection nutzt bestaetigte Outbound-Evidence statt erneuter Erstkandidaten-Metadaten", async () => {
  const bus = baueBus();
  await lade(bus);
  let r = await bus.merchant.aktionen.get("step-1").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  r = await bus.merchant.aktionen.get("step-2").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  r = await bus.merchant.aktionen.get("step-3-item-live-1").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  await bus.partner.aktionen.get("actor-refresh").ausfuehren();
  r = await bus.partner.aktionen.get("step-4-item-settle-1").ausfuehren();
  assert.equal(r.status, "BESTANDEN");

  delete bus.partner.root.G.items.hpot0.s;
  await bus.merchant.aktionen.get("actor-refresh").ausfuehren();
  r = await bus.partner.aktionen.get("step-5-item-return-pin").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  r = await bus.partner.aktionen.get("step-6-item-live-2").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  assert.equal(r.testsConsumed, 2);
  assert.equal(r.sameIntentErneutSenden, false);
});

test("PR20.4 Browserpaket ist AUTO_ON_LOAD und sperrt manuelle Live-Schrittsteuerung", () => {
  assert.ok(controller.includes("const AUTO_RUN_ENABLED = true"));
  assert.ok(controller.includes("mode: 'AUTO_ON_LOAD'"));
  assert.ok(controller.includes("startAutoRunner();"));
  assert.ok(controller.includes("CONTROLLER_VERSION_DRIFT"));
  assert.ok(controller.includes("AUTORUN_PEER_FEHLT"));
  assert.ok(controller.includes("autoRunTick"));
  assert.ok(controller.includes("gui.setzeAktionAktiv(id, false)"));
  assert.ok(controller.includes("sameIntentErneutSenden: false"));
});

test("moeglicher send_item ohne Wirkung verbraucht Versuch und erlaubt keinen Blind-Retry", async () => {
  const bus = baueBus({ mutateItem: false });
  await lade(bus);
  await bus.merchant.aktionen.get("step-1").ausfuehren();
  await bus.merchant.aktionen.get("step-2").ausfuehren();
  const send = await bus.merchant.aktionen.get("step-3-item-live-1").ausfuehren();
  assert.equal(send.functionalTestBudgetConsumed, true);
  assert.equal(send.testsConsumed, 1);
  assert.equal(send.sameIntentErneutSenden, false);
  await bus.partner.aktionen.get("actor-refresh").ausfuehren();
  const settlement = await bus.partner.aktionen.get("step-4-item-settle-1").ausfuehren();
  assert.equal(settlement.status, "OFFEN_REOBSERVE");
  const raw = JSON.parse(bus.speicher.get("AIO_V5_PR20_4_TRANSFER_STEP_TEST_V1"));
  assert.equal(raw.itemBudget.length, 1);
  assert.equal(raw.sameIntentErneutSenden, false);
});

test("send_gold besitzt ebenfalls 2/2 Roundtrip-Budget mit Recipient-Settlement", async () => {
  const bus = baueBus();
  await lade(bus);
  await itemRoundtrip(bus);

  let raw = JSON.parse(bus.speicher.get("AIO_V5_PR20_4_TRANSFER_STEP_TEST_V1"));
  raw.steps["8"] = { schritt: 8, status: "BESTANDEN" };
  raw.soaks.item = { status: "BESTANDEN", durationMs: 300000, samples: [] };
  bus.speicher.set("AIO_V5_PR20_4_TRANSFER_STEP_TEST_V1", JSON.stringify(raw));

  await bus.partner.aktionen.get("actor-refresh").ausfuehren();
  let r = await bus.merchant.aktionen.get("step-9-gold-pin").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  r = await bus.merchant.aktionen.get("step-10-gold-live-1").ausfuehren();
  assert.equal(r.gameplayWrites, 1);
  await bus.partner.aktionen.get("actor-refresh").ausfuehren();
  r = await bus.partner.aktionen.get("step-11-gold-settle-1").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  await bus.merchant.aktionen.get("actor-refresh").ausfuehren();
  r = await bus.partner.aktionen.get("step-12-gold-return-pin").ausfuehren();
  assert.equal(r.status, "BESTANDEN");
  r = await bus.partner.aktionen.get("step-13-gold-live-2").ausfuehren();
  assert.equal(r.gameplayWrites, 1);
  await bus.merchant.aktionen.get("actor-refresh").ausfuehren();
  r = await bus.merchant.aktionen.get("step-14-gold-settle-2").ausfuehren();
  assert.equal(r.status, "BESTANDEN");

  const state = bus.merchant.context.V5PR204TransferStepTest.status();
  assert.equal(state.goldBudget.length, 2);
  assert.equal(state.goldBudget.every(x => x.status === "COMMITTED"), true);
  assert.equal(bus.merchant.character.gold, 5000);
  assert.equal(bus.partner.character.gold, 3000);
});

test("Reload eines nichtterminalen Possible-Send wird RECOVERY_PENDING und nie resendbar", async () => {
  const bus = baueBus({ mutateItem: false });
  await lade(bus);
  await bus.merchant.aktionen.get("step-1").ausfuehren();
  await bus.merchant.aktionen.get("step-2").ausfuehren();
  await bus.merchant.aktionen.get("step-3-item-live-1").ausfuehren();

  const neu = baueBus({ mutateItem: false });
  for (const [k, v] of bus.speicher.entries()) neu.speicher.set(k, v);
  vm.runInContext(controller, neu.merchant.context);
  await Promise.resolve();
  const state = JSON.parse(neu.speicher.get("AIO_V5_PR20_4_TRANSFER_STEP_TEST_V1"));
  const intent = state.intents.find(x => x.kind === "ITEM" && x.attempt === 1);
  assert.equal(intent.status, "RECOVERY_PENDING");
  assert.equal(intent.sameIntentErneutSenden, false);
  assert.equal(state.itemBudget.length, 1);
});

test("Item- und Gold-Funktionsevidence besitzen je eigenes 5-Minuten-NO-WRITE-Profil", () => {
  assert.ok(controller.includes("const SOAK_MS = 5 * 60 * 1000"));
  assert.ok(controller.includes("const SOAK_INTERVAL_MS = 15 * 1000"));
  assert.ok(controller.includes("const MAX_SAMPLE_GAP_MS = 45 * 1000"));
  assert.ok(controller.includes("const MIN_SAMPLES = 20"));
  assert.ok(controller.includes("gameplayWritesDuringSoak: 0"));
  assert.ok(controller.includes("mutatingPublicFunctionCallsDuringSoak: 0"));
});
