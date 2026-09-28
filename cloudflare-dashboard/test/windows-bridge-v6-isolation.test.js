import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('active Windows Bridge service is V6-only', () => {
  const service = read('../../ops/windows-bridge/TelemetryBridgeService.cs');
  assert.match(service, /CdpAlBotV6Client _browser/);
  assert.doesNotMatch(service, /CdpAdventureLandClient _browser/);
  assert.doesNotMatch(service, /CdpBackblazeConfigurator _backblaze/);
  assert.doesNotMatch(service, /ShouldUploadV5/);
  assert.doesNotMatch(service, /ReadV5TransportState/);
  assert.doesNotMatch(service, /EnsureV5AutonomousTest/);
  assert.doesNotMatch(service, /EnsureLegacyPr206/);
  assert.match(service, /CloudflareV6DashboardSink/);
  assert.match(service, /LEGACY_BACKBLAZE_HANDOFF_DISABLED/);
});

test('Windows UI never applies legacy transport credentials to Adventure Land', () => {
  const ui = read('../../ops/windows-bridge/MainWindow.xaml.cs');
  assert.match(ui, /CdpAlBotV6Client/);
  assert.doesNotMatch(ui, /new CdpAdventureLandClient/);
  assert.doesNotMatch(ui, /new CdpBackblazeConfigurator/);
  assert.doesNotMatch(ui, /dashboard\.ApplyAsync/);
  assert.doesNotMatch(ui, /EnsureV5AutonomousTest/);
  assert.match(ui, /V6-VERTRAG AUSSTEHEND/);
  assert.match(ui, /BEREIT · V6 HOST-DIREKT/);
});

test('Supabase telemetry budget fallback preserves V6 identity fields', () => {
  const source = read('../../ops/windows-bridge/SupabaseTelemetrySink.cs');
  for (const field of ['identity','observedAt','character','heartbeat','status','telemetry']) {
    assert.match(source, new RegExp('CopyIfPresent\\(snapshot, fallback, "' + field + '"\\)'));
  }
  assert.doesNotMatch(source, /CopyIfPresent\(snapshot, fallback, "reconciliation"\)/);
});

test('Bridge defaults use dedicated V6 cloud identities', () => {
  const config = read('../../ops/windows-bridge/BridgeConfig.cs');
  assert.match(config, /albot-v6-debug-ingest/);
  assert.match(config, /albot-v6-signal-control/);
  assert.match(config, /ALBOT_V6_TELEMETRY_TOKEN/);
  assert.match(config, /ALBOT_V6_WEB_DASHBOARD_WRITE_KEY/);
  assert.match(config, /BotId \{ get; init; \} = "albot-v6-main"/);
  assert.match(config, /BackblazeEnabled \{ get; init; \} = false/);
  assert.match(config, /ALBOT_V6_BACKBLAZE_KEY_ID/);
  assert.match(config, /ALBOT_V6_BACKBLAZE_APPLICATION_KEY/);
});
