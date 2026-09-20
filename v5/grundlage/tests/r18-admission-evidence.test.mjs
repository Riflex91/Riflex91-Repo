import test from "node:test";
import assert from "node:assert/strict";

import {
  erzeugeLearningEvidence,
  pinneLernDatenbasis,
  pruefeLernAdmission,
} from "../../erzeugt/index.js";

const learning={
  schemaVersion:1,
  vorschlagKennung:"suggest-1",
  evidenceFingerprint:"ev-1",
  gameplayAutoritaet:false,
  authorityAenderungErlaubt:false,
  safetyLockerungErlaubt:false,
  budgetErhoehungErlaubt:false,
  quarantaeneFreigabeErlaubt:false,
  operatorDenyUeberstimmenErlaubt:false,
};

function grenzen(overrides={}){
  return {
    safetyErlaubt:true,
    authorityErlaubt:true,
    operatorErlaubt:true,
    quarantaeneErlaubt:true,
    budgetErlaubt:true,
    retryGrenzeUnveraendert:true,
    ...overrides,
  };
}

test("Learning kann Safety oder Authority nicht lockern",()=>{
  assert.equal(pruefeLernAdmission(grenzen({safetyErlaubt:false}),learning).grund,"SAFETY_DENY");
  assert.equal(pruefeLernAdmission(grenzen({authorityErlaubt:false}),learning).grund,"AUTHORITY_DENY");
});

test("Operator Deny, Quarantaene und Budget haben immer Vorrang",()=>{
  assert.equal(pruefeLernAdmission(grenzen({operatorErlaubt:false}),learning).grund,"OPERATOR_DENY");
  assert.equal(pruefeLernAdmission(grenzen({quarantaeneErlaubt:false}),learning).grund,"QUARANTAENE");
  assert.equal(pruefeLernAdmission(grenzen({budgetErlaubt:false}),learning).grund,"BUDGET_DENY");
  assert.equal(pruefeLernAdmission(grenzen({retryGrenzeUnveraendert:false}),learning).grund,"RETRY_GRENZE_DRIFT");
});

test("Manipulierter Learning-Vorschlag wird selbst bei offenen Hard Gates abgelehnt",()=>{
  const bad={...learning,operatorDenyUeberstimmenErlaubt:true};
  const r=pruefeLernAdmission(grenzen(),bad);
  assert.equal(r.erlaubt,false);
  assert.equal(r.grund,"VORSCHLAG_UNGUELTIG");
});

test("Versionierte Learning Evidence bleibt analyse-only",()=>{
  const evidence=erzeugeLearningEvidence({
    evidenceKennung:"learn-e1",
    erzeugtAmMs:100,
    wissensSnapshotKennung:"snapshot-7",
    featureSchemaVersion:3,
    modellKennung:"ranker",
    modellVersion:"2",
    stichproben:500,
    metriken:{loss:0.2,agreement:0.9},
  });
  const pin=pinneLernDatenbasis(evidence,"dataset-fp");
  assert.equal(pin.featureSchemaVersion,3);
  assert.equal(pin.gameplayAutoritaet,false);
  assert.equal(pin.mutationAutorisiert,false);
});
