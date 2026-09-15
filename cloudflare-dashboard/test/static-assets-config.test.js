import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SETTINGS_BY_KEY } from '../src/settings-schema.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

test('wrangler serves the dashboard as static assets and keeps APIs worker-first', async () => {
  const wrangler = JSON.parse(await readFile(resolve(root, 'wrangler.jsonc'), 'utf8'));
  assert.equal(wrangler.assets.directory, './public');
  assert.equal(wrangler.assets.binding, 'ASSETS');
  assert.deepEqual(wrangler.assets.run_worker_first, ['/api/*']);
  const index = await readFile(resolve(root, 'public/index.html'), 'utf8');
  assert.match(index, /AiO Bot v3 Control Center/i);
});

test('dashboard telemetry controls respect the free-tier-safe interval floor', () => {
  const runtimePush = SETTINGS_BY_KEY.get('cloud.runtimePushMs');
  const configPull = SETTINGS_BY_KEY.get('cloud.configPullMs');
  assert.equal(runtimePush.default, 15000);
  assert.equal(runtimePush.min, 15000);
  assert.equal(configPull.default, 30000);
  assert.equal(configPull.min, 30000);
});
