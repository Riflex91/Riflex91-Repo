import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const wurzel = process.cwd();

async function ladeWerkzeug(kontext) {
  const code = await readFile(path.join(wurzel, 'werkzeuge', 'block7-schattenlauf-qualitaet.js'), 'utf8');
  vm.runInContext(code, kontext, { filename: 'block7-schattenlauf-qualitaet.js' });
}

function umgebung({ mitPerformanceTrick = true } = {}) {
  let jetzt = 0;
  let laeuft = false;
  let schritte = 0;
  let gestartetAm = 0;
  let dauer = 0;
  let intervall = 1000;
  let finalerBericht = null;
  let monitorCallback = null;
  let performanceTrickAufrufe = 0;
  const reihenfolge = [];
  const ausgaben = [];

  class TestDate extends Date {
    static now() { return jetzt; }
  }

  function bericht(status = 'laeuft') {
    const beendetAm = status === 'laeuft' ? jetzt : gestartetAm + dauer;
    return {
      schemaVersion: 1,
      werkzeug: 'V4Block7SchattenRanger',
      version: '1.0.0',
      status,
      grund: status === 'abgeschlossen' ? 'Die konfigurierte Schattenlaufzeit ist abgelaufen.' : 'Zwischenstand.',
      modus: 'block6_7_schatten',
      charakterKlasse: 'ranger',
      gestartetAm,
      beendetAm,
      dauerMillisekunden: beendetAm - gestartetAm,
      vorgesehenMillisekunden: dauer,
      konfiguration: { monsterArten: ['goo'], intervallMillisekunden: intervall },
      anzahlSchritte: schritte,
      aktionsZaehler: { angreifen: schritte },
      sicherheitsZaehler: { normal: schritte },
      farmZaehler: { angreifen: schritte },
      bereitschaftZaehler: { bereit: schritte },
      gefahrenGrundZaehler: {},
      meldungsZaehler: {},
      stillstaende: 0,
      fehler: [],
      verloreneEreignisse: 0,
      start: { zeitpunkt: gestartetAm },
      ende: { zeitpunkt: beendetAm },
      delta: { erfahrung: 0, gold: 0 },
      sicherheit: {
        echteSpielaktionenAusgefuehrt: false,
        reihenfolge: 'Kampfsicherheit vor Farmplanung; Angriffsbereitschaft vor geplantem Angriff.'
      }
    };
  }

  const schatten = {
    starte(_monsterArten, optionen) {
      reihenfolge.push('schatten.starte');
      laeuft = true;
      gestartetAm = jetzt;
      dauer = optionen.dauerMillisekunden;
      intervall = optionen.intervallMillisekunden;
      schritte = 1;
      finalerBericht = null;
      return this.status();
    },
    status() {
      return {
        laeuft,
        gestartetAm,
        vorgesehenBis: gestartetAm + dauer,
        restMillisekunden: Math.max(0, gestartetAm + dauer - jetzt),
        anzahlSchritte: schritte
      };
    },
    ergebnis() { return finalerBericht ?? bericht('laeuft'); },
    stoppe() {
      laeuft = false;
      finalerBericht = bericht('gestoppt');
      return finalerBericht;
    }
  };

  const basis = {
    console,
    Date: TestDate,
    Math,
    Object,
    Array,
    Set,
    Map,
    Reflect,
    Number,
    String,
    Error,
    TypeError,
    V4Block7SchattenRanger: schatten,
    V4Testkonsole: { ausgeben(wert, titel) { ausgaben.push({ wert, titel }); } },
    setInterval(callback) { monitorCallback = callback; return 7; },
    clearInterval() {}
  };

  if (mitPerformanceTrick) {
    basis.performance_trick = () => {
      reihenfolge.push('performance_trick');
      performanceTrickAufrufe += 1;
    };
  }

  const kontext = vm.createContext(basis);
  kontext.parent = kontext;

  return {
    kontext,
    reihenfolge,
    get performanceTrickAufrufe() { return performanceTrickAufrufe; },
    setZeit(wert) { jetzt = wert; },
    setSchritte(wert) { schritte = wert; },
    monitor() {
      assert.equal(typeof monitorCallback, 'function');
      monitorCallback();
    },
    beendeAbgeschlossen({ schrittAnzahl = schritte, beendetAm = gestartetAm + dauer } = {}) {
      schritte = schrittAnzahl;
      jetzt = beendetAm;
      laeuft = false;
      finalerBericht = bericht('abgeschlossen');
      finalerBericht.beendetAm = beendetAm;
      finalerBericht.dauerMillisekunden = beendetAm - gestartetAm;
      finalerBericht.anzahlSchritte = schritte;
      return finalerBericht;
    }
  };
}

test('Block 7 aktiviert performance_trick verpflichtend vor dem Schattenrunner', async () => {
  const u = umgebung();
  await ladeWerkzeug(u.kontext);

  const status = u.kontext.V4Block7SchattenQualitaet.starte(['goo']);

  assert.equal(u.performanceTrickAufrufe, 1);
  assert.deepEqual(u.reihenfolge.slice(0, 2), ['performance_trick', 'schatten.starte']);
  assert.equal(status.performanceTrick.aktiviert, true);
  assert.equal(status.performanceTrick.verfuegbar, true);
  assert.equal(status.samplingQualitaet.erwarteteSchritte, 1);
});

test('Block 7 startet ohne performance_trick keinen ueberwachten Schattenlauf', async () => {
  const u = umgebung({ mitPerformanceTrick: false });
  await ladeWerkzeug(u.kontext);

  assert.throws(
    () => u.kontext.V4Block7SchattenQualitaet.starte(['goo']),
    /performance_trick\(\) ist nicht verfuegbar/
  );
  assert.equal(u.reihenfolge.includes('schatten.starte'), false);
});

test('10-Minuten-Lauf mit 508 statt 601 Schritten wird als unvollstaendig markiert', async () => {
  const u = umgebung();
  await ladeWerkzeug(u.kontext);

  u.kontext.V4Block7SchattenQualitaet.starte(['goo']);
  u.beendeAbgeschlossen({ schrittAnzahl: 508, beendetAm: 600_000 });
  const ergebnis = u.kontext.V4Block7SchattenQualitaet.kompaktErgebnis();

  assert.equal(ergebnis.status, 'unvollstaendig');
  assert.equal(ergebnis.quellStatus, 'abgeschlossen');
  assert.equal(ergebnis.samplingQualitaet.erwarteteSchritte, 601);
  assert.equal(ergebnis.samplingQualitaet.tatsaechlicheSchritte, 508);
  assert.equal(ergebnis.samplingQualitaet.verpassteIntervalle, 93);
  assert.ok(ergebnis.samplingQualitaet.abdeckungProzent < 85);
  assert.equal(ergebnis.samplingQualitaet.browserSamplingAusreichend, false);
  assert.equal(ergebnis.performanceTrick.aktiviert, true);
  assert.match(ergebnis.grund, /Sampling unzureichend/);
});

test('vollstaendig gesampelter 10-Minuten-Block-7-Lauf wird abgeschlossen', async () => {
  const u = umgebung();
  await ladeWerkzeug(u.kontext);

  u.kontext.V4Block7SchattenQualitaet.starte(['goo']);
  for (let sekunde = 1; sekunde <= 600; sekunde += 1) {
    u.setZeit(sekunde * 1000);
    u.setSchritte(sekunde + 1);
    u.monitor();
  }
  u.beendeAbgeschlossen({ schrittAnzahl: 601, beendetAm: 600_000 });

  const ergebnis = u.kontext.V4Block7SchattenQualitaet.kompaktErgebnis();
  assert.equal(ergebnis.status, 'abgeschlossen');
  assert.equal(ergebnis.samplingQualitaet.erwarteteSchritte, 601);
  assert.equal(ergebnis.samplingQualitaet.tatsaechlicheSchritte, 601);
  assert.equal(ergebnis.samplingQualitaet.abdeckungProzent, 100);
  assert.equal(ergebnis.samplingQualitaet.maximaleTickLueckeMillisekunden, 1000);
  assert.equal(ergebnis.samplingQualitaet.browserSamplingAusreichend, true);
  assert.match(ergebnis.grund, /10m 0s/);
  assert.equal(ergebnis.sicherheit.echteSpielaktionenAusgefuehrt, false);
  assert.match(ergebnis.sicherheit.reihenfolge, /Kampfsicherheit vor Farmplanung/);
});

test('Block-7-Qualitaetsschicht bleibt read-only', async () => {
  const code = await readFile(path.join(wurzel, 'werkzeuge', 'block7-schattenlauf-qualitaet.js'), 'utf8');
  for (const name of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot']) {
    assert.doesNotMatch(code, new RegExp(`\\b${name}\\s*\\(`));
  }
  assert.match(code, /performance_trick/);
  assert.match(code, /601/);
});
