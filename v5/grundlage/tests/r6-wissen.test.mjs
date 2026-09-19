import test from "node:test";
import assert from "node:assert/strict";
import {
  ADVENTURE_LAND_SPIEL,
  FestGepinnterWissensZugriff,
  bewerteDriftFuerFaehigkeit,
  darfWissenslageMutationAutorisieren,
  gleicheWeltWahrheitAb,
  pinneWissensSnapshot,
  verifiziereLiveBeobachtung,
} from "../../erzeugt/index.js";

const hashA = "a".repeat(64);
const hashB = "b".repeat(64);
const hashPruefer = { istSha256Gueltig(_inhalt, erwartet) { return erwartet === hashA; } };
const grenzen = { maximaleDateien: 4, maximaleKanonischeZeichenJeDatei: 10_000 };
const datei = {
  schemaVersion: 1,
  relativerPfad: "aktuell/monster/frog.json",
  sha256: hashA,
  kanonischerInhalt: '{"schemaVersion":1,"wert":"ok"}',
};
const snapshot = {
  schemaVersion: 1,
  snapshotKennung: "wissen-1",
  generation: 7,
  quelle: "GITHUB_LIVE_SPIEGEL",
  snapshotSha256: hashA,
  autoritaet: "PLANUNGSNACHWEIS",
  ausfuehrungsAutoritaet: false,
  dateien: [datei],
};

test("WissensSnapshot wird nur nach Schema-, Hash- und Bound-Pruefung gepinnt", () => {
  const gepinnt = pinneWissensSnapshot(snapshot, hashPruefer, grenzen);
  assert.equal(gepinnt.gepinnt, true);
  assert.equal(gepinnt.ausfuehrungsAutoritaet, false);
  assert.equal(Object.isFrozen(gepinnt.dateien), true);
  assert.throws(
    () => pinneWissensSnapshot({ ...snapshot, snapshotSha256: hashB }, hashPruefer, grenzen),
    /WISSEN_SNAPSHOT_HASH_FALSCH/,
  );
  assert.throws(
    () => pinneWissensSnapshot({ ...snapshot, dateien: [datei, datei] }, hashPruefer, grenzen),
    /WISSEN_SNAPSHOT_DOPPELTER_PFAD/,
  );
  assert.throws(
    () => pinneWissensSnapshot(snapshot, hashPruefer, { ...grenzen, maximaleDateien: 0 }),
    /WISSEN_SNAPSHOT_DATEIGRENZE_UNGUELTIG/,
  );
});

test("read-only WissensZugriffPort ist an genau einen gepinnten Snapshot gebunden", () => {
  const zugriff = new FestGepinnterWissensZugriff(
    pinneWissensSnapshot(snapshot, hashPruefer, grenzen),
  );
  assert.equal(zugriff.gibGepinntenSnapshot().snapshotKennung, "wissen-1");
  assert.equal(
    zugriff.liesKanonischeDatei("wissen-1", "aktuell/monster/frog.json"),
    datei.kanonischerInhalt,
  );
  assert.throws(
    () => zugriff.liesKanonischeDatei("wissen-2", "aktuell/monster/frog.json"),
    /WISSENSZUGRIFF_SNAPSHOT_DRIFT/,
  );
  assert.equal("schreibe" in zugriff, false);
  assert.equal("loesche" in zugriff, false);
});

test("LIVE_VERIFIZIERT entsteht nur aus echter Spielbeobachtung plus fachlichem Verifier", () => {
  const beobachtung = {
    art: "BEOBACHTUNG",
    nachweisKennung: "ev-1",
    kennung: "monster.frog.hp",
    domaene: "MONSTER",
    spiel: ADVENTURE_LAND_SPIEL,
    beobachtetAmMs: 1_000,
    maximalAlterMs: 5_000,
    quelle: { art: "LIVE_SPIEL", methode: "server-event" },
    wert: { hp: 100 },
  };
  const fachlicherVerifier = {
    pruefe() {
      return { status: "BESTAETIGT", wert: { hp: 100 }, methode: "monster-hp-verifier-v1" };
    },
  };
  const result = verifiziereLiveBeobachtung(beobachtung, fachlicherVerifier, 1_100);
  assert.equal(result.status, "ERFOLG");
  assert.equal(result.wert.status, "LIVE_VERIFIZIERT");
  assert.equal(result.wert.ausfuehrungsAutoritaet, false);
  const ungueltig = verifiziereLiveBeobachtung(
    { ...beobachtung, quelle: { art: "NICHT_LIVE", methode: "annahme" } },
    fachlicherVerifier,
    1_100,
  );
  assert.equal(ungueltig.status, "FEHLER");
});

test("Definition, Beobachtung und abgeglichene Weltwahrheit bleiben getrennte Schichten", () => {
  const definition = {
    art: "DEFINITION",
    kennung: "monster.frog.hp",
    domaene: "MONSTER",
    wert: { hp: 100 },
    ausfuehrungsAutoritaet: false,
  };
  const live = {
    art: "LIVE_VERIFIZIERTER_FAKT",
    nachweisKennung: "ev-2",
    kennung: "monster.frog.hp",
    domaene: "MONSTER",
    spiel: ADVENTURE_LAND_SPIEL,
    status: "LIVE_VERIFIZIERT",
    beobachtetAmMs: 9_000,
    verifiziertAmMs: 9_100,
    maximalAlterMs: 2_000,
    quelle: { art: "LIVE_SPIEL", methode: "monster-hp-verifier-v1" },
    wert: { hp: 100 },
    autoritaet: "PLANUNGSNACHWEIS",
    ausfuehrungsAutoritaet: false,
  };
  const wahrheit = gleicheWeltWahrheitAb(definition, live, { jetztMs: () => 10_000 });
  assert.equal(definition.art, "DEFINITION");
  assert.equal(live.art, "LIVE_VERIFIZIERTER_FAKT");
  assert.equal(wahrheit.art, "ABGEGLICHENE_WELTWAHRHEIT");
  assert.equal(wahrheit.status, "BESTAETIGT");
  assert.equal(wahrheit.mutationAutorisiert, false);
  assert.equal(darfWissenslageMutationAutorisieren(wahrheit), false);
});

test("veraltete oder widerspruechliche Beobachtung bleibt fail-closed", () => {
  const definition = {
    art: "DEFINITION",
    kennung: "server.region",
    domaene: "SERVER",
    wert: { region: "EU" },
    ausfuehrungsAutoritaet: false,
  };
  const basis = {
    art: "LIVE_VERIFIZIERTER_FAKT",
    nachweisKennung: "ev-3",
    kennung: "server.region",
    domaene: "SERVER",
    spiel: ADVENTURE_LAND_SPIEL,
    status: "LIVE_VERIFIZIERT",
    beobachtetAmMs: 1_000,
    verifiziertAmMs: 1_100,
    maximalAlterMs: 100,
    quelle: { art: "LIVE_SPIEL", methode: "server-verifier-v1" },
    wert: { region: "EU" },
    autoritaet: "PLANUNGSNACHWEIS",
    ausfuehrungsAutoritaet: false,
  };
  assert.equal(gleicheWeltWahrheitAb(definition, basis, { jetztMs: () => 2_000 }).status, "VERALTET");
  assert.equal(
    gleicheWeltWahrheitAb(
      definition,
      { ...basis, maximalAlterMs: 5_000, wert: { region: "US" } },
      { jetztMs: () => 2_000 },
    ).status,
    "WIDERSPRUCH",
  );
});

test("Wissensdrift versetzt betroffene Faehigkeit fail-closed in Quarantaene", () => {
  const wissensdrift = {
    art: "HASH_DRIFT",
    betroffeneFaehigkeiten: ["bank.lagern"],
    grund: "Quelle geaendert",
  };
  const betroffen = bewerteDriftFuerFaehigkeit("bank.lagern", wissensdrift);
  assert.equal(betroffen.status, "QUARANTAENE");
  assert.equal(betroffen.automatischeFreigabe, false);
  assert.equal(betroffen.mutationAutorisiert, false);
  assert.equal(
    bewerteDriftFuerFaehigkeit("kampf.angriff", wissensdrift).status,
    "UNVERAENDERT",
  );
});
