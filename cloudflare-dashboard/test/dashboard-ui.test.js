import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { DASHBOARD_HTML } from '../src/dashboard.js';
import { SETTINGS_SCHEMA_VERSION, SETTINGS_BY_KEY, normalizeSetting } from '../src/settings-schema.js';

test('legacy backend setting safety limits remain intact after V5 GUI completion', () => {
  const upgrade = SETTINGS_BY_KEY.get('economy.maxUpgrade');
  const compound = SETTINGS_BY_KEY.get('economy.maxCompound');
  assert.ok(SETTINGS_SCHEMA_VERSION >= 2);
  assert.equal(upgrade.max, 7);
  assert.equal(compound.max, 10);
  assert.equal(normalizeSetting(upgrade, 99), 7);
  assert.equal(normalizeSetting(compound, 99), 10);
});

test('V5 GUI keeps the requested status dashboard and fixes the character-name overlap', () => {
  for (const text of [
    'AioBot v5','Dashboard','Charakter','Bot-Status','Aktuelle Aufgabe',
    'Letzte 3 ausgeführte Aufgaben','EXP / h','Gold / h','Laufzeit',
    'Fortschritt (aktuelles Level)','Schnellinfos','Dashboard-Steuerung'
  ]) assert.match(DASHBOARD_HTML, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(DASHBOARD_HTML, /grid-template-columns:minmax\(270px,.8fr\) minmax\(320px,1.2fr\)/);
  assert.match(DASHBOARD_HTML, /\.name\{[^}]*overflow-wrap:anywhere/);
  assert.match(DASHBOARD_HTML, /\.identity\{[^}]*minmax\(0,1fr\)/);
});

test('V5 GUI exposes complete navigable character, task, settings, statistics, logs and help views', () => {
  for (const page of ['dashboard','characters','tasks','settings','statistics','logs','help']) {
    assert.match(DASHBOARD_HTML, new RegExp('data-(?:page|view)="' + page + '"'));
  }
  assert.match(DASHBOARD_HTML, /id="characterCards"/);
  assert.match(DASHBOARD_HTML, /id="taskRows"/);
  assert.match(DASHBOARD_HTML, /id="settingsGroups"/);
  assert.match(DASHBOARD_HTML, /id="statsRows"/);
  assert.match(DASHBOARD_HTML, /id="fullLogRows"/);
});

test('V5 GUI renders telemetry from the existing overview/events transport', () => {
  assert.match(DASHBOARD_HTML, /\/api\/v3\/overview/);
  assert.match(DASHBOARD_HTML, /\/api\/v3\/events\?limit=/);
  assert.match(DASHBOARD_HTML, /performance\.current\.rates/);
  assert.match(DASHBOARD_HTML, /xpPerHour/);
  assert.match(DASHBOARD_HTML, /goldPerHour/);
  assert.match(DASHBOARD_HTML, /currentTask/);
  assert.match(DASHBOARD_HTML, /taskHistory/);
  assert.match(DASHBOARD_HTML, /uptimeSeconds/);
  assert.match(DASHBOARD_HTML, /characterSelect/);
});

test('V5 GUI edits settings through the existing revisioned admin channel', () => {
  assert.match(DASHBOARD_HTML, /X-AIO-Admin-Key/);
  assert.match(DASHBOARD_HTML, /\/api\/v3\/settings/);
  assert.match(DASHBOARD_HTML, /method:'PATCH'/);
  assert.match(DASHBOARD_HTML, /expectedRevision:revision/);
  assert.match(DASHBOARD_HTML, /pendingSettings/);
  assert.match(DASHBOARD_HTML, /Safety Lock/);
  assert.match(DASHBOARD_HTML, /REVISION_CONFLICT/);
});

test('V5 GUI has no fake direct gameplay authority while every visible dashboard control is functional', () => {
  assert.doesNotMatch(DASHBOARD_HTML, /data-readonly-control/);
  assert.match(DASHBOARD_HTML, /id="togglePolling"/);
  assert.match(DASHBOARD_HTML, /id="refreshNow"/);
  assert.match(DASHBOARD_HTML, /id="disconnect"/);
  assert.match(DASHBOARD_HTML, /id="copyLogs"/);
  assert.doesNotMatch(DASHBOARD_HTML, /use_skill\s*\(/);
  assert.doesNotMatch(DASHBOARD_HTML, /socket\.emit\s*\(/);
  assert.doesNotMatch(DASHBOARD_HTML, /send_item\s*\(/);
  assert.doesNotMatch(DASHBOARD_HTML, /bank_deposit\s*\(/);
  assert.doesNotMatch(DASHBOARD_HTML, /command_character\s*\(/);
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
