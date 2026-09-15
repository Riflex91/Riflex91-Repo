'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { installFullTestAuthorityHotfix } = require('../src/reliability/alpha20-42-full-test-authority-hotfix');

function runtime() {
  const root = { character: { name: 'My_Ranger2', ctype: 'ranger', rip: false }, parent: { entities: {} } };
  const team = {
    lastTeam: null,
    _team: () => ({ selfName: 'My_Ranger2', leaderName: 'My_Ranger1', manaReady: false, healthReady: true }),
    status: () => ({})
  };
  return {
    root,
    now: () => 10000,
    log: { emit() {} },
    adapter: { mode: 'active' },
    globalSupervisor: { status: () => ({ state: 'HEALTHY' }) },
    farmerResourceTopoffHotfix: {
      criticalHpRatio: 0.72,
      supply: () => ({ hpPotions: 0, mpPotions: 0, hpReady: false, mpReady: false, ready: false }),
      _event() {},
      status: () => ({})
    },
    teamCombatCohesionHotfix: team,
    farmer: { skillUsage: { evaluate: () => ({ useSkill: false, reason: 'NO_SKILL' }) } },
    _alpha20EconomyEmergency: () => false
  };
}

test('safe current HP remains basic-combat ready even with no local potions', () => {
  const rt = runtime();
  installFullTestAuthorityHotfix(rt);
  const safe = rt.farmerResourceTopoffHotfix.supply({ character: { hp: 900, max_hp: 1000, inventory: [] } });
  assert.equal(safe.hpReady, false);
  assert.equal(safe.mpReady, false);
  assert.equal(safe.ready, true);
  assert.equal(safe.basicCombatReady, true);
  assert.equal(safe.currentHpSafeWithoutPotion, true);

  const unsafe = rt.farmerResourceTopoffHotfix.supply({ character: { hp: 500, max_hp: 1000, inventory: [] } });
  assert.equal(unsafe.ready, false);
  assert.equal(unsafe.basicCombatReady, false);
});

test('degraded mana readiness is persisted for consumers that read lastTeam directly', () => {
  const rt = runtime();
  installFullTestAuthorityHotfix(rt);
  const state = rt.teamCombatCohesionHotfix._team({ character: { name: 'My_Ranger2' } });
  assert.equal(state.observedManaReady, false);
  assert.equal(state.manaReady, true);
  assert.equal(rt.teamCombatCohesionHotfix.lastTeam.manaReady, true);
  assert.equal(rt.teamCombatCohesionHotfix.lastTeam.observedManaReady, false);
});
