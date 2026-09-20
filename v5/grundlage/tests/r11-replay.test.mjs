import test from "node:test";
import assert from "node:assert/strict";

import {
  BegrenzteReplayAufzeichnung,
  erzeugeReplayAusBeobachtungsEvidence,
  pruefeGoldenReplay,
  serialisiereReplaySnapshot,
} from "../../erzeugt/index.js";

function kopf() {
  return {
    schemaVersion: 1,
    buildGitSha: "a".repeat(40),
    wissensSnapshotSha256: "b".repeat(64),
    konfigurationSha256: "c".repeat(64),
  };
}

test("Golden Replay ist byte-identisch reproduzierbar", () => {
  let id = 0;
  let zeit = 100;
  const recorder = new BegrenzteReplayAufzeichnung(kopf(), {
    jetztMs: () => zeit++,
    naechsteId: () => "ID-" + (++id),
    zufall01: () => 0.5,
  }, 4);
  recorder.zeichneAuf("PLAN", { b: 2, a: 1 });
  recorder.zeichneAuf("ENTSCHEIDUNG", { wert: "x" });
  const snapshot = recorder.snapshot();
  const golden = serialisiereReplaySnapshot(snapshot);

  assert.deepEqual(pruefeGoldenReplay(snapshot, golden), {
    stimmtUeberein: true,
    erwartetZeichen: golden.length,
    istZeichen: golden.length,
  });
  assert.equal(
    pruefeGoldenReplay(snapshot, golden.replace('"wert":"x"', '"wert":"y"')).stimmtUeberein,
    false,
  );
});

test("bounded Live-Evidence laesst sich deterministisch als Replay materialisieren", () => {
  const historie = {
    schemaVersion: 1,
    art: "BEGRENZTE_BEOBACHTUNGSHISTORIE",
    maximaleEintraege: 2,
    maximaleGesamtZeichen: 10_000,
    verworfenWegenGrenze: 3,
    ausfuehrungsAutoritaet: false,
    eintraege: [
      {
        schemaVersion: 1,
        evidenceId: "E-1",
        sequenz: 4,
        kennung: "merchant.gold",
        domaene: "CHARAKTER",
        beobachtetAmMs: 100,
        quelle: "LIVE_SPIEL",
        klassifikation: "OBSERVATION_EVIDENCE",
        speicherklasse: "WARM_SSD",
        wert: { gold: 100 },
        ausfuehrungsAutoritaet: false,
      },
      {
        schemaVersion: 1,
        evidenceId: "E-2",
        sequenz: 5,
        kennung: "merchant.gold",
        domaene: "CHARAKTER",
        beobachtetAmMs: 101,
        quelle: "LIVE_SPIEL",
        klassifikation: "OBSERVATION_EVIDENCE",
        speicherklasse: "WARM_SSD",
        wert: { gold: 120 },
        ausfuehrungsAutoritaet: false,
      },
    ],
  };
  const a = erzeugeReplayAusBeobachtungsEvidence(kopf(), historie);
  const b = erzeugeReplayAusBeobachtungsEvidence(kopf(), historie);
  assert.equal(serialisiereReplaySnapshot(a), serialisiereReplaySnapshot(b));
  assert.equal(a.verworfenWegenGrenze, 3);
  assert.equal(a.eintraege.length, 2);
});
