'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { VERSION } = require('../src/runtime');
const { RELEASE_VERSION } = require('../src/release-version');

test('base runtime uses the canonical release version instead of a stale hardcoded version', () => {
  assert.equal(VERSION, RELEASE_VERSION);
});
