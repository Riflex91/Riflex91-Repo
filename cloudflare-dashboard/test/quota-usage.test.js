import test from 'node:test';
import assert from 'node:assert/strict';
import {
  D1_FREE_DAILY_ROWS_READ_LIMIT,
  D1_FREE_DAILY_ROWS_WRITTEN_LIMIT,
  SUPABASE_EDGE_MONTHLY_INVOCATION_LIMIT,
  getQuotaUsage,
  quotaPolicy,
  recordWorkerRequest
} from '../src/quota-usage.js';

function fakeDb() {
  return {
    prepare(sql) {
      const source = String(sql);
      const statement = {
        bind() { return statement; },
        async run() { return { success: true }; },
        async first() {
          if (source.includes('FROM cloud_usage_daily')) return { worker_requests: 10, d1_rows_read: 20, d1_rows_written: 30, tracking_started_at: 1, updated_at: 2 };
          if (source.includes('FROM r2_archive_budget')) return { class_a_ops: 40 };
          if (source.includes('FROM r2_archive_read_budget')) return { class_b_ops: 50 };
          if (source.includes('SUM(bytes)')) return { bytes: 60 };
          return null;
        }
      };
      return statement;
    }
  };
}

test('quota policy exposes the current Worker, D1, R2 and Supabase free-tier ceilings', () => {
  const policy = quotaPolicy();
  assert.equal(policy.worker.dailyLimit, 100000);
  assert.equal(policy.worker.target, 95000);
  assert.equal(D1_FREE_DAILY_ROWS_READ_LIMIT, 5000000);
  assert.equal(D1_FREE_DAILY_ROWS_WRITTEN_LIMIT, 100000);
  assert.equal(SUPABASE_EDGE_MONTHLY_INVOCATION_LIMIT, 500000);
  assert.equal(policy.r2.monthlyClassA, 950000);
  assert.equal(policy.r2.monthlyClassB, 9500000);
});

test('quota snapshot combines tracked Cloudflare usage with the Supabase usage feed', async () => {
  const now = Date.UTC(2026, 8, 15);
  recordWorkerRequest(now);
  const quota = await getQuotaUsage(
    { DB: fakeDb() },
    async () => ({
      ok: true,
      async json() { return { ok: true, period: '2026-09', used: 70, limit: 500000, source: 'test-feed', approximate: true }; }
    }),
    now
  );
  assert.ok(quota.worker.used >= 10);
  assert.ok(quota.d1.rowsRead.used >= 20);
  assert.equal(quota.d1.rowsWritten.used, 30);
  assert.equal(quota.r2.classA.used, 40);
  assert.equal(quota.r2.classB.used, 50);
  assert.equal(quota.r2.storage.used, 60);
  assert.equal(quota.supabase.used, 70);
  assert.equal(quota.supabase.limit, 500000);
});
