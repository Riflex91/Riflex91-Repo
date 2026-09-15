'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { ContentSafetyGate, ContentDisposition } = require('../src/farmer/content-safety');
const { WorldModel, EvidenceKind } = require('../src/world/world-model');

function monster(mtype = 'newboss', overrides = {}) {
  return { id: `${mtype}-1`, mtype, hp: 1000, max_hp: 1000, target: null, ...overrides };
}

test('new monster type is quarantined persistently before discovery can make it known', () => {
  let now = 1000;
  const world = new WorldModel({ now: () => now });
  const gate = new ContentSafetyGate({ now: () => now });
  const target = monster('newboss');

  const first = gate.evaluate(target, world);
  assert.equal(first.allowed, false);
  assert.equal(first.reason, 'CONTENT_QUARANTINED');
  assert.equal(first.disposition, ContentDisposition.QUARANTINED);

  // Simulate Discovery recording the monster after the farm snapshot was filtered.
  world.observeEntity('monster', 'newboss', { maps: ['main'] }, { evidence: EvidenceKind.OBSERVED, confidence: 1 });
  now += 250;
  const second = gate.evaluate(target, world);
  assert.equal(second.allowed, false);
  assert.equal(second.disposition, ContentDisposition.QUARANTINED);
  assert.equal(world.fact('monster-policy', 'newboss', 'contentSafetyDisposition').value, ContentDisposition.QUARANTINED);
});

test('monster types already known before alpha.8.12 migrate to legacy allowed', () => {
  const world = new WorldModel();
  world.observeEntity('monster', 'goo', { maps: ['main'] }, { evidence: EvidenceKind.OBSERVED, confidence: 1 });
  const gate = new ContentSafetyGate();
  const result = gate.evaluate(monster('goo'), world);
  assert.equal(result.allowed, true);
  assert.equal(result.disposition, ContentDisposition.LEGACY_ALLOWED);
  assert.equal(world.fact('monster-policy', 'goo', 'contentSafetyDisposition').value, ContentDisposition.LEGACY_ALLOWED);
});

test('explicit operator approval releases quarantine and explicit quarantine re-blocks it', () => {
  const world = new WorldModel();
  const gate = new ContentSafetyGate();
  const target = monster('newboss');
  assert.equal(gate.evaluate(target, world).allowed, false);

  gate.approve(world, 'newboss');
  const approved = gate.evaluate(target, world);
  assert.equal(approved.allowed, true);
  assert.equal(approved.disposition, ContentDisposition.APPROVED);

  gate.quarantine(world, 'newboss');
  const blocked = gate.evaluate(target, world);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.disposition, ContentDisposition.QUARANTINED);
});

test('content safety fails closed when the persistent world safety context is unavailable', () => {
  const gate = new ContentSafetyGate();
  const result = gate.evaluate(monster('unknown'), null);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'CONTENT_SAFETY_UNAVAILABLE');
});

test('status exposes bounded policy disposition summaries', () => {
  const world = new WorldModel();
  const gate = new ContentSafetyGate();
  world.observeEntity('monster', 'goo', {}, { evidence: EvidenceKind.OBSERVED, confidence: 1 });
  gate.evaluate(monster('goo'), world);
  gate.evaluate(monster('newboss'), world);
  gate.approve(world, 'bee');
  const status = gate.status(world);
  assert.equal(status.enabled, true);
  assert.equal(status.unknownDefault, ContentDisposition.QUARANTINED);
  assert.equal(status.counts.LEGACY_ALLOWED, 1);
  assert.equal(status.counts.QUARANTINED, 1);
  assert.equal(status.counts.APPROVED, 1);
});
