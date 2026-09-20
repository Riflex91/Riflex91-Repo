import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const gui = fs.readFileSync(
  "werkzeuge/v5-adventure-land-test-gui.js",
  "utf8",
);
const controller = fs.readFileSync(
  "werkzeuge/cap033-cap034-live-test-gui.js",
  "utf8",
);
const paket = fs.readFileSync(
  "werkzeuge/cap033-cap034-live-test-paket.js",
  "utf8",
);

test("CAP033/034 Live-Test verwendet den ratifizierten 5-Minuten-Standard", () => {
  assert.ok(controller.includes("const DAUER_MS = 5 * 60 * 1000"));
  assert.ok(controller.includes("testzeitStandard: 'FUNKTION_5M'"));
  assert.ok(controller.includes("CAP033_CAP034_FUNKTION_5M_LIVE_SHADOW"));
  assert.ok(controller.includes("gameplayWritesDurchHarness: 0"));
});

test("Shadow-Phase ist write-free und verlangt echte Live-Evidence", () => {
  for (const marker of [
    "CAP033_KEIN_GEAR_KANDIDAT_BEOBACHTET",
    "CAP034_KEIN_MUTATIONS_KANDIDAT_BEOBACHTET",
    "EVIDENCE_KETTE_UNGUELTIG",
    "SAMPLE_GAPS",
    "UNERWARTETE_MUTATIONS_Q",
    "PERFORMANCE_TRICK_AUSGEFALLEN",
    "alternativeRuntimeAktiv",
  ]) {
    assert.ok(controller.includes(marker), marker);
  }
  assert.ok(controller.includes("samples.length < 20"));
  assert.ok(controller.includes("MAX_SAMPLE_GAP_MS = 45 * 1000"));
});

test("Upgrade und Compound werden vor Controlled Live immer serverseitig nur berechnet", () => {
  assert.ok(controller.includes("rufeUpgrade(root, kandidat, true)"));
  assert.ok(controller.includes("rufeCompound(root, kandidat, true)"));
  assert.ok(controller.includes("MIN_PREVIEW_CHANCE = 0.99"));
  assert.ok(controller.includes("PREVIEW_CHANCE_UNTER_TESTGRENZE"));
  assert.ok(controller.includes("previewVerbrauchtNichts: true"));
});

test("Controlled Live besitzt pro geladenem Harness nur einen globalen Mutations-Send", () => {
  for (const marker of [
    "let sendVerbraucht = false",
    "CAP034_ONE_SHOT_BEREITS_VERBRAUCHT",
    "sendVerbraucht = true",
    "maximaleAktionen: 1",
    "sameIntentRetry: false",
    "KANDIDAT_DRIFT_SEIT_PREVIEW",
    "FRISCHE_PREVIEW_BLOCKIERT_ODER_DRIFT",
  ]) {
    assert.ok(controller.includes(marker), marker);
  }
  assert.equal(controller.includes("sameIntentRetry: true"), false);
});

test("Upgrade und Compound verlangen getrennte explizite Verlustbestaetigungen", () => {
  assert.ok(controller.includes(
    "CAP034-UPGRADE-ONE-SHOT-ITEMVERLUST-AKZEPTIERT",
  ));
  assert.ok(controller.includes(
    "CAP034-COMPOUND-ONE-SHOT-3-ITEM-VERLUST-AKZEPTIERT",
  ));
  assert.ok(controller.includes(
    "bestaetigungsText: UPGRADE_BESTAETIGUNG",
  ));
  assert.ok(controller.includes(
    "bestaetigungsText: COMPOUND_BESTAETIGUNG",
  ));
});

test("Mutation wird durable gejournalt und ungeklaerte Ausgaenge werden nie wiederholt", () => {
  for (const marker of [
    "AIO_V5_CAP034_MUTATION_JOURNAL_V1",
    "VORHERIGE_MUTATION_UNGEKLAERT",
    "status: 'INTENT'",
    "sendVersuche: 1",
    "UNGEKLAERT_TIMEOUT",
    "KEIN Retry",
    "sameIntentRetry: false",
  ]) {
    assert.ok(controller.includes(marker), marker);
  }
});

test("Postcondition unterscheidet Upgrade- und Compound-Erfolg sowie Verlust", () => {
  for (const marker of [
    "BESTAETIGT_ERFOLG",
    "BESTAETIGT_ERWARTETER_FEHLER_ODER_VERLUST",
    "BESTAETIGT_COMPOUND_VERLUST",
    "NICHT_AUSGEFUEHRT",
    "UNGEKLAERT",
    "qGesehen",
  ]) {
    assert.ok(controller.includes(marker), marker);
  }
});

test("Live-Harness enthaelt keine anderen Gameplay-Mutationen", () => {
  for (const verboten of [
    ".attack(",
    ".move(",
    ".smart_move(",
    ".use_skill(",
    ".equip(",
    ".unequip(",
    ".buy(",
    ".sell(",
    ".trade_buy(",
    ".trade_sell(",
    ".bank_store(",
    ".bank_retrieve(",
    ".exchange(",
    ".craft(",
    ".dismantle(",
    ".send_item(",
    ".send_gold(",
    ".send_cm(",
  ]) {
    assert.equal(controller.includes(verboten), false, verboten);
  }
  assert.equal((controller.match(/root\.upgrade\s*\(/g) ?? []).length, 1);
  assert.equal((controller.match(/root\.compound\s*\(/g) ?? []).length, 1);
});

test("Paste-Paket ist source-locked und ohne Fremdnetzwerk", () => {
  const guiPos = paket.indexOf("const API_NAME = 'V5TestGui'");
  const controllerPos = paket.indexOf(
    "const API_NAME = 'V5Cap033034LiveTest'",
  );
  assert.ok(guiPos >= 0);
  assert.ok(controllerPos > guiPos);
  assert.equal(paket.includes("fetch("), false);
  assert.equal(paket.includes("XMLHttpRequest"), false);
  assert.ok(gui.includes("Gesamtbericht kopieren"));
  assert.ok(paket.includes("CAP033034-5M-LIVE-SHADOW-START"));
});

test("Test-Harness stoppt alte Gameplay-Runtimes vor dem Live-Lauf", () => {
  assert.ok(controller.includes("stoppeAltRuntime"));
  assert.ok(controller.includes("ALTERNATIVE_RUNTIME_AKTIV"));
  assert.ok(controller.includes("runtime-stoppen"));
  assert.ok(controller.includes("await guiApi().aktivierePerformanceTrick()"));
});
