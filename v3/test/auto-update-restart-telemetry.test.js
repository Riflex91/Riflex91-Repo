'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PLANNED_AUTO_UPDATE_REASON,
  PLANNED_AUTO_UPDATE_MARKER,
  PLANNED_AUTO_UPDATE_TTL_MS,
  installAutoUpdateRestartTelemetry,
  readPlannedAutoUpdateMarker,
  writePlannedAutoUpdateMarker
} = require('../src/reliability/alpha26-cloud-update-logistics-ui-hotfix');

// The success event must originate from the newly loaded runtime so the telemetry exporter cannot miss it during the handoff.
function updaterFixture(overrides = {}) {
  return {
    localVersion: '3.0.0-alpha.20.54',
    pendingVersion: '3.0.0-alpha.20.54',
    lastApply: null,
    async _reloadSavedCode() { return true; },
    _event() {},
    ...overrides
  };
}

test('planned auto-update reload is handed off and emitted by the newly loaded runtime', async () => {
  const root = {};
  const firstRuntime = { root, now: () => 1_000_000, log: { emit() {} } };
  let markerSeenDuringReload = null;
  const firstUpdater = updaterFixture({
    lastApply: {
      at: 1_000_000,
      from: '3.0.0-alpha.20.54',
      to: '3.0.0-alpha.20.54',
      slot: 7,
      bytes: 1_234_567,
      saved: true,
      reloaded: false
    },
    async _reloadSavedCode() {
      markerSeenDuringReload = readPlannedAutoUpdateMarker(firstRuntime);
      return true;
    }
  });

  assert.equal(installAutoUpdateRestartTelemetry(firstRuntime, firstUpdater), true);
  await firstUpdater._reloadSavedCode({ slot: 7 });

  assert.equal(firstUpdater.lastApply.restartReason, PLANNED_AUTO_UPDATE_REASON);
  assert.equal(markerSeenDuringReload.restartReason, PLANNED_AUTO_UPDATE_REASON);
  assert.equal(markerSeenDuringReload.from, '3.0.0-alpha.20.54');
  assert.equal(markerSeenDuringReload.to, '3.0.0-alpha.20.54');
  assert.equal(markerSeenDuringReload.slot, 7);
  assert.equal(root[PLANNED_AUTO_UPDATE_MARKER].restartReason, PLANNED_AUTO_UPDATE_REASON);

  const events = [];
  const secondRuntime = { root, now: () => 1_002_000, log: { emit() {} } };
  const secondUpdater = updaterFixture({
    localVersion: '3.0.0-alpha.20.54',
    pendingVersion: null,
    _event(event, severity, reason, data) { events.push({ event, severity, reason, data }); }
  });

  assert.equal(installAutoUpdateRestartTelemetry(secondRuntime, secondUpdater), true);
  assert.equal(root[PLANNED_AUTO_UPDATE_MARKER], undefined);
  assert.equal(secondUpdater.lastApply.reloaded, true);
  assert.equal(secondUpdater.lastApply.restartReason, PLANNED_AUTO_UPDATE_REASON);
  assert.equal(secondUpdater.lastApply.from, '3.0.0-alpha.20.54');
  assert.equal(secondUpdater.lastApply.to, '3.0.0-alpha.20.54');
  assert.equal(secondUpdater.lastApply.slot, 7);
  assert.equal(events.length, 1);
  assert.equal(events[0].event, 'AUTO_UPDATE_APPLIED');
  assert.equal(events[0].severity, 'info');
  assert.equal(events[0].reason, 'SAFE_RELEASE_RELOADED');
  assert.equal(events[0].data.restartReason, PLANNED_AUTO_UPDATE_REASON);
  assert.equal(events[0].data.reloaded, true);
});

test('failed reload clears the planned restart handoff so it cannot masquerade as a success', async () => {
  const root = {};
  const runtime = { root, now: () => 2_000_000, log: { emit() {} } };
  const updater = updaterFixture({
    lastApply: {
      at: 2_000_000,
      from: '3.0.0-alpha.20.54',
      to: '3.0.0-alpha.20.54',
      slot: 3,
      bytes: 500_000,
      saved: true,
      reloaded: false
    },
    async _reloadSavedCode() { throw new Error('synthetic reload failure'); }
  });

  installAutoUpdateRestartTelemetry(runtime, updater);
  await assert.rejects(() => updater._reloadSavedCode({ slot: 3 }), /synthetic reload failure/);
  assert.equal(readPlannedAutoUpdateMarker(runtime), null);
});

test('stale planned restart markers are discarded without emitting AUTO_UPDATE_APPLIED', () => {
  const root = {};
  const now = 5_000_000;
  const runtime = { root, now: () => now, log: { emit() {} } };
  writePlannedAutoUpdateMarker(runtime, {
    at: now - PLANNED_AUTO_UPDATE_TTL_MS - 1,
    from: '3.0.0-alpha.20.22',
    to: '3.0.0-alpha.20.54',
    slot: 4,
    restartReason: PLANNED_AUTO_UPDATE_REASON
  });
  const events = [];
  const updater = updaterFixture({
    localVersion: '3.0.0-alpha.20.54',
    _event(event, severity, reason, data) { events.push({ event, severity, reason, data }); }
  });

  installAutoUpdateRestartTelemetry(runtime, updater);
  assert.equal(readPlannedAutoUpdateMarker(runtime), null);
  assert.equal(events.length, 0);
  assert.equal(updater.lastApply, null);
});
