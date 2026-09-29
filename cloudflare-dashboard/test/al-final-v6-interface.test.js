import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const file = resolve(root, 'public/al-final/index.html');

test('AL Final V6 live interface keeps V6 transport and V3 map/sprite capabilities', async () => {
  const html = await readFile(file, 'utf8');

  assert.match(html, /AL Final · Bot V6/);
  assert.match(html, /\/api\/v6\/overview/);
  assert.match(html, /x-aio-read-key/);

  for (const required of [
    'Online · Aufgabe · HP/MP · EXP/h · Gold/h',
    'currentTask(status)',
    'xpPerHour',
    'goldPerHour',
    'max_hp',
    'max_mp',
    'Live-Positionskarte',
    'mapBounds',
    'mapVisual',
    'terrainMeta',
    'terrainPlacements',
    'renderTerrain',
    'gameSprite',
    'mapSprite',
    'foreignObject',
    'https://adventure.land',
    "addEventListener('wheel'",
    "addEventListener('pointerdown'"
  ]) assert.ok(html.includes(required), `missing ${required}`);

  assert.doesNotMatch(html, /\/api\/v3\/runtime/);
  assert.doesNotMatch(html, /WRITE_KEY/);
  assert.doesNotMatch(html, /ADMIN_KEY/);
});
