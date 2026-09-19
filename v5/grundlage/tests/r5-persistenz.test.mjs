import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  DateibasierterCheckpointSpeicher,
  DateibasierterDeduplizierungsSpeicher,
  DateibasierterKritischerZustellungsSpeicher,
  DateibasiertesTransaktionsJournal,
  KritischeZustellungsKoordination,
  LiveWissensDateispeicher,
  PersistVorMutationTor,
  SchemaMigrationsKatalog,
  bestimmeWiederanlauf,
  bewerteSpeicherdruck,
  parseBegrenztesVersioniertesJson,
  planeRetention,
  pruefeKritischesSpeicherziel,
  validiereJournalFolge,
} from "../../erzeugt/index.js";
import {
  NodeLiveWissensDateisystem,
  STANDARD_LIVE_WISSENS_WURZEL,
  mappeDateisystemFehler,
} from "../adapter/persistenz/node-live-wissens-dateisystem.mjs";

class SpeicherFake {
  dateien = new Map();
  schreibungen = 0;
  fehlerBeiSchreibung;
  fehler;

  constructor({ fehlerBeiSchreibung, fehler } = {}) {
    this.fehlerBeiSchreibung = fehlerBeiSchreibung;
    this.fehler = fehler;
  }

  async schreibeAtomarDurable(pfad, inhalt) {
    this.schreibungen += 1;
    if (this.schreibungen === this.fehlerBeiSchreibung) throw this.fehler;
    this.dateien.set(pfad, inhalt);
  }

  async haengeTextDurable(pfad, inhalt) {
    this.schreibungen += 1;
    if (this.schreibungen === this.fehlerBeiSchreibung) throw this.fehler;
    this.dateien.set(pfad, (this.dateien.get(pfad) ?? "") + inhalt);
  }

  async erstelleExklusivDurable(pfad, inhalt) {
    this.schreibungen += 1;
    if (this.schreibungen === this.fehlerBeiSchreibung) throw this.fehler;
    if (this.dateien.has(pfad)) return false;
    this.dateien.set(pfad, inhalt);
    return true;
  }

  async liesText(pfad) {
    return this.dateien.get(pfad);
  }

  async entferneDurable(pfad) {
    this.dateien.delete(pfad);
  }

  async listeAktuellJson() {
    return [...this.dateien.keys()]
      .filter(pfad => pfad.startsWith("aktuell/") && pfad.endsWith(".json"))
      .sort();
  }
}

const liveOptionen = {
  maximaleDateien: 100,
  maximaleEinzelBytes: 100_000,
  maximaleGesamtBytes: 1_000_000,
};

const liveGeneration = {
  schemaVersion: 1,
  generation: 1,
  aktualisiertAm: "2026-09-20T00:00:00Z",
  fakten: [
    {
      relativerPfad: "monster/frog.json",
      json: JSON.stringify({
        schemaVersion: 1,
        spiel: "Adventure Land - The Code MMORPG",
        kennung: "monster.frog.test",
        domaene: "MONSTER",
        status: "LIVE_VERIFIZIERT",
        quelle: { art: "LIVE_SPIEL" },
        wert: { x: 1, y: 2 },
      }),
    },
  ],
};

test("Schema-Migration ist vorwaerts und rueckwaerts deterministisch", () => {
  const katalog = new SchemaMigrationsKatalog([
    {
      vonVersion: 1,
      nachVersion: 2,
      migriereVorwaerts: wert => ({ ...wert, neu: "ja" }),
      migriereRueckwaerts: wert => {
        const kopie = { ...wert };
        delete kopie.neu;
        return kopie;
      },
    },
    {
      vonVersion: 2,
      nachVersion: 3,
      migriereVorwaerts: wert => ({ ...wert, zaehler: 1 }),
      migriereRueckwaerts: wert => {
        const kopie = { ...wert };
        delete kopie.zaehler;
        return kopie;
      },
    },
  ]);

  const v1 = { name: "test" };
  const v3 = katalog.migriere(v1, 1, 3);
  assert.deepEqual(v3, { name: "test", neu: "ja", zaehler: 1 });
  assert.deepEqual(katalog.migriere(v3, 3, 1), v1);
  assert.throws(() => katalog.migriere(v1, 1, 4), /MIGRATION_UNTERSTUETZTE_VERSION_FEHLT/);
});

test("lueckenhafte und unbounded Migrationstabellen werden blockiert", () => {
  assert.throws(
    () => new SchemaMigrationsKatalog([
      { vonVersion: 1, nachVersion: 2, migriereVorwaerts: wert => wert },
      { vonVersion: 3, nachVersion: 4, migriereVorwaerts: wert => wert },
    ]),
    /MIGRATION_KETTE_LUECKENHAFT/,
  );

  const zuViele = Array.from({ length: 257 }, (_, index) => ({
    vonVersion: index + 1,
    nachVersion: index + 2,
    migriereVorwaerts: wert => wert,
  }));
  assert.throws(() => new SchemaMigrationsKatalog(zuViele), /ZU_VIELE_SCHEMA_MIGRATIONEN/);
});

test("kritisches JSON ist bei Korruption Groesse und unbekanntem Schema fail-closed", () => {
  assert.equal(
    parseBegrenztesVersioniertesJson('{"schemaVersion":1,"wert":"ok"}', {
      maximaleBytes: 100,
      erlaubteSchemaVersionen: [1],
    }).wert,
    "ok",
  );
  assert.throws(
    () => parseBegrenztesVersioniertesJson("{", {
      maximaleBytes: 100,
      erlaubteSchemaVersionen: [1],
    }),
    /PERSISTENZ_JSON_KORRUPT/,
  );
  assert.throws(
    () => parseBegrenztesVersioniertesJson('{"schemaVersion":1,"wert":"zu gross"}', {
      maximaleBytes: 5,
      erlaubteSchemaVersionen: [1],
    }),
    /PERSISTENZ_GROESSE_UNGUELTIG/,
  );
  assert.throws(
    () => parseBegrenztesVersioniertesJson('{"schemaVersion":99}', {
      maximaleBytes: 100,
      erlaubteSchemaVersionen: [1],
    }),
    /PERSISTENZ_SCHEMA_NICHT_UNTERSTUETZT/,
  );
});

test("durable Intent Token entsteht nur nach erfolgreichem Journal-Append", async () => {
  const ds = new SpeicherFake();
  const journal = new DateibasiertesTransaktionsJournal(ds);
  const tor = new PersistVorMutationTor(journal);
  const intent = {
    schemaVersion: 1,
    journalId: "J-1",
    transaktionsId: "T-1",
    sequenz: 1,
    art: "INTENT",
    zeitMs: 100,
    inhalt: { art: "TEST" },
  };

  const token = await tor.persistiereIntent(intent);
  assert.deepEqual(token, {
    schemaVersion: 1,
    transaktionsId: "T-1",
    journalId: "J-1",
    sequenz: 1,
    durable: true,
  });

  const kaputt = new SpeicherFake({
    fehlerBeiSchreibung: 1,
    fehler: new Error("SPEICHER_VOLL"),
  });
  const torKaputt = new PersistVorMutationTor(
    new DateibasiertesTransaktionsJournal(kaputt),
  );
  await assert.rejects(() => torKaputt.persistiereIntent(intent), /SPEICHER_VOLL/);
});

test("Journal ist append-only, restartfest und lehnt Blind-Folgen ab", async () => {
  const ds = new SpeicherFake();
  const journalA = new DateibasiertesTransaktionsJournal(ds);
  await journalA.haengeDurableAn({
    schemaVersion: 1,
    journalId: "J-1",
    transaktionsId: "T-2",
    sequenz: 1,
    art: "INTENT",
    zeitMs: 1,
    inhalt: {},
  });
  await journalA.haengeDurableAn({
    schemaVersion: 1,
    journalId: "J-2",
    transaktionsId: "T-2",
    sequenz: 2,
    art: "UNBEKANNT",
    zeitMs: 2,
    inhalt: {},
  });

  const journalNachRestart = new DateibasiertesTransaktionsJournal(ds);
  assert.equal((await journalNachRestart.liesTransaktion("T-2")).length, 2);
  await assert.rejects(
    () => journalNachRestart.haengeDurableAn({
      schemaVersion: 1,
      journalId: "J-4",
      transaktionsId: "T-2",
      sequenz: 4,
      art: "COMMIT",
      zeitMs: 3,
      inhalt: {},
    }),
    /JOURNAL_SEQUENZ_NICHT_ERWARTET/,
  );

  assert.throws(() => validiereJournalFolge([
    {
      schemaVersion: 1,
      journalId: "X",
      transaktionsId: "T",
      sequenz: 1,
      art: "COMMIT",
      zeitMs: 1,
      inhalt: {},
    },
  ]), /JOURNAL_OHNE_INTENT/);
});

test("nichtterminaler Checkpoint darf nach Restart nur in Abgleich", async () => {
  const ds = new SpeicherFake();
  const speichern = new DateibasierterCheckpointSpeicher(ds);
  await speichern.speichereDurable({
    schemaVersion: 1,
    workflowId: "WF-1",
    checkpointId: "CP-1",
    status: "NICHT_TERMINAL",
    sequenz: 9,
    zeitMs: 500,
    zustand: { phase: "GESENDET" },
  });

  const nachRestart = new DateibasierterCheckpointSpeicher(ds);
  const checkpoint = await nachRestart.ladeLetzten("WF-1");
  assert.deepEqual(bestimmeWiederanlauf(checkpoint), {
    modus: "ABGLEICH_ERFORDERLICH",
    workflowId: "WF-1",
    checkpointId: "CP-1",
  });
});

test("Dedupe Claim bleibt nach Neustart persistent und atomar", async () => {
  const ds = new SpeicherFake();
  const a = new DateibasierterDeduplizierungsSpeicher(ds);
  const erster = await a.claimVerarbeitetDurable("EVIDENCE-1");
  assert.equal(erster.neu, true);

  const b = new DateibasierterDeduplizierungsSpeicher(ds);
  assert.equal(await b.istVerarbeitet("EVIDENCE-1"), true);
  const zweiter = await b.claimVerarbeitetDurable("EVIDENCE-1");
  assert.equal(zweiter.neu, false);
});

test("kritische Inbox und Outbox sind durable und dedupliziert", async () => {
  const ds = new SpeicherFake();
  const port = new DateibasierterKritischerZustellungsSpeicher(ds);
  const koordination = new KritischeZustellungsKoordination(port);
  const zustellung = {
    schemaVersion: 1,
    zustellId: "Z-1",
    dedupeSchluessel: "D-1",
    ziel: "ALERT",
    inhalt: { text: "kritisch" },
  };

  assert.deepEqual(await koordination.bereiteAusgehendVor(zustellung), {
    zustellId: "Z-1",
    durable: true,
  });
  await port.markiereZugestelltDurable("Z-1");

  assert.deepEqual(await koordination.verarbeiteEingehend(zustellung), {
    verarbeiten: true,
  });
  const nachRestart = new KritischeZustellungsKoordination(
    new DateibasierterKritischerZustellungsSpeicher(ds),
  );
  assert.deepEqual(await nachRestart.verarbeiteEingehend(zustellung), {
    verarbeiten: false,
  });

  await assert.rejects(
    () => port.markiereZugestelltDurable("UNBEKANNT"),
    /OUTBOX_UNBEKANNT/,
  );
});

test("Speicherdruck degradiert nichtkritische Klassen zuerst", () => {
  assert.deepEqual(bewerteSpeicherdruck(20, 100).gesperrteKlassen, []);
  assert.deepEqual(bewerteSpeicherdruck(12, 100).gesperrteKlassen, ["CACHE"]);
  assert.deepEqual(
    bewerteSpeicherdruck(8, 100).gesperrteKlassen,
    ["CACHE","TELEMETRIE"],
  );
  assert.deepEqual(
    bewerteSpeicherdruck(6, 100).gesperrteKlassen,
    ["CACHE","TELEMETRIE","REPLAY"],
  );
  assert.deepEqual(
    bewerteSpeicherdruck(4, 100).gesperrteKlassen,
    ["CACHE","TELEMETRIE","REPLAY","EVIDENZ"],
  );
  assert.equal(bewerteSpeicherdruck(1, 100).neueWertmutationenErlaubt, false);
});

test("kritisches Speicherziel verlangt D SSD passende Volume-ID und Reserve", () => {
  const gesund = {
    vorhanden: true,
    bereit: true,
    beschreibbar: true,
    laufwerk: "D:",
    volumeId: "VOL-123",
    medientyp: "SSD",
    gesamtBytes: 1000,
    freiBytes: 200,
  };
  const erwartet = {
    laufwerk: "D:",
    volumeId: "VOL-123",
    medientyp: "SSD",
    mindestFreieReserveProzent: 15,
  };

  assert.doesNotThrow(() => pruefeKritischesSpeicherziel(gesund, erwartet));
  assert.throws(
    () => pruefeKritischesSpeicherziel({ ...gesund, laufwerk: "C:" }, erwartet),
    /SPEICHER_FALSCHES_LAUFWERK/,
  );
  assert.throws(
    () => pruefeKritischesSpeicherziel({ ...gesund, volumeId: "ANDERS" }, erwartet),
    /SPEICHER_VOLUME_IDENTITAET_FALSCH/,
  );
  assert.throws(
    () => pruefeKritischesSpeicherziel({ ...gesund, medientyp: "HDD" }, erwartet),
    /SPEICHER_MEDIENTYP_FALSCH/,
  );
  assert.throws(
    () => pruefeKritischesSpeicherziel({ ...gesund, freiBytes: 149 }, erwartet),
    /SPEICHER_RESERVE_UNTERSCHRITTEN/,
  );
});

test("Retention loescht nur budgetierte nichtkritische Daten deterministisch", () => {
  const plan = planeRetention([
    { id: "cache-alt", klasse: "CACHE", bytes: 10, erstelltAmMs: 0 },
    { id: "cache-neu", klasse: "CACHE", bytes: 10, erstelltAmMs: 90 },
    { id: "tele-1", klasse: "TELEMETRIE", bytes: 5, erstelltAmMs: 90 },
  ], [
    { klasse: "CACHE", maximaleBytes: 10, maximaleAnzahl: 1, maximalesAlterMs: 50 },
    { klasse: "TELEMETRIE", maximaleBytes: 100, maximaleAnzahl: 10, maximalesAlterMs: 1000 },
  ], 100);

  assert.deepEqual(plan.loeschenIds, ["cache-alt"]);
  assert.deepEqual(plan.behaltenIds, ["cache-neu", "tele-1"]);
});

test("Live-Wissen endet nach Fehler an jedem Protokollschritt niemals BEREIT", async () => {
  const schritte = [
    "VOR_STATUS_SCHREIBT",
    "VOR_MANIFEST",
    "VOR_FAKTEN",
    "VOR_STALE_ENTFERNUNG",
    "VOR_STATUS_BEREIT",
  ];

  for (const ziel of schritte) {
    const ds = new SpeicherFake();
    const writer = new LiveWissensDateispeicher(ds, {
      ...liveOptionen,
      vorSchritt: schritt => {
        if (schritt === ziel) throw new Error("CRASH:" + ziel);
      },
    });
    await assert.rejects(
      () => writer.schreibeGenerationDurable(liveGeneration),
      new RegExp("CRASH:" + ziel),
    );

    const status = ds.dateien.get("status.json");
    if (status !== undefined) {
      assert.notEqual(JSON.parse(status).zustand, "BEREIT");
    }
  }
});

test("Disk Full und Access Denied koennen keine BEREIT-Generation vortaeuschen", async () => {
  for (const message of ["SPEICHER_VOLL","ZUGRIFF_VERWEIGERT"]) {
    const ds = new SpeicherFake({
      fehlerBeiSchreibung: 2,
      fehler: new Error(message),
    });
    const writer = new LiveWissensDateispeicher(ds, liveOptionen);
    await assert.rejects(() => writer.schreibeGenerationDurable(liveGeneration), new RegExp(message));
    assert.equal(JSON.parse(ds.dateien.get("status.json")).zustand, "SCHREIBT");
  }
});

test("Live-Wissen validiert Secrets Grenzen und entfernt stale Fakten vor BEREIT", async () => {
  const ds = new SpeicherFake();
  ds.dateien.set("aktuell/alt.json", '{"schemaVersion":1}');
  const writer = new LiveWissensDateispeicher(ds, liveOptionen);
  const result = await writer.schreibeGenerationDurable(liveGeneration);

  assert.equal(result.zustand, "BEREIT");
  assert.equal(JSON.parse(ds.dateien.get("status.json")).zustand, "BEREIT");
  assert.equal(ds.dateien.has("aktuell/alt.json"), false);
  assert.equal(ds.dateien.has("aktuell/monster/frog.json"), true);

  const secret = {
    ...liveGeneration,
    generation: 2,
    fakten: [{
      relativerPfad: "server/x.json",
      json: JSON.stringify({ schemaVersion: 1, accessToken: "nein" }),
    }],
  };
  await assert.rejects(() => writer.schreibeGenerationDurable(secret), /LIVE_WISSEN_SECRET_FELD_VERBOTEN/);
});

test("echter Node-Adapter schreibt atomar in Testwurzel ohne Produktionsfallback", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-r5-"));
  try {
    const ds = new NodeLiveWissensDateisystem({ wurzel: root, testmodus: true });
    const writer = new LiveWissensDateispeicher(ds, liveOptionen);
    await writer.schreibeGenerationDurable(liveGeneration);

    assert.equal(JSON.parse(await ds.liesText("status.json")).zustand, "BEREIT");
    assert.equal(JSON.parse(await ds.liesText("manifest.json")).format, "ADVENTURE_LAND_V5_LIVE_WISSEN");
    assert.equal((await ds.listeAktuellJson()).length, 1);

    await ds.schreibeAtomarDurable("runtime/test.json", '{"v":1}\n', "eins");
    await ds.schreibeAtomarDurable("runtime/test.json", '{"v":2}\n', "zwei");
    assert.equal(await ds.liesText("runtime/test.json"), '{"v":2}\n');

    await assert.rejects(
      () => ds.schreibeAtomarDurable("../ausbruch.json", "{}", "x"),
      /DATEISYSTEM_RELATIVER_PFAD_UNGUELTIG/,
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }

  assert.equal(
    new NodeLiveWissensDateisystem().wurzel.toUpperCase().includes("D:"),
    true,
  );
  assert.throws(
    () => new NodeLiveWissensDateisystem({ wurzel: "C:\\falsch", testmodus: false }),
    /LIVE_WISSEN_PRODUKTIONSWURZEL_UNGUELTIG/,
  );
  assert.equal(STANDARD_LIVE_WISSENS_WURZEL, "D:\\AdventureLand-V5\\wissensdatenbank");
});

test("Node-Dateifehler werden eindeutig klassifiziert", () => {
  assert.equal(mappeDateisystemFehler({ code: "ENOSPC" }).message, "SPEICHER_VOLL");
  assert.equal(mappeDateisystemFehler({ code: "EACCES" }).message, "ZUGRIFF_VERWEIGERT");
  assert.equal(mappeDateisystemFehler({ code: "EPERM" }).message, "ZUGRIFF_VERWEIGERT");
  assert.equal(mappeDateisystemFehler({ code: "EROFS" }).message, "DATEISYSTEM_NUR_LESEN");
  assert.equal(mappeDateisystemFehler({ code: "EIO" }).message, "DATEISYSTEM_IO_FEHLER");
});

test("Journal Checkpoint Dedupe und Inbox Outbox funktionieren auf echtem Dateiadapter ueber Neustart", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-r5-persist-"));
  try {
    const ds = new NodeLiveWissensDateisystem({ wurzel: root, testmodus: true });

    const journal = new DateibasiertesTransaktionsJournal(ds);
    await new PersistVorMutationTor(journal).persistiereIntent({
      schemaVersion: 1,
      journalId: "J-A",
      transaktionsId: "T-A",
      sequenz: 1,
      art: "INTENT",
      zeitMs: 1,
      inhalt: {},
    });
    assert.equal((await new DateibasiertesTransaktionsJournal(ds).liesTransaktion("T-A")).length, 1);

    const checkpoints = new DateibasierterCheckpointSpeicher(ds);
    await checkpoints.speichereDurable({
      schemaVersion: 1,
      workflowId: "WF-A",
      checkpointId: "CP-A",
      status: "NICHT_TERMINAL",
      sequenz: 1,
      zeitMs: 1,
      zustand: { phase: "X" },
    });
    assert.equal(
      bestimmeWiederanlauf(
        await new DateibasierterCheckpointSpeicher(ds).ladeLetzten("WF-A"),
      ).modus,
      "ABGLEICH_ERFORDERLICH",
    );

    const dedupeA = new DateibasierterDeduplizierungsSpeicher(ds);
    assert.equal((await dedupeA.claimVerarbeitetDurable("EV-A")).neu, true);
    assert.equal((await new DateibasierterDeduplizierungsSpeicher(ds)
      .claimVerarbeitetDurable("EV-A")).neu, false);

    const zustellung = {
      schemaVersion: 1,
      zustellId: "Z-A",
      dedupeSchluessel: "DED-A",
      ziel: "TEST",
      inhalt: { wert: 1 },
    };
    const post = new DateibasierterKritischerZustellungsSpeicher(ds);
    await post.speichereOutboxDurable(zustellung);
    await post.markiereZugestelltDurable("Z-A");
    assert.equal((await post.claimInboxDurable(zustellung)).neu, true);
    assert.equal((await new DateibasierterKritischerZustellungsSpeicher(ds)
      .claimInboxDurable(zustellung)).neu, false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
