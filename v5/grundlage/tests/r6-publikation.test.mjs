import test from "node:test";
import assert from "node:assert/strict";
import {
  ADVENTURE_LAND_SPIEL,
  BegrenzteBeobachtungsHistorie,
  BeobachtungsEvidenceAblage,
  LiveWissensPublizierer,
  verifiziereLiveBeobachtung,
} from "../../erzeugt/index.js";

class LiveSpeicherFake {
  generation;

  async schreibeGenerationDurable(generation) {
    this.generation = generation;
    return {
      durable: true,
      bestaetigungsId: "live-" + generation.generation,
      generation: generation.generation,
      zustand: "BEREIT",
      dateien: generation.fakten.length,
    };
  }
}

class PersistenzFake {
  datensatz;

  async speichereDurable(datensatz) {
    this.datensatz = datensatz;
    return { durable: true, bestaetigungsId: datensatz.datensatzId };
  }

  async lade() {
    return undefined;
  }
}

const zeitText = {
  zuIsoUtc(zeitMs) {
    if (zeitMs === 1_000) return "2026-09-20T00:00:00Z";
    if (zeitMs === 1_100) return "2026-09-20T00:00:01Z";
    return "2026-09-20T00:00:02Z";
  },
};

test("nur fachlich verifizierter LIVE_SPIEL-Fakt wird als Live-Wissen publiziert", async () => {
  const beobachtung = {
    art: "BEOBACHTUNG",
    nachweisKennung: "e-1",
    kennung: "monster.frog.hp",
    domaene: "MONSTER",
    spiel: ADVENTURE_LAND_SPIEL,
    beobachtetAmMs: 1_000,
    maximalAlterMs: 5_000,
    quelle: { art: "LIVE_SPIEL", methode: "server-event" },
    wert: { hp: 100 },
  };
  const verifiziert = verifiziereLiveBeobachtung(
    beobachtung,
    {
      pruefe() {
        return {
          status: "BESTAETIGT",
          wert: { hp: 100 },
          methode: "monster-hp-verifier-v1",
        };
      },
    },
    1_100,
  );
  assert.equal(verifiziert.status, "ERFOLG");

  const speicher = new LiveSpeicherFake();
  const publizierer = new LiveWissensPublizierer(speicher, zeitText);
  const ergebnis = await publizierer.publiziereGeneration(
    2,
    "2026-09-20T00:00:02Z",
    [verifiziert.wert],
  );
  assert.equal(ergebnis.zustand, "BEREIT");
  const gespeichert = JSON.parse(speicher.generation.fakten[0].json);
  assert.equal(gespeichert.status, "LIVE_VERIFIZIERT");
  assert.equal(gespeichert.quelle.art, "LIVE_SPIEL");
  assert.equal(gespeichert.quelle.methode, "monster-hp-verifier-v1");
  assert.equal(gespeichert.beobachtetAm, "2026-09-20T00:00:00Z");
  assert.equal(gespeichert.verifiziertAm, "2026-09-20T00:00:01Z");
});

test("gefaelschter nicht verifizierter Fakt wird vor Live-Persistenz blockiert", async () => {
  const speicher = new LiveSpeicherFake();
  const publizierer = new LiveWissensPublizierer(speicher, zeitText);
  await assert.rejects(
    () => publizierer.publiziereGeneration(1, "2026-09-20T00:00:02Z", [{
      art: "LIVE_VERIFIZIERTER_FAKT",
      nachweisKennung: "e-x",
      kennung: "server.test",
      domaene: "SERVER",
      spiel: ADVENTURE_LAND_SPIEL,
      status: "UNBESTAETIGT",
      beobachtetAmMs: 1_000,
      verifiziertAmMs: 1_100,
      maximalAlterMs: 1_000,
      quelle: { art: "LIVE_SPIEL", methode: "annahme" },
      wert: {},
      autoritaet: "PLANUNGSNACHWEIS",
      ausfuehrungsAutoritaet: false,
    }]),
    /LIVE_WISSEN_NUR_VERIFIZIERTE_FAKTEN/,
  );
  assert.equal(speicher.generation, undefined);
});

test("bounded Observation-Evidence besitzt einen expliziten typisierten lokalen Persistenzpfad", async () => {
  const historie = new BegrenzteBeobachtungsHistorie({
    maximaleEintraege: 2,
    maximaleEintragZeichen: 2_000,
    maximaleGesamtZeichen: 4_000,
  });
  historie.fuegeHinzu({
    schemaVersion: 1,
    evidenceId: "e-1",
    sequenz: 1,
    kennung: "server.region",
    domaene: "SERVER",
    beobachtetAmMs: 1_000,
    quelle: "LIVE_SPIEL",
    klassifikation: "OBSERVATION_EVIDENCE",
    speicherklasse: "WARM_SSD",
    wert: { region: "EU" },
    ausfuehrungsAutoritaet: false,
  });

  const persistenz = new PersistenzFake();
  const ablage = new BeobachtungsEvidenceAblage(persistenz);
  const bestaetigung = await ablage.speichereSnapshotDurable(
    "server-region-1",
    historie.snapshot(),
  );
  assert.equal(bestaetigung.durable, true);
  assert.equal(persistenz.datensatz.art, "BEOBACHTUNGS_EVIDENCE");
  assert.equal(persistenz.datensatz.datensatzId, "beobachtung-server-region-1");
  assert.equal(JSON.parse(persistenz.datensatz.inhalt).ausfuehrungsAutoritaet, false);
});
