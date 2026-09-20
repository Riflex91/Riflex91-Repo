import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const controller=fs.readFileSync("werkzeuge/r19-soak-5m-test-gui.js","utf8");
const paket=fs.readFileSync("werkzeuge/r19-soak-5m-test-paket.js","utf8");

test("SOAK_5M besitzt echte 5-Minuten-Dauer und bounded Sampling",()=>{
  assert.ok(controller.includes("const DAUER_MS = 5 * 60 * 1000"));
  assert.ok(controller.includes("const INTERVALL_MS = 15 * 1000"));
  assert.ok(controller.includes("const MAX_SAMPLE_GAP_MS = 45 * 1000"));
  assert.ok(controller.includes("const MAX_SAMPLES = 30"));
  assert.ok(controller.includes("minimaleSamples: 20"));
});

test("SOAK_5M ist read-only und gibt breite Runtime nicht frei",()=>{
  assert.ok(controller.includes("gameplayWritesDurchHarness: 0"));
  assert.ok(controller.includes("unerwarteteGameWritesImHarness: 0"));
  assert.ok(controller.includes("breiteRuntimeFreigabe: false"));
  for(const verboten of [".equip(", ".attack(", ".move(", ".smart_move(", ".use_skill(", ".buy(", ".sell(", ".send_item(", ".send_gold("]){
    assert.equal(controller.includes(verboten),false,verboten);
  }
});

test("SOAK_5M erkennt Gaps Manipulation und fehlende Ressourcenmetriken",()=>{
  for(const marker of [
    "SAMPLE_GAPS",
    "EVIDENCE_KETTE_UNGUELTIG",
    "R19_SOAK_EVIDENCE_KETTE_MANIPULIERT",
    "HEAP_METRIK_FEHLT",
    "STORAGE_ESTIMATE_FEHLT",
    "SPEICHERRESERVE_ZU_KLEIN",
    "BROWSER_PERSISTENZ_ZU_LANGSAM",
    "HEAP_WACHSTUM_ZU_GROSS",
    "RECORDER_DROPS"
  ]) assert.ok(controller.includes(marker),marker);
});

test("SOAK_5M verlangt expliziten Operator-Start",()=>{
  assert.ok(controller.includes("R19-SOAK-5M-START"));
  assert.ok(controller.includes("bestaetigungsText: BESTAETIGUNG"));
});

test("SOAK_5M Paket ist source-locked und ohne Fremdnetzwerk",()=>{
  assert.ok(paket.indexOf("const API_NAME = 'V5TestGui'")>=0);
  assert.ok(paket.indexOf("const API_NAME = 'V5R19Soak5mGui'")>paket.indexOf("const API_NAME = 'V5TestGui'"));
  assert.equal(paket.includes("fetch("),false);
  assert.equal(paket.includes("XMLHttpRequest"),false);
});


test("SOAK_5M erzwingt und ueberwacht performance_trick",()=>{
  assert.ok(controller.includes("await guiApi().aktivierePerformanceTrick()"));
  assert.ok(controller.includes("guiApi().performanceTrickStatus()"));
  assert.ok(controller.includes("PERFORMANCE_TRICK_NICHT_AKTIV"));
  assert.ok(controller.includes("PERFORMANCE_TRICK_AUSGEFALLEN"));
  assert.ok(controller.includes("performanceTrickFehler"));
  assert.ok(controller.includes("hiddenSamples"));
  assert.ok(paket.includes("performance_trick"));
  assert.ok(paket.includes("HOWLER_PLAYING_TRUE"));
  assert.ok(paket.includes("aktiv: verfuegbar && audioGefunden && playing"));
});

test("SOAK_5M traegt keine veralteten 1h-Labels",()=>{
  assert.ok(controller.includes("kennung: 'r19-soak-5m'"));
  assert.ok(controller.includes("titel: 'V5 · R19 SOAK 5M · Canary-Scope'"));
  assert.equal(controller.includes("r19-soak-1h"),false);
  assert.equal(controller.includes("SOAK 1H"),false);
  assert.equal(paket.includes("r19-soak-1h"),false);
  assert.equal(paket.includes("SOAK 1H"),false);
});

test("SOAK_5M zeigt Restzeit ohne Sampling-Takt zu veraendern",()=>{
  assert.ok(controller.includes("gui.setzeRestzeit"));
  assert.ok(controller.includes("setInterval(aktualisiereCountdown, 1000)"));
  assert.ok(controller.includes("restzeitMs"));
  assert.ok(paket.includes("Verbleibende Testdauer"));
  assert.ok(paket.includes("v5tg-timer"));
  assert.ok(paket.includes("setzeRestzeit"));
  assert.ok(controller.includes("const INTERVALL_MS = 15 * 1000"));
});
