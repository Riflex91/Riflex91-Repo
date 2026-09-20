import test from "node:test";
import assert from "node:assert/strict";

import {
  ModellLiga,
  erzeugeLearningEvidence,
  erzeugeStrategischeEmpfehlung,
  pinneLernDatenbasis,
} from "../../erzeugt/index.js";

const kandidaten = [
  { kandidatId: "a", basisScore: 10, hardErlaubt: true },
  { kandidatId: "b", basisScore: 9, hardErlaubt: true },
  { kandidatId: "verboten", basisScore: 100, hardErlaubt: false },
];

function grenzen(overrides = {}) {
  return {
    safetyErlaubt: true,
    authorityErlaubt: true,
    operatorErlaubt: true,
    quarantaeneErlaubt: true,
    budgetErlaubt: true,
    retryGrenzeUnveraendert: true,
    ...overrides,
  };
}

function richtlinie(overrides = {}) {
  return {
    richtlinienVersion: "strategic-v1",
    maximalesEvidenceAlterMs: 1_000,
    mindestStichproben: 50,
    maximalerLearningScoreDelta: 5,
    ...overrides,
  };
}

function modell({
  rolle = "CHAMPION",
  status = "AKTIV",
  version = "1",
  daten = "data-champion",
  generation = 1,
} = {}) {
  return {
    modellKennung: "strategic-ranker",
    modellVersion: version,
    featureSchemaVersion: 3,
    datenFingerprint: daten,
    rolle,
    status,
    generation,
    gameplayTrafficErlaubt: false,
    gameplayAutoritaet: false,
  };
}

function gebunden({
  version = "1",
  daten = "data-champion",
  erzeugtAmMs = 100,
  stichproben = 200,
  scores = [{ kandidatId: "b", scoreDelta: 2 }],
  maxDelta = 5,
} = {}) {
  const evidence = erzeugeLearningEvidence({
    evidenceKennung: "evidence-" + version + "-" + daten,
    erzeugtAmMs,
    wissensSnapshotKennung: "wissen-1",
    featureSchemaVersion: 3,
    modellKennung: "strategic-ranker",
    modellVersion: version,
    stichproben,
    metriken: {
      agreement: 0.9,
      loss: 0.1,
    },
  });
  const pin = pinneLernDatenbasis(evidence, daten);
  return {
    schemaVersion: 1,
    einfluss: {
      schemaVersion: 1,
      vorschlagKennung: "suggest-" + version + "-" + daten,
      evidenceFingerprint: "influence-" + version + "-" + daten,
      gameplayAutoritaet: false,
      authorityAenderungErlaubt: false,
      safetyLockerungErlaubt: false,
      budgetErhoehungErlaubt: false,
      quarantaeneFreigabeErlaubt: false,
      operatorDenyUeberstimmenErlaubt: false,
    },
    evidence,
    datenPin: pin,
    ranking: {
      schemaVersion: 1,
      modellKennung: "strategic-ranker",
      modellVersion: version,
      datenFingerprint: daten,
      kandidatScores: scores,
      maximalerAbsoluterScoreDelta: maxDelta,
      gameplayAutoritaet: false,
      authorityAenderungErlaubt: false,
    },
  };
}

function anfrage(overrides = {}) {
  const liga = new ModellLiga(modell()).sicht();
  return {
    kandidaten,
    harteGrenzen: grenzen(),
    modellLiga: liga,
    championVorschlag: null,
    challengerVorschlag: null,
    richtlinie: richtlinie(),
    ...overrides,
  };
}

test("RecommendationPort bleibt ohne Learning voll deterministisch", () => {
  const r = erzeugeStrategischeEmpfehlung(anfrage(), 200);

  assert.equal(r.empfohlenKandidatId, "a");
  assert.equal(r.quelle, "DETERMINISTISCH");
  assert.equal(r.deterministischerFallback.kandidatId, "a");
  assert.equal(r.recommendationPort, true);
  assert.equal(r.deterministischerFallbackImmerVerfuegbar, true);
  assert.equal(r.gameplayAutoritaet, false);
  assert.equal(r.ausfuehrungsAutoritaet, false);
  assert.equal(r.mutationAutorisiert, false);
  assert.equal(r.authorityAenderungErlaubt, false);
});

test("gebundener Champion darf nur unter hard-erlaubten Kandidaten bounded umsortieren", () => {
  const r = erzeugeStrategischeEmpfehlung(anfrage({
    championVorschlag: gebunden({
      scores: [
        { kandidatId: "verboten", scoreDelta: 999 },
        { kandidatId: "b", scoreDelta: 2 },
      ],
    }),
  }), 200);

  assert.equal(r.empfohlenKandidatId, "b");
  assert.notEqual(r.empfohlenKandidatId, "verboten");
  assert.equal(r.quelle, "CHAMPION_LEARNING_GEBUNDET");
  assert.equal(r.championErgebnis?.quelle, "LEARNING_GEBUNDET");
  assert.equal(r.deterministischerFallback.kandidatId, "a");
});

test("Hard-Deny bleibt vor RecommendationPort und gibt keine aktive Empfehlung frei", () => {
  const r = erzeugeStrategischeEmpfehlung(anfrage({
    harteGrenzen: grenzen({ operatorErlaubt: false }),
    championVorschlag: gebunden(),
  }), 200);

  assert.equal(r.empfohlenKandidatId, null);
  assert.equal(r.quelle, "GESPERRT");
  assert.equal(r.grund, "HARD_GATE_OPERATOR_DENY");
  assert.equal(r.deterministischerFallback.kandidatId, "a");
  assert.equal(r.admission.learningKannDenyNichtUeberstimmen, true);
});

test("stale, sample-arme oder zu starke Champion-Vorschlaege fallen deterministisch zurueck", () => {
  const stale = erzeugeStrategischeEmpfehlung(anfrage({
    championVorschlag: gebunden({ erzeugtAmMs: 0 }),
    richtlinie: richtlinie({ maximalesEvidenceAlterMs: 100 }),
  }), 200);
  assert.equal(stale.empfohlenKandidatId, "a");
  assert.equal(stale.quelle, "DETERMINISTISCH");

  const samples = erzeugeStrategischeEmpfehlung(anfrage({
    championVorschlag: gebunden({ stichproben: 10 }),
  }), 200);
  assert.equal(samples.empfohlenKandidatId, "a");
  assert.equal(samples.quelle, "DETERMINISTISCH");

  const delta = erzeugeStrategischeEmpfehlung(anfrage({
    championVorschlag: gebunden({ maxDelta: 6 }),
  }), 200);
  assert.equal(delta.empfohlenKandidatId, "a");
  assert.equal(delta.quelle, "DETERMINISTISCH");
});

test("Modell- oder Datenbindungsdrift kann Champion-Learning nicht aktivieren", () => {
  const r = erzeugeStrategischeEmpfehlung(anfrage({
    championVorschlag: gebunden({
      version: "2",
      daten: "data-other",
    }),
  }), 200);

  assert.equal(r.empfohlenKandidatId, "a");
  assert.equal(r.quelle, "DETERMINISTISCH");
  assert.equal(r.grund, "CHAMPION_VORSCHLAG_UNGUELTIG_FALLBACK");
});

test("Challenger wird ausschliesslich als Shadow ausgewertet und aendert Live-Empfehlung nicht", () => {
  const liga = new ModellLiga(modell());
  liga.setzeChallenger(modell({
    rolle: "CHALLENGER",
    status: "SHADOW",
    version: "2",
    daten: "data-challenger",
  }));

  const r = erzeugeStrategischeEmpfehlung(anfrage({
    modellLiga: liga.sicht(),
    challengerVorschlag: gebunden({
      version: "2",
      daten: "data-challenger",
      scores: [{ kandidatId: "b", scoreDelta: 2 }],
    }),
  }), 200);

  assert.equal(r.empfohlenKandidatId, "a");
  assert.equal(r.quelle, "DETERMINISTISCH");
  assert.equal(r.shadowErgebnis?.kandidatId, "b");
  assert.equal(r.shadowGrund, "CHALLENGER_SHADOW_AUSGEWERTET");
  assert.equal(r.shadowNurAnalyse, true);
  assert.equal(r.gameplayAutoritaet, false);
});

test("quarantinierter Challenger bleibt auch im RecommendationPort wirkungslos", () => {
  const liga = new ModellLiga(modell());
  liga.setzeChallenger(modell({
    rolle: "CHALLENGER",
    status: "SHADOW",
    version: "2",
    daten: "data-challenger",
  }));
  liga.quarantiniereChallenger();

  const r = erzeugeStrategischeEmpfehlung(anfrage({
    modellLiga: liga.sicht(),
    challengerVorschlag: gebunden({
      version: "2",
      daten: "data-challenger",
    }),
  }), 200);

  assert.equal(r.empfohlenKandidatId, "a");
  assert.equal(r.shadowErgebnis, null);
  assert.equal(r.shadowGrund, "CHALLENGER_SHADOW_UNGUELTIG");
});
