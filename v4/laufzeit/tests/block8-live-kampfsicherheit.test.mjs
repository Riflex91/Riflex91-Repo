import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import {
  erstelleKampfSicherheitsAblaufZustand,
  erstelleKampfSicherheitsKonfiguration,
  planeKampfSicherheitsSchritt
} from '../../erzeugt/spiellogik/kampfsicherheit.js';

const bekannt = (wert) => ({ zustand: 'bekannt', quelle: 'beobachtet', sicherheit: 1, bekanntSeit: 0, wert });
const unbekannt = (grund = 'unbekannt') => ({ zustand: 'unbekannt', quelle: 'beobachtet', grund });

const block7Pfad = new URL('../../werkzeuge/block7-kampfsicherheits-quelle.js', import.meta.url);
const block8Pfad = new URL('../../werkzeuge/block8-lebensnachweis-schatten.js', import.meta.url);

async function lade(pfad, kontext) {
  vm.runInContext(await readFile(pfad, 'utf8'), kontext, { filename: pfad.pathname.split('/').at(-1) });
}

function rawCharakter(aenderungen = {}) {
  return {
    id: 'char-1',
    name: 'My_Ranger1',
    ctype: 'ranger',
    hp: 900,
    max_hp: 1000,
    mp: 800,
    max_mp: 1000,
    range: 100,
    map: 'main',
    in: 'main',
    x: 0,
    y: 0,
    real_x: 0,
    real_y: 0,
    rip: false,
    target: null,
    ...aenderungen
  };
}

function rawMonster(id, x, y, aenderungen = {}) {
  return {
    id,
    type: 'monster',
    mtype: 'goo',
    hp: 100,
    max_hp: 100,
    map: 'main',
    x,
    y,
    real_x: x,
    real_y: y,
    target: 'char-1',
    dead: false,
    ...aenderungen
  };
}

function produktionsCharakter(raw) {
  const zahl = (wert) => typeof wert === 'number' && Number.isFinite(wert) ? bekannt(wert) : unbekannt();
  return {
    kennung: raw.id === undefined || raw.id === null ? unbekannt() : bekannt(String(raw.id)),
    name: typeof raw.name === 'string' ? bekannt(raw.name) : unbekannt(),
    klasse: typeof raw.ctype === 'string' ? bekannt(raw.ctype) : unbekannt(),
    leben: zahl(raw.hp),
    lebenMaximal: zahl(raw.max_hp),
    mana: zahl(raw.mp),
    manaMaximal: zahl(raw.max_mp),
    reichweite: zahl(raw.range),
    karte: typeof raw.map === 'string' ? bekannt(raw.map) : unbekannt(),
    instanz: typeof raw.in === 'string' ? bekannt(raw.in) : unbekannt(),
    x: zahl(raw.x),
    y: zahl(raw.y),
    echtX: zahl(raw.real_x),
    echtY: zahl(raw.real_y),
    bewegtSich: bekannt(false),
    ziel: raw.target === undefined ? unbekannt() : bekannt(raw.target === null ? null : String(raw.target)),
    tot: typeof raw.rip === 'boolean' ? bekannt(raw.rip) : unbekannt()
  };
}

function produktionsMonster(raw) {
  const zahl = (wert) => typeof wert === 'number' && Number.isFinite(wert) ? bekannt(wert) : unbekannt();
  return {
    kennung: raw.id === undefined || raw.id === null ? unbekannt() : bekannt(String(raw.id)),
    monsterArt: typeof raw.mtype === 'string' ? bekannt(raw.mtype) : unbekannt(),
    leben: zahl(raw.hp),
    lebenMaximal: zahl(raw.max_hp),
    karte: typeof raw.map === 'string' ? bekannt(raw.map) : unbekannt(),
    x: zahl(raw.x),
    y: zahl(raw.y),
    echtX: zahl(raw.real_x),
    echtY: zahl(raw.real_y),
    ziel: raw.target === undefined ? unbekannt() : bekannt(raw.target === null ? null : String(raw.target)),
    tot: typeof raw.dead === 'boolean' ? bekannt(raw.dead) : unbekannt()
  };
}

function produktionsEntscheidung(rawChar, rawEntities, zeit = 10_000) {
  const hpAnteil = typeof rawChar?.hp === 'number' && typeof rawChar?.max_hp === 'number' && rawChar.max_hp > 0
    ? bekannt(Math.max(0, Math.min(1, rawChar.hp / rawChar.max_hp))) : unbekannt('HP nicht lesbar');
  const mpAnteil = typeof rawChar?.mp === 'number' && typeof rawChar?.max_mp === 'number' && rawChar.max_mp > 0
    ? bekannt(Math.max(0, Math.min(1, rawChar.mp / rawChar.max_mp))) : unbekannt('MP nicht lesbar');
  const charakterWert = rawChar ? produktionsCharakter(rawChar) : null;
  const monster = Object.values(rawEntities ?? {}).filter((wert) => wert?.type === 'monster').map(produktionsMonster);
  const zustand = {
    schemaVersion: 2,
    laufendeNummer: 1,
    aufgenommenAm: zeit,
    ablaufKennung: 'block8-live-paritaet',
    beobachtet: {
      charakter: charakterWert ? bekannt(charakterWert) : unbekannt('Charakter fehlt'),
      monster: bekannt(monster)
    },
    abgeleitet: { lebensAnteil: hpAnteil, manaAnteil: mpAnteil },
    gelernt: []
  };
  const cfg = erstelleKampfSicherheitsKonfiguration();
  const vorher = erstelleKampfSicherheitsAblaufZustand(zustand, zeit);
  return planeKampfSicherheitsSchritt(zustand, cfg, vorher, zeit);
}

function umgebung({ charakter = rawCharakter(), entities = {}, jetzt = 10_000, mitSendeFunktion = false } = {}) {
  let zeit = jetzt;
  const gesendet = [];
  class TestDate extends Date { static now() { return zeit; } }
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
    Promise,
    character: charakter,
    entities,
    server_region: 'EU',
    server_identifier: 'I',
    setInterval() { return 77; },
    clearInterval() {},
    V4Testkonsole: { ausgeben() {} }
  };
  if (mitSendeFunktion) basis.send_cm = async (ziel, daten) => { gesendet.push({ ziel, daten }); return true; };
  const kontext = vm.createContext(basis);
  kontext.globalThis = kontext;
  kontext.parent = kontext;
  return { kontext, gesendet, setZeit(wert) { zeit = wert; } };
}

function normal(wert) {
  return JSON.parse(JSON.stringify(wert));
}

for (const fall of [
  { name: 'sicher', charakter: rawCharakter(), entities: {} },
  { name: 'angespannt', charakter: rawCharakter(), entities: { m1: rawMonster('m1', 20, 0) } },
  { name: 'kritisch', charakter: rawCharakter({ hp: 200 }), entities: { m1: rawMonster('m1', 20, 0) } },
  { name: 'unbekannt', charakter: rawCharakter({ mp: undefined }), entities: {} }
]) {
  test(`Block 8 Live-Kampfsicherheit: Browserquelle bleibt fuer ${fall.name} bei der produktiven Block-7-Gefahrenbewertung`, async () => {
    const u = umgebung({ charakter: fall.charakter, entities: fall.entities });
    await lade(block7Pfad, u.kontext);
    const live = u.kontext.V4Block7KampfsicherheitsQuelle.bewerte();
    const produktiv = produktionsEntscheidung(fall.charakter, fall.entities);
    assert.deepEqual(normal(live.gefahrenBewertung), normal(produktiv.gefahrenBewertung));
    assert.equal(live.echteSpielaktionenAusgefuehrt, false);
  });
}

test('Block 8 Live-Kampfsicherheit: kritische Block-7-Bewertung wird automatisch in den gesendeten Lebensnachweis uebernommen', async () => {
  const charakter = rawCharakter({ hp: 200 });
  const entities = { m1: rawMonster('m1', 20, 0) };
  const u = umgebung({ charakter, entities, mitSendeFunktion: true });
  await lade(block7Pfad, u.kontext);
  await lade(block8Pfad, u.kontext);

  u.kontext.V4Block8Lebensnachweis.konfiguriere({
    vertrauensNamen: ['My_Ranger1', 'My_Ranger2'],
    faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 }
  });
  const ergebnis = await u.kontext.V4Block8Lebensnachweis.sendeEinmal();

  assert.equal(ergebnis.meldung.gefahrenStufe, 'kritisch');
  assert.equal(ergebnis.sicherheit.gefahrenStufe, 'kritisch');
  assert.equal(ergebnis.sicherheit.quelle, 'V4Block7KampfsicherheitsQuelle');
  assert.equal(u.gesendet.length, 1);
  assert.equal(u.gesendet[0].daten.meldung.gefahrenStufe, 'kritisch');
});

test('Block 8 Live-Kampfsicherheit: manuelle gefahrenStufe ist im Live-Lebensnachweis verboten', async () => {
  const u = umgebung({ mitSendeFunktion: true });
  await lade(block7Pfad, u.kontext);
  await lade(block8Pfad, u.kontext);

  assert.throws(() => u.kontext.V4Block8Lebensnachweis.konfiguriere({
    vertrauensNamen: ['My_Ranger1', 'My_Ranger2'],
    faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 },
    gefahrenStufe: 'sicher'
  }), /darf nicht mehr manuell konfiguriert/);
});

test('Block 8 Live-Kampfsicherheit: fehlende Block-7-Quelle blockiert vor send_cm', async () => {
  const u = umgebung({ mitSendeFunktion: true });
  await lade(block8Pfad, u.kontext);
  u.kontext.V4Block8Lebensnachweis.konfiguriere({
    vertrauensNamen: ['My_Ranger1', 'My_Ranger2'],
    faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 }
  });

  await assert.rejects(() => u.kontext.V4Block8Lebensnachweis.sendeEinmal(), /muss vor dem Lebensnachweis geladen werden/);
  assert.equal(u.gesendet.length, 0);
  assert.equal(u.kontext.V4Block8Lebensnachweis.status().gesendet, 0);
});

test('Block 8 Live-Kampfsicherheit: stale Block-7-Bewertung blockiert vor send_cm', async () => {
  const u = umgebung({ mitSendeFunktion: true, jetzt: 10_000 });
  u.kontext.V4Block7KampfsicherheitsQuelle = Object.freeze({
    version: 'test',
    bewerte() {
      return {
        schemaVersion: 1,
        werkzeug: 'V4Block7KampfsicherheitsQuelle',
        version: 'test',
        quellBlobSha: 'test',
        ausgewertetAm: 8_000,
        gefahrenBewertung: { stufe: 'sicher', gruende: [] },
        echteSpielaktionenAusgefuehrt: false
      };
    }
  });
  await lade(block8Pfad, u.kontext);
  u.kontext.V4Block8Lebensnachweis.konfiguriere({
    vertrauensNamen: ['My_Ranger1', 'My_Ranger2'],
    faehigkeiten: { heilen: 0, schaden: 1, aggro: 0, schutz: 0, unterstuetzung: 0 },
    sicherheitsMaximalAlterMillisekunden: 1000
  });

  await assert.rejects(() => u.kontext.V4Block8Lebensnachweis.sendeEinmal(), /zu alt/);
  assert.equal(u.gesendet.length, 0);
});
