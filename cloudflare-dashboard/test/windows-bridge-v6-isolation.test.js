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
  assert.match(service, /BackblazeV6ArchiveSink/);
  assert.match(service, /BACKBLAZE_V6_CREDENTIALS_REQUIRED/);
});

test('Windows UI never applies legacy transport credentials to Adventure Land', () => {
  const ui = read('../../ops/windows-bridge/MainWindow.xaml.cs');
  assert.match(ui, /CdpAlBotV6Client/);
  assert.doesNotMatch(ui, /new CdpAdventureLandClient/);
  assert.doesNotMatch(ui, /new CdpBackblazeConfigurator/);
  assert.doesNotMatch(ui, /dashboard\.ApplyAsync/);
  assert.doesNotMatch(ui, /EnsureV5AutonomousTest/);
  assert.match(ui, /BackblazeV6ArchiveSink/);
  assert.match(ui, /V6 HOST-ARCHIV/);
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
  assert.match(config, /BackblazeEnabled \{ get; init; \} = true/);
  assert.match(config, /ALBOT_V6_BACKBLAZE_KEY_ID/);
  assert.match(config, /ALBOT_V6_BACKBLAZE_APPLICATION_KEY/);
  assert.match(config, /telemetry-token-v6\.dpapi/);
  assert.match(config, /web-dashboard-write-key-v6\.dpapi/);
  assert.match(config, /backblaze-credentials-v6\.dpapi/);
  assert.match(config, /TelemetryIngestUrl = storedVersion < 10[\s\S]*?\? V6TelemetryIngestUrl/);
  assert.match(config, /SignalControlUrl = storedVersion < 10[\s\S]*?\? V6SignalControlUrl/);
});


test('V6 host bridge keeps independent cursors for every live character', () => {
  const client = read('../../ops/windows-bridge/CdpAlBotV6Client.cs');
  const service = read('../../ops/windows-bridge/TelemetryBridgeService.cs');
  const config = read('../../ops/windows-bridge/BridgeConfig.cs');

  assert.match(client, /ReadAllAsync\(/);
  assert.match(client, /HashSet<string>\(StringComparer\.OrdinalIgnoreCase\)/);
  assert.match(client, /ReadCharacterName\(snapshot\)/);
  assert.match(client, /AcknowledgeThroughAsync\(\s*string\? characterName/);

  assert.match(config, /Dictionary<string, long>\? CharacterEventSeqs/);
  assert.match(config, /GetLastEventSeq\(string\? character\)/);
  assert.match(config, /WithCharacterSeq\(string character, long lastEventSeq\)/);

  assert.match(service, /_browser\.ReadAllAsync\(/);
  assert.match(service, /state\.GetLastEventSeq\(character\)/);
  assert.match(service, /state\.WithCharacterSeq\(characterName, read\.MaxSeq\)/);
  assert.match(service, /AcknowledgeThroughAsync\(characterName, read\.MaxSeq/);
});

test('Cloudflare dashboard failures stay observational and cannot block Supabase ACK', () => {
  const service = read('../../ops/windows-bridge/TelemetryBridgeService.cs');
  assert.match(service, /await _sink\.SendAsync\(read, read\.EffectiveAfterSeq/);
  assert.match(service, /SendDashboardSafeAsync\(read, cancellationToken\)/);
  assert.match(service, /Cloudflare outages or key rotation never block telemetry ACK/);

  const supabaseAt = service.indexOf('await _sink.SendAsync(read, read.EffectiveAfterSeq');
  const dashboardAt = service.indexOf('await SendDashboardSafeAsync(read, cancellationToken)');
  const stateAt = service.indexOf('state = state.WithCharacterSeq(characterName, read.MaxSeq)');
  const ackAt = service.indexOf('await _browser.AcknowledgeThroughAsync(characterName, read.MaxSeq');
  assert.ok(supabaseAt >= 0 && dashboardAt > supabaseAt && stateAt > dashboardAt && ackAt > stateAt);
});

test('Cloudflare deployment fails closed when the V6 Worker secret is absent', () => {
  const workflow = read('../../.github/workflows/deploy-cloudflare.yml');
  assert.match(workflow, /wrangler secret list/);
  assert.match(workflow, /ALBOT_V6_WRITE_KEY is not configured as a Cloudflare Worker secret/);
  assert.match(workflow, /process\.exit\(1\)/);
  assert.doesNotMatch(workflow, /V6 runtime writes will remain unavailable until the secret is set/);
});
