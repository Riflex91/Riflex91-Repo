import test from "node:test";
import assert from "node:assert/strict";
import {
  ADVENTURE_LAND_SPIEL,
  BegrenzteBeobachtungsHistorie,
  bewerteWissensPromotion,
  darfLearningEvidenceMutationAutorisieren,
  erzeugeLearningEvidence,
  pinneWissensSnapshot,
  serialisiereBeobachtungsHistorie,
  verdichteZuRamArbeitsmenge,
} from "../../erzeugt/index.js";

const grenzen = {
  maximaleEintraege: 3,
  maximaleEintragZeichen: 2_000,
  maximaleGesamtZeichen: 6_000,
};

function evidence(id, sequenz, kennung, zeit, wert) {
  return {
    schemaVersion: 1,
    evidenceId: id,
    sequenz,
    kennung,
    domaene: "MARKT",
    beobachtetAmMs: zeit,
    quelle: "LIVE_SPIEL",
    klassifikation: "OBSERVATION_EVIDENCE",
    speicherklasse: "WARM_SSD",
    wert,
    ausfuehrungsAutoritaet: false,
  };
}

test("Observation-Evidence bleibt lokal bounded, monoton und kanonisch persistierbar", () => {
  const historie = new BegrenzteBeobachtungsHistorie(grenzen);
  historie.fuegeHinzu(evidence("e-1", 1, "markt.a", 100, { preis: 10 }));
  historie.fuegeHinzu(evidence("e-2", 2, "markt.b", 200, { preis: 20 }));
  historie.fuegeHinzu(evidence("e-3", 3, "markt.a", 300, { preis: 11 }));
  historie.fuegeHinzu(evidence("e-4", 4, "markt.c", 400, { preis: 30 }));

  const snapshot = historie.snapshot();
  assert.equal(snapshot.eintraege.length, 3);
  assert.equal(snapshot.verworfenWegenGrenze, 1);
  assert.equal(snapshot.eintraege[0].evidenceId, "e-2");
  assert.equal(snapshot.ausfuehrungsAutoritaet, false);
  assert.doesNotThrow(() => JSON.parse(serialisiereBeobachtungsHistorie(snapshot)));
  assert.throws(
    () => historie.fuegeHinzu(evidence("e-4", 5, "markt.x", 500, { preis: 1 })),
    /DOPPELTE_ID/,
  );
});

test("grosse Evidence-Historie wird deterministisch zu kompaktem HOT-RAM-Working-Set verdichtet", () => {
  const eingabe = [
    evidence("e-1", 1, "markt.a", 100, { preis: 10 }),
    evidence("e-2", 2, "markt.b", 200, { preis: 20 }),
    evidence("e-3", 3, "markt.a", 300, { preis: 11 }),
    evidence("e-4", 4, "markt.c", 400, { preis: 30 }),
  ];
  const arbeitsmenge = verdichteZuRamArbeitsmenge(eingabe, 2);
  assert.equal(arbeitsmenge.speicherklasse, "HOT_RAM");
  assert.equal(arbeitsmenge.quellenEintraege, 4);
  assert.equal(arbeitsmenge.eintraege.length, 2);
  assert.equal(arbeitsmenge.verworfeneKennungenWegenGrenze, 1);
  assert.equal(arbeitsmenge.eintraege[0].kennung, "markt.c");
  assert.equal(arbeitsmenge.eintraege[1].kennung, "markt.a");
  assert.equal(arbeitsmenge.eintraege[1].stichproben, 2);
  assert.equal(arbeitsmenge.ausfuehrungsAutoritaet, false);
});

test("Learning-Evidence ist explizit versioniert und kann niemals Mutation autorisieren", () => {
  const lern = erzeugeLearningEvidence({
    evidenceKennung: "lernen.markt.v1",
    erzeugtAmMs: 1_000,
    wissensSnapshotKennung: "wissen-7",
    featureSchemaVersion: 3,
    modellKennung: "markt-trend",
    modellVersion: "1.2.0",
    stichproben: 50,
    metriken: { fehler: 0.1, guete: 0.9 },
  });
  assert.equal(lern.schemaVersion, 1);
  assert.equal(lern.learningEvidenceVersion, 1);
  assert.equal(lern.featureSchemaVersion, 3);
  assert.equal(lern.gameplayAutoritaet, false);
  assert.equal(lern.ausfuehrungsAutoritaet, false);
  assert.equal(lern.automatischePromotion, false);
  assert.equal(darfLearningEvidenceMutationAutorisieren(lern), false);
});

test("ein einzelner LIVE_VERIFIZIERT Fakt darf nie automatisch zur allgemeinen Regel werden", () => {
  const einzel = bewerteWissensPromotion({
    zielKennung: "regel.monster.spawn",
    zielArt: "ALLGEMEINE_SPIELREGEL",
    liveFaktNachweise: ["live-1"],
    unabhaengigeEvidenceAnzahl: 1,
    revalidiert: true,
  });
  assert.equal(einzel.status, "ABGELEHNT");
  assert.equal(einzel.automatischePromotion, false);
  assert.equal(einzel.gameplayAutoritaet, false);

  const mehrfach = bewerteWissensPromotion({
    zielKennung: "regel.monster.spawn",
    zielArt: "ALLGEMEINE_SPIELREGEL",
    liveFaktNachweise: ["live-1", "live-2"],
    unabhaengigeEvidenceAnzahl: 2,
    revalidiert: true,
  });
  assert.equal(mehrfach.status, "PRUEFUNG_ERFORDERLICH");
  assert.equal(mehrfach.automatischePromotion, false);
});

test("GitHub-Live-Snapshot akzeptiert in aktuell nur LIVE_VERIFIZIERT plus LIVE_SPIEL und bleibt bounded", () => {
  const hash = "a".repeat(64);
  const hashPruefer = { istSha256Gueltig(_inhalt, erwartet) { return erwartet === hash; } };
  const liveFakt = {
    schemaVersion: 1,
    relativerPfad: "aktuell/monster/frog.json",
    sha256: hash,
    kanonischerInhalt:
      '{"beobachtetAm":"2026-09-20T00:00:00Z","domaene":"MONSTER","kennung":"monster.frog.hp","quelle":{"art":"LIVE_SPIEL","methode":"monster-hp-verifier-v1"},"schemaVersion":1,"spiel":"' +
      ADVENTURE_LAND_SPIEL +
      '","status":"LIVE_VERIFIZIERT","verifiziertAm":"2026-09-20T00:00:01Z","wert":{"hp":100}}',
  };
  const basis = {
    schemaVersion: 1,
    snapshotKennung: "github-live-1",
    generation: 1,
    quelle: "GITHUB_LIVE_SPIEGEL",
    snapshotSha256: hash,
    autoritaet: "PLANUNGSNACHWEIS",
    ausfuehrungsAutoritaet: false,
    dateien: [liveFakt],
  };
  assert.doesNotThrow(() => pinneWissensSnapshot(basis, hashPruefer, {
    maximaleDateien: 4,
    maximaleKanonischeZeichenJeDatei: 10_000,
  }));

  const rohtelemetrie = {
    ...liveFakt,
    relativerPfad: "aktuell/telemetrie/raw.json",
    kanonischerInhalt: '{"art":"ROHTELEMETRIE","schemaVersion":1}',
  };
  assert.throws(
    () => pinneWissensSnapshot({ ...basis, dateien: [rohtelemetrie] }, hashPruefer, {
      maximaleDateien: 4,
      maximaleKanonischeZeichenJeDatei: 10_000,
    }),
    /GITHUB_LIVE_SPIEGEL_NUR_VERIFIZIERTE_LIVE_FAKTEN/,
  );
});
