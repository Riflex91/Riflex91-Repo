'use strict';

const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  compareReleaseVersions,
  decideAutoBump
} = require('../scripts/auto-version-on-main');

test('release version comparison follows alpha train and patch sequence', () => {
  assert.equal(compareReleaseVersions('3.0.0-alpha.20.11', '3.0.0-alpha.20.10'), 1);
  assert.equal(compareReleaseVersions('3.0.0-alpha.20.10', '3.0.0-alpha.20.10'), 0);
  assert.equal(compareReleaseVersions('3.0.0-alpha.19.99', '3.0.0-alpha.20.0'), -1);
  assert.equal(compareReleaseVersions('3.0.0-alpha.21.0', '3.0.0-alpha.20.999'), 1);
});

test('unchanged version after a main push requires an automatic release bump', () => {
  assert.deepEqual(
    decideAutoBump('3.0.0-alpha.20.10', '3.0.0-alpha.20.10'),
    { shouldBump: true, reason: 'MERGE_LEFT_VERSION_UNCHANGED' }
  );
});

test('a merge that already advanced the release version is not bumped twice', () => {
  assert.deepEqual(
    decideAutoBump('3.0.0-alpha.20.10', '3.0.0-alpha.20.11'),
    { shouldBump: false, reason: 'MERGE_ALREADY_ADVANCED_VERSION' }
  );
});

test('a stale workflow retry skips when latest main has already advanced beyond its trigger baseline', () => {
  assert.deepEqual(
    decideAutoBump('3.0.0-alpha.20.10', '3.0.0-alpha.20.12'),
    { shouldBump: false, reason: 'MERGE_ALREADY_ADVANCED_VERSION' }
  );
});

test('a version regression on main fails closed', () => {
  assert.throws(
    () => decideAutoBump('3.0.0-alpha.20.11', '3.0.0-alpha.20.10'),
    /release version regressed/
  );
});

test('auto-version workflow stages only tracked v3 release files', () => {
  const workflowPath = path.resolve(__dirname, '..', '..', '.github', 'workflows', 'v3-auto-version-main.yml');
  const workflow = fs.readFileSync(workflowPath, 'utf8');

  assert.match(workflow, /git add -u -- v3/);
  assert.doesNotMatch(workflow, /git add -A v3/);
});
