import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const alias = fs.readFileSync(new URL('../public/al-final/index.html', import.meta.url), 'utf8');

test('V6 dashboard root and /al-final stay byte-identical', () => {
  assert.equal(alias, root);
  assert.match(root, /\/api\/v6\/overview/);
});

test('V6 dashboard renders live characters only', () => {
  assert.match(root, /rows=\(\(data&&data\.characters\)\|\|\[\]\)\.map\(normalize\)\.filter\(c=>c\.state==='live'\)/);
});

test('V6 terrain uses high-DPI smoothing without grid overlays or seams', () => {
  assert.match(root, /#terrainCanvas\{image-rendering:auto\}/);
  assert.doesNotMatch(root, /#terrainCanvas\{image-rendering:pixelated\}/);
  assert.match(root, /Math\.min\(3,devicePixelRatio\|\|1\)/);
  assert.match(root, /ctx\.imageSmoothingEnabled=true/);
  assert.match(root, /ctx\.imageSmoothingQuality='high'/);
  assert.match(root, /Math\.floor\(\(x-view\.x\)\*sx\)/);
  assert.match(root, /Math\.ceil\(\(x\+tw-view\.x\)\*sx\)/);
  assert.doesNotMatch(root, /terrain-wall/);
  assert.doesNotMatch(root, /Adventure-Land-Terrain · hochauflösend geglättet/);
  assert.doesNotMatch(root, /class="hint"/);
  assert.match(root, /\.gamesprite\{[^}]*image-rendering:pixelated/);
  assert.match(root, /\.gamesprite img\{[^}]*image-rendering:pixelated/);
});
