import test from 'node:test';
import assert from 'node:assert/strict';
import {
  erstelleGruppenKoordinationsKonfiguration,
  koordiniereGruppe
} from '../../erzeugt/spiellogik/gruppen-koordination.js';

function meldung(kennung, aenderungen = {}) {
  return {
    schemaVersion: 1,
    charakterKennung: kennung,
    charakterName: kennung,
    klasse: 'beliebig',
    serverRegion: 'EU',
    serverKennung: 'I',
    karte: 'main',
    instanz: 'main',
    lebendig: true,
    lebensAnteil: 0.9,
    manaAnteil: 0.8,
    zielKennung: 'm1',
    gefahrenStufe: 'sicher',
    faehigkeiten: {
      heilen: 0,
      schaden: 0,
      aggro: 0,
      schutz: 0,
      unterstuetzung: 0
    },
    gesendetAm: 10_000,
    laufendeNummer: 1,
    ...aenderungen
  };
}

const konfiguration = erstelleGruppenKoordinationsKonfiguration({
  lebensnachweisMaximalAlterMillisekunden: 5_000
});

function koordiniere(meldungen, eigenerTeilnehmerKennung = 'a', jetzt = 12_000) {
  return koordiniereGruppe(meldungen, eigenerTeilnehmerKennung, jetzt, konfiguration);
}

test('Block 8: Aufgaben werden aus Faehigkeiten und nicht aus Klassen abgeleitet', () => {
  const a = meldung('a', {
    klasse: 'warrior',
    faehigkeiten: { heilen: 0.9, schaden: 0.2, aggro: 0.1, schutz: 0.3, unterstuetzung: 0.2 }
  });
  const b = meldung('b', {
    klasse: 'priest',
    faehigkeiten: { heilen: 0.2, schaden: 0.95, aggro: 0.4, schutz: 0.2, unterstuetzung: 0.8 }
  });
  const ergebnis = koordiniere([a, b]);

  assert.equal(ergebnis.betriebsArt, 'normal');
  assert.equal(ergebnis.aufgaben.heilen, 'a');
  assert.equal(ergebnis.aufgaben.schaden, 'b');
  assert.equal(ergebnis.aufgaben.unterstuetzung, 'b');
});

test('Block 8: veraltete Lebensnachweise werden ausgeschlossen und Aufgaben neu verteilt', () => {
  const a = meldung('a', {
    faehigkeiten: { heilen: 0.4, schaden: 0.5, aggro: 0.2, schutz: 0.2, unterstuetzung: 0.2 }
  });
  const b = meldung('b', {
    gesendetAm: 6_000,
    faehigkeiten: { heilen: 1, schaden: 1, aggro: 1, schutz: 1, unterstuetzung: 1 }
  });
  const ergebnis = koordiniere([a, b]);

  assert.deepEqual(ergebnis.aktiveTeilnehmerKennungen, ['a']);
  assert.equal(ergebnis.teilnehmerBewertungen.find((wert) => wert.charakterKennung === 'b')?.status, 'veraltet');
  assert.equal(ergebnis.aufgaben.heilen, 'a');
  assert.equal(ergebnis.aufgaben.schaden, 'a');
});

test('Block 8: ausgefallener Teilnehmer verliert Aufgaben und frischer Lebensnachweis stellt ihn wieder her', () => {
  const a = meldung('a', {
    faehigkeiten: { heilen: 0.3, schaden: 0.3, aggro: 0.3, schutz: 0.3, unterstuetzung: 0.3 }
  });
  const bAusgefallen = meldung('b', {
    lebendig: false,
    faehigkeiten: { heilen: 0.9, schaden: 0.9, aggro: 0.9, schutz: 0.9, unterstuetzung: 0.9 }
  });
  const ausgefallen = koordiniere([a, bAusgefallen]);
  assert.equal(ausgefallen.teilnehmerBewertungen.find((wert) => wert.charakterKennung === 'b')?.status, 'ausgefallen');
  assert.equal(ausgefallen.aufgaben.heilen, 'a');

  const bWiederDa = meldung('b', {
    gesendetAm: 11_500,
    laufendeNummer: 2,
    faehigkeiten: { heilen: 0.9, schaden: 0.9, aggro: 0.9, schutz: 0.9, unterstuetzung: 0.9 }
  });
  const wiederDa = koordiniere([a, bAusgefallen, bWiederDa]);
  assert.deepEqual(wiederDa.aktiveTeilnehmerKennungen, ['a', 'b']);
  assert.equal(wiederDa.aufgaben.heilen, 'b');
});

test('Block 8: anderer Server oder andere Instanz wird nicht mitkoordiniert', () => {
  const a = meldung('a');
  const andererServer = meldung('b', { serverKennung: 'II' });
  const andereInstanz = meldung('c', { instanz: 'cave-1' });
  const ergebnis = koordiniere([a, andererServer, andereInstanz]);

  assert.equal(ergebnis.teilnehmerBewertungen.find((wert) => wert.charakterKennung === 'b')?.status, 'falsche_welt');
  assert.equal(ergebnis.teilnehmerBewertungen.find((wert) => wert.charakterKennung === 'c')?.status, 'falsche_instanz');
  assert.deepEqual(ergebnis.aktiveTeilnehmerKennungen, ['a']);
});

test('Block 8: gemeinsame Sicherheitslage hat Vorrang vor gemeinsamem Ziel', () => {
  const a = meldung('a', { zielKennung: 'm1' });
  const b = meldung('b', { zielKennung: 'm1', gefahrenStufe: 'kritisch' });
  const ergebnis = koordiniere([a, b]);

  assert.equal(ergebnis.betriebsArt, 'sicherheit');
  assert.equal(ergebnis.gemeinsameGefahrenStufe, 'kritisch');
  assert.equal(ergebnis.gemeinsamesZielKennung, null);
});

test('Block 8: unbekannte Sicherheitslage blockiert normale Gruppenarbeit fail-safe', () => {
  const ergebnis = koordiniere([meldung('a'), meldung('b', { gefahrenStufe: 'unbekannt' })]);
  assert.equal(ergebnis.betriebsArt, 'blockiert');
  assert.equal(ergebnis.gemeinsameGefahrenStufe, 'unbekannt');
  assert.equal(ergebnis.gemeinsamesZielKennung, null);
});

test('Block 8: gemeinsames Ziel nutzt Mehrheit und deterministischen Gleichstand', () => {
  const mehrheit = koordiniere([
    meldung('a', { zielKennung: 'm2' }),
    meldung('b', { zielKennung: 'm1' }),
    meldung('c', { zielKennung: 'm1' })
  ]);
  assert.equal(mehrheit.gemeinsamesZielKennung, 'm1');

  const gleichstand = koordiniere([
    meldung('a', { zielKennung: 'm2' }),
    meldung('b', { zielKennung: 'm1' })
  ]);
  assert.equal(gleichstand.gemeinsamesZielKennung, 'm1');
});

test('Block 8: gleiche Eingaben ergeben unabhaengig von Eingabereihenfolge dieselbe Entscheidung', () => {
  const a = meldung('a', {
    faehigkeiten: { heilen: 0.5, schaden: 0.5, aggro: 0.5, schutz: 0.5, unterstuetzung: 0.5 }
  });
  const b = meldung('b', {
    faehigkeiten: { heilen: 0.5, schaden: 0.5, aggro: 0.5, schutz: 0.5, unterstuetzung: 0.5 }
  });
  assert.deepEqual(koordiniere([a, b]), koordiniere([b, a]));
  assert.equal(koordiniere([a, b]).aufgaben.heilen, 'a');
});

test('Block 8: fehlender oder eigener veralteter Lebensnachweis blockiert die Koordination', () => {
  const fehlt = koordiniere([meldung('b')], 'a');
  assert.equal(fehlt.betriebsArt, 'blockiert');
  assert.deepEqual(fehlt.aktiveTeilnehmerKennungen, []);

  const veraltet = koordiniere([meldung('a', { gesendetAm: 1_000 })]);
  assert.equal(veraltet.betriebsArt, 'blockiert');
  assert.deepEqual(veraltet.aktiveTeilnehmerKennungen, []);
});
