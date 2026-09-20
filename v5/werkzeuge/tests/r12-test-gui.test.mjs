import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const gui = fs.readFileSync("werkzeuge/v5-adventure-land-test-gui.js", "utf8");
const controller = fs.readFileSync("werkzeuge/r12-controlled-live-test-gui.js", "utf8");
const paket = fs.readFileSync("werkzeuge/r12-controlled-live-test-paket.js", "utf8");

test("V5 Test-GUI bietet kopierbares Ergebnis und Gesamtbericht", () => {
  for (const marker of [
    "Ergebnis kopieren",
    "Gesamtbericht kopieren",
    "kopiereErgebnis",
    "kopiereBericht",
    "berichtText",
  ]) {
    assert.ok(gui.includes(marker), marker);
  }
});

test("R12 GUI besitzt gefuehrlichen One-Shot mit exakter Bestaetigung", () => {
  assert.ok(controller.includes("R12-EQUIP-ONCE"));
  assert.ok(controller.includes("bestaetigungsText: BESTAETIGUNG"));
  assert.ok(controller.includes("einmalig: true"));
  assert.ok(controller.includes("sendVerbraucht"));
});

test("R12 GUI erlaubt genau eine direkte Gameplay-Mutation: equip", () => {
  const equipAufrufe = controller.match(/\.equip\s*\(/g) ?? [];
  assert.equal(equipAufrufe.length, 1);
  for (const verboten of [
    ".attack(",
    ".move(",
    ".smart_move(",
    ".use_skill(",
    ".buy(",
    ".sell(",
    ".send_item(",
    ".send_gold(",
    ".upgrade(",
    ".compound(",
    ".exchange(",
    ".craft(",
  ]) {
    assert.equal(controller.includes(verboten), false, verboten);
  }
});

test("R12 GUI macht nach unklarem Send keinen Retry", () => {
  assert.ok(controller.includes("sameIntentRetry: false"));
  assert.ok(controller.includes("status: erfolgreich ? 'BESTANDEN' : 'UNGEKLAERT'"));
  assert.ok(controller.includes("R12_ONE_SHOT_BEREITS_VERBRAUCHT"));
  assert.equal(controller.includes("sameIntentRetry: true"), false);
});

test("Offenes Browser-Testjournal blockiert einen neuen Send", () => {
  assert.ok(controller.includes("VORHERIGER_TESTVERSUCH_UNGEKLAERT"));
  assert.ok(controller.includes("journalOffen"));
  assert.ok(controller.includes("R12_TEST_JOURNAL_ROUNDTRIP_FEHLER"));
});

test("R12 Bericht enthaelt maschinenlesbare Live-Kernfelder", () => {
  for (const marker of [
    "actionContractId: ACTION",
    "recoveryContractId: RECOVERY",
    "verifierId: VERIFIER",
    "gameWrites: 1",
    "unerwarteteGameWrites: 0",
    "maximaleAktionen: 1",
    "breiteRuntimeFreigabe: false",
    "postcondition",
  ]) {
    assert.ok(controller.includes(marker), marker);
  }
});

test("Paste-Paket enthaelt GUI vor Controller und keine Fremdquelle", () => {
  const guiPos = paket.indexOf("const API_NAME = 'V5TestGui'");
  const controllerPos = paket.indexOf("const API_NAME = 'V5R12TestGui'");
  assert.ok(guiPos >= 0);
  assert.ok(controllerPos > guiPos);
  assert.equal(paket.includes("fetch("), false);
  assert.equal(paket.includes("XMLHttpRequest"), false);
});
