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
