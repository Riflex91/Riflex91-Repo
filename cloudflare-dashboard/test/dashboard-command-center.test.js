import test from 'node:test';
import assert from 'node:assert/strict';
import { DASHBOARD_HTML } from '../src/dashboard.js';

test('command center overview shows the five requested capacity concepts', () => {
  assert.match(DASHBOARD_HTML, /id="capacityDeck"/);
  assert.match(DASHBOARD_HTML, /title:'Worker'/);
  assert.match(DASHBOARD_HTML, /title:'D1'/);
  assert.match(DASHBOARD_HTML, /title:'R2'/);
  assert.match(DASHBOARD_HTML, /title:'Supabase'/);
  assert.match(DASHBOARD_HTML, /title:'Gehirn'/);
  assert.doesNotMatch(DASHBOARD_HTML, /Supabase Cached Egress/);
  assert.doesNotMatch(DASHBOARD_HTML, /id="overviewMetrics"/);
  assert.doesNotMatch(DASHBOARD_HTML, /id="warnings"/);
});

test('character cards show compact online and offline durations', () => {
  assert.match(DASHBOARD_HTML, /Onlinezeit/);
  assert.match(DASHBOARD_HTML, /Offlinezeit/);
  assert.match(DASHBOARD_HTML, /startedAt/);
  assert.match(DASHBOARD_HTML, /durationHms/);
  assert.match(DASHBOARD_HTML, /durationHms\(age\)/);
  assert.match(DASHBOARD_HTML, /if\(hours\)parts\.push\(hours\+' Std'\)/);
  assert.match(DASHBOARD_HTML, /if\(minutes\)parts\.push\(minutes\+' Min'\)/);
  assert.match(DASHBOARD_HTML, /if\(secs\|\|!parts\.length\)parts\.push\(secs\+' Sek'\)/);
  assert.match(DASHBOARD_HTML, /displayState=state==='offline'\?'offline':'online'/);
  assert.match(DASHBOARD_HTML, /displayState\+' · '\+durationHms\(age\)/);
  assert.match(DASHBOARD_HTML, /Number\(age\)\|\|0\)-120/);
  assert.doesNotMatch(DASHBOARD_HTML, /padStart\(2,'0'\)/);
  assert.doesNotMatch(DASHBOARD_HTML, /fmt\(age\)\+'s'/);
});

test('character cards show worn equipment and inventory from the character registry', () => {
  assert.match(DASHBOARD_HTML, /Getragene Ausrüstung/);
  assert.match(DASHBOARD_HTML, /Inventar/);
  assert.match(DASHBOARD_HTML, /equipment-board/);
  assert.match(DASHBOARD_HTML, /inventory-grid/);
  assert.match(DASHBOARD_HTML, /s\.party&&Array\.isArray\(s\.party\.characters\)/);
  assert.match(DASHBOARD_HTML, /registryCharacter\.inventory/);
  assert.match(DASHBOARD_HTML, /registryCharacter\.gear/);
  assert.match(DASHBOARD_HTML, /earring1/);
  assert.match(DASHBOARD_HTML, /ring1/);
  assert.match(DASHBOARD_HTML, /helmet/);
  assert.match(DASHBOARD_HTML, /mainhand/);
  assert.match(DASHBOARD_HTML, /offhand/);
  assert.match(DASHBOARD_HTML, /locked/);
  assert.match(DASHBOARD_HTML, /special/);
});

test('event importance is visually obvious for ok warning and critical events', () => {
  assert.match(DASHBOARD_HTML, /\.event\.ok/);
  assert.match(DASHBOARD_HTML, /\.event\.warn/);
  assert.match(DASHBOARD_HTML, /\.event\.critical/);
  assert.match(DASHBOARD_HTML, /priorityPulse/);
  assert.match(DASHBOARD_HTML, /content:'✓ '/);
  assert.match(DASHBOARD_HTML, /content:'⚠ '/);
  assert.match(DASHBOARD_HTML, /content:'⛔ '/);
  assert.match(DASHBOARD_HTML, /KRITISCH/);
  assert.match(DASHBOARD_HTML, /WARNUNG/);
});

test('command center exposes an alternate touch-first mobile interface', () => {
  assert.match(DASHBOARD_HTML, /mobile-ui/);
  assert.match(DASHBOARD_HTML, /mobile-bottom-nav/);
  assert.match(DASHBOARD_HTML, /data-mobile-more/);
  assert.match(DASHBOARD_HTML, /aioV3PreferredView/);
  assert.match(DASHBOARD_HTML, /📱 Mobil/);
});

test('command center keeps the cognitive brain, simplified settings and important-event filters', () => {
  assert.match(DASHBOARD_HTML, /THOUGHT STREAM/);
  assert.match(DASHBOARD_HTML, /COMMAND AUTHORITY/);
  assert.match(DASHBOARD_HTML, /function isImportantEvent/);
  assert.match(DASHBOARD_HTML, /KRITISCH/);
  assert.match(DASHBOARD_HTML, /WARNUNG/);
  assert.match(DASHBOARD_HTML, /Live-Zustand/);
  assert.match(DASHBOARD_HTML, /Lernen & Entscheidungen/);
  assert.match(DASHBOARD_HTML, /Diagnose & Audit/);
  assert.match(DASHBOARD_HTML, /Cloud & Langzeitgedächtnis/);
});
