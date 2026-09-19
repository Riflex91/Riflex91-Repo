import test from 'node:test';
import assert from 'node:assert/strict';
import { redactDeep as redactBase } from '../src/worker.js';
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
