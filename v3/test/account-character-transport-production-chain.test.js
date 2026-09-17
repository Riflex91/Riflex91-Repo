'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  AccountCharacterTransport,
  NAMED_RECEIVER_CM_PROTOCOL
} = require('../src/party/account-character-transport');
const { installAlpha2019AccountTransportHotfix } = require('../src/reliability/alpha20-19-account-transport-hotfix');
const {
  RELIABLE_RECEIVER,
  installAlpha2057ReliableAccountTransport
} = require('../src/reliability/alpha20-57-reliable-account-transport');
const { installLiveFarmerMerchantRecovery } = require('../src/reliability/live-farmer-merchant-recovery');
const { installCmQuotaBackoff } = require('../src/reliability/alpha20-22-live-smoke-recovery');

// Production installs Alpha20.19 before Alpha20.57. Keep this test file in the
// same order so prototype capture/delegation is exercised exactly as shipped.
installAlpha2019AccountTransportHotfix();
installAlpha2057ReliableAccountTransport();

function rootFor(name) {
  return {
    character: { name },
    get_active_characters: () => ({ [name]: 'self' })
  };
}

function runtimeFor(root, transport) {
  return {
    root,
    now: () => Date.now(),
    log: { emit() {} },
    partyAccountCommunication: { transport }
  };
}

function installQuotaWrapper(runtime) {
  const stats = { cmQuotaSendsSuppressed: 0, cmQuotaBackoffs: 0 };
  const state = { cmBackoff: new Map() };
  assert.equal(installCmQuotaBackoff(runtime, stats, state), true);
  return { stats, state };
}

test('production Alpha20.19 -> Alpha20.57 chain preserves named receiver CM envelope for legacy channels', async () => {
  const sent = [];
  const root = rootFor('My_Ranger1');
  root.send_cm = (target, payload) => { sent.push({ target, payload }); };

  const transport = new AccountCharacterTransport({
    root,
    trustedNames: ['My_Ranger1', 'My_Ranger2']
  });

  const payload = { type: 'party-telemetry', hp: 1234 };
  const result = await transport.send('My_Ranger2', payload, {
    receiver: '__AIO_V3_PARTY_TELEMETRY_RECEIVE',
    sender: 'My_Ranger1'
  });

  assert.equal(result.delivered, true);
  assert.equal(result.transport, 'send_cm');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].target, 'My_Ranger2');
  assert.deepEqual(sent[0].payload, {
    __aioProtocol: NAMED_RECEIVER_CM_PROTOCOL,
    receiver: '__AIO_V3_PARTY_TELEMETRY_RECEIVE',
    payload
  });
});

test('live recovery + Alpha20.22 outer wrappers still reach Alpha20.57 ACK delivery', async () => {
  const rootA = rootFor('My_Ranger1');
  const rootB = rootFor('My_Ranger2');
  const trusted = ['My_Ranger1', 'My_Ranger2'];
  const a = new AccountCharacterTransport({ root: rootA, trustedNames: trusted });
  const b = new AccountCharacterTransport({ root: rootB, trustedNames: trusted });
  let receiverCalls = 0;

  rootA.send_cm = (target, payload) => {
    assert.equal(target, 'My_Ranger2');
    return rootB.on_cm('My_Ranger1', payload);
  };
  rootB.send_cm = (target, payload) => {
    assert.equal(target, 'My_Ranger1');
    return rootA.on_cm('My_Ranger2', payload);
  };

  b.installDirectReceiver('alpha28.progression.crossmap', (sender, payload) => {
    receiverCalls += 1;
    assert.equal(sender, 'My_Ranger1');
    assert.equal(payload.kind, 'TEAM_REGROUP');
    return true;
  });

  const runtimeA = runtimeFor(rootA, a);
  const runtimeB = runtimeFor(rootB, b);
  installLiveFarmerMerchantRecovery(runtimeA);
  installLiveFarmerMerchantRecovery(runtimeB);
  const quota = installQuotaWrapper(runtimeA);

  const objective = {
    id: 'alpha28-regroup-production-chain-1',
    kind: 'TEAM_REGROUP',
    leaderName: 'My_Ranger1',
    map: 'main',
    x: 0,
    y: 0,
    expiresAt: Date.now() + 15000,
    crossMapAuthorizedBy: 'alpha28-controlled-farmer-travel'
  };

  const result = await a.send('My_Ranger2', objective, {
    receiver: 'alpha28.progression.crossmap',
    sender: 'My_Ranger1',
    ackTimeoutMs: 50,
    maxAttempts: 2,
    retryBackoffMs: 0
  });

  assert.equal(result.delivered, true);
  assert.equal(result.transport, 'send_cm-ack');
  assert.equal(result.reason, 'REMOTE_ACK_CONFIRMED');
  assert.equal(receiverCalls, 1);
  assert.equal(a.status().stats.ackReceived, 1);
  assert.equal(b.status().stats.receiverAccepted, 1);
  assert.equal(quota.stats.cmQuotaBackoffs, 0);
  assert.equal(rootA[RELIABLE_RECEIVER] instanceof Function, true);
  assert.equal(rootB[RELIABLE_RECEIVER] instanceof Function, true);
});

test('storage quota still escapes ACK retry layer and arms Alpha20.22 backoff', async () => {
  const root = rootFor('My_Ranger1');
  root.send_cm = () => { throw new Error('QuotaExceededError: object storage quota exceeded'); };
  const transport = new AccountCharacterTransport({
    root,
    trustedNames: ['My_Ranger1', 'My_Ranger2']
  });
  const runtime = runtimeFor(root, transport);
  installLiveFarmerMerchantRecovery(runtime);
  const quota = installQuotaWrapper(runtime);

  const result = await transport.send('My_Ranger2', {
    id: 'alpha28-regroup-quota-1',
    kind: 'TEAM_REGROUP',
    leaderName: 'My_Ranger1',
    map: 'main',
    x: 0,
    y: 0,
    expiresAt: Date.now() + 15000,
    crossMapAuthorizedBy: 'alpha28-controlled-farmer-travel'
  }, {
    receiver: 'alpha28.progression.crossmap',
    sender: 'My_Ranger1',
    ackTimeoutMs: 25,
    maxAttempts: 3,
    retryBackoffMs: 0
  });

  assert.equal(result.delivered, false);
  assert.equal(result.reason, 'CM_STORAGE_QUOTA_BACKOFF');
  assert.equal(quota.stats.cmQuotaBackoffs, 1);
  assert.ok(quota.state.cmBackoff.get('My_Ranger2') > Date.now());
  assert.equal(transport.status().stats.deliveryAttempted, 1);
});
