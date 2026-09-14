'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { TeamCombatCohesionHotfix } = require('../src/reliability/team-combat-cohesion-hotfix');

function partyRow(type, x, y) {
  return { type, map: 'main', x, y, hp: 1000, max_hp: 1000, mp: 1000, max_mp: 1000 };
}

function harness({ trusted = ['MerchantA', 'R1', 'R2', 'R3'], owned = trusted, broadRows = {} } = {}) {
  const rawParty = { MerchantA: partyRow('merchant', 0, 0), R1: partyRow('ranger', 0, 0) };
  const root = {
    character: { name: 'R1', ctype: 'ranger' },
    parent: { party: rawParty, entities: {} },
    get_player(name) { return broadRows[name] || null; }
  };
  const ownedSet = new Set(owned);
  const instance = Object.create(TeamCombatCohesionHotfix.prototype);
  instance.runtime = {
    partyBootstrap: { trustedRosterNames: () => trusted.slice(), merchantName: 'MerchantA' },
    partyAccountCommunication: {
      transport: {
        isOwned: (name) => ownedSet.has(String(name)),
        strongLiveEvidence: (name) => broadRows[name]
          ? { live: true, source: 'get-player', target: String(name) }
          : { live: false, source: 'none', target: String(name) }
      }
    },
    farmerTerrainNavigationHotfix: null
  };
  instance.root = root;
  instance.parent = root.parent;
  instance.now = () => 1000;
  instance.cohesionRadius = 150;
  instance.minNewFightHpRatio = 0.9;
  instance.minNewFightMpRatio = 0.75;
  instance.lastTeam = null;
  const snapshot = {
    observedAt: 1000,
    character: { name: 'R1', ctype: 'ranger', map: 'main', x: 0, y: 0, hp: 1000, max_hp: 1000, mp: 1000, max_mp: 1000 },
    party: [{ name: 'MerchantA', type: 'merchant' }, { name: 'R1', type: 'ranger' }],
    entities: []
  };
  return { instance, snapshot };
}

test('team cohesion recovers trusted owned teammates from strong get_player evidence', () => {
  const broadRows = {
    R2: { name: 'R2', ctype: 'ranger', map: 'main', real_x: 30, real_y: 40, hp: 1000, max_hp: 1000, mp: 1000, max_mp: 1000 },
    R3: { name: 'R3', ctype: 'ranger', map: 'main', real_x: 60, real_y: 20, hp: 1000, max_hp: 1000, mp: 1000, max_mp: 1000 }
  };
  const { instance, snapshot } = harness({ broadRows });
  const team = instance._team(snapshot);

  assert.equal(team.complete, true);
  assert.equal(team.alive, true);
  assert.equal(team.sameMap, true);
  assert.equal(team.positionsKnown, true);
  assert.equal(team.cohesive, true);
  assert.deepEqual(team.names, ['R1', 'R2', 'R3']);
  assert.deepEqual(team.strongOwnedObservations, ['R2', 'R3']);
  assert.equal(team.members.find((row) => row.name === 'R2').ownedObservationSource, 'get-player');
});

test('broader visibility never widens trust to a roster name transport does not own', () => {
  const broadRows = {
    R2: { name: 'R2', ctype: 'ranger', map: 'main', x: 30, y: 40, hp: 1000, max_hp: 1000, mp: 1000, max_mp: 1000 },
    R3: { name: 'R3', ctype: 'ranger', map: 'main', x: 60, y: 20, hp: 1000, max_hp: 1000, mp: 1000, max_mp: 1000 }
  };
  const { instance, snapshot } = harness({ broadRows, owned: ['MerchantA', 'R1', 'R2'] });
  const team = instance._team(snapshot);

  assert.equal(team.complete, false);
  assert.equal(team.positionsKnown, false);
  assert.deepEqual(team.strongOwnedObservations, ['R2']);
  assert.equal(team.members.find((row) => row.name === 'R3').present, false);
});

test('liveness evidence without a concrete observation never invents position or class', () => {
  const { instance, snapshot } = harness({ trusted: ['MerchantA', 'R1', 'R2'], owned: ['MerchantA', 'R1', 'R2'] });
  instance.runtime.partyAccountCommunication.transport.strongLiveEvidence = (name) => name === 'R2'
    ? { live: true, source: 'observed-active', target: 'R2' }
    : { live: false, source: 'none', target: String(name) };
  const team = instance._team(snapshot);

  assert.equal(team.members.find((row) => row.name === 'R2').present, true);
  assert.equal(team.members.find((row) => row.name === 'R2').strongOwnedObservation, true);
  assert.equal(team.complete, false, 'missing class must remain fail-closed');
  assert.equal(team.positionsKnown, false);
});

test('dead broader observations remain fail-closed even when transport reports liveness', () => {
  const broadRows = {
    R2: { name: 'R2', ctype: 'ranger', map: 'main', x: 30, y: 40, dead: true, hp: 0, max_hp: 1000, mp: 1000, max_mp: 1000 }
  };
  const { instance, snapshot } = harness({ trusted: ['MerchantA', 'R1', 'R2'], broadRows });
  const team = instance._team(snapshot);

  assert.equal(team.complete, false);
  assert.equal(team.members.find((row) => row.name === 'R2').present, true, 'transport liveness is recorded but dead row is not used as state');
  assert.equal(team.positionsKnown, false);
});
