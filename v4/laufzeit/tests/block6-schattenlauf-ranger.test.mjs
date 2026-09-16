import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const quelltext = await readFile(new URL('../../werkzeuge/block6-schattenlauf-ranger.js', import.meta.url), 'utf8');

function basisCharakter(aenderungen = {}) {
  return {
    id: 'ranger-1',
    name: 'TestRanger',
    ctype: 'ranger',
    level: 10,
    hp: 1000,
    max_hp: 1000,
    mp: 500,
    max_mp: 500,
    xp: 100,
    gold: 1000,
    range: 120,
    map: 'main',
    x: 0,
    y: 0,
    real_x: 0,
    real_y: 0,
    rip: false,
    items: [null, null, { name: 'hpot0' }],
    ...aenderungen
  };
}

function basisMonster(aenderungen = {}) {
  return {
    id: 'monster-1',
    type: 'monster',
    mtype: 'goo',
    hp: 50,
    dead: false,
    map: 'main',
    x: 50,
    y: 0,
    real_x: 50,
    real_y: 0,
    ...aenderungen
  };
}

function erstelleKontext({ charakter = basisCharakter(), entities = { m1: basisMonster() } } = {}) {
  const ausgaben = [];
  const verboteneAufrufe = [];
  const kontext = {
    Date,
    Math,
    Object,
    Array,
    Set,
    String,
    Number,
    Error,
    Reflect,
    setInterval,
    clearInterval,
    character: charakter,
    entities,
    server_region: 'EU',
    server_identifier: 'I',
    V4Testkonsole: {
      ausgeben(wert, titel) {
        ausgaben.push({ titel, wert });
      }
    },
    attack() { verboteneAufrufe.push('attack'); },
    move() { verboteneAufrufe.push('move'); },
    smart_move() { verboteneAufrufe.push('smart_move'); },
    use_skill() { verboteneAufrufe.push('use_skill'); },
    use_hp() { verboteneAufrufe.push('use_hp'); },
    use_mp() { verboteneAufrufe.push('use_mp'); },
    loot() { verboteneAufrufe.push('loot'); }
  };
  vm.createContext(kontext);
  vm.runInContext(quelltext, kontext, { filename: 'block6-schattenlauf-ranger.js' });
  return { kontext, ausgaben, verboteneAufrufe };
}

async function kurzerLauf(kontext, monsterArten = ['goo'], optionen = {}) {
  kontext.V4Block6SchattenRanger.starte(monsterArten, {
    dauerMillisekunden: 25,
    intervallMillisekunden: 5,
    zwischenberichtMillisekunden: 10,
    ...optionen
  });
  await new Promise((resolve) => setTimeout(resolve, 60));
  return kontext.V4Block6SchattenRanger.ergebnis();
}

test('Ranger-Schattenrunner ist read-only und plant einen Angriff innerhalb der Reichweite', async () => {
  const { kontext, verboteneAufrufe } = erstelleKontext();
  const bericht = await kurzerLauf(kontext);

  assert.equal(bericht.status, 'abgeschlossen');
  assert.equal(bericht.sicherheit.echteSpielaktionenAusgefuehrt, false);
  assert.ok((bericht.aktionsZaehler.angreifen ?? 0) >= 1);
  assert.deepEqual(verboteneAufrufe, []);
});

test('Ranger-Schattenrunner plant Bewegung ausserhalb der Reichweite', async () => {
  const { kontext } = erstelleKontext({ entities: { m1: basisMonster({ x: 400, real_x: 400 }) } });
  const bericht = await kurzerLauf(kontext);
  assert.ok((bericht.aktionsZaehler.bewegen ?? 0) >= 1);
});

test('Ranger-Schattenrunner priorisiert Lebenswiederherstellung', async () => {
  const { kontext } = erstelleKontext({ charakter: basisCharakter({ hp: 300 }) });
  const bericht = await kurzerLauf(kontext);
  assert.ok((bericht.aktionsZaehler.leben_wiederherstellen ?? 0) >= 1);
});

test('Ranger-Schattenrunner verlangt ausdruecklich erlaubte MonsterArten', () => {
  const { kontext } = erstelleKontext();
  assert.throws(() => kontext.V4Block6SchattenRanger.starte([]), /Mindestens eine ausdruecklich erlaubte MonsterArt/);
});

test('Ranger-Schattenrunner lehnt einen Merchant fuer diesen Test ab', () => {
  const { kontext } = erstelleKontext({ charakter: basisCharakter({ ctype: 'merchant' }) });
  assert.throws(() => kontext.V4Block6SchattenRanger.starte(['goo']), /Ranger vorgesehen/);
});

test('Runner enthaelt keine direkten Adventure-Land-Aktionsaufrufe', () => {
  for (const aktionsName of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot']) {
    assert.equal(new RegExp(`\\b${aktionsName}\\s*\\(`).test(quelltext), false, `Direkter Aufruf gefunden: ${aktionsName}`);
  }
  assert.match(quelltext, /const STANDARD_DAUER = 30 \* 60 \* 1000/);
});
