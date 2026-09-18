import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RecoveryCheckpointSpeicher
} from '../../erzeugt/telemetrie/recovery-checkpoint.js';

class Speicher {
  constructor() {
    this.map = new Map();
    this.fehlerSchluessel = new Set();
  }
  getItem(schluessel) {
    return this.map.get(schluessel) ?? null;
  }
  setItem(schluessel, wert) {
    if (this.fehlerSchluessel.has(schluessel)) throw new Error(`Speicherfehler fuer ${schluessel}`);
    this.map.set(schluessel, wert);
  }
}

function inhalt(aenderungen = {}) {
  return Object.freeze({
    schemaVersion: 1,
    charakterKennung: 'My_Ranger1',
    ablaufKennung: 'ablauf-1',
    entscheidungKennung: 'gruppenentscheidung:10000:abcdef',
    fachlicherFingerabdruck: 'a'.repeat(64),
    recoveryStufe: 'normal',
    offeneAktionsAnfrageKennungen: Object.freeze([
      'gruppenplan:2:aktionsanfrage',
      'gruppenplan:1:aktionsanfrage'
    ]),
    letzteEreignisNummer: 42,
    ...aenderungen
  });
}

test('Block 8.5.4: Checkpoint wird versioniert mit SHA-256 gespeichert und bleibt ohne Aktionsautoritaet', () => {
  const backing = new Speicher();
  const speicher = new RecoveryCheckpointSpeicher(backing, { basisSchluessel: 'cp' });

  const gespeichert = speicher.speichere(inhalt(), 10_000, 'periodisch');
  assert.equal(gespeichert.status, 'gespeichert');
  assert.equal(gespeichert.slot, 'A');
  assert.equal(gespeichert.sequenz, 1);
  assert.ok(gespeichert.bytes > 0);

  const huelle = JSON.parse(backing.getItem('cp:A'));
  assert.equal(huelle.schemaVersion, 1);
  assert.match(huelle.sha256, /^[a-f0-9]{64}$/);
  assert.equal(typeof huelle.serialisiert, 'string');

  const geladen = speicher.lade();
  assert.equal(geladen.status, 'geladen');
  assert.equal(geladen.slot, 'A');
  assert.equal(geladen.fallbackVerwendet, false);
  assert.equal(geladen.checkpoint.wiederaufnahmeErlaubt, false);
  assert.equal(geladen.checkpoint.abgleichErforderlich, true);
  assert.equal(geladen.checkpoint.aktionsAutoritaet, false);
  assert.deepEqual(
    geladen.checkpoint.inhalt.offeneAktionsAnfrageKennungen,
    ['gruppenplan:1:aktionsanfrage', 'gruppenplan:2:aktionsanfrage']
  );
});

test('Block 8.5.4: A/B-Slots wechseln und Sequenz steigt monoton', () => {
  const backing = new Speicher();
  const speicher = new RecoveryCheckpointSpeicher(backing, { basisSchluessel: 'wechsel' });

  const eins = speicher.speichere(inhalt(), 10_000, 'eins');
  const zwei = speicher.speichere(inhalt({ letzteEreignisNummer: 43 }), 11_000, 'zwei');
  const drei = speicher.speichere(inhalt({ letzteEreignisNummer: 44 }), 12_000, 'drei');

  assert.deepEqual(
    [eins.slot, zwei.slot, drei.slot],
    ['A', 'B', 'A']
  );
  assert.deepEqual(
    [eins.sequenz, zwei.sequenz, drei.sequenz],
    [1, 2, 3]
  );
  assert.equal(backing.getItem('wechsel:zeiger'), 'A');
  assert.equal(speicher.lade().checkpoint.sequenz, 3);
});

test('Block 8.5.4: beschaedigter aktueller Slot faellt auf letzten gueltigen Checkpoint zurueck', () => {
  const backing = new Speicher();
  const speicher = new RecoveryCheckpointSpeicher(backing, { basisSchluessel: 'fallback' });

  speicher.speichere(inhalt({ letzteEreignisNummer: 10 }), 10_000, 'alt');
  speicher.speichere(inhalt({ letzteEreignisNummer: 20 }), 11_000, 'neu');
  assert.equal(backing.getItem('fallback:zeiger'), 'B');

  backing.setItem('fallback:B', '{"kaputt":true}');

  const geladen = speicher.lade();
  assert.equal(geladen.status, 'geladen');
  assert.equal(geladen.slot, 'A');
  assert.equal(geladen.fallbackVerwendet, true);
  assert.equal(geladen.checkpoint.sequenz, 1);
  assert.equal(geladen.checkpoint.inhalt.letzteEreignisNummer, 10);
  assert.equal(geladen.checkpoint.wiederaufnahmeErlaubt, false);
});

test('Block 8.5.4: zwei beschaedigte Slots werden blockierend als beschaedigt gemeldet', () => {
  const backing = new Speicher();
  backing.setItem('kaputt:A', '{"schemaVersion":1}');
  backing.setItem('kaputt:B', 'kein-json');
  backing.setItem('kaputt:zeiger', 'B');

  const speicher = new RecoveryCheckpointSpeicher(backing, { basisSchluessel: 'kaputt' });
  const geladen = speicher.lade();

  assert.equal(geladen.status, 'beschaedigt');
  assert.equal(geladen.checkpoint, null);
  assert.equal(geladen.slot, null);
});

test('Block 8.5.4: manipulierte Nutzlast besteht die SHA-256-Pruefung nicht', () => {
  const backing = new Speicher();
  const speicher = new RecoveryCheckpointSpeicher(backing, { basisSchluessel: 'hash' });
  speicher.speichere(inhalt(), 10_000, 'original');

  const huelle = JSON.parse(backing.getItem('hash:A'));
  huelle.serialisiert = huelle.serialisiert.replace('"normal"', '"blockiert"');
  backing.setItem('hash:A', JSON.stringify(huelle));

  const geladen = speicher.lade();
  assert.equal(geladen.status, 'beschaedigt');
  assert.equal(geladen.checkpoint, null);
});

test('Block 8.5.4: unvollstaendige Nutzlast mit neu berechnetem Fremd-Hash wird trotzdem abgewiesen', async () => {
  const backing = new Speicher();
  const { berechneSha256 } = await import('../../erzeugt/telemetrie/sha256.js');
  const serialisiert = JSON.stringify({
    schemaVersion: 1,
    sequenz: 1,
    gespeichertAm: 10_000,
    grund: 'unvollstaendig',
    wiederaufnahmeErlaubt: false,
    abgleichErforderlich: true,
    aktionsAutoritaet: false,
    inhalt: { schemaVersion: 1, charakterKennung: 'My_Ranger1' }
  });
  backing.setItem('unvollstaendig:A', JSON.stringify({
    schemaVersion: 1,
    sha256: berechneSha256(serialisiert),
    serialisiert
  }));
  backing.setItem('unvollstaendig:zeiger', 'A');

  const speicher = new RecoveryCheckpointSpeicher(backing, { basisSchluessel: 'unvollstaendig' });
  const geladen = speicher.lade();
  assert.equal(geladen.status, 'beschaedigt');
  assert.equal(geladen.checkpoint, null);
});

test('Block 8.5.4: zu grosser Checkpoint wird vor dem Schreiben abgewiesen und alter Checkpoint bleibt erhalten', () => {
  const backing = new Speicher();
  const normal = new RecoveryCheckpointSpeicher(backing, {
    basisSchluessel: 'groesse',
    maxBytes: 100_000
  });
  normal.speichere(inhalt({ offeneAktionsAnfrageKennungen: Object.freeze(['alt']) }), 10_000, 'alt');

  const klein = new RecoveryCheckpointSpeicher(backing, {
    basisSchluessel: 'groesse',
    maxBytes: 500
  });
  const riesig = Array.from({ length: 100 }, (_, index) => `offene-anfrage-${index}-${'x'.repeat(30)}`);
  const ergebnis = klein.speichere(
    inhalt({ offeneAktionsAnfrageKennungen: Object.freeze(riesig) }),
    11_000,
    'zu-gross'
  );

  assert.equal(ergebnis.status, 'zu_gross');
  assert.equal(backing.getItem('groesse:zeiger'), 'A');
  const geladen = normal.lade();
  assert.equal(geladen.status, 'geladen');
  assert.deepEqual(geladen.checkpoint.inhalt.offeneAktionsAnfrageKennungen, ['alt']);
});

test('Block 8.5.4: Zeiger-Schreibfehler meldet Speicherfehler und alter bestaetigter Checkpoint bleibt aktiv', () => {
  const backing = new Speicher();
  const speicher = new RecoveryCheckpointSpeicher(backing, { basisSchluessel: 'write' });
  const alt = speicher.speichere(inhalt({ letzteEreignisNummer: 1 }), 10_000, 'alt');
  assert.equal(alt.status, 'gespeichert');
  assert.equal(backing.getItem('write:zeiger'), 'A');

  backing.fehlerSchluessel.add('write:zeiger');
  const neu = speicher.speichere(inhalt({ letzteEreignisNummer: 2 }), 11_000, 'neu');
  assert.equal(neu.status, 'speicher_fehler');
  assert.equal(backing.getItem('write:zeiger'), 'A');

  const geladen = speicher.lade();
  assert.equal(geladen.status, 'geladen');
  assert.equal(geladen.slot, 'A');
  assert.equal(geladen.checkpoint.sequenz, 1);
  assert.equal(geladen.checkpoint.inhalt.letzteEreignisNummer, 1);
});

test('Block 8.5.4: offene Arbeit wird nur als Kennung gespeichert und nie automatisch fortgesetzt', () => {
  const backing = new Speicher();
  const speicher = new RecoveryCheckpointSpeicher(backing, { basisSchluessel: 'authority' });
  const ergebnis = speicher.speichere(inhalt({
    recoveryStufe: 'sicher_pausiert',
    offeneAktionsAnfrageKennungen: Object.freeze([
      'aktion-b',
      'aktion-a',
      'aktion-a'
    ])
  }), 10_000, 'offene-arbeit');

  assert.equal(ergebnis.status, 'gespeichert');
  const geladen = speicher.lade().checkpoint;
  assert.equal(geladen.wiederaufnahmeErlaubt, false);
  assert.equal(geladen.abgleichErforderlich, true);
  assert.equal(geladen.aktionsAutoritaet, false);
  assert.deepEqual(geladen.inhalt.offeneAktionsAnfrageKennungen, ['aktion-a', 'aktion-b']);
  assert.deepEqual(
    Object.keys(geladen.inhalt).sort(),
    [
      'ablaufKennung',
      'charakterKennung',
      'entscheidungKennung',
      'fachlicherFingerabdruck',
      'letzteEreignisNummer',
      'offeneAktionsAnfrageKennungen',
      'recoveryStufe',
      'schemaVersion'
    ].sort()
  );
});

test('Block 8.5.4: ungueltiger Fingerabdruck oder Ereigniszaehler wird fail-safe abgewiesen', () => {
  const backing = new Speicher();
  const speicher = new RecoveryCheckpointSpeicher(backing, { basisSchluessel: 'validierung' });

  assert.throws(
    () => speicher.speichere(inhalt({ fachlicherFingerabdruck: 'kein-hash' }), 10_000, 'falsch'),
    /gueltiger SHA-256/
  );
  assert.throws(
    () => speicher.speichere(inhalt({ letzteEreignisNummer: -1 }), 10_000, 'falsch'),
    /nichtnegative ganze Zahl/
  );
});

test('Block 8.5.4: ohne gespeicherte Daten wird nicht_vorhanden statt erfundener Zustand gemeldet', () => {
  const speicher = new RecoveryCheckpointSpeicher(new Speicher(), { basisSchluessel: 'leer' });
  const geladen = speicher.lade();

  assert.equal(geladen.status, 'nicht_vorhanden');
  assert.equal(geladen.checkpoint, null);
  assert.equal(geladen.fallbackVerwendet, false);
});
