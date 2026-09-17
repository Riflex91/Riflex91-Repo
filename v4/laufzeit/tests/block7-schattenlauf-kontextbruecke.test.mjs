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

function umgebung({ cooldown = true, canUse = null, vorhandenesMs = false, shared = false } = {}) {
  let cooldownAufrufe = 0;
  let canUseAufrufe = 0;
  let vorhandeneAufrufe = 0;
  const ausgaben = [];
  const eltern = {
    V4Testkonsole: { ausgeben(wert, titel) { ausgaben.push({ wert, titel }); } },
    next_skill: shared ? { shared_attack: 5600 } : { attack: 6000 }
  };
  if (vorhandenesMs) {
    eltern.ms_to_next_skill = function () {
      vorhandeneAufrufe += 1;
      return 77;
    };
  }

  const basis = {
    console,
    Object,
    Reflect,
    Error,
    TypeError,
    Number,
    Set,
    Date: class extends Date {
      static now() { return 5000; }
    },
    parent: eltern,
    V4Testkonsole: eltern.V4Testkonsole,
    G: { skills: shared ? { attack: { share: 'shared_attack' }, shared_attack: {} } : { attack: {} } }
  };

  if (cooldown !== null) {
    basis.is_on_cooldown = function (aktionsName) {
      cooldownAufrufe += 1;
      assert.equal(aktionsName, 'attack');
      return cooldown;
    };
  }
  if (canUse !== null) {
    basis.can_use = function (aktionsName) {
      canUseAufrufe += 1;
      assert.equal(aktionsName, 'attack');
      return canUse;
    };
  }

  const kontext = vm.createContext(basis);
  return {
    kontext,
    eltern,
    ausgaben,
    get cooldownAufrufe() { return cooldownAufrufe; },
    get canUseAufrufe() { return canUseAufrufe; },
    get vorhandeneAufrufe() { return vorhandeneAufrufe; }
  };
}

test('is_on_cooldown wird ohne Aktivierungsaufruf fuer den Schattenrunner adaptiert', async () => {
  const u = umgebung({ cooldown: true });
  await lade(u.kontext);

  assert.equal(u.cooldownAufrufe, 0);
  assert.equal(typeof u.eltern.ms_to_next_skill, 'function');
  const status = u.kontext.V4Block7SchattenKontextbruecke.status();
  assert.equal(status.aktiv, true);
  assert.match(status.quelle, /^is_on_cooldown:/);
  assert.equal(status.zeitQuelle, 'next_skill');
  assert.equal(status.weitergereicht, true);

  assert.equal(u.eltern.ms_to_next_skill('attack'), 1000);
  assert.equal(u.cooldownAufrufe, 1);
});

test('kein aktiver Cooldown ergibt exakt null Restzeit', async () => {
  const u = umgebung({ cooldown: false });
  await lade(u.kontext);
  assert.equal(u.eltern.ms_to_next_skill('attack'), 0);
  assert.equal(u.cooldownAufrufe, 1);
});

test('geteilter Cooldown folgt G.skills.share wie Adventure Land', async () => {
  const u = umgebung({ cooldown: true, shared: true });
  await lade(u.kontext);
  assert.equal(u.eltern.ms_to_next_skill('attack'), 600);
});

test('can_use ist nur positiver Fallback; false bleibt unbekannt', async () => {
  const bereit = umgebung({ cooldown: null, canUse: true });
  await lade(bereit.kontext);
  assert.equal(bereit.eltern.ms_to_next_skill('attack'), 0);
  assert.equal(bereit.canUseAufrufe, 1);

  const unbekannt = umgebung({ cooldown: null, canUse: false });
  await lade(unbekannt.kontext);
  assert.equal(Number.isNaN(unbekannt.eltern.ms_to_next_skill('attack')), true);
});

test('vorhandenes natives ms_to_next_skill wird nicht ueberschrieben', async () => {
  const u = umgebung({ cooldown: true, vorhandenesMs: true });
  const vorher = u.eltern.ms_to_next_skill;
  await lade(u.kontext);

  assert.equal(u.eltern.ms_to_next_skill, vorher);
  const status = u.kontext.V4Block7SchattenKontextbruecke.status();
  assert.equal(status.aktiv, true);
  assert.equal(status.quelle, 'vorhandenes_ms_to_next_skill');
  assert.equal(status.weitergereicht, false);
  assert.equal(u.eltern.ms_to_next_skill('attack'), 77);
  assert.equal(u.vorhandeneAufrufe, 1);
});

test('fehlende Bereitschaftsschnittstellen bleiben explizit nicht verfuegbar', async () => {
  const u = umgebung({ cooldown: null, canUse: null });
  await lade(u.kontext);

  const status = u.kontext.V4Block7SchattenKontextbruecke.status();
  assert.equal(status.aktiv, false);
  assert.equal(status.quelle, 'keine');
  assert.equal(status.weitergereicht, false);
  assert.equal(typeof u.eltern.ms_to_next_skill, 'undefined');
});

test('Bereitschaftsadapter bleibt read-only und enthaelt keine Spielaktionsaufrufe', async () => {
  const code = await readFile(datei, 'utf8');
  for (const name of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot']) {
    assert.doesNotMatch(code, new RegExp(`\\b${name}\\s*\\(`));
  }
  assert.match(code, /is_on_cooldown/);
  assert.match(code, /next_skill/);
});