'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { KitingFarmerController } = require('../src/farmer/kiting-farmer');

test('ranger can issue a kite move and basic attack in the same engage cycle', () => {
  const commands = [];
  const farmer = new KitingFarmerController({
    now: () => 10000,
    targetPolicy: 'party-only',
    kiting: {
      evaluate: () => ({
        shouldMove: true,
        reason: 'TOO_CLOSE',
        x: -25,
        y: 0,
        distance: 20,
        range: 128,
        tooCloseDistance: 80,
        desiredDistance: 110,
        step: 25
      }),
      status: () => ({ enabled: true })
    }
  });

  const character = {
    name: 'My_Ranger1',
    ctype: 'ranger',
    x: 0,
    y: 0,
    hp: 3743,
    max_hp: 3743,
    mp: 850,
    max_mp: 850,
    range: 128,
    frequency: 1,
    inventory: []
  };
  const target = {
    id: 'm1',
    mtype: 'crab',
    x: 20,
    y: 0,
    hp: 1000,
    target: 'My_Ranger1'
  };
  const context = {
    snapshot: { character, entities: [target] },
    party: { members: [{ name: 'My_Ranger1' }] },
    adapter: {
      canAttack: () => true,
      command(name, args) {
        commands.push({ name, args });
        return { executed: true };
      }
    }
  };

  farmer._engage(context, target);

  assert.deepEqual(commands.map((entry) => entry.name), ['move', 'attack']);
  assert.equal(commands[1].args[0], 'm1');
  assert.equal(farmer.lastKiteAt, 10000);
  assert.equal(farmer.lastActionAt, 10000);
});
