import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const controller=fs.readFileSync("werkzeuge/r19-soak-10m-test-gui.js","utf8");
const paket=fs.readFileSync("werkzeuge/r19-soak-10m-test-paket.js","utf8");

test("SOAK_10M besitzt echtes 10-Minuten-Profil und bounded Sampling",()=>{
  assert.ok(controller.includes("const DAUER_MS = 10 * 60 * 1000"));
  assert.ok(controller.includes("const INTERVALL_MS = 30 * 1000"));
  assert.ok(controller.includes("const MAX_SAMPLE_GAP_MS = 90 * 1000"));
  assert.ok(controller.includes("const MAX_SAMPLES = 30"));
  assert.ok(controller.includes("minimaleSamples: 20"));
});

test("SOAK_10M ist read-only und gibt breite Runtime nicht frei",()=>{
  assert.ok(controller.includes("gameplayWritesDurchHarness: 0"));
  assert.ok(controller.includes("unerwarteteGameWritesImHarness: 0"));
  assert.ok(controller.includes("breiteRuntimeFreigabe: false"));
  for(const verboten of [".equip(", ".attack(", ".move(", ".smart_move(", ".use_skill(", ".buy(", ".sell(", ".send_item(", ".send_gold("]){
    assert.equal(controller.includes(verboten),false,verboten);
  }
});

test("SOAK_10M erzwingt Evidence Gaps Ressourcen und performance_trick",()=>{
  for(const marker of [
    "SAMPLE_GAPS","EVIDENCE_KETTE_UNGUELTIG","R19_SOAK_EVIDENCE_KETTE_MANIPULIERT",
    "HEAP_METRIK_FEHLT","STORAGE_ESTIMATE_FEHLT","SPEICHERRESERVE_ZU_KLEIN",
    "BROWSER_PERSISTENZ_ZU_LANGSAM","HEAP_WACHSTUM_ZU_GROSS","RECORDER_DROPS",
    "PERFORMANCE_TRICK_NICHT_AKTIV","PERFORMANCE_TRICK_AUSGEFALLEN","performanceTrickFehler"
  ]) assert.ok(controller.includes(marker),marker);
  assert.ok(controller.includes("await guiApi().aktivierePerformanceTrick()"));
  assert.ok(controller.includes("guiApi().performanceTrickStatus()"));
});

test("SOAK_10M verlangt expliziten Operator-Start und zeigt Countdown",()=>{
  assert.ok(controller.includes("R19-SOAK-10M-START"));
  assert.ok(controller.includes("bestaetigungsText: BESTAETIGUNG"));
  assert.ok(controller.includes("gui.setzeRestzeit"));
  assert.ok(controller.includes("setInterval(aktualisiereCountdown, 1000)"));
  assert.ok(paket.includes("Verbleibende Testdauer"));
  assert.ok(paket.includes("v5tg-timer"));
});

test("SOAK_10M Paket ist source-locked und ohne Fremdnetzwerk",()=>{
  assert.ok(paket.indexOf("const API_NAME = 'V5TestGui'")>=0);
  assert.ok(paket.indexOf("const API_NAME = 'V5R19Soak10mGui'")>paket.indexOf("const API_NAME = 'V5TestGui'"));
  assert.equal(paket.includes("fetch("),false);
  assert.equal(paket.includes("XMLHttpRequest"),false);
});
