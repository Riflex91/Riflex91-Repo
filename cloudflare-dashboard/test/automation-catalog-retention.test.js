import test from 'node:test';
import assert from 'node:assert/strict';
import baseWorker, { redactDeep as redactBase, sanitizeAutomationCatalogPayload, parseAdventureLandDataJs, officialAutomationCatalogFromGameData, mergeAutomationCatalogRows } from '../src/worker.js';
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


test('official Adventure Land data parser builds searchable Party Hat metadata without evaluating script', () => {
  const gameData = {
    version: 123,
    items: {
      sword: { name: 'Sword', type: 'weapon', wtype: 'sword', g: 1000, upgrade: { attack: 1 }, skin: 'sword' },
      partyhat: { name: 'Party Hat', type: 'helmet', g: 12000, upgrade: { armor: 1 }, explanation: 'A festive hat', skin: 'partyhat' }
    },
    positions: {
      sword: ['', 2, 3],
      partyhat: ['', 11, 0]
    },
    imagesets: {
      pack_20: { size: 20, rows: 64, columns: 16, file: '/images/tiles/items/pack_20vt8.png' }
    }
  };
  const parsed = parseAdventureLandDataJs('var G=' + JSON.stringify(gameData) + ';');
  const rows = officialAutomationCatalogFromGameData(parsed);
  const partyhat = rows.find(row => row.id === 'partyhat');
  assert.ok(partyhat);
  assert.equal(partyhat.name, 'Party Hat');
  assert.equal(partyhat.type, 'helmet');
  assert.equal(partyhat.economy.baseGold, 12000);
  assert.deepEqual(partyhat.sprite, {
    skin: 'partyhat',
    file: 'https://adventure.land/images/tiles/items/pack_20vt8.png',
    x: 11,
    y: 0,
    size: 20,
    columns: 16,
    rows: 64
  });
});

test('official catalog fills items missing from a legacy 300-row runtime catalog', () => {
  const legacy = Array.from({ length: 300 }, (_, index) => ({ id: 'legacy-' + index, name: 'Legacy ' + index }));
  const official = [...legacy, { id: 'partyhat', name: 'Party Hat', type: 'helmet', official: true }];
  const merged = mergeAutomationCatalogRows(official, legacy);
  assert.equal(merged.length, 301);
  assert.ok(merged.some(row => row.id === 'partyhat' && row.name === 'Party Hat'));
});


test('merchant metadata cannot erase an official inventory-compatible sprite', () => {
  const sprite = {
    skin: 'partyhat',
    file: 'https://adventure.land/images/tiles/items/pack_20vt8.png',
    x: 11,
    y: 0,
    size: 20,
    columns: 16,
    rows: 64
  };
  const merged = mergeAutomationCatalogRows(
    [{ id: 'partyhat', name: 'Party Hat', skin: 'partyhat', sprite, official: true }],
    [{ id: 'partyhat', name: 'Party Hat', skin: 'partyhat', sprite: null, observed: true }]
  );
  assert.deepEqual(merged[0].sprite, sprite);
  assert.equal(merged[0].observed, true);
});

test('Automation endpoint falls back to official game data when D1 only has the legacy 300-row cap', { concurrency: false }, async () => {
  const legacy = Array.from({ length: 300 }, (_, index) => ({ id: 'legacy-' + index, name: 'Legacy ' + index }));
  const officialItems = Object.fromEntries(Array.from({ length: 301 }, (_, index) => ['official-' + index, { name: 'Official ' + index, type: 'material' }]));
  officialItems.partyhat = { name: 'Party Hat', type: 'helmet', g: 12000, upgrade: { armor: 1 } };
  const row = { character: 'Merchant_Test', catalog_version: 2, catalog_count: 300, declared_count: 300, payload: JSON.stringify(legacy), received_at: 1000 };
  const DB = {
    async batch(statements) { return statements.map(() => ({ success: true })); },
    prepare(sql) {
      const source = String(sql);
      const statement = {
        args: [],
        bind(...args) { statement.args = args; return statement; },
        async first() {
          if (source.startsWith('SELECT character,catalog_version,catalog_count,declared_count,payload,received_at FROM v3_automation_catalog')) return row;
          return null;
        },
        async run() { return { success: true }; }
      };
      return statement;
    }
  };
  const priorFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('var G=' + JSON.stringify({ version: 999, items: officialItems }) + ';', { status: 200, headers: { 'content-type': 'application/javascript' } });
  try {
    const request = new Request('https://dashboard.example/api/v3/automation-catalog', { headers: { 'x-aio-read-key': 'test-read' } });
    const response = await baseWorker.fetch(request, { DB, READ_KEY: 'test-read' });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.catalog.source, 'official+merchant');
    assert.equal(body.catalog.complete, true);
    assert.ok(body.catalog.items.length > 300);
    assert.ok(body.catalog.items.some(item => item.id === 'partyhat' && item.name === 'Party Hat'));
  } finally {
    globalThis.fetch = priorFetch;
  }
});
