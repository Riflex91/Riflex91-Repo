'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { COMBAT_CLASSES } = require('../src/party/orchestrator');
const {
  PartyTopology,
  inspectPartyTopology,
  PARTY_TOPOLOGY_MIN_SIZE,
  PARTY_TOPOLOGY_MAX_SIZE,
  PARTY_TOPOLOGY_MIN_COMBAT,
  PARTY_TOPOLOGY_MAX_COMBAT,
  PARTY_TOPOLOGY_COMBAT_CLASSES
} = require('../src/party/party-topology');

function member(name, ctype) { return { name, ctype }; }
function merchant(name = 'MerchantA') { return member(name, 'merchant'); }
function combat(name, ctype = 'ranger') { return member(name, ctype); }

test('PartyTopology mirrors the current variable-party size contract without changing runtime consumers', () => {
  assert.equal(PARTY_TOPOLOGY_MIN_SIZE, 2);
  assert.equal(PARTY_TOPOLOGY_MAX_SIZE, 4);
  assert.equal(PARTY_TOPOLOGY_MIN_COMBAT, 1);
  assert.equal(PARTY_TOPOLOGY_MAX_COMBAT, 3);

  for (const combatCount of [1, 2, 3]) {
    const members = [merchant(), ...Array.from({ length: combatCount }, (_, index) => combat(`R${index + 1}`))];
    const topology = PartyTopology.from(members, { merchantName: 'MerchantA' });
    assert.equal(topology.valid, true, topology.reasons.join(','));
    assert.equal(topology.expectedSize, combatCount + 1);
    assert.equal(topology.merchantName, 'MerchantA');
    assert.equal(topology.combatMembers.length, combatCount);
    assert.deepEqual(topology.memberNames, members.map((row) => row.name));
  }
});

test('PartyTopology combat classes stay exactly aligned with the current orchestrator contract', () => {
  assert.deepEqual([...PARTY_TOPOLOGY_COMBAT_CLASSES].sort(), [...COMBAT_CLASSES].sort());
  assert.deepEqual([...PARTY_TOPOLOGY_COMBAT_CLASSES].sort(), ['mage', 'paladin', 'priest', 'ranger', 'rogue', 'warrior']);
});

test('PartyTopology accepts duplicate classes but requires unique character names', () => {
  const duplicateClasses = PartyTopology.from([merchant(), combat('R1'), combat('R2')]);
  assert.equal(duplicateClasses.valid, true);
  assert.deepEqual(duplicateClasses.combatNames, ['R1', 'R2']);

  const duplicateNames = PartyTopology.from([merchant(), combat('R1'), combat('R1')]);
  assert.equal(duplicateNames.valid, false);
  assert.ok(duplicateNames.reasons.includes('PARTY_MEMBER_NAMES_MUST_BE_UNIQUE'));
});

test('PartyTopology rejects the same invalid structural shapes guarded by current party code', () => {
  const cases = [
    { members: [merchant()], reason: 'PARTY_SIZE_BELOW_MINIMUM' },
    { members: [merchant(), combat('R1'), combat('R2'), combat('R3'), combat('R4')], reason: 'PARTY_SIZE_ABOVE_MAXIMUM' },
    { members: [combat('R1'), combat('R2', 'priest')], reason: 'EXACTLY_ONE_MERCHANT_REQUIRED' },
    { members: [merchant('M1'), merchant('M2'), combat('R1')], reason: 'EXACTLY_ONE_MERCHANT_REQUIRED' },
    { members: [merchant(), combat('B1', 'bard')], reason: 'UNSUPPORTED_COMBAT_CLASS' },
    { members: [merchant(), { name: 'Unknown' }], reason: 'PARTY_MEMBER_TYPE_REQUIRED' }
  ];

  for (const row of cases) {
    const topology = PartyTopology.from(row.members);
    assert.equal(topology.valid, false, row.reason);
    assert.ok(topology.reasons.includes(row.reason), `${row.reason}: ${topology.reasons.join(',')}`);
  }
});

test('PartyTopology validates configured merchant identity without inferring or mutating members', () => {
  const members = [merchant(), combat('R1', 'rogue')];
  const good = inspectPartyTopology(members, { merchantName: 'MerchantA' });
  assert.equal(good.valid, true);
  assert.equal(good.merchant, members[0]);
  assert.equal(good.combatMembers[0], members[1]);

  const mismatch = inspectPartyTopology(members, { merchantName: 'OtherMerchant' });
  assert.equal(mismatch.valid, false);
  assert.ok(mismatch.reasons.includes('MERCHANT_IDENTITY_MISMATCH'));
  assert.deepEqual(members, [merchant(), combat('R1', 'rogue')]);
});

test('PartyTopology snapshot is immutable at the topology boundary', () => {
  const topology = PartyTopology.from([merchant(), combat('P1', 'priest')]);
  assert.equal(Object.isFrozen(topology), true);
  assert.equal(Object.isFrozen(topology.reasons), true);
  assert.equal(Object.isFrozen(topology.combatMembers), true);
  assert.equal(Object.isFrozen(topology.memberNames), true);
});
