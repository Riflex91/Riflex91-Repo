'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { SafeAutoUpdater, errorDetails } = require('../src/ops/safe-auto-updater');

function makeUpdater({ nowRef = { value: 100000 }, upload } = {}) {
  const root = {
    AIO_V3_AUTO_UPDATE_CONFIG: { applyRetryBaseMs: 30000, applyRetryMaxMs: 120000 },
    upload_code: upload || (async () => ({ success: true })),
    get_active_code_slot: () => ({ slot: 7, name: 'Main' }),
    load_code: async () => true,
    fetch: async () => ({ ok: true, text: async () => '' })
  };
  root.parent = root;
  const runtime = {
    root,
    now: () => nowRef.value,
    lastSnapshot: { character: { name: 'Merchant', hp: 100, max_hp: 100 }, entities: [] }
  };
  const updater = new SafeAutoUpdater(runtime, { localVersion: '1.0.0' });
  updater.pendingVersion = '1.0.1';
  updater.pendingSince = nowRef.value;
  updater.safeSince = nowRef.value - 10000;
  updater._stableSafe = () => true;
  updater._fetchText = async () => 'Adventure Land AiO Bot AIO_V3 1.0.1 ' + 'x'.repeat(10000);
  return { updater, root, runtime, nowRef };
}

test('structured Adventure Land API failures keep their reason instead of becoming [object Object]', () => {
  assert.deepEqual(errorDetails({ failed: true, reason: 'invalid_code', status: 400, place: 'save_code' }), {
    reason: 'invalid_code', failed: true, status: 400, place: 'save_code'
  });
});

test('auto updater prefers upload_code and backs off after a failed save', async () => {
  const nowRef = { value: 100000 };
  let uploads = 0;
  const { updater } = makeUpdater({
    nowRef,
    upload: async () => {
      uploads += 1;
      throw { failed: true, reason: 'invalid_code', status: 400, place: 'save_code' };
    }
  });

  assert.equal(await updater.applyPending(), false);
  assert.equal(uploads, 1);
  assert.equal(updater.lastApply.saved, false);
  assert.equal(updater.lastApply.errorReason, 'invalid_code');
  assert.equal(updater.lastApply.error.place, 'save_code');
  assert.equal(updater.nextApplyAt, 130000);

  nowRef.value = 101000;
  assert.equal(await updater.applyPending(), false);
  assert.equal(uploads, 1, 'save must not be hammered once per runtime tick');

  nowRef.value = 130000;
  assert.equal(await updater.applyPending(), false);
  assert.equal(uploads, 2);
  assert.equal(updater.nextApplyAt, 190000);
});

test('resolve-all style fulfilled failures are still treated as failed saves', async () => {
  const { updater } = makeUpdater({ upload: async () => ({ failed: true, reason: 'payload_too_large', status: 413 }) });
  assert.equal(await updater.applyPending(), false);
  assert.equal(updater.lastApply.errorReason, 'payload_too_large');
  assert.equal(updater.lastApply.saved, false);
});