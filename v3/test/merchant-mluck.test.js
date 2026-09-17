'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MerchantMluckPolicy, remainingMluckMs } = require('../src/merchant/merchant-mluck-policy');
const { MerchantMluckService } = require('../src/merchant/merchant-mluck-service');

function snapshot(names = ['Merchant', 'Ranger', 'Priest']) {
  return {
    observedAt: 100000,
    character: { name: 'Merchant', ctype: 'merchant', level: 80, map: 'main', mp: 500, max_mp: 500, rip: false },
    entities: [],
    party: names.map((name) => ({ name, map: 'main' }))
  };
}

function rawRoot(overrides = {}) {
  const character = {
    id: 'Merchant', name: 'Merchant', ctype: 'merchant', level: 80, map: 'main',
    x: 0, y: 0, mp: 500, max_mp: 500, rip: false, s: { mluck: { ms: 900000 } }
  };
  const entities = {
    ranger: { id: 'ranger', name: 'Ranger', ctype: 'ranger', player: true, map: 'main', x: 50, y: 0, dead: false, s: {} },
    priest: { id: 'priest', name: 'Priest', ctype: 'priest', player: true, map: 'main', x: 60, y: 0, dead: false, s: { mluck: { ms: 120000 } } }
  };
  return {
    character,
    parent: { entities, party: { Merchant: { map: 'main' }, Ranger: { map: 'main' }, Priest: { map: 'main' } } },
    G: { skills: { mluck: { class: ['merchant'], target: 'player', mp: 10, level: 40, range: 320 } } },
    ...overrides
  };
}

function adapter(commands, options = {}) {
  return {
    mode: options.mode || 'active',
    canUseSkill: () => options.canUse !== false,
    isSkillInRange: (id) => !new Set(options.outOfRange || []).has(String(id)),
    getGameData: () => ({ skills: { mluck: { range: 320 } } }),
    command(action, args) {
      commands.push({ action, args });
      if (options.commandResult) return options.commandResult(action, args);
      return this.mode === 'shadow' ? { executed: false, shadow: true } : { executed: true };
    }
  };
}

test('remainingMluckMs understands relative and absolute expiry metadata', () => {
  assert.equal(remainingMluckMs({ ms: 1234 }, 1000), 1234);
  assert.equal(remainingMluckMs({ expiresAt: 4500 }, 1000), 3500);
  assert.equal(remainingMluckMs(null, 1000), null);
  assert.equal(remainingMluckMs({ f: 'Merchant' }, 1000), Infinity);
});

test('MerchantMluckPolicy prioritizes missing mluck over an expiring buff', () => {
  const policy = new MerchantMluckPolicy({ refreshLeadMs: 300000 });
  const decision = policy.decide({
    now: 100000,
    merchant: { ctype: 'merchant' },
    targets: [
      { id: 'priest', name: 'Priest', topologyIndex: 0, effect: { ms: 30000 }, reachable: true, inRange: true },
      { id: 'ranger', name: 'Ranger', topologyIndex: 1, effect: null, reachable: true, inRange: true }
    ]
  });
  assert.equal(decision.action, 'CAST');
  assert.equal(decision.reason, 'MLUCK_MISSING');
  assert.equal(decision.target.id, 'ranger');
});

test('MerchantMluckPolicy rotates deterministically by expiry then topology order', () => {
  const policy = new MerchantMluckPolicy({ refreshLeadMs: 300000 });
  const expiring = policy.decide({
    now: 100000,
    merchant: { ctype: 'merchant' },
    targets: [
      { id: 'a', name: 'A', topologyIndex: 0, effect: { ms: 100000 }, reachable: true, inRange: true },
      { id: 'b', name: 'B', topologyIndex: 1, effect: { ms: 50000 }, reachable: true, inRange: true }
    ]
  });
  assert.equal(expiring.target.id, 'b');

  const missing = policy.decide({
    now: 100000,
    merchant: { ctype: 'merchant' },
    targets: [
      { id: 'a', name: 'A', topologyIndex: 0, effect: null, reachable: true, inRange: true },
      { id: 'b', name: 'B', topologyIndex: 1, effect: null, reachable: true, inRange: true }
    ]
  });
  assert.equal(missing.target.id, 'a');
});

test('MerchantMluckPolicy skips dead, unreachable and out-of-range targets fail-safe', () => {
  const policy = new MerchantMluckPolicy();
  const decision = policy.decide({
    merchant: { ctype: 'merchant' },
    targets: [
      { id: 'dead', name: 'Dead', effect: null, dead: true, reachable: true, inRange: true },
      { id: 'far', name: 'Far', effect: null, reachable: false, inRange: false },
      { id: 'range', name: 'Range', effect: null, reachable: true, inRange: false }
    ]
  });
  assert.equal(decision.action, 'HOLD');
  assert.equal(decision.reason, 'MLUCK_TARGET_OUT_OF_RANGE');
});

test('MerchantMluckService executes missing mluck through GameAdapter command boundary', () => {
  let now = 100000;
  const commands = [];
  const root = rawRoot();
  const service = new MerchantMluckService({
    root,
    adapter: adapter(commands),
    now: () => now,
    refreshLeadMs: 300000,
    attemptCooldownMs: 3000,
    minCycleMs: 100,
    getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });

  const decision = service.cycle(snapshot());
  assert.equal(decision.action, 'CAST');
  assert.equal(decision.target.name, 'Ranger');
  assert.deepEqual(commands, [{ action: 'use_skill', args: ['mluck', 'ranger'] }]);
  assert.equal(service.status().stats.castsExecuted, 1);

  now += 200;
  const second = service.cycle(snapshot(['Merchant', 'Ranger']));
  assert.equal(second.action, 'HOLD');
  assert.equal(second.reason, 'MLUCK_ANTI_SPAM');
  assert.equal(commands.length, 1);
});

test('MerchantMluckService preserves shadow semantics while exercising the same decision path', () => {
  const commands = [];
  const root = rawRoot();
  const service = new MerchantMluckService({
    root,
    adapter: adapter(commands, { mode: 'shadow' }),
    now: () => 100000,
    getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });
  const decision = service.cycle(snapshot());
  assert.equal(decision.action, 'CAST');
  assert.equal(decision.result.shadow, true);
  assert.deepEqual(commands[0], { action: 'use_skill', args: ['mluck', 'ranger'] });
  assert.equal(service.status().stats.shadowCasts, 1);
  assert.equal(service.status().stats.castsExecuted, 0);
});

test('MerchantMluckService respects cooldown/resource and range checks without commands', () => {
  const root = rawRoot();
  const cooldownCommands = [];
  const cooldown = new MerchantMluckService({
    root,
    adapter: adapter(cooldownCommands, { canUse: false }),
    now: () => 100000,
    getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });
  assert.equal(cooldown.cycle(snapshot()).reason, 'MLUCK_COOLDOWN_OR_RESOURCE');
  assert.equal(cooldownCommands.length, 0);

  const rangeCommands = [];
  const rangeRoot = rawRoot();
  rangeRoot.parent.entities.priest.s.mluck.ms = 900000;
  const range = new MerchantMluckService({
    root: rangeRoot,
    adapter: adapter(rangeCommands, { outOfRange: ['ranger'] }),
    now: () => 100000,
    getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });
  assert.equal(range.cycle(snapshot()).reason, 'MLUCK_TARGET_OUT_OF_RANGE');
  assert.equal(rangeCommands.length, 0);
});

test('MerchantMluckService yields to controlled merchant work and unhealthy supervisor states', () => {
  const commands = [];
  const root = rawRoot();
  const busy = new MerchantMluckService({
    root,
    adapter: adapter(commands),
    now: () => 100000,
    getBusy: () => true,
    getSupervisorStatus: () => ({ state: 'HEALTHY' })
  });
  assert.equal(busy.cycle(snapshot()).reason, 'MERCHANT_CONTROLLED_OPERATION_BUSY');

  const unhealthy = new MerchantMluckService({
    root,
    adapter: adapter(commands),
    now: () => 100000,
    getSupervisorStatus: () => ({ state: 'QUARANTINED' })
  });
  assert.equal(unhealthy.cycle(snapshot()).reason, 'SUPERVISOR_NOT_HEALTHY');
  assert.equal(commands.length, 0);
});
