import test from 'node:test';
import assert from 'node:assert/strict';
import { DASHBOARD_HTML } from '../src/dashboard.js';

test('V5 dashboard contains the exact primary cards requested for the first GUI', () => {
  for (const id of [
    'name','level','hpText','mpText','currentTask','taskHistory',
    'xpPerHour','goldPerHour','runtimeValue','xpProgressText',
    'quickMap','quickParty','quickPing','quickConnection','logRows'
  ]) assert.match(DASHBOARD_HTML, new RegExp('id="' + id + '"'));
});

test('task history is bounded to three visible entries', () => {
  assert.match(DASHBOARD_HTML, /return out\.slice\(0,3\)/);
  assert.match(DASHBOARD_HTML, /\[0,1,2\]\.map/);
});

test('V5 dashboard distinguishes live delayed and offline telemetry', () => {
  assert.match(DASHBOARD_HTML, /state==='live'/);
  assert.match(DASHBOARD_HTML, /state==='delayed'/);
  assert.match(DASHBOARD_HTML, /Bot offline/);
  assert.match(DASHBOARD_HTML, /Verbindung/);
});

test('dashboard keeps status-only authority boundary', () => {
  assert.match(DASHBOARD_HTML, /Statusansicht/);
  assert.match(DASHBOARD_HTML, /read-only/);
  assert.doesNotMatch(DASHBOARD_HTML, /X-AIO-Admin-Key/);
  assert.doesNotMatch(DASHBOARD_HTML, /method:'PATCH'/);
  assert.doesNotMatch(DASHBOARD_HTML, /method:"PATCH"/);
});
