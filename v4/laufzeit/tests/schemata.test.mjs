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
  'dienst-profil.schema.json',
  'bedien-anfrage.schema.json',
  'nutzer-auftrag.schema.json',
  'spielzustand.schema.json',
  'spielzustand-aufzeichnung.schema.json'
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

test('Kritische BedienAnfragen brauchen einen vorgesehenen Bestaetigungstext', async () => {
  const inhalt = await readFile(new URL('../../schemata/bedien-anfrage.schema.json', import.meta.url), 'utf8');
  const schema = JSON.parse(inhalt);
  assert.deepEqual(schema.properties.risiko.enum, ['unkritisch', 'vorsicht', 'kritisch']);
  assert.deepEqual(schema.allOf[0].then.required, ['erforderlicherBestaetigungsText']);
});

test('Nutzerauftraege verlangen eindeutige Auftragsart, Menge und Mengenzielart', async () => {
  const inhalt = await readFile(new URL('../../schemata/nutzer-auftrag.schema.json', import.meta.url), 'utf8');
  const schema = JSON.parse(inhalt);
  assert.deepEqual(schema.properties.art.enum, ['sammeln', 'herstellen']);
  assert.deepEqual(schema.properties.mengenZielArt.enum, ['zusaetzlich', 'gesamtbestand']);
  assert.equal(schema.properties.zielMenge.minimum, 1);
});

test('Spielzustand unterscheidet bekannt, fehlend und unbekannt und ist fest versioniert', async () => {
  const inhalt = await readFile(new URL('../../schemata/spielzustand.schema.json', import.meta.url), 'utf8');
  const schema = JSON.parse(inhalt);
  assert.equal(schema.properties.schemaVersion.const, 2);
  assert.deepEqual(schema.$defs.bekannt.properties.quelle.enum, ['beobachtet', 'abgeleitet', 'gelernt']);
  assert.equal(schema.$defs.fehlend.properties.quelle.const, 'beobachtet');
  assert.equal(schema.$defs.unbekannt.properties.zustand.const, 'unbekannt');
});

test('Spielzustandsaufzeichnung ist fest versioniert und enthaelt Spielzustaende', async () => {
  const inhalt = await readFile(new URL('../../schemata/spielzustand-aufzeichnung.schema.json', import.meta.url), 'utf8');
  const schema = JSON.parse(inhalt);
  assert.equal(schema.properties.schemaVersion.const, 1);
  assert.equal(schema.properties.zustaende.items.$ref, 'https://aio-v4.invalid/schemata/spielzustand.schema.json');
});
