import test from 'node:test';
import assert from 'node:assert/strict';
import { DASHBOARD_HTML } from '../src/dashboard.js';

test('command center overview is reduced to the three capacity concepts', () => {
  assert.match(DASHBOARD_HTML, /id="capacityDeck"/);
  assert.match(DASHBOARD_HTML, /Cloudflare Worker/);
  assert.match(DASHBOARD_HTML, /Supabase Egress/);
  assert.match(DASHBOARD_HTML, /Supabase Cached Egress/);
  assert.doesNotMatch(DASHBOARD_HTML, /id="overviewMetrics"/);
  assert.doesNotMatch(DASHBOARD_HTML, /id="warnings"/);
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
