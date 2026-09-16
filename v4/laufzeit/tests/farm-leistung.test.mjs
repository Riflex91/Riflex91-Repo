import test from 'node:test';
import assert from 'node:assert/strict';
import { erstelleFarmLeistungsEintraege } from '../../erzeugt/telemetrie/farm-leistungs-erfassung.js';

const bekannt = (wert) => ({ zustand: 'bekannt', quelle: 'beobachtet', sicherheit: 1, bekanntSeit: 0, wert });

function zustand({ nummer, zeit, stufe = 10, xp = 100, maxXp = 1000, gold = 500 }) {
  return {
    schemaVersion: 2,
    laufendeNummer: nummer,
    aufgenommenAm: zeit,
    ablaufKennung: 'farm-leistung',
    beobachtet: {
      charakter: bekannt({
        kennung: bekannt('char-1'),
        name: bekannt('Farmer'),
        stufe: bekannt(stufe),
        erfahrung: bekannt(xp),
        erfahrungNaechsteStufe: bekannt(maxXp),
        gold: bekannt(gold)
      })
    }
  };
}

test('XP, Gold und Laufzeit werden als bestehende Telemetrieeintraege erzeugt', () => {
  const vorher = zustand({ nummer: 1, zeit: 1000, xp: 100, gold: 500 });
  const nachher = zustand({ nummer: 2, zeit: 61_000, xp: 250, gold: 650 });
  const eintraege = erstelleFarmLeistungsEintraege(vorher, nachher);
  assert.equal(eintraege?.laufzeitAbschnitt.start, 1000);
  assert.equal(eintraege?.laufzeitAbschnitt.ende, 61_000);
  assert.equal(eintraege?.leistungsZaehler?.erfahrungGewonnen, 150);
  assert.equal(eintraege?.leistungsZaehler?.goldGewonnen, 150);
  assert.equal(eintraege?.leistungsZaehler?.charakterName, 'Farmer');
});

test('Ein einzelner Stufenaufstieg wird ohne negative XP-Differenz erfasst', () => {
  const vorher = zustand({ nummer: 1, zeit: 1000, stufe: 10, xp: 900, maxXp: 1000 });
  const nachher = zustand({ nummer: 2, zeit: 2000, stufe: 11, xp: 75, maxXp: 1200 });
  const eintraege = erstelleFarmLeistungsEintraege(vorher, nachher);
  assert.equal(eintraege?.leistungsZaehler?.erfahrungGewonnen, 175);
});

test('Nicht sicher bestimmbare Mehrfach-Levelspruenge werden nicht erfunden', () => {
  const vorher = zustand({ nummer: 1, zeit: 1000, stufe: 10, xp: 900, maxXp: 1000, gold: 500 });
  const nachher = zustand({ nummer: 2, zeit: 2000, stufe: 12, xp: 75, maxXp: 1500, gold: 550 });
  const eintraege = erstelleFarmLeistungsEintraege(vorher, nachher);
  assert.equal(eintraege?.leistungsZaehler?.erfahrungGewonnen, 0);
  assert.equal(eintraege?.leistungsZaehler?.goldGewonnen, 50);
});
