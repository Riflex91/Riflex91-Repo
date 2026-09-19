import test from "node:test";
import assert from "node:assert/strict";
import {
  BegrenzteReplayAufzeichnung,
  BegrenzteWarteschlange,
  DeterministischerKennungsGenerator,
  DomaenenEreignisErzeuger,
  GeschlossenerZustandsautomat,
  MonotoneSequenz,
  SimulierteUhr,
  XorShift32Zufall,
  erfolg,
  fehler,
  fuehreDeterministischesSzenarioAus,
  hatVorrang,
  istDeadlineAbgelaufen,
  istFrisch,
  istTtlGueltig,
  kanonischSerialisieren,
  prioritaetsRang,
  serialisiereReplaySnapshot,
  unbekannt,
  validiereReplaySnapshot,
} from "../../erzeugt/index.js";

test("gleiche Clock/Seed/IDs erzeugen denselben Szenario-Eventstrom", () => {
  const eingabe = {
    seed: 123456789,
    startZeitMs: 1_700_000_000_000,
    korrelationsId: "KORR-1",
    optionen: ["A", "B", "C", "D"],
  };

  const eins = fuehreDeterministischesSzenarioAus(eingabe);
  const zwei = fuehreDeterministischesSzenarioAus(eingabe);

  assert.equal(eins, zwei);
});

test("simulierte Uhr ist injizierbar und kontrolliert", () => {
  const uhr = new SimulierteUhr(100);
  assert.equal(uhr.jetztMs(), 100);
  assert.equal(uhr.schreiteVor(25), 125);
  uhr.stelleAuf(500);
  assert.equal(uhr.jetztMs(), 500);
  assert.throws(() => uhr.schreiteVor(-1), /UHR_DELTA_UNGUELTIG/);
});

test("seedbarer Zufall ist reproduzierbar", () => {
  const a = new XorShift32Zufall(42);
  const b = new XorShift32Zufall(42);
  const folgeA = [a.zufall01(), a.zufall01(), a.zufall01(), a.zufall01()];
  const folgeB = [b.zufall01(), b.zufall01(), b.zufall01(), b.zufall01()];
  assert.deepEqual(folgeA, folgeB);
});

test("Kennungen und Sequenzen sind reproduzierbar", () => {
  const idsA = new DeterministischerKennungsGenerator("TEST");
  const idsB = new DeterministischerKennungsGenerator("TEST");
  const seqA = new MonotoneSequenz();
  const seqB = new MonotoneSequenz();

  assert.equal(idsA.naechsteId("EREIGNIS"), idsB.naechsteId("EREIGNIS"));
  assert.equal(idsA.naechsteId("EREIGNIS"), idsB.naechsteId("EREIGNIS"));
  assert.equal(seqA.naechsteSequenz(), seqB.naechsteSequenz());
  assert.equal(seqA.naechsteSequenz(), seqB.naechsteSequenz());
});

test("Erfolg Fehler und Unbekannt sind getrennte Resultatklassen", () => {
  assert.deepEqual(erfolg({ wert: 1 }), { status: "ERFOLG", wert: { wert: 1 } });
  assert.deepEqual(fehler("NICHT_ERLAUBT"), { status: "FEHLER", fehler: "NICHT_ERLAUBT" });
  assert.deepEqual(unbekannt("ANTWORT_VERLOREN"), {
    status: "UNBEKANNT",
    grund: "ANTWORT_VERLOREN",
    abgleichErforderlich: true,
  });
});

test("Freshness Deadline und TTL haben exakte Grenzen", () => {
  const uhr = new SimulierteUhr(1_000);
  assert.equal(istFrisch({ beobachtetAmMs: 900, maximalAlterMs: 100 }, uhr), true);
  assert.equal(istFrisch({ beobachtetAmMs: 899, maximalAlterMs: 100 }, uhr), false);
  assert.equal(istDeadlineAbgelaufen(1_000, uhr), false);
  assert.equal(istDeadlineAbgelaufen(999, uhr), true);
  assert.equal(istTtlGueltig(900, 100, uhr), true);
  assert.equal(istTtlGueltig(900, 99, uhr), false);
});

test("Prioritaetsklassen sind stabil geordnet", () => {
  assert.equal(prioritaetsRang("SICHERHEIT"), 0);
  assert.equal(hatVorrang("SICHERHEIT", "NORMAL"), true);
  assert.equal(hatVorrang("NIEDRIG", "NORMAL"), false);
});

test("bounded Queue verweigert Ueberlauf deterministisch", () => {
  const queue = new BegrenzteWarteschlange(2);
  assert.equal(queue.legeAb("eins"), true);
  assert.equal(queue.legeAb("zwei"), true);
  assert.equal(queue.legeAb("drei"), false);
  assert.deepEqual(queue.snapshot(), ["eins", "zwei"]);
  assert.equal(queue.entnehme(), "eins");
  assert.equal(queue.entnehme(), "zwei");
  assert.equal(queue.entnehme(), undefined);
});

test("kanonische Serialisierung ist unabhaengig von Objektschluessel-Reihenfolge", () => {
  const a = kanonischSerialisieren({ z: 3, a: { y: 2, x: 1 } });
  const b = kanonischSerialisieren({ a: { x: 1, y: 2 }, z: 3 });
  assert.equal(a, b);
  assert.equal(a, '{"a":{"x":1,"y":2},"z":3}');
  assert.throws(() => kanonischSerialisieren({ x: undefined }), /SERIALISIERUNG_UNDEFINED_VERBOTEN/);
  assert.throws(() => kanonischSerialisieren({ x: Number.NaN }), /SERIALISIERUNG_ZAHL_UNGUELTIG/);
});

test("Domain Events sind immutable und tragen stabile Korrelation/Kausalitaet", () => {
  const uhr = new SimulierteUhr(100);
  const ids = new DeterministischerKennungsGenerator("DOM");
  const seq = new MonotoneSequenz();
  const erzeuger = new DomaenenEreignisErzeuger(uhr, ids, seq);

  const start = erzeuger.erzeuge("START", "KORR-1", { daten: { wert: 1 } });
  uhr.schreiteVor(1);
  const folge = erzeuger.erzeuge("FOLGE", "KORR-1", { ok: true }, start.ereignisId);

  assert.equal(start.sequenz, 1);
  assert.equal(folge.sequenz, 2);
  assert.equal(folge.kausalitaetsId, start.ereignisId);
  assert.equal(folge.korrelationsId, "KORR-1");
  assert.equal(Object.isFrozen(start), true);
  assert.equal(Object.isFrozen(start.inhalt), true);
  assert.equal(Object.isFrozen(start.inhalt.daten), true);
});

test("geschlossener Automat akzeptiert nur deklarierte Uebergaenge", () => {
  const automat = new GeschlossenerZustandsautomat({
    kennung: "TEST-AUTOMAT",
    start: "A",
    zustaende: ["A", "B", "C"],
    uebergaenge: [
      { von: "A", nach: "B" },
      { von: "B", nach: "C" },
    ],
    terminal: ["C"],
  });

  assert.equal(automat.aktuell(), "A");
  assert.equal(automat.wechsle("B"), "B");
  assert.throws(() => automat.wechsle("A"), /UNDEKLARIERTER_UEBERGANG/);
  assert.equal(automat.wechsle("C"), "C");
  assert.equal(automat.istTerminal(), true);
});

test("Replay-Format ist kanonisch und erkennt Sequenz-/Provenienzfehler", () => {
  let id = 0;
  let zeit = 100;
  const recorder = new BegrenzteReplayAufzeichnung(
    {
      schemaVersion: 1,
      buildGitSha: "a".repeat(40),
      wissensSnapshotSha256: "b".repeat(64),
      konfigurationSha256: "c".repeat(64),
    },
    {
      jetztMs: () => zeit++,
      naechsteId: () => "replay-" + (++id),
      zufall01: () => 0.5,
    },
    3,
  );

  recorder.zeichneAuf("PLAN", { z: 2, a: 1 });
  recorder.zeichneAuf("EREIGNIS", { wert: "x" });
  const snapshot = recorder.snapshot();

  assert.doesNotThrow(() => validiereReplaySnapshot(snapshot));
  const eins = serialisiereReplaySnapshot(snapshot);
  const zwei = serialisiereReplaySnapshot(snapshot);
  assert.equal(eins, zwei);

  assert.throws(() => validiereReplaySnapshot({
    ...snapshot,
    kopf: { ...snapshot.kopf, buildGitSha: "zu-kurz" },
  }), /REPLAY_BUILD_SHA_UNGUELTIG/);

  assert.throws(() => validiereReplaySnapshot({
    ...snapshot,
    eintraege: [
      snapshot.eintraege[0],
      { ...snapshot.eintraege[1], sequenz: 3 },
    ],
  }), /REPLAY_SEQUENZ_LUECKE/);
});
