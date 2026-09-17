import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const wurzel = process.cwd();
const datei = path.join(wurzel, 'werkzeuge', 'block7-kontrollierter-aktivtest.js');

async function lade({ mitAngreifer = true } = {}) {
  const code = await readFile(datei, 'utf8');
  const ausgaben = [];
  const bewegungen = [];
  const charakter = {
    id: 'char-1', name: 'Ranger', ctype: 'ranger', rip: false, moving: false,
    map: 'main', real_x: 0, real_y: 0, hp: 900, max_hp: 1000
  };
  const parent = {
    character: charakter,
    entities: mitAngreifer ? {
      m1: { id: 'm1', type: 'monster', mtype: 'goo', hp: 100, dead: false, map: 'main', real_x: 10, real_y: 0, target: 'char-1' }
    } : {},
    move(x, y) {
      bewegungen.push([x, y]);
      charakter.real_x = x;
      charakter.real_y = y;
    },
    V4Testkonsole: { ausgeben(wert, titel) { ausgaben.push({ wert, titel }); } }
  };
  parent.parent = parent;
  const basis = {
    console,
    parent,
    Promise,
    Date,
    Math,
    Object,
    Reflect,
    Set,
    String,
    Number,
    Error,
    setTimeout,
    clearTimeout,
    V4Testkonsole: parent.V4Testkonsole
  };
  const kontext = vm.createContext(basis);
  vm.runInContext(code, kontext, { filename: 'block7-kontrollierter-aktivtest.js' });
  return { code, kontext, parent, charakter, bewegungen, ausgaben };
}

test('kontrollierter Block-7-Aktivtest startet gesperrt und Vorschau bleibt read-only', async () => {
  const u = await lade();
  assert.equal(u.kontext.V4Block7Aktivtest.status().freigegeben, false);
  const vorschau = u.kontext.V4Block7Aktivtest.vorschau('rueckzug', 12);
  assert.equal(vorschau.art, 'rueckzug');
  assert.equal(vorschau.zielPosition[0], -12);
  assert.equal(vorschau.zielPosition[1], 0);
  assert.deepEqual(u.bewegungen, []);
});

test('Aktivtest verlangt exakten Freigabetext und ist one-shot', async () => {
  const u = await lade();
  assert.throws(() => u.kontext.V4Block7Aktivtest.freigeben('ja'), /Falscher Freigabetext/);
  const text = u.kontext.V4Block7Aktivtest.freigabeText();
  const freigabe = u.kontext.V4Block7Aktivtest.freigeben(text);
  assert.equal(freigabe.freigegeben, true);

  const ergebnis = await u.kontext.V4Block7Aktivtest.starte('rueckzug', 12);
  assert.equal(ergebnis.status, 'bestanden');
  assert.equal(ergebnis.echteSpielaktionen.move, 1);
  assert.equal(ergebnis.echteSpielaktionen.sonstige, 0);
  assert.equal(u.bewegungen.length, 1);
  assert.deepEqual(u.bewegungen[0], [-12, 0]);
  assert.equal(u.kontext.V4Block7Aktivtest.status().freigegeben, false);
  await assert.rejects(() => u.kontext.V4Block7Aktivtest.starte('rueckzug', 12), /gesperrt/);
});

test('Aktivtest erfindet ohne aktuellen Angreifer keine Sicherheitsbewegung', async () => {
  const u = await lade({ mitAngreifer: false });
  assert.throws(() => u.kontext.V4Block7Aktivtest.vorschau('abstand', 8), /Kein sichtbares Monster greift/);
  const text = u.kontext.V4Block7Aktivtest.freigabeText();
  u.kontext.V4Block7Aktivtest.freigeben(text);
  await assert.rejects(() => u.kontext.V4Block7Aktivtest.starte('abstand', 8), /Kein sichtbares Monster greift/);
  assert.deepEqual(u.bewegungen, []);
});

test('Aktivtest begrenzt jede echte Bewegung auf hoechstens 20 Einheiten', async () => {
  const u = await lade();
  assert.throws(() => u.kontext.V4Block7Aktivtest.vorschau('rueckzug', 21), /hoechstens 20/);
  assert.deepEqual(u.bewegungen, []);
});

test('Aktivtest besitzt keinen Pfad zu Angriff, Skill, Heal, Mana oder Loot', async () => {
  const u = await lade();
  for (const name of ['attack', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'use_hp_or_mp', 'loot']) {
    assert.doesNotMatch(u.code, new RegExp(`\\b${name}\\s*\\(`));
  }
  assert.match(u.code, /Reflect\.apply\(move/);
});
