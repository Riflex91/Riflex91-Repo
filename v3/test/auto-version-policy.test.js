'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  compareReleaseVersions,
  decideAutoBump
} = require('../scripts/auto-version-on-main');

test('release version comparison follows alpha train and patch sequence', () => {
  assert.equal(compareReleaseVersions('3.0.0-alpha.20.24', '3.0.0-alpha.20.23'), 1);
  assert.equal(compareReleaseVersions('3.0.0-alpha.20.23', '3.0.0-alpha.20.23'), 0);
  assert.equal(compareReleaseVersions('3.0.0-alpha.19.99', '3.0.0-alpha.20.0'), -1);
  assert.equal(compareReleaseVersions('3.0.0-alpha.21.0', '3.0.0-alpha.20.999'), 1);
});

test('unchanged version after a main push requires an automatic release bump', () => {
  assert.deepEqual(
    decideAutoBump('3.0.0-alpha.20.23', '3.0.0-alpha.20.23'),
    { shouldBump: true, reason: 'MERGE_LEFT_VERSION_UNCHANGED' }
  );
});

test('a merge that already advanced the release version is not bumped twice', () => {
  assert.deepEqual(
    decideAutoBump('3.0.0-alpha.20.23', '3.0.0-alpha.20.24'),
    { shouldBump: false, reason: 'MERGE_ALREADY_ADVANCED_VERSION' }
  );
});

test('a version regression on main fails closed', () => {
  assert.throws(
    () => decideAutoBump('3.0.0-alpha.20.24', '3.0.0-alpha.20.23'),
    /release version regressed/
  );
});
