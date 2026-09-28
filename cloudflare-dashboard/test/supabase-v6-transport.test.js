import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('Supabase V6 ingest accepts only the V6 transport contract', () => {
  const source = read('../../v3/supabase/functions/albot-v6-debug-ingest/index.ts');
  assert.match(source, /ALBOT_V6_TELEMETRY_BATCH/);
  assert.match(source, /ALBOT_V6_PROBLEM_DIAGNOSTICS_MIRROR/);
  assert.match(source, /x-albot-bot-id/);
  assert.match(source, /x-albot-generation/);
  assert.match(source, /x-albot-bridge-protocol/);
  assert.match(source, /generation !== 6/);
  assert.match(source, /albot-v6-bridge-v1/);
  assert.match(source, /acceptsLegacyGenerations !== false/);
  assert.doesNotMatch(source, /AIO_V3_DEBUG_TELEMETRY_BATCH/);
  assert.match(source, /supabase-js@2\.116\.0/);
});

test('legacy Supabase transport sources are fail-closed', () => {
  const telemetry = read('../../v3/supabase/functions/bot-debug-ingest/index.ts');
  const signal = read('../../v3/supabase/functions/bot-chatgpt-signal-control/index.ts');
  assert.match(telemetry, /LEGACY_TRANSPORT_RETIRED/);
  assert.match(telemetry, /requiredGeneration: 6/);
  assert.match(signal, /LEGACY_TRANSPORT_RETIRED/);
  assert.match(signal, /status: 410/);
});

test('Supabase V6 signal control uses generation-locked headers and payloads', () => {
  const source = read('../../v3/supabase/functions/albot-v6-signal-control/index.ts');
  assert.match(source, /ALBOT_V6_SIGNAL_CONTROL/);
  assert.match(source, /x-albot-bot-id/);
  assert.match(source, /x-albot-generation/);
  assert.match(source, /x-albot-bridge-protocol/);
  assert.match(source, /generation !== 6/);
  assert.match(source, /albot-v6-bridge-v1/);
  assert.match(source, /updated_by: "albot-v6-bridge"/);
  assert.doesNotMatch(source, /AIO_CHATGPT_SIGNAL_CONTROL/);
});

test('custom-auth Supabase functions explicitly disable platform JWT verification', () => {
  const config = read('../../v3/supabase/config.toml');
  for (const slug of [
    'bot-debug-ingest',
    'bot-chatgpt-signal-control',
    'albot-v6-debug-ingest',
    'albot-v6-signal-control'
  ]) {
    assert.match(config, new RegExp('\\[functions\\.' + slug.replaceAll('-', '\\-') + '\\][\\s\\S]*?verify_jwt = false'));
  }
});
