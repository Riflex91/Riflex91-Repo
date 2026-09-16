import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function schema(name) {
  return JSON.parse(await readFile(new URL(`../../schemata/${name}`, import.meta.url), 'utf8'));
}

for (const name of ['telemetrie-dauerzustand.schema.json','wiederholungs-segment.schema.json','vorfall.schema.json','vorfall-paket.schema.json']) {
  test(`${name} ist fest versioniert`, async () => {
    const wert = await schema(name);
    assert.equal(wert.$schema, 'https://json-schema.org/draft/2020-12/schema');
    assert.match(wert.$id, /^https:\/\/aio-v4\.invalid\/schemata\//);
    assert.equal(wert.type, 'object');
    assert.equal(wert.properties.schemaVersion.const, 1);
  });
}

test('Wiederholungssegmente verlangen Sequenzbereich, Groesse und SHA-256', async () => {
  const wert = await schema('wiederholungs-segment.schema.json');
  for (const feld of ['sequenzStart','sequenzEnde','groesseBytes','sha256','inhalt']) assert.ok(wert.required.includes(feld));
  assert.equal(wert.properties.sha256.pattern, '^[a-f0-9]{64}$');
});

test('Dauertelemetrie haelt geschuetzte Segmente und Vorfallpakete getrennt', async () => {
  const wert = await schema('telemetrie-dauerzustand.schema.json');
  assert.equal(wert.properties.wiederholungsSegmente.items.$ref, 'https://aio-v4.invalid/schemata/wiederholungs-segment.schema.json');
  assert.equal(wert.properties.vorfallPakete.items.$ref, 'https://aio-v4.invalid/schemata/vorfall-paket.schema.json');
});

test('Vorfaelle haben feste Arten und eine erklaerende BotMeldung', async () => {
  const wert = await schema('vorfall.schema.json');
  assert.deepEqual(wert.properties.art.enum, ['stillstand','schleife','zeitueberschreitung','unerwarteter_zustandswechsel']);
  for (const feld of ['ursache','botReaktion','nutzerAktion','meldung']) assert.ok(wert.required.includes(feld));
});
