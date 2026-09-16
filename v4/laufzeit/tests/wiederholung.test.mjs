import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GoldenerWiederholungsSatz,
  WiederholungsMaschine,
  berechneSha256,
  ladeWiederholungsEreignisse,
  ladeWiederholungsSegment,
  ladeWiederholungsSegmente,
  ladeWiederholungsZustaende,
  vergleicheWiederholungsLaeufe
} from '../erzeugt/index.js';

const vorfallRegeln = Object.freeze({
  stillstandNachMillisekunden: 30_000,
  schleifenFensterMillisekunden: 60_000,
  schleifenWiederholungen: 3,
  schleifenMusterLaengeMax: 3
});

function zustand(laufendeNummer, aufgenommenAm, ablaufKennung) {
  return Object.freeze({
    schemaVersion: 2,
    laufendeNummer,
    aufgenommenAm,
    ablaufKennung,
    beobachtet: Object.freeze({}),
    abgeleitet: Object.freeze({}),
    gelernt: Object.freeze([])
  });
}

function basisDatensatz(aenderungen = {}) {
  return Object.freeze({
    schemaVersion: 1,
    kennung: 'datensatz-1',
    erstelltAm: 50_000,
    zustaende: Object.freeze([
      Object.freeze({ charakterKennung: 'Alpha', zustand: zustand(1, 1_000, 'ablauf-alpha') }),
      Object.freeze({ charakterKennung: 'Beta', zustand: zustand(1, 1_000, 'ablauf-beta') })
    ]),
    ereignisse: Object.freeze([]),
    ablaufBeobachtungen: Object.freeze([]),
    vorfallRegeln,
    kontingentSchritte: Object.freeze([]),
    telemetrieDauerzustand: null,
    leistungsZeitraeume: Object.freeze([]),
    ...aenderungen
  });
}

function entscheiderMitWert(wert, sicherheitszustand = 'sicher') {
  return (kontext) => Object.freeze({
    kennung: `entscheidung-${kontext.spielzustand.laufendeNummer}`,
    zeitpunkt: kontext.jetzt,
    charakterKennung: kontext.charakterKennung,
    entscheidung: wert >= 2 ? 'neue-strategie' : 'alte-strategie',
    grund: 'Deterministische Testentscheidung.',
    sicherheitszustand,
    bewertungsWert: wert,
    details: Object.freeze({ laufendeNummer: kontext.spielzustand.laufendeNummer })
  });
}

test('gleiche Eingaben und gleiche Logik erzeugen denselben Verhaltens-Fingerabdruck', () => {
  const maschine = new WiederholungsMaschine();
  const datensatz = basisDatensatz();
  const a = maschine.fuehreAus(datensatz, 'stand-a', entscheiderMitWert(1));
  const b = maschine.fuehreAus(datensatz, 'stand-b', entscheiderMitWert(1));
  assert.equal(a.eingabeFingerabdruck, b.eingabeFingerabdruck);
  assert.equal(a.ausgabeFingerabdruck, b.ausgabeFingerabdruck);
  assert.equal(vergleicheWiederholungsLaeufe(a, b).identisch, true);
});

test('Mehrcharakter-Wiederholung trennt Charaktere deterministisch', () => {
  const lauf = new WiederholungsMaschine().fuehreAus(basisDatensatz(), 'mehrcharakter', entscheiderMitWert(1));
  assert.deepEqual(lauf.entscheidungen.map((eintrag) => eintrag.charakterKennung), ['Alpha', 'Beta']);
  assert.equal(new Set(lauf.entscheidungen.map((eintrag) => `${eintrag.charakterKennung}:${eintrag.kennung}`)).size, 2);
});

test('Vorher-Nachher-Vergleich erkennt Verbesserung und Verschlechterung', () => {
  const maschine = new WiederholungsMaschine();
  const datensatz = basisDatensatz();
  const alt = maschine.fuehreAus(datensatz, 'alt', entscheiderMitWert(1));
  const besser = maschine.fuehreAus(datensatz, 'besser', entscheiderMitWert(2));
  const schlechter = maschine.fuehreAus(datensatz, 'schlechter', entscheiderMitWert(0));
  assert.equal(vergleicheWiederholungsLaeufe(alt, besser).verbesserungen, 2);
  assert.equal(vergleicheWiederholungsLaeufe(alt, schlechter).verschlechterungen, 2);
});

test('Vorher-Nachher-Vergleich markiert neue Sicherheitsverletzungen', () => {
  const maschine = new WiederholungsMaschine();
  const datensatz = basisDatensatz();
  const sicher = maschine.fuehreAus(datensatz, 'sicher', entscheiderMitWert(1, 'sicher'));
  const verletzt = maschine.fuehreAus(datensatz, 'verletzt', entscheiderMitWert(5, 'verletzung'));
  assert.equal(vergleicheWiederholungsLaeufe(sicher, verletzt).sicherheitsverletzungen, 2);
});

test('Vergleich verweigert unterschiedliche Eingabedatensaetze', () => {
  const maschine = new WiederholungsMaschine();
  const a = maschine.fuehreAus(basisDatensatz(), 'a', entscheiderMitWert(1));
  const b = maschine.fuehreAus(basisDatensatz({ kennung: 'datensatz-2' }), 'b', entscheiderMitWert(1));
  assert.throws(() => vergleicheWiederholungsLaeufe(a, b), /exakt demselben/);
});

test('Block-4-Stillstand wird offline reproduziert', () => {
  const datensatz = basisDatensatz({
    ablaufBeobachtungen: Object.freeze([
      Object.freeze({
        kennung: 'probe-1',
        ablaufKennung: 'farm-1',
        zeitpunkt: 40_000,
        zustand: 'kaempfen',
        fortschrittKennung: 'fortschritt-1',
        entscheidungKennung: 'weiter',
        gestartetAm: 0,
        letzterFortschrittAm: 0
      })
    ])
  });
  const lauf = new WiederholungsMaschine().fuehreAus(datensatz, 'stillstand', () => null);
  assert.equal(lauf.vorfaelle.some((vorfall) => vorfall.art === 'stillstand'), true);
});

test('Kontingententscheidungen werden mit gespeicherter Reihenfolge reproduziert', () => {
  const profil = Object.freeze({
    dienstKennung: 'objektspeicher',
    anzeigename: 'Objektspeicher',
    tarifName: 'test',
    quelle: 'fixture',
    geprueftAm: 0,
    gueltigBis: 100_000,
    grenzen: Object.freeze([{ kennung: 'anfragen-tag', einheit: 'anfragen', zeitraum: 'tag', anbieterMaximum: 100, sicherheitsPuffer: 10 }])
  });
  const datensatz = basisDatensatz({
    kontingentSchritte: Object.freeze([
      Object.freeze({ art: 'profil_setzen', laufendeNummer: 1, zeitpunkt: 1_000, profil }),
      Object.freeze({ art: 'anbieter_verbrauch', laufendeNummer: 2, zeitpunkt: 1_100, dienstKennung: 'objektspeicher', grenzeKennung: 'anfragen-tag', fensterKennung: '2026-09-16', vomAnbieterGemeldet: 20 }),
      Object.freeze({ art: 'anfrage', laufendeNummer: 3, zeitpunkt: 1_200, anfrage: Object.freeze({ dienstKennung: 'objektspeicher', vorgangKennung: 'upload-1', angefordertAm: 1_200, reservierungen: Object.freeze([{ grenzeKennung: 'anfragen-tag', maximalerVerbrauch: 10 }]) }), fensterKennungen: Object.freeze({ 'anfragen-tag': '2026-09-16' }) })
    ])
  });
  const maschine = new WiederholungsMaschine();
  const a = maschine.fuehreAus(datensatz, 'a', () => null);
  const b = maschine.fuehreAus(datensatz, 'b', () => null);
  assert.deepEqual(a.kontingentEntscheidungen, b.kontingentEntscheidungen);
  assert.equal(a.kontingentEntscheidungen[0].entscheidung.erlaubt, true);
  assert.equal(a.kontingentEntscheidungen[0].entscheidung.verbleibendNachReservierung['anfragen-tag'], 60);
});

test('historische Leistungsdaten werden fuer denselben Zeitraum reproduzierbar aggregiert', () => {
  const dauerzustand = Object.freeze({
    schemaVersion: 1,
    gespeichertAm: 3_600_000,
    laufzeitAbschnitte: Object.freeze([
      Object.freeze({ schemaVersion: 1, kennung: 'lauf-global', start: 0, ende: 3_600_000 }),
      Object.freeze({ schemaVersion: 1, kennung: 'lauf-alpha', start: 0, ende: 3_600_000, charakterName: 'Alpha' })
    ]),
    leistungsZaehler: Object.freeze([
      Object.freeze({ schemaVersion: 1, kennung: 'leistung-1', zeitpunkt: 1_800_000, charakterName: 'Alpha', erfahrungGewonnen: 100, goldGewonnen: 200, tode: 0, rueckzuege: 1, verbindungsAbbrueche: 0, neustarts: 0, automatischBehoben: 0, ungefangeneFehler: 0 })
    ]),
    dienstVerbrauch: Object.freeze([]),
    wiederholungsSegmente: Object.freeze([]),
    vorfallPakete: Object.freeze([])
  });
  const datensatz = basisDatensatz({
    telemetrieDauerzustand: dauerzustand,
    leistungsZeitraeume: Object.freeze([{ kennung: 'bericht-1', zeitraumStart: 0, zeitraumEnde: 3_600_000 }])
  });
  const maschine = new WiederholungsMaschine();
  const a = maschine.fuehreAus(datensatz, 'a', () => null);
  const b = maschine.fuehreAus(datensatz, 'b', () => null);
  assert.deepEqual(a.leistungsAuswertungen, b.leistungsAuswertungen);
  assert.equal(a.leistungsAuswertungen[0].zusammenfassung.charaktere[0].erfahrungGewonnen, 100);
});

test('Wiederholungssegment wird ueber Bytegroesse, SHA-256 und Sequenzbereich geprueft', () => {
  const ereignisse = [
    { kennung: 'e1', laufendeNummer: 1, zeitpunkt: 100, name: 'test', quelle: 'fixture', ablaufKennung: 'a', details: { wert: 1 } },
    { kennung: 'e2', laufendeNummer: 2, zeitpunkt: 200, name: 'test', quelle: 'fixture', ablaufKennung: 'a', details: { wert: 2 } }
  ];
  const inhalt = ereignisse.map((eintrag) => `${JSON.stringify(eintrag)}\n`).join('');
  const segment = Object.freeze({ schemaVersion: 1, segmentKennung: 's:1-2', sitzungKennung: 's', erstelltAm: 200, zeitraumStart: 100, zeitraumEnde: 200, sequenzStart: 1, sequenzEnde: 2, ereignisAnzahl: 2, groesseBytes: new TextEncoder().encode(inhalt).byteLength, sha256: berechneSha256(inhalt), inhalt });
  assert.equal(ladeWiederholungsSegment(segment).ereignisse.length, 2);
  assert.equal(ladeWiederholungsSegmente([segment]).vollstaendig, true);
  assert.throws(() => ladeWiederholungsSegment({ ...segment, sha256: '0'.repeat(64) }), /SHA-256/);
});

test('aufgezeichnete Spielzustaende und Ereignisse koennen geladen werden', () => {
  const aufzeichnung = JSON.stringify({ schemaVersion: 1, erstelltAm: 1_000, zustaende: [zustand(1, 1_000, 'ablauf-alpha')] });
  assert.equal(ladeWiederholungsZustaende([{ charakterKennung: 'Alpha', inhalt: aufzeichnung }]).length, 1);

  const ereignis = { kennung: 'e1', laufendeNummer: 1, zeitpunkt: 100, name: 'test', quelle: 'fixture', ablaufKennung: 'ablauf-alpha', details: {} };
  const inhalt = `${JSON.stringify(ereignis)}\n`;
  const segment = { schemaVersion: 1, segmentKennung: 's:1-1', sitzungKennung: 's', erstelltAm: 100, zeitraumStart: 100, zeitraumEnde: 100, sequenzStart: 1, sequenzEnde: 1, ereignisAnzahl: 1, groesseBytes: new TextEncoder().encode(inhalt).byteLength, sha256: berechneSha256(inhalt), inhalt };
  const geladen = ladeWiederholungsEreignisse([segment], { 'ablauf-alpha': 'Alpha' });
  assert.equal(geladen[0].charakterKennung, 'Alpha');
});

test('goldener Wiederholungssatz wird durch normale Bereinigung niemals verdraengt', () => {
  const satz = new GoldenerWiederholungsSatz({ maxEintraege: 2, maxBytes: 1_000_000 });
  assert.equal(satz.fuegeHinzu('gold-1', 'Sicherheitsfall', 1_000, basisDatensatz()).aufgenommen, true);
  assert.equal(satz.bereinigeNormal(), 0);
  assert.equal(satz.liste().length, 1);
  assert.equal(satz.entferneAusdruecklich('gold-1'), true);
  assert.equal(satz.liste().length, 0);
});
