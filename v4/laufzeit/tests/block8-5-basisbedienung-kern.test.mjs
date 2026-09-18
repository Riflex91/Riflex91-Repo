import test from 'node:test';
import assert from 'node:assert/strict';
import { AktionsSteuerung } from '../../erzeugt/kern/aktions-steuerung.js';
import { LaufzeitSteuerung } from '../../erzeugt/kern/laufzeit-steuerung.js';
import {
  SichereBasisBedienung,
  erstelleBasisBedienAnfrage
} from '../../erzeugt/kern/sichere-basis-bedienung.js';

function anfrage(kennung, wichtigkeit = 'normal', aenderungen = {}) {
  return Object.freeze({
    kennung,
    angefordertVon: 'test',
    aktion: 'TEST_AKTION',
    wichtigkeit,
    prioritaet: wichtigkeit === 'notfall' ? 1000 : wichtigkeit === 'sicherheit' ? 800 : 100,
    angefordertAm: 10_000,
    gueltigBis: 20_000,
    benoetigteRessourcen: Object.freeze(['inventar']),
    grund: 'Testanfrage.',
    details: Object.freeze({}),
    ...aenderungen
  });
}

function setup() {
  const laufzeitSteuerung = new LaufzeitSteuerung();
  const aktionsSteuerung = new AktionsSteuerung({ laufzeitSteuerung });
  let diagnoseAufrufe = 0;
  const bedienung = new SichereBasisBedienung({
    laufzeitSteuerung,
    aktionsSteuerung,
    diagnoseLieferant() {
      diagnoseAufrufe += 1;
      return Object.freeze({
        diagnoseAufrufe,
        laufzeit: laufzeitSteuerung.status()
      });
    }
  });
  return { laufzeitSteuerung, aktionsSteuerung, bedienung, diagnoseAufrufe: () => diagnoseAufrufe };
}

test('Block 8.5.7 Kern: LaufzeitSteuerung startet freigegeben und setzt keine automatische Fortsetzung', () => {
  const laufzeit = new LaufzeitSteuerung();
  const status = laufzeit.status();

  assert.equal(status.zustand, 'laeuft');
  assert.equal(status.generation, 0);
  assert.equal(status.automatischeFortsetzung, false);
  assert.equal(laufzeit.pruefeAktionsAnfrage(anfrage('normal')).erlaubt, true);
});

test('Block 8.5.7 Kern: Pause sperrt normale und Hintergrundarbeit aber nicht Notfall oder Sicherheit', () => {
  const laufzeit = new LaufzeitSteuerung();
  laufzeit.pausiere(10_100, 'Testpause.');

  assert.equal(laufzeit.status().zustand, 'pausiert');
  assert.equal(laufzeit.pruefeAktionsAnfrage(anfrage('normal', 'normal')).erlaubt, false);
  assert.equal(laufzeit.pruefeAktionsAnfrage(anfrage('hintergrund', 'hintergrund')).erlaubt, false);
  assert.equal(laufzeit.pruefeAktionsAnfrage(anfrage('sicherheit', 'sicherheit')).erlaubt, true);
  assert.equal(laufzeit.pruefeAktionsAnfrage(anfrage('notfall', 'notfall')).erlaubt, true);
});

test('Block 8.5.7 Kern: AktionsSteuerung verwirft neue normale Arbeit waehrend Pause statt sie fuer spaeter zu sammeln', () => {
  const laufzeit = new LaufzeitSteuerung();
  const steuerung = new AktionsSteuerung({ laufzeitSteuerung: laufzeit });
  laufzeit.pausiere(10_050, 'Pause.');

  const normal = steuerung.reicheAnfrageEin(anfrage('normal'));
  const hintergrund = steuerung.reicheAnfrageEin(anfrage('hintergrund', 'hintergrund'));
  const sicherheit = steuerung.reicheAnfrageEin(anfrage('sicherheit', 'sicherheit', {
    benoetigteRessourcen: Object.freeze(['bewegung'])
  }));

  assert.equal(normal.phase, 'abgebrochen');
  assert.equal(hintergrund.phase, 'abgebrochen');
  assert.match(normal.zustandsGrund, /pausiert/);
  assert.equal(sicherheit.phase, 'wartend');

  const schritt = steuerung.verarbeiteNaechsteAktion(10_100);
  assert.equal(schritt.art, 'gestartet');
  assert.equal(schritt.gestarteteAnfrage?.kennung, 'sicherheit');
});

test('Block 8.5.7 Kern: sichere Pause laeuft durch BedienSicherung und beendet bestehende normale Arbeit', () => {
  const { laufzeitSteuerung, aktionsSteuerung, bedienung } = setup();

  aktionsSteuerung.reicheAnfrageEin(anfrage('laufend-normal'));
  aktionsSteuerung.verarbeiteNaechsteAktion(10_010);
  assert.equal(aktionsSteuerung.holeAktionsZustand('laufend-normal')?.phase, 'laeuft');

  const pause = bedienung.erstelleAnfrage({
    vorgangsKennung: 'bedien-pause-1',
    aktion: 'laufzeit_pausieren',
    angefordertAm: 10_100
  });
  assert.equal(pause.risiko, 'unkritisch');

  const ergebnis = bedienung.fuehreAus(pause);

  assert.equal(ergebnis.status, 'ausgefuehrt');
  assert.equal(ergebnis.bedienEntscheidung.erlaubt, true);
  assert.equal(ergebnis.laufzeitStatus.zustand, 'pausiert');
  assert.deepEqual(ergebnis.abgebrocheneAktionsAnfrageKennungen, ['laufend-normal']);
  assert.equal(aktionsSteuerung.holeAktionsZustand('laufend-normal')?.phase, 'abgebrochen');
  assert.equal(aktionsSteuerung.listeRessourcenSperren().length, 0);
  assert.equal(laufzeitSteuerung.status().automatischeFortsetzung, false);
});

test('Block 8.5.7 Kern: Pause laesst laufende Sicherheitsarbeit unberuehrt', () => {
  const { aktionsSteuerung, bedienung } = setup();

  aktionsSteuerung.reicheAnfrageEin(anfrage('safety', 'sicherheit', {
    benoetigteRessourcen: Object.freeze(['bewegung'])
  }));
  aktionsSteuerung.verarbeiteNaechsteAktion(10_010);
  assert.equal(aktionsSteuerung.holeAktionsZustand('safety')?.phase, 'laeuft');

  const ergebnis = bedienung.fuehreAus(bedienung.erstelleAnfrage({
    vorgangsKennung: 'bedien-pause-safety',
    aktion: 'laufzeit_pausieren',
    angefordertAm: 10_100
  }));

  assert.equal(ergebnis.status, 'ausgefuehrt');
  assert.deepEqual(ergebnis.abgebrocheneAktionsAnfrageKennungen, []);
  assert.equal(aktionsSteuerung.holeAktionsZustand('safety')?.phase, 'laeuft');
  assert.equal(
    aktionsSteuerung.listeRessourcenSperren().find((sperre) => sperre.ressource === 'bewegung')?.besitzer,
    'safety'
  );
});

test('Block 8.5.7 Kern: Fortsetzen ist vorsichtig und ohne ausdrueckliche Bestaetigung blockiert', () => {
  const { laufzeitSteuerung, bedienung } = setup();

  bedienung.fuehreAus(bedienung.erstelleAnfrage({
    vorgangsKennung: 'pause-vor-resume',
    aktion: 'laufzeit_pausieren',
    angefordertAm: 10_100
  }));
  assert.equal(laufzeitSteuerung.status().zustand, 'pausiert');

  const fortsetzenOhne = bedienung.erstelleAnfrage({
    vorgangsKennung: 'resume-ohne',
    aktion: 'laufzeit_fortsetzen',
    angefordertAm: 10_200,
    ausdruecklichBestaetigt: false
  });
  assert.equal(fortsetzenOhne.risiko, 'vorsicht');
  const blockiert = bedienung.fuehreAus(fortsetzenOhne);

  assert.equal(blockiert.status, 'blockiert');
  assert.equal(blockiert.bedienEntscheidung.brauchtBestaetigung, true);
  assert.equal(laufzeitSteuerung.status().zustand, 'pausiert');

  const fortsetzenMit = bedienung.erstelleAnfrage({
    vorgangsKennung: 'resume-mit',
    aktion: 'laufzeit_fortsetzen',
    angefordertAm: 10_300,
    ausdruecklichBestaetigt: true
  });
  const ausgefuehrt = bedienung.fuehreAus(fortsetzenMit);
  assert.equal(ausgefuehrt.status, 'ausgefuehrt');
  assert.equal(laufzeitSteuerung.status().zustand, 'laeuft');
});

test('Block 8.5.7 Kern: Fortsetzen belebt vor der Pause abgebrochene Arbeit nicht wieder', () => {
  const { aktionsSteuerung, bedienung } = setup();

  aktionsSteuerung.reicheAnfrageEin(anfrage('alt'));
  aktionsSteuerung.verarbeiteNaechsteAktion(10_010);

  bedienung.fuehreAus(bedienung.erstelleAnfrage({
    vorgangsKennung: 'pause-alt',
    aktion: 'laufzeit_pausieren',
    angefordertAm: 10_100
  }));
  assert.equal(aktionsSteuerung.holeAktionsZustand('alt')?.phase, 'abgebrochen');

  bedienung.fuehreAus(bedienung.erstelleAnfrage({
    vorgangsKennung: 'resume-alt',
    aktion: 'laufzeit_fortsetzen',
    angefordertAm: 10_200,
    ausdruecklichBestaetigt: true
  }));

  assert.equal(aktionsSteuerung.holeAktionsZustand('alt')?.phase, 'abgebrochen');

  const neu = aktionsSteuerung.reicheAnfrageEin(anfrage('neu', 'normal', {
    angefordertAm: 10_300,
    gueltigBis: 20_300
  }));
  assert.equal(neu.phase, 'wartend');
});

test('Block 8.5.7 Kern: Diagnose aktualisieren bleibt read-only', () => {
  const { laufzeitSteuerung, aktionsSteuerung, bedienung, diagnoseAufrufe } = setup();
  const generationVorher = laufzeitSteuerung.status().generation;
  const zustaendeVorher = aktionsSteuerung.listeAktionsZustaende().length;

  const diagnose = bedienung.fuehreAus(bedienung.erstelleAnfrage({
    vorgangsKennung: 'diagnose-1',
    aktion: 'diagnose_aktualisieren',
    angefordertAm: 10_100
  }));

  assert.equal(diagnose.status, 'ausgefuehrt');
  assert.equal(diagnoseAufrufe(), 1);
  assert.equal(diagnose.diagnose?.diagnoseAufrufe, 1);
  assert.equal(laufzeitSteuerung.status().generation, generationVorher);
  assert.equal(aktionsSteuerung.listeAktionsZustaende().length, zustaendeVorher);
});

test('Block 8.5.7 Kern: gleiche Vorgangskennung wird nicht doppelt ausgefuehrt', () => {
  const { laufzeitSteuerung, bedienung } = setup();
  const anfrage = bedienung.erstelleAnfrage({
    vorgangsKennung: 'pause-doppelt',
    aktion: 'laufzeit_pausieren',
    angefordertAm: 10_100
  });

  const erster = bedienung.fuehreAus(anfrage);
  const generationNachErstem = laufzeitSteuerung.status().generation;
  const zweiter = bedienung.fuehreAus(anfrage);

  assert.equal(erster.status, 'ausgefuehrt');
  assert.equal(zweiter.status, 'wiederholt');
  assert.equal(laufzeitSteuerung.status().generation, generationNachErstem);
});

test('Block 8.5.7 Kern: behandelte Vorgangskennungen bleiben hart begrenzt', () => {
  const laufzeit = new LaufzeitSteuerung();
  const steuerung = new AktionsSteuerung({ laufzeitSteuerung: laufzeit });
  const bedienung = new SichereBasisBedienung({
    laufzeitSteuerung: laufzeit,
    aktionsSteuerung: steuerung,
    diagnoseLieferant: () => ({ ok: true }),
    maxBehandelteVorgaenge: 2
  });

  for (let index = 1; index <= 3; index += 1) {
    bedienung.fuehreAus(bedienung.erstelleAnfrage({
      vorgangsKennung: `diag-${index}`,
      aktion: 'diagnose_aktualisieren',
      angefordertAm: 10_000 + index
    }));
  }

  assert.equal(bedienung.status().behandelteVorgaenge, 2);
  assert.equal(bedienung.status().maxBehandelteVorgaenge, 2);
});

test('Block 8.5.7 Kern: Bedienung und AktionsSteuerung muessen dieselbe LaufzeitSteuerung teilen', () => {
  const laufzeitA = new LaufzeitSteuerung();
  const laufzeitB = new LaufzeitSteuerung();
  const steuerung = new AktionsSteuerung({ laufzeitSteuerung: laufzeitA });

  assert.throws(
    () => new SichereBasisBedienung({
      laufzeitSteuerung: laufzeitB,
      aktionsSteuerung: steuerung,
      diagnoseLieferant: () => ({})
    }),
    /dieselbe LaufzeitSteuerung/
  );
});

test('Block 8.5.7 Kern: Anfrageerzeugung verwendet expliziten Laufzeitstatus und blockiert unpassende Zustandswechsel', () => {
  const laufzeit = new LaufzeitSteuerung();

  const pause = erstelleBasisBedienAnfrage({
    vorgangsKennung: 'pause-falsch',
    aktion: 'laufzeit_pausieren',
    angefordertAm: 10_000,
    laufzeitStatus: laufzeit.status()
  });
  assert.equal(
    pause.voraussetzungen.find((voraussetzung) => voraussetzung.kennung === 'laufzeit-laeuft')?.erfuellt,
    true
  );

  const fortsetzen = erstelleBasisBedienAnfrage({
    vorgangsKennung: 'resume-falsch',
    aktion: 'laufzeit_fortsetzen',
    angefordertAm: 10_000,
    laufzeitStatus: laufzeit.status(),
    ausdruecklichBestaetigt: true
  });
  assert.equal(
    fortsetzen.voraussetzungen.find((voraussetzung) => voraussetzung.kennung === 'laufzeit-pausiert')?.erfuellt,
    false
  );
});

test('Block 8.5.7 Kern: veraltete Laufzeit-Generation blockiert eine spaeter ausgefuehrte Bedienanfrage', () => {
  const { laufzeitSteuerung, bedienung } = setup();

  const altePause = bedienung.erstelleAnfrage({
    vorgangsKennung: 'stale-pause',
    aktion: 'laufzeit_pausieren',
    angefordertAm: 10_100
  });
  assert.equal(altePause.erwarteteLaufzeitGeneration, 0);

  laufzeitSteuerung.pausiere(10_110, 'Andere Zustandsaenderung.');
  laufzeitSteuerung.setzeFort(10_120, 'Andere Fortsetzung.');
  assert.equal(laufzeitSteuerung.status().generation, 2);

  const ergebnis = bedienung.fuehreAus(altePause);
  assert.equal(ergebnis.status, 'blockiert');
  assert.equal(ergebnis.bedienEntscheidung.erlaubt, false);
  assert.ok(
    ergebnis.bedienEntscheidung.fehlendeVoraussetzungen.some(
      (voraussetzung) => voraussetzung.kennung === 'laufzeit-generation-aktuell'
    )
  );
  assert.equal(laufzeitSteuerung.status().zustand, 'laeuft');
  assert.equal(laufzeitSteuerung.status().generation, 2);
});

test('Block 8.5.7 Kern: manipuliertes Risiko umgeht die kanonische BedienSicherung nicht', () => {
  const { bedienung } = setup();

  bedienung.fuehreAus(bedienung.erstelleAnfrage({
    vorgangsKennung: 'pause-vor-manipulation',
    aktion: 'laufzeit_pausieren',
    angefordertAm: 10_100
  }));

  const original = bedienung.erstelleAnfrage({
    vorgangsKennung: 'resume-manipuliert',
    aktion: 'laufzeit_fortsetzen',
    angefordertAm: 10_200,
    ausdruecklichBestaetigt: false
  });
  const manipuliert = Object.freeze({
    ...original,
    risiko: 'unkritisch',
    titel: 'Manipulierter Titel',
    erklaerung: 'Manipuliert.',
    auswirkung: 'Manipuliert.'
  });

  const ergebnis = bedienung.fuehreAus(manipuliert);
  assert.equal(ergebnis.status, 'blockiert');
  assert.equal(ergebnis.bedienEntscheidung.brauchtBestaetigung, true);
  assert.match(ergebnis.bedienEntscheidung.grund, /ausdrueckliche Bestaetigung/);
});

test('Block 8.5.7 Kern: rueckwaertiger Zustandszeitpunkt wird fail-safe abgewiesen', () => {
  const laufzeit = new LaufzeitSteuerung();
  laufzeit.pausiere(10_200, 'Pause.');

  assert.throws(
    () => laufzeit.setzeFort(10_100, 'Zu alter Fortsetzungsversuch.'),
    /vor der letzten Zustandsaenderung/
  );
  assert.equal(laufzeit.status().zustand, 'pausiert');
});
