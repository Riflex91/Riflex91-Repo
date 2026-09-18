import test from 'node:test';
import assert from 'node:assert/strict';
import { AktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import { GRUPPEN_AKTIONS_NAMEN } from '../../erzeugt/vertraege/gruppen-aktionsanfrage.js';
import {
  erstelleGruppenAktionsSteuerungKonfiguration,
  uebergibGruppenAktionsAnfragenAnSteuerung
} from '../../erzeugt/spiellogik/gruppen-aktionssteuerung.js';

function gruppenAnfrage({
  kennung,
  aktion = GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen,
  wichtigkeit = 'normal',
  prioritaet = 500,
  angefordertAm = 1_000,
  gueltigBis = 2_500,
  ressourcen = ['gruppe']
}) {
  return Object.freeze({
    kennung,
    angefordertVon: 'block8-abschluss-haertung',
    aktion,
    wichtigkeit,
    prioritaet,
    angefordertAm,
    gueltigBis,
    benoetigteRessourcen: Object.freeze([...ressourcen]),
    grund: 'Deterministische Block-8-Abschlusshaertung.',
    details: Object.freeze({ ausfuehrenderTeilnehmerKennung: 'My_Ranger2' })
  });
}

function uebersetzung(anfragen, zeitpunkt) {
  return Object.freeze({
    schemaVersion: 1,
    zeitpunkt,
    status: 'erzeugt',
    grund: 'Deterministische Block-8-Testuebersetzung.',
    eigenerTeilnehmerKennung: 'My_Ranger2',
    planStatus: 'geplant',
    eigeneSchrittKennungen: Object.freeze(anfragen.map((anfrage) => anfrage.kennung)),
    nichtFreigegebeneSchrittKennungen: Object.freeze([]),
    aktionsAnfragen: Object.freeze([...anfragen])
  });
}

function konfiguration(freigegebeneAktionen) {
  return erstelleGruppenAktionsSteuerungKonfiguration({
    aktiviert: true,
    freigegebeneAktionen,
    verarbeiten: true
  });
}

test('Block 8 Abschlusshaertung: Ressource gruppe bleibt bei konkurrierenden normalen Gruppenanfragen exklusiv', () => {
  const steuerung = new AktionsSteuerung();
  const cfg = konfiguration([GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen]);

  const erste = gruppenAnfrage({ kennung: 'gruppe-normal-a', prioritaet: 500 });
  const zweite = gruppenAnfrage({
    kennung: 'gruppe-normal-b',
    prioritaet: 400,
    angefordertAm: 1_010,
    gueltigBis: 2_600
  });

  const start = uebergibGruppenAktionsAnfragenAnSteuerung(uebersetzung([erste], 1_000), steuerung, 1_000, cfg);
  assert.equal(start.verarbeitung?.gestarteteAnfrage?.kennung, erste.kennung);

  const konkurrenz = uebergibGruppenAktionsAnfragenAnSteuerung(
    uebersetzung([zweite], 1_010),
    steuerung,
    1_010,
    cfg
  );

  assert.equal(konkurrenz.verarbeitung?.art, 'keine-ausfuehrbare-aktion');
  assert.deepEqual(konkurrenz.verarbeitung?.blockierteAnfragen, [zweite.kennung]);
  assert.equal(steuerung.holeAktionsZustand(erste.kennung)?.phase, 'laeuft');
  assert.equal(steuerung.holeAktionsZustand(zweite.kennung)?.phase, 'blockiert');

  const gruppenSperren = steuerung.listeRessourcenSperren().filter((sperre) => sperre.ressource === 'gruppe');
  assert.equal(gruppenSperren.length, 1);
  assert.equal(gruppenSperren[0]?.besitzer, erste.kennung);
});

test('Block 8 Abschlusshaertung: Sicherheits-Gruppenanfrage unterbricht laufende normale Gruppenarbeit', () => {
  const steuerung = new AktionsSteuerung();
  const cfg = konfiguration([
    GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen,
    GRUPPEN_AKTIONS_NAMEN.mitgliedHeilen
  ]);

  const normal = gruppenAnfrage({ kennung: 'gruppe-normal', prioritaet: 500 });
  uebergibGruppenAktionsAnfragenAnSteuerung(uebersetzung([normal], 1_000), steuerung, 1_000, cfg);

  const sicherheit = gruppenAnfrage({
    kennung: 'gruppe-sicherheit',
    aktion: GRUPPEN_AKTIONS_NAMEN.mitgliedHeilen,
    wichtigkeit: 'sicherheit',
    prioritaet: 900,
    angefordertAm: 1_010,
    gueltigBis: 2_600
  });
  const wechsel = uebergibGruppenAktionsAnfragenAnSteuerung(
    uebersetzung([sicherheit], 1_010),
    steuerung,
    1_010,
    cfg
  );

  assert.equal(wechsel.verarbeitung?.art, 'gestartet');
  assert.equal(wechsel.verarbeitung?.gestarteteAnfrage?.kennung, sicherheit.kennung);
  assert.deepEqual(wechsel.verarbeitung?.unterbrocheneAnfragen, [normal.kennung]);
  assert.equal(steuerung.holeAktionsZustand(normal.kennung)?.phase, 'abgebrochen');
  assert.equal(steuerung.holeAktionsZustand(sicherheit.kennung)?.phase, 'laeuft');
  assert.equal(
    steuerung.listeRessourcenSperren().find((sperre) => sperre.ressource === 'gruppe')?.besitzer,
    sicherheit.kennung
  );
});

test('Block 8 Abschlusshaertung: bereits wartende Gruppenanfrage laeuft ab und startet spaeter nicht mehr', () => {
  const steuerung = new AktionsSteuerung();

  const blocker = gruppenAnfrage({
    kennung: 'gruppe-blocker',
    wichtigkeit: 'notfall',
    prioritaet: 1,
    angefordertAm: 900,
    gueltigBis: 5_000
  });
  steuerung.reicheAnfrageEin(blocker);
  assert.equal(steuerung.verarbeiteNaechsteAktion(900).gestarteteAnfrage?.kennung, blocker.kennung);

  const wartend = gruppenAnfrage({
    kennung: 'gruppe-kurzlebig',
    prioritaet: 500,
    angefordertAm: 1_000,
    gueltigBis: 1_100
  });
  const cfg = konfiguration([GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen]);
  const blockiert = uebergibGruppenAktionsAnfragenAnSteuerung(
    uebersetzung([wartend], 1_000),
    steuerung,
    1_000,
    cfg
  );

  assert.equal(blockiert.verarbeitung?.art, 'keine-ausfuehrbare-aktion');
  assert.equal(steuerung.holeAktionsZustand(wartend.kennung)?.phase, 'blockiert');

  const nachAblauf = steuerung.verarbeiteNaechsteAktion(1_100);
  assert.equal(nachAblauf.art, 'keine-ausfuehrbare-aktion');
  assert.equal(steuerung.holeAktionsZustand(wartend.kennung)?.phase, 'abgelaufen');
  assert.equal(
    steuerung.listeSchattenProtokoll().some((eintrag) => eintrag.aktionsAnfrageKennung === wartend.kennung),
    false
  );
});

test('Block 8 Abschlusshaertung: Neustart setzt fluechtigen Gruppensteuerungszustand fail-safe zurueck', () => {
  const cfg = konfiguration([GRUPPEN_AKTIONS_NAMEN.gruppeUnterstuetzen]);
  const vorNeustart = new AktionsSteuerung();
  const alt = gruppenAnfrage({ kennung: 'gruppe-vor-neustart' });

  uebergibGruppenAktionsAnfragenAnSteuerung(
    uebersetzung([alt], 1_000),
    vorNeustart,
    1_000,
    cfg
  );
  assert.equal(vorNeustart.holeAktionsZustand(alt.kennung)?.phase, 'laeuft');

  const nachNeustart = new AktionsSteuerung();
  assert.deepEqual(nachNeustart.listeAktionsZustaende(), []);
  assert.deepEqual(nachNeustart.listeRessourcenSperren(), []);
  assert.deepEqual(nachNeustart.listeSchattenProtokoll(), []);

  const frisch = gruppenAnfrage({
    kennung: 'gruppe-nach-neustart',
    angefordertAm: 2_000,
    gueltigBis: 3_500
  });
  const wiederaufnahme = uebergibGruppenAktionsAnfragenAnSteuerung(
    uebersetzung([frisch], 2_000),
    nachNeustart,
    2_000,
    cfg
  );

  assert.equal(wiederaufnahme.verarbeitung?.gestarteteAnfrage?.kennung, frisch.kennung);
  assert.equal(nachNeustart.holeAktionsZustand(alt.kennung), null);
  assert.equal(nachNeustart.holeAktionsZustand(frisch.kennung)?.phase, 'laeuft');
});
