'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  expectedReleaseVersionSource,
  inspectVersionContract,
  replaceExactReleaseLiteral
} = require('../scripts/version-contract');
const { nextPatchVersion } = require('../scripts/release-bump');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aio-v3-release-guardian-'));
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  fs.mkdirSync(path.join(root, 'test'), { recursive: true });
  fs.writeFileSync(path.join(root, 'version.json'), JSON.stringify({ version: '3.0.0-alpha.20.86' }));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '3.0.0-alpha.20.86' }));
  fs.writeFileSync(path.join(root, 'src', 'release-version.js'), expectedReleaseVersionSource('3.0.0-alpha.20.86'));
  fs.writeFileSync(path.join(root, 'dist', 'aio-v3.js'), '/* Adventure Land AiO Bot 3.0.0-alpha.20.86 | generated | shadow mode by default */\n');
  return root;
}

test('release guardian accepts a coherent version contract', (t) => {
  const root = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(inspectVersionContract(root).failures, []);
});

test('release guardian rejects package and generated-release drift before the full suite', (t) => {
  const root = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '3.0.0-alpha.20.22' }));
  fs.writeFileSync(path.join(root, 'src', 'release-version.js'), expectedReleaseVersionSource('3.0.0-alpha.20.22'));
  const failures = inspectVersionContract(root).failures.join('\n');
  assert.match(failures, /package\.json version/);
  assert.match(failures, /release-version\.js/);
});

test('patch bump changes only the requested release literal and leaves frozen history intact', () => {
  const fromVersion = '3.0.0-alpha.20.10';
  const toVersion = '3.0.0-alpha.20.11';
  assert.equal(nextPatchVersion(fromVersion), toVersion);
  const source = `current='${fromVersion}'; frozen='3.0.0-alpha.19.0';`;
  assert.equal(
    replaceExactReleaseLiteral(source, fromVersion, toVersion),
    `current='${toVersion}'; frozen='3.0.0-alpha.19.0';`
  );
});
