import test from 'node:test';
import assert from 'node:assert/strict';
import { DASHBOARD_HTML } from '../src/dashboard.js';
import { SETTINGS_SCHEMA_VERSION, SETTINGS_BY_KEY, normalizeSetting } from '../src/settings-schema.js';

test('dashboard progression limits follow current v3 upgrade and compound policies', () => {
  const upgrade = SETTINGS_BY_KEY.get('economy.maxUpgrade');
  const compound = SETTINGS_BY_KEY.get('economy.maxCompound');

  assert.ok(SETTINGS_SCHEMA_VERSION >= 2);
  assert.equal(upgrade.max, 7);
  assert.equal(compound.max, 10);
  assert.equal(normalizeSetting(upgrade, 99), 7);
  assert.equal(normalizeSetting(compound, 99), 10);
});

test('settings UI exposes collapsible categories and bulk accordion actions', () => {
  assert.match(DASHBOARD_HTML, /<details class="settingscat"/);
  assert.match(DASHBOARD_HTML, /id="expandSettings"/);
  assert.match(DASHBOARD_HTML, /id="collapseSettings"/);
  assert.match(DASHBOARD_HTML, /aioV3SettingsOpen/);
});

test('dashboard keeps accessibility and operator feedback in the polished UI', () => {
  assert.match(DASHBOARD_HTML, /prefers-reduced-motion:reduce/);
  assert.match(DASHBOARD_HTML, /class="switch"/);
  assert.match(DASHBOARD_HTML, /id="dirtyPill"/);
  assert.match(DASHBOARD_HTML, /id="toast"/);
  assert.match(DASHBOARD_HTML, /Hard Cap \+7/);
  assert.match(DASHBOARD_HTML, /Hard Cap \+10/);
});

test('item permission setting is hidden, structured and sanitizes invalid actions', () => {
  const permissions = SETTINGS_BY_KEY.get('economy.itemPermissions');
  assert.ok(permissions);
  assert.equal(permissions.type, 'item-permissions');
  assert.equal(permissions.hidden, true);
  assert.deepEqual(normalizeSetting(permissions, {
    sword: { sell: false, bank: true, upgrade: true, unknown: true },
    ring: { compound: false },
    broken: 'yes'
  }), {
    sword: { sell: false, bank: true, upgrade: true },
    ring: { compound: false }
  });
  assert.doesNotMatch(DASHBOARD_HTML, /Item-Berechtigungen<\/label>/);
});


test('Automation UI uses a persisted Adventure Land Atlas view and dedicated catalog source', () => {
  assert.match(DASHBOARD_HTML, /data-automation-view="atlas"/);
  assert.match(DASHBOARD_HTML, /data-automation-view="details"/);
  assert.match(DASHBOARD_HTML, /aioV3AutomationView/);
  assert.match(DASHBOARD_HTML, /automation-atlas-item/);
  assert.match(DASHBOARD_HTML, /\/api\/v3\/automation-catalog/);
  assert.match(DASHBOARD_HTML, /eigener Katalogkanal/);
});

test('Automation search normalizes and token-matches the complete item metadata', () => {
  assert.match(DASHBOARD_HTML, /function automationMatchesQuery/);
  assert.match(DASHBOARD_HTML, /terms\.every\(term=>hay\.includes\(term\)\)/);
  assert.match(DASHBOARD_HTML, /item\.id,item\.name,item\.type,item\.wtype,item\.description/);
});
