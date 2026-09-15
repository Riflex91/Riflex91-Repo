'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const buildPath = path.resolve(__dirname, '..', 'scripts', 'build.js');

function readBuildScript() {
  return fs.readFileSync(buildPath, 'utf8');
}

test('browser bundle bootstrap autostarts after JavaScript reload by default', () => {
  const source = readBuildScript();
  assert.match(source, /api\.install\(root,\{autostart:root\.AIO_V3_AUTOSTART!==false\}\);/);
});

test('browser bundle bootstrap keeps an explicit maintenance opt-out', () => {
  const source = readBuildScript();
  assert.match(source, /AIO_V3_AUTOSTART!==false/);
  assert.doesNotMatch(source, /api\.install\(root\);/);
});
