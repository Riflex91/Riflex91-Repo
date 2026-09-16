import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const wurzel = process.cwd();

async function ladeAktivRunner(kontext) {
  const code = await readFile(path.join(wurzel, 'werkzeuge', 'block6-aktivtest-ranger.js'), 'utf8');
  vm.runInContext(code, kontext, { filename: 'block6-aktivtest-ranger.js' });
}

function testUmgebung({ attack, canAttack }) {
  let planungsNummer = 0;
  let planEreignis = null;
  let schattenLaeuft = false;
  let intervalCallback = null;

  const charakter = {
    id: 'ranger-1', name: 'TestRanger', ctype: 'ranger', level: 59,
    hp: 1000, max_hp: 1000, mp: 500, max_mp: 500,
    xp: 100, gold: 10, map: 'main', x: 0, y: 0, real_x: 0, real_y: 0,
    rip: false, items: Array.from({ length: 42 }, () => null)
  };
  const goo = { id: 'goo-1', type: 'monster', mtype: 'goo', hp: 100, dead: false, map: 'main', x: 50, y: 0 };
  const entities = { 'goo-1': goo };
  const ausgaben = [];

  const schatten = {
    starte() { schattenLaeuft = true; return { laeuft: true }; },
    status() { return { laeuft: schattenLaeuft, anzahlSchritte: planungsNummer }; },
    ergebnis() { return { ereignisse: planEreignis ? [planEreignis] : [] }; },
    stoppe() { schattenLaeuft = false; return { status: 'gestoppt' }; }
  };

  const kontext = vm.createContext({
    console, Date, Math, Object, Array, Set, Map, WeakSet, Promise, Reflect, Number, String, Error, TypeError,
    character: charakter,
    entities,
    V4Block6SchattenRanger: schatten,
    V4Testkonsole: { ausgeben(wert, titel) { ausgaben.push({ wert, titel }); } },
    can_attack: canAttack,
    attack,
    move: async () => {},
    loot: async () => {},
    use_hp: async () => {},
    use_mp: async () => {},
    setInterval(callback) { intervalCallback = callback; return 7; },
    clearInterval() {}
  });
  kontext.parent = kontext;

  return {
    kontext,
    setAngriffsPlan(nummer = 1) {
      planungsNummer = nummer;
      planEreignis = {
        art: 'angreifen',
        meldungsCode: null,
        schattenAnfrage: {
          aktion: 'FARM_ANGREIFEN',
          ressourcen: ['kampfziel'],
          details: { zielKennung: 'goo-1' }
        }
      };
    },
    async tick() {
      assert.equal(typeof intervalCallback, 'function');
      intervalCallback();
      await new Promise((resolve) => setImmediate(resolve));
    }
  };
}

test('transiente Attack-Race wird uebersprungen statt den Aktivtest zu beenden', async () => {
  let attackGestartet = false;
  const umgebung = testUmgebung({
    canAttack: () => !attackGestartet,
    attack: async () => {
      attackGestartet = true;
      throw { reason: 'cooldown', code: 'not_ready' };
    }
  });

  await ladeAktivRunner(umgebung.kontext);
  umgebung.kontext.V4Block6AktivRanger.starte({ monsterArten: ['goo'], dauerMillisekunden: 60_000, aktivFreigegeben: true });
  umgebung.setAngriffsPlan(1);
  await umgebung.tick();

  const status = umgebung.kontext.V4Block6AktivRanger.status();
  assert.equal(status.laeuft, true);
  assert.equal(status.fehlerAnzahl, 0);
  assert.equal(status.uebersprungenZaehler.angriff_zwischenzeitlich_nicht_mehr_moeglich, 1);
});

test('persistente Objekt-Ablehnung stoppt sicher und protokolliert strukturierte Details', async () => {
  const umgebung = testUmgebung({
    canAttack: () => true,
    attack: async () => { throw { reason: 'server_error', code: 500 }; }
  });

  await ladeAktivRunner(umgebung.kontext);
  umgebung.kontext.V4Block6AktivRanger.starte({ monsterArten: ['goo'], dauerMillisekunden: 60_000, aktivFreigegeben: true });
  umgebung.setAngriffsPlan(1);
  await umgebung.tick();

  assert.equal(umgebung.kontext.V4Block6AktivRanger.status().laeuft, false);
  const bericht = umgebung.kontext.V4Block6AktivRanger.kompaktErgebnis();
  assert.equal(bericht.status, 'fehler');
  assert.equal(bericht.fehler.length, 1);
  assert.equal(bericht.fehler[0].typ, 'AdventureLandAngriffsfehler');
  assert.match(bericht.fehler[0].meldung, /server_error/);
  assert.doesNotMatch(bericht.fehler[0].meldung, /\[object Object\]/);
  assert.equal(bericht.fehler[0].details.reason, 'server_error');
  assert.equal(bericht.fehler[0].details.code, 500);
});
