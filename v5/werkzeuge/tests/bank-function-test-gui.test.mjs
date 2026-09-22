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


test("OPEN BANK PACK besitzt ausschliesslich einen read-only Shadow ohne Spend-Pfad", () => {
  assert.ok(controller.includes("OPEN PACK · Shadow"));
  assert.ok(controller.includes("liveMutationFreigegeben: false"));
  assert.ok(controller.includes("ASYNC_BACKEND_TX_MIT_IN_PROGRESS_UND_GAME_RESPONSE"));
  assert.ok(controller.includes("goldBezahlbar"));
  assert.ok(controller.includes("shellsBezahlbar"));
  assert.equal((controller.match(/\.open_bank_pack\s*\(/g) ?? []).length, 0);
  assert.equal((controller.match(/open_bank_pack\s*\(/g) ?? []).length, 0);
});

test("OPEN BANK PACK Shadow waehlt stabilen gesperrten Pack und schreibt nichts", async () => {
  const speicher = new Map();
  const gui = {
    registriereAktion() {},
    protokolliere() {},
    setzeErgebnis() {},
    setzeAktionAktiv() {},
    kopiereBericht() { return true; }
  };
  let jetzt = 1000;
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
      gold: 80000000,
      cash: 700,
      isize: 4,
      items: [null, null, null, null],
      bank: {
        gold: 500,
        items0: [null],
        items1: [null]
      }
    },
    G: { items: {} },
    localStorage: {
      getItem(key) { return speicher.has(key) ? speicher.get(key) : null; },
      setItem(key, value) { speicher.set(key, String(value)); }
    },
    V5TestGui: {
      performanceTrickStatus() { return { aktiv: true, playing: true }; },
      async aktivierePerformanceTrick() { return { aktiv: true, playing: true }; },
      erstelleTest() { return gui; }
    },
    bank_retrieve() {},
    bank_store() {},
    bank_swap() {},
    open_bank_pack() { throw new Error("DARF_NICHT_AUFGERUFEN_WERDEN"); },
    setTimeout(fn) { fn(); return 1; },
    clearTimeout() {},
    Date: { now() { jetzt += 1000; return jetzt; } },
    console
  };
  const context = vm.createContext(basis);
  vm.runInContext(controller, context);
  const result = await context.V5BankFunctionTest.openBankPackShadow();
  assert.equal(result.status, "BESTANDEN");
  assert.equal(result.kandidat.pack, "items2");
  assert.equal(result.kandidat.goldKosten, 75000000);
  assert.equal(result.kandidat.shellKosten, 600);
  assert.equal(result.zahlung.goldBezahlbar, true);
  assert.equal(result.zahlung.shellsBezahlbar, true);
  assert.equal(result.gameplayWrites, 0);
  assert.equal(result.mutatingPublicFunctionCalls, 0);
  assert.equal(result.liveMutationFreigegeben, false);
});


test("OPEN BANK PACK Admission bleibt read-only und blockiert beide Pfade bei fehlenden Ressourcen", async () => {
  const speicher = new Map();
  const gui = {
    registriereAktion() {},
    protokolliere() {},
    setzeErgebnis() {},
    setzeAktionAktiv() {},
    kopiereBericht() { return true; }
  };
  let jetzt = 1000;
  let openCalls = 0;
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
      gold: 15993820,
      cash: 0,
      isize: 4,
      items: [null, null, null, null],
      bank: {
        gold: 500,
        items0: [null],
        items1: [null]
      }
    },
    G: { items: {} },
    localStorage: {
      getItem(key) { return speicher.has(key) ? speicher.get(key) : null; },
      setItem(key, value) { speicher.set(key, String(value)); }
    },
    V5TestGui: {
      performanceTrickStatus() { return { aktiv: true, playing: true }; },
      async aktivierePerformanceTrick() { return { aktiv: true, playing: true }; },
      erstelleTest() { return gui; }
    },
    bank_retrieve() {},
    bank_store() {},
    bank_swap() {},
    open_bank_pack() { openCalls += 1; throw new Error("DARF_NICHT_AUFGERUFEN_WERDEN"); },
    setTimeout(fn) { fn(); return 1; },
    clearTimeout() {},
    Date: { now() { jetzt += 1000; return jetzt; } },
    console
  };
  const context = vm.createContext(basis);
  vm.runInContext(controller, context);
  const result = await context.V5BankFunctionTest.openBankPackAdmission();
  assert.equal(result.status, "BLOCKIERT");
  assert.equal(result.testArt, "ADMISSION_READ_ONLY");
  assert.equal(result.pfade.gold.status, "BLOCKIERT");
  assert.ok(Array.from(result.pfade.gold.blocker).includes("BANK_OPEN_PACK_GOLD_ZU_NIEDRIG"));
  assert.equal(result.pfade.shells.status, "BLOCKIERT");
  assert.ok(Array.from(result.pfade.shells.blocker).includes("BANK_OPEN_PACK_SHELLS_ZU_NIEDRIG"));
  assert.equal(result.gameplayWrites, 0);
  assert.equal(result.mutatingPublicFunctionCalls, 0);
  assert.equal(result.liveMutationFreigegeben, false);
  assert.equal(openCalls, 0);
});

test("OPEN BANK PACK Admission kann Finanzierbarkeit anzeigen ohne Live freizugeben", async () => {
  assert.ok(controller.includes("OPEN PACK · Admission"));
  assert.ok(controller.includes("PFAD_BEREIT_ABER_LIVE_WEITERHIN_NICHT_FREIGEGEBEN"));
  assert.ok(controller.includes("WAIT_AND_REOBSERVE_NO_SEND"));
  assert.equal((controller.match(/open_bank_pack\s*\(/g) ?? []).length, 0);
});
