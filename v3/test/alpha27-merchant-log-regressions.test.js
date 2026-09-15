'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Alpha27CombatMerchantConvergence } = require('../src/reliability/alpha27-combat-merchant-convergence');
const { makeEngine, makeControlledMerchant, makeLedger, makeRuntime, mutationFixture } = require('./alpha27-convergence-test-helpers');

test('structured upgrade rejection preserves the Adventure Land reason and details', async () => {
  const { convergence, engine, ledger, root } = mutationFixture('UPGRADE');
  root.upgrade = async () => { throw { failed: true, reason: 'not_ready', place: 'upgrade', status: 400 }; };
  const planned = engine.planAtomic({ type: 'UPGRADE', character: 'Merchant', indices: [0] }, { ledger });
  const result = await convergence._executeAtomic(planned.transaction.id);
  assert.equal(result.committed, false);
  assert.equal(result.reason, 'not_ready');
  assert.equal(result.error.place, 'upgrade');
  assert.equal(engine.transactions.get(planned.transaction.id).reason, 'not_ready');
});

test('Alpha27 suppresses legacy idle stand churn and keeps mutation-only circuits scoped to WATCH', () => {
  const engine = makeEngine();
  engine.status = () => ({
    circuits: {
      SELL: { open: false }, BANK: { open: false }, UPGRADE: { open: true }, COMPOUND: { open: false }
    }
  });
  const controlledMerchant = makeControlledMerchant();
  const runtime = makeRuntime({ engine, controlledMerchant });
  runtime.merchantServicePlanner = { standWhenIdle: true };
  runtime._controlledSubsystemHealth = () => ({ economy: { state: 'HEALTHY', reasons: [] }, travel: { state: 'HEALTHY', reasons: [] } });
  runtime.configureControlledMerchant = (config) => controlledMerchant.configure(config);

  const convergence = new Alpha27CombatMerchantConvergence(runtime);
  const health = runtime._controlledSubsystemHealth();
  assert.equal(runtime.merchantServicePlanner.standWhenIdle, false);
  assert.equal(health.economy.state, 'WATCH');
  assert.ok(health.economy.reasons.includes('UPGRADE_CIRCUIT_OPEN'));

  convergence.merchant.ensureAutonomousAuthorities();
  const status = controlledMerchant.status();
  assert.equal(status.enabled, true);
  assert.equal(status.sellEnabled, true);
  assert.equal(status.bankEnabled, true);
  assert.equal(status.upgradeEnabled, false);
});

test('SELL with no can_sell probe travels to a vendor before executing the transaction', async () => {
  const engine = makeEngine();
  const controlledMerchant = makeControlledMerchant();
  const ledger = makeLedger([{ character: 'Merchant', index: 0, name: 'crabclaw', level: 0, q: 3, disposition: 'SELL' }]);
  const order = [];
  const root = {
    character: { name: 'Merchant', ctype: 'merchant', gold: 2000000, target: null, stand: false, items: [{ name: 'crabclaw', level: 0, q: 3 }], isize: 42, map: 'main' },
    parent: { entities: {} },
    async smart_move(destination) { order.push(`travel:${destination}`); return { success: true }; },
    async stop() { return true; }
  };
  const runtime = makeRuntime({ root, ledger, engine, controlledMerchant, gameData: { items: { crabclaw: { type: 'material', s: true, g: 10 } }, monsters: {}, maps: {} } });
  runtime.configureControlledMerchant = (config) => controlledMerchant.configure(config);
  const convergence = new Alpha27CombatMerchantConvergence(runtime);
  controlledMerchant.execute = async () => { order.push('execute:SELL'); return { executed: true, committed: true, reason: 'TEST_COMMIT' }; };

  const acted = await convergence.merchant.cycle();
  assert.equal(acted, true);
  assert.deepEqual(order, ['travel:scroll0', 'execute:SELL']);
});

test('open SELL/BANK circuit does not trigger Alpha27 re-enable churn against the global economy guard', () => {
  const engine = makeEngine();
  engine.status = () => ({
    circuits: {
      SELL: { open: true }, BANK: { open: false }, UPGRADE: { open: false }, COMPOUND: { open: false }
    }
  });
  const controlledMerchant = makeControlledMerchant();
  const runtime = makeRuntime({ engine, controlledMerchant });
  let configureCalls = 0;
  runtime.configureControlledMerchant = (config) => { configureCalls += 1; return controlledMerchant.configure(config); };
  const convergence = new Alpha27CombatMerchantConvergence(runtime);

  convergence.merchant.ensureAutonomousAuthorities();
  assert.equal(configureCalls, 0);
  assert.equal(controlledMerchant.status().enabled, false);
});