import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const controller = fs.readFileSync("werkzeuge/bank-function-test-gui.js", "utf8");
const paket = fs.readFileSync("werkzeuge/bank-function-test-paket.js", "utf8");

test("Bank-Funktionstest besitzt exakt die drei erlaubten mutierenden Public-Function-Pfade", () => {
  assert.equal((controller.match(/root\.bank_retrieve\s*\(/g) ?? []).length, 1);
  assert.equal((controller.match(/root\.bank_store\s*\(/g) ?? []).length, 1);
  assert.equal((controller.match(/root\.bank_swap\s*\(/g) ?? []).length, 1);
  for (const verboten of [
    ".emit(", "socket.emit", "parent.socket", ".attack(", ".move(",
    ".smart_move(", ".use_skill(", ".buy(", ".sell(", ".send_item(",
    ".send_gold(", ".upgrade(", ".compound(", ".exchange("
  ]) assert.equal(controller.includes(verboten), false, verboten);
});

test("Bank-Funktionstest ist performance-, journal-, no-retry- und max-2-gebunden", () => {
  for (const marker of [
    "aktivierePerformanceTrick",
    "performanceTrickStatus",
    "INTENT_DURABLE",
    "OUTCOME_PENDING",
    "RECOVERY_PENDING",
    "sameIntentErneutSenden: false",
    "MAX_TRUE_TESTS = 2",
    "MAXIMAL_ZWEI_ECHTE_TESTS_ERREICHT",
    "VORHERIGER_MOEGLICHER_SEND_UNGEKLAERT",
    "FRESH_ADMISSION_BLOCKIERT"
  ]) assert.ok(controller.includes(marker), marker);
});

test("Paket ist source-locked, selbstenthalten und besitzt Kopier-GUI", () => {
  assert.ok(paket.includes("const API_NAME = 'V5TestGui'"));
  assert.ok(paket.includes("const API_NAME = 'V5BankFunctionTest'"));
  assert.ok(paket.includes("Ergebnis kopieren"));
  assert.ok(paket.includes("Gesamtbericht kopieren"));
  assert.ok(paket.indexOf("V5BankFunctionTest") > paket.indexOf("V5TestGui"));
  assert.equal(paket.includes("fetch("), false);
  assert.equal(paket.includes("XMLHttpRequest"), false);
});

function kontextFuerRetrieve({ mutiert = true } = {}) {
  const speicher = new Map();
  let retrieveCalls = 0;
  let jetzt = 1000;
  const gui = {
    registriereAktion() {},
    protokolliere() {},
    setzeErgebnis() {},
    setzeAktionAktiv() {},
    kopiereBericht() { return true; }
  };
  const basis = {
    parent: null,
    user_id: "account-1",
    server_region: "EU",
    server_identifier: "I",
    bank_packs: { items0: ["bank"] },
    character: {
      name: "Merchant",
      id: "session-1",
      owner: "account-1",
      ctype: "merchant",
      map: "bank",
      rip: false,
      moving: false,
      q: {},
      gold: 1000,
      isize: 4,
      items: [null, { name: "coat" }, null, null],
      bank: {
        gold: 500,
        items0: [{ name: "helmet", level: 0 }, null]
      }
    },
    G: { items: { helmet: {}, coat: {} } },
    localStorage: {
      getItem(key) { return speicher.has(key) ? speicher.get(key) : null; },
      setItem(key, value) { speicher.set(key, String(value)); }
    },
    V5TestGui: {
      performanceTrickStatus() { return { aktiv: true, playing: true }; },
      async aktivierePerformanceTrick() { return { aktiv: true, playing: true }; },
      erstelleTest() { return gui; }
    },
    bank_retrieve(pack, bankSlot, invSlot) {
      retrieveCalls += 1;
      if (!mutiert) return;
      const item = basis.character.bank[pack][bankSlot];
      basis.character.bank[pack][bankSlot] = null;
      basis.character.items[invSlot] = item;
    },
    bank_store() {},
    bank_swap() {},
    setTimeout(fn) { fn(); return 1; },
    clearTimeout() {},
    Date: { now() { jetzt += 1000; return jetzt; } },
    console
  };
  return {
    context: vm.createContext(basis),
    calls: () => retrieveCalls
  };
}

test("Retrieve Shadow bleibt read-only und Live ruft bank_retrieve exakt einmal auf", async () => {
  const { context, calls } = kontextFuerRetrieve();
  vm.runInContext(controller, context);

  const shadow = await context.V5BankFunctionTest.shadow("RETRIEVE");
  assert.equal(shadow.status, "BESTANDEN");
  assert.equal(shadow.mutatingPublicFunctionCalls, 0);
  assert.equal(calls(), 0);

  const token = context.V5BankFunctionTest.bestaetigung("RETRIEVE", 1);
  const live = await context.V5BankFunctionTest.live("RETRIEVE", 1, token);
  assert.equal(live.status, "BESTANDEN");
  assert.equal(live.journalStatus, "COMMITTED");
  assert.equal(live.sameIntentErneutSenden, false);
  assert.equal(live.publicFunctionAufrufe, 1);
  assert.equal(calls(), 1);

  const wieder = await context.V5BankFunctionTest.live("RETRIEVE", 1, token);
  assert.equal(wieder.status, "BLOCKIERT");
  assert.equal(calls(), 1);
});

test("unklarer moeglicher Send sperrt denselben Funktionspfad gegen Retry", async () => {
  const { context, calls } = kontextFuerRetrieve({ mutiert: false });
  vm.runInContext(controller, context);
  const token = context.V5BankFunctionTest.bestaetigung("RETRIEVE", 1);

  const first = await context.V5BankFunctionTest.live("RETRIEVE", 1, token);
  assert.equal(first.status, "UNGEKLAERT");
  assert.equal(first.journalStatus, "RECOVERY_PENDING");
  assert.equal(first.sameIntentErneutSenden, false);
  assert.equal(calls(), 1);

  const second = await context.V5BankFunctionTest.live("RETRIEVE", 1, token);
  assert.equal(second.status, "BLOCKIERT");
  assert.ok(Array.from(second.blocker).includes("VORHERIGER_MOEGLICHER_SEND_UNGEKLAERT"));
  assert.equal(calls(), 1);
});
