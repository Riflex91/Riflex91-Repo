import test from 'node:test';
import assert from 'node:assert/strict';
import { DASHBOARD_HTML } from '../src/dashboard.js';

test('V5 dashboard contains the primary live-status cards', () => {
  for (const id of [
    'name','level','hpText','mpText','currentTask','taskHistory',
    'xpPerHour','goldPerHour','runtimeValue','xpProgressText',
    'quickMap','quickParty','quickPing','quickConnection','logRows'
  ]) assert.match(DASHBOARD_HTML, new RegExp('id="' + id + '"'));
});

test('task history remains bounded to three visible dashboard entries', () => {
  assert.match(DASHBOARD_HTML, /return out\.slice\(0,3\)/);
  assert.match(DASHBOARD_HTML, /\[0,1,2\]\.map/);
});

test('V5 dashboard distinguishes live delayed and offline telemetry', () => {
  assert.match(DASHBOARD_HTML, /state==='live'/);
  assert.match(DASHBOARD_HTML, /state==='delayed'/);
  assert.match(DASHBOARD_HTML, /Bot offline/);
  assert.match(DASHBOARD_HTML, /Verbindung/);
});

test('V5 dashboard now has real navigation, settings, log and refresh interactions', () => {
  assert.match(DASHBOARD_HTML, /function showPage\(page\)/);
  assert.match(DASHBOARD_HTML, /function loadSettings\(showToast\)/);
  assert.match(DASHBOARD_HTML, /function saveSettings\(\)/);
  assert.match(DASHBOARD_HTML, /function renderLogs\(\)/);
  assert.match(DASHBOARD_HTML, /function setPollingPaused\(value\)/);
  assert.match(DASHBOARD_HTML, /navigator\.clipboard/);
});

test('dashboard remains outside direct gameplay command authority', () => {
  assert.match(DASHBOARD_HTML, /Bot-Lifecycle-Befehle werden nicht als Web-Funktion vorgetäuscht/);
  assert.doesNotMatch(DASHBOARD_HTML, /command_character\s*\(/);
  assert.doesNotMatch(DASHBOARD_HTML, /attack\s*\(/);
  assert.doesNotMatch(DASHBOARD_HTML, /smart_move\s*\(/);
});
