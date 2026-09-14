import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKERS_INTERNAL_DAILY_TARGET,
  R2_MONTHLY_CLASS_A_BUDGET,
  R2_MONTHLY_CLASS_B_BUDGET,
  R2_LIVE_STORAGE_BUDGET_BYTES,
  R2_STORAGE_WINDOW_DAYS,
  R2_LIFECYCLE_DAYS,
  budgetPolicy,
  reserveR2ClassABudget,
  reserveR2ClassBBudget,
  reserveR2LiveStorageBudget
} from '../src/free-tier-budget.js';

function fakeBudgetDb({ classAExhausted = false, classBExhausted = false, liveBytes = 0 } = {}) {
  let classA = 0;
  let classB = 0;
  let trackedLiveBytes = liveBytes;
  return {
    prepare(sql) {
      const source = String(sql);
      if (source.startsWith('CREATE TABLE')) return { async run() { return { success: true }; } };
      if (source.startsWith('SELECT COALESCE')) return { bind() { return { async first() { return { bytes: trackedLiveBytes }; } }; } };
      if (source.startsWith('INSERT INTO r2_archive_daily_budget')) {
        return {
          bind(day, nextBytes, now, windowStart, checkedBytes, limit) {
            return {
              async first() {
                if (checkedBytes !== nextBytes || trackedLiveBytes + nextBytes > limit) return null;
                trackedLiveBytes += nextBytes;
                return { day, bytes: nextBytes, updated_at: now, windowStart };
              }
            };
          }
        };
      }
      if (source.includes('r2_archive_read_budget')) {
        return { bind(period, now, limit) { return { async first() { if (classBExhausted || classB >= limit) return null; classB += 1; return { period, class_b_ops: classB, updated_at: now }; } }; } };
      }
      return {
        bind(period, now, limit) {
          return {
            async first() {
              if (classAExhausted || classA >= limit) return null;
              classA += 1;
              return { period, class_a_ops: classA, updated_at: now };
            }
          };
        }
      };
    }
  };
}

test('free-tier policy uses 95% hard budgets and a short R2 lifecycle', () => {
  assert.equal(WORKERS_INTERNAL_DAILY_TARGET, 95000);
  assert.equal(R2_MONTHLY_CLASS_A_BUDGET, 950000);
  assert.equal(R2_MONTHLY_CLASS_B_BUDGET, 9500000);
  assert.equal(R2_LIVE_STORAGE_BUDGET_BYTES, 9_500_000_000);
  assert.equal(R2_STORAGE_WINDOW_DAYS, 8);
  assert.equal(R2_LIFECYCLE_DAYS, 7);
  assert.equal(budgetPolicy().r2.failClosed, true);
  assert.equal(budgetPolicy().r2.standardStorageOnly, true);
});

test('R2 Class A reservation succeeds below limits and fails closed when exhausted', async () => {
  const now = Date.UTC(2026, 8, 14);
  const ok = await reserveR2ClassABudget({ DB: fakeBudgetDb() }, now);
  assert.equal(ok.ok, true);
  assert.equal(ok.classAOps, 1);
  const blocked = await reserveR2ClassABudget({ DB: fakeBudgetDb({ classAExhausted: true }) }, now);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'R2_MONTHLY_CLASS_A_BUDGET_EXHAUSTED');
});

test('R2 Class B reservation fails closed at 95% of the free monthly read ceiling', async () => {
  const ok = await reserveR2ClassBBudget({ DB: fakeBudgetDb() }, Date.UTC(2026, 8, 14));
  assert.equal(ok.ok, true);
  assert.equal(ok.classBOps, 1);
  const blocked = await reserveR2ClassBBudget({ DB: fakeBudgetDb({ classBExhausted: true }) }, Date.UTC(2026, 8, 14));
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'R2_MONTHLY_CLASS_B_BUDGET_EXHAUSTED');
});

test('R2 live-storage reservation is separate and blocks before tracked storage exceeds 95%', async () => {
  const now = Date.UTC(2026, 8, 14);
  const ok = await reserveR2LiveStorageBudget({ DB: fakeBudgetDb({ liveBytes: 1024 }) }, 2048, now);
  assert.equal(ok.ok, true);
  assert.equal(ok.liveBytes, 3072);
  const blocked = await reserveR2LiveStorageBudget({ DB: fakeBudgetDb({ liveBytes: 9_499_999_900 }) }, 1024, now);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'R2_STORAGE_FREE_TIER_BUDGET_EXHAUSTED');
});

test('R2 reservations block if durable budget accounting is unavailable', async () => {
  const now = Date.UTC(2026, 8, 14);
  const classA = await reserveR2ClassABudget({}, now);
  const classB = await reserveR2ClassBBudget({}, now);
  const storage = await reserveR2LiveStorageBudget({}, 1024, now);
  assert.equal(classA.reason, 'R2_BUDGET_DB_UNAVAILABLE');
  assert.equal(classB.reason, 'R2_BUDGET_DB_UNAVAILABLE');
  assert.equal(storage.reason, 'R2_BUDGET_DB_UNAVAILABLE');
});
