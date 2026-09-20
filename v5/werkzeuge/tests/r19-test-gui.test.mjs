import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const gui = fs.readFileSync("werkzeuge/v5-adventure-land-test-gui.js", "utf8");
const controller = fs.readFileSync("werkzeuge/r19-controlled-live-test-gui.js", "utf8");
const paket = fs.readFileSync("werkzeuge/r19-controlled-live-test-paket.js", "utf8");

test("R19 GUI verlangt die eigene manuelle Controlled-Live-Bestaetigung", () => {
  assert.ok(controller.includes("R19-CONTROLLED-LIVE-EQUIP-ONCE"));
  assert.ok(controller.includes("bestaetigungsText: BESTAETIGUNG"));
  assert.ok(controller.includes("einmalig: true"));
  assert.ok(controller.includes("sendVerbraucht"));
  assert.ok(controller.includes("zertifizierungsStufe: 'CONTROLLED_LIVE'"));
  assert.ok(controller.includes("manuelleBestaetigung: true"));
});

test("R19 GUI erlaubt genau eine direkte Gameplay-Mutation: equip", () => {
  const equipAufrufe = controller.match(/\.equip\s*\(/g) ?? [];
  assert.equal(equipAufrufe.length, 1);
  for (const verboten of [
    ".attack(", ".move(", ".smart_move(", ".use_skill(", ".buy(", ".sell(",
    ".send_item(", ".send_gold(", ".upgrade(", ".compound(", ".exchange(", ".craft("
  ]) assert.equal(controller.includes(verboten), false, verboten);
});

test("R19 GUI macht nach unklarem Send keinen Retry", () => {
  assert.ok(controller.includes("sameIntentRetry: false"));
  assert.ok(controller.includes("status: erfolgreich ? 'BESTANDEN' : 'UNGEKLAERT'"));
  assert.ok(controller.includes("R19_ONE_SHOT_BEREITS_VERBRAUCHT"));
  assert.equal(controller.includes("sameIntentRetry: true"), false);
});

test("R19 GUI blockiert offene Browser-Evidence vor neuem Send", () => {
  assert.ok(controller.includes("VORHERIGER_TESTVERSUCH_UNGEKLAERT"));
  assert.ok(controller.includes("journalOffen"));
  assert.ok(controller.includes("R19_TEST_JOURNAL_ROUNDTRIP_FEHLER"));
  assert.ok(controller.includes("AIO_V5_R19_TEST_JOURNAL_V1"));
});

test("R19 Bericht enthaelt Controlled-Live-Kernfelder", () => {
  for (const marker of [
    "phase: 'R19'",
    "actionContractId: ACTION",
    "recoveryContractId: RECOVERY",
    "verifierId: VERIFIER",
    "gameWrites: 1",
    "unerwarteteGameWrites: 0",
    "maximaleAktionen: 1",
    "breiteRuntimeFreigabe: false",
    "zertifizierungsStufe: 'CONTROLLED_LIVE'",
    "postcondition",
  ]) assert.ok(controller.includes(marker), marker);
});

test("R19 Paste-Paket ist source-locked und ohne Fremdnetzwerk", () => {
  const guiPos = paket.indexOf("const API_NAME = 'V5TestGui'");
  const controllerPos = paket.indexOf("const API_NAME = 'V5R19TestGui'");
  assert.ok(guiPos >= 0);
  assert.ok(controllerPos > guiPos);
  assert.equal(paket.includes("fetch("), false);
  assert.equal(paket.includes("XMLHttpRequest"), false);
  assert.ok(gui.includes("Gesamtbericht kopieren"));
});


test("R19 Controlled Live erzwingt performance_trick vor Browser-Test", () => {
  assert.ok(gui.includes("aktivierePerformanceTrick"));
  assert.ok(gui.includes("performanceTrickStatus"));
  assert.ok(controller.includes("guiApi().aktivierePerformanceTrick()"));
  assert.ok(controller.includes("PERFORMANCE_TRICK_NICHT_AKTIV"));
  assert.ok(paket.includes("performance_trick"));
  assert.ok(paket.includes("HOWLER_PLAYING_TRUE"));
  assert.ok(paket.includes("aktiv: verfuegbar && audioGefunden && playing"));
});
