import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const schemaDateien = [
  'bot-ereignis.schema.json',
  'bot-meldung.schema.json',
  'vorfall.schema.json',
  'archiv-verzeichnis.schema.json',
  'entwicklungs-aufgabe.schema.json',
  'konto-profil.schema.json'
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

test('Kontoprofil enthaelt keine Felder fuer gespeicherte Kennwoerter', async () => {
  const inhalt = await readFile(new URL('../../schemata/konto-profil.schema.json', import.meta.url), 'utf8');
  assert.doesNotMatch(inhalt, /passwort|kennwort|password/i);
});
