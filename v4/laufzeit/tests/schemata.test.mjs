import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const schemaDateien = [
  'bot-ereignis.schema.json',
  'bot-meldung.schema.json',
  'vorfall.schema.json',
  'archiv-verzeichnis.schema.json',
  'entwicklungs-aufgabe.schema.json',
  'tages-bericht.schema.json',
  'tages-bericht-einstellung.schema.json',
  'dienst-profil.schema.json'
];

for (const dateiname of schemaDateien) {
  test(`${dateiname} ist gueltiges JSON und besitzt eine feste Schema-Kennung`, async () => {
    const inhalt = await readFile(new URL(`../../schemata/${dateiname}`, import.meta.url), 'utf8');
    const schema = JSON.parse(inhalt);
    assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.match(schema.$id, /^https:\/\/aio-v4\.invalid\/schemata\//);
    assert.equal(schema.type, 'object');
  });
}

test('Tagesbericht-Einstellung verlangt bei E-Mail-Versand eine Empfaengeradresse', async () => {
  const inhalt = await readFile(new URL('../../schemata/tages-bericht-einstellung.schema.json', import.meta.url), 'utf8');
  const schema = JSON.parse(inhalt);
  assert.deepEqual(schema.allOf[0].then.required, ['empfaengerEmail']);
  assert.deepEqual(schema.properties.versandArten.items.enum, ['email', 'web_oberflaeche']);
});

test('Dienstprofile verlangen Quelle, Gueltigkeit, Anbietermaximum und Sicherheitspuffer', async () => {
  const inhalt = await readFile(new URL('../../schemata/dienst-profil.schema.json', import.meta.url), 'utf8');
  const schema = JSON.parse(inhalt);
  assert.ok(schema.required.includes('quelle'));
  assert.ok(schema.required.includes('gueltigBis'));
  assert.deepEqual(schema.properties.grenzen.items.required, ['kennung', 'einheit', 'zeitraum', 'anbieterMaximum', 'sicherheitsPuffer']);
});
