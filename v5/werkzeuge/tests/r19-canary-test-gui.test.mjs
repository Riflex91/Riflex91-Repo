import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const controller=fs.readFileSync("werkzeuge/r19-canary-test-gui.js","utf8");
const paket=fs.readFileSync("werkzeuge/r19-canary-test-paket.js","utf8");

test("Canary verlangt eigene manuelle Bestaetigung und exakt einen equip-Write",()=>{
  assert.ok(controller.includes("R19-CANARY-EQUIP-ONCE"));
  assert.ok(controller.includes("zertifizierungsStufe: 'CANARY'"));
  assert.ok(controller.includes("manuelleBestaetigung: true"));
  assert.equal((controller.match(/\.equip\s*\(/g)??[]).length,1);
});

test("Canary Learning bleibt bounded und authority-frei",()=>{
  for(const marker of [
    "r19-canary-bounded-test-ranker",
    "maximalerAbsoluterScoreDelta: MAX_DELTA",
    "gameplayAutoritaet: false",
    "authorityAenderungErlaubt: false",
    "safetyLockerungErlaubt: false",
    "deterministischerFallbackIndex",
    "hardErlaubteKandidaten"
  ]) assert.ok(controller.includes(marker),marker);
});

test("Canary Learning waehlt ausschliesslich aus hard-erlaubten Equip-Kandidaten",()=>{
  assert.ok(controller.includes("hardErlaubt: true"));
  assert.ok(controller.includes("const bewertet = hardErlaubt.map"));
  assert.ok(controller.includes("const learning = [...bewertet]"));
});

test("Canary behaelt No-Retry und breite Runtime-Sperre",()=>{
  assert.ok(controller.includes("sameIntentRetry: false"));
  assert.equal(controller.includes("sameIntentRetry: true"),false);
  assert.ok(controller.includes("breiteRuntimeFreigabe: false"));
  assert.ok(controller.includes("R19_CANARY_ONE_SHOT_BEREITS_VERBRAUCHT"));
});

test("Canary Paket ist source-locked und ohne Fremdnetzwerk",()=>{
  assert.ok(paket.indexOf("const API_NAME = 'V5TestGui'")>=0);
  assert.ok(paket.indexOf("const API_NAME = 'V5R19CanaryGui'")>paket.indexOf("const API_NAME = 'V5TestGui'"));
  assert.equal(paket.includes("fetch("),false);
  assert.equal(paket.includes("XMLHttpRequest"),false);
});


test("Canary erzwingt performance_trick vor dem One-Shot",()=>{
  assert.ok(controller.includes("await guiApi().aktivierePerformanceTrick()"));
  assert.ok(controller.includes("PERFORMANCE_TRICK_NICHT_AKTIV"));
  assert.ok(paket.includes("performance_trick"));
  assert.ok(paket.includes("HOWLER_PLAYING_TRUE"));
  assert.ok(paket.includes("aktiv: verfuegbar && audioGefunden && playing"));
});
