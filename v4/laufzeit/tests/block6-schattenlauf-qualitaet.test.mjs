import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const wurzel = process.cwd();

async function ladeWerkzeug(kontext) {
  const code = await readFile(path.join(wurzel, 'werkzeuge', 'block6-schattenlauf-qualitaet.js'), 'utf8');
  vm.runInContext(code, kontext, { filename: 'block6-schattenlauf-qualitaet.js' });
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
      werkzeug: 'V4Block6SchattenRanger',
      version: '1.0.0',
      status,
      grund: status === 'abgeschlossen' ? 'Die 30-Minuten-Schattenlaufzeit ist abgelaufen.' : 'Zwischenstand.',
      modus: 'schatten',
      charakterKlasse: 'ranger',
      gestartetAm,
      beendetAm,
      dauerMillisekunden: beendetAm - gestartetAm,
      vorgesehenMillisekunden: dauer,
      konfiguration: { monsterArten: ['goo'], intervallMillisekunden: intervall },
      anzahlSchritte: schritte,
      aktionsZaehler: { angreifen: schritte },
      meldungsZaehler: {},
      stillstaende: 0,
      fehler: [],
      verloreneEreignisse: 0,
      start: { zeitpunkt: gestartetAm },
      ende: { zeitpunkt: beendetAm },
      delta: { erfahrung: 0, gold: 0 },
      sicherheit: { echteSpielaktionenAusgefuehrt: false }
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
    V4Block6SchattenRanger: schatten,
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

test('performance_trick wird verpflichtend vor dem Schattenrunner aktiviert', async () => {
  const u = umgebung();
  await ladeWerkzeug(u.kontext);

  const status = u.kontext.V4Block6SchattenQualitaet.starte(['goo']);

  assert.equal(u.performanceTrickAufrufe, 1);
  assert.deepEqual(u.reihenfolge.slice(0, 2), ['performance_trick', 'schatten.starte']);
  assert.equal(status.performanceTrick.aktiviert, true);
  assert.equal(status.performanceTrick.verfuegbar, true);
});

test('ohne performance_trick startet der ueberwachte Schattenlauf nicht', async () => {
  const u = umgebung({ mitPerformanceTrick: false });
  await ladeWerkzeug(u.kontext);

  assert.throws(
    () => u.kontext.V4Block6SchattenQualitaet.starte(['goo']),
    /performance_trick\(\) ist nicht verfuegbar/
  );
  assert.equal(u.reihenfolge.includes('schatten.starte'), false);
});

test('30-Minuten-Lauf mit nur 508 Schritten wird als unvollstaendig markiert', async () => {
  const u = umgebung();
  await ladeWerkzeug(u.kontext);

  u.kontext.V4Block6SchattenQualitaet.starte(['goo']);
  u.beendeAbgeschlossen({ schrittAnzahl: 508, beendetAm: 1_800_000 });
  const ergebnis = u.kontext.V4Block6SchattenQualitaet.kompaktErgebnis();

  assert.equal(ergebnis.status, 'unvollstaendig');
  assert.equal(ergebnis.quellStatus, 'abgeschlossen');
  assert.equal(ergebnis.samplingQualitaet.erwarteteSchritte, 1801);
  assert.equal(ergebnis.samplingQualitaet.tatsaechlicheSchritte, 508);
  assert.equal(ergebnis.samplingQualitaet.verpassteIntervalle, 1293);
  assert.ok(ergebnis.samplingQualitaet.abdeckungProzent < 29);
  assert.equal(ergebnis.samplingQualitaet.browserSamplingAusreichend, false);
  assert.equal(ergebnis.performanceTrick.aktiviert, true);
  assert.match(ergebnis.grund, /Sampling unzureichend/);
});

test('vollstaendig gesampelter Lauf bleibt abgeschlossen und verwendet dynamische Dauer', async () => {
  const u = umgebung();
  await ladeWerkzeug(u.kontext);

  u.kontext.V4Block6SchattenQualitaet.starte(['goo'], {
    dauerMillisekunden: 10_000,
    intervallMillisekunden: 1000,
    zwischenberichtMillisekunden: 5000
  });

  for (let sekunde = 1; sekunde <= 10; sekunde += 1) {
    u.setZeit(sekunde * 1000);
    u.setSchritte(sekunde + 1);
    u.monitor();
  }
  u.beendeAbgeschlossen({ schrittAnzahl: 11, beendetAm: 10_000 });

  const ergebnis = u.kontext.V4Block6SchattenQualitaet.kompaktErgebnis();
  assert.equal(ergebnis.status, 'abgeschlossen');
  assert.equal(ergebnis.samplingQualitaet.erwarteteSchritte, 11);
  assert.equal(ergebnis.samplingQualitaet.tatsaechlicheSchritte, 11);
  assert.equal(ergebnis.samplingQualitaet.abdeckungProzent, 100);
  assert.equal(ergebnis.samplingQualitaet.maximaleTickLueckeMillisekunden, 1000);
  assert.equal(ergebnis.samplingQualitaet.browserSamplingAusreichend, true);
  assert.match(ergebnis.grund, /10s/);
  assert.doesNotMatch(ergebnis.grund, /30-Minuten/);
});

test('Qualitaetsschicht bleibt read-only und enthaelt keine Spielaktionsaufrufe', async () => {
  const code = await readFile(path.join(wurzel, 'werkzeuge', 'block6-schattenlauf-qualitaet.js'), 'utf8');
  for (const name of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot']) {
    assert.doesNotMatch(code, new RegExp(`\\b${name}\\s*\\(`));
  }
  assert.match(code, /performance_trick/);
});
