import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NurLeseStatusSchnittstelle,
  erstelleGemeinsameStatusSicht
} from '../../erzeugt/telemetrie/status-schnittstelle.js';

const bekannt = (wert, sicherheit = 1) => ({
  zustand: 'bekannt',
  quelle: 'beobachtet',
  sicherheit,
  bekanntSeit: 1,
  wert
});
const fehlend = (grund = 'Nicht vorhanden.') => ({
  zustand: 'fehlend',
  quelle: 'beobachtet',
  grund
});
const unbekannt = (grund = 'Nicht bekannt.') => ({
  zustand: 'unbekannt',
  quelle: 'abgeleitet',
  grund
});

function charakter() {
  return {
    kennung: bekannt('char-1'),
    name: bekannt('My_Ranger1'),
    klasse: bekannt('ranger'),
    stufe: bekannt(80),
    leben: bekannt(900),
    lebenMaximal: bekannt(1000),
    mana: bekannt(450),
    manaMaximal: bekannt(500),
    karte: bekannt('main'),
    instanz: bekannt('main'),
    tot: bekannt(false)
  };
}

function spielzustand(charakterWert = bekannt(charakter())) {
  return {
    schemaVersion: 2,
    laufendeNummer: 7,
    aufgenommenAm: 10_000,
    ablaufKennung: 'ablauf-1',
    beobachtet: {
      charakter: charakterWert
    }
  };
}

function runtime(aenderungen = {}) {
  return {
    schemaVersion: 1,
    ausgewertetAm: 10_010,
    recoveryStufe: 'normal',
    grund: 'Gesund.',
    gruende: ['Gesund.'],
    snapshotAlterMillisekunden: 100,
    heartbeatAlterMillisekunden: 200,
    fachlicherFortschrittAlterMillisekunden: 300,
    gruppenLiveness: 'gesund',
    sicherheitsStufe: 'sicher',
    offeneAktionsAnfragen: 1,
    abgebrocheneAktionsAnfragen: 0,
    mussNutzerHandeln: false,
    hostNeustartEmpfohlen: false,
    automatischerNeustart: false,
    ...aenderungen
  };
}

function gruppe() {
  return {
    schemaVersion: 1,
    zeitpunkt: 10_000,
    eigenerTeilnehmerKennung: 'char-1',
    betriebsArt: 'normal',
    grund: 'Gruppe ist freigegeben.',
    gemeinsameGefahrenStufe: 'sicher',
    gemeinsamesZielKennung: 'goo-1',
    aktiveTeilnehmerKennungen: ['char-2', 'char-1'],
    teilnehmerBewertungen: [
      { charakterKennung: 'char-2', status: 'aktiv', grund: 'Aktuell.', alterMillisekunden: 200 },
      { charakterKennung: 'char-1', status: 'aktiv', grund: 'Aktuell.', alterMillisekunden: 100 }
    ],
    aufgaben: {
      heilen: null,
      schaden: 'char-1',
      aggro: null,
      schutz: null,
      unterstuetzung: 'char-2'
    }
  };
}

function entscheidung() {
  return {
    schemaVersion: 1,
    art: 'gruppenkoordination',
    entscheidungKennung: 'entscheidung-1',
    ablaufKennung: 'ablauf-1',
    quelle: 'gruppen-koordination',
    zeitpunkt: 10_000,
    eingabeFingerabdruck: 'a'.repeat(64),
    fachlicherFingerabdruck: 'b'.repeat(64),
    situation: {},
    erkannteEreignisse: [],
    moeglichkeiten: [],
    gewaehlteEntscheidung: 'gruppenbetrieb:normal',
    grund: 'Normalbetrieb.',
    erwartetesErgebnis: {},
    aktionsAnfrageKennungen: ['aktion-b', 'aktion-a'],
    tatsaechlichesErgebnis: null
  };
}

function aktion(kennung, phase, ressourcen = ['gruppe']) {
  return {
    anfrage: {
      kennung,
      angefordertVon: 'gruppen-aktionsplanung',
      aktion: 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN',
      wichtigkeit: 'normal',
      prioritaet: 400,
      angefordertAm: 10_000,
      benoetigteRessourcen: ressourcen,
      grund: 'Testaktion.',
      details: { darfNichtInStatus: true }
    },
    phase,
    eingereihtAm: 10_000,
    gestartetAm: phase === 'laeuft' ? 10_001 : null,
    beendetAm: null,
    zustandsGrund: `Phase ${phase}.`,
    blockiertDurch: []
  };
}

function checkpoint() {
  return {
    status: 'geladen',
    grund: 'Checkpoint geladen.',
    slot: 'A',
    fallbackVerwendet: false,
    checkpoint: {
      schemaVersion: 1,
      sequenz: 3,
      gespeichertAm: 9_900,
      grund: 'periodisch',
      wiederaufnahmeErlaubt: false,
      abgleichErforderlich: true,
      aktionsAutoritaet: false,
      inhalt: {
        schemaVersion: 1,
        charakterKennung: 'char-1',
        ablaufKennung: 'ablauf-1',
        entscheidungKennung: 'entscheidung-1',
        fachlicherFingerabdruck: 'b'.repeat(64),
        recoveryStufe: 'sicher_pausiert',
        offeneAktionsAnfrageKennungen: ['aktion-b', 'aktion-a'],
        letzteEreignisNummer: 99
      }
    }
  };
}

function meldung() {
  return {
    kennung: 'meldung-1',
    zeitpunkt: 10_005,
    stufe: 'warnung',
    meldungsCode: 'TEST_WARNUNG',
    titel: 'Testwarnung',
    wasIstPassiert: 'Etwas wurde beobachtet.',
    warumIstEsPassiert: 'Testgrund.',
    wasHatDerBotGetan: 'Nur beobachtet.',
    mussNutzerHandeln: false,
    wasSollDerNutzerTun: 'Nichts.',
    technischeDetails: { intern: 'nicht ins Statusmodell kopieren' }
  };
}

function eingabe(aenderungen = {}) {
  return {
    zeitpunkt: 10_020,
    spielzustand: spielzustand(),
    runtimeGesundheit: runtime(),
    gruppenEntscheidung: gruppe(),
    entscheidungsDatensatz: entscheidung(),
    aktionsZustaende: [
      aktion('aktion-b', 'wartend', ['kampfziel', 'gruppe']),
      aktion('aktion-a', 'laeuft', ['gruppe'])
    ],
    recoveryCheckpoint: checkpoint(),
    letzteMeldung: meldung(),
    ...aenderungen
  };
}

test('Block 8.5.5: gemeinsame StatusSchnittstelle fasst Kernzustand read-only zusammen', () => {
  const status = erstelleGemeinsameStatusSicht(eingabe());

  assert.equal(status.schemaVersion, 1);
  assert.equal(status.nurLesen, true);
  assert.equal(status.spielAutoritaet, false);
  assert.equal(status.bedienAutoritaet, false);
  assert.equal(status.neustartAutoritaet, false);
  assert.equal(status.charakter.name.zustand, 'bekannt');
  assert.equal(status.charakter.name.wert, 'My_Ranger1');
  assert.equal(status.runtime.recoveryStufe, 'normal');
  assert.equal(status.gruppe.betriebsArt, 'normal');
  assert.equal(status.entscheidung.entscheidungKennung, 'entscheidung-1');
  assert.equal(status.checkpoint.ladeStatus, 'geladen');
  assert.equal(status.checkpoint.wiederaufnahmeErlaubt, false);
  assert.equal(status.checkpoint.abgleichErforderlich, true);
  assert.equal(status.checkpoint.aktionsAutoritaet, false);
  assert.equal(status.letzteMeldung.meldungsCode, 'TEST_WARNUNG');
  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.aktionen), true);
  assert.equal(Object.isFrozen(status.runtime.gruende), true);
});

test('Block 8.5.5: bekannt fehlend und unbekannt bleiben unterscheidbar', () => {
  const c = charakter();
  c.karte = fehlend('Karte fehlt in der Beobachtung.');
  c.instanz = unbekannt('Instanz konnte nicht abgeleitet werden.');
  c.tot = bekannt(null);

  const status = erstelleGemeinsameStatusSicht(eingabe({
    spielzustand: spielzustand(bekannt(c))
  }));

  assert.equal(status.charakter.karte.zustand, 'fehlend');
  assert.equal(status.charakter.karte.wert, null);
  assert.match(status.charakter.karte.grund, /Karte fehlt/);
  assert.equal(status.charakter.instanz.zustand, 'unbekannt');
  assert.equal(status.charakter.instanz.wert, null);
  assert.match(status.charakter.instanz.grund, /Instanz/);
  assert.equal(status.charakter.tot.zustand, 'bekannt');
  assert.equal(status.charakter.tot.wert, null);
  assert.equal(status.charakter.tot.grund, null);
});

test('Block 8.5.5: fehlender Gesamtcharakter wird nicht mit erfundenen Nullwerten als bekannt dargestellt', () => {
  const status = erstelleGemeinsameStatusSicht(eingabe({
    spielzustand: spielzustand(fehlend('Charakterobjekt fehlt.'))
  }));

  assert.equal(status.charakter.verfuegbar, false);
  for (const feld of [
    status.charakter.kennung,
    status.charakter.name,
    status.charakter.klasse,
    status.charakter.leben,
    status.charakter.karte,
    status.charakter.tot
  ]) {
    assert.equal(feld.zustand, 'fehlend');
    assert.equal(feld.wert, null);
    assert.equal(feld.grund, 'Charakterobjekt fehlt.');
  }
});

test('Block 8.5.5: Listen werden deterministisch sortiert ohne die Quellen umzuschreiben', () => {
  const quelle = eingabe();
  const aktionsReihenfolgeVorher = quelle.aktionsZustaende.map((x) => x.anfrage.kennung);
  const teilnehmerReihenfolgeVorher = quelle.gruppenEntscheidung.teilnehmerBewertungen.map((x) => x.charakterKennung);

  const status = erstelleGemeinsameStatusSicht(quelle);

  assert.deepEqual(status.aktionen.map((x) => x.kennung), ['aktion-a', 'aktion-b']);
  assert.deepEqual(status.entscheidung.aktionsAnfrageKennungen, ['aktion-a', 'aktion-b']);
  assert.deepEqual(status.gruppe.aktiveTeilnehmerKennungen, ['char-1', 'char-2']);
  assert.deepEqual(status.gruppe.teilnehmer.map((x) => x.charakterKennung), ['char-1', 'char-2']);
  assert.deepEqual(status.checkpoint.offeneAktionsAnfrageKennungen, ['aktion-a', 'aktion-b']);
  assert.deepEqual(quelle.aktionsZustaende.map((x) => x.anfrage.kennung), aktionsReihenfolgeVorher);
  assert.deepEqual(quelle.gruppenEntscheidung.teilnehmerBewertungen.map((x) => x.charakterKennung), teilnehmerReihenfolgeVorher);
});

test('Block 8.5.5: Aktionsdetails und technische Meldungsdetails werden nicht in Oberflaechenstatus gespiegelt', () => {
  const status = erstelleGemeinsameStatusSicht(eingabe());

  assert.equal('details' in status.aktionen[0], false);
  assert.equal('angefordertVon' in status.aktionen[0], false);
  assert.equal('technischeDetails' in status.letzteMeldung, false);
  assert.equal('inhalt' in status.checkpoint, false);
});

test('Block 8.5.5: fehlende optionale Kernzustaende bleiben explizit leer', () => {
  const status = erstelleGemeinsameStatusSicht(eingabe({
    gruppenEntscheidung: null,
    entscheidungsDatensatz: null,
    aktionsZustaende: [],
    recoveryCheckpoint: {
      status: 'nicht_vorhanden',
      grund: 'Kein Checkpoint.',
      slot: null,
      fallbackVerwendet: false,
      checkpoint: null
    },
    letzteMeldung: null
  }));

  assert.equal(status.gruppe.verfuegbar, false);
  assert.equal(status.gruppe.betriebsArt, null);
  assert.deepEqual(status.gruppe.teilnehmer, []);
  assert.equal(status.entscheidung, null);
  assert.deepEqual(status.aktionen, []);
  assert.equal(status.checkpoint.ladeStatus, 'nicht_vorhanden');
  assert.equal(status.checkpoint.wiederaufnahmeErlaubt, null);
  assert.equal(status.letzteMeldung, null);
});

test('Block 8.5.5: StatusSchnittstelle besitzt nur Leseverhalten und veraendert Aktionszustand nicht', () => {
  const schnittstelle = new NurLeseStatusSchnittstelle();
  const quelle = eingabe();
  const phaseVorher = quelle.aktionsZustaende[0].phase;
  const status = schnittstelle.lese(quelle);

  assert.equal(status.aktionen.length, 2);
  assert.equal(quelle.aktionsZustaende[0].phase, phaseVorher);
  assert.equal(typeof schnittstelle.lese, 'function');
  assert.deepEqual(
    Object.getOwnPropertyNames(Object.getPrototypeOf(schnittstelle)).sort(),
    ['constructor', 'lese']
  );
});

test('Block 8.5.5: ungueltige Status-Metadaten werden fail-safe abgewiesen', () => {
  assert.throws(
    () => erstelleGemeinsameStatusSicht(eingabe({ zeitpunkt: Number.NaN })),
    /zeitpunkt muss endlich/
  );

  const ungueltig = spielzustand();
  ungueltig.ablaufKennung = '';
  assert.throws(
    () => erstelleGemeinsameStatusSicht(eingabe({ spielzustand: ungueltig })),
    /ablaufKennung darf nicht leer sein/
  );
});
