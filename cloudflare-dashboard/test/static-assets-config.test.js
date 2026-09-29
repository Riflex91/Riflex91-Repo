import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SETTINGS_BY_KEY } from '../src/settings-schema.js';
import { DASHBOARD_HTML } from '../src/dashboard.js';
import { serveDashboardRoot } from '../src/worker-free-tier.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

test('wrangler keeps the dashboard root and APIs worker-first', async () => {
  const wrangler = JSON.parse(await readFile(resolve(root, 'wrangler.jsonc'), 'utf8'));
  assert.equal(wrangler.assets.directory, './public');
  assert.equal(wrangler.assets.binding, 'ASSETS');
  assert.ok(wrangler.assets.run_worker_first.includes('/'));
  assert.ok(wrangler.assets.run_worker_first.includes('/api/*'));
  assert.match(DASHBOARD_HTML, /\/api\/v6\/overview/);
  assert.match(DASHBOARD_HTML, /\/api\/v6\/events\?limit=/);
  assert.match(DASHBOARD_HTML, /\/api\/v3\/settings/);
  assert.match(DASHBOARD_HTML, /AioBot v5/);
  assert.doesNotMatch(DASHBOARD_HTML, /api\('\/api\/status'/);
});

test('public dashboard root is AL Final while the legacy source dashboard stays synchronized', async () => {
  const publicHtml = await readFile(resolve(root, 'public/index.html'), 'utf8');
  const alFinalHtml = await readFile(resolve(root, 'public/al-final/index.html'), 'utf8');
  const sourceHtml = await readFile(resolve(root, 'dashboard.html'), 'utf8');

  assert.equal(publicHtml, alFinalHtml);
  assert.match(publicHtml, /AL Final · Bot V6/);
  assert.equal(sourceHtml, DASHBOARD_HTML);
});

test('worker serves the root dashboard from the static ASSETS binding', async () => {
  let seenPath = null;
  const env = {
    ASSETS: {
      async fetch(request) {
        seenPath = new URL(request.url).pathname;
        return new Response('AL Final root', { headers: { 'content-type': 'text/html; charset=utf-8' } });
      }
    }
  };

  const response = await serveDashboardRoot(new Request('https://example.test/'), env);
  assert.equal(seenPath, '/');
  assert.equal(await response.text(), 'AL Final root');
  assert.equal(await serveDashboardRoot(new Request('https://example.test/api/health'), env), null);
});

test('dashboard telemetry controls respect the free-tier-safe interval floor', () => {
  const runtimePush = SETTINGS_BY_KEY.get('cloud.runtimePushMs');
  const configPull = SETTINGS_BY_KEY.get('cloud.configPullMs');
  assert.equal(runtimePush.default, 15000);
  assert.equal(runtimePush.min, 15000);
  assert.equal(configPull.default, 30000);
  assert.equal(configPull.min, 30000);
});
