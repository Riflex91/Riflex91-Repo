import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const dateien = [
  'wiederholungs-datensatz.schema.json',
  'wiederholungs-lauf.schema.json',
  'goldener-wiederholungseintrag.schema.json'
];

for (const dateiname of dateien) {
  test(`${dateiname} ist fest versioniert`, async () => {
    const inhalt = await readFile(new URL(`../../schemata/${dateiname}`, import.meta.url), 'utf8');
    const schema = JSON.parse(inhalt);
    assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.match(schema.$id, /^https:\/\/aio-v4\.invalid\/schemata\//);
    assert.equal(schema.type, 'object');
    assert.equal(schema.properties.schemaVersion.const, 1);
  });
}

test('Wiederholungslauf hat feste Sicherheitszustaende', async () => {
  const schema = JSON.parse(await readFile(new URL('../../schemata/wiederholungs-lauf.schema.json', import.meta.url), 'utf8'));
  assert.deepEqual(schema.properties.entscheidungen.items.properties.sicherheitszustand.enum, ['sicher', 'warnung', 'verletzung']);
});

test('Goldener Eintrag verweist auf den versionierten Wiederholungsdatensatz', async () => {
  const schema = JSON.parse(await readFile(new URL('../../schemata/goldener-wiederholungseintrag.schema.json', import.meta.url), 'utf8'));
  assert.equal(schema.properties.datensatz.$ref, 'https://aio-v4.invalid/schemata/wiederholungs-datensatz.schema.json');
  assert.equal(schema.properties.sha256.pattern, '^[a-f0-9]{64}$');
});
