import test from "node:test";
import assert from "node:assert/strict";

import {
  GebundenerStrategischerRecommendationPort,
  erzeugeLearningEvidence,
  pinneLernDatenbasis,
} from "../../erzeugt/index.js";

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

function evidence(overrides = {}) {
  return erzeugeLearningEvidence({
    evidenceKennung: "learn-e1",
    erzeugtAmMs: 100,
    wissensSnapshotKennung: "snapshot-7",
    featureSchemaVersion: 3,
    modellKennung: "ranker",
    modellVersion: "2",
    stichproben: 500,
    metriken: {
      agreement: 0.9,
      loss: 0.2,
    },
    ...overrides,
  });
}

function kandidaten() {
  return [
    {
      kandidatId: "deterministisch-a",
      basisScore: 10,
      hardErlaubt: true,
    },
    {
      kandidatId: "learning-b",
      basisScore: 9,
      hardErlaubt: true,
    },
    {
      kandidatId: "verboten",
      basisScore: 100,
      hardErlaubt: false,
    },
  ];
}

function anfrage(overrides = {}) {
  const ev = evidence();
  const pin = pinneLernDatenbasis(ev, "data-fp-1");
  return {
    schemaVersion: 1,
    vorschlagKennung: "strategy-1",
    modus: "SHADOW",
    learningEvidence: ev,
    datenPin: pin,
    kandidaten: kandidaten(),
    lernVorschlag: {
      schemaVersion: 1,
      modellKennung: "ranker",
      modellVersion: "2",
      datenFingerprint: "data-fp-1",
      kandidatScores: [
        {
          kandidatId: "learning-b",
          scoreDelta: 2,
        },
        {
          kandidatId: "verboten",
          scoreDelta: 999,
        },
      ],
      maximalerAbsoluterScoreDelta: 5,
      gameplayAutoritaet: false,
      authorityAenderungErlaubt: false,
    },
    harteGrenzen: grenzen(),
    maximalesEvidenceAlterMs: 1_000,
    ...overrides,
  };
}

test("Strategic Recommendation bleibt Shadow und kann nur hard-erlaubte Kandidaten umsortieren", () => {
  const port = new GebundenerStrategischerRecommendationPort();
  const result = port.empfehle(anfrage(), 200);

  assert.equal(result.art, "LEARNING_EMPFEHLUNG");
  assert.equal(result.modus, "SHADOW");
  assert.equal(result.baseline.kandidatId, "deterministisch-a");
  assert.equal(result.empfehlung?.kandidatId, "learning-b");
  assert.notEqual(result.empfehlung?.kandidatId, "verboten");
  assert.equal(result.weichtVonBaselineAb, true);
  assert.equal(result.grund, "STRATEGIE_SHADOW_EMPFEHLUNG");

  assert.equal(result.anwendbarAufGameplay, false);
  assert.equal(result.direkteActionAutoritaet, false);
  assert.equal(result.gameplayAutoritaet, false);
  assert.equal(result.ausfuehrungsAutoritaet, false);
  assert.equal(result.mutationAutorisiert, false);
  assert.equal(result.safetyLockerungErlaubt, false);
  assert.equal(result.authorityAenderungErlaubt, false);
  assert.equal(result.automatischePromotion, false);
  assert.equal(result.deterministischerFallbackImmerVerfuegbar, true);
});

test("Safety-, Authority- und Operator-Deny blockieren Recommendation vor Learning", () => {
  const port = new GebundenerStrategischerRecommendationPort();

  for (const [feld, grund] of [
    ["safetyErlaubt", "SAFETY_DENY"],
    ["authorityErlaubt", "AUTHORITY_DENY"],
    ["operatorErlaubt", "OPERATOR_DENY"],
  ]) {
    const result = port.empfehle(anfrage({
      harteGrenzen: grenzen({ [feld]: false }),
    }), 200);

    assert.equal(result.art, "BLOCKIERT");
    assert.equal(result.empfehlung, null);
    assert.equal(result.grund, "STRATEGIE_HARTE_GRENZE:" + grund);
    assert.equal(result.admission.erlaubt, false);
  }
});

test("Quarantaene, Budget und Retry-Grenzen koennen durch Strategic Brain nicht gelockert werden", () => {
  const port = new GebundenerStrategischerRecommendationPort();

  for (const [feld, grund] of [
    ["quarantaeneErlaubt", "QUARANTAENE"],
    ["budgetErlaubt", "BUDGET_DENY"],
    ["retryGrenzeUnveraendert", "RETRY_GRENZE_DRIFT"],
  ]) {
    const result = port.empfehle(anfrage({
      harteGrenzen: grenzen({ [feld]: false }),
    }), 200);

    assert.equal(result.art, "BLOCKIERT");
    assert.equal(result.empfehlung, null);
    assert.equal(result.grund, "STRATEGIE_HARTE_GRENZE:" + grund);
  }
});

test("Modell- oder Datenbindung-Drift faellt deterministisch zurueck", () => {
  const port = new GebundenerStrategischerRecommendationPort();

  const result = port.empfehle(anfrage({
    lernVorschlag: {
      ...anfrage().lernVorschlag,
      modellVersion: "anderes-modell",
    },
  }), 200);

  assert.equal(result.art, "DETERMINISTISCHER_FALLBACK");
  assert.equal(result.grund, "STRATEGIE_LEARNING_BINDUNG_DRIFT");
  assert.equal(result.baseline.kandidatId, "deterministisch-a");
  assert.equal(result.empfehlung?.kandidatId, "deterministisch-a");
  assert.equal(result.empfehlung?.quelle, "DETERMINISTISCH");
});

test("stale Learning-Evidence deaktiviert nur Learning und nicht den deterministischen Fallback", () => {
  const port = new GebundenerStrategischerRecommendationPort();
  const ev = evidence({ erzeugtAmMs: 0 });
  const result = port.empfehle(anfrage({
    learningEvidence: ev,
    datenPin: pinneLernDatenbasis(ev, "data-fp-1"),
    maximalesEvidenceAlterMs: 100,
  }), 200);

  assert.equal(result.art, "DETERMINISTISCHER_FALLBACK");
  assert.equal(result.grund, "STRATEGIE_LEARNING_EVIDENCE_STALE");
  assert.equal(result.empfehlung?.kandidatId, "deterministisch-a");
});

test("ohne Learning-Vorschlag bleibt der deterministische Betrieb voll funktionsfaehig", () => {
  const port = new GebundenerStrategischerRecommendationPort();
  const result = port.empfehle(anfrage({
    lernVorschlag: null,
  }), 200);

  assert.equal(result.art, "DETERMINISTISCHER_FALLBACK");
  assert.equal(result.grund, "STRATEGIE_KEIN_LEARNING_VORSCHLAG");
  assert.equal(result.empfehlung?.kandidatId, "deterministisch-a");
  assert.equal(result.empfehlung?.quelle, "DETERMINISTISCH");
});

test("manipulierter Learning-Vorschlag erhaelt keine Authority und faellt zurueck", () => {
  const port = new GebundenerStrategischerRecommendationPort();
  const result = port.empfehle(anfrage({
    lernVorschlag: {
      ...anfrage().lernVorschlag,
      authorityAenderungErlaubt: true,
    },
  }), 200);

  assert.equal(result.art, "DETERMINISTISCHER_FALLBACK");
  assert.equal(result.grund, "STRATEGIE_LEARNING_BINDUNG_DRIFT");
  assert.equal(result.empfehlung?.quelle, "DETERMINISTISCH");
  assert.equal(result.authorityAenderungErlaubt, false);
});

test("Recommendation-only bleibt weiterhin nicht direkt auf Gameplay anwendbar", () => {
  const port = new GebundenerStrategischerRecommendationPort();
  const result = port.empfehle(anfrage({
    modus: "RECOMMENDATION_ONLY",
  }), 200);

  assert.equal(result.art, "LEARNING_EMPFEHLUNG");
  assert.equal(result.grund, "STRATEGIE_GEBUNDENE_EMPFEHLUNG");
  assert.equal(result.anwendbarAufGameplay, false);
  assert.equal(result.direkteActionAutoritaet, false);
  assert.equal(result.gameplayAutoritaet, false);
});

test("keine hard-erlaubten Kandidaten bleiben auch mit Learning ohne Auswahl", () => {
  const port = new GebundenerStrategischerRecommendationPort();
  const result = port.empfehle(anfrage({
    kandidaten: [
      {
        kandidatId: "nur-verboten",
        basisScore: 999,
        hardErlaubt: false,
      },
    ],
    lernVorschlag: {
      schemaVersion: 1,
      modellKennung: "ranker",
      modellVersion: "2",
      datenFingerprint: "data-fp-1",
      kandidatScores: [
        {
          kandidatId: "nur-verboten",
          scoreDelta: 999,
        },
      ],
      maximalerAbsoluterScoreDelta: 5,
      gameplayAutoritaet: false,
      authorityAenderungErlaubt: false,
    },
  }), 200);

  assert.equal(result.art, "DETERMINISTISCHER_FALLBACK");
  assert.equal(result.baseline.kandidatId, null);
  assert.equal(result.empfehlung?.kandidatId, null);
  assert.equal(result.empfehlung?.quelle, "DETERMINISTISCH");
});
