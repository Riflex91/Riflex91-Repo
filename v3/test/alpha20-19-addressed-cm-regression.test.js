'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { AccountCharacterTransport, NAMED_RECEIVER_CM_PROTOCOL } = require('../src/party/account-character-transport');
const { ControlledPartyBootstrap } = require('../src/party/controlled-party-bootstrap-base');
const { PartyControlLease } = require('../src/party/control-lease');
const { PartyAccountCommunicationReliability } = require('../src/party/party-account-communication');
const { installAlpha2019AccountTransportHotfix } = require('../src/party/alpha20-19-account-transport-hotfix');
const { Alpha27CombatOwnership } = require('../src/reliability/alpha27-combat-ownership');

installAlpha2019AccountTransportHotfix();

function targetStats() {
  return {
    rawAdventureTargetsIgnored: 0,
    farmerOwnedCombatHolds: 0,
    targetAuthorityPublishes: 0,
    targetAuthorityReceives: 0,
    targetAuthorityRejects: 0,
    performanceAttributedDamageEvents: 0,
    performanceAttributedKills: 0,
    performanceDisappearKills: 0,
    poisonedPerformanceProfilesQuarantined: 0
  };
}

test('Alpha20.19 CM fallback keeps the named receiver envelope', async () => {
  const sent = [];
  const root = {
    character: { name: 'Leader' },
    get_active_characters: () => ({ Leader: 'self' }),
    command_character() { throw new Error('direct path must stay unavailable for unobserved follower'); },
    send_cm(name, payload) { sent.push({ name, payload }); return true; }
  };
  root.parent = root;
  const transport = new AccountCharacterTransport({ root, trustedNames: ['Leader', 'Follower'] });

  const result = await transport.send('Follower', { targetId: 'm1' }, {
    receiver: '__AIO_V3_ALPHA27_FARMER_TARGET',
    sender: 'Leader'
  });

  assert.equal(result.transport, 'send_cm');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].payload.__aioProtocol, NAMED_RECEIVER_CM_PROTOCOL);
  assert.equal(sent[0].payload.receiver, '__AIO_V3_ALPHA27_FARMER_TARGET');
  assert.deepEqual(sent[0].payload.payload, { targetId: 'm1' });
});

test('ControlledPartyBootstrap keeps the AccountCharacterTransport CM router authoritative', () => {
  const root = {
    character: { name: 'My_Ranger1', ctype: 'ranger' },
    parent: {},
    get_active_characters: () => ({
      My_Merchant: 'active',
      My_Ranger1: 'self',
      My_Ranger2: 'active',
      My_Ranger3: 'active'
    }),
    send_cm: () => true
  };
  root.parent = root;
  const transport = new AccountCharacterTransport({
    root,
    now: () => 1000,
    trustedNames: ['My_Merchant', 'My_Ranger1', 'My_Ranger2', 'My_Ranger3']
  });
  const runtime = {
    root,
    now: () => 1000,
    adapter: { mode: 'active', command: () => ({ executed: true, value: true }) },
    log: { emit() {} }
  };

  const bootstrap = new ControlledPartyBootstrap({
    runtime,
    root,
    now: runtime.now,
    adapter: runtime.adapter,
    transport,
    desiredRoster: ['My_Merchant', 'My_Ranger1', 'My_Ranger2', 'My_Ranger3'],
    merchantName: 'My_Merchant'
  });

  assert.equal(transport._cmRouterInstalled, true);
  assert.equal(root.on_cm, transport._cmRouter);
  assert.equal(bootstrap.cmWrapper, null);
  assert.equal(typeof root.__AIO_V3_PARTY_BOOTSTRAP_RECEIVE, 'function');
});

test('PartyControlLease resume cannot displace the account transport CM router', () => {
  const root = {
    character: { name: 'My_Ranger1', ctype: 'ranger' },
    parent: {},
    get_active_characters: () => ({ My_Ranger1: 'self', My_Merchant: 'active' }),
    send_cm: () => true,
    accept_party_invite: () => true
  };
  root.parent = root;
  const runtime = {
    root,
    now: () => 2000,
    log: { emit() {} },
    adapter: {
      mode: 'active',
      command(action) {
        if (action === 'send_cm' || action === 'accept_party_invite') return { executed: true, value: true };
        return { executed: false, reason: 'UNAVAILABLE' };
      },
      canCommand: () => true
    },
    partyTelemetry: null
  };
  const lease = new PartyControlLease({
    root,
    now: runtime.now,
    log: runtime.log,
    adapter: runtime.adapter,
    merchantName: 'My_Merchant',
    trustedNames: ['My_Merchant', 'My_Ranger1']
  });
  runtime.partyControlLease = lease;
  assert.equal(lease.install(), true);

  const communication = new PartyAccountCommunicationReliability(runtime);
  runtime.partyAccountCommunication = communication;
  const router = communication.transport._cmRouter;
  assert.equal(root.on_cm, router);
  assert.equal(lease.__aioAccountTransportControlReceiverInstalled, true);

  assert.equal(lease.uninstall(), true);
  assert.equal(lease.install(), true);
  assert.equal(root.on_cm, router);
  assert.equal(communication.transport._cmRouterInstalled, true);
});

test('Alpha27 leader target reaches a follower through the CM fallback', () => {
  const now = () => 1000;
  const followerRoot = {
    character: { name: 'Follower', ctype: 'ranger' },
    get_active_characters: () => ({ Follower: 'self' }),
    on_cm: null
  };
  followerRoot.parent = followerRoot;
  const followerTransport = new AccountCharacterTransport({ root: followerRoot, now, trustedNames: ['Leader', 'Follower'] });
  const followerRuntime = {
    root: followerRoot,
    now,
    log: { emit() {} },
    farmer: { targetId: null, targetType: null, state: 'SELECT_TARGET' },
    lastSnapshot: { character: followerRoot.character, entities: [] },
    partyAccountCommunication: { transport: followerTransport },
    teamCombatCohesionHotfix: {
      _team: () => ({ leaderName: 'Leader', selfName: 'Follower', members: [{ name: 'Leader' }, { name: 'Follower' }] })
    }
  };
  const followerStats = targetStats();
  const followerOwnership = new Alpha27CombatOwnership(followerRuntime, {
    now,
    log: followerRuntime.log,
    options: { targetPublishMs: 250, targetTtlMs: 6000 },
    stats: followerStats
  });
  assert.equal(followerOwnership.ensureTargetReceiver(), true);

  const leaderRoot = {
    character: { name: 'Leader', ctype: 'ranger' },
    get_active_characters: () => ({ Leader: 'self' }),
    command_character() { throw new Error('direct path must stay unavailable for unobserved follower'); },
    send_cm(name, payload) {
      assert.equal(name, 'Follower');
      followerRoot.on_cm('Leader', payload);
      return true;
    }
  };
  leaderRoot.parent = leaderRoot;
  const leaderTransport = new AccountCharacterTransport({ root: leaderRoot, now, trustedNames: ['Leader', 'Follower'] });
  const leaderRuntime = {
    root: leaderRoot,
    now,
    log: { emit() {} },
    farmer: { targetId: 'm1', targetType: 'goo', state: 'ENGAGE' },
    lastSnapshot: { character: leaderRoot.character, entities: [{ id: 'm1', mtype: 'goo', hp: 100 }] },
    partyAccountCommunication: { transport: leaderTransport },
    teamCombatCohesionHotfix: {
      _team: () => ({ leaderName: 'Leader', selfName: 'Leader', members: [{ name: 'Leader' }, { name: 'Follower' }] })
    }
  };
  const leaderStats = targetStats();
  const leaderOwnership = new Alpha27CombatOwnership(leaderRuntime, {
    now,
    log: leaderRuntime.log,
    options: { targetPublishMs: 250, targetTtlMs: 6000 },
    stats: leaderStats
  });

  assert.equal(leaderOwnership.publishFarmerTarget(), true);
  assert.equal(leaderStats.targetAuthorityPublishes, 1);
  assert.equal(followerStats.targetAuthorityReceives, 1);
  assert.equal(followerOwnership.remoteLeaderTarget.leaderName, 'Leader');
  assert.equal(followerOwnership.remoteLeaderTarget.targetId, 'm1');
  assert.equal(followerOwnership.remoteLeaderTarget.targetType, 'goo');
  assert.equal(followerTransport.status().stats.fallbackReceived, 1);
});
