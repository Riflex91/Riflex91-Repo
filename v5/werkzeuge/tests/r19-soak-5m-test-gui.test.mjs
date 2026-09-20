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
  assert.ok(controller.includes("guiApi().aktivierePerformanceTrick()"));
  assert.ok(controller.includes("guiApi().performanceTrickStatus()"));
  assert.ok(controller.includes("PERFORMANCE_TRICK_NICHT_AKTIV"));
  assert.ok(controller.includes("PERFORMANCE_TRICK_AUSGEFALLEN"));
  assert.ok(controller.includes("performanceTrickFehler"));
  assert.ok(controller.includes("hiddenSamples"));
  assert.ok(paket.includes("performance_trick"));
  assert.ok(paket.includes("HOWLER_PLAYING_TRUE"));
  assert.ok(paket.includes("aktiv: verfuegbar && audioGefunden && playing"));
});
