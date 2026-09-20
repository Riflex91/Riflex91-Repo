import test from "node:test";
import assert from "node:assert/strict";

import {
  waehleDeterministisch,
  waehleMitGebundenemLearning,
} from "../../erzeugt/index.js";

const kandidaten=[
  {kandidatId:"a",basisScore:10,hardErlaubt:true},
  {kandidatId:"b",basisScore:9,hardErlaubt:true},
  {kandidatId:"verboten",basisScore:100,hardErlaubt:false},
];

test("Deterministischer Fallback funktioniert ohne Learning",()=>{
  const r=waehleDeterministisch(kandidaten);
  assert.equal(r.kandidatId,"a");
  assert.equal(r.quelle,"DETERMINISTISCH");
  assert.equal(r.fallbackImmerVerfuegbar,true);
});

test("Learning darf harte Kandidatenfreigabe niemals lockern",()=>{
  const r=waehleMitGebundenemLearning(kandidaten,{
    schemaVersion:1,
    modellKennung:"ranker",
    modellVersion:"1",
    datenFingerprint:"data-1",
    kandidatScores:[
      {kandidatId:"verboten",scoreDelta:999},
      {kandidatId:"b",scoreDelta:2},
    ],
    maximalerAbsoluterScoreDelta:5,
    gameplayAutoritaet:false,
    authorityAenderungErlaubt:false,
  });
  assert.equal(r.kandidatId,"b");
  assert.notEqual(r.kandidatId,"verboten");
  assert.equal(r.quelle,"LEARNING_GEBUNDET");
});

test("Learning Score Delta bleibt hart begrenzt",()=>{
  const r=waehleMitGebundenemLearning(kandidaten,{
    schemaVersion:1,
    modellKennung:"ranker",
    modellVersion:"1",
    datenFingerprint:"data-1",
    kandidatScores:[{kandidatId:"b",scoreDelta:9999}],
    maximalerAbsoluterScoreDelta:0.5,
    gameplayAutoritaet:false,
    authorityAenderungErlaubt:false,
  });
  assert.equal(r.kandidatId,"a");
});

test("Ungueltiger Learning-Vorschlag faellt deterministisch zurueck",()=>{
  const r=waehleMitGebundenemLearning(kandidaten,{
    schemaVersion:1,
    modellKennung:"ranker",
    modellVersion:"1",
    datenFingerprint:"data-1",
    kandidatScores:[],
    maximalerAbsoluterScoreDelta:1,
    gameplayAutoritaet:false,
    authorityAenderungErlaubt:true,
  });
  assert.equal(r.kandidatId,"a");
  assert.equal(r.quelle,"DETERMINISTISCH");
});
