import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const controller=fs.readFileSync("werkzeuge/r19-soak-1h-test-gui.js","utf8");
const paket=fs.readFileSync("werkzeuge/r19-soak-1h-test-paket.js","utf8");

test("SOAK_1H besitzt echte 1h-Dauer und bounded Sampling",()=>{
  assert.ok(controller.includes("const DAUER_MS = 60 * 60 * 1000"));
  assert.ok(controller.includes("const INTERVALL_MS = 30 * 1000"));
  assert.ok(controller.includes("const MAX_SAMPLE_GAP_MS = 90 * 1000"));
  assert.ok(controller.includes("const MAX_SAMPLES = 130"));
  assert.ok(controller.includes("minimaleSamples: 120"));
});

test("SOAK_1H ist read-only und gibt breite Runtime nicht frei",()=>{
  assert.ok(controller.includes("gameplayWritesDurchHarness: 0"));
  assert.ok(controller.includes("unerwarteteGameWritesImHarness: 0"));
  assert.ok(controller.includes("breiteRuntimeFreigabe: false"));
  for(const verboten of [".equip(", ".attack(", ".move(", ".smart_move(", ".use_skill(", ".buy(", ".sell(", ".send_item(", ".send_gold("]){
    assert.equal(controller.includes(verboten),false,verboten);
  }
});

test("SOAK_1H erkennt Gaps Manipulation und fehlende Ressourcenmetriken",()=>{
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

test("SOAK_1H verlangt expliziten Operator-Start",()=>{
  assert.ok(controller.includes("R19-SOAK-1H-START"));
  assert.ok(controller.includes("bestaetigungsText: BESTAETIGUNG"));
});

test("SOAK_1H Paket ist source-locked und ohne Fremdnetzwerk",()=>{
  assert.ok(paket.indexOf("const API_NAME = 'V5TestGui'")>=0);
  assert.ok(paket.indexOf("const API_NAME = 'V5R19Soak1hGui'")>paket.indexOf("const API_NAME = 'V5TestGui'"));
  assert.equal(paket.includes("fetch("),false);
  assert.equal(paket.includes("XMLHttpRequest"),false);
});
