import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const wurzel = process.cwd();

async function ladeWerkzeug(datei, kontext) {
  const code = await readFile(path.join(wurzel, 'werkzeuge', datei), 'utf8');
  vm.runInContext(code, kontext, { filename: datei });
}

function basisKontext(aenderungen = {}) {
  const ausgaben = [];
  const kontext = vm.createContext({
    console,
    Date,
    Math,
    Object,
    Array,
    Set,
    Map,
    Promise,
    Reflect,
    Number,
    String,
    Error,
    TypeError,
    setInterval: () => 1,
    clearInterval: () => {},
    V4Testkonsole: {
      ausgeben(wert, titel) {
        ausgaben.push({ wert, titel });
      }
    },
    ...aenderungen
  });
  kontext.parent = kontext;
  kontext.__ausgaben = ausgaben;
  return kontext;
}

test('Kompaktbericht erweitert die Schatten-API und laesst grosse Detailfelder weg', async () => {
  const voll = {
    schemaVersion: 1,
    werkzeug: 'V4Block6SchattenRanger',
    version: '1.0.0',
    status: 'abgeschlossen',
    grund: 'fertig',
    modus: 'schatten',
    charakterKlasse: 'ranger',
    gestartetAm: 10,
    beendetAm: 20,
    dauerMillisekunden: 10,
    vorgesehenMillisekunden: 10,
    konfiguration: { monsterArten: ['goo'] },
    anzahlSchritte: 10,
    aktionsZaehler: { angreifen: 8 },
    meldungsZaehler: {},
    zielZaehler: { riesig: 999 },
    stillstaende: 0,
    fehler: [],
    verloreneEreignisse: 0,
    ereignisse: Array.from({ length: 100 }, (_, index) => ({ index })),
    start: { charakter: { erfahrung: 100 } },
    ende: { charakter: { erfahrung: 120 } },
    delta: { erfahrung: 20, gold: 3 },
    sicherheit: { echteSpielaktionenAusgefuehrt: false }
  };
  const kontext = basisKontext({
    V4Block6SchattenRanger: Object.freeze({
      ergebnis: () => voll,
      starte: () => {},
      status: () => ({ laeuft: false }),
      stoppe: () => {}
    })
  });

  await ladeWerkzeug('block6-kompaktbericht.js', kontext);
  const kompakt = kontext.V4Block6SchattenRanger.kompaktErgebnis();

  assert.equal(kompakt.status, 'abgeschlossen');
  assert.deepEqual({ ...kompakt.delta }, { erfahrung: 20, gold: 3 });
  assert.equal('ereignisse' in kompakt, false);
  assert.equal('zielZaehler' in kompakt, false);
  assert.equal(kontext.V4Block6Kompaktbericht.ergebnis().anzahlSchritte, 10);
});

function aktiverKontext() {
  let planungsNummer = 0;
  let planEreignis = null;
  let schattenLaeuft = false;
  let intervalCallback = null;
  const aufrufe = { attack: 0, move: 0, loot: 0, hp: 0, mp: 0 };

  const charakter = {
    id: 'ranger-1',
    name: 'TestRanger',
    ctype: 'ranger',
    level: 59,
    hp: 1000,
    max_hp: 1000,
    mp: 500,
    max_mp: 500,
    xp: 100,
    gold: 10,
    map: 'main',
    x: 0,
    y: 0,
    real_x: 0,
    real_y: 0,
    rip: false,
    items: Array.from({ length: 42 }, () => null)
  };
  const goo = { id: 'goo-1', type: 'monster', mtype: 'goo', hp: 100, dead: false, map: 'main', x: 50, y: 0 };
  const entities = { 'goo-1': goo };

  const schatten = {
    starte() {
      schattenLaeuft = true;
      return { laeuft: true };
    },
    status() {
      return { laeuft: schattenLaeuft, anzahlSchritte: planungsNummer };
    },
    ergebnis() {
      return { ereignisse: planEreignis ? [planEreignis] : [] };
    },
    stoppe() {
      schattenLaeuft = false;
      return { status: 'gestoppt' };
    }
  };

  const kontext = basisKontext({
    character: charakter,
    entities,
    V4Block6SchattenRanger: schatten,
    can_attack: () => true,
    attack: async () => { aufrufe.attack += 1; },
    move: async () => { aufrufe.move += 1; },
    loot: async () => { aufrufe.loot += 1; },
    use_hp: async () => { aufrufe.hp += 1; },
    use_mp: async () => { aufrufe.mp += 1; },
    setInterval(callback) {
      intervalCallback = callback;
      return 7;
    },
    clearInterval() {}
  });

  return {
    kontext,
    aufrufe,
    setPlan(nummer, ereignis) {
      planungsNummer = nummer;
      planEreignis = ereignis;
    },
    async tick() {
      assert.equal(typeof intervalCallback, 'function');
      intervalCallback();
      await new Promise((resolve) => setImmediate(resolve));
    }
  };
}

test('Aktivtest verlangt explizite Freigabe, ranger, goo und maximal 15 Minuten', async () => {
  const { kontext } = aktiverKontext();
  await ladeWerkzeug('block6-aktivtest-ranger.js', kontext);

  assert.throws(() => kontext.V4Block6AktivRanger.starte({ monsterArten: ['goo'] }), /aktivFreigegeben/);
  assert.throws(() => kontext.V4Block6AktivRanger.starte({ monsterArten: ['bee'], aktivFreigegeben: true }), /ausschliesslich/);
  assert.throws(() => kontext.V4Block6AktivRanger.starte({ monsterArten: ['goo'], dauerMillisekunden: 15 * 60 * 1000 + 1, aktivFreigegeben: true }), /maximal 15 Minuten/);
});

test('Aktivtest fuehrt pro neuem Schatten-Planungsschritt genau eine freigegebene Aktion aus', async () => {
  const testUmgebung = aktiverKontext();
  const { kontext, aufrufe } = testUmgebung;
  await ladeWerkzeug('block6-aktivtest-ranger.js', kontext);

  const start = kontext.V4Block6AktivRanger.starte({
    monsterArten: ['goo'],
    dauerMillisekunden: 60_000,
    aktivFreigegeben: true
  });
  assert.equal(start.laeuft, true);
  assert.equal(aufrufe.attack, 0);

  testUmgebung.setPlan(1, {
    art: 'angreifen',
    meldungsCode: null,
    schattenAnfrage: {
      aktion: 'FARM_ANGREIFEN',
      ressourcen: ['kampfziel'],
      details: { zielKennung: 'goo-1' }
    }
  });
  await testUmgebung.tick();
  assert.equal(aufrufe.attack, 1);

  await testUmgebung.tick();
  assert.equal(aufrufe.attack, 1, 'Ohne neuen Planungsschritt darf keine zweite Aktion entstehen.');

  testUmgebung.setPlan(2, {
    art: 'angreifen',
    meldungsCode: null,
    schattenAnfrage: {
      aktion: 'FARM_ANGREIFEN',
      ressourcen: ['kampfziel'],
      details: { zielKennung: 'goo-1' }
    }
  });
  await testUmgebung.tick();
  assert.equal(aufrufe.attack, 2, 'Gleiche Entscheidung darf bei einem neuen Planungsschritt erneut ausgefuehrt werden.');

  const bericht = kontext.V4Block6AktivRanger.kompaktErgebnis();
  assert.equal(bericht.ausgefuehrtZaehler.FARM_ANGREIFEN, 2);
  assert.equal(bericht.fehler.length, 0);
});

test('Aktivtest stoppt bei Blockierung statt eine unsichere Aktion zu erfinden', async () => {
  const testUmgebung = aktiverKontext();
  const { kontext, aufrufe } = testUmgebung;
  await ladeWerkzeug('block6-aktivtest-ranger.js', kontext);
  kontext.V4Block6AktivRanger.starte({ monsterArten: ['goo'], dauerMillisekunden: 60_000, aktivFreigegeben: true });

  testUmgebung.setPlan(1, {
    art: 'blockiert',
    meldungsCode: 'FARM_INVENTAR_VOLL',
    grund: 'Inventar voll',
    schattenAnfrage: null
  });
  await testUmgebung.tick();

  assert.equal(kontext.V4Block6AktivRanger.status().laeuft, false);
  assert.equal(aufrufe.attack + aufrufe.move + aufrufe.loot + aufrufe.hp + aufrufe.mp, 0);
  assert.equal(kontext.V4Block6AktivRanger.ergebnis().status, 'sicherheitsstopp');
});
