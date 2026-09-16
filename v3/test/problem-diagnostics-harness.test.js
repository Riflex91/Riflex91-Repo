'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ProductionHostHarness } = require('../host/production-host-harness');

test('production host invokes problem diagnostics without changing controller tick result', async () => {
  let diagnosticsCalls = 0;
  const launcher = {
    status: () => ({ running: true, stats: { restarts: 2 } }),
    start: async () => ({ started: true }),
    stop: async () => ({ stopped: true }),
    restart: async () => ({ restarted: true })
  };
  const controller = {
    tick: async () => ({ watchdog: { state: 'HEALTHY' }, marker: 'controller-result' }),
    status: () => ({ watchdog: { state: 'HEALTHY' } }),
    configureRestart: () => ({})
  };
  const api = {
    start: async () => ({ started: true }),
    stop: async () => ({ stopped: true }),
    status: () => ({ running: false })
  };
  const diagnosticsArchive = {
    tick: async (_client, host) => {
      diagnosticsCalls += 1;
      assert.equal(host.processRunning, true);
      assert.equal(host.restartCount, 2);
      assert.equal(host.watchdogState, 'HEALTHY');
      return { captured: false, reason: 'PROBLEM_DIAGNOSTICS_NO_PROBLEM' };
    },
    flush: async () => ({ uploaded: 0 }),
    status: () => ({ enabled: true, gameplayActionAuthority: false, credentialsExposed: false })
  };
  const harness = new ProductionHostHarness({
    launcher,
    controller,
    api,
    botClient: { status: () => ({ mode: 'narrow-browser-bot-client' }) },
    telemetryExporter: { tick: async () => ({ sent: false, reason: 'TEST_DISABLED' }), status: () => ({ enabled: false }) },
    diagnosticsArchive
  });

  const result = await harness.tick();
  assert.equal(result.marker, 'controller-result');
  assert.equal(diagnosticsCalls, 1);
  assert.equal(harness.status().lastDiagnosticsResult.reason, 'PROBLEM_DIAGNOSTICS_NO_PROBLEM');
  assert.equal(harness.status().gameplayActionAuthority, false);
  assert.equal(harness.status().problemDiagnostics.gameplayActionAuthority, false);
});

test('diagnostics exception is isolated and cannot fail a healthy controller tick', async () => {
  const launcher = { status: () => ({ running: true, stats: { restarts: 0 } }), start: async () => ({ started: true }), stop: async () => ({ stopped: true }), restart: async () => ({ restarted: true }) };
  const controller = { tick: async () => ({ watchdog: { state: 'HEALTHY' }, ok: true }), status: () => ({ watchdog: { state: 'HEALTHY' } }), configureRestart: () => ({}) };
  const api = { start: async () => ({ started: true }), stop: async () => ({ stopped: true }), status: () => ({ running: false }) };
  const harness = new ProductionHostHarness({
    launcher, controller, api,
    botClient: { status: () => ({ mode: 'narrow-browser-bot-client' }) },
    telemetryExporter: { tick: async () => ({ sent: false }), status: () => ({ enabled: false }) },
    diagnosticsArchive: { tick: async () => { throw new Error('ftp-down'); }, flush: async () => ({}), status: () => ({ enabled: true }) }
  });

  const result = await harness.tick();
  assert.equal(result.ok, true);
  assert.equal(harness.status().lastTickError, null);
  assert.equal(harness.status().lastDiagnosticsResult.reason, 'PROBLEM_DIAGNOSTICS_ISOLATED_FAILURE');
  assert.equal(harness.status().lastDiagnosticsResult.error, 'ftp-down');
});
