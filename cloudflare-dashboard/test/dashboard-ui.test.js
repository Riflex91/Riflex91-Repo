import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { DASHBOARD_HTML } from '../src/dashboard.js';
import { SETTINGS_SCHEMA_VERSION, SETTINGS_BY_KEY, normalizeSetting } from '../src/settings-schema.js';

test('legacy backend setting safety limits remain intact after V5 GUI replacement', () => {
  const upgrade = SETTINGS_BY_KEY.get('economy.maxUpgrade');
  const compound = SETTINGS_BY_KEY.get('economy.maxCompound');
  assert.ok(SETTINGS_SCHEMA_VERSION >= 2);
  assert.equal(upgrade.max, 7);
  assert.equal(compound.max, 10);
  assert.equal(normalizeSetting(upgrade, 99), 7);
  assert.equal(normalizeSetting(compound, 99), 10);
});

test('V5 GUI matches the requested core status layout', () => {
  assert.match(DASHBOARD_HTML, /AioBot v5/);
  assert.match(DASHBOARD_HTML, /Dashboard/);
  assert.match(DASHBOARD_HTML, /Charakter/);
  assert.match(DASHBOARD_HTML, /Bot-Status/);
  assert.match(DASHBOARD_HTML, /Aktuelle Aufgabe/);
  assert.match(DASHBOARD_HTML, /Letzte 3 ausgeführte Aufgaben/);
  assert.match(DASHBOARD_HTML, /EXP \/ h/);
  assert.match(DASHBOARD_HTML, /Gold \/ h/);
  assert.match(DASHBOARD_HTML, /Laufzeit/);
  assert.match(DASHBOARD_HTML, /Fortschritt \(aktuelles Level\)/);
  assert.match(DASHBOARD_HTML, /Schnellinfos/);
  assert.match(DASHBOARD_HTML, /Steuerung/);
});

test('V5 GUI renders requested telemetry fields from existing overview transport', () => {
  assert.match(DASHBOARD_HTML, /\/api\/v3\/overview/);
  assert.match(DASHBOARD_HTML, /\/api\/v3\/events\?limit=50/);
  assert.match(DASHBOARD_HTML, /performance\.current\.rates/);
  assert.match(DASHBOARD_HTML, /xpPerHour/);
  assert.match(DASHBOARD_HTML, /goldPerHour/);
  assert.match(DASHBOARD_HTML, /currentTask/);
  assert.match(DASHBOARD_HTML, /taskHistory/);
  assert.match(DASHBOARD_HTML, /uptimeSeconds/);
  assert.match(DASHBOARD_HTML, /characterSelect/);
});

test('V5 GUI controls are visibly present but cannot create gameplay authority', () => {
  assert.match(DASHBOARD_HTML, /data-readonly-control="Bot stoppen"/);
  assert.match(DASHBOARD_HTML, /data-readonly-control="Pause"/);
  assert.match(DASHBOARD_HTML, /data-readonly-control="Neustart"/);
  assert.match(DASHBOARD_HTML, /data-readonly-control="Optionen"/);
  assert.match(DASHBOARD_HTML, /noch read-only/);
  assert.doesNotMatch(DASHBOARD_HTML, /use_skill\s*\(/);
  assert.doesNotMatch(DASHBOARD_HTML, /socket\.emit\s*\(/);
  assert.doesNotMatch(DASHBOARD_HTML, /send_item\s*\(/);
  assert.doesNotMatch(DASHBOARD_HTML, /bank_deposit\s*\(/);
});

test('V5 GUI is responsive and respects reduced motion', () => {
  assert.match(DASHBOARD_HTML, /@media\(max-width:1150px\)/);
  assert.match(DASHBOARD_HTML, /@media\(max-width:760px\)/);
  assert.match(DASHBOARD_HTML, /prefers-reduced-motion:reduce/);
});

test('embedded V5 dashboard browser script parses cleanly', () => {
  const match = DASHBOARD_HTML.match(/<script>([\s\S]*?)<\/script>/i);
  assert.ok(match && match[1]);
  assert.doesNotThrow(() => new vm.Script(match[1], { filename: 'v5-dashboard-inline.js' }));
});
