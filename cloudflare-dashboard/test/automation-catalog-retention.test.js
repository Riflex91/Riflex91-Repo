import test from 'node:test';
import assert from 'node:assert/strict';
import baseWorker, { redactDeep as redactBase, sanitizeAutomationCatalogPayload } from '../src/worker.js';
import { redactDeep as redact22 } from '../src/worker-alpha20-22.js';

function catalogFixture() {
  const rows = Array.from({ length: 627 }, (_, index) => ({
    id: 'item-' + String(index).padStart(4, '0'),
    name: 'Item ' + index,
    economy: { baseGold: index + 1, npcSellValues: [{ level: 0, value: index + 1 }] }
  }));
  rows.push({
    id: 'partyhat',
    name: 'Party Hat',
    economy: { baseGold: 12000, npcSellValues: [{ level: 0, value: 7200 }] }
  });
  return rows;
}

for (const [name, redact] of [['base worker', redactBase], ['alpha20.22 worker', redact22]]) {
  test(name + ' preserves all Automation catalog entries beyond the generic 300-array safety cap', () => {
    const automationCatalog = catalogFixture();
    const clean = redact({ automationCatalog, unrelated: Array.from({ length: 628 }, (_, i) => i) });
    assert.equal(clean.automationCatalog.length, 628);
    assert.equal(clean.automationCatalog.at(-1).id, 'partyhat');
    assert.equal(clean.automationCatalog.at(-1).economy.npcSellValues[0].value, 7200);
    assert.equal(clean.unrelated.length, 300);
  });
}


test('dedicated Automation catalog sanitizer keeps the complete catalog and declared metadata', () => {
  const catalog = catalogFixture();
  const clean = sanitizeAutomationCatalogPayload({ catalog, catalogVersion: 3, catalogCount: 628 });
  assert.equal(clean.catalogVersion, 3);
  assert.equal(clean.catalogCount, 628);
  assert.equal(clean.declaredCount, 628);
  assert.equal(clean.catalog.at(-1).id, 'partyhat');
});

test('dedicated Automation catalog endpoint stores and reads all rows without the runtime heartbeat cap', async () => {
  let stored = null;
  const DB = {
    async batch(statements) { return statements.map(() => ({ success: true })); },
    prepare(sql) {
      const source = String(sql);
      const statement = {
        args: [],
        bind(...args) { statement.args = args; return statement; },
        async run() {
          if (source.startsWith('INSERT INTO v3_automation_catalog')) {
            const [account, character, catalog_version, catalog_count, declared_count, payload, received_at] = statement.args;
            stored = { account, character, catalog_version, catalog_count, declared_count, payload, received_at };
          }
          return { success: true };
        },
        async first() {
          if (source.startsWith('SELECT character,catalog_version,catalog_count,declared_count,payload,received_at FROM v3_automation_catalog')) {
            if (!stored || stored.account !== statement.args[0]) return null;
            return stored;
          }
          return null;
        }
      };
      return statement;
    }
  };
  const env = { DB, WRITE_KEY: 'test-write', READ_KEY: 'test-read' };
  const catalog = catalogFixture();
  const post = new Request('https://dashboard.example/api/v3/automation-catalog', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ account: 'default', character: 'Merchant_Test', writeKey: 'test-write', catalogVersion: 3, catalogCount: catalog.length, catalog })
  });
  const postResponse = await baseWorker.fetch(post, env);
  assert.equal(postResponse.status, 200);
  const postJson = await postResponse.json();
  assert.equal(postJson.catalogCount, 628);

  const get = new Request('https://dashboard.example/api/v3/automation-catalog', { headers: { 'x-aio-read-key': 'test-read' } });
  const getResponse = await baseWorker.fetch(get, env);
  assert.equal(getResponse.status, 200);
  const getJson = await getResponse.json();
  assert.equal(getJson.catalog.items.length, 628);
  assert.equal(getJson.catalog.items.at(-1).id, 'partyhat');
  assert.equal(getJson.catalog.declaredCount, 628);
});
