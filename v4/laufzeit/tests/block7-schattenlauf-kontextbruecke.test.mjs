import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const wurzel = process.cwd();
const datei = path.join(wurzel, 'werkzeuge', 'block7-schattenlauf-kontextbruecke.js');

async function lade(kontext) {
  const code = await readFile(datei, 'utf8');
  vm.runInContext(code, kontext, { filename: 'block7-schattenlauf-kontextbruecke.js' });
}

function umgebung({ lokaleFunktion = true, elternFunktion = false } = {}) {
  let lokaleAufrufe = 0;
  let elternAufrufe = 0;
  const ausgaben = [];
  const eltern = {
    marker: 'eltern',
    V4Testkonsole: { ausgeben(wert, titel) { ausgaben.push({ wert, titel }); } }
  };
  if (elternFunktion) {
    eltern.ms_to_next_skill = function () {
      elternAufrufe += 1;
      return 77;
    };
  }

  const basis = {
    console,
    Object,
    Reflect,
    Error,
    TypeError,
    marker: 'lokal',
    parent: eltern,
    V4Testkonsole: eltern.V4Testkonsole
  };
  if (lokaleFunktion) {
    basis.ms_to_next_skill = function (aktionsName) {
      lokaleAufrufe += 1;
      assert.equal(aktionsName, 'attack');
      return this.marker === 'lokal' ? 123 : 999;
    };
  }

  const kontext = vm.createContext(basis);
  return {
    kontext,
    eltern,
    ausgaben,
    get lokaleAufrufe() { return lokaleAufrufe; },
    get elternAufrufe() { return elternAufrufe; }
  };
}

test('lokales ms_to_next_skill wird ohne Aufruf an den Parent-Kontext weitergereicht', async () => {
  const u = umgebung();
  await lade(u.kontext);

  assert.equal(u.lokaleAufrufe, 0);
  assert.equal(typeof u.eltern.ms_to_next_skill, 'function');
  const status = u.kontext.V4Block7SchattenKontextbruecke.status();
  assert.equal(status.aktiv, true);
  assert.equal(status.quelle, 'lokal');
  assert.equal(status.weitergereicht, true);

  assert.equal(u.eltern.ms_to_next_skill('attack'), 123);
  assert.equal(u.lokaleAufrufe, 1);
});

test('vorhandenes ms_to_next_skill im Parent-Kontext wird nicht ueberschrieben', async () => {
  const u = umgebung({ lokaleFunktion: true, elternFunktion: true });
  const vorher = u.eltern.ms_to_next_skill;
  await lade(u.kontext);

  assert.equal(u.eltern.ms_to_next_skill, vorher);
  const status = u.kontext.V4Block7SchattenKontextbruecke.status();
  assert.equal(status.aktiv, true);
  assert.equal(status.quelle, 'eltern');
  assert.equal(status.weitergereicht, false);
  assert.equal(u.lokaleAufrufe, 0);
  assert.equal(u.eltern.ms_to_next_skill('attack'), 77);
  assert.equal(u.elternAufrufe, 1);
});

test('fehlendes ms_to_next_skill bleibt explizit nicht verfuegbar', async () => {
  const u = umgebung({ lokaleFunktion: false, elternFunktion: false });
  await lade(u.kontext);

  const status = u.kontext.V4Block7SchattenKontextbruecke.status();
  assert.equal(status.aktiv, false);
  assert.equal(status.quelle, 'keine');
  assert.equal(status.weitergereicht, false);
  assert.equal(typeof u.eltern.ms_to_next_skill, 'undefined');
});

test('Kontextbruecke bleibt read-only und enthaelt keine Spielaktionsaufrufe', async () => {
  const code = await readFile(datei, 'utf8');
  for (const name of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot']) {
    assert.doesNotMatch(code, new RegExp(`\\b${name}\\s*\\(`));
  }
  assert.match(code, /ms_to_next_skill/);
});