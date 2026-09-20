import test from "node:test";
import assert from "node:assert/strict";

import {
  EncounterLedger,
  FarmerFsm,
  pinneThreatCcEvidence,
  pruefeAoeSafety,
} from "../../erzeugt/index.js";

function threat(id, dpsFactor = 1) {
  return pinneThreatCcEvidence({
    schemaVersion: 1,
    entityId: id,
    entityFingerprint: "spawn-" + id,
    map: "main",
    instanz: "main",
    beobachtetAmMs: 100,
    visible: true,
    tot: false,
    targetCharacterId: "warrior",
    conditions: [],
    immune: false,
    attack: 100 * dpsFactor,
    range: 40,
    frequency: 1,
    evidenceFingerprint: "threat-" + id,
  }, 500);
}

test("Threat/CC Evidence ist volatil und Raw Target bleibt keine Ownership", () => {
  const pin = threat("m1");
  assert.equal(pin.targetCharacterId, "warrior");
  assert.equal(pin.rawTargetIstOwnership, false);
  assert.equal(pin.erwarteterBasisDps, 100);
});

test("AoE Learning darf Hard Caps niemals lockern", () => {
  const targets = [threat("m1"), threat("m2"), threat("m3")];
  const denied = pruefeAoeSafety({
    jetztMs: 200,
    hp: 900,
    maxHp: 1000,
    targets,
    hardCaps: {
      maximalTargets: 2,
      maximalErwarteterBasisDps: 1000,
      minimaleHpQuote: 0.5,
    },
    learning: { empfohleneMaxTargets: 99, evidenceFingerprint: "learn-fp" },
  });
  assert.equal(denied.erlaubt, false);
  assert.equal(denied.effektivesTargetLimit, 2);
  assert.equal(denied.learningKannHardCapsNichtLockern, true);
});

test("AoE stale Target blockiert fail-closed", () => {
  assert.equal(pruefeAoeSafety({
    jetztMs: 700,
    hp: 900,
    maxHp: 1000,
    targets: [threat("m1")],
    hardCaps: {
      maximalTargets: 2,
      maximalErwarteterBasisDps: 1000,
      minimaleHpQuote: 0.5,
    },
    learning: null,
  }).grund, "STALE_TARGET");
});

test("Encounter Outcomes werden genau einmal dedupliziert auch nach Restart", () => {
  const alt = new EncounterLedger();
  alt.starte({
    schemaVersion: 1,
    encounterId: "enc-1",
    ownerAblaufId: "wf-1",
    characterId: "warrior",
    targetEntityId: "m1",
    targetFingerprint: "spawn-m1",
    gestartetAmMs: 100,
  });
  alt.beende("enc-1", "outcome-1");
  assert.equal(alt.beende("enc-1", "outcome-1").outcomeFingerprint, "outcome-1");
  assert.throws(() => alt.beende("enc-1", "outcome-2"), /ENCOUNTER_OUTCOME_WIDERSPRUCH/);

  const neu = new EncounterLedger();
  neu.importiereNachRestart(alt.snapshot());
  assert.equal(neu.beende("enc-1", "outcome-1").status, "ABGESCHLOSSEN");
});

test("Farmer FSM ist bounded und BLOCKED-Loops fail-closed", () => {
  const fsm = new FarmerFsm("wf-farm", "warrior", 100, 2);
  fsm.transition("ZIEL_SUCHE");
  fsm.transition("BLOCKED");
  fsm.transition("BLOCKED");
  const failed = fsm.transition("BLOCKED");
  assert.equal(failed.zustand, "FAILED_SAFE");
  assert.equal(failed.gameplayAutoritaet, false);
  assert.equal(failed.rawWriteAutoritaet, false);
});
