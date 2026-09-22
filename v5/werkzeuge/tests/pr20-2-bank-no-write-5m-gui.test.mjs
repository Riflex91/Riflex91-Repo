import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const controller = fs.readFileSync("werkzeuge/pr20-2-bank-no-write-5m-gui.js", "utf8");
const paket = fs.readFileSync("werkzeuge/pr20-2-bank-no-write-5m-paket.js", "utf8");

test("PR20.2 Bank NO-WRITE 5M besitzt exakt das ratifizierte 5-Minuten-Profil", () => {
  assert.ok(controller.includes("const DAUER_MS = 5 * 60 * 1000"));
  assert.ok(controller.includes("const INTERVALL_MS = 15 * 1000"));
  assert.ok(controller.includes("const MAX_SAMPLE_GAP_MS = 45 * 1000"));
  assert.ok(controller.includes("const MIN_SAMPLES = 20"));
  assert.ok(controller.includes("const MAX_SAMPLES = 30"));
  assert.ok(controller.includes("PR20.2-BANK-NO-WRITE-5M-START"));
});

test("PR20.2 Bank NO-WRITE 5M besitzt keinerlei Gameplay-Send-Pfad", () => {
  for (const fn of [
    "bank_deposit",
    "bank_withdraw",
    "bank_store",
    "bank_retrieve",
    "bank_swap",
    "open_bank_pack",
    "call_code_function_f",
  ]) {
    assert.equal(new RegExp("\\b" + fn + "\\s*\\(").test(controller), false, fn);
  }
  for (const verboten of [
    ".emit(", "socket.emit", "parent.socket", "fetch(", "XMLHttpRequest",
    ".attack(", ".move(", ".smart_move(", ".use_skill(", ".buy(", ".sell(",
    ".send_item(", ".send_gold(", ".upgrade(", ".compound(", ".exchange("
  ]) assert.equal(controller.includes(verboten), false, verboten);

  for (const marker of [
    "gameplayWrites: 0",
    "mutatingPublicFunctionCalls: 0",
    "durableIntentErzeugt: false",
    "authorityAusgestellt: false",
    "liveMutationFreigegeben: false",
    "functionalTestBudgetConsumed: false",
    "withdrawTestbudgetVerbraucht: false",
    "sameIntentErneutSenden: false",
    "pr20_2ExitGateBleibt: 'BLOCKIERT_FAIL_CLOSED'",
    "pr20_3MarktStartErlaubt: false"
  ]) assert.ok(controller.includes(marker), marker);
});

test("PR20.2 Bank NO-WRITE 5M liest das echte Bank-Funktionstestjournal nur read-only", () => {
  assert.ok(controller.includes("AIO_V5_BANK_FUNCTION_TEST_STATE_V1"));
  assert.ok(controller.includes("bankFunctionTestJournalReadOnly: true"));
  assert.equal(controller.includes("removeItem(BANK_FUNCTION_STATE_KEY"), false);
  assert.equal(controller.includes("setItem(BANK_FUNCTION_STATE_KEY"), false);
});

test("PR20.2 Bank NO-WRITE 5M Paket ist source-locked und selbstenthalten", () => {
  assert.ok(paket.includes("const API_NAME = 'V5TestGui'"));
  assert.ok(paket.includes("const API_NAME = 'V5PR202BankNoWrite5m'"));
  assert.ok(paket.includes("Ergebnis kopieren"));
  assert.ok(paket.includes("Gesamtbericht kopieren"));
  assert.ok(paket.indexOf("V5PR202BankNoWrite5m") > paket.indexOf("V5TestGui"));
  assert.equal(paket.includes("fetch("), false);
  assert.equal(paket.includes("XMLHttpRequest"), false);
});

function baueKontext({ gold = 15993820, cash = 0 } = {}) {
  const bankJournal = JSON.stringify({
    schemaVersion: 1,
    journal: {
      RETRIEVE: [{ status: "COMMITTED" }],
      STORE: [{ status: "COMMITTED" }],
      SWAP: [{ status: "COMMITTED" }]
    }
  });
  const speicher = new Map([["AIO_V5_BANK_FUNCTION_TEST_STATE_V1", bankJournal]]);
  const aktionen = new Map();
  const gui = {
    registriereAktion(a) { aktionen.set(a.kennung, a); },
    protokolliere() {},
    setzeErgebnis(v) { return v; },
    setzeAktionAktiv() {},
    setzeRestzeit() {},
    kopiereBericht() { return true; }
  };
  const basis = {
    parent: null,
    user_id: "account-1",
    server_region: "EU",
    server_identifier: "I",
    bank_packs: {
      items0: ["bank", 0, 0],
      items1: ["bank", 0, 0],
      items2: ["bank", 75000000, 600]
    },
    character: {
      name: "Merchant",
      id: "session-1",
      owner: "account-1",
      ctype: "merchant",
      map: "bank",
      rip: false,
      moving: false,
      q: {},
      gold,
      cash,
      isize: 4,
      items: [null, { name: "coat", level: 0 }, null, null],
      bank: {
        gold: 500,
        items0: [{ name: "helmet", level: 0 }],
        items1: [null]
      }
    },
    localStorage: {
      getItem(key) { return speicher.has(key) ? speicher.get(key) : null; },
      setItem(key, value) { speicher.set(key, String(value)); },
      removeItem(key) { speicher.delete(key); }
    },
    V5TestGui: {
      performanceTrickStatus() {
        return { aktiv: true, playing: true, howlState: "loaded", visibilityState: "visible" };
      },
      async aktivierePerformanceTrick() {
        return { aktiv: true, playing: true, howlState: "loaded", visibilityState: "visible" };
      },
      erstelleTest() { return gui; }
    },
    console
  };
  return {
    context: vm.createContext(basis),
    bankJournal,
    bankJournalDanach: () => speicher.get("AIO_V5_BANK_FUNCTION_TEST_STATE_V1"),
    sessionRaw: () => speicher.get("AIO_V5_PR20_2_BANK_NO_WRITE_5M_V1"),
    aktionen
  };
}

test("Passive Vorpruefung ist mit aktuellem Ressourcenstand BEREIT und veraendert kein Testbudget", async () => {
  const k = baueKontext();
  vm.runInContext(controller, k.context);
  const r = await k.context.V5PR202BankNoWrite5m.passiveVorpruefung();

  assert.equal(r.status, "BESTANDEN");
  assert.equal(r.testArt, "PR20_2_BANK_NO_WRITE_5M_PREFLIGHT");
  assert.equal(r.snapshot.bindung.ctype, "merchant");
  assert.equal(r.snapshot.bindung.map, "bank");
  assert.equal(r.snapshot.openPack.pack, "items2");
  assert.equal(r.snapshot.openPack.goldKosten, 75000000);
  assert.equal(r.snapshot.openPack.shellKosten, 600);
  assert.equal(r.snapshot.openPack.goldBezahlbar, false);
  assert.equal(r.snapshot.openPack.shellsBezahlbar, false);
  assert.equal(r.gameplayWrites, 0);
  assert.equal(r.mutatingPublicFunctionCalls, 0);
  assert.equal(r.functionalTestBudgetConsumed, false);
  assert.equal(r.liveMutationFreigegeben, false);
  assert.equal(k.bankJournalDanach(), k.bankJournal);
  assert.equal(k.sessionRaw(), undefined);
});

test("Wird ein Open-Pack-Pfad finanzierbar, blockiert bereits die read-only Vorpruefung ohne Send", async () => {
  const k = baueKontext({ gold: 80000000, cash: 0 });
  vm.runInContext(controller, k.context);
  const r = await k.context.V5PR202BankNoWrite5m.passiveVorpruefung();

  assert.equal(r.status, "BLOCKIERT");
  assert.ok(Array.from(r.blocker).includes("OPEN_PACK_RESOURCE_STATE_CHANGED_PATH_READY"));
  assert.equal(r.gameplayWrites, 0);
  assert.equal(r.mutatingPublicFunctionCalls, 0);
  assert.equal(r.functionalTestBudgetConsumed, false);
  assert.equal(k.bankJournalDanach(), k.bankJournal);
});
