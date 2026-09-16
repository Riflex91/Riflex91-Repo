'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { AccountCharacterTransport, NAMED_RECEIVER_CM_PROTOCOL } = require('../src/party/account-character-transport');
const {
  RELIABLE_RECEIVER,
  DELIVERY_KIND,
  ACK_KIND,
  installAlpha2057ReliableAccountTransport
} = require('../src/reliability/alpha20-57-reliable-account-transport');

installAlpha2057ReliableAccountTransport();

function logRecorder() {
  const events = [];
  return { events, log: { emit(row) { events.push(row); } } };
}

function linkedPair(options = {}) {
  const names = options.names || ['My_Ranger1', 'My_Ranger2'];
  const [aName, bName] = names;
  const droppedDeliveries = new Set(options.dropDeliveries || []);
  const droppedAcks = new Set(options.dropAcks || []);
  let deliveryCalls = 0;
  let ackCalls = 0;
  const aLog = logRecorder();
  const bLog = logRecorder();
  const rootA = {
    character: { name: aName },
    get_active_characters: () => ({ [aName]: 'self' })
  };
  const rootB = {
    character: { name: bName },
    get_active_characters: () => ({ [bName]: 'self' })
  };
  rootA.send_cm = (target, payload) => {
    assert.equal(target, bName);
    deliveryCalls += 1;
    if (!droppedDeliveries.has(deliveryCalls)) rootB.on_cm(aName, payload);
  };
  rootB.send_cm = (target, payload) => {
    assert.equal(target, aName);
    ackCalls += 1;
    if (!droppedAcks.has(ackCalls)) rootA.on_cm(bName, payload);
  };
  const a = new AccountCharacterTransport({ root: rootA, trustedNames: names, log: aLog.log });
  const b = new AccountCharacterTransport({ root: rootB, trustedNames: names, log: bLog.log });
  return { a, b, rootA, rootB, aLog, bLog, counts: () => ({ deliveryCalls, ackCalls }) };
}

function reliableOptions(overrides = {}) {
  return {
    receiver: 'alpha28.progression.crossmap',
    sender: 'My_Ranger1',
    requiresAck: true,
    messageId: 'regroup-1:My_Ranger2',
    ackTimeoutMs: 25,
    maxAttempts: 2,
    retryBackoffMs: 0,
    ...overrides
  };
}

test('resolved send_cm without remote ACK never becomes delivered=true', async () => {
  const events = logRecorder();
  const sent = [];
  const root = {
    character: { name: 'My_Ranger1' },
    get_active_characters: () => ({ My_Ranger1: 'self' }),
    send_cm(target, payload) { sent.push({ target, payload }); }
  };
  const transport = new AccountCharacterTransport({
    root,
    trustedNames: ['My_Ranger1', 'My_Ranger2'],
    log: events.log
  });
  const result = await transport.send('My_Ranger2', { kind: 'TEAM_REGROUP' }, reliableOptions());
  assert.equal(result.delivered, false);
  assert.equal(result.reason, 'REMOTE_ACK_NOT_CONFIRMED');
  assert.equal(sent.length, 2);
  assert.equal(sent[0].payload.__aioProtocol, NAMED_RECEIVER_CM_PROTOCOL);
  assert.equal(sent[0].payload.receiver, RELIABLE_RECEIVER);
  assert.equal(sent[0].payload.payload.kind, DELIVERY_KIND);
  assert.equal(sent[0].payload.payload.receiver, 'alpha28.progression.crossmap');
  assert.equal(sent[0].payload.payload.messageId, 'regroup-1:My_Ranger2');
  assert.equal(transport.status().stats.deliveryAttempted, 2);
  assert.equal(transport.status().stats.deliveryTimeouts, 2);
  assert.equal(transport.status().stats.deliveryRetries, 1);
  assert.equal(transport.status().stats.deliveryFailedSafe, 1);
  assert.ok(events.events.some((row) => row.event === 'ACCOUNT_TRANSPORT_DELIVERY_FAILED_SAFE'));
});

test('normal remote receive + named receiver + ACK confirms delivery', async () => {
  const pair = linkedPair();
  let calls = 0;
  pair.b.installDirectReceiver('alpha28.progression.crossmap', (sender, payload) => {
    calls += 1;
    assert.equal(sender, 'My_Ranger1');
    assert.equal(payload.kind, 'TEAM_REGROUP');
    return true;
  });
  const result = await pair.a.send('My_Ranger2', { kind: 'TEAM_REGROUP' }, reliableOptions());
  assert.equal(result.delivered, true);
  assert.equal(result.transport, 'send_cm-ack');
  assert.equal(result.reason, 'REMOTE_ACK_CONFIRMED');
  assert.equal(calls, 1);
  assert.equal(pair.a.status().stats.ackReceived, 1);
  assert.equal(pair.b.status().stats.remoteReceived, 1);
  assert.equal(pair.b.status().stats.receiverAccepted, 1);
  assert.equal(pair.b.status().stats.ackSent, 1);
  assert.ok(pair.aLog.events.some((row) => row.event === 'ACCOUNT_TRANSPORT_ACK_RECEIVED'));
  assert.ok(pair.bLog.events.some((row) => row.event === 'ACCOUNT_TRANSPORT_REMOTE_RECEIVED'));
});

test('first delivery loss times out and bounded retry succeeds', async () => {
  const pair = linkedPair({ dropDeliveries: [1] });
  let calls = 0;
  pair.b.installDirectReceiver('alpha28.progression.crossmap', () => { calls += 1; return true; });
  const result = await pair.a.send('My_Ranger2', { kind: 'TEAM_REGROUP' }, reliableOptions());
  assert.equal(result.delivered, true);
  assert.equal(result.attempts, 2);
  assert.equal(calls, 1);
  assert.deepEqual(pair.counts(), { deliveryCalls: 2, ackCalls: 1 });
  assert.equal(pair.a.status().stats.deliveryRetries, 1);
  assert.equal(pair.a.status().stats.deliveryTimeouts, 1);
});

test('lost first ACK causes duplicate suppression and ACK resend without double execution', async () => {
  const pair = linkedPair({ dropAcks: [1] });
  let calls = 0;
  pair.b.installDirectReceiver('alpha28.progression.crossmap', () => { calls += 1; return true; });
  const result = await pair.a.send('My_Ranger2', { kind: 'TEAM_REGROUP' }, reliableOptions());
  assert.equal(result.delivered, true);
  assert.equal(result.attempts, 2);
  assert.equal(calls, 1);
  assert.deepEqual(pair.counts(), { deliveryCalls: 2, ackCalls: 2 });
  assert.equal(pair.b.status().stats.duplicatesSuppressed, 1);
  assert.ok(pair.bLog.events.some((row) => row.event === 'ACCOUNT_TRANSPORT_DUPLICATE_SUPPRESSED'));
});

test('router displacement self-heals and ordinary CM forwarding is preserved', async () => {
  const pair = linkedPair();
  let receiverCalls = 0;
  const ordinary = [];
  pair.b.installDirectReceiver('alpha28.progression.crossmap', () => { receiverCalls += 1; return true; });
  pair.rootB.on_cm = (sender, payload) => { ordinary.push({ sender, payload }); return 'legacy'; };
  assert.equal(pair.b._installCmRouter(), true);
  const result = await pair.a.send('My_Ranger2', { kind: 'TEAM_REGROUP' }, reliableOptions());
  assert.equal(result.delivered, true);
  assert.equal(receiverCalls, 1);
  pair.rootB.on_cm('Other', { type: 'ordinary' });
  assert.deepEqual(ordinary, [{ sender: 'Other', payload: { type: 'ordinary' } }]);
  assert.equal(pair.b.status().stats.cmRouterRepairs, 1);
  assert.ok(pair.bLog.events.some((row) => row.event === 'ACCOUNT_TRANSPORT_CM_ROUTER_REPAIRED'));
});

test('remote named receiver rejection returns a negative ACK and fails safe without fake success', async () => {
  const pair = linkedPair();
  pair.b.installDirectReceiver('alpha28.progression.crossmap', () => false);
  const result = await pair.a.send('My_Ranger2', { kind: 'TEAM_REGROUP' }, reliableOptions());
  assert.equal(result.delivered, false);
  assert.equal(result.reason, 'NAMED_RECEIVER_REJECTED');
  assert.equal(result.attempts, 1);
  assert.equal(pair.a.status().stats.ackReceived, 1);
  assert.equal(pair.a.status().stats.deliveryRetries, 0);
  assert.equal(pair.a.status().stats.deliveryFailedSafe, 1);
});

test('authorized Alpha28 objective uses stable ACK delivery without changing its current call site', async () => {
  const pair = linkedPair();
  let calls = 0;
  pair.b.installDirectReceiver('alpha28.progression.crossmap', (_sender, payload) => {
    calls += 1;
    assert.equal(payload.id, 'alpha28-regroup-1789588287976-My_Ranger1');
    return true;
  });
  const payload = {
    id: 'alpha28-regroup-1789588287976-My_Ranger1',
    kind: 'TEAM_REGROUP',
    leaderName: 'My_Ranger1',
    map: 'main',
    x: -87,
    y: 673,
    crossMapAuthorizedBy: 'alpha28-controlled-farmer-travel'
  };
  const result = await pair.a.send('My_Ranger2', payload, {
    receiver: 'alpha28.progression.crossmap',
    sender: 'My_Ranger1',
    ackTimeoutMs: 25,
    maxAttempts: 2,
    retryBackoffMs: 0
  });
  assert.equal(result.delivered, true);
  assert.equal(result.messageId, `alpha28:${payload.id}:My_Ranger2`);
  assert.equal(calls, 1);
  assert.equal(pair.a.status().alpha20_57ReliableAccountTransport, true);
});

test('ACK envelopes are never forwarded to ordinary legacy on_cm handlers', async () => {
  const pair = linkedPair();
  const ordinary = [];
  pair.rootA.on_cm = (sender, payload) => { ordinary.push({ sender, payload }); };
  pair.a._installCmRouter();
  pair.b.installDirectReceiver('alpha28.progression.crossmap', () => true);
  const result = await pair.a.send('My_Ranger2', { kind: 'TEAM_REGROUP' }, reliableOptions());
  assert.equal(result.delivered, true);
  assert.equal(ordinary.length, 0);
  assert.equal(ACK_KIND, 'ACK');
});