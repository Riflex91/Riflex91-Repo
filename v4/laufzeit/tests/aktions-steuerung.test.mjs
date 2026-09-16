import test from 'node:test';
import assert from 'node:assert/strict';
import { AktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';

function anfrage(aenderungen = {}) {
  return {
    kennung: 'aktion',
    angefordertVon: 'test',
    aktion: 'TEST_AKTION',
    wichtigkeit: 'normal',
    prioritaet: 0,
    angefordertAm: 1,
    benoetigteRessourcen: ['bewegung'],
    grund: 'Testanfrage',
    details: {},
    ...aenderungen
  };
}

test('Notfallarbeit unterbricht normale Arbeit auch bei kleinerer numerischer Prioritaet', () => {
  const steuerung = new AktionsSteuerung();

  steuerung.reicheAnfrageEin(anfrage({
    kennung: 'farmen',
    wichtigkeit: 'normal',
    prioritaet: 999999,
    benoetigteRessourcen: ['bewegung', 'kampfziel']
  }));
  assert.equal(steuerung.verarbeiteNaechsteAktion(10).gestarteteAnfrage?.kennung, 'farmen');

  steuerung.reicheAnfrageEin(anfrage({
    kennung: 'rueckzug',
    wichtigkeit: 'notfall',
    prioritaet: -999999,
    angefordertAm: 2,
    benoetigteRessourcen: ['bewegung']
  }));

  const schritt = steuerung.verarbeiteNaechsteAktion(11);
  assert.equal(schritt.gestarteteAnfrage?.kennung, 'rueckzug');
  assert.deepEqual(schritt.unterbrocheneAnfragen, ['farmen']);
  assert.equal(steuerung.holeAktionsZustand('farmen')?.phase, 'abgebrochen');
  assert.equal(steuerung.holeAktionsZustand('rueckzug')?.phase, 'laeuft');
  assert.equal(steuerung.listeRessourcenSperren().find((sperre) => sperre.ressource === 'kampfziel'), undefined);

  const protokoll = steuerung.listeSchattenProtokoll();
  assert.equal(protokoll[0]?.phase, 'unterbrochen');
  assert.equal(protokoll[1]?.phase, 'laeuft');
});

test('Mehrere benoetigte Ressourcen werden gemeinsam oder gar nicht vergeben', () => {
  const steuerung = new AktionsSteuerung();

  steuerung.reicheAnfrageEin(anfrage({
    kennung: 'bank',
    wichtigkeit: 'notfall',
    prioritaet: 100,
    benoetigteRessourcen: ['inventar']
  }));
  steuerung.verarbeiteNaechsteAktion(10);

  steuerung.reicheAnfrageEin(anfrage({
    kennung: 'dienst',
    wichtigkeit: 'sicherheit',
    angefordertAm: 2,
    benoetigteRessourcen: ['bewegung', 'inventar']
  }));

  const schritt = steuerung.verarbeiteNaechsteAktion(11);
  assert.equal(schritt.art, 'keine-ausfuehrbare-aktion');
  assert.deepEqual(schritt.blockierteAnfragen, ['dienst']);
  assert.equal(steuerung.holeAktionsZustand('dienst')?.phase, 'blockiert');
  assert.equal(steuerung.listeRessourcenSperren().some((sperre) => sperre.ressource === 'bewegung'), false);
  assert.equal(steuerung.listeRessourcenSperren().find((sperre) => sperre.ressource === 'inventar')?.besitzer, 'bank');
});

test('Eine blockierte wichtige Anfrage verhindert keine unabhaengige niedrigere Arbeit', () => {
  const steuerung = new AktionsSteuerung();

  steuerung.reicheAnfrageEin(anfrage({
    kennung: 'bank',
    wichtigkeit: 'notfall',
    benoetigteRessourcen: ['inventar']
  }));
  steuerung.verarbeiteNaechsteAktion(10);

  steuerung.reicheAnfrageEin(anfrage({
    kennung: 'sicherheits-dienst',
    wichtigkeit: 'sicherheit',
    angefordertAm: 2,
    benoetigteRessourcen: ['inventar']
  }));
  steuerung.reicheAnfrageEin(anfrage({
    kennung: 'gruppen-status',
    wichtigkeit: 'hintergrund',
    angefordertAm: 3,
    benoetigteRessourcen: ['gruppe']
  }));

  const schritt = steuerung.verarbeiteNaechsteAktion(11);
  assert.equal(schritt.gestarteteAnfrage?.kennung, 'gruppen-status');
  assert.deepEqual(schritt.blockierteAnfragen, ['sicherheits-dienst']);
});

test('Expliziter Abbruch gibt alle Ressourcen frei und wird im Schattenprotokoll sichtbar', () => {
  const steuerung = new AktionsSteuerung();

  steuerung.reicheAnfrageEin(anfrage({
    kennung: 'handel',
    benoetigteRessourcen: ['handel', 'inventar']
  }));
  steuerung.verarbeiteNaechsteAktion(10);

  assert.equal(steuerung.brecheAktionAb('handel', 12, 'Nutzerabbruch.'), true);
  assert.equal(steuerung.holeAktionsZustand('handel')?.phase, 'abgebrochen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
  assert.equal(steuerung.listeSchattenProtokoll()[0]?.phase, 'abgebrochen');
  assert.equal(steuerung.listeSchattenProtokoll()[0]?.abschlussGrund, 'Nutzerabbruch.');
});

test('Abschluss gibt Ressourcen frei', () => {
  const steuerung = new AktionsSteuerung();

  steuerung.reicheAnfrageEin(anfrage({ kennung: 'fertig', benoetigteRessourcen: ['ausruestung'] }));
  steuerung.verarbeiteNaechsteAktion(10);
  const zustand = steuerung.schliesseAktionAb('fertig', 13);

  assert.equal(zustand.phase, 'abgeschlossen');
  assert.equal(steuerung.listeRessourcenSperren().length, 0);
  assert.equal(steuerung.listeSchattenProtokoll()[0]?.phase, 'abgeschlossen');
});

test('Abgelaufene Anfragen werden nicht ausgefuehrt', () => {
  const steuerung = new AktionsSteuerung();

  steuerung.reicheAnfrageEin(anfrage({
    kennung: 'zu-spaet',
    angefordertAm: 1,
    gueltigBis: 5
  }));

  const schritt = steuerung.verarbeiteNaechsteAktion(5);
  assert.equal(schritt.art, 'keine-ausfuehrbare-aktion');
  assert.equal(steuerung.holeAktionsZustand('zu-spaet')?.phase, 'abgelaufen');
  assert.equal(steuerung.listeSchattenProtokoll().length, 0);
});

test('Schattenausfuehrung ruft keine Adventure-Land-Aktionsfunktion auf', () => {
  let aufrufe = 0;
  const vorherAttack = globalThis.attack;
  const vorherMove = globalThis.move;
  globalThis.attack = () => { aufrufe += 1; };
  globalThis.move = () => { aufrufe += 1; };

  try {
    const steuerung = new AktionsSteuerung();
    steuerung.reicheAnfrageEin(anfrage({ kennung: 'nur-schatten' }));
    steuerung.verarbeiteNaechsteAktion(10);
    steuerung.schliesseAktionAb('nur-schatten', 11);
    assert.equal(aufrufe, 0);
  } finally {
    if (vorherAttack === undefined) delete globalThis.attack;
    else globalThis.attack = vorherAttack;
    if (vorherMove === undefined) delete globalThis.move;
    else globalThis.move = vorherMove;
  }
});

test('AktionsAnfrage-Kennungen duerfen nicht wiederverwendet werden', () => {
  const steuerung = new AktionsSteuerung();
  steuerung.reicheAnfrageEin(anfrage({ kennung: 'einmalig' }));
  assert.throws(
    () => steuerung.reicheAnfrageEin(anfrage({ kennung: 'einmalig', angefordertAm: 2 })),
    /bereits verwendet/
  );
});
