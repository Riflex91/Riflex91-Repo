import test from "node:test";
import assert from "node:assert/strict";

import { ModellLiga } from "../../erzeugt/index.js";

function modell(overrides={}){
  return {
    modellKennung:"ranker",
    modellVersion:"1",
    featureSchemaVersion:3,
    datenFingerprint:"data-1",
    rolle:"CHAMPION",
    status:"AKTIV",
    generation:1,
    gameplayTrafficErlaubt:false,
    gameplayAutoritaet:false,
    ...overrides,
  };
}
function ev(overrides={}){
  return {
    schemaVersion:1,
    modellKennung:"ranker-next",
    modellVersion:"2",
    datenFingerprint:"data-2",
    stichproben:1000,
    qualitaetsVerbesserung:0.1,
    safetyVerletzungen:0,
    invariantVerletzungen:0,
    sampleGaps:0,
    evidenceFingerprint:"ev-2",
    ...overrides,
  };
}
const policy={mindestStichproben:500,minimaleQualitaetsVerbesserung:0.05};

test("Challenger startet isoliert im Shadow ohne Gameplay-Traffic",()=>{
  const liga=new ModellLiga(modell());
  const s=liga.setzeChallenger(modell({
    modellKennung:"ranker-next",
    modellVersion:"2",
    datenFingerprint:"data-2",
    rolle:"CHALLENGER",
    status:"SHADOW",
    generation:1,
  }));
  assert.equal(s.challenger.status,"SHADOW");
  assert.equal(s.challenger.gameplayTrafficErlaubt,false);
  assert.equal(s.challenger.gameplayAutoritaet,false);
});

test("Zu wenig Evidence oder Safety-Verletzung verhindert Promotion",()=>{
  const liga=new ModellLiga(modell());
  liga.setzeChallenger(modell({
    modellKennung:"ranker-next",modellVersion:"2",datenFingerprint:"data-2",
    rolle:"CHALLENGER",status:"SHADOW",
  }));
  assert.equal(liga.bewerteChallenger(ev({stichproben:100}),policy).challenger.status,"SHADOW");
  assert.equal(liga.bewerteChallenger(ev({safetyVerletzungen:1}),policy).challenger.status,"SHADOW");
  assert.throws(()=>liga.promote(),/MODELL_LIGA_PROMOTION_NICHT_ERLAUBT/);
});

test("Saubere Evidence kann explizite Promotion vorbereiten",()=>{
  const liga=new ModellLiga(modell());
  liga.setzeChallenger(modell({
    modellKennung:"ranker-next",modellVersion:"2",datenFingerprint:"data-2",
    rolle:"CHALLENGER",status:"SHADOW",
  }));
  assert.equal(liga.bewerteChallenger(ev(),policy).challenger.status,"PROMOTION_BEREIT");
  const promoted=liga.promote();
  assert.equal(promoted.champion.modellKennung,"ranker-next");
  assert.equal(promoted.champion.generation,2);
  assert.equal(promoted.champion.gameplayTrafficErlaubt,false);
  assert.equal(promoted.champion.gameplayAutoritaet,false);
});

test("Challenger kann jederzeit quarantiniert werden",()=>{
  const liga=new ModellLiga(modell());
  liga.setzeChallenger(modell({
    modellKennung:"ranker-next",modellVersion:"2",datenFingerprint:"data-2",
    rolle:"CHALLENGER",status:"SHADOW",
  }));
  assert.equal(liga.quarantiniereChallenger().challenger.status,"QUARANTAENE");
});
