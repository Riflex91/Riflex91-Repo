'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  AccountCharacterTransport,
  NAMED_RECEIVER_CM_PROTOCOL
} = require('../src/party/account-character-transport');
const {
  installLiveFarmerMerchantRecovery,
  FARMER_POTION_TARGET
} = require('../src/reliability/live-farmer-merchant-recovery');

function log() {
  return { emit() {} };
}

test('addressed CM receive router repairs itself after a later on_cm owner displaces it', async () => {
  const ordinary = [];
  const received = [];
  const sent = [];
  const root = {
    character: { name: 'My_Ranger2' },
    get_active_characters: () => ({ My_Ranger2: 'self' }),
    send_cm: async (target, payload) => { sent.push({ target, payload }); return true; },
    on_cm: null
  };
  root.parent = root;
  const transport = new AccountCharacterTransport({
    root,
    log: log(),
    trustedNames: ['My_Ranger1', 'My_Ranger2', 'My_Ranger3', 'My_Merchant']
  });
  transport.installDirectReceiver('alpha28.progression.crossmap', (sender, payload) => {
    received.push({ sender, payload });
    return true;
  });

  // Reproduces the live failure: another subsystem installs its own CM handler
  // after the transport router was originally registered.
  root.on_cm = (sender, payload) => { ordinary.push({ sender, payload }); return 'legacy'; };

  const runtime = {
    root,
    now: () => 1000,
    log: log(),
    partyAccountCommunication: { transport },
    alpha28LiveAuthorityLiveness: {
      crossMap: {
        receiverInstalled: true,
        _transport: () => transport,
        _ensureReceiver: () => true
      }
    }
  };
  const recovery = installLiveFarmerMerchantRecovery(runtime);

  await transport.send('My_Ranger1', { kind: 'TEAM_REGROUP' }, {
    receiver: 'alpha28.progression.crossmap',
    sender: 'My_Ranger2'
  });
  assert.equal(sent.length, 1);
  assert.equal(recovery.stats.cmRouterRepairs, 1);

  root.on_cm('My_Ranger1', {
    __aioProtocol: NAMED_RECEIVER_CM_PROTOCOL,
    receiver: 'alpha28.progression.crossmap',
    payload: { kind: 'TEAM_REGROUP', map: 'main' }
  });
  assert.deepEqual(received, [{ sender: 'My_Ranger1', payload: { kind: 'TEAM_REGROUP', map: 'main' } }]);
  assert.equal(transport.stats.fallbackReceived, 1);

  const result = root.on_cm('My_Ranger1', { type: 'ordinary-cm' });
  assert.equal(result, 'legacy');
  assert.deepEqual(ordinary, [{ sender: 'My_Ranger1', payload: { type: 'ordinary-cm' } }]);
});

test('adaptive potion restock continues to exact purchase after verified vendor travel even when can_buy probe stays false', async () => {
  const purchases = [];
  const travels = [];
  const root = {
    character: {
      name: 'My_Merchant',
      ctype: 'merchant',
      gold: 20_000_000,
      items: [
        { name: 'hpot0', q: 5415 },
        { name: 'mpot0', q: 100 }
      ]
    },
    can_buy: () => false,
    buy: async (name, quantity) => {
      purchases.push({ name, quantity });
      const item = root.character.items.find((row) => row && row.name === name);
      item.q += quantity;
      return { success: true };
    }
  };
  root.parent = root;

  const merchant = {
    root,
    now: () => 2000,
    options: { goldReserve: 1_000_000, merchantMaxPotionBuy: 4500 },
    stats: { potionRestocks: 0, failedSafe: 0 },
    ensureStandClosed: async () => true,
    restockPartyPotions: async () => { throw new Error('legacy restock must not own adaptive 4500 plan'); },
    atomic: {
      namedServiceTravel: async (destination) => {
        travels.push(destination);
        return { ok: true, controlled: true, resolved: { destination: { map: 'main', x: -35, y: -162 } } };
      },
      _timeout: async (promise) => promise,
      verifyEventually: async (probe) => probe()
    }
  };
  const runtime = {
    root,
    now: () => 2000,
    log: log(),
    adapter: { getGameData: () => ({ items: { mpot0: { g: 100 }, hpot0: { g: 20 } } }) },
    lastMerchantServicePlan: {
      kind: 'RESTOCK_REQUIRED',
      metadata: { p0PotionPolicy4500: true },
      deliveries: [
        { family: 'hp', itemName: 'hpot0', quantity: 0 },
        { family: 'mp', itemName: 'mpot0', quantity: 4303 }
      ]
    },
    alpha27CombatMerchantConvergence: { merchant }
  };

  const recovery = installLiveFarmerMerchantRecovery(runtime);
  const acted = await merchant.restockPartyPotions();

  assert.equal(acted, true);
  assert.deepEqual(travels, ['mpot0']);
  assert.deepEqual(purchases, [{ name: 'mpot0', quantity: 4203 }]);
  assert.equal(root.character.items[1].q, 4303);
  assert.equal(merchant.stats.potionRestocks, 1);
  assert.equal(recovery.stats.vendorTravelContinuations, 1);
  assert.equal(recovery.stats.potionRestocksCommitted, 1);
  assert.equal(merchant.lastMerchantAction.result, 'COMMITTED');
  assert.equal(merchant.lastMerchantAction.vendorTravelAttested, true);
});

// Live alpha.20.103 regression: the current Farmer needs 4500, but the three-Farmer batch needs 11983.
test('live recovery buys aggregate batch deficit when current Farmer delivery is already fully stocked', async () => {
  const purchases = [];
  const travels = [];
  const root = {
    character: {
      name: 'My_Merchant',
      ctype: 'merchant',
      gold: 20_000_000,
      items: [{ name: 'mpot0', q: 4500 }]
    },
    can_buy: () => true,
    buy: async (name, quantity) => {
      purchases.push({ name, quantity });
      const item = root.character.items.find((row) => row && row.name === name);
      item.q += quantity;
      return { success: true };
    }
  };
  root.parent = root;

  const merchant = {
    root,
    now: () => 2500,
    options: { goldReserve: 1_000_000, merchantMaxPotionBuy: 4500 },
    stats: { potionRestocks: 0, failedSafe: 0 },
    ensureStandClosed: async () => true,
    restockPartyPotions: async () => { throw new Error('legacy restock must not own batched 4500 plan'); },
    atomic: {
      namedServiceTravel: async (destination) => {
        travels.push(destination);
        return { ok: true };
      },
      _timeout: async (promise) => promise,
      verifyEventually: async (probe) => probe()
    }
  };
  const runtime = {
    root,
    now: () => 2500,
    log: log(),
    adapter: { getGameData: () => ({ items: { mpot0: { g: 100 } } }) },
    lastMerchantServicePlan: {
      kind: 'RESTOCK_REQUIRED',
      metadata: {
        p0PotionPolicy4500: true,
        p0PotionBatch: true,
        p0PotionBatchTargetCount: 3,
        batchStockRequirements: [
          { itemName: 'mpot0', requiredStock: 11983, merchantReserve: 0 }
        ]
      },
      deliveries: [
        { family: 'mp', itemName: 'mpot0', quantity: 4500 }
      ]
    },
    alpha27CombatMerchantConvergence: { merchant }
  };

  const recovery = installLiveFarmerMerchantRecovery(runtime);
  const acted = await merchant.restockPartyPotions();

  assert.equal(acted, true);
  assert.deepEqual(travels, []);
  assert.deepEqual(purchases, [{ name: 'mpot0', quantity: 7483 }]);
  assert.equal(root.character.items[0].q, 11983);
  assert.equal(merchant.stats.potionRestocks, 1);
  assert.equal(recovery.stats.potionRestocksCommitted, 1);
  assert.equal(merchant.lastMerchantAction.requiredStock, 11983);
  assert.equal(merchant.lastMerchantAction.quantity, 7483);
});

test('P0 diagnostics report the active demand-driven 4500 policy instead of legacy fixed 5000 semantics', () => {
  const runtime = {
    now: () => 3000,
    log: log(),
    p0RegroupSupplyRecovery: {
      status: () => ({
        potionPolicy: {
          deliveryPerFarmer: { hpot0: 5000, mpot0: 5000 },
          lowWatermark: 5000,
          merchantReserve: 80,
          bothFamiliesRequiredBeforeTravel: true,
          exactDelivery: true
        }
      })
    }
  };
  installLiveFarmerMerchantRecovery(runtime);
  const policy = runtime.p0RegroupSupplyRecovery.status().potionPolicy;
  assert.deepEqual(policy.deliveryPerFarmer, { hpot0: FARMER_POTION_TARGET, mpot0: FARMER_POTION_TARGET });
  assert.equal(policy.farmerTarget, 4500);
  assert.equal(policy.potionRequestBelow, 200);
  assert.equal(policy.lowWatermark, 199);
  assert.equal(policy.merchantReserve, 0);
  assert.equal(policy.bothFamiliesRequiredBeforeTravel, false);
  assert.equal(policy.exactDelivery, false);
  assert.equal(policy.exactTopUpToTarget, true);
  assert.equal(policy.buyOnlyCurrentDeliveryDeficit, false);
  assert.equal(policy.aggregateBatchDemandBeforeFarmerTravel, true);
});
